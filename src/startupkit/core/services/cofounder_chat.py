"""Conversational AI Co-Founder — researches the idea live, then reacts like a real co-founder.

Each turn the co-founder runs a live web search on the idea's landscape (competitors, market,
comparable startups), then gives a direct, opinionated take grounded in that research: it validates
the idea, cites real sources, gives concrete next steps tied to the riskiest assumption, and asks
the ONE question that would most sharpen its reasoning. It knows it lives on StartupKit, so it
doesn't coach legal/ops busywork — the platform operationalizes that once the Company Object exists.
It captures facts as it goes and flags `ready` with a verdict when the wedge and first customer are
clear.

Powered by whatever ModelPort + SearchPort are wired. Falls back to a scripted advisor with no LLM.
"""

from __future__ import annotations

import json
from typing import Literal

from pydantic import BaseModel

from startupkit.ports.model import ModelPort
from startupkit.ports.search import SearchPort, SearchResult

_SYSTEM = (
    "You are the founder's co-founder on StartupKit — a sharp operator who has built, scaled, and "
    "sold startups. A founder just brought you their idea. Talk like a real co-founder in the "
    "room: direct, opinionated, specific, useful. No consultant-speak, no generic startup-blog "
    "advice.\n\n"
    "You are given LIVE WEB RESEARCH on the idea's landscape. Ground your read in it: name the "
    "real competitors and what they do, spot whether the space is crowded or open, and cite the "
    "relevant sources. If the research contradicts the founder's assumptions, say so plainly.\n\n"
    "WHAT STARTUPKIT DOES (point to it, don't coach it): once the founder builds their Company "
    "Object here, StartupKit operationalizes the company — incorporation, 83(b), equity & cap "
    "table, hiring, fundraising prep, contracts/docs, compliance and deadlines, a live health "
    "score and next-actions. So do NOT spend advice on legal/ops busywork; StartupKit handles it. "
    "Your job is the idea, the wedge, the first customer, traction.\n\n"
    "EVERY TURN:\n"
    "1. React to THEIR specific idea using the research — quote their actual problem/customer/"
    "solution and make a claim that could ONLY apply to this idea.\n"
    "2. Have an opinion. Pick a direction; say what you'd do and why. If it's crowded or weak, say "
    "so and name the sharper wedge.\n"
    "3. Give next steps tied to the single riskiest assumption right now — concrete enough to do "
    "this week (who exactly to talk to, what exactly to test, what number would prove it).\n"
    "4. Ask AT MOST one question — only if it genuinely sharpens your judgment — in 'question'. "
    "Often the right move is no question at all; don't ask just to ask.\n\n"
    "CONVERGE — a good co-founder conversation lands, it doesn't interrogate forever. You explore "
    "for a few turns, then CONCLUDE with a clear verdict and a build plan. Follow the PHASE "
    "instruction in each turn: in CONCLUDE phase you must stop asking and wrap up decisively.\n\n"
    "BANNED phrases unless made concrete and specific to this founder: 'talk to your customers', "
    "'do market research', 'build an MVP', 'add a feature', 'validate your idea', 'consider...', "
    "'you could...'.\n\n"
    "Capture concrete facts the founder states (interviews, willingness to pay, 83(b), co-founder, "
    "EIN, revenue). Sharpen problem/solution into refined_problem/refined_solution. Be honest on "
    "verdict; set ready=true only when the wedge and first customer are clear.\n\n"
    "Respond with ONLY a JSON object, nothing else:\n"
    '{"reply": "<your take — specific, opinionated, grounded in the research, under 110 words>", '
    '"question": "<the one question that would sharpen your judgment, or empty>", '
    '"next_steps": ["<concrete move tied to the riskiest assumption, doable this week>"], '
    '"examples": [{"company": "<real company>", "takeaway": "<what they did + what it means for '
    'THIS idea>"}], "facts": {"<snake_case_key>": "<value>"}, "refined_problem": "<sharper or '
    'empty>", "refined_solution": "<sharper or empty>", "riskiest_assumption": "<the single '
    'riskiest assumption to prove next, in one sentence>", "ready": <true or false>, '
    '"verdict": "<strong-go|promising|needs-work|pivot>"}'
)


class ChatTurn(BaseModel):
    role: Literal["user", "cofounder"]
    content: str


class CaseStudy(BaseModel):
    company: str
    takeaway: str


class Source(BaseModel):
    title: str
    url: str


class IdeaChatRequest(BaseModel):
    problem: str = ""
    customer: str = ""
    solution: str = ""
    facts: dict[str, str] = {}
    messages: list[ChatTurn] = []
    user_message: str


class IdeaChatResponse(BaseModel):
    reply: str
    facts: dict[str, str]
    question: str = ""
    next_steps: list[str] = []
    examples: list[CaseStudy] = []
    sources: list[Source] = []
    riskiest_assumption: str = ""
    refined_problem: str = ""
    refined_solution: str = ""
    ready: bool = False
    concluded: bool = False
    verdict: str = ""


async def idea_chat(
    req: IdeaChatRequest, model: ModelPort, search: SearchPort | None = None
) -> IdeaChatResponse:
    if model.descriptor.id == "template":
        return _fallback(req)

    results: list[SearchResult] = []
    if search is not None and search.id != "none":
        results = await search.search(_research_query(req), max_results=5)

    conclude = _should_conclude(req)
    raw = await model.complete(_SYSTEM, _prompt(req, results, conclude))
    data = _parse(raw)

    extracted = data.get("facts")
    new_facts: dict[str, str] = (
        {str(k): str(v) for k, v in extracted.items()} if isinstance(extracted, dict) else {}
    )
    merged = {**req.facts, **new_facts}
    verdict = str(data.get("verdict") or "")

    # Convergence is enforced in code, not left to the model: once we've gathered enough we stop
    # asking (no question) and endorse building when the verdict is positive.
    question = "" if conclude else str(data.get("question") or "")
    ready = bool(data.get("ready")) or (conclude and verdict in _GOOD)

    return IdeaChatResponse(
        reply=str(data.get("reply") or raw or "Let me help with that.").strip(),
        facts=merged,
        question=question,
        next_steps=_steps(data.get("next_steps")),
        examples=_examples(data.get("examples")),
        sources=[Source(title=r.title, url=r.url) for r in results[:4]],
        riskiest_assumption=str(data.get("riskiest_assumption") or ""),
        refined_problem=str(data.get("refined_problem") or ""),
        refined_solution=str(data.get("refined_solution") or ""),
        ready=ready,
        verdict=verdict,
        concluded=conclude,
    )


_GOOD = ("strong-go", "promising")
_WRAP_UP = (
    "i'm ready",
    "im ready",
    "i am ready",
    "let's build",
    "lets build",
    "build it",
    "stop asking",
    "no more question",
    "wrap up",
    "that's enough",
    "thats enough",
    "enough question",
    "give me the verdict",
    "final verdict",
    "just build",
)


def _should_conclude(req: IdeaChatRequest) -> bool:
    """Decide when the conversation should land. Deterministic so it always converges:

    - the founder asks to wrap up, OR
    - we've had enough back-and-forth (5+ founder turns), OR
    - we've captured a solid base of facts (5+) after a couple of exchanges.
    """
    if any(p in req.user_message.lower() for p in _WRAP_UP):
        return True
    founder_turns = sum(1 for m in req.messages if m.role == "user") + 1
    if founder_turns >= 5:
        return True
    return len(req.facts) >= 5 and founder_turns >= 3


def _research_query(req: IdeaChatRequest) -> str:
    core = " ".join(p for p in [req.solution or req.problem, req.customer] if p).strip()
    query = f"{core} competitors alternatives startups".strip()
    return query[:200] or req.user_message[:200]


def _steps(raw: object) -> list[str]:
    if not isinstance(raw, list):
        return []
    return [s.strip() for s in (str(x) for x in raw[:4]) if s.strip()]


def _examples(raw: object) -> list[CaseStudy]:
    if not isinstance(raw, list):
        return []
    out: list[CaseStudy] = []
    for item in raw[:3]:
        if isinstance(item, dict):
            company = str(item.get("company") or "").strip()
            takeaway = str(item.get("takeaway") or "").strip()
            if company and takeaway:
                out.append(CaseStudy(company=company, takeaway=takeaway))
    return out


def _prompt(req: IdeaChatRequest, results: list[SearchResult], conclude: bool) -> str:
    transcript = "\n".join(
        f"{'Founder' if t.role == 'user' else 'Co-founder'}: {t.content}" for t in req.messages
    )
    facts = ", ".join(f"{k}={v}" for k, v in req.facts.items()) or "none yet"
    if results:
        research = "\n".join(f"- {r.title} ({r.url})\n  {r.snippet}".rstrip() for r in results)
    else:
        research = "(no live results — use your own knowledge of the market)"
    if conclude:
        phase = (
            "PHASE: CONCLUDE. You now have enough — STOP asking. Set 'question' to empty. Wrap up "
            "decisively: give your honest final verdict, the 1-2 biggest strengths and the single "
            "biggest risk, and a concrete build plan in next_steps. If the verdict is strong-go or "
            "promising, tell them they're ready to build their Company Object on StartupKit; if "
            "it's needs-work or pivot, tell them the ONE thing to fix first. Do not ask a question."
        )
    else:
        phase = (
            "PHASE: EXPLORE. You may ask ONE sharp question in 'question' if it genuinely sharpens "
            "your judgment — otherwise leave it empty. Keep moving toward a verdict; don't stall."
        )
    return (
        f"CURRENT IDEA\nProblem: {req.problem}\nCustomer: {req.customer}\n"
        f"Solution: {req.solution}\n\n"
        f"LIVE WEB RESEARCH (just searched for this idea's landscape):\n{research}\n\n"
        f"KNOWN FACTS: {facts}\n\n"
        f"CONVERSATION SO FAR:\n{transcript or '(start)'}\n\n"
        f"FOUNDER'S NEW MESSAGE: {req.user_message}\n\n"
        f"{phase}\n\n"
        f"Answer as their co-founder — specific to THIS idea, grounded in the research, "
        f"opinionated, with concrete next steps. Respond with the JSON."
    )


def _parse(raw: str) -> dict[str, object]:
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return {}
    try:
        parsed = json.loads(raw[start : end + 1])
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


_STUCK = (
    "i don't know",
    "i dont know",
    "just help",
    "help me",
    "you do it",
    "give me",
    "solution from",
)


def _fallback(req: IdeaChatRequest) -> IdeaChatResponse:
    """No LLM available — still be an opinionated advisor with concrete steps, not a quizmaster."""
    if _should_conclude(req):
        return IdeaChatResponse(
            reply=(
                "I've got enough to make the call. The bones are here — a real pain and a clear "
                "customer. My read: promising, as long as you can show people will pay. Stop "
                "gathering and start proving it. Let's build your Company Object and run the "
                "first validation sprint."
            ),
            facts=req.facts,
            question="",
            next_steps=[
                "Lock your one target customer and the single sharpest pain you solve for them.",
                "Get 3 verbal commitments to pay before you build anything more.",
                "Build your Company Object on StartupKit so incorporation, 83(b) and cap table "
                "are ready when you raise.",
            ],
            riskiest_assumption=(
                "That enough of your target customers feel this pain strongly enough to pay."
            ),
            ready=True,
            concluded=True,
            verdict="promising",
        )

    msg = req.user_message.lower()
    stuck = any(s in msg for s in _STUCK)

    if stuck:
        reply = (
            "Here's my call: don't build the broad platform yet — pick the ONE moment your "
            "customer feels the pain most sharply and own that. Narrow beats broad early. Land "
            "five users who feel that exact pain, then expand outward from people who already "
            "love you."
        )
        steps = [
            "Write down the single sharpest pain in your customer's words, then DM 10 of them "
            "today and ask if it's real.",
            "Hand-deliver the solution to the first 3 manually (no product yet) and watch where "
            "they get stuck.",
            "Get one person to say yes to paying — even a verbal pre-commit — before you build.",
        ]
        examples = [
            CaseStudy(
                company="Airbnb",
                takeaway=(
                    "Door-knocked hosts in one city before scaling — your move is the same: go "
                    "narrow and manual first."
                ),
            ),
            CaseStudy(
                company="Stripe",
                takeaway=(
                    "Won one painful slice (developer payments) before the platform — pick your "
                    "one slice and nail it."
                ),
            ),
        ]
        return IdeaChatResponse(
            reply=reply,
            facts=req.facts,
            question="Which single customer feels this pain most acutely today?",
            next_steps=steps,
            examples=examples,
        )

    if "customer_interviews" not in req.facts:
        reply = (
            "Before anything else, the riskiest assumption is that this pain is real and urgent. "
            "Let's prove that this week with real conversations — how many target customers have "
            "you actually spoken to?"
        )
        steps = ["List 10 specific people who have this exact problem and message them this week."]
        question = "How many target customers have you spoken to so far?"
    elif "willingness_to_pay" not in req.facts:
        reply = (
            "Good — people feel the pain. Now the risk is whether it's wallet-deep. Test a direct "
            "'would you pre-pay?' ask. Has anyone signaled they'd actually pay, even verbally?"
        )
        steps = ["Ask 3 interested people to pre-commit to paying, and note who says yes."]
        question = "Has anyone signaled they'd actually pay for this?"
    else:
        reply = (
            "You've got real signal. The next risk is defensibility — what makes this hard for an "
            "incumbent to copy once it works?"
        )
        steps = ["Write one sentence on why you win even after a big player notices."]
        question = "What stops a big incumbent from copying this once it works?"
    return IdeaChatResponse(reply=reply, facts=req.facts, question=question, next_steps=steps)
