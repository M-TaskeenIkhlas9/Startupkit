"""Case-Study Engine — the Knowledge layer that learns from real founder outcomes (Brain #7).

A curated library of anonymized founder stories — failures to avoid and successes to emulate. The
engine matches the company's *current situation* to the most relevant lessons, so guidance is backed
by what actually happened to founders in the same spot. Deterministic; no model required.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from startupkit.core.company_object.projections.snapshot import CompanySnapshot


class CaseStudy(BaseModel):
    id: str
    title: str
    outcome: Literal["failure", "success"]
    category: str  # legal | equity | finance | hiring | fundraising | product
    story: str
    lesson: str
    action: str
    workflow: str = ""


_LIBRARY: dict[str, CaseStudy] = {
    "83b-missed": CaseStudy(
        id="83b-missed",
        title="The 83(b) that cost a founder six figures",
        outcome="failure",
        category="legal",
        story="A founder issued themselves restricted stock at a fraction of a cent and forgot the "
        "83(b) election. At the Series B, the IRS taxed the vesting gains as ordinary income — a "
        "six-figure bill that a one-page form would have avoided.",
        lesson="The 83(b) is irreversible and due within 30 days of the grant. File it now.",
        action="File your 83(b) election now.",
        workflow="W1",
    ),
    "cofounder-ip": CaseStudy(
        id="cofounder-ip",
        title="The co-founder who walked off with the codebase",
        outcome="failure",
        category="equity",
        story="Two founders built for months with no IP-assignment agreement. One left and "
        "claimed ownership of the code they'd written. The remaining founder spent the seed round "
        "on lawyers instead of growth.",
        lesson="Every contributor signs a PIIA/TAA before writing code — the company owns the IP.",
        action="Generate & sign PIIA / Technology Assignment in W2.",
        workflow="W2",
    ),
    "formed-too-early": CaseStudy(
        id="formed-too-early",
        title="Incorporated before validating — months and dollars gone",
        outcome="failure",
        category="product",
        story="Excited by the idea, a founder formed a C-corp, opened banking, and paid for tools "
        "— then discovered customers didn't want it. They dissolved the entity and started over, "
        "out thousands of dollars and a quarter of runway.",
        lesson="Validate demand before you incorporate. Forming is cheap to delay, costly to undo.",
        action="Run more customer discovery before formalizing.",
        workflow="",
    ),
    "messy-captable": CaseStudy(
        id="messy-captable",
        title="The messy cap table that sank the seed round",
        outcome="failure",
        category="fundraising",
        story="Hand-shake equity promises and an unsigned advisor grant left the cap table "
        "ambiguous. In diligence the lead investor couldn't tell who owned what and walked.",
        lesson="A clean, 100% cap table is table stakes for raising. Reconcile before you pitch.",
        action="Finalize the founder equity split and record every grant.",
        workflow="W1",
    ),
    "no-ein-no-bank": CaseStudy(
        id="no-ein-no-bank",
        title="No EIN, no bank account, no payroll",
        outcome="failure",
        category="finance",
        story="A formed startup couldn't open banking or run payroll because it never applied for "
        "an EIN. The first hire's start date slipped by weeks.",
        lesson="The EIN unlocks banking and payroll — get it the moment you're formed.",
        action="Apply for your EIN in the final phase of W1.",
        workflow="W1",
    ),
    "no-dataroom": CaseStudy(
        id="no-dataroom",
        title="No data room, and the term sheet evaporated",
        outcome="failure",
        category="fundraising",
        story="A founder got verbal interest but took three weeks to assemble basic documents. "
        "Momentum died and the investor moved on.",
        lesson="Keep an investor-ready data room current — speed signals competence.",
        action="Prepare your data room (W3 / Fundraising Readiness).",
        workflow="W3",
    ),
    "clean-formation": CaseStudy(
        id="clean-formation",
        title="Formed clean in days, closed a SAFE in a week",
        outcome="success",
        category="legal",
        story="A founder used a standard formation stack, filed the 83(b) on day one, and kept a "
        "tidy cap table. When an angel offered to invest, the SAFE closed in days — no legal "
        "scramble.",
        lesson="Doing formation right early makes everything after it fast.",
        action="Complete W1 cleanly: formation, 83(b), EIN.",
        workflow="W1",
    ),
    "validated-first": CaseStudy(
        id="validated-first",
        title="30 interviews first — and investors leaned in",
        outcome="success",
        category="product",
        story="Before building, a founder ran 30 customer interviews and pre-sold three pilots. "
        "The evidence made the pitch nearly self-proving.",
        lesson="Demand evidence is the strongest thing you can bring to a raise.",
        action="Keep stacking customer validation.",
        workflow="",
    ),
}


def relevant_case_studies(
    snap: CompanySnapshot, workflow_status: dict[str, str]
) -> list[CaseStudy]:
    ids: list[str] = []
    formed = snap.formation_status == "formed"
    eightythree_b = 4 in snap.completed_phases.get("W1", [])
    has_ein = snap.ein is not None
    has_team = snap.team_size > len(snap.founders)
    piia = workflow_status.get("W2") == "complete" or any(
        "piia" in d.doc_type.lower() for d in snap.documents
    )
    equity_clean = bool(snap.founders) and abs(
        sum(f.equity_pct for f in snap.founders) - 100.0
    ) < 0.01
    raising = snap.stage in ("pre-seed", "series-a") or bool(snap.target_round)

    if formed and not eightythree_b:
        ids.append("83b-missed")
    if has_team and not piia:
        ids.append("cofounder-ip")
    if formed and snap.readiness_score and snap.readiness_score < 40:
        ids.append("formed-too-early")
    if not equity_clean and snap.founders:
        ids.append("messy-captable")
    if formed and not has_ein:
        ids.append("no-ein-no-bank")
    if raising and not any("data room" in d.doc_type.lower() for d in snap.documents):
        ids.append("no-dataroom")

    # Always pair cautionary tales with an aspirational one.
    if workflow_status.get("W1") == "complete":
        ids.append("clean-formation")
    if snap.readiness_score and snap.readiness_score >= 65:
        ids.append("validated-first")

    if not ids:  # nothing triggered — show the universal early lessons
        ids = ["validated-first", "clean-formation"]

    seen: set[str] = set()
    out: list[CaseStudy] = []
    for i in ids:
        if i not in seen:
            seen.add(i)
            out.append(_LIBRARY[i])
    return out
