"""AI Co-Founder reasoning over the idea — is it worth building, or should it change?

The founder writes the problem + solution and answers a few questions; this returns a co-founder's
verdict (go / promising / needs work / pivot), the reasoning, strengths, concerns, and the most
important improvements. The structured verdict is deterministic (always reliable); the reasoning
narrative is written by Claude when a key is set, and assembled from the signals otherwise.
Same `ModelPort` seam as the Document Engine — set ANTHROPIC_API_KEY to make reasoning truly LLM.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from startupkit.core.services.idea_validation import IdeaAssessment, IdeaValidationAnswers
from startupkit.ports.model import ModelPort

Verdict = Literal["strong-go", "promising", "needs-work", "pivot"]

_HEADLINE: dict[str, str] = {
    "strong-go": "This is worth building. Go.",
    "promising": "Promising — with a few things to prove.",
    "needs-work": "There's something here, but it needs work.",
    "pivot": "Reshape the idea before you commit.",
}

_SYSTEM = (
    "You are a seasoned startup co-founder and YC-style advisor. Be direct, specific, and honest "
    "but kind. In 3-4 sentences assess whether this idea is worth pursuing now: what's strongest, "
    "what's the biggest risk, and the single most important next move. End with a clear stance — "
    "build it, validate more first, or rethink it. Do not use headings or bullet points."
)


class IdeaReasoning(BaseModel):
    verdict: Verdict
    headline: str
    reasoning: str
    strengths: list[str]
    concerns: list[str]
    improvements: list[str]
    should_proceed: bool
    source: Literal["ai", "engine"]  # was the narrative written by an LLM or assembled


async def reason_about_idea(
    a: IdeaValidationAnswers, assessment: IdeaAssessment, model: ModelPort
) -> IdeaReasoning:
    verdict = _verdict(a, assessment)
    strengths = _strengths(a)
    concerns = _concerns(a, assessment)
    improvements = _improvements(a)

    text = ""
    if model.descriptor.id != "template":  # a real LLM is wired in
        try:
            text = (await model.complete(_SYSTEM, _prompt(a, assessment))).strip()
        except Exception:
            text = ""
    source: Literal["ai", "engine"] = "ai" if text else "engine"
    reasoning = text or _assemble(a, verdict, strengths, concerns, improvements)

    return IdeaReasoning(
        verdict=verdict,
        headline=_HEADLINE[verdict],
        reasoning=reasoning,
        strengths=strengths,
        concerns=concerns,
        improvements=improvements,
        should_proceed=verdict in ("strong-go", "promising"),
        source=source,
    )


def _verdict(a: IdeaValidationAnswers, assessment: IdeaAssessment) -> Verdict:
    r = assessment.readiness_score
    high = sum(1 for x in assessment.risks if x.level == "high")
    weak_fundamentals = a.differentiation == "me-too" and a.market_size == "niche"
    if r >= 70 and high == 0:
        return "strong-go"
    if r >= 50:
        return "promising"
    if weak_fundamentals:
        return "pivot"
    return "needs-work"


def _strengths(a: IdeaValidationAnswers) -> list[str]:
    s: list[str] = []
    if a.willingness_to_pay in ("verbal-commit", "loi-or-paying"):
        s.append("Customers have signaled real willingness to pay")
    if a.market_size in ("large", "massive"):
        s.append("Large addressable market")
    if a.differentiation == "strong-moat":
        s.append("Strong, defensible differentiation")
    if a.founder_market_fit == "deep-expertise":
        s.append("Deep founder–market fit")
    if a.customer_conversations in ("5-20", "20+"):
        s.append("Solid customer discovery already done")
    if a.problem_evidence == "strong-evidence":
        s.append("Strong evidence the problem is real")
    if a.revenue_status != "none":
        s.append("Already generating early revenue")
    if not s:
        s.append("You've articulated a clear problem and solution to build on")
    return s[:4]


def _concerns(a: IdeaValidationAnswers, assessment: IdeaAssessment) -> list[str]:
    c: list[str] = [r.title for r in assessment.risks if r.level in ("high", "medium")]
    if a.willingness_to_pay == "no-signal":
        c.append("No one has signaled they'd pay yet")
    if len(a.problem.strip()) < 40:
        c.append("Problem statement is thin — be more specific about the pain")
    seen: set[str] = set()
    out: list[str] = []
    for x in c:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out[:4]


def _improvements(a: IdeaValidationAnswers) -> list[str]:
    imp: list[str] = []
    if a.customer_conversations in ("none", "1-5"):
        imp.append("Interview 15–20 target customers in the next few weeks")
    if a.willingness_to_pay == "no-signal":
        imp.append("Get verbal commitments or pre-orders to prove willingness to pay")
    if a.differentiation == "me-too":
        imp.append("Define a sharp wedge — who you serve better, or what only you can do")
    if a.market_size == "niche" and a.goal == "vc-scale":
        imp.append("Expand the market thesis, or aim for profitability rather than VC")
    if a.problem_evidence == "assumption":
        imp.append("Validate the problem with evidence, not assumption")
    if a.founder_market_fit == "exploring":
        imp.append("Build credibility with an advisor or a domain-expert co-founder")
    if not imp:
        imp.append("Keep stacking proof of demand as you build")
    return imp[:4]


def _assemble(
    a: IdeaValidationAnswers,
    verdict: Verdict,
    strengths: list[str],
    concerns: list[str],
    improvements: list[str],
) -> str:
    lead = {
        "strong-go": "This is a strong idea worth building now.",
        "promising": "This is promising, but a few things still need proof.",
        "needs-work": "There's a real seed here, but it needs more validation before you commit.",
        "pivot": "As framed, this idea will struggle — it's worth reshaping before you invest.",
    }[verdict]
    parts = [
        f"You're solving for {a.customer or 'your customer'} with {a.solution or 'your solution'}. "
        + lead
    ]
    if strengths:
        parts.append(f"Your strongest signal is that {strengths[0].lower()}.")
    if concerns:
        parts.append(f"The biggest risk is {concerns[0].lower()}.")
    if improvements:
        parts.append(f"The single most important next move: {improvements[0].lower()}.")
    return " ".join(parts)


def _prompt(a: IdeaValidationAnswers, assessment: IdeaAssessment) -> str:
    return (
        f"PROBLEM: {a.problem}\n"
        f"CUSTOMER: {a.customer}\n"
        f"SOLUTION: {a.solution}\n"
        f"Market size: {a.market_size} | Willingness to pay: {a.willingness_to_pay} | "
        f"Differentiation: {a.differentiation} | Founder-market fit: {a.founder_market_fit}\n"
        f"Customer interviews: {a.customer_conversations} | Evidence: {a.problem_evidence} | "
        f"Product: {a.mvp_status} | Revenue: {a.revenue_status}\n"
        f"Ambition: {a.goal} | Team: {a.team}\n"
        f"Computed readiness: {assessment.readiness_score}/100 | "
        f"Detected stage: {assessment.detected_stage}\n\n"
        "Give your honest co-founder assessment."
    )
