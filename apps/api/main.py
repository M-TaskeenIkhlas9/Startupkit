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

import base64
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from startupkit.adapters.model_template import TemplateModelAdapter
from startupkit.core.company_object.events import (
    DocumentGenerated,
    DocumentSubmitted,
    FounderProfileSet,
)
from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.company_object.projections.health_score import HealthScore
from startupkit.core.company_object.projections.snapshot import CompanySnapshot, DocumentRecord
from startupkit.core.services.advisor import SUGGESTED_QUESTIONS, Answer, ask
from startupkit.core.services.case_studies import CaseStudy, relevant_case_studies
from startupkit.core.services.cofounder_chat import IdeaChatRequest, IdeaChatResponse, idea_chat
from startupkit.core.services.company_object_service import CompanyObjectService, NextAction
from startupkit.core.services.compliance import ComplianceItem, compliance_calendar
from startupkit.core.services.document_engine import DocumentEngine, GeneratedDocument
from startupkit.core.services.guardrails import GuardrailAction, GuardrailResult, check
from startupkit.core.services.idea_reasoning import IdeaReasoning, reason_about_idea
from startupkit.core.services.idea_validation import (
    IdeaAssessment,
    IdeaValidationAnswers,
    assess_idea,
)
from startupkit.core.services.intake import IntakeRequest
from startupkit.core.services.journey import Journey, journey_graph
from startupkit.core.services.recommendations import Recommendation, recommendations_for
from startupkit.core.services.risks import CompanyRisk, company_risks
from startupkit.ports.model import ModelPort
from startupkit.ports.search import SearchPort
from startupkit.workflows.catalog import (
    CATALOG,
    WorkflowDef,
    WorkflowView,
    doc_key,
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

def _load_dotenv() -> None:
    """Minimal .env loader (no dependency): set keys from a gitignored .env if present."""
    for parent in (Path.cwd(), *Path(__file__).resolve().parents):
        env = parent / ".env"
        if env.is_file():
            for line in env.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            return


_load_dotenv()
_store = InMemoryEventStore()
_service = CompanyObjectService(_store)


def _build_model() -> ModelPort:
    """Pick the LLM: Anthropic (Claude) > Groq (free Llama) > offline template engine."""
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key:
        from startupkit.adapters.model_anthropic.adapter import AnthropicModelAdapter

        return AnthropicModelAdapter(anthropic_key)

    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        from startupkit.adapters.model_groq.adapter import GroqModelAdapter

        return GroqModelAdapter(groq_key, os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"))

    return TemplateModelAdapter()


def _build_search() -> SearchPort:
    """Pick web research: Tavily (best, needs key) > DuckDuckGo (free) > none (offline).

    Set SEARCH_PROVIDER=none to disable live research entirely.
    """
    if os.environ.get("SEARCH_PROVIDER", "").lower() == "none":
        from startupkit.adapters.search_none import NoSearchAdapter

        return NoSearchAdapter()

    tavily_key = os.environ.get("TAVILY_API_KEY")
    if tavily_key:
        from startupkit.adapters.search_tavily import TavilySearchAdapter

        return TavilySearchAdapter(tavily_key)

    from startupkit.adapters.search_duckduckgo import DuckDuckGoSearchAdapter

    return DuckDuckGoSearchAdapter()


_model = _build_model()
_search = _build_search()
_engine = DocumentEngine(_model)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


class ValidationResult(BaseModel):
    assessment: IdeaAssessment
    reasoning: IdeaReasoning


@app.post("/api/validate-idea")
async def validate_idea(answers: IdeaValidationAnswers) -> ValidationResult:
    """Step 1 — the AI Co-Founder's verdict: assess the idea + reason about whether to build it."""
    assessment = assess_idea(answers)
    reasoning = await reason_about_idea(answers, assessment, _model)
    return ValidationResult(assessment=assessment, reasoning=reasoning)


@app.post("/api/idea-chat")
async def idea_chat_endpoint(req: IdeaChatRequest) -> IdeaChatResponse:
    """Conversational idea refinement — chat with the AI Co-Founder; it captures facts as you go."""
    return await idea_chat(req, _model, _search)


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


@app.get("/api/companies/{company_id}/journey")
async def get_journey(company_id: str) -> Journey:
    """The founder journey graph — where you are and the next step, matched to winning moves."""
    snap = await _snapshot_or_404(company_id)
    return journey_graph(snap, await _workflow_status(company_id))


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


class AssessmentInput(BaseModel):
    phase: int
    answers: dict[str, str]


@app.post("/api/companies/{company_id}/assessment")
async def save_assessment(company_id: str, a: AssessmentInput) -> CompanySnapshot:
    """Save answers to an early-journey assessment phase (Pre-Founder ... First Revenue)."""
    await _snapshot_or_404(company_id)
    await _service.save_assessment(company_id, a.phase, a.answers)
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

    wf = get_workflow(code.upper(), snap.entity_type)
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
    wf = get_workflow(code.upper(), snap.entity_type)
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


# --- Founder-completed documents: fill the template, or upload a copy ----------------------------

_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "var" / "uploads"


class FillRequest(BaseModel):
    workflow_code: str
    phase_n: int
    doc_name: str
    fields: dict[str, str] = {}


class UploadRequest(BaseModel):
    workflow_code: str
    phase_n: int
    doc_name: str
    filename: str
    content_base64: str = ""  # optional raw bytes so we actually keep the uploaded file


class SubmitResult(BaseModel):
    workflow: WorkflowView
    submitted: list[str]  # doc_keys completed in this phase so far


async def _record_submission(
    company_id: str,
    code: str,
    phase_n: int,
    doc_name: str,
    method: str,
    fields: dict[str, str],
    filename: str,
) -> SubmitResult:
    """Record a filled/uploaded document, then complete the phase once all required docs are in."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    wf = get_workflow(code.upper(), snap.entity_type)
    if wf is None:
        raise HTTPException(status_code=404, detail="workflow not found")
    phase = next((p for p in wf.phases if p.n == phase_n), None)
    if phase is None:
        raise HTTPException(status_code=400, detail="no such phase in this workflow")
    if doc_name not in {d.name for d in phase.documents}:
        raise HTTPException(status_code=400, detail="no such document in this phase")
    current = {v.definition.code: v for v in status_for(snap)}
    if current[wf.code].status == "locked":
        raise HTTPException(status_code=409, detail=current[wf.code].blocked_reason)

    await _service.submit_document(
        company_id,
        DocumentSubmitted(
            doc_key=doc_key(wf.code, doc_name),
            workflow_code=wf.code,
            phase_n=phase_n,
            doc_name=doc_name,
            method=method,
            fields=fields,
            filename=filename,
        ),
    )

    # Auto-complete the phase once every REQUIRED document in it has been filled or uploaded.
    snap = await _service.snapshot(company_id)
    required = [d for d in phase.documents if d.required]
    all_done = bool(required) and all(
        doc_key(wf.code, d.name) in snap.submitted_documents for d in required
    )
    if all_done and phase_n not in snap.completed_phases.get(wf.code, []):
        await _service.complete_phase(company_id, wf.code, phase_n)
        snap = await _service.snapshot(company_id)

    submitted = [
        s.doc_key
        for s in snap.submitted_documents.values()
        if s.workflow_code == wf.code and s.phase_n == phase_n
    ]
    updated = {v.definition.code: v for v in status_for(snap)}
    return SubmitResult(workflow=updated[wf.code], submitted=submitted)


@app.post("/api/companies/{company_id}/documents/fill")
async def fill_document(company_id: str, req: FillRequest) -> SubmitResult:
    """Founder filled a template's fields → mark the document complete."""
    return await _record_submission(
        company_id, req.workflow_code, req.phase_n, req.doc_name, "filled", req.fields, ""
    )


@app.post("/api/companies/{company_id}/documents/upload")
async def upload_document(company_id: str, req: UploadRequest) -> SubmitResult:
    """Founder uploaded their own copy → store it and mark the document complete."""
    safe = (req.filename or "upload").replace("/", "_").replace("..", "_")
    if req.content_base64:
        dest_dir = _UPLOAD_DIR / company_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        try:
            payload = req.content_base64.split(",", 1)[-1]  # tolerate data: URL prefix
            (dest_dir / f"{doc_key(req.workflow_code.upper(), req.doc_name)}__{safe}").write_bytes(
                base64.b64decode(payload)
            )
        except (ValueError, OSError):
            pass  # storing the bytes is best-effort; the submission still counts
    return await _record_submission(
        company_id, req.workflow_code, req.phase_n, req.doc_name, "uploaded", {}, safe
    )
