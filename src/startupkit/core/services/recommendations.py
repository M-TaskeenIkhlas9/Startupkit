"""Recommendation Engine — the founder's personalized 'what to do next' (Brain #6).

Upgrades the simple next-actions into full recommendations: the action, why it matters, the
reasoning, step-by-step guidance, resources/templates, priority, deadline, and expected outcome —
each linked to a real case study where relevant. Grounded in the Company Object; deterministic.
"""

from __future__ import annotations

from pydantic import BaseModel

from startupkit.core.company_object.projections.snapshot import CompanySnapshot
from startupkit.core.services.compliance import compliance_calendar


class Recommendation(BaseModel):
    id: str
    title: str
    why_it_matters: str
    reasoning: str
    steps: list[str]
    resources: list[str]
    priority: int  # 1 = do first
    deadline: str | None = None
    expected_outcome: str
    workflow: str = ""
    case_study_id: str = ""


def recommendations_for(
    snap: CompanySnapshot, workflow_status: dict[str, str]
) -> list[Recommendation]:
    formed = snap.formation_status == "formed"
    has_ein = snap.ein is not None
    eightythree_b = 4 in snap.completed_phases.get("W1", [])
    has_team = snap.team_size > len(snap.founders)
    piia = workflow_status.get("W2") == "complete" or any(
        "piia" in d.doc_type.lower() for d in snap.documents
    )
    equity_clean = bool(snap.founders) and abs(
        sum(f.equity_pct for f in snap.founders) - 100.0
    ) < 0.01
    recs: list[Recommendation] = []

    # 1. The 83(b) fuse — highest priority when open (it has a hard deadline).
    if formed and not eightythree_b:
        deadline = next(
            (c.due_date for c in compliance_calendar(snap) if c.id == "83b"), None
        )
        recs.append(
            Recommendation(
                id="file-83b",
                title="File your 83(b) election",
                why_it_matters="Missing it is irreversible and can cost founders six figures in "
                "tax at exit.",
                reasoning="You're formed and issuing founder stock that vests, so the 30-day "
                "clock is running.",
                steps=[
                    "Complete IRS Form 15620 with your share and grant details.",
                    "Mail it to the IRS by certified mail within 30 days of the grant.",
                    "Keep the certified-mail receipt and send a copy to the company.",
                ],
                resources=["83(b) Election (generated in W1)", "IRS Form 15620"],
                priority=1,
                deadline=deadline,
                expected_outcome="Your gains are taxed as long-term capital gains, not income.",
                workflow="W1",
                case_study_id="83b-missed",
            )
        )

    # 2. Form the entity if not yet formed.
    if not formed:
        recs.append(
            Recommendation(
                id="form-entity",
                title="Form your entity (W1 — Business Formation)",
                why_it_matters="Formation gates everything: banking, IP assignment, hiring, and "
                "fundraising.",
                reasoning="You can't legally issue equity, sign on the company's behalf, or open "
                "banking until the entity exists.",
                steps=[
                    "Choose your entity (Delaware C-Corp is the VC default).",
                    "File the Certificate of Incorporation and adopt bylaws.",
                    "Issue founder stock, then file the 83(b) within 30 days.",
                    "Apply for your EIN.",
                ],
                resources=["Certificate of Incorporation", "Bylaws", "Founder Stock Purchase"],
                priority=1,
                expected_outcome="A legally recognized company that unlocks W2–W8.",
                workflow="W1",
                case_study_id="formed-too-early"
                if (snap.readiness_score or 100) < 40
                else "clean-formation",
            )
        )

    # 3. EIN.
    if formed and not has_ein:
        recs.append(
            Recommendation(
                id="get-ein",
                title="Apply for your EIN",
                why_it_matters="No EIN means no business banking, no payroll, and no tax filings.",
                reasoning="Your entity is formed, so the EIN is the next unlock toward W3 banking.",
                steps=[
                    "Apply via the IRS (online with an SSN, or by fax for international founders).",
                    "Store the EIN confirmation letter in your Company Object.",
                ],
                resources=["EIN Confirmation Letter (W1)"],
                priority=2,
                expected_outcome="You can open banking and run payroll.",
                workflow="W1",
                case_study_id="no-ein-no-bank",
            )
        )

    # 4. Assign IP before hiring.
    if has_team and not piia:
        recs.append(
            Recommendation(
                id="assign-ip",
                title="Assign IP before anyone contributes",
                why_it_matters="Unassigned IP is the #1 diligence blocker — contributors can own "
                "what they build.",
                reasoning="You have people beyond the founders but no signed PIIA on record.",
                steps=[
                    "Generate the PIIA and Technology Assignment in W2.",
                    "Have every founder and contributor sign before writing code.",
                ],
                resources=["PIIA", "Technology Assignment Agreement"],
                priority=2,
                expected_outcome="The company — not individuals — owns all the IP.",
                workflow="W2",
                case_study_id="cofounder-ip",
            )
        )

    # 5. Clean cap table.
    if snap.founders and not equity_clean:
        recs.append(
            Recommendation(
                id="clean-captable",
                title="Reconcile your cap table to 100%",
                why_it_matters="An ambiguous cap table kills funding rounds in diligence.",
                reasoning="Your founders' equity doesn't currently total 100%.",
                steps=[
                    "Agree the final founder split.",
                    "Record it in the stock ledger and cap table.",
                ],
                resources=["Cap Table", "Stock Ledger"],
                priority=3,
                expected_outcome="A clean ownership record investors can trust.",
                workflow="W1",
                case_study_id="messy-captable",
            )
        )

    # 6. Open banking once EIN exists.
    if formed and has_ein and workflow_status.get("W3") != "complete":
        recs.append(
            Recommendation(
                id="open-banking",
                title="Open business banking (W3)",
                why_it_matters="Clean financials from day one make fundraising and taxes painless.",
                reasoning="You have an EIN and formation docs — banking is now available.",
                steps=[
                    "Open a Mercury (or Brex) account with your EIN + formation docs.",
                    "Set up your chart of accounts and start tracking runway.",
                ],
                resources=["Business Bank Account Application", "Chart of Accounts"],
                priority=4,
                expected_outcome="Live financials feeding your Health Score and data room.",
                workflow="W3",
            )
        )

    recs.sort(key=lambda r: r.priority)
    return recs[:5]
