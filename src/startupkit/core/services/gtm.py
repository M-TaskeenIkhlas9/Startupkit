"""W7 · Go-To-Market engine — draft the revenue engine from what StartupKit already knows.

Same contract as the W5 brand engine (`brand.py`): a deterministic base that always works with no
API key, then an LLM rewrite of the narrative parts when a model is wired. The founder edits the
draft; they never author it from a blank form.

Boundary: W5 produces the file, W7 produces the reply. Everything here reads the Brand Core
(ICP, positioning, category, voice) and the validated idea (problem, customer, solution) — it never
re-asks for them.
"""

from __future__ import annotations

import json
from datetime import UTC, date, datetime, timedelta

from pydantic import BaseModel, Field

from startupkit.core.company_object.gtm_types import (
    Campaign,
    ContentIdea,
    GtmState,
    GtmStrategy,
    PricingTier,
    Sequence,
    TargetAccount,
    Task,
)
from startupkit.core.company_object.projections.snapshot import CompanySnapshot
from startupkit.core.services.brand import ChatReply
from startupkit.ports.model import ModelPort
from startupkit.ports.search import SearchPort


class GtmDraft(BaseModel):
    """What the generator hands back. Not persisted until the founder saves it."""

    strategy: GtmStrategy = Field(default_factory=GtmStrategy)
    triggers: list[str] = Field(default_factory=list)
    disqualifiers: str = ""
    sequences: list[Sequence] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)
    campaigns: list[Campaign] = Field(default_factory=list)
    tasks: list[Task] = Field(default_factory=list)
    source: str = "engine"  # engine | ai


# --- motion selection ---------------------------------------------------------------------------
# The first fork. Server-side we can't know ACV before pricing exists, so we infer from stage +
# what the company sells, and say so. The founder confirms it in the Strategy tool.

_MOTION_CHANNELS: dict[str, list[str]] = {
    "outbound": ["Outbound email", "LinkedIn", "Warm intros"],
    "plg": ["Product signup", "SEO content", "Community"],
    "hybrid": ["Outbound (mid-market)", "PLG trial (SMB)", "Content"],
}


def _pick_motion(snap: CompanySnapshot) -> tuple[str, str]:
    """Infer the motion from the Company Object. Deterministic and explainable."""
    pricing = snap.gtm.pricing
    if pricing.tiers:
        prices = [_num(t.price) for t in pricing.tiers if _num(t.price) > 0]
        acv = max(prices) * 12 if prices else 0
        if acv >= 25000:
            return "outbound", (
                f"Your top tier annualises to about ${acv:,.0f}. Above ~$25k a product can't close "
                "the deal on its own — someone has to handle objections and build the champion."
            )
        if acv and acv < 10000:
            return "plg", (
                f"Your top tier annualises to about ${acv:,.0f}. Under ~$10k the economics won't "
                "fund a salesperson, so the product has to prove itself."
            )
        if acv:
            return "hybrid", (
                f"About ${acv:,.0f} a year sits between the two clean cases — run self-serve "
                "at the small end and outbound at the top of your ICP."
            )
    if snap.stage in ("pre-founder", "discovery", "problem-solution-fit"):
        return "outbound", (
            "You're early enough that nobody is searching for you yet. Go get the conversations "
            "by hand — inbound can't start until there's something to find."
        )
    return "hybrid", (
        "No pricing set yet, so this is a starting guess from your stage. Set your tiers in the "
        "Pricing Lab and this sharpens up."
    )


def _num(s: str) -> float:
    cleaned = "".join(c for c in str(s) if c.isdigit() or c == ".")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


# --- deterministic draft ------------------------------------------------------------------------

_BASE_TRIGGERS = [
    "Raised a round in the last 6 months",
    "Hired a new leader for this function",
    "Posting jobs for the team you serve",
]


def _deterministic(snap: CompanySnapshot) -> GtmDraft:
    core = snap.brand.core
    name = snap.name or "we"
    icp = core.icp or snap.customer or "teams like yours"
    value = core.positioning or snap.solution or snap.one_liner or "we help teams move faster"
    category = core.category or snap.industry or "your category"
    motion, why = _pick_motion(snap)

    draft = GtmDraft()
    draft.strategy = GtmStrategy(
        motion=motion,
        motion_rationale=why,
        objective="first_customers",
        channels=_MOTION_CHANNELS[motion],
        summary=f"{motion.capitalize()} motion to the first 10 paying customers in {category}.",
    )
    draft.triggers = list(_BASE_TRIGGERS)
    draft.disqualifiers = "Pre-revenue · no budget owner · outside your ICP"

    draft.sequences = [
        Sequence(
            name="Cold outbound v1",
            channel="email",
            steps=[
                f"Day 1 — Subject: {{{{trigger}}}}?\n\nHi {{{{first}}}}, saw {{{{account}}}} "
                f"{{{{trigger_lower}}}}. {value}\n\nWorth 15 minutes?",
                f"Day 3 — Subject: one number\n\n{{{{first}}}} — most {icp} we talk to care about "
                "one thing: time back. Happy to show you in 15 minutes.",
                f"Day 7 — Subject: closing the loop\n\nNo reply, so I'll assume the timing's "
                f"wrong, {{{{first}}}}. If that changes, {name} is here.",
            ],
        )
    ]
    draft.objections = [
        "Too expensive — anchor against the cost of the status quo, not a rival's list price.",
        "We're fine as we are — the workaround is the real competitor; ask what it costs to break.",
        "Ask me next quarter — usually the trigger isn't real; find the urgency or disqualify.",
    ]

    today = datetime.now(UTC).date()
    draft.campaigns = [
        Campaign(
            id="c-first-10",
            name="First 10 customers",
            goal=f"Land the first 10 paying customers for {name}.",
            channel="outbound" if motion != "plg" else "content",
            start=today.isoformat(),
            end=(today + timedelta(days=90)).isoformat(),
            status="planning",
            sequence="Cold outbound v1",
        )
    ]
    draft.tasks = _plan_tasks(motion, today)
    return draft


def _plan_tasks(motion: str, today: date) -> list[Task]:
    """The 90-day plan as tasks you can tick, not prose you skim."""
    d = lambda n: (today + timedelta(days=n)).isoformat()  # noqa: E731
    if motion == "plg":
        rows: list[tuple[str, str, int, str]] = [
            ("Lock pricing and the free tier", "pricing", 7, "high"),
            ("Point the W5 site at a signup + capture form", "landing", 10, "high"),
            ("Install analytics and verify it", "analytics", 14, "high"),
            ("Talk to 10 activated users", "discovery", 45, "medium"),
            ("Selective outbound to best-fit signups", "outreach", 60, "low"),
        ]
    else:
        rows = [
            ("Lock pricing and the pilot offer", "pricing", 7, "high"),
            ("Approve your target list — we research it from your ICP", "icp", 10, "high"),
            ("Connect the CRM and set stages", "crm", 14, "medium"),
            ("Send the first 20 by hand", "outreach", 21, "high"),
            ("Run discovery calls and log objections", "discovery", 35, "medium"),
            ("Review reply rates and rewrite subject lines", "outreach", 45, "low"),
        ]
    return [Task(text=t, link=link, due=d(days), priority=pri) for t, link, days, pri in rows]


# --- LLM rewrite --------------------------------------------------------------------------------

_SYSTEM = (
    "You are a pre-seed go-to-market advisor. The founder has no traction and no sales team — "
    "they are the salesperson. Be concrete and specific to THIS company. Never invent metrics, "
    "logos, or customers. Reply with JSON only."
)


def _prompt(snap: CompanySnapshot, draft: GtmDraft) -> str:
    core = snap.brand.core
    return (
        f"Company: {snap.name}\n"
        f"One-liner: {snap.one_liner}\n"
        f"Industry: {snap.industry} · Stage: {snap.stage}\n"
        f"Problem: {snap.problem}\n"
        f"Customer: {snap.customer}\n"
        f"Solution: {snap.solution}\n"
        f"ICP (from W5): {core.icp}\n"
        f"Positioning (from W5): {core.positioning}\n"
        f"Category (from W5): {core.category}\n"
        f"Voice (from W5): {core.voice}\n"
        f"Chosen motion: {draft.strategy.motion} ({draft.strategy.motion_rationale})\n\n"
        "Return JSON with keys:\n"
        '  "triggers": 3 buying triggers — events that make THIS customer need this NOW\n'
        '  "disqualifiers": one line, who to refuse to sell to\n'
        '  "sequence": 3 outbound emails as strings. Keep the tokens {{account}}, {{first}}, '
        "{{trigger}} exactly as written. Short — under 80 words each. No fake case studies.\n"
        '  "objections": 3 likely objections, each with how to answer it, one string each\n'
        '  "campaign_name": a short name for the first 90-day campaign\n'
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


def _merge_ai(draft: GtmDraft, ai: dict[str, object]) -> None:
    def lst(key: str, limit: int = 3) -> list[str]:
        v = ai.get(key)
        if not isinstance(v, list):
            return []
        return [str(x).strip() for x in v if str(x).strip()][:limit]

    if lst("triggers"):
        draft.triggers = lst("triggers")
    if isinstance(ai.get("disqualifiers"), str) and ai["disqualifiers"].strip():
        draft.disqualifiers = str(ai["disqualifiers"]).strip()
    if lst("sequence") and draft.sequences:
        draft.sequences[0].steps = lst("sequence")
    if lst("objections"):
        draft.objections = lst("objections")
    name = ai.get("campaign_name")
    if isinstance(name, str) and name.strip() and draft.campaigns:
        draft.campaigns[0].name = name.strip()[:60]


async def generate_gtm(snap: CompanySnapshot, model: ModelPort | None = None) -> GtmDraft:
    """Draft the GTM engine: deterministic base, LLM-rewritten copy when a model is available."""
    draft = _deterministic(snap)
    if model is not None:
        try:
            raw = await model.complete(_SYSTEM, _prompt(snap, draft))
        except Exception:
            raw = ""
        parsed = _parse(raw)
        if parsed:
            _merge_ai(draft, parsed)
            draft.source = "ai"
    return draft


# ================================ GTM Health (mirrors brand_health) ==============================


class GtmDimension(BaseModel):
    name: str
    score: int
    hint: str


class GtmHealth(BaseModel):
    score: int  # 0..100
    label: str  # Strong | Emerging | Weak
    dimensions: list[GtmDimension]


def gtm_health(state: GtmState) -> GtmHealth:
    """Score the revenue engine on what's actually done — never on what's typed in."""
    s, p = state.strategy, state.pricing
    accounts = state.accounts
    conn = {c.kind: c.status for c in state.connections}

    def pct(parts: list[bool]) -> int:
        return round(100 * sum(1 for x in parts if x) / len(parts)) if parts else 0

    def stage_in(*names: str) -> int:
        return len([a for a in accounts if a.stage in names])

    dims = [
        GtmDimension(
            name="Motion Clarity",
            hint="A chosen motion, an objective, and 2-3 channels",
            score=pct([bool(s.motion), bool(s.objective), len(s.channels) >= 2]),
        ),
        GtmDimension(
            name="Offer Definition",
            hint="Pricing model, tiers, and a pilot offer",
            score=pct([bool(p.model), len(p.tiers) >= 1, bool(p.pilot), p.locked]),
        ),
        GtmDimension(
            name="Target List",
            hint="A workable list — enough to work, not so many you can't personalise",
            score=100 if 10 <= len(accounts) <= 200 else (60 if accounts else 0),
        ),
        GtmDimension(
            name="Funnel Plumbing",
            hint="CRM connected and analytics verified",
            score=pct([
                conn.get("crm") in ("connected", "verified"),
                conn.get("analytics") == "verified",
            ]),
        ),
        GtmDimension(
            name="Outreach Live",
            hint="An approved sequence and accounts actually contacted",
            score=pct([
                any(q.approved for q in state.sequences),
                stage_in("contacted", "replied", "demo", "pilot", "won") >= 1,
                stage_in("contacted", "replied", "demo", "pilot", "won") >= 20,
            ]),
        ),
        GtmDimension(
            name="Proof of Revenue",
            hint="Conversations, pilots, and closed customers",
            score=pct([
                stage_in("replied", "demo", "pilot", "won") >= 1,
                stage_in("pilot", "won") >= 1,
                stage_in("won") >= 1,
                stage_in("won") >= 10,
            ]),
        ),
    ]
    won_n = stage_in("won")
    cs = customer_success(state)
    dims.append(GtmDimension(
        name="Customer Success",
        hint="Won customers stay in contact and get onboarded — closing isn't the finish line",
        score=0 if won_n == 0 else pct([
            any(c.days_since_contact is not None for c in cs.customers),
            cs.at_risk_count == 0,
            any(c.onboarding_pct >= 100 for c in cs.customers),
        ]),
    ))
    score = round(sum(d.score for d in dims) / len(dims))
    label = "Strong" if score >= 75 else "Emerging" if score >= 40 else "Weak"
    return GtmHealth(score=score, label=label, dimensions=dims)


# ================================ Customer Success & Growth =======================================
# W7 used to stop at "Won" — the funnel doesn't. This scores retention and referrals from what
# actually happened, never from inferred product usage (we have none). "At risk" is a real,
# computable proxy (no logged contact in 30+ days); "churned" is never inferred, only founder-set.

ONBOARDING_TEMPLATE: list[str] = [
    "Kickoff call booked",
    "Product access granted",
    "First value milestone hit",
    "30-day check-in done",
]


class CustomerHealthItem(BaseModel):
    account: str
    onboarding_pct: int
    status: str  # active | churned
    days_since_contact: int | None
    at_risk: bool  # real, computed: active but no contact logged in 30+ days
    referred_by: str = ""


class ReferralStat(BaseModel):
    account: str
    referred: list[str]  # names of accounts this customer referred


class CustomerSuccessView(BaseModel):
    customers: list[CustomerHealthItem]
    won_count: int
    active_count: int
    at_risk_count: int
    churned_count: int
    referred_count: int  # how many won accounts came from a referral
    referral_rate: float  # referred_count / won_count, 0 if no won accounts yet
    top_referrers: list[ReferralStat]
    onboarding_template: list[str]  # the suggested checklist — one source of truth, not in the UI


def customer_success(state: GtmState) -> CustomerSuccessView:
    """Retention and referrals, scored from what actually happened."""
    won = [a for a in state.accounts if a.stage == "won"]
    by_account = {c.account: c for c in state.customers}
    today = date.today()
    items: list[CustomerHealthItem] = []
    for a in won:
        rec = by_account.get(a.name)
        onboarding_pct = 0
        status = "active"
        days: int | None = None
        if rec:
            steps = rec.onboarding
            done_n = sum(1 for s in steps if s.done)
            onboarding_pct = round(100 * done_n / len(steps)) if steps else 0
            status = rec.status
            if rec.last_contact:
                try:
                    days = (today - date.fromisoformat(rec.last_contact)).days
                except ValueError:
                    days = None
        at_risk = status == "active" and (days is None or days >= 30)
        items.append(CustomerHealthItem(
            account=a.name, onboarding_pct=onboarding_pct, status=status,
            days_since_contact=days, at_risk=at_risk, referred_by=a.referred_by,
        ))

    referred = [a for a in won if a.referred_by]
    by_referrer: dict[str, list[str]] = {}
    for a in referred:
        by_referrer.setdefault(a.referred_by, []).append(a.name)
    top_referrers = [ReferralStat(account=k, referred=v) for k, v in by_referrer.items()]

    return CustomerSuccessView(
        customers=items,
        won_count=len(won),
        active_count=len([i for i in items if i.status == "active"]),
        at_risk_count=len([i for i in items if i.at_risk]),
        churned_count=len([i for i in items if i.status == "churned"]),
        referred_count=len(referred),
        referral_rate=round(len(referred) / len(won), 2) if won else 0.0,
        top_referrers=top_referrers,
        onboarding_template=list(ONBOARDING_TEMPLATE),
    )


# ================================ Export / handoff ===============================================
# The orchestration layer's job: hand the decision off to the tool that executes it. W7 decides
# WHO to contact and WHAT to say; Clay/Apollo enrich it, Instantly sends it, HubSpot stores it.
# We never rebuild those — we load them.


def _csv(rows: list[list[str]]) -> str:
    out: list[str] = []
    for row in rows:
        cells = []
        for cell in row:
            c = str(cell).replace('"', '""')
            cells.append(f'"{c}"' if any(ch in c for ch in ',"\n') else c)
        out.append(",".join(cells))
    return "\n".join(out) + "\n"


def export_targets_csv(snap: CompanySnapshot) -> str:
    """Target accounts in the shape Clay / Apollo import expects."""
    rows: list[list[str]] = [["company", "domain", "employee_range", "trigger", "stage", "owner"]]
    for a in snap.gtm.accounts:
        rows.append([a.name, a.domain, a.size, a.trigger, a.stage, a.owner])
    return _csv(rows)


def export_sequence_csv(snap: CompanySnapshot) -> str:
    """The sequence in the shape Instantly / Smartlead campaign import expects."""
    rows: list[list[str]] = [["step", "day", "subject", "body"]]
    for seq in snap.gtm.sequences:
        for i, step in enumerate(seq.steps, start=1):
            day = {1: "1", 2: "3", 3: "7"}.get(i, str(i * 3))
            subject, _, body = step.partition("\n")
            subject = subject.split("Subject:")[-1].strip() if "Subject:" in subject else subject
            rows.append([str(i), day, subject.strip(), body.strip()])
    return _csv(rows)


def export_crm_csv(snap: CompanySnapshot) -> str:
    """Contacts in the shape HubSpot / Attio import expects."""
    rows: list[list[str]] = [["company", "domain", "lifecycle_stage", "source", "notes"]]
    stage_map = {
        "prospect": "subscriber", "contacted": "lead", "replied": "marketingqualifiedlead",
        "demo": "salesqualifiedlead", "pilot": "opportunity", "won": "customer", "lost": "other",
    }
    for a in snap.gtm.accounts:
        rows.append([a.name, a.domain, stage_map.get(a.stage, "lead"), "StartupKit W7", a.trigger])
    return _csv(rows)


# ================================ Document generation ============================================
# The catalog promises these five. They're generated from the Company Object, never authored.

def _stamp() -> str:
    return f"_Generated by StartupKit W7 · {datetime.now(UTC).date().isoformat()}_"


def _doc_icp(snap: CompanySnapshot) -> str:
    c = snap.brand.core
    accounts = snap.gtm.accounts
    lines = [
        f"# ICP & Buyer Personas — {snap.name}",
        "",
        "## Ideal Customer Profile",
        c.icp or snap.customer or "_Not defined — set it in W5._",
        "",
        "## The problem they have",
        snap.problem or "—",
        "",
        "## Why us",
        c.positioning or "—",
        "",
        "## Target accounts",
    ]
    if accounts:
        lines += [
            f"- **{a.name}** ({a.domain}) · {a.size} · trigger: {a.trigger} · {a.stage}"
            for a in accounts
        ]
    else:
        lines.append("_No accounts yet._")
    lines += ["", _stamp()]
    return "\n".join(lines)


def _doc_pricing(snap: CompanySnapshot) -> str:
    p = snap.gtm.pricing
    lines = [f"# Pricing & Packaging — {snap.name}", "", f"**Model:** {p.model or '—'}", ""]
    if p.tiers:
        lines += ["| Tier | Price | Unit | Includes |", "|---|---|---|---|"]
        for t in p.tiers:
            feats = "; ".join(t.features) or "—"
            lines.append(f"| {t.name} | {t.price} | {t.unit} | {feats} |")
    else:
        lines.append("_No tiers set._")
    lines += ["", f"**Pilot offer:** {p.pilot or '—'}", "",
              f"**Status:** {'Locked' if p.locked else 'Draft'}", "", _stamp()]
    return "\n".join(lines)


def _doc_strategy(snap: CompanySnapshot) -> str:
    st = snap.gtm.strategy
    tasks = snap.gtm.tasks
    lines = [
        f"# GTM Strategy — {snap.name}",
        "",
        f"**Motion:** {st.motion or '—'}",
        "",
        f"**Why:** {st.motion_rationale or '—'}",
        "",
        f"**Objective:** {st.objective or '—'}",
        "",
        f"**Channels:** {', '.join(st.channels) or '—'}",
        "",
        f"**Summary:** {st.summary or '—'}",
        "",
        "## 90-day plan",
    ]
    if tasks:
        lines += [
            f"- [{'x' if t.done else ' '}] {t.text} — due {t.due} ({t.priority})" for t in tasks
        ]
    else:
        lines.append("_No plan yet._")
    lines += ["", _stamp()]
    return "\n".join(lines)


def _doc_sequences(snap: CompanySnapshot) -> str:
    lines = [f"# Email Outreach Sequences — {snap.name}", "",
             "> StartupKit composes. You send, from your own mailbox.", ""]
    if not snap.gtm.sequences:
        lines.append("_No sequences yet._")
    for seq in snap.gtm.sequences:
        lines += [f"## {seq.name} ({seq.channel})", ""]
        for i, step in enumerate(seq.steps, start=1):
            lines += [f"### Touch {i}", "", "```", step, "```", ""]
    lines.append(_stamp())
    return "\n".join(lines)


def _doc_scripts(snap: CompanySnapshot) -> str:
    lost = snap.gtm.lost_deals
    lines = [
        f"# Sales Scripts — {snap.name}",
        "",
        "## Discovery",
        "1. How do you handle this today? (the workaround is your real competitor)",
        "2. What made you take this call now? (confirms the trigger)",
        "3. What does it cost you when it goes wrong? (this becomes your ROI line)",
        "4. Who else has to say yes? (sizes the buying committee)",
        "",
        "## Demo",
        "- Replay their words back first.",
        "- Show the one workflow they described.",
        "- End on the price and the pilot, not features.",
        "",
        "## Close",
        "- Confirm the problem and the cost, in their numbers.",
        "- Propose the pilot with a real end-date.",
        "- Name the next step and the owner.",
        "",
        "## Objections heard so far",
    ]
    if lost:
        lines += [f"- {d.account}: {d.reason} — {d.note or 'no note'}" for d in lost]
    else:
        lines.append("_None logged yet._")
    lines += ["", _stamp()]
    return "\n".join(lines)


def _doc_customer_success(snap: CompanySnapshot) -> str:
    cs = customer_success(snap.gtm)
    lines = [
        f"# Customer Success Playbook — {snap.name}",
        "",
        "> Closing isn't the finish line. This is the checklist and the retention rule this "
        "company actually runs — not a generic template.",
        "",
        "## Onboarding checklist (every new customer)",
    ]
    lines += [f"- [ ] {step}" for step in cs.onboarding_template]
    lines += [
        "",
        "## The retention rule",
        "A customer is **at risk** the moment 30 days pass with no logged contact — not when",
        "they cancel. By then it's too late. Check in before the 30 days are up.",
        "",
        "## Referrals",
        "Every customer who refers someone is your cheapest, highest-trust acquisition channel.",
        "Ask at the first sign of a genuine win — a milestone hit, a compliment, a renewal.",
        "",
        f"## Current state ({cs.won_count} won)",
    ]
    if cs.customers:
        lines.append("| Account | Onboarding | Status | Last contact |")
        lines.append("|---|---|---|---|")
        for c in cs.customers:
            d = c.days_since_contact
            contact = f"{d}d ago" if d is not None else "never logged"
            status = "⚠ at risk" if c.at_risk else c.status
            lines.append(f"| {c.account} | {c.onboarding_pct}% | {status} | {contact} |")
    else:
        lines.append("_No won accounts yet — this fills in as deals close._")
    lines += ["", _stamp()]
    return "\n".join(lines)


GTM_DOCS: dict[str, str] = {
    "icp-and-buyer-personas": "ICP & Buyer Personas",
    "pricing-and-packaging": "Pricing & Packaging",
    "gtm-strategy": "GTM Strategy",
    "email-outreach-sequences": "Email Outreach Sequences",
    "sales-scripts": "Sales Scripts",
    "customer-success-playbook": "Customer Success Playbook",
}


def render_gtm_doc(snap: CompanySnapshot, doc_key: str) -> str:
    builders = {
        "design-partner-agreement": _doc_partner_agreement,
        "order-form": _doc_order_form,
        "icp-and-buyer-personas": _doc_icp,
        "pricing-and-packaging": _doc_pricing,
        "gtm-strategy": _doc_strategy,
        "email-outreach-sequences": _doc_sequences,
        "sales-scripts": _doc_scripts,
        "customer-success-playbook": _doc_customer_success,
    }
    build = builders.get(doc_key)
    if build is None:
        raise KeyError(doc_key)
    return build(snap)


# ================================ Account discovery ==============================================
# The seam moved: W7 used to ask the founder to type 50 company names. Now it researches the market
# from their ICP and hands back named companies with the trigger that put each one on the list.
# The founder approves or cuts. We do the work; they do the act.


class Discovery(BaseModel):
    """Proposed accounts. Not persisted — the founder approves them into the target list."""

    accounts: list[TargetAccount] = Field(default_factory=list)
    query: str = ""
    sources: list[str] = Field(default_factory=list)
    source: str = "engine"  # engine | ai
    note: str = ""


# The founder's own trigger wording -> the words that actually find those companies on the web.
_TRIGGER_QUERY: dict[str, str] = {
    "Raised a round in the last 6 months": "raised seed funding round recently",
    "Hired a new leader for this function": "hired new head of appointed",
    "Posting jobs for the team you serve": "hiring job openings for team",
    "Announced a product in your category": "launched announced new product",
    "Uses a competitor you can displace": "using alternatives switching from",
    "Hit a compliance or audit deadline": "compliance audit deadline SOC 2",
}


def _discovery_query(snap: CompanySnapshot, trigger: str) -> str:
    """Search the market the ICP describes, not our own product."""
    core = snap.brand.core
    who = core.icp or snap.customer or snap.industry
    what = core.category or snap.industry or ""
    trig = _TRIGGER_QUERY.get(trigger, trigger)
    return f"{who} companies {what} {trig}".strip()


_DISCOVER_SYSTEM = (
    "You identify REAL companies that match an ideal customer profile, from web search results. "
    "Only list companies you can see evidence for in the results — never invent one. If there "
    "aren't enough real companies, return fewer. Reply with JSON only."
)


def _discover_prompt(
    snap: CompanySnapshot, results: list[object], trigger_label: str
) -> str:
    core = snap.brand.core
    lines = [
        f"My company: {snap.name} — {snap.one_liner}",
        f"We sell to: {core.icp or snap.customer}",
        f"Our category: {core.category or snap.industry}",
        f"The buying trigger I care about: {trigger_label}",
        "",
        "Web search results:",
    ]
    for r in results:
        title = getattr(r, "title", "")
        url = getattr(r, "url", "")
        snippet = getattr(r, "snippet", "")
        lines.append(f"- {title} | {url} | {snippet[:220]}")
    lines += [
        "",
        "From ONLY these results, extract companies that match my ICP and could buy from me.",
        "Skip: my own company, blog/list/directory sites, vendors selling to me, and anything you",
        "cannot see real evidence for.",
        'Return JSON: {"accounts":[{"name":"...","domain":"...","size":"11-50",',
        '"trigger":"one short line on why they are on the list RIGHT NOW"}]}',
        "size must be one of: 1-10, 11-50, 51-200, 201-1000, 1000+ (best guess).",
        "Max 12 companies. Fewer is fine. Never invent a company.",
    ]
    return "\n".join(lines)


def _parse_accounts(raw: str, owner: str) -> list[TargetAccount]:
    data = _parse(raw)
    items = data.get("accounts")
    if not isinstance(items, list):
        return []
    out: list[TargetAccount] = []
    seen: set[str] = set()
    for it in items:
        if not isinstance(it, dict):
            continue
        name = str(it.get("name", "")).strip()
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        domain = str(it.get("domain", "")).strip().replace("https://", "").replace("http://", "")
        domain = domain.split("/")[0].removeprefix("www.")
        size = str(it.get("size", "")).strip()
        if size not in ("1-10", "11-50", "51-200", "201-1000", "1000+"):
            size = "11-50"
        out.append(
            TargetAccount(
                name=name[:60],
                domain=domain[:80],
                size=size,
                trigger=str(it.get("trigger", "")).strip()[:120],
                stage="prospect",
                owner=owner,
            )
        )
    return out[:12]


async def discover_accounts(
    snap: CompanySnapshot,
    trigger: str = "",  # empty -> use the triggers the founder ticked in their ICP
    model: ModelPort | None = None,
    search: SearchPort | None = None,
) -> Discovery:
    """Research the market from the ICP and propose real, named accounts to contact.

    Degrades honestly: no search provider or no results -> an empty list and a note saying so,
    never a fabricated company.
    """
    core = snap.brand.core
    if not (core.icp or snap.customer):
        return Discovery(note="No ICP yet — define it in W5 and W7 can research your market.")

    # Default to whatever the founder ticked in their ICP — one trigger list, not two.
    if not trigger:
        picked = snap.gtm.inputs.triggers
        trigger = picked[0] if picked else "Raised a round in the last 6 months"
    trigger_label = trigger
    query = _discovery_query(snap, trigger)

    if search is None:
        return Discovery(query=query, note="Live research is off — no accounts proposed.")
    try:
        results = await search.search(query, max_results=8)
    except Exception:
        results = []
    if not results:
        return Discovery(
            query=query, note="Research found nothing for this ICP. Try another trigger."
        )

    sources = [r.url for r in results]
    owner = snap.founders[0].name if snap.founders else ""
    if model is None:
        return Discovery(
            query=query,
            sources=sources,
            note="No model wired — found sources but can't extract companies. Add a key.",
        )
    try:
        prompt = _discover_prompt(snap, list(results), trigger_label)
        raw = await model.complete(_DISCOVER_SYSTEM, prompt)
    except Exception:
        raw = ""
    accounts = _parse_accounts(raw, owner)
    if not accounts:
        return Discovery(
            query=query, sources=sources, note="Nothing matched your ICP in these results."
        )
    return Discovery(
        accounts=accounts,
        query=query,
        sources=sources,
        source="ai",
        note=f"{len(accounts)} companies found · trigger: {trigger_label}",
    )


# ================================ Motion read ====================================================
# Don't ask what you can infer. The three signals that decide the motion are all already in the
# Company Object: price comes from the Pricing Lab, self-serve from what they built, committee from
# the W5 ICP. We assert each one WITH ITS EVIDENCE, and the founder corrects us if we're wrong.


class Signal(BaseModel):
    value: str = ""
    evidence: str = ""  # WHY we think this — shown to the founder so they can judge us
    known: bool = False  # False -> we're guessing; say so rather than pretend


class MotionRead(BaseModel):
    acv: Signal = Field(default_factory=Signal)  # low | mid | high
    self_serve: Signal = Field(default_factory=Signal)  # yes | no
    committee: Signal = Field(default_factory=Signal)  # one | few | many
    motion: str = ""
    motion_why: str = ""
    source: str = "engine"  # engine | ai


def _read_acv(snap: CompanySnapshot) -> Signal:
    """Deterministic: the price the founder already set decides the band."""
    tiers = snap.gtm.pricing.tiers
    prices = [_num(t.price) for t in tiers if _num(t.price) > 0]
    if not prices:
        return Signal(
            value="mid",
            evidence="No pricing set yet — guessing. Set your tiers and I'll compute this exactly.",
            known=False,
        )
    top = max(prices)
    unit = next((t.unit for t in tiers if _num(t.price) == top), "mo")
    annual = top * 12 if "mo" in unit else top
    band = "high" if annual >= 25000 else "low" if annual < 10000 else "mid"
    return Signal(
        value=band,
        evidence=f"Your top tier is ${top:,.0f}/{unit} → about ${annual:,.0f} a year.",
        known=True,
    )


_READ_SYSTEM = (
    "You read a company's own data and infer two things about how it gets sold. Be decisive and "
    "quote their words as evidence. Never invent facts about them. Reply with JSON only."
)


def _read_prompt(snap: CompanySnapshot) -> str:
    core = snap.brand.core
    return (
        f"Company: {snap.name}\n"
        f"One-liner: {snap.one_liner}\n"
        f"What they built: {snap.solution}\n"
        f"Industry: {snap.industry}\n"
        f"Who they sell to (ICP): {core.icp or snap.customer}\n"
        f"Category: {core.category}\n"
        f"Pricing model: {snap.gtm.pricing.model or 'not set'}\n\n"
        "Infer:\n"
        '1. self_serve — "yes" if a user could get real value signing up alone, "no" if it needs a '
        "demo/onboarding/integration.\n"
        '2. committee — how many people approve a purchase at THEIR customer: "one", "few" (2-4), '
        'or "many" (5+). A 20-person startup is usually "one". A bank is "many".\n\n'
        "Return JSON: {\"self_serve\":\"yes|no\",\"self_serve_evidence\":\"short line quoting "
        "their words\",\"committee\":\"one|few|many\",\"committee_evidence\":\"short line "
        "citing their ICP\"}"
    )


async def read_motion(snap: CompanySnapshot, model: ModelPort | None = None) -> MotionRead:
    """Infer the three motion signals from the Company Object instead of asking the founder."""
    acv = _read_acv(snap)
    self_serve = Signal(
        value="yes", evidence="Assuming self-serve until we know more.", known=False
    )
    committee = Signal(value="few", evidence="Assuming a small buying group.", known=False)
    source = "engine"

    if model is not None and (snap.solution or snap.one_liner):
        try:
            raw = await model.complete(_READ_SYSTEM, _read_prompt(snap))
        except Exception:
            raw = ""
        ai = _parse(raw)
        ss = str(ai.get("self_serve", "")).strip().lower()
        if ss in ("yes", "no"):
            self_serve = Signal(
                value=ss,
                evidence=str(ai.get("self_serve_evidence", "")).strip()[:160],
                known=True,
            )
            source = "ai"
        cm = str(ai.get("committee", "")).strip().lower()
        if cm in ("one", "few", "many"):
            committee = Signal(
                value=cm, evidence=str(ai.get("committee_evidence", "")).strip()[:160], known=True
            )
            source = "ai"

    # A human correction always beats our read — never silently overwrite the founder.
    saved = snap.gtm.inputs
    if saved.acv:
        acv = Signal(value=saved.acv, evidence="You corrected this.", known=True)
    if saved.self_serve:
        self_serve = Signal(value=saved.self_serve, evidence="You corrected this.", known=True)
    if saved.committee:
        committee = Signal(value=saved.committee, evidence="You corrected this.", known=True)

    motion, why = _motion_from(acv.value, self_serve.value == "yes", committee.value)
    return MotionRead(
        acv=acv, self_serve=self_serve, committee=committee,
        motion=motion, motion_why=why, source=source,
    )


def _motion_from(acv: str, self_serve: bool, committee: str) -> tuple[str, str]:
    """The fork itself — same rule the founder can override in the UI."""
    if acv == "high" or committee == "many":
        reason = "an ACV above $25k" if acv == "high" else "a 5+ person buying committee"
        return "outbound", (
            f"With {reason}, a product can't close the deal on its own — someone has to handle "
            "objections and build the internal champion."
        )
    if acv == "low" and self_serve and committee == "one":
        return "plg", (
            "Under a $10k ACV with a self-serve product and a single decision-maker, the economics "
            "don't support a sales team — the product has to prove itself."
        )
    return "hybrid", (
        "You're between the two clean cases: the product can partly sell itself, but the deal size "
        "justifies a human on the bigger accounts. That's what most B2B companies actually run."
    )


# ================================ Pricing research ===============================================
# The last Phase-1 module that still asked. Nobody helps a founder DECIDE a price — Stripe and Orb
# only bill it. So: research what comparable companies charge, propose tiers, show the evidence.


class PriceComp(BaseModel):
    name: str = ""
    price: str = ""
    note: str = ""
    url: str = ""


class PricingRead(BaseModel):
    comps: list[PriceComp] = Field(default_factory=list)
    tiers: list[PricingTier] = Field(default_factory=list)
    model: str = ""
    rationale: str = ""
    sources: list[str] = Field(default_factory=list)
    source: str = "engine"  # engine | ai
    note: str = ""


_PRICE_SYSTEM = (
    "You research what comparable B2B software actually charges, from web search results. Only "
    "report a price you can see evidence for — never invent one. Then propose 3 tiers for the "
    "founder's company. Reply with JSON only."
)


def _price_prompt(snap: CompanySnapshot, results: list[object]) -> str:
    core = snap.brand.core
    lines = [
        f"My company: {snap.name} — {snap.one_liner}",
        f"What we do: {snap.solution}",
        f"Category: {core.category or snap.industry}",
        f"We sell to: {core.icp or snap.customer}",
        "",
        "Web search results about competitor pricing:",
    ]
    for r in results:
        lines.append(
            f"- {getattr(r, 'title', '')} | {getattr(r, 'url', '')} | "
            f"{getattr(r, 'snippet', '')[:220]}"
        )
    lines += [
        "",
        "From ONLY these results, extract real competitor prices, then propose MY 3 tiers.",
        'Return JSON: {"comps":[{"name":"...","price":"$X/mo","note":"what you get"}],',
        '"model":"tiered|seat|usage|flat|freemium",',
        '"tiers":[{"name":"...","price":"149","unit":"seat/mo","features":["...","..."]}],',
        '"rationale":"one line on why this price, citing the comps"}',
        "price must be digits only. Max 4 comps, exactly 3 tiers. Never invent a competitor.",
    ]
    return "\n".join(lines)


async def research_pricing(
    snap: CompanySnapshot,
    model: ModelPort | None = None,
    search: SearchPort | None = None,
) -> PricingRead:
    """Propose a price backed by what comparable companies actually charge."""
    core = snap.brand.core
    what = core.category or snap.industry
    if not what:
        return PricingRead(
            note="No category yet — define it in W5 and we can research your market."
        )
    query = f"{what} pricing per month plans cost for {core.icp or snap.customer}".strip()

    if search is None:
        return PricingRead(note="Live research is off — no pricing proposed.")
    try:
        results = await search.search(query, max_results=6)
    except Exception:
        results = []
    if not results:
        return PricingRead(note="Research found no pricing for this category.")
    sources = [r.url for r in results]
    if model is None:
        return PricingRead(sources=sources, note="Found sources but no model wired to read them.")

    try:
        raw = await model.complete(_PRICE_SYSTEM, _price_prompt(snap, list(results)))
    except Exception:
        raw = ""
    ai = _parse(raw)

    comps: list[PriceComp] = []
    for c in ai.get("comps", []) if isinstance(ai.get("comps"), list) else []:
        if isinstance(c, dict) and str(c.get("name", "")).strip():
            comps.append(
                PriceComp(
                    name=str(c.get("name", ""))[:40],
                    price=str(c.get("price", ""))[:24],
                    note=str(c.get("note", ""))[:80],
                )
            )
    tiers: list[PricingTier] = []
    for t in ai.get("tiers", []) if isinstance(ai.get("tiers"), list) else []:
        if isinstance(t, dict) and str(t.get("name", "")).strip():
            feats = t.get("features")
            tiers.append(
                PricingTier(
                    name=str(t.get("name", ""))[:24],
                    price=str(int(_num(str(t.get("price", "0"))))),
                    unit=str(t.get("unit", "mo"))[:16],
                    features=[str(f)[:60] for f in feats][:4] if isinstance(feats, list) else [],
                )
            )
    if not tiers:
        return PricingRead(
            comps=comps[:4], sources=sources, note="Couldn't read a clear price from these results."
        )
    if not comps:
        # Tiers with no comparable prices behind them are a guess, not research. Say so, and don't
        # dress it up with a confident rationale — an unevidenced price is how founders underprice.
        return PricingRead(
            tiers=tiers[:3],
            model=str(ai.get("model", "tiered"))[:12],
            rationale="",
            sources=sources,
            source="engine",
            note=(
                "No comparable prices found in the research — these tiers are a starting point to "
                "react to, not evidence. Price is the one number worth checking by hand."
            ),
        )
    return PricingRead(
        comps=comps[:4],
        tiers=tiers[:3],
        model=str(ai.get("model", "tiered"))[:12],
        rationale=str(ai.get("rationale", ""))[:200],
        sources=sources,
        source="ai",
        note=f"{len(comps)} comparable prices found",
    )


# ================================ Deliverability =================================================
# We tell founders "send the first 20 by hand" — this is the safety on that gun. Real DNS checks
# (SPF / DMARC / MX) via DNS-over-HTTPS, not a static checklist. The founder's domain is also their
# investor-comms domain; protecting it is duty of care, not a feature.


class DnsCheck(BaseModel):
    name: str = ""
    status: str = "unknown"  # pass | fail | unknown
    detail: str = ""


class Deliverability(BaseModel):
    domain: str = ""
    checks: list[DnsCheck] = Field(default_factory=list)
    ready: bool = False
    note: str = ""
    warmup: list[str] = Field(default_factory=list)  # the ramp, if they're new to sending


async def _doh_txt(domain: str, rtype: str = "TXT") -> list[str]:
    """Resolve records via Google DNS-over-HTTPS. Empty list on any failure — never raise."""
    import httpx

    try:
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.get(
                "https://dns.google/resolve", params={"name": domain, "type": rtype}
            )
            data = r.json()
    except Exception:
        return []
    answers = data.get("Answer") or []
    return [str(a.get("data", "")).strip('"').replace('" "', "") for a in answers]


async def check_deliverability(domain: str) -> Deliverability:
    """Check the founder's sending domain the way a receiving mail server would."""
    domain = domain.strip().lower().removeprefix("http://").removeprefix("https://").split("/")[0]
    if not domain or "." not in domain:
        return Deliverability(note="No domain to check — set your website or email domain first.")

    mx = await _doh_txt(domain, "MX")
    spf_records = [t for t in await _doh_txt(domain, "TXT") if t.lower().startswith("v=spf1")]
    dmarc = [t for t in await _doh_txt(f"_dmarc.{domain}", "TXT") if "v=dmarc1" in t.lower()]

    # A record existing is not the same as mail working. RFC 7505 null MX ("0 .") declares the
    # domain receives NO mail; a bare "v=spf1 -all" declares it sends none. Both must fail here.
    null_mx = any(m.strip() in ("0 .", "0.") for m in mx)
    mx_ok = bool(mx) and not null_mx
    null_spf = any(t.lower().replace(" ", "") == "v=spf1-all" for t in spf_records)
    spf_ok = bool(spf_records) and not null_spf

    checks = [
        DnsCheck(
            name="MX (can receive mail)",
            status="pass" if mx_ok else "fail",
            detail="Null MX — this domain declares it receives no mail."
            if null_mx
            else (mx[0][:80] if mx else "No MX records — replies to your outreach will bounce."),
        ),
        DnsCheck(
            name="SPF (who may send as you)",
            status="pass" if spf_ok else "fail",
            detail='SPF is "v=spf1 -all" — this domain declares it sends NO mail.'
            if null_spf
            else (
                spf_records[0][:80]
                if spf_records
                else "No SPF record — receiving servers will distrust your mail."
            ),
        ),
        DnsCheck(
            name="DMARC (policy)",
            status="pass" if dmarc else "fail",
            detail=dmarc[0][:80]
            if dmarc
            else 'No DMARC — add TXT at _dmarc: "v=DMARC1; p=quarantine; rua=mailto:you@…"',
        ),
        DnsCheck(
            name="DKIM (signature)",
            status="unknown",
            detail="Needs your provider's selector to verify — check in Google Workspace admin.",
        ),
    ]
    ready = bool(mx_ok and spf_ok and dmarc)
    return Deliverability(
        domain=domain,
        checks=checks,
        ready=ready,
        note=(
            "Green enough to send your first 20 by hand."
            if ready
            else "Fix the failing records before volume — a flagged domain also burns your "
            "investor email."
        ),
        warmup=[
            "Week 1 — your 20 hand-sent, replies expected (they build reputation)",
            "Week 2 — up to 10/day, keep reply rate above 4%",
            "Week 3 — up to 20/day if no bounces or spam flags",
            "Never — bought lists, attachments to strangers, or link shorteners",
        ],
    )


# ================================ Content engine =================================================
# The Motion tool recommends content for PLG/hybrid — this stops that being a dead end. Ideas are
# derived from the Brand Core (pillars, positioning, triggers), scheduled by week. Key-free base,
# LLM sharpens the titles when wired.


class ContentPlanDraft(BaseModel):
    ideas: list[ContentIdea] = Field(default_factory=list)
    source: str = "engine"
    note: str = ""


_CONTENT_SYSTEM = (
    "You write specific, non-generic content titles for an early-stage company. Titles must be "
    "concrete enough that only THIS company could publish them. Reply with JSON only."
)


def _content_deterministic(snap: CompanySnapshot) -> list[ContentIdea]:
    core = snap.brand.core
    icp = core.icp or snap.customer or "your customers"
    problem = snap.problem or "the problem you solve"
    category = core.category or snap.industry or "your category"
    name = snap.name or "us"
    rows: list[tuple[str, str]] = [
        (f"How {icp} handle {problem.lower()} today — and where it breaks", "blog"),
        (f"{category}: build it yourself vs buy — the honest maths", "blog"),
        (f"What raising a round changes about {problem.lower()}", "linkedin"),
        (f"Why we built {name} — the founding story", "linkedin"),
        (f"The real cost of ignoring {problem.lower()} (a thread)", "x"),
        (f"One workflow {icp} can steal from us this week", "x"),
    ]
    return [ContentIdea(title=t, platform=p, week=i // 2 + 1) for i, (t, p) in enumerate(rows)]


async def generate_content(
    snap: CompanySnapshot, model: ModelPort | None = None
) -> ContentPlanDraft:
    ideas = _content_deterministic(snap)
    if model is None:
        return ContentPlanDraft(ideas=ideas, source="engine", note="6 ideas from your Brand Core")
    core = snap.brand.core
    prompt = (
        f"Company: {snap.name} — {snap.one_liner}\n"
        f"ICP: {core.icp or snap.customer}\nProblem: {snap.problem}\n"
        f"Positioning: {core.positioning}\nPillars: {', '.join(core.pillars)}\n\n"
        "Rewrite these 6 content titles to be sharper and specific to this company. Keep the same "
        "order and platforms. Return JSON: {\"titles\": [\"...\", ...]} — exactly 6 strings.\n"
        + "\n".join(f"{i + 1}. {c.title}" for i, c in enumerate(ideas))
    )
    try:
        raw = await model.complete(_CONTENT_SYSTEM, prompt)
    except Exception:
        raw = ""
    parsed = _parse(raw)
    titles = parsed.get("titles")
    if isinstance(titles, list) and len(titles) >= 6:
        for i, c in enumerate(ideas):
            t = str(titles[i]).strip()
            if t:
                c.title = t[:120]
        return ContentPlanDraft(ideas=ideas, source="ai", note="6 ideas, sharpened for you")
    return ContentPlanDraft(ideas=ideas, source="engine", note="6 ideas from your Brand Core")


def _doc_partner_agreement(snap: CompanySnapshot) -> str:
    p = snap.gtm.pricing
    return "\n".join(
        [
            f"# Design Partner Agreement — {snap.name}",
            "",
            "> A plain-language mutual commitment, not a sales contract. Convert to paid via the",
            "> order form when the pilot proves out. Have W2's counsel review before signing.",
            "",
            "## What we give you",
            "- Full product access for the pilot period",
            f"- The pilot offer: {p.pilot or '[set your pilot offer in the Pricing Lab]'}",
            "- A direct line to the founders; your requests shape the roadmap",
            "",
            "## What we ask of you",
            "- A 30-minute feedback call every 2 weeks",
            "- Honest answers about what's broken and what you'd pay",
            "- If the pilot works: a reference call or quote we can use",
            "",
            "## The terms",
            "- Term: the pilot period, then month-to-month",
            "- Data: yours stays yours; we may use anonymised usage patterns",
            "- Either side can end it with one email",
            "",
            "_Signatures_",
            "",
            f"{snap.name}: ______________________  Date: ________",
            "",
            "Partner: ______________________  Date: ________",
            "",
            _stamp(),
        ]
    )


GTM_DOCS["design-partner-agreement"] = "Design Partner Agreement"


def _doc_order_form(snap: CompanySnapshot) -> str:
    """The last mile of "How do they buy" — one page a buyer can sign, with the payment link.

    StartupKit never takes the money: the founder pastes their own checkout URL (a Stripe
    Payment Link takes 5 minutes, no code) and this form points the buyer at it.
    """
    p = snap.gtm.pricing
    link = snap.gtm.inputs.payment_link
    lines = [
        f"# Order Form — {snap.name}",
        "",
        "> Send this when someone says yes. Have W2's counsel review it once before first use.",
        "",
        "## Customer",
        "",
        "Company: ______________________",
        "",
        "Contact: ______________________  Email: ______________________",
        "",
        "## Plan",
    ]
    if p.tiers:
        lines += ["", "| Choose | Tier | Price | Includes |", "|---|---|---|---|"]
        for t in p.tiers:
            feats = "; ".join(t.features) or "—"
            price = f"${_num(t.price):,.0f}/{t.unit or 'mo'}" if _num(t.price) else t.price
            lines.append(f"| ☐ | {t.name} | {price} | {feats} |")
    else:
        lines.append("_No tiers yet — set them in the Pricing Lab and regenerate this form._")
    if p.pilot:
        lines += ["", f"**Pilot option:** {p.pilot}"]
    lines += [
        "",
        "## Payment",
        "",
        f"Pay online: {link}"
        if link
        else "_[Paste your Stripe Payment Link in W7 → How do they buy, and it appears here.]_",
        "",
        "Term: monthly, cancels with one email. First invoice on signature.",
        "",
        "## Signatures",
        "",
        f"{snap.name}: ______________________  Date: ________",
        "",
        "Customer: ______________________  Date: ________",
        "",
        _stamp(),
    ]
    return "\n".join(lines)


GTM_DOCS["order-form"] = "Order Form"


# ================================ Channel matrix ==================================================
# Founders default to "do everything, everywhere". The matrix forces the pre-seed discipline the
# advisors all repeat: two channels you commit to, everything else explicitly ignored — with the
# reason, so ignoring feels like a decision instead of a gap.


class ChannelVerdict(BaseModel):
    channel: str = ""
    verdict: str = ""  # bet | support | ignore
    why: str = ""


class ChannelMatrix(BaseModel):
    motion: str = ""
    verdicts: list[ChannelVerdict] = Field(default_factory=list)
    note: str = ""


# channel -> (verdict per motion, why per motion). Deterministic and explainable, like the fork.
_CHANNEL_TABLE: list[tuple[str, dict[str, tuple[str, str]]]] = [
    (
        "Outbound email",
        {
            "outbound": ("bet", "Your ACV pays for a human touch — this is the whole motion."),
            "plg": ("ignore", "Under a $10k ACV the maths of 1:1 email never works out."),
            "hybrid": ("bet", "Run it on the top slice of your ICP where the deal size earns it."),
        },
    ),
    (
        "Warm intros",
        {
            "outbound": ("bet", "A warm intro replies ~10x a cold email. Spend them on best-fits."),
            "plg": ("support", "Use them for design partners, not volume."),
            "hybrid": ("support", "Route every intro to the outbound slice — never waste one."),
        },
    ),
    (
        "Founder LinkedIn",
        {
            "outbound": ("support", "Warms up the names you're already emailing — air cover."),
            "plg": ("bet", "You are the distribution until the product is. Post where the ICP is."),
            "hybrid": ("support", "Air cover for outreach; occasional signup spikes."),
        },
    ),
    (
        "SEO / content",
        {
            "outbound": ("ignore", "Pays off in months. Your first 10 customers arrive by hand."),
            "plg": ("bet", "Compounding signups is the engine — start now, it's slow to warm."),
            "hybrid": ("bet", "Feeds the self-serve end while outbound works the top end."),
        },
    ),
    (
        "Community / launches",
        {
            "outbound": ("ignore", "Applause isn't pipeline at a $25k+ ACV."),
            "plg": ("support", "One good launch seeds the signup loop — then it's a channel, "
                    "not a habit."),
            "hybrid": ("support", "Worth one launch for the self-serve tier."),
        },
    ),
    (
        "Paid ads",
        {
            "outbound": ("ignore", "You'd be paying to learn what 20 hand-sent emails teach free."),
            "plg": ("ignore", "Pre-PMF paid is burning runway to buy data you can't read yet."),
            "hybrid": ("ignore", "Same trap in both halves — revisit after 10 customers."),
        },
    ),
    (
        "Events / conferences",
        {
            "outbound": ("support", "Only where your ICP already gathers — book meetings before "
                         "you fly."),
            "plg": ("ignore", "Cost per signup is brutal. Stay online."),
            "hybrid": ("ignore", "Neither half needs a booth yet."),
        },
    ),
    (
        "Cold calling",
        {
            "outbound": ("ignore", "Works at scale with SDRs. You have neither — email first."),
            "plg": ("ignore", "Wrong motion entirely."),
            "hybrid": ("ignore", "Wrong stage — revisit if outbound replies stall."),
        },
    ),
]


def channel_matrix(snap: CompanySnapshot, motion: str = "") -> ChannelMatrix:
    """Rank every channel for THIS motion: 2 bets, a few supports, the rest ignored with a why."""
    motion = motion or snap.gtm.strategy.motion or _pick_motion(snap)[0]
    if motion not in ("outbound", "plg", "hybrid"):
        motion = "hybrid"
    verdicts = [
        ChannelVerdict(channel=name, verdict=table[motion][0], why=table[motion][1])
        for name, table in _CHANNEL_TABLE
    ]
    bets = [v.channel for v in verdicts if v.verdict == "bet"]
    return ChannelMatrix(
        motion=motion,
        verdicts=verdicts,
        note=(
            f"For a {motion} motion, bet on {' and '.join(bets)}. Everything under 'ignore' is a "
            "decision, not a gap — revisit after the first 10 customers."
        ),
    )


# ================================ Stage guardrails ================================================
# The pipeline talks back. Deterministic rules over the real account stages that catch the classic
# pre-seed failure modes (starting pilots forever, sending into silence) before they cost a month.


class Guardrail(BaseModel):
    severity: str = "warn"  # stop | warn
    text: str = ""
    link: str = ""  # the W7 module this warning opens


def stage_guardrails(state: GtmState) -> list[Guardrail]:
    """Warnings computed from what actually happened — an empty list means keep going."""
    accounts = state.accounts

    def n(*stages: str) -> int:
        return len([a for a in accounts if a.stage in stages])

    contacted_plus = n("contacted", "replied", "demo", "pilot", "won")
    replied_plus = n("replied", "demo", "pilot", "won")
    out: list[Guardrail] = []

    if len(accounts) > 200:
        out.append(Guardrail(
            severity="warn", link="icp",
            text=f"{len(accounts)} accounts is a mailing list, not a target list — you can't "
            "personalise past ~200. Cut to the best 50.",
        ))
    if contacted_plus >= 20 and replied_plus == 0:
        out.append(Guardrail(
            severity="stop", link="outreach",
            text=f"{contacted_plus} contacted, zero replies. Stop sending — below a 4% reply "
            "rate the problem is targeting or subject lines, and volume just burns the list.",
        ))
    if contacted_plus >= 1 and not any(q.approved for q in state.sequences):
        out.append(Guardrail(
            severity="warn", link="outreach",
            text="You've contacted accounts but never approved a sequence — improvised emails "
            "can't be measured or improved. Approve one and stick to it.",
        ))
    if contacted_plus >= 1 and not state.pricing.locked:
        out.append(Guardrail(
            severity="warn", link="pricing",
            text="You're selling without a locked price. The first 'how much is it?' will "
            "cost you the deal — lock it in the Pricing Lab.",
        ))
    if n("demo") >= 5 and n("pilot", "won") == 0:
        out.append(Guardrail(
            severity="warn", link="discovery",
            text=f"{n('demo')} demos and none became a pilot — the demo or the price is "
            "losing them. Log what they said in Discovery.",
        ))
    if n("pilot") >= 3 and n("won") == 0:
        out.append(Guardrail(
            severity="stop", link="crm",
            text=f"{n('pilot')} pilots running, none closed. Stop starting and start closing — "
            "every pilot needs an end date and a price on the other side.",
        ))
    price_losses = len([d for d in state.lost_deals if d.reason == "price"])
    if price_losses >= 3:
        out.append(Guardrail(
            severity="stop", link="discovery",
            text=f"{price_losses} deals lost on price. That's positioning, not sales — "
            "re-open the value story in W5 before sending more.",
        ))
    cs = customer_success(state)
    if cs.at_risk_count > 0:
        out.append(Guardrail(
            severity="warn", link="success",
            text=f"{cs.at_risk_count} won customer{'s' if cs.at_risk_count != 1 else ''} with no "
            "contact logged in 30+ days — check in before they churn quietly.",
        ))
    return out


# ================================ Attribution =====================================================
# Which trigger is actually producing conversations? Computed from the real stage of the accounts
# each trigger put on the list — never from typed-in claims. Honest floor: below 3 contacted per
# trigger we refuse to call a winner.


class TriggerStat(BaseModel):
    trigger: str = ""
    accounts: int = 0
    contacted: int = 0
    replied: int = 0
    won: int = 0


class Attribution(BaseModel):
    rows: list[TriggerStat] = Field(default_factory=list)
    best: str = ""  # the trigger to double down on, or "" if too early to call
    note: str = ""


def attribution(state: GtmState) -> Attribution:
    """Group the pipeline by the trigger that sourced each account, and name the working one."""
    contacted_stages = ("contacted", "replied", "demo", "pilot", "won")
    replied_stages = ("replied", "demo", "pilot", "won")
    by: dict[str, TriggerStat] = {}
    for a in state.accounts:
        key = a.trigger.strip() or "(no trigger recorded)"
        row = by.setdefault(key, TriggerStat(trigger=key))
        row.accounts += 1
        row.contacted += a.stage in contacted_stages
        row.replied += a.stage in replied_stages
        row.won += a.stage == "won"
    rows = sorted(by.values(), key=lambda r: (r.replied, r.contacted, r.accounts), reverse=True)
    if not rows:
        return Attribution(note="No accounts yet — attribution starts when the list does.")

    callable_rows = [r for r in rows if r.contacted >= 3]
    if not callable_rows:
        return Attribution(
            rows=rows,
            note="Too early to call a winner — contact at least 3 accounts per trigger first.",
        )
    best = max(callable_rows, key=lambda r: (r.replied / r.contacted, r.won))
    if best.replied == 0:
        return Attribution(
            rows=rows, note="No trigger has produced a reply yet — rewrite before you re-send."
        )
    rate = round(100 * best.replied / best.contacted)
    return Attribution(
        rows=rows,
        best=best.trigger,
        note=f"'{best.trigger}' is working — {best.replied} of {best.contacted} contacted "
        f"replied ({rate}%). Source your next batch from this trigger.",
    )


# ================================ GTM chat ========================================================
# The same seam as W5's brand chat: a question box grounded in THEIR revenue engine, not generic
# sales advice. Deterministic fallback points at the next unanswered of the five questions.


_GTM_CHAT_SYSTEM = (
    "You are the founder's AI co-founder and a pre-seed go-to-market operator. Answer their "
    "sales/GTM question concretely for THIS company using its real pipeline numbers below. "
    "Be blunt and practical; 2-5 sentences. Never invent metrics, customers, or results — "
    "if the data below doesn't show it, say so."
)


def _gtm_chat_prompt(snap: CompanySnapshot, message: str, history: list[str]) -> str:
    g = snap.gtm
    core = snap.brand.core
    stages: dict[str, int] = {}
    for a in g.accounts:
        stages[a.stage] = stages.get(a.stage, 0) + 1
    pipeline = ", ".join(f"{v} {k}" for k, v in stages.items()) or "empty"
    tiers = "; ".join(f"{t.name} ${_num(t.price):,.0f}/{t.unit}" for t in g.pricing.tiers) or "none"
    ctx = (
        f"Company: {snap.name} — {snap.one_liner}\n"
        f"ICP (W5): {core.icp or snap.customer}\n"
        f"Positioning (W5): {core.positioning}\n"
        f"Motion: {g.strategy.motion or 'not chosen'} ({g.strategy.motion_rationale})\n"
        f"Pricing: {g.pricing.model or 'unset'} — {tiers} — "
        f"{'locked' if g.pricing.locked else 'draft'}\n"
        f"Pipeline ({len(g.accounts)} accounts): {pipeline}\n"
        f"Lost deals: {len(g.lost_deals)} "
        f"({', '.join(d.reason for d in g.lost_deals[:5]) or 'none'})\n"
        f"Sequences approved: {any(q.approved for q in g.sequences)}\n"
    )
    convo = "\n".join(history[-6:])
    return f"{ctx}\nConversation so far:\n{convo}\n\nFounder asks: {message}"


async def gtm_chat(
    snap: CompanySnapshot,
    message: str,
    history: list[str] | None = None,
    model: ModelPort | None = None,
) -> ChatReply:
    """Conversational GTM Q&A grounded in the founder's own pipeline."""
    history = history or []
    if model is not None and message.strip():
        try:
            raw = await model.complete(_GTM_CHAT_SYSTEM, _gtm_chat_prompt(snap, message, history))
        except Exception:
            raw = ""
        if raw.strip():
            return ChatReply(reply=raw.strip(), source="ai")
    g = snap.gtm
    if not g.strategy.motion:
        reply = (
            "Generate your GTM plan first (the ✦ button up top) — once I can see your motion, "
            "pricing and pipeline I can answer with your numbers instead of generic advice."
        )
    else:
        reply = (
            f"You're running a {g.strategy.motion} motion with {len(g.accounts)} accounts on the "
            "list. My standing advice from your data: work the five questions in order — the "
            "first one still open is the one blocking revenue."
        )
    return ChatReply(reply=reply, source="engine")
