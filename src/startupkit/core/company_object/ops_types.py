"""Persisted operations types — the "Operating System" state W8 produces.

Mirrors the W5/W7 contract exactly: stored via the `ops.state.set` event and replaced wholesale
(last-write-wins). Derivation (cadences, SOP drafts, risk detection, quarter goals...) stays a
pure, deterministic read of the Company Object on the frontend — only the *result* the founder
has edited or confirmed is persisted here. Nothing here is invented: costs, renewals, and
adoption are founder-entered; risks and vendors are derived with evidence from real state.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class Cadence(BaseModel):
    name: str = ""
    freq: str = ""  # display label, e.g. "Weekly · Mon"
    kind: str = ""  # weekly | monthly | quarterly
    day: str = ""  # MO..FR for weekly, "" otherwise
    time: str = ""  # "09:30"
    mins: int = 0
    attendees: str = ""
    purpose: str = ""
    booked: bool = False  # the founder's act: it's actually on their calendar


class DecisionRight(BaseModel):
    decision: str = ""
    owner: str = ""
    note: str = ""


class AreaOwner(BaseModel):
    area: str = ""
    owner: str = ""


class QuarterGoal(BaseModel):
    text: str = ""
    metric: str = ""  # the ONE number that settles it
    code: str = ""  # the workflow it lives in


class Sop(BaseModel):
    id: str = ""
    title: str = ""
    why: str = ""
    status: str = "proposed"  # proposed | drafted | adopted
    owner: str = ""
    trigger: str = ""
    steps: list[str] = Field(default_factory=list)
    done_means: str = ""
    runs: int = 0  # adoption = first completed run, made literal
    last_run: str = ""


class Vendor(BaseModel):
    id: str = ""
    name: str = ""
    category: str = ""
    cost: str = ""  # $/mo — founder fills; never invented
    renewal: str = ""
    owner: str = ""
    access: str = ""  # who has a login — generates the offboarding checklist
    critical: bool = False
    source: str = ""  # "W7 connection" | "integration" | "you added it"


class Risk(BaseModel):
    id: str = ""
    key: str = ""  # stable identity for re-scanning
    title: str = ""
    category: str = ""
    likelihood: int = 1
    impact: int = 1
    severity: str = "low"
    evidence: str = ""
    mitigation: str = ""
    status: str = "open"  # open | mitigated | accepted | resolved
    workflow: str = ""


class Policy(BaseModel):
    id: str = ""
    name: str = ""
    summary: str = ""
    rules: list[str] = Field(default_factory=list)
    adopted: bool = False
    adopted_on: str = ""
    agreed_by: str = ""


class OpsReview(BaseModel):
    date: str = ""
    wins: str = ""
    priority: str = ""


class Initiative(BaseModel):
    """A company-level project — the strategic layer, not a sprint board.

    Deliberately not a kanban tool: no tickets, no swimlanes. This tracks the handful of
    initiatives that matter at the company level, each with one owner and one target date.
    """

    id: str = ""
    title: str = ""
    owner: str = ""
    target: str = ""  # ISO date
    status: str = "planned"  # planned | active | done | blocked
    note: str = ""


class KnowledgeItem(BaseModel):
    """A pointer into wherever the actual document lives — not a wiki. We track what exists,
    who owns it, and whether it's gone stale; Notion/Confluence/Slab hold the content itself."""

    id: str = ""
    title: str = ""
    category: str = ""
    owner: str = ""
    location: str = ""  # a link or "Notion / Confluence / ..."
    last_reviewed: str = ""  # ISO date


class Asset(BaseModel):
    """A discrete owned/licensed item — a laptop, a per-seat license, a domain. Distinct from
    Vendor: vendors are recurring tool subscriptions, assets are things assigned to a person."""

    id: str = ""
    name: str = ""
    category: str = ""
    assignee: str = ""
    cost: str = ""
    purchased: str = ""  # ISO date
    status: str = "active"  # active | retired


class Automation(BaseModel):
    """A registry entry, not an execution engine — we track what automations exist and who
    owns them so a broken one gets noticed, the same way Vendor Management doesn't rebuild
    the vendor's own product. StartupKit never runs the automation itself."""

    id: str = ""
    name: str = ""
    trigger: str = ""
    action: str = ""
    tool: str = ""
    owner: str = ""
    status: str = "active"  # active | broken | retired


class OpsState(BaseModel):
    mission: str = ""
    stakes: str = ""  # "if we die, who loses what?" — sharper than mission alone
    cadences: list[Cadence] = Field(default_factory=list)
    decisions: list[DecisionRight] = Field(default_factory=list)
    owners: list[AreaOwner] = Field(default_factory=list)
    goals: list[QuarterGoal] = Field(default_factory=list)
    sops: list[Sop] = Field(default_factory=list)
    vendors: list[Vendor] = Field(default_factory=list)
    risks: list[Risk] = Field(default_factory=list)
    policies: list[Policy] = Field(default_factory=list)
    reviews: list[OpsReview] = Field(default_factory=list)
    initiatives: list[Initiative] = Field(default_factory=list)
    knowledge: list[KnowledgeItem] = Field(default_factory=list)
    assets: list[Asset] = Field(default_factory=list)
    automations: list[Automation] = Field(default_factory=list)
    steps_done: list[str] = Field(default_factory=list)
    generated: bool = False
