"""Persisted brand identity types — the living "Brand Core" W5 produces and everything syncs to.

These live in the company-object layer (not the service layer) so both `events.py` and the snapshot
projection can import them without a cycle. The W5 brand engine (`core/services/brand.py`) computes
them; the founder edits them; they are stored via the `brand.state.set` event and replace wholesale
(last-write-wins), so the Brand Core is a single source of truth the site/deck/one-pager read from.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class BrandCore(BaseModel):
    """The strategic heart of the brand — generated from the Company Object, refined by you."""

    play_id: str = ""  # the matched Brand Play (see core/services/brand.py _PLAYS)
    play_name: str = ""
    play_rationale: str = ""  # why this play fits THIS company (the co-founder's reasoning)
    examples: list[str] = Field(default_factory=list)  # real brands that ran this play
    mission: str = ""
    vision: str = ""
    values: list[str] = Field(default_factory=list)
    icp: str = ""  # ideal customer profile, one line
    category: str = ""  # the category the company competes in / creates
    positioning: str = ""  # the "For X who Y, [product] is a [category] that Z; unlike A, we B."
    voice: str = ""  # how the brand speaks
    tagline: str = ""
    pitch: str = ""  # one-sentence elevator pitch
    pillars: list[str] = Field(default_factory=list)  # 3 message pillars
    sources: list[str] = Field(default_factory=list)  # live-research URLs the read was grounded in
    source: str = ""  # "ai" (LLM-written narrative) | "engine" (deterministic)


class ColorSwatch(BaseModel):
    name: str
    hex: str
    role: str  # primary | ink | paper | accent | support


class VisualSystem(BaseModel):
    """A see-able style system — palette + type pairing + logo direction — not a PDF guideline."""

    palette: list[ColorSwatch] = Field(default_factory=list)
    type_display: str = ""
    type_body: str = ""
    logo_direction: str = ""  # a written brief a designer (or Figma) can execute


class PresenceItem(BaseModel):
    """One name/domain/handle/trademark availability result — living presence state."""

    kind: str  # domain | handle | trademark
    handle: str
    status: str  # available | taken | unknown
    detail: str = ""


class BrandState(BaseModel):
    core: BrandCore = Field(default_factory=BrandCore)
    visual: VisualSystem = Field(default_factory=VisualSystem)
    presence: list[PresenceItem] = Field(default_factory=list)
    site_template: str = "minimal"  # which published-site template: minimal | bold | classic
    steps_done: list[str] = Field(default_factory=list)  # W5 dashboard module/step ids completed
    asset_edits: dict[str, str] = Field(default_factory=dict)  # founder edits to Marketing Assets
