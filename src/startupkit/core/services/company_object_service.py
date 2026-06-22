"""CompanyObjectService — the Phase 1 application service.

Turns an intake into events, persists them through the EventStore, and serves the read models
(snapshot, Health Score, next-best-action) the founder app renders. Depends on the EventStore
Protocol, not a concrete store, so the in-memory store today and Postgres later are interchangeable.
"""

from __future__ import annotations

import random
import string
from datetime import UTC, datetime

from pydantic import BaseModel

from startupkit.core.company_object.events import (
    CompanyEvent,
    CompanyObjectCreated,
    CompanyProfileSet,
    DocumentGenerated,
    EinIssued,
    EvidenceAdded,
    FounderAdded,
    FounderProfileSet,
    IdeaValidated,
    IntakeCompleted,
    IntegrationConnected,
    MilestoneLogged,
    NoteRecorded,
    WorkflowPhaseCompleted,
)
from startupkit.core.company_object.projections.health_score import (
    HealthScore,
    project_health_score,
)
from startupkit.core.company_object.projections.snapshot import CompanySnapshot, project_snapshot
from startupkit.core.company_object.store import EventStore
from startupkit.core.services.intake import IntakeRequest


class NextAction(BaseModel):
    title: str
    why: str
    workflow: str  # e.g. "W1", "W3"
    priority: int  # 1 = highest


class CompanyObjectService:
    def __init__(self, store: EventStore) -> None:
        self._store = store

    async def create_from_intake(self, req: IntakeRequest) -> str:
        company_id = _new_company_id()
        events: list[CompanyEvent] = [
            CompanyObjectCreated(
                company_id=company_id, name=req.company_name, owner_email=req.owner_email
            ),
        ]
        if req.problem and req.customer and req.solution:
            events.append(
                IdeaValidated(
                    problem=req.problem,
                    customer=req.customer,
                    solution=req.solution,
                    detected_stage=req.stage,
                    readiness_score=req.readiness_score or 0,
                )
            )
        events.append(
            CompanyProfileSet(
                one_liner=req.one_liner,
                industry=req.industry,
                stage=req.stage,
                jurisdiction=req.jurisdiction,
                entity_type=req.entity_type,
                formation_status=req.formation_status,
                website=req.website,
                team_size=max(len(req.founders), 1),
                target_round=req.target_round,
                target_amount_usd=req.target_amount_usd,
            )
        )
        for f in req.founders:
            events.append(
                FounderAdded(
                    founder_id=_new_founder_id(),
                    name=f.name,
                    email=f.email,
                    role=f.role,
                    equity_pct=f.equity_pct,
                    vesting=f.vesting,
                )
            )
        if req.ein:
            events.append(EinIssued(ein=req.ein))

        # Founder Input Layer — capture who the founder is.
        founder_name = req.founder_name or (req.founders[0].name if req.founders else "Founder")
        events.append(
            FounderProfileSet(
                name=founder_name,
                role=req.founders[0].role if req.founders else "Founder",
                background=req.founder_background or "",
                goals=req.founder_goals or "",
                motivation=req.founder_motivation or "",
                risk_tolerance=req.risk_tolerance or "balanced",
                experience=req.founder_experience or "first-time",
                time_commitment=req.time_commitment or "full-time",
            )
        )

        # Seed W1 (Formation) progress from what the founder told us at intake, so an
        # already-incorporated company doesn't start W1 at 0%.
        if req.formation_status in ("forming", "formed"):
            events += [WorkflowPhaseCompleted(workflow_code="W1", phase_n=n) for n in (1, 2)]
        if req.formation_status == "formed":
            events += [WorkflowPhaseCompleted(workflow_code="W1", phase_n=n) for n in (3, 4)]
        if req.ein:
            events.append(WorkflowPhaseCompleted(workflow_code="W1", phase_n=5))

        events.append(IntakeCompleted())

        # tenant_id == company_id in Phase 1 (one company per tenant).
        await self._store.append(company_id, events, expected_sequence=0)
        return company_id

    async def complete_phase(self, company_id: str, workflow_code: str, phase_n: int) -> None:
        """Record that a workflow phase is done — append-only, idempotent (snapshot dedups)."""
        existing = await self._store.load(company_id)
        await self._store.append(
            company_id,
            [WorkflowPhaseCompleted(workflow_code=workflow_code, phase_n=phase_n)],
            expected_sequence=len(existing),
        )

    async def store_documents(self, company_id: str, docs: list[DocumentGenerated]) -> None:
        """Append generated-document events to the Company Object (versioned + auditable)."""
        if not docs:
            return
        existing = await self._store.load(company_id)
        events: list[CompanyEvent] = list(docs)
        await self._store.append(company_id, events, expected_sequence=len(existing))

    async def _append(self, company_id: str, event: CompanyEvent) -> None:
        existing = await self._store.load(company_id)
        await self._store.append(company_id, [event], expected_sequence=len(existing))

    # --- Founder Input Layer ---------------------------------------------------------------

    async def set_founder_profile(self, company_id: str, profile: FounderProfileSet) -> None:
        await self._append(company_id, profile)

    async def log_milestone(
        self, company_id: str, title: str, category: str, occurred_on: str, note: str = ""
    ) -> None:
        await self._append(
            company_id,
            MilestoneLogged(
                milestone_id=_new_id("MS"),
                title=title,
                category=category,
                occurred_on=occurred_on,
                note=note,
            ),
        )

    async def connect_integration(self, company_id: str, provider: str, capability: str) -> None:
        await self._append(
            company_id,
            IntegrationConnected(
                integration_id=_new_id("IN"), provider=provider, capability=capability
            ),
        )

    async def record_note(self, company_id: str, kind: str, text: str) -> None:
        await self._append(company_id, NoteRecorded(note_id=_new_id("NT"), kind=kind, text=text))

    async def add_evidence(
        self, company_id: str, name: str, kind: str, ref: str = "", note: str = ""
    ) -> None:
        await self._append(
            company_id,
            EvidenceAdded(evidence_id=_new_id("EV"), name=name, kind=kind, ref=ref, note=note),
        )

    async def snapshot(self, company_id: str) -> CompanySnapshot:
        return project_snapshot(await self._store.load(company_id))

    async def health(self, company_id: str) -> HealthScore:
        return project_health_score(await self.snapshot(company_id))

    async def next_actions(self, company_id: str) -> list[NextAction]:
        return next_actions_for(await self.snapshot(company_id))


def next_actions_for(snap: CompanySnapshot) -> list[NextAction]:
    """Deterministic Phase 1 recommendation engine (the seed of the AI Brain's decision layer).

    Pure dependency logic: surface the next gated step in the right order. Later phases replace the
    heuristics with the real Dependency Graph + RAG-grounded AI Co-Founder.
    """
    actions: list[NextAction] = []
    if snap.formation_status != "formed":
        actions.append(
            NextAction(
                title="Form your entity (W1 — Business Formation)",
                why="Formation gates everything: banking, IP assignment, hiring, and fundraising.",
                workflow="W1",
                priority=1,
            )
        )
    elif snap.ein is None:
        actions.append(
            NextAction(
                title="Apply for your EIN",
                why="An EIN unlocks business banking and payroll — the next step after formation.",
                workflow="W1",
                priority=1,
            )
        )
    else:
        actions.append(
            NextAction(
                title="Open business banking (W3 — Financial Infrastructure)",
                why="Your EIN is issued — you can now open a Mercury account and track runway.",
                workflow="W3",
                priority=1,
            )
        )

    if len(snap.founders) > 1 and abs(sum(f.equity_pct for f in snap.founders) - 100.0) > 0.01:
        actions.append(
            NextAction(
                title="Finalize the founder equity split",
                why="Founder equity must total 100% before stock is issued and 83(b) clocks start.",
                workflow="W1",
                priority=2,
            )
        )
    if len(snap.founders) > 1:
        actions.append(
            NextAction(
                title="Sign PIIA / IP-assignment agreements (W2 — IP & Legal)",
                why="Unassigned IP is the #1 diligence blocker. Assign all founder IP now.",
                workflow="W2",
                priority=3,
            )
        )
    return actions


def _new_company_id() -> str:
    date = datetime.now(UTC).strftime("%Y%m%d")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"CO-{date}-{suffix}"


def _new_founder_id() -> str:
    return "FD-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def _new_id(prefix: str) -> str:
    return prefix + "-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
