"""Idea validation & stage detection — the founder's first step (the 'Business DNA Assessment').

A deterministic Phase 1 version of the Brain's Stage Detection + Dependency/Readiness + Risk +
Recommendation engines: the founder answers a short questionnaire about their idea and traction,
and we return a detected stage, a readiness score, the validation signals, risk flags, and a
recommendation on whether to keep validating or formalize the company (W1). Pure function.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from startupkit.core.company_object.events import Stage

Conversations = Literal["none", "1-5", "5-20", "20+"]
Evidence = Literal["assumption", "some-signal", "strong-evidence"]
MvpStatus = Literal["none", "building", "shipped"]
RevenueStatus = Literal["none", "pilots", "paying"]
Team = Literal["solo", "cofounders"]
Goal = Literal["lifestyle", "vc-scale"]
Commitment = Literal["exploring", "part-time", "full-time"]
# Added from the User Journey Map key questions (Journey 1 — Idea → Startup):
MarketSize = Literal["niche", "growing", "large", "massive"]  # "is the market large enough?"
WillingnessToPay = Literal["no-signal", "interest", "verbal-commit", "loi-or-paying"]  # "who pays?"
Differentiation = Literal["me-too", "some-edge", "strong-moat"]  # "what makes us different?"
FounderFit = Literal["exploring", "some-domain", "deep-expertise"]  # founder–market fit


class IdeaValidationAnswers(BaseModel):
    problem: str
    customer: str
    solution: str
    customer_conversations: Conversations = "none"
    problem_evidence: Evidence = "assumption"
    willingness_to_pay: WillingnessToPay = "no-signal"
    market_size: MarketSize = "growing"
    differentiation: Differentiation = "some-edge"
    founder_market_fit: FounderFit = "exploring"
    mvp_status: MvpStatus = "none"
    revenue_status: RevenueStatus = "none"
    team: Team = "solo"
    goal: Goal = "vc-scale"
    commitment: Commitment = "exploring"


class Signal(BaseModel):
    label: str
    score: int  # 0-100
    note: str


class Risk(BaseModel):
    level: Literal["high", "medium", "info"]
    title: str
    detail: str


class Recommendation(BaseModel):
    action: Literal["validate-more", "form-now"]
    headline: str
    detail: str


class IdeaAssessment(BaseModel):
    detected_stage: Stage
    readiness_score: int  # 0-100
    verdict: Literal["promising", "needs-validation", "early"]
    signals: list[Signal]
    risks: list[Risk]
    recommendation: Recommendation


_CONV = {"none": 0, "1-5": 35, "5-20": 70, "20+": 100}
_EVID = {"assumption": 15, "some-signal": 55, "strong-evidence": 100}
_MVP = {"none": 0, "building": 50, "shipped": 100}
_REV = {"none": 0, "pilots": 60, "paying": 100}
_WTP = {"no-signal": 0, "interest": 45, "verbal-commit": 75, "loi-or-paying": 100}
_MARKET = {"niche": 30, "growing": 60, "large": 85, "massive": 100}
_DIFF = {"me-too": 20, "some-edge": 60, "strong-moat": 100}
_FIT = {"exploring": 25, "some-domain": 65, "deep-expertise": 100}


def assess_idea(a: IdeaValidationAnswers) -> IdeaAssessment:
    conv, evid, mvp, rev = (
        _CONV[a.customer_conversations],
        _EVID[a.problem_evidence],
        _MVP[a.mvp_status],
        _REV[a.revenue_status],
    )
    wtp, market, diff, fit = (
        _WTP[a.willingness_to_pay],
        _MARKET[a.market_size],
        _DIFF[a.differentiation],
        _FIT[a.founder_market_fit],
    )
    # Validation readiness blends demand + evidence + traction ("who will pay" weighs heaviest).
    readiness = round(conv * 0.2 + evid * 0.2 + wtp * 0.25 + mvp * 0.15 + rev * 0.2)

    signals = [
        Signal(label="Customer discovery", score=conv, note=_conv_note(a.customer_conversations)),
        Signal(label="Problem evidence", score=evid, note=_evid_note(a.problem_evidence)),
        Signal(label="Willingness to pay", score=wtp, note=_wtp_note(a.willingness_to_pay)),
        Signal(label="Market size", score=market, note=_market_note(a.market_size)),
        Signal(label="Differentiation", score=diff, note=_diff_note(a.differentiation)),
        Signal(label="Founder–market fit", score=fit, note=_fit_note(a.founder_market_fit)),
        Signal(label="Product", score=mvp, note=_mvp_note(a.mvp_status)),
        Signal(label="Revenue", score=rev, note=_rev_note(a.revenue_status)),
    ]

    verdict: Literal["promising", "needs-validation", "early"]
    verdict = "promising" if readiness >= 65 else "needs-validation" if readiness >= 40 else "early"
    return IdeaAssessment(
        detected_stage=_detect_stage(a),
        readiness_score=readiness,
        verdict=verdict,
        signals=signals,
        risks=_risks(a),
        recommendation=_recommend(a, readiness),
    )


def _detect_stage(a: IdeaValidationAnswers) -> Stage:
    if a.revenue_status == "paying":
        if a.customer_conversations == "20+" and a.problem_evidence == "strong-evidence":
            return "pmf"
        return "first-revenue"
    if a.mvp_status == "shipped":
        return "first-revenue" if a.revenue_status == "pilots" else "mvp-build"
    if a.mvp_status == "building":
        return "problem-solution-fit"
    if a.customer_conversations in ("5-20", "20+") and a.problem_evidence != "assumption":
        return "problem-solution-fit"
    if a.customer_conversations in ("1-5", "5-20") or a.problem_evidence == "some-signal":
        return "discovery"
    return "pre-founder"


def _risks(a: IdeaValidationAnswers) -> list[Risk]:
    risks: list[Risk] = []
    if a.problem_evidence == "assumption":
        risks.append(
            Risk(
                level="high",
                title="Problem not yet validated",
                detail="You're working from an assumption. Talk to real customers before you build "
                "or incorporate — unvalidated problems are the #1 cause of startup failure.",
            )
        )
    if a.customer_conversations == "none" and a.mvp_status in ("building", "shipped"):
        risks.append(
            Risk(
                level="high",
                title="Building before talking to customers",
                detail="You're building without customer discovery. A few interviews now can save "
                "months of building the wrong thing.",
            )
        )
    if a.goal == "vc-scale" and a.team == "solo":
        risks.append(
            Risk(
                level="medium",
                title="Solo founder with a VC-scale goal",
                detail="Most VCs prefer 2+ founders. Consider a co-founder before raising — and "
                "make sure IP is assigned (W2) the moment anyone contributes.",
            )
        )
    if a.willingness_to_pay == "no-signal" and a.mvp_status != "none":
        risks.append(
            Risk(
                level="high",
                title="Building without proof anyone will pay",
                detail="You're building but no customer has signaled they'd pay. Get verbal "
                "commitments or letters of intent before investing more.",
            )
        )
    if a.market_size == "niche" and a.goal == "vc-scale":
        risks.append(
            Risk(
                level="medium",
                title="Small market for a VC-scale plan",
                detail="A niche market rarely supports venture-scale returns. Either expand the "
                "market thesis or target profitability rather than VC.",
            )
        )
    if a.differentiation == "me-too":
        risks.append(
            Risk(
                level="medium",
                title="No clear differentiation",
                detail="You look similar to existing alternatives. Define a wedge — who you serve "
                "better, or what you do that they can't — before going to market.",
            )
        )
    if a.founder_market_fit == "exploring" and a.goal == "vc-scale":
        risks.append(
            Risk(
                level="info",
                title="Limited domain experience",
                detail="Investors weigh founder–market fit heavily. Build credibility through "
                "customer depth, an advisor, or a domain-expert co-founder.",
            )
        )
    if a.revenue_status == "none" and a.commitment == "full-time":
        risks.append(
            Risk(
                level="info",
                title="Full-time with no revenue yet",
                detail="Track your runway closely. Once you form (W1) and bank (W3), StartupKit "
                "monitors it for you.",
            )
        )
    return risks


def _recommend(a: IdeaValidationAnswers, readiness: int) -> Recommendation:
    formalize = readiness >= 55 or a.revenue_status == "paying" or a.mvp_status == "shipped"
    if formalize:
        return Recommendation(
            action="form-now",
            headline="You're ready to formalize",
            detail="Your validation signals are strong enough to lock in the legal foundation. "
            "Start W1 — Business Formation so you can issue equity, open banking, and hire.",
        )
    return Recommendation(
        action="validate-more",
        headline="Validate before you incorporate",
        detail="Run more customer discovery first. Forming too early burns time and money on an "
        "unproven idea — come back to W1 once you have real demand signal.",
    )


def _conv_note(c: Conversations) -> str:
    return {
        "none": "No customer conversations yet — start here.",
        "1-5": "A few conversations — keep going.",
        "5-20": "Solid early discovery.",
        "20+": "Deep customer understanding.",
    }[c]


def _evid_note(e: Evidence) -> str:
    return {
        "assumption": "Still an assumption.",
        "some-signal": "Some signal the problem is real.",
        "strong-evidence": "Strong evidence of a real, painful problem.",
    }[e]


def _mvp_note(m: MvpStatus) -> str:
    return {
        "none": "No product yet.",
        "building": "MVP in progress.",
        "shipped": "MVP shipped to users.",
    }[m]


def _rev_note(r: RevenueStatus) -> str:
    return {
        "none": "Pre-revenue.",
        "pilots": "Pilot / design-partner revenue.",
        "paying": "Paying customers.",
    }[r]


def _wtp_note(w: WillingnessToPay) -> str:
    return {
        "no-signal": "No one has said they'd pay yet.",
        "interest": "Some interest, no commitment.",
        "verbal-commit": "Verbal commitments to pay.",
        "loi-or-paying": "Letters of intent or paying customers.",
    }[w]


def _market_note(m: MarketSize) -> str:
    return {
        "niche": "Small / niche market.",
        "growing": "Real and growing market.",
        "large": "Large market.",
        "massive": "Massive market.",
    }[m]


def _diff_note(d: Differentiation) -> str:
    return {
        "me-too": "Looks like existing alternatives.",
        "some-edge": "Some advantage over alternatives.",
        "strong-moat": "Strong, defensible differentiation.",
    }[d]


def _fit_note(f: FounderFit) -> str:
    return {
        "exploring": "New to this domain.",
        "some-domain": "Some domain experience.",
        "deep-expertise": "Deep domain expertise.",
    }[f]
