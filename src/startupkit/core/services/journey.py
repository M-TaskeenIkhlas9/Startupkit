"""Journey Graph — 'you are here' over the founder lifecycle, matched to how winners advanced.

Turns the Company Object into an ordered graph of milestone nodes (Idea -> ... -> Investor Ready),
marks the founder's current position, and for the current + next nodes attaches the concrete next
action and the move successful founders made to clear it. This is the simplified home: one clear
next step, in the context of the whole path. Deterministic; `workflow_status` is passed by the app.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from startupkit.core.company_object.projections.snapshot import CompanySnapshot

NodeStatus = Literal["done", "current", "next", "future"]
_STAGE_INDEX = {
    "pre-founder": 0,
    "discovery": 1,
    "problem-solution-fit": 2,
    "mvp-build": 3,
    "first-revenue": 4,
    "pmf": 5,
    "pre-seed": 6,
    "series-a": 7,
}


class JourneyNode(BaseModel):
    id: str
    label: str
    kind: str  # validate | build | formalize | scale
    status: NodeStatus = "future"
    summary: str
    your_status: str = ""  # the founder's proof/data at this node
    next_action: str = ""  # what to do to advance (current/next only)
    winner_move: str = ""  # what founders who succeeded did here
    workflow: str = ""
    case_study_id: str = ""


class Journey(BaseModel):
    nodes: list[JourneyNode]
    current_index: int
    headline: str
    next_action: str


def journey_graph(snap: CompanySnapshot, workflow_status: dict[str, str]) -> Journey:
    si = _STAGE_INDEX.get(snap.stage, 0)
    formed = snap.formation_status == "formed"
    w = workflow_status

    # (node, is_done) specs in journey order.
    specs: list[tuple[JourneyNode, bool]] = [
        (
            JourneyNode(
                id="idea",
                label="Idea",
                kind="validate",
                summary="A clear problem, customer, and solution hypothesis.",
                your_status=snap.one_liner or "Idea captured",
                winner_move="Wrote the problem in one sentence a customer would recognize.",
                case_study_id="validated-first",
            ),
            bool(snap.company_id),
        ),
        (
            JourneyNode(
                id="validation",
                label="Idea validation",
                kind="validate",
                summary="Evidence the problem is real and people will pay.",
                your_status=f"Readiness {snap.readiness_score}/100" if snap.readiness_score else "",
                next_action="Run customer interviews and capture willingness-to-pay.",
                winner_move="Talked to 20+ customers before writing any code.",
                case_study_id="validated-first",
            ),
            bool(snap.readiness_score),
        ),
        (
            JourneyNode(
                id="discovery",
                label="Customer discovery",
                kind="validate",
                summary="Deep understanding of the customer and their pain.",
                next_action="Complete the Customer Discovery assessment (Phase 2).",
                winner_move="Built an ICP from real interviews, not assumptions.",
            ),
            si > 1,
        ),
        (
            JourneyNode(
                id="psf",
                label="Problem-solution fit",
                kind="validate",
                summary="A solution customers confirm they want.",
                next_action="Test your solution and get commitment signals (Phase 3).",
                winner_move="Got verbal commitments before building the full product.",
            ),
            si > 2,
        ),
        (
            JourneyNode(
                id="mvp",
                label="MVP",
                kind="build",
                summary="A shippable product that delivers the core value.",
                next_action="Define and ship a focused MVP (Phase 4).",
                winner_move="Shipped the smallest thing that solved the problem.",
            ),
            si > 3,
        ),
        (
            JourneyNode(
                id="revenue",
                label="First revenue",
                kind="build",
                summary="Paying customers — proof of willingness to pay.",
                next_action="Stand up payments and close your first customers (Phase 5).",
                winner_move="Charged from day one to validate real demand.",
            ),
            si > 4,
        ),
        (
            JourneyNode(
                id="formation",
                label="Formation",
                kind="formalize",
                summary="A legally recognized entity, 83(b) filed, EIN issued.",
                your_status="Entity formed" if formed else "",
                next_action="Form your entity, file the 83(b), get your EIN (W1).",
                winner_move="Formed clean early so the first raise closed in days.",
                workflow="W1",
                case_study_id="clean-formation",
            ),
            w.get("W1") == "complete",
        ),
        (
            JourneyNode(
                id="ip",
                label="IP & legal",
                kind="formalize",
                summary="All IP assigned to the company; core contracts in place.",
                next_action="Sign PIIA/TAA and your commercial contracts (W2).",
                winner_move="Assigned every contributor's IP before it became a dispute.",
                workflow="W2",
                case_study_id="cofounder-ip",
            ),
            w.get("W2") == "complete",
        ),
        (
            JourneyNode(
                id="financial",
                label="Financial infra",
                kind="formalize",
                summary="Banking, accounting, runway tracking, investor-ready books.",
                next_action="Open banking and set up accounting (W3).",
                winner_move="Kept clean books so diligence was a non-event.",
                workflow="W3",
            ),
            w.get("W3") == "complete",
        ),
        (
            JourneyNode(
                id="team",
                label="Team",
                kind="scale",
                summary="Compliant hiring, offers, equity, and onboarding.",
                next_action="Hire your first employees the right way (W6).",
                winner_move="Hired slowly and only after IP was locked down.",
                workflow="W6",
            ),
            w.get("W6") == "complete",
        ),
        (
            JourneyNode(
                id="fundraising",
                label="Investor ready",
                kind="scale",
                summary="Clean cap table, data room, metrics — ready to raise.",
                next_action="Assemble your data room and SAFE (Fundraising Readiness).",
                winner_move="Walked in with evidence; the round nearly closed itself.",
                case_study_id="messy-captable",
            ),
            si >= 6,
        ),
    ]

    nodes = [n for n, _ in specs]
    done = [d for _, d in specs]
    current = next((i for i, d in enumerate(done) if not d), len(nodes) - 1)
    for i, n in enumerate(nodes):
        if done[i]:
            n.status = "done"
        elif i == current:
            n.status = "current"
        elif i == current + 1:
            n.status = "next"
        else:
            n.status = "future"

    cur = nodes[current]
    return Journey(
        nodes=nodes,
        current_index=current,
        headline=f"You're at: {cur.label}",
        next_action=cur.next_action or "Keep advancing your workflows.",
    )
