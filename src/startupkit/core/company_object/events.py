"""Event-sourced Company Object. State is never overwritten — only events are appended.

Projections (see ./projections) derive the company snapshot, cap table, Health Score, and triggers.
Phase 1 (Foundation) intake produces the `company.created` + `company.profile.set` + `founder.added`
events; later workflows (W1+) append `entity.formed`, `ein.issued`, `stock.issued`, ...
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from startupkit.domain import EntityType

# --- Phase 1: Foundation (intake) ---------------------------------------------------------------

Stage = Literal[
    "pre-founder",
    "discovery",
    "problem-solution-fit",
    "mvp-build",
    "first-revenue",
    "pmf",
    "pre-seed",
    "series-a",
]
Jurisdiction = Literal["US", "PK"]
FormationStatus = Literal["idea", "forming", "formed"]


class CompanyObjectCreated(BaseModel):
    """Identity of the company. First event in every tenant's stream."""

    type: Literal["company.created"] = "company.created"
    company_id: str  # CO-YYYYMMDD-XXXX
    name: str
    owner_email: str


class IdeaValidated(BaseModel):
    """The founder's idea-validation result — the 'Business DNA' captured before formation."""

    type: Literal["idea.validated"] = "idea.validated"
    problem: str
    customer: str
    solution: str
    detected_stage: str
    readiness_score: int
    cofounder_verdict: str = ""  # strong-go | promising | needs-work | pivot


class CompanyProfileSet(BaseModel):
    """The editable company profile. Re-emitted on every edit — the 'live/versioned' twin."""

    type: Literal["company.profile.set"] = "company.profile.set"
    one_liner: str
    industry: str
    stage: Stage
    jurisdiction: Jurisdiction
    entity_type: EntityType
    formation_status: FormationStatus
    website: str | None = None
    team_size: int = 1
    target_round: str | None = None  # e.g. "pre-seed", "seed"
    target_amount_usd: int | None = None


class FounderAdded(BaseModel):
    type: Literal["founder.added"] = "founder.added"
    founder_id: str
    name: str
    email: str
    role: str
    equity_pct: float
    vesting: str = "4yr/1yr-cliff"


RiskTolerance = Literal["conservative", "balanced", "aggressive"]
FounderExperience = Literal["first-time", "some-experience", "serial"]
Commitment = Literal["exploring", "part-time", "full-time"]


class FounderProfileSet(BaseModel):
    """The founder onboarding questionnaire — who the founder is (Brain: Founder Input Layer)."""

    type: Literal["founder.profile.set"] = "founder.profile.set"
    name: str
    role: str = "Founder"
    background: str = ""
    goals: str = ""
    motivation: str = ""
    risk_tolerance: RiskTolerance = "balanced"
    experience: FounderExperience = "first-time"
    time_commitment: Commitment = "full-time"


class MilestoneLogged(BaseModel):
    """A milestone / achievement the founder records (Input Layer: Milestones & Progress)."""

    type: Literal["milestone.logged"] = "milestone.logged"
    milestone_id: str
    title: str
    category: str  # product | customer | funding | team | legal | other
    occurred_on: str  # ISO date
    note: str = ""


class IntegrationConnected(BaseModel):
    """A connected external tool (Input Layer: Integrations Data)."""

    type: Literal["integration.connected"] = "integration.connected"
    integration_id: str
    provider: str  # Mercury, GitHub, QuickBooks, Carta, Stripe...
    capability: str  # banking | code | accounting | captable | payments
    status: str = "connected"


class NoteRecorded(BaseModel):
    """A question, note, decision, or conversation (Input Layer: Questions & Conversations)."""

    type: Literal["note.recorded"] = "note.recorded"
    note_id: str
    kind: str  # question | note | decision | conversation
    text: str


class EvidenceAdded(BaseModel):
    """Founder-provided evidence: pitch, agreement, report (Input Layer: Documents & Evidence)."""

    type: Literal["evidence.added"] = "evidence.added"
    evidence_id: str
    name: str
    kind: str  # pitch | agreement | report | research | other
    ref: str = ""  # url or filename
    note: str = ""


class FactsRecorded(BaseModel):
    """Facts the founder told the AI Co-Founder — saved so no later step re-asks them."""

    type: Literal["facts.recorded"] = "facts.recorded"
    facts: dict[str, str]


class AssessmentSaved(BaseModel):
    """Answers to an early-journey assessment phase (Pre-Founder ... First Revenue)."""

    type: Literal["assessment.saved"] = "assessment.saved"
    phase: int  # 1..5
    answers: dict[str, str]  # question id -> answer


class IntakeCompleted(BaseModel):
    type: Literal["intake.completed"] = "intake.completed"


class WorkflowPhaseCompleted(BaseModel):
    """A workflow phase finished — whether StartupKit/a provider did it, or the founder did."""

    type: Literal["workflow.phase.completed"] = "workflow.phase.completed"
    workflow_code: str  # "W1".."W8"
    phase_n: int


class DocumentGenerated(BaseModel):
    """A document draft produced by the Document Engine (grounded + validated, pending review)."""

    type: Literal["document.generated"] = "document.generated"
    doc_id: str
    workflow_code: str
    phase_n: int
    doc_type: str
    version: int
    status: str  # "pending-review" | "draft"
    body: str
    issues: list[str] = []


class DocumentSubmitted(BaseModel):
    """The founder completed a document — by filling the template fields, or uploading their own."""

    type: Literal["document.submitted"] = "document.submitted"
    doc_key: str  # stable per (workflow, document) — e.g. "W1-certificate-of-incorporation"
    workflow_code: str
    phase_n: int
    doc_name: str
    method: str  # "filled" | "uploaded"
    fields: dict[str, str] = {}
    filename: str = ""


# --- W1+ : Formation and beyond (already present in the spine) -----------------------------------


class CompanyNamed(BaseModel):
    type: Literal["company.named"] = "company.named"
    name: str


class EntityFormed(BaseModel):
    type: Literal["entity.formed"] = "entity.formed"
    jurisdiction: str
    entity_type: EntityType
    certificate_ref: str


class EinIssued(BaseModel):
    type: Literal["ein.issued"] = "ein.issued"
    ein: str


class StockIssued(BaseModel):
    type: Literal["stock.issued"] = "stock.issued"
    founder_id: str
    shares: int
    issued_at: str


CompanyEvent = (
    CompanyObjectCreated
    | IdeaValidated
    | CompanyProfileSet
    | FounderAdded
    | FounderProfileSet
    | MilestoneLogged
    | IntegrationConnected
    | NoteRecorded
    | EvidenceAdded
    | FactsRecorded
    | AssessmentSaved
    | IntakeCompleted
    | WorkflowPhaseCompleted
    | DocumentGenerated
    | DocumentSubmitted
    | CompanyNamed
    | EntityFormed
    | EinIssued
    | StockIssued
)


class EventEnvelope(BaseModel):
    id: str
    tenant_id: str
    sequence: int  # monotonic per tenant — ordering + optimistic concurrency
    occurred_at: str
    event: CompanyEvent = Field(discriminator="type")
