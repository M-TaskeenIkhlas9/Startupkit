"""AI Co-Founder — a grounded advisory engine over the Company Object.

Answers the founder's real questions ("what do I do next?", "what are my risks?", "can I hire?",
"am I ready to raise?") using the live Company Object, the risk register, guardrails, compliance,
and Health Score. Deterministic now (intent-routed, grounded); the same interface swaps to Claude
(Opus 4.8) later for free-form conversation — answers stay grounded in company state either way.
"""

from __future__ import annotations

from pydantic import BaseModel

from startupkit.core.company_object.projections.health_score import project_health_score
from startupkit.core.company_object.projections.snapshot import CompanySnapshot
from startupkit.core.services.company_object_service import next_actions_for
from startupkit.core.services.compliance import compliance_calendar
from startupkit.core.services.guardrails import GuardrailAction, check
from startupkit.core.services.risks import company_risks

SUGGESTED_QUESTIONS = [
    "What should I do next?",
    "What are my biggest risks?",
    "How healthy is my company?",
    "What's due soon?",
    "Can I hire someone yet?",
    "Am I ready to raise?",
    "Do I need an 83(b) election?",
]


class AdvisorAction(BaseModel):
    title: str
    workflow: str = ""


class Answer(BaseModel):
    intent: str
    headline: str
    detail: str
    facts: list[str]
    actions: list[AdvisorAction]


def ask(question: str, snap: CompanySnapshot, workflow_status: dict[str, str]) -> Answer:
    q = question.lower()
    if _hit(q, "risk", "wrong", "danger", "worried"):
        return _risks_answer(snap, workflow_status)
    if _hit(q, "health", "score", "healthy"):
        return _health_answer(snap)
    if _hit(q, "due", "deadline", "overdue", "file", "compliance", "tax"):
        return _deadlines_answer(snap)
    if _hit(q, "raise", "fundrais", "investor", "safe", "seed"):
        return _guardrail_answer("raise-round", snap, workflow_status, "fundraising")
    if _hit(q, "hire", "employee", "recruit"):
        return _guardrail_answer("hire-employee", snap, workflow_status, "hiring")
    if _hit(q, "equity", "option", "stock", "cap table", "grant"):
        return _guardrail_answer("issue-equity", snap, workflow_status, "equity")
    if _hit(q, "bank", "banking", "mercury"):
        return _guardrail_answer("open-banking", snap, workflow_status, "banking")
    if _hit(q, "83b", "83(b)", "election"):
        return _eightythree_b_answer(snap)
    if _hit(q, "ip", "piia", "patent", "invention"):
        return _ip_answer(snap, workflow_status)
    return _next_answer(snap)  # default: what should I do next


def _hit(q: str, *terms: str) -> bool:
    return any(t in q for t in terms)


def _next_answer(snap: CompanySnapshot) -> Answer:
    actions = next_actions_for(snap)
    return Answer(
        intent="next-step",
        headline="Here's your next best move."
        if actions
        else "You're all caught up for now.",
        detail=actions[0].why if actions else "Complete your intake to get tailored guidance.",
        facts=[f"Stage: {snap.stage or 'pre-founder'}", f"Formation: {snap.formation_status}"],
        actions=[AdvisorAction(title=a.title, workflow=a.workflow) for a in actions],
    )


def _risks_answer(snap: CompanySnapshot, wf: dict[str, str]) -> Answer:
    risks = company_risks(snap, wf)
    top = risks[0] if risks else None
    return Answer(
        intent="risks",
        headline=f"You're carrying {len(risks)} open risk(s)." if risks else "No major risks. ✅",
        detail=top.detail if top else "Keep completing workflows to stay clean.",
        facts=[f"{r.severity.upper()} · {r.title}" for r in risks[:5]],
        actions=[AdvisorAction(title=r.mitigation, workflow=r.workflow) for r in risks[:3]],
    )


def _health_answer(snap: CompanySnapshot) -> Answer:
    hs = project_health_score(snap)
    weakest = min(hs.dimensions, key=lambda d: d.score)
    return Answer(
        intent="health",
        headline=f"Health Score: {hs.overall}/100 — {hs.status.replace('-', ' ')}.",
        detail=f"Your weakest dimension is {weakest.dimension} ({weakest.score}/100). "
        "Completing the related workflow is the fastest way to raise your score.",
        facts=[f"{d.dimension}: {d.score}/100 (weight {d.weight}%)" for d in hs.dimensions],
        actions=[AdvisorAction(title="Work your next-best-actions", workflow="")],
    )


def _deadlines_answer(snap: CompanySnapshot) -> Answer:
    cal = compliance_calendar(snap)
    pending = [c for c in cal if c.status in ("overdue", "due-soon")]
    return Answer(
        intent="deadlines",
        headline=f"{len(pending)} filing(s) need attention."
        if pending
        else "Nothing due soon. ✅",
        detail="Overdue items are flagged first — file those today."
        if any(c.status == "overdue" for c in cal)
        else "Your compliance calendar is current.",
        facts=[f"{c.status.upper()} · {c.title} · due {c.due_date}" for c in cal[:6]],
        actions=[AdvisorAction(title=f"File {c.title.lower()}") for c in pending[:3]],
    )


def _guardrail_answer(
    action: GuardrailAction, snap: CompanySnapshot, wf: dict[str, str], topic: str
) -> Answer:
    g = check(action, snap, wf)
    unmet = [p for p in g.prerequisites if not p.met]
    return Answer(
        intent=topic,
        headline=g.headline,
        detail="All prerequisites are met."
        if not unmet
        else "Clear these first: " + "; ".join(p.label for p in unmet) + ".",
        facts=[f"{'✓' if p.met else '✗'} {p.label}" for p in g.prerequisites],
        actions=[AdvisorAction(title=p.fix) for p in unmet if p.fix],
    )


def _eightythree_b_answer(snap: CompanySnapshot) -> Answer:
    filed = 4 in snap.completed_phases.get("W1", [])
    return Answer(
        intent="83b",
        headline="The 83(b) is your most time-sensitive filing."
        if not filed
        else "Your 83(b) is on record. ✅",
        detail="If you received restricted stock that vests, file an 83(b) election within 30 days "
        "of the grant — it can't be extended and skipping it can be very costly at exit.",
        facts=["Form: IRS 15620", "Deadline: 30 days from stock grant", "Extensions: none"],
        actions=[]
        if filed
        else [AdvisorAction(title="File the 83(b) election now", workflow="W1")],
    )


def _ip_answer(snap: CompanySnapshot, wf: dict[str, str]) -> Answer:
    piia = wf.get("W2") == "complete" or any("piia" in d.doc_type.lower() for d in snap.documents)
    return Answer(
        intent="ip",
        headline="Your IP is assigned to the company." if piia else "Assign your IP now.",
        detail="Every founder and contributor must sign a PIIA/TAA so the company — not the "
        "individual — owns the work. Unassigned IP is the top diligence blocker.",
        facts=[f"PIIA in place: {'yes' if piia else 'no'}"],
        actions=[]
        if piia
        else [AdvisorAction(title="Generate & sign PIIA / TAA", workflow="W2")],
    )
