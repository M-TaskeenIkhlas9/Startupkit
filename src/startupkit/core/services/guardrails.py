"""Real-Time Guardrails — the Failure Prevention engine (Brain: 'prevent > warn').

Before a founder takes a consequential action (hire, raise, issue equity, open banking, sign a
customer), this checks the Company Object for the prerequisites and either clears them to proceed or
blocks with the exact reason and fix. Deterministic and grounded — no model required.

`workflow_status` (code -> status) is passed in by the app layer so core stays decoupled from the
workflow catalog.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from startupkit.core.company_object.projections.snapshot import CompanySnapshot

GuardrailAction = Literal[
    "hire-employee", "raise-round", "issue-equity", "open-banking", "sign-customer"
]
Verdict = Literal["safe", "caution", "blocked"]

ACTION_LABELS: dict[str, str] = {
    "hire-employee": "Hire your first employee",
    "raise-round": "Raise a funding round",
    "issue-equity": "Issue equity / options",
    "open-banking": "Open a business bank account",
    "sign-customer": "Sign a customer contract",
}


class Prereq(BaseModel):
    label: str
    met: bool
    required: bool
    fix: str = ""


class GuardrailResult(BaseModel):
    action: str
    verdict: Verdict
    headline: str
    prerequisites: list[Prereq]


def _has_doc(snap: CompanySnapshot, *keywords: str) -> bool:
    return any(
        any(k.lower() in d.doc_type.lower() for k in keywords) for d in snap.documents
    )


def _formed_prereq(formed: bool) -> Prereq:
    return Prereq(
        label="Entity is formed", met=formed, required=True, fix="Complete W1 — Formation."
    )


def check(
    action: GuardrailAction, snap: CompanySnapshot, workflow_status: dict[str, str]
) -> GuardrailResult:
    formed = snap.formation_status == "formed"
    has_ein = snap.ein is not None
    eightythree_b = 4 in snap.completed_phases.get("W1", [])
    equity_clean = bool(snap.founders) and abs(
        sum(f.equity_pct for f in snap.founders) - 100.0
    ) < 0.01
    w2_done = workflow_status.get("W2") == "complete"
    piia = w2_done or _has_doc(snap, "PIIA", "Proprietary Information")

    if action == "hire-employee":
        prereqs = [
            _formed_prereq(formed),
            Prereq(
                label="IP assignment (PIIA) in place",
                met=piia,
                required=True,
                fix="Generate & sign the PIIA in W2 before anyone contributes code.",
            ),
            Prereq(
                label="Offer-letter process ready",
                met=workflow_status.get("W6") in ("available", "in-progress", "complete"),
                required=False,
                fix="Open W6 — People & HR to generate a compliant offer letter.",
            ),
        ]
    elif action == "raise-round":
        prereqs = [
            _formed_prereq(formed),
            Prereq(
                label="83(b) election filed",
                met=eightythree_b,
                required=True,
                fix="File the 83(b) within 30 days of the stock grant — it's irreversible.",
            ),
            Prereq(
                label="Cap table totals 100%",
                met=equity_clean,
                required=True,
                fix="Finalize the founder equity split before issuing the SAFE.",
            ),
            Prereq(
                label="Financials / banking set up",
                met=has_ein,
                required=False,
                fix="Open banking and accounting in W3 so investors see clean financials.",
            ),
            Prereq(
                label="Data room prepared",
                met=_has_doc(snap, "Data Room", "SAFE", "Investor"),
                required=False,
                fix="Prepare a data room (W3 / Fundraising Readiness).",
            ),
        ]
    elif action == "issue-equity":
        prereqs = [
            _formed_prereq(formed),
            Prereq(
                label="Bylaws & board consent adopted",
                met=3 in snap.completed_phases.get("W1", [])
                or _has_doc(snap, "Bylaws", "Board Consent"),
                required=True,
                fix="Adopt bylaws and record board consent (W1 governance phase).",
            ),
            Prereq(
                label="Cap table totals 100%",
                met=equity_clean,
                required=False,
                fix="Reconcile the cap table so new grants don't over-allocate.",
            ),
        ]
    elif action == "open-banking":
        prereqs = [
            _formed_prereq(formed),
            Prereq(
                label="EIN issued",
                met=has_ein,
                required=True,
                fix="Apply for your EIN (W1 final phase) — banks require it.",
            ),
        ]
    else:  # sign-customer
        prereqs = [
            _formed_prereq(formed),
            Prereq(
                label="Customer contract (MSA) available",
                met=_has_doc(snap, "Master Service", "MSA"),
                required=False,
                fix="Generate an MSA in W2 so you sign on your paper, not theirs.",
            ),
        ]

    blocked = any(p.required and not p.met for p in prereqs)
    caution = any(not p.required and not p.met for p in prereqs)
    verdict: Verdict = "blocked" if blocked else "caution" if caution else "safe"
    headline = {
        "blocked": "Not yet — a required step is missing.",
        "caution": "You can proceed, but tidy these up first.",
        "safe": "You're clear to proceed.",
    }[verdict]
    return GuardrailResult(
        action=ACTION_LABELS[action], verdict=verdict, headline=headline, prerequisites=prereqs
    )
