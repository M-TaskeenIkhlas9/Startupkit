"""Persisted go-to-market types — the "Revenue Engine" state W7 produces.

These live in the company-object layer (not the service layer) so both `events.py` and the snapshot
projection can import them without a cycle. Stored via the `gtm.state.set` event and replaced
wholesale (last-write-wins), same contract as the W5 Brand Core.

Boundary with W5 — W5 produces the file; W7 produces the reply, the payment, and the evidence.
W5's ICP, positioning, voice and deck arrive as *inherited context* and are never re-asked here;
W7 only stores what it decides itself (motion, pricing, target accounts, sequences, connections).
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class GtmStrategy(BaseModel):
    """How this company sells — the first fork, which reconfigures everything downstream."""

    motion: str = ""  # outbound | plg | hybrid
    motion_rationale: str = ""  # why this motion fits THIS company (ACV x complexity x buyer)
    objective: str = ""  # first_customers | waitlist | launch | fundraise
    channels: list[str] = Field(default_factory=list)  # the 2-3 chosen channels
    summary: str = ""  # the executive summary of the 90-day plan


class PricingTier(BaseModel):
    name: str = ""
    price: str = ""  # display price, e.g. "$49/seat/mo"
    unit: str = ""  # seat | usage | flat | feature
    features: list[str] = Field(default_factory=list)


class Pricing(BaseModel):
    """The pricing decision lives in W7; the pricing *page* lives in W5."""

    model: str = ""  # freemium | flat | seat | usage | tiered
    tiers: list[PricingTier] = Field(default_factory=list)
    pilot: str = ""  # the design-partner / pilot offer
    locked: bool = False  # fires pricing_locked -> W5 regenerates pricing-page copy


class TargetAccount(BaseModel):
    name: str = ""
    domain: str = ""
    size: str = ""  # headcount band
    trigger: str = ""  # the buying trigger that put them on the list
    stage: str = "prospect"  # prospect | contacted | replied | demo | pilot | won | lost
    owner: str = ""  # who on YOUR side owns this account
    contact: str = ""  # the human at THEIR side you're writing to
    email: str = ""  # their address. We don't enrich — you paste it, or export to Clay/Apollo.


class Sequence(BaseModel):
    """W7 composes and schedules. It never sends from our IPs — the founder sends."""

    name: str = ""
    channel: str = ""  # email | linkedin
    steps: list[str] = Field(default_factory=list)  # the touch copy, in order
    approved: bool = False


class Connection(BaseModel):
    """A tool W7 hands off to. StartupKit records that it's connected; it stores no credentials."""

    kind: str = ""  # crm | analytics | email | payments
    provider: str = ""  # hubspot | attio | ga4 | posthog | resend | stripe
    status: str = "off"  # off | connected | verified
    detail: str = ""


class LostDeal(BaseModel):
    account: str = ""
    reason: str = ""  # price | timing | competitor | no_budget | no_need
    note: str = ""


class Campaign(BaseModel):
    """The container the rest of W7 hangs on: a sequence, some accounts, and a date.

    Progress is never stored — it's computed from the real stage of the accounts attributed to it,
    so a campaign can't claim 65% while nothing has actually moved.
    """

    id: str = ""
    name: str = ""
    goal: str = ""
    channel: str = ""  # outbound | content | launch | referral
    start: str = ""
    end: str = ""
    status: str = "draft"  # draft | planning | active | done
    accounts: list[str] = Field(default_factory=list)  # account names attributed to this campaign
    sequence: str = ""  # the sequence name this campaign sends


class Task(BaseModel):
    """One executable step from the 90-day plan — the plan you run, not the plan you read."""

    text: str = ""
    link: str = ""  # the W7 module id this task opens
    due: str = ""
    priority: str = "medium"  # high | medium | low
    done: bool = False


class DesignPartner(BaseModel):
    """The pre-seed motion: 5-10 partners trading access for feedback, walked to paid."""

    name: str = ""
    contact: str = ""
    email: str = ""
    # identified | pitched | agreed | onboarded | feedback | reference | paying
    stage: str = "identified"
    notes: str = ""


class ContentIdea(BaseModel):
    """One piece of the content engine — generated from the Brand Core, scheduled by week."""

    title: str = ""
    platform: str = ""  # blog | linkedin | x
    week: int = 1
    done: bool = False


class Experiment(BaseModel):
    """One GTM bet, run to a verdict. Hypothesis in, decision out — no zombie experiments."""

    id: str = ""
    hypothesis: str = ""  # "If we lead with the funding trigger, reply rate doubles"
    metric: str = ""  # the ONE number that settles it
    result: str = ""  # what actually happened, in that number
    status: str = "running"  # running | proved | disproved
    decision: str = ""  # keep | kill | scale — what you'll DO about it


class GtmInputs(BaseModel):
    """What the founder chose or corrected us on.

    W7 infers the motion signals from the Company Object, but the founder can override any of them.
    Those overrides live here so (a) nothing resets on reload and (b) a later re-read never silently
    overwrites a human decision. Empty string = "we haven't been corrected, use our read".
    """

    acv: str = ""  # low | mid | high
    self_serve: str = ""  # yes | no
    committee: str = ""  # one | few | many
    size_band: str = ""  # the ICP firmographic band
    triggers: list[str] = Field(default_factory=list)  # the buying triggers they care about
    disqualifiers: str = ""
    tier_counts: list[int] = Field(default_factory=list)  # expected yr-1 customers per tier
    # Van Westendorp: [too_cheap, bargain, expensive, too_expensive, n]
    wtp: list[int] = Field(default_factory=list)
    capture_fields: list[str] = Field(default_factory=list)  # landing form fields
    thanks: str = ""  # landing thank-you copy
    utm_source: str = ""
    utm_medium: str = ""
    utm_campaign: str = ""
    crm_model: str = ""  # relationship | deal
    # The founder's own checkout URL (Stripe Payment Link, invoice page...). We never take the
    # money and never hold their keys — they paste the link, W7 puts it in front of the buyer.
    payment_link: str = ""


class GtmState(BaseModel):
    inputs: GtmInputs = Field(default_factory=GtmInputs)
    strategy: GtmStrategy = Field(default_factory=GtmStrategy)
    pricing: Pricing = Field(default_factory=Pricing)
    accounts: list[TargetAccount] = Field(default_factory=list)
    sequences: list[Sequence] = Field(default_factory=list)
    connections: list[Connection] = Field(default_factory=list)
    lost_deals: list[LostDeal] = Field(default_factory=list)
    campaigns: list[Campaign] = Field(default_factory=list)
    tasks: list[Task] = Field(default_factory=list)
    partners: list[DesignPartner] = Field(default_factory=list)
    content: list[ContentIdea] = Field(default_factory=list)
    experiments: list[Experiment] = Field(default_factory=list)
    steps_done: list[str] = Field(default_factory=list)  # W7 module/step ids completed
