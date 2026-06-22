"""Company Risk Register — the consolidated Risk engine across the whole Company Object.

Unlike the idea-validation risks (a point-in-time check), this derives the live risks a formed
company carries: irreversible deadlines, unassigned IP, an unclean cap table, a missing EIN, overdue
filings, and low health. Each risk names the action that retires it. Deterministic.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from startupkit.core.company_object.projections.health_score import project_health_score
from startupkit.core.company_object.projections.snapshot import CompanySnapshot
from startupkit.core.services.compliance import compliance_calendar

Severity = Literal["critical", "high", "medium", "info"]
_ORDER = {"critical": 0, "high": 1, "medium": 2, "info": 3}


class CompanyRisk(BaseModel):
    id: str
    severity: Severity
    title: str
    detail: str
    mitigation: str  # the action/workflow that retires it
    workflow: str = ""


def company_risks(snap: CompanySnapshot, workflow_status: dict[str, str]) -> list[CompanyRisk]:
    risks: list[CompanyRisk] = []
    formed = snap.formation_status == "formed"
    has_ein = snap.ein is not None
    eightythree_b = 4 in snap.completed_phases.get("W1", [])
    has_team = snap.team_size > len(snap.founders)
    w2_done = workflow_status.get("W2") == "complete"
    piia = w2_done or any("piia" in d.doc_type.lower() for d in snap.documents)

    if formed and not eightythree_b:
        risks.append(
            CompanyRisk(
                id="83b-unfiled",
                severity="critical",
                title="83(b) election not filed",
                detail="If shares were granted, the 83(b) must be filed within 30 days. Missing it "
                "is irreversible and can cost founders heavily at exit.",
                mitigation="Complete the ownership phase of W1 and file the 83(b) now.",
                workflow="W1",
            )
        )
    if formed and not has_ein:
        risks.append(
            CompanyRisk(
                id="no-ein",
                severity="high",
                title="No EIN yet",
                detail="Without an EIN you can't open banking, run payroll, or file taxes.",
                mitigation="Apply for your EIN in the final phase of W1.",
                workflow="W1",
            )
        )
    if has_team and not piia:
        risks.append(
            CompanyRisk(
                id="unassigned-ip",
                severity="high",
                title="IP not assigned before hiring",
                detail="Contributors without a signed PIIA may own what they build — the #1 "
                "blocker in investor diligence.",
                mitigation="Generate & sign PIIA / IP-assignment in W2 before anyone contributes.",
                workflow="W2",
            )
        )
    if snap.founders and abs(sum(f.equity_pct for f in snap.founders) - 100.0) > 0.01:
        risks.append(
            CompanyRisk(
                id="cap-table-unbalanced",
                severity="medium",
                title="Cap table doesn't total 100%",
                detail="Founder equity must reconcile to 100% before issuing stock or raising.",
                mitigation="Finalize the founder equity split in W1.",
                workflow="W1",
            )
        )

    for c in compliance_calendar(snap):
        if c.status == "overdue":
            risks.append(
                CompanyRisk(
                    id=f"overdue-{c.id}",
                    severity="critical" if c.severity == "critical" else "high",
                    title=f"Overdue: {c.title}",
                    detail=f"{c.authority} · was due {c.due_date}.",
                    mitigation=f"File the {c.title.lower()} immediately.",
                )
            )

    health = project_health_score(snap)
    if health.overall < 35:
        risks.append(
            CompanyRisk(
                id="health-critical",
                severity="info",
                title="Company health is critical",
                detail=f"Health Score is {health.overall}/100. Complete formation and the early "
                "workflows to raise it.",
                mitigation="Work the next-best-actions on your dashboard.",
            )
        )

    return sorted(risks, key=lambda r: _ORDER[r.severity])
