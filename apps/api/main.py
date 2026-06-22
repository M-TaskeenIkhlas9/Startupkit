"""FastAPI entrypoint — Phase 1 (Foundation) surface.

Endpoints back the founder app's intake wizard and dashboard:
  POST /api/companies              -> mint a Company Object from intake
  GET  /api/companies/{id}         -> the live snapshot (10-domain digital twin)
  GET  /api/companies/{id}/health  -> 0-100 Health Score across 8 weighted dimensions
  GET  /api/companies/{id}/next    -> ranked next-best-actions (Phase 1 dependency heuristics)

Storage is the in-memory event store today (local-only, zero infra). Swapping to the Postgres
event store is a one-line wiring change — the service depends on the EventStore Protocol.
Run: `uv run uvicorn apps.api.main:app --reload`
"""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from startupkit.adapters.model_template import TemplateModelAdapter
from startupkit.core.company_object.events import DocumentGenerated, FounderProfileSet
from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.company_object.projections.health_score import HealthScore
from startupkit.core.company_object.projections.snapshot import CompanySnapshot, DocumentRecord
from startupkit.core.services.advisor import SUGGESTED_QUESTIONS, Answer, ask
from startupkit.core.services.case_studies import CaseStudy, relevant_case_studies
from startupkit.core.services.company_object_service import CompanyObjectService, NextAction
from startupkit.core.services.compliance import ComplianceItem, compliance_calendar
from startupkit.core.services.document_engine import DocumentEngine, GeneratedDocument
from startupkit.core.services.guardrails import GuardrailAction, GuardrailResult, check
from startupkit.core.services.idea_validation import (
    IdeaAssessment,
    IdeaValidationAnswers,
    assess_idea,
)
from startupkit.core.services.intake import IntakeRequest
from startupkit.core.services.recommendations import Recommendation, recommendations_for
from startupkit.core.services.risks import CompanyRisk, company_risks
from startupkit.ports.model import ModelPort
from startupkit.workflows.catalog import (
    CATALOG,
    WorkflowDef,
    WorkflowView,
    get_workflow,
    status_for,
)

app = FastAPI(title="StartupKit API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_store = InMemoryEventStore()
_service = CompanyObjectService(_store)


def _build_model() -> ModelPort:
    """Claude (Opus 4.8) when a key is configured; the offline template engine otherwise."""
    key = os.environ.get("ANTHROPIC_API_KEY")
    if key:
        from startupkit.adapters.model_anthropic.adapter import AnthropicModelAdapter

        return AnthropicModelAdapter(key)
    return TemplateModelAdapter()


_engine = DocumentEngine(_build_model())


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/validate-idea")
async def validate_idea(answers: IdeaValidationAnswers) -> IdeaAssessment:
    """Step 0 — assess the idea: detect stage, score readiness, flag risks, recommend next step."""
    return assess_idea(answers)


@app.post("/api/companies")
async def create_company(req: IntakeRequest) -> dict[str, str]:
    company_id = await _service.create_from_intake(req)
    return {"company_id": company_id}


@app.get("/api/companies/{company_id}")
async def get_company(company_id: str) -> CompanySnapshot:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return snap


@app.get("/api/companies/{company_id}/health")
async def get_health(company_id: str) -> HealthScore:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return await _service.health(company_id)


@app.get("/api/companies/{company_id}/next")
async def get_next(company_id: str) -> list[NextAction]:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return await _service.next_actions(company_id)


@app.get("/api/companies/{company_id}/compliance")
async def get_compliance(company_id: str) -> list[ComplianceItem]:
    """The per-company compliance calendar — what's due, when, and what's overdue."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return compliance_calendar(snap)


async def _snapshot_or_404(company_id: str) -> CompanySnapshot:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return snap


async def _workflow_status(company_id: str) -> dict[str, str]:
    snap = await _service.snapshot(company_id)
    return {v.definition.code: v.status for v in status_for(snap)}


@app.get("/api/companies/{company_id}/risks")
async def get_risks(company_id: str) -> list[CompanyRisk]:
    """The consolidated risk register across the whole Company Object."""
    snap = await _snapshot_or_404(company_id)
    return company_risks(snap, await _workflow_status(company_id))


@app.get("/api/companies/{company_id}/recommendations")
async def get_recommendations(company_id: str) -> list[Recommendation]:
    """Rich, prioritized recommendations: why, reasoning, steps, deadline, expected outcome."""
    snap = await _snapshot_or_404(company_id)
    return recommendations_for(snap, await _workflow_status(company_id))


@app.get("/api/companies/{company_id}/case-studies")
async def get_case_studies(company_id: str) -> list[CaseStudy]:
    """Relevant founder case studies — failures to avoid and successes to emulate."""
    snap = await _snapshot_or_404(company_id)
    return relevant_case_studies(snap, await _workflow_status(company_id))


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: Answer
    suggested: list[str]


@app.post("/api/companies/{company_id}/ask")
async def ask_cofounder(company_id: str, req: AskRequest) -> AskResponse:
    """AI Co-Founder — a grounded answer to the founder's question."""
    snap = await _snapshot_or_404(company_id)
    answer = ask(req.question, snap, await _workflow_status(company_id))
    return AskResponse(answer=answer, suggested=SUGGESTED_QUESTIONS)


@app.post("/api/companies/{company_id}/guardrail/{action}")
async def check_guardrail(company_id: str, action: GuardrailAction) -> GuardrailResult:
    """Real-time guardrail: can the founder safely take this action yet?"""
    snap = await _snapshot_or_404(company_id)
    return check(action, snap, await _workflow_status(company_id))


# --- Founder Input Layer -----------------------------------------------------------------------


@app.post("/api/companies/{company_id}/founder-profile")
async def set_founder_profile(company_id: str, profile: FounderProfileSet) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.set_founder_profile(company_id, profile)
    return await _service.snapshot(company_id)


class MilestoneInput(BaseModel):
    title: str
    category: str = "other"
    occurred_on: str
    note: str = ""


@app.post("/api/companies/{company_id}/milestones")
async def add_milestone(company_id: str, m: MilestoneInput) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.log_milestone(company_id, m.title, m.category, m.occurred_on, m.note)
    return await _service.snapshot(company_id)


class IntegrationInput(BaseModel):
    provider: str
    capability: str


@app.post("/api/companies/{company_id}/integrations")
async def connect_integration(company_id: str, i: IntegrationInput) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.connect_integration(company_id, i.provider, i.capability)
    return await _service.snapshot(company_id)


class NoteInput(BaseModel):
    kind: str = "note"
    text: str


@app.post("/api/companies/{company_id}/notes")
async def add_note(company_id: str, n: NoteInput) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.record_note(company_id, n.kind, n.text)
    return await _service.snapshot(company_id)


class EvidenceInput(BaseModel):
    name: str
    kind: str = "other"
    ref: str = ""
    note: str = ""


@app.post("/api/companies/{company_id}/evidence")
async def add_evidence(company_id: str, ev: EvidenceInput) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.add_evidence(company_id, ev.name, ev.kind, ev.ref, ev.note)
    return await _service.snapshot(company_id)


@app.get("/api/workflows")
async def list_workflows() -> list[WorkflowDef]:
    """The static W1-W8 catalog (no company context)."""
    return CATALOG


@app.get("/api/workflows/{code}")
async def get_workflow_def(code: str) -> WorkflowDef:
    wf = get_workflow(code.upper())
    if wf is None:
        raise HTTPException(status_code=404, detail="workflow not found")
    return wf


@app.get("/api/companies/{company_id}/workflows")
async def company_workflows(company_id: str) -> list[WorkflowView]:
    """The W1-W8 catalog with live status (locked / available / in-progress / complete)."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return status_for(snap)


@app.post("/api/companies/{company_id}/workflows/{code}/phases/{phase_n}/complete")
async def complete_phase(company_id: str, code: str, phase_n: int) -> WorkflowView:
    """Mark a workflow phase done (StartupKit did it, or the founder confirms they did)."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")

    wf = get_workflow(code.upper())
    if wf is None:
        raise HTTPException(status_code=404, detail="workflow not found")
    if not any(p.n == phase_n for p in wf.phases):
        raise HTTPException(status_code=400, detail="no such phase in this workflow")

    # gate: can't act on a workflow whose dependencies aren't complete
    current = {v.definition.code: v for v in status_for(snap)}
    if current[wf.code].status == "locked":
        raise HTTPException(status_code=409, detail=current[wf.code].blocked_reason)

    await _service.complete_phase(company_id, wf.code, phase_n)
    updated = {v.definition.code: v for v in status_for(await _service.snapshot(company_id))}
    return updated[wf.code]


class GenerateResult(BaseModel):
    documents: list[GeneratedDocument]
    workflow: WorkflowView


@app.post("/api/companies/{company_id}/workflows/{code}/phases/{phase_n}/generate")
async def generate_phase(company_id: str, code: str, phase_n: int) -> GenerateResult:
    """The ⚡ 'do it for me' action: generate the phase docs, store them, complete the phase."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    wf = get_workflow(code.upper())
    if wf is None:
        raise HTTPException(status_code=404, detail="workflow not found")
    phase = next((p for p in wf.phases if p.n == phase_n), None)
    if phase is None:
        raise HTTPException(status_code=400, detail="no such phase in this workflow")

    current = {v.definition.code: v for v in status_for(snap)}
    if current[wf.code].status == "locked":
        raise HTTPException(status_code=409, detail=current[wf.code].blocked_reason)

    doc_types = [d.name for d in phase.documents if d.required]
    generated = await _engine.generate(snap, wf.code, phase_n, doc_types)
    await _service.store_documents(
        company_id, [DocumentGenerated(**g.model_dump()) for g in generated]
    )
    await _service.complete_phase(company_id, wf.code, phase_n)

    updated = {v.definition.code: v for v in status_for(await _service.snapshot(company_id))}
    return GenerateResult(documents=generated, workflow=updated[wf.code])


@app.get("/api/companies/{company_id}/documents")
async def list_documents(company_id: str) -> list[DocumentRecord]:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return snap.documents
