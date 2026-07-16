"""W5 · Brand & Product Foundation — the Brand engine.

Brand is not a folder of documents here. StartupKit reads the Company Object (problem, customer,
solution, differentiation, price signal, live competitor landscape), matches the company to a proven
**Brand Play** — backed by real, named brands the AI Co-Founder cites — and generates a living
**Brand Core** grounded in that play. The founder edits it; the site/deck/one-pager read from it.

Everything degrades gracefully and works key-free: the Brand Core is built deterministically from
the Company Object, and — when a model is available (Groq/Claude) — the LLM rewrites the narrative
fields grounded in the chosen play and live research. No model, no key, still a usable draft.
"""

from __future__ import annotations

import json

from pydantic import BaseModel

from startupkit.core.company_object.brand_types import (
    BrandCore,
    BrandState,
    ColorSwatch,
    PresenceItem,
    VisualSystem,
)
from startupkit.core.company_object.projections.snapshot import CompanySnapshot
from startupkit.ports.model import ModelPort
from startupkit.ports.search import SearchPort

# ============================ Tiered Brand Plays (the case-study library) ========================


class BrandPlay(BaseModel):
    """A proven brand strategy, backed by real named brands the co-founder points to."""

    id: str
    name: str
    move: str  # the strategic move in one line
    why: str  # why it works
    when: str  # when the co-founder picks it
    examples: list[str]  # real brands that ran this play
    signals: list[str]  # keywords in the Company Object that suggest this play
    values: list[str]  # default brand values this play implies
    voice: str  # default voice this play implies


_PLAYS: dict[str, BrandPlay] = {
    "category-creator": BrandPlay(
        id="category-creator",
        name="Category Creator",
        move="Invent and name a new category so you have no direct rivals.",
        why="If buyers have no box to put you in, you define the box — and become the default.",
        when="Your solution doesn't fit an existing category, or you're educating a new market.",
        examples=[
            "Notion (all-in-one workspace)",
            "HubSpot (inbound marketing)",
            "Salesforce (no software)",
        ],
        signals=[
            "new category",
            "first",
            "reimagine",
            "novel",
            "ai-native",
            "no one",
            "unlike anything",
            "redefine",
        ],
        values=["Clarity", "Ambition", "Education"],
        voice="Visionary but plain-spoken — you name the new way and make it obvious.",
    ),
    "challenger": BrandPlay(
        id="challenger",
        name="Challenger / Underdog",
        move="Attack a bloated incumbent as the honest, simpler, faster alternative.",
        why="A crowded category with a hated leader is an opening — be the anti-incumbent.",
        when="You're entering a crowded market with a legacy incumbent customers complain about.",
        examples=[
            "Superhuman (vs Gmail)",
            "Dollar Shave Club (vs Gillette)",
            "Basecamp (vs enterprise PM)",
        ],
        signals=[
            "crowded",
            "competitor",
            "alternative",
            "replace",
            "legacy",
            "incumbent",
            "better than",
            "vs ",
        ],
        values=["Honesty", "Speed", "Simplicity"],
        voice="Direct and a little irreverent — you say what the incumbent won't.",
    ),
    "premium": BrandPlay(
        id="premium",
        name="Premium / Aspirational",
        move="Charge more, look better, and sell identity and craft — not a feature list.",
        why="High-intent buyers pay for how a product makes them feel; design is the moat.",
        when="High willingness-to-pay, a design-led wedge, or power users who value craft.",
        examples=["Linear (issue tracking)", "Apple", "Superhuman (email)"],
        signals=[
            "premium",
            "enterprise",
            "executive",
            "power user",
            "craft",
            "design",
            "luxury",
            "high-end",
        ],
        values=["Craft", "Focus", "Excellence"],
        voice="Confident and spare — every word and pixel is deliberate.",
    ),
    "community-led": BrandPlay(
        id="community-led",
        name="Community-Led",
        move="Make the community the brand — users evangelize and pull others in.",
        why="Bottoms-up adoption compounds: the brand grows through its users, not its ad budget.",
        when="Developer, creator, or prosumer audience with a natural viral or network loop.",
        examples=["Figma (designers)", "Discord (communities)", "GitHub (developers)"],
        signals=[
            "developer",
            "api",
            "open source",
            "open-source",
            "community",
            "creator",
            "designer",
            "plugin",
            "marketplace",
            "network",
        ],
        values=["Openness", "Generosity", "Belonging"],
        voice="Warm, in-group, builder-to-builder — you talk with users, not at them.",
    ),
    "trust-first": BrandPlay(
        id="trust-first",
        name="Trust-First",
        move="Signal safety, compliance, and expertise before anything else.",
        why="When money, health, or the law is on the line, trust is the product.",
        when="Fintech, health, legal, security, or B2B buyers who are risk-averse.",
        examples=["Stripe (payments)", "Mercury (banking)", "Ramp (spend)"],
        signals=[
            "fintech",
            "finance",
            "bank",
            "payment",
            "health",
            "medical",
            "insurance",
            "legal",
            "security",
            "compliance",
            "hipaa",
            "payroll",
            "data",
        ],
        values=["Trust", "Precision", "Security"],
        voice="Calm, precise, and reassuring — you sound like the adult in the room.",
    ),
}


class PlayMatch(BaseModel):
    play_id: str
    name: str
    move: str
    examples: list[str]
    rationale: str  # why this play fits THIS company
    score: int


# ===================== Brand case studies (the co-founder's evidence per step) ===================


class BrandCase(BaseModel):
    """A real brand's move at a specific W5 step — what they did and the lesson for you."""

    brand: str
    play_id: str
    steps: list[str]  # which W5 steps it teaches: "define" | "design" | "deploy"
    move: str  # what the brand actually did
    takeaway: str  # the lesson to apply


_BRAND_CASES: list[BrandCase] = [
    # Trust-First
    BrandCase(
        brand="Stripe",
        play_id="trust-first",
        steps=["define", "design"],
        move="Positioned as developer-first payments; led with beautiful docs and clear pricing.",
        takeaway="Make competence the brand — docs, uptime, and clarity signal trust louder "
        "than adjectives.",
    ),
    BrandCase(
        brand="Mercury",
        play_id="trust-first",
        steps=["design"],
        move="Chose a calm, bank-grade visual identity with zero startup gimmicks.",
        takeaway="In fintech, restraint reads as safety. Look institutional, not playful.",
    ),
    BrandCase(
        brand="Ramp",
        play_id="trust-first",
        steps=["deploy", "define"],
        move="Led the homepage with one hard number — 'save 3.5% on average'.",
        takeaway="Trust converts on proof. Put a concrete, verifiable outcome on your hero.",
    ),
    # Challenger
    BrandCase(
        brand="Superhuman",
        play_id="challenger",
        steps=["define"],
        move="Named the enemy (slow, bloated email) and sold one thing: speed.",
        takeaway="Pick the incumbent's worst weakness and own the exact opposite.",
    ),
    BrandCase(
        brand="Dollar Shave Club",
        play_id="challenger",
        steps=["deploy"],
        move="Launched with one irreverent $4,500 video that did all the positioning.",
        takeaway="A challenger's launch can be the brand — be bold, funny, and unmistakably clear.",
    ),
    BrandCase(
        brand="Basecamp",
        play_id="challenger",
        steps=["design"],
        move="Used opinionated, plain, anti-enterprise design and writing.",
        takeaway="Look and sound deliberately different from the incumbent — sameness kills "
        "a challenger.",
    ),
    # Premium
    BrandCase(
        brand="Linear",
        play_id="premium",
        steps=["design", "define"],
        move="Obsessed over craft — a fast, dark, elegant UI that felt built for pros.",
        takeaway="Design IS the pitch. Every pixel should signal quality and speed.",
    ),
    BrandCase(
        brand="Superhuman",
        play_id="premium",
        steps=["deploy"],
        move="Stayed invite-only with white-glove 1:1 onboarding.",
        takeaway="Scarcity and service make premium feel premium — don't open the floodgates.",
    ),
    BrandCase(
        brand="Apple",
        play_id="premium",
        steps=["define"],
        move="Sold identity and feeling ('Think Different'), never a spec sheet.",
        takeaway="Lead with who the customer becomes, not the feature list.",
    ),
    # Community-Led
    BrandCase(
        brand="Figma",
        play_id="community-led",
        steps=["deploy", "define"],
        move="Free tier + multiplayer editing made designers invite each other in.",
        takeaway="Build the invite loop into the product — the community becomes your marketing.",
    ),
    BrandCase(
        brand="Discord",
        play_id="community-led",
        steps=["design"],
        move="Built a playful in-group visual language (Wumpus, memes, nitro).",
        takeaway="Give the community symbols and a language to remix and spread.",
    ),
    BrandCase(
        brand="GitHub",
        play_id="community-led",
        steps=["define"],
        move="Made developers belong with the Octocat and 'social coding'.",
        takeaway="Name the belonging, not just the tool — identity retains users.",
    ),
    # Category Creator
    BrandCase(
        brand="Notion",
        play_id="category-creator",
        steps=["define"],
        move="Coined 'all-in-one workspace' to escape the crowded note-app box.",
        takeaway="Name the category so buyers stop comparing you to point tools.",
    ),
    BrandCase(
        brand="HubSpot",
        play_id="category-creator",
        steps=["deploy", "define"],
        move="Invented 'inbound marketing' and taught it via a free academy.",
        takeaway="Educate the market you're creating — content is the moat around a new category.",
    ),
    BrandCase(
        brand="Salesforce",
        play_id="category-creator",
        steps=["design"],
        move="Put its thesis in the logo itself — 'No Software' in a red circle-slash.",
        takeaway="Make your category argument visible in the identity, not just the copy.",
    ),
]


class CoachTip(BaseModel):
    """The AI co-founder's guidance for one W5 step, backed by real brand case studies."""

    step: str
    headline: str
    guidance: str
    watch_out: str
    cases: list[BrandCase]
    source: str  # "ai" | "engine"


# focus text per step — the deterministic (key-free) coaching, enriched by the LLM when available.
_STEP_FOCUS: dict[str, tuple[str, str, str]] = {
    "define": (
        "Nail your positioning in one sentence",
        "The whole brand hangs on one sentence — make the shift you create unmistakable, and "
        "everything downstream inherits it. Study how these brands framed their promise:",
        "Don't list features. Name the one change you make true for your customer.",
    ),
    "design": (
        "Make the identity say your play before anyone reads",
        "Your palette, type, and logo should signal the promise before a single word is read. "
        "Match the feeling to your Brand Play — see how these brands did it:",
        "Don't just decorate. Every visual choice should reinforce one feeling.",
    ),
    "deploy": (
        "Lead with the one thing",
        "Your landing page has one job: land the positioning and drive a single action. Cut "
        "anything that isn't the wedge. Learn from these launches:",
        "Don't bury the hook — your hero should make the customer feel understood in five seconds.",
    ),
}


def brand_cases_for(play_id: str, step: str) -> list[BrandCase]:
    """The most relevant case studies for a play at a step (falls back to same-step cases)."""
    exact = [c for c in _BRAND_CASES if c.play_id == play_id and step in c.steps]
    if exact:
        return exact[:2]
    return [c for c in _BRAND_CASES if step in c.steps][:2]


_COACH_SYSTEM = (
    "You are the founder's AI co-founder, guiding them through one step of building their brand. "
    "Be specific to THIS company and warm but blunt. Reference at least one of the given case "
    "studies by name. No buzzwords. Return ONLY JSON with keys: guidance (2-3 sentences), "
    "watch_out (one sentence naming the most common mistake at this step)."
)


def _coach_prompt(snap: CompanySnapshot, play: BrandPlay, step: str, cases: list[BrandCase]) -> str:
    case_lines = "\n".join(f"- {c.brand}: {c.move} Lesson: {c.takeaway}" for c in cases)
    return (
        f"Company: {snap.name} — {snap.one_liner}\nCustomer: {snap.customer}\n"
        f"Problem: {snap.problem}\nBrand Play: {play.name} ({play.move})\nStep: {step}\n"
        f"Case studies you can cite:\n{case_lines}\n\n"
        f"Guide them through the '{step}' step."
    )


async def brand_coach(
    snap: CompanySnapshot,
    play_id: str = "",
    step: str = "define",
    model: ModelPort | None = None,
) -> CoachTip:
    """Per-step brand guidance from the AI co-founder, grounded in real case studies."""
    step = step if step in _STEP_FOCUS else "define"
    ranked = match_plays(snap)
    chosen = next((m for m in ranked if m.play_id == play_id), ranked[0])
    play = _PLAYS[chosen.play_id]
    cases = brand_cases_for(chosen.play_id, step)
    headline, guidance, watch_out = _STEP_FOCUS[step]
    tip = CoachTip(
        step=step,
        headline=headline,
        guidance=guidance,
        watch_out=watch_out,
        cases=cases,
        source="engine",
    )
    if model is not None:
        try:
            raw = await model.complete(_COACH_SYSTEM, _coach_prompt(snap, play, step, cases))
        except Exception:
            raw = ""
        parsed = _parse(raw)
        g, w = parsed.get("guidance"), parsed.get("watch_out")
        if isinstance(g, str) and g.strip():
            tip.guidance = g.strip()
            tip.source = "ai"
        if isinstance(w, str) and w.strip():
            tip.watch_out = w.strip()
    return tip


class ChatReply(BaseModel):
    reply: str
    source: str  # "ai" | "engine"


_CHAT_SYSTEM = (
    "You are the founder's AI co-founder and an expert brand strategist. Answer their branding "
    "question concretely and specifically for THIS company and its Brand Core — positioning, "
    "naming, messaging, visual identity, or launch. Be warm, blunt, and practical; 2-5 sentences, "
    "no fluff or buzzwords. If useful, name a real brand as an example."
)


def _chat_prompt(snap: CompanySnapshot, message: str, history: list[str]) -> str:
    core = snap.brand.core
    ctx = (
        f"Company: {snap.name} — {snap.one_liner}\nCustomer: {snap.customer}\n"
        f"Problem: {snap.problem}\nSolution: {snap.solution}\n"
        f"Brand Play: {core.play_name}\nPositioning: {core.positioning}\n"
        f"Tagline: {core.tagline}\nVoice: {core.voice}\n"
    )
    convo = "\n".join(history[-6:])
    return f"{ctx}\nConversation so far:\n{convo}\n\nFounder asks: {message}"


async def brand_chat(
    snap: CompanySnapshot,
    message: str,
    history: list[str] | None = None,
    model: ModelPort | None = None,
) -> ChatReply:
    """A conversational branding Q&A with the AI co-founder, grounded in the Brand Core."""
    history = history or []
    if model is not None and message.strip():
        try:
            raw = await model.complete(_CHAT_SYSTEM, _chat_prompt(snap, message, history))
        except Exception:
            raw = ""
        if raw.strip():
            return ChatReply(reply=raw.strip(), source="ai")
    # Deterministic fallback — still useful, points to the Brand Core they've built.
    core = snap.brand.core
    if core.positioning:
        reply = (
            f"Here's your north star: {core.positioning} Anchor every branding decision to that. "
            f"For '{message.strip()}', start from your {core.play_name or 'Brand Play'} and keep "
            "the voice consistent. Use the per-step coaching above for worked examples."
        )
    else:
        reply = (
            "Generate your Brand Core first (the Define step) — once you've picked a Brand Play I "
            "can give you specific, grounded branding advice instead of generic tips."
        )
    return ChatReply(reply=reply, source="engine")


def _company_blob(snap: CompanySnapshot) -> str:
    parts = [
        snap.industry,
        snap.one_liner,
        snap.problem,
        snap.customer,
        snap.solution,
        *[f"{k} {v}" for k, v in snap.facts.items()],
    ]
    return " ".join(p for p in parts if p).lower()


def match_plays(snap: CompanySnapshot) -> list[PlayMatch]:
    """Rank the Brand Plays for this company from its Company Object. Never empty."""
    blob = _company_blob(snap)
    wtp = " ".join(v for k, v in snap.facts.items() if "pay" in k.lower() or "price" in k.lower())
    matches: list[PlayMatch] = []
    for play in _PLAYS.values():
        hits = [s for s in play.signals if s in blob]
        score = len(hits) * 2
        if play.id == "premium" and any(t in wtp for t in ("$", "paying", "loi", "commit")):
            score += 3
        if play.id == "category-creator":
            score += 1  # gentle fallback so an open, undefined market lands here
        reason = _rationale(play, hits, snap)
        matches.append(
            PlayMatch(
                play_id=play.id,
                name=play.name,
                move=play.move,
                examples=play.examples,
                rationale=reason,
                score=score,
            )
        )
    matches.sort(key=lambda m: m.score, reverse=True)
    return matches


def _rationale(play: BrandPlay, hits: list[str], snap: CompanySnapshot) -> str:
    who = snap.customer or "your buyers"
    ex = play.examples[0].split(" (")[0]  # the lead example brand, name only
    if play.id == "trust-first" and hits:
        return (
            f"You're in a {hits[0]} space — {who} won't adopt until they trust you, "
            f"so lead with credibility like {ex}."
        )
    if play.id == "challenger" and hits:
        return (
            "You're entering a crowded category — position against the incumbent as the "
            f"simpler, faster choice, the way {ex} did."
        )
    if play.id == "community-led" and hits:
        return f"Your audience ({who}) spreads tools peer-to-peer — make them the brand, like {ex}."
    if play.id == "premium" and hits:
        return (
            "There's real willingness to pay here — win on craft and identity, not a "
            f"feature list, like {ex}."
        )
    if play.id == "category-creator":
        return f"Your market isn't clearly defined yet — name the category and own it, like {ex}."
    # No strong signal for this play in the Company Object — show when it would fit instead.
    return f"Consider this if: {play.when[0].lower()}{play.when[1:]}"


# ================================== Brand Core generation ========================================


def _short(text: str, words: int = 14) -> str:
    parts = text.split()
    return " ".join(parts[:words]) + ("…" if len(parts) > words else "")


def _deterministic_core(snap: CompanySnapshot, play: BrandPlay) -> BrandCore:
    """A real, usable Brand Core built from the Company Object — works with no model/key."""
    name = snap.name or "The company"
    who = snap.customer or "modern teams"
    problem = _short(snap.problem or "an expensive, painful workflow", 12)
    solution = _short(snap.solution or "a faster, simpler way to get it done", 14)
    category = snap.industry or "software"
    if play.id == "category-creator":
        category = f"new kind of {category}"
    alt = "the status quo"
    diff = (
        snap.facts.get("differentiation")
        or snap.facts.get("wedge")
        or play.move.rstrip(".").lower()
    )
    positioning = (
        f"For {who} who struggle with {problem}, {name} is a {category} that delivers "
        f"{_short(solution, 10)}. Unlike {alt}, {name} {_short(diff, 12)}."
    )
    return BrandCore(
        play_id=play.id,
        play_name=play.name,
        play_rationale="",  # filled by the caller from the PlayMatch
        examples=play.examples,
        mission=f"To help {who} overcome {problem}.",
        vision=f"A world where {who} no longer accept {alt} for this.",
        values=list(play.values),
        icp=who,
        category=category,
        positioning=positioning,
        voice=play.voice,
        tagline=_tagline(name, solution, play),
        pitch=f"{name} gives {who} {_short(solution, 12)}.",
        pillars=_pillars(solution, play),
        source="engine",
    )


def _tagline(name: str, solution: str, play: BrandPlay) -> str:
    if play.id == "challenger":
        return f"{name}. The simpler way."
    if play.id == "premium":
        return f"{name}. Made with care."
    if play.id == "community-led":
        return "Built with you."
    if play.id == "trust-first":
        return f"{name}. Built to be trusted."
    return _short(solution, 6).capitalize()


def _pillars(solution: str, play: BrandPlay) -> list[str]:
    base = {
        "category-creator": [
            "A new way, clearly named",
            "Obvious value from minute one",
            "The default choice as the category grows",
        ],
        "challenger": [
            "Faster than the incumbent",
            "Honest, no lock-in",
            "Made for how you actually work",
        ],
        "premium": ["Crafted, not assembled", "Powerful yet effortless", "Worth paying for"],
        "community-led": [
            "Built in the open",
            "Your community, amplified",
            "Better because you're here",
        ],
        "trust-first": [
            "Secure and compliant by default",
            "Precise and reliable",
            "Backed by real expertise",
        ],
    }
    return base.get(play.id, ["Simple", "Fast", "Trusted"])


_CORE_SYSTEM = (
    "You are a startup brand strategist. Given a company and a chosen Brand Play, write a tight, "
    "specific Brand Core. Be concrete to THIS company — reference its actual customer and problem. "
    "No fluff, no buzzwords ('synergy', 'revolutionary', 'seamless'). Return ONLY JSON with keys: "
    "mission, vision, values (3 strings), icp, category, positioning, voice, tagline, pitch, "
    "pillars (3 strings). The positioning must follow: 'For [who] who [problem], [Company] is a "
    "[category] that [benefit]. Unlike [alternative], [Company] [differentiator].'"
)


def _core_prompt(snap: CompanySnapshot, play: BrandPlay, sources: list[str]) -> str:
    facts = "; ".join(f"{k}: {v}" for k, v in list(snap.facts.items())[:12])
    research = ("\nLive competitor research: " + "; ".join(sources)) if sources else ""
    return (
        f"Company: {snap.name}\nOne-liner: {snap.one_liner}\nProblem: {snap.problem}\n"
        f"Customer: {snap.customer}\nSolution: {snap.solution}\nIndustry: {snap.industry}\n"
        f"Known facts: {facts}\n\nChosen Brand Play: {play.name} — {play.move} "
        f"(examples: {', '.join(play.examples)}). Ground the brand in this play.{research}"
    )


async def generate_brand_core(
    snap: CompanySnapshot,
    play_id: str = "",
    model: ModelPort | None = None,
    search: SearchPort | None = None,
) -> BrandCore:
    """Generate the Brand Core: deterministic base, then LLM-rewritten narrative when available."""
    ranked = match_plays(snap)
    chosen = next((m for m in ranked if m.play_id == play_id), ranked[0])
    play = _PLAYS[chosen.play_id]
    core = _deterministic_core(snap, play)
    core.play_rationale = chosen.rationale

    # Ground the LLM read in live competitor research when a search provider is wired.
    sources: list[str] = []
    if search is not None and (snap.solution or snap.customer):
        query = f"{snap.solution or snap.one_liner} for {snap.customer} competitors alternatives"
        try:
            results = await search.search(query, max_results=4)
            sources = [r.url for r in results]
        except Exception:
            sources = []
    core.sources = sources

    if model is not None:
        try:
            raw = await model.complete(_CORE_SYSTEM, _core_prompt(snap, play, sources))
        except Exception:
            raw = ""
        parsed = _parse(raw)
        if parsed:
            _merge_ai(core, parsed)
            core.source = "ai"
    return core


def _parse(raw: str) -> dict[str, object]:
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return {}
    try:
        parsed = json.loads(raw[start : end + 1])
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def _merge_ai(core: BrandCore, ai: dict[str, object]) -> None:
    def s(key: str) -> str:
        v = ai.get(key)
        return v.strip() if isinstance(v, str) else ""

    def lst(key: str) -> list[str]:
        v = ai.get(key)
        return [str(x).strip() for x in v if str(x).strip()][:3] if isinstance(v, list) else []

    narrative = ("mission", "vision", "icp", "category", "positioning", "voice", "tagline", "pitch")
    for key in narrative:
        if s(key):
            setattr(core, key, s(key))
    if lst("values"):
        core.values = lst("values")
    if lst("pillars"):
        core.pillars = lst("pillars")


# ================================== Visual system (deterministic) ================================

# Each play carries a palette mood + type pairing. Rendered as a live style tile, handed to Figma.
_VISUALS: dict[str, tuple[list[ColorSwatch], str, str, str]] = {
    "category-creator": (
        [
            ColorSwatch(name="Signal", hex="#4C46E8", role="primary"),
            ColorSwatch(name="Ink", hex="#12131A", role="ink"),
            ColorSwatch(name="Paper", hex="#F7F7FB", role="paper"),
            ColorSwatch(name="Spark", hex="#E8A33D", role="accent"),
        ],
        "Bricolage Grotesque",
        "Inter",
        "A distinctive, ownable wordmark — invent a mark for the category you're naming, "
        "not a generic tech icon.",
    ),
    "challenger": (
        [
            ColorSwatch(name="Bold", hex="#E5352B", role="primary"),
            ColorSwatch(name="Ink", hex="#141414", role="ink"),
            ColorSwatch(name="Paper", hex="#FFFFFF", role="paper"),
            ColorSwatch(name="Steel", hex="#4A5568", role="support"),
        ],
        "Archivo",
        "Inter",
        "A loud, high-contrast wordmark — confident and a little rebellious. "
        "Avoid anything that looks corporate.",
    ),
    "premium": (
        [
            ColorSwatch(name="Near-black", hex="#0E0E10", role="primary"),
            ColorSwatch(name="Ink", hex="#1C1C1F", role="ink"),
            ColorSwatch(name="Bone", hex="#F4F2EE", role="paper"),
            ColorSwatch(name="Brass", hex="#B08948", role="accent"),
        ],
        "Fraunces",
        "Inter",
        "A restrained, elegant wordmark with generous space — every detail deliberate. "
        "Monochrome first.",
    ),
    "community-led": (
        [
            ColorSwatch(name="Friendly", hex="#5865F2", role="primary"),
            ColorSwatch(name="Ink", hex="#1E1F22", role="ink"),
            ColorSwatch(name="Paper", hex="#FAFAFB", role="paper"),
            ColorSwatch(name="Warm", hex="#F2A900", role="accent"),
        ],
        "Space Grotesk",
        "Inter",
        "An approachable, sticker-friendly mark that reads well small — communities remix it, "
        "so keep it simple.",
    ),
    "trust-first": (
        [
            ColorSwatch(name="Deep", hex="#0B4A6F", role="primary"),
            ColorSwatch(name="Ink", hex="#0F172A", role="ink"),
            ColorSwatch(name="Paper", hex="#F8FAFC", role="paper"),
            ColorSwatch(name="Verify", hex="#178A5B", role="accent"),
        ],
        "IBM Plex Sans",
        "Inter",
        "A solid, geometric wordmark that reads as institutional and safe — no gimmicks, "
        "high legibility.",
    ),
}


def generate_visual_system(core: BrandCore) -> VisualSystem:
    palette, display, body, logo = _VISUALS.get(core.play_id, _VISUALS["category-creator"])
    return VisualSystem(
        palette=list(palette), type_display=display, type_body=body, logo_direction=logo
    )


# ================================== Presence / availability ======================================


def _slug(name: str) -> str:
    return "".join(c for c in name.lower() if c.isalnum())


async def check_presence(name: str, search: SearchPort | None = None) -> list[PresenceItem]:
    """Heuristic availability read for the brand name (domain / social handle / trademark).

    This is a *signal*, not a registration check — StartupKit never registers on your behalf. We
    look for an established web presence under the exact name; a strong match suggests it's taken.
    """
    slug = _slug(name)
    if not slug:
        return []
    items = [
        PresenceItem(
            kind="domain",
            handle=f"{slug}.com",
            status="unknown",
            detail="Check + register at Namecheap, Porkbun, or name.com.",
        ),
        PresenceItem(
            kind="handle",
            handle=f"@{slug}",
            status="unknown",
            detail="Reserve on X, LinkedIn, GitHub, and Instagram before launch.",
        ),
        PresenceItem(
            kind="trademark",
            handle=name,
            status="unknown",
            detail="Search the USPTO TESS database; file via Trademarkia or an attorney.",
        ),
    ]
    if search is not None:
        try:
            results = await search.search(f'"{name}" official site', max_results=4)
            taken = any(slug in r.url.lower().replace("-", "") for r in results)
            if taken:
                for it in items:
                    if it.kind in ("domain", "handle"):
                        it.status = "taken"
                        it.detail = "An established presence uses this name — consider a variant."
        except Exception:
            pass
    return items


# ================================== Brand Health Score ===========================================


class BrandDimension(BaseModel):
    name: str
    score: int
    hint: str


class BrandHealth(BaseModel):
    score: int  # 0..100
    label: str  # Strong | Emerging | Weak
    dimensions: list[BrandDimension]


def brand_health(state: BrandState) -> BrandHealth:
    c, v, presence = state.core, state.visual, state.presence

    def pct(parts: list[bool]) -> int:
        return round(100 * sum(1 for p in parts if p) / len(parts)) if parts else 0

    dims = [
        BrandDimension(
            name="Identity Clarity",
            hint="Mission, vision, values, and ICP defined",
            score=pct([bool(c.mission), bool(c.vision), len(c.values) >= 3, bool(c.icp)]),
        ),
        BrandDimension(
            name="Messaging Strength",
            hint="Tagline, pitch, and 3 message pillars",
            score=pct([bool(c.tagline), bool(c.pitch), len(c.pillars) >= 3]),
        ),
        BrandDimension(
            name="Visual Consistency",
            hint="Palette, type pairing, and logo direction",
            score=pct(
                [len(v.palette) >= 3, bool(v.type_display and v.type_body), bool(v.logo_direction)]
            ),
        ),
        BrandDimension(
            name="Market Positioning",
            hint="A clear positioning statement + Brand Play",
            score=pct([bool(c.positioning), bool(c.play_id), bool(c.category)]),
        ),
        BrandDimension(
            name="Digital Presence",
            hint="Domain + social handles checked",
            score=pct(
                [
                    any(p.kind == "domain" for p in presence),
                    any(p.kind == "handle" for p in presence),
                ]
            ),
        ),
        BrandDimension(
            name="Brand Protection",
            hint="Trademark searched, domain secured",
            score=pct(
                [
                    any(p.kind == "trademark" for p in presence),
                    any(p.kind == "domain" and p.status != "unknown" for p in presence),
                ]
            ),
        ),
    ]
    score = round(sum(d.score for d in dims) / len(dims))
    label = "Strong" if score >= 75 else "Emerging" if score >= 40 else "Weak"
    return BrandHealth(score=score, label=label, dimensions=dims)
