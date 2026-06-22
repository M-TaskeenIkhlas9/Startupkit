"""Phase 1 (Foundation) intake: the form a founder fills to mint their Company Object.

The intake is translated into a sequence of Company Object events (company.created ->
company.profile.set -> founder.added* -> [ein.issued] -> intake.completed). Keeping intake as
*events* (not a row write) is what makes the Company Object versioned and auditable from day one.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from startupkit.core.company_object.events import (
    Commitment,
    FormationStatus,
    FounderExperience,
    Jurisdiction,
    RiskTolerance,
    Stage,
)
from startupkit.domain import EntityType


class FounderIntake(BaseModel):
    name: str
    email: str
    role: str = "Founder"
    equity_pct: float = 0.0
    vesting: str = "4yr/1yr-cliff"


class IntakeRequest(BaseModel):
    company_name: str
    owner_email: str
    one_liner: str
    industry: str
    stage: Stage
    jurisdiction: Jurisdiction
    entity_type: EntityType = "c-corp"
    formation_status: FormationStatus = "idea"
    website: str | None = None
    ein: str | None = None
    target_round: str | None = None
    target_amount_usd: int | None = None
    founders: list[FounderIntake] = Field(default_factory=list)
    # Carried from the idea-validation step (the first thing a founder does).
    problem: str | None = None
    customer: str | None = None
    solution: str | None = None
    readiness_score: int | None = None
    # Founder Input Layer — who the founder is (the "About you" onboarding step).
    founder_name: str | None = None
    founder_background: str | None = None
    founder_goals: str | None = None
    founder_motivation: str | None = None
    risk_tolerance: RiskTolerance | None = None
    founder_experience: FounderExperience | None = None
    time_commitment: Commitment | None = None
