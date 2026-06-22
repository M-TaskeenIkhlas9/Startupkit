"""Company snapshot projection: fold the event stream into the live 'digital twin'.

Pure function of the events — no DB, trivially testable. This is the read model the founder
dashboard renders: identity, profile, founders, and the fill-state of the 10 Company Object domains.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from startupkit.core.company_object.events import EventEnvelope

Domain = Literal[
    "legal",
    "finance",
    "equity",
    "technical",
    "brand",
    "people",
    "gtm",
    "operations",
    "fundraising",
    "compliance",
]
DOMAINS: tuple[Domain, ...] = (
    "legal",
    "finance",
    "equity",
    "technical",
    "brand",
    "people",
    "gtm",
    "operations",
    "fundraising",
    "compliance",
)

FillStatus = Literal["empty", "partial", "complete"]


class FounderView(BaseModel):
    founder_id: str
    name: str
    email: str
    role: str
    equity_pct: float
    vesting: str


class DomainView(BaseModel):
    domain: Domain
    status: FillStatus = "empty"
    fields: dict[str, str] = Field(default_factory=dict)


class DocumentRecord(BaseModel):
    doc_id: str
    doc_type: str
    workflow_code: str
    phase_n: int
    version: int
    status: str
    body: str
    issues: list[str] = Field(default_factory=list)


class FounderProfile(BaseModel):
    """Who the founder is — the Input Layer's onboarding questionnaire result."""

    name: str = ""
    role: str = "Founder"
    background: str = ""
    goals: str = ""
    motivation: str = ""
    risk_tolerance: str = ""
    experience: str = ""
    time_commitment: str = ""
    completed: bool = False


class Milestone(BaseModel):
    milestone_id: str
    title: str
    category: str
    occurred_on: str
    note: str = ""


class Integration(BaseModel):
    integration_id: str
    provider: str
    capability: str
    status: str


class InputNote(BaseModel):
    note_id: str
    kind: str
    text: str
    created_at: str


class Evidence(BaseModel):
    evidence_id: str
    name: str
    kind: str
    ref: str = ""
    note: str = ""
    added_at: str = ""


class CompanySnapshot(BaseModel):
    company_id: str = ""
    name: str = ""
    owner_email: str = ""
    one_liner: str = ""
    industry: str = ""
    stage: str = ""
    jurisdiction: str = ""
    entity_type: str = ""
    formation_status: str = ""
    website: str | None = None
    team_size: int = 0
    target_round: str | None = None
    target_amount_usd: int | None = None
    ein: str | None = None
    problem: str = ""
    customer: str = ""
    solution: str = ""
    readiness_score: int = 0
    founders: list[FounderView] = Field(default_factory=list)
    domains: list[DomainView] = Field(default_factory=list)
    completed_phases: dict[str, list[int]] = Field(default_factory=dict)  # code -> [phase_n]
    documents: list[DocumentRecord] = Field(default_factory=list)
    # --- Founder Input Layer ---
    founder_profile: FounderProfile = Field(default_factory=FounderProfile)
    milestones: list[Milestone] = Field(default_factory=list)
    integrations: list[Integration] = Field(default_factory=list)
    notes: list[InputNote] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)
    intake_complete: bool = False
    version: int = 0  # = number of events folded; every edit bumps this (the 'versioned' twin)


def project_snapshot(events: list[EventEnvelope]) -> CompanySnapshot:
    snap = CompanySnapshot()
    fields: dict[Domain, dict[str, str]] = {d: {} for d in DOMAINS}

    for env in events:
        e = env.event
        snap.version = env.sequence + 1
        if e.type == "company.created":
            snap.company_id = e.company_id
            snap.name = e.name
            snap.owner_email = e.owner_email
        elif e.type == "idea.validated":
            snap.problem = e.problem
            snap.customer = e.customer
            snap.solution = e.solution
            snap.readiness_score = e.readiness_score
            fields["brand"].update(problem=e.problem, solution=e.solution)
            fields["gtm"]["customer"] = e.customer
        elif e.type == "company.profile.set":
            snap.one_liner = e.one_liner
            snap.industry = e.industry
            snap.stage = e.stage
            snap.jurisdiction = e.jurisdiction
            snap.entity_type = e.entity_type
            snap.formation_status = e.formation_status
            snap.website = e.website
            snap.team_size = e.team_size
            snap.target_round = e.target_round
            snap.target_amount_usd = e.target_amount_usd
            fields["legal"].update(
                jurisdiction=e.jurisdiction,
                entity_type=e.entity_type,
                formation_status=e.formation_status,
            )
            fields["finance"]["stage"] = e.stage
            fields["brand"].update(one_liner=e.one_liner, industry=e.industry)
            fields["people"]["team_size"] = str(e.team_size)
            if e.target_round:
                fields["fundraising"]["target_round"] = e.target_round
            if e.target_amount_usd is not None:
                fields["fundraising"]["target_amount_usd"] = str(e.target_amount_usd)
            if e.website:
                fields["technical"]["website"] = e.website
        elif e.type == "founder.added":
            snap.founders.append(
                FounderView(
                    founder_id=e.founder_id,
                    name=e.name,
                    email=e.email,
                    role=e.role,
                    equity_pct=e.equity_pct,
                    vesting=e.vesting,
                )
            )
            fields["equity"]["founders"] = str(len(snap.founders))
        elif e.type == "ein.issued":
            snap.ein = e.ein
            fields["legal"]["ein"] = e.ein
            fields["compliance"]["83b_window"] = "open"
        elif e.type == "workflow.phase.completed":
            phases = snap.completed_phases.setdefault(e.workflow_code, [])
            if e.phase_n not in phases:
                phases.append(e.phase_n)
        elif e.type == "document.generated":
            snap.documents.append(
                DocumentRecord(
                    doc_id=e.doc_id,
                    doc_type=e.doc_type,
                    workflow_code=e.workflow_code,
                    phase_n=e.phase_n,
                    version=e.version,
                    status=e.status,
                    body=e.body,
                    issues=e.issues,
                )
            )
        elif e.type == "founder.profile.set":
            snap.founder_profile = FounderProfile(
                name=e.name,
                role=e.role,
                background=e.background,
                goals=e.goals,
                motivation=e.motivation,
                risk_tolerance=e.risk_tolerance,
                experience=e.experience,
                time_commitment=e.time_commitment,
                completed=bool(e.background or e.goals or e.motivation),
            )
            fields["people"]["founder"] = e.name
        elif e.type == "milestone.logged":
            snap.milestones.append(
                Milestone(
                    milestone_id=e.milestone_id,
                    title=e.title,
                    category=e.category,
                    occurred_on=e.occurred_on,
                    note=e.note,
                )
            )
        elif e.type == "integration.connected":
            snap.integrations.append(
                Integration(
                    integration_id=e.integration_id,
                    provider=e.provider,
                    capability=e.capability,
                    status=e.status,
                )
            )
        elif e.type == "note.recorded":
            snap.notes.append(
                InputNote(note_id=e.note_id, kind=e.kind, text=e.text, created_at=env.occurred_at)
            )
        elif e.type == "evidence.added":
            snap.evidence.append(
                Evidence(
                    evidence_id=e.evidence_id,
                    name=e.name,
                    kind=e.kind,
                    ref=e.ref,
                    note=e.note,
                    added_at=env.occurred_at,
                )
            )
        elif e.type == "intake.completed":
            snap.intake_complete = True

    snap.domains = [
        DomainView(domain=d, status=_status_of(fields[d]), fields=fields[d]) for d in DOMAINS
    ]
    return snap


def _status_of(fields: dict[str, str]) -> FillStatus:
    if not fields:
        return "empty"
    return "complete" if len(fields) >= 2 else "partial"
