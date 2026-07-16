"""W5 Brand engine tests — play matching, grounded Brand Core, deterministic fallback, health."""

from __future__ import annotations

import startupkit.workflows.catalog  # noqa: F401  (import order: resolve the catalog chain first)
from startupkit.core.company_object.brand_types import BrandState
from startupkit.core.company_object.projections.snapshot import CompanySnapshot
from startupkit.core.services.brand import (
    brand_cases_for,
    brand_coach,
    brand_health,
    check_presence,
    generate_brand_core,
    generate_visual_system,
    match_plays,
)


def _fintech() -> CompanySnapshot:
    return CompanySnapshot(
        company_id="CO-1",
        name="Northwind",
        industry="fintech payments",
        one_liner="AI spend controls for startups",
        customer="startup finance teams",
        problem="expense approvals are slow and leak money",
        solution="automated policy-enforced corporate cards",
        facts={"willingness_to_pay": "$200/month, LOI signed"},
    )


def test_match_plays_picks_trust_first_for_fintech() -> None:
    plays = match_plays(_fintech())
    assert plays[0].play_id == "trust-first"
    assert "Stripe" in plays[0].rationale  # cites a real named brand
    assert all(p.score >= 0 for p in plays)


def test_match_plays_never_empty_for_blank_company() -> None:
    plays = match_plays(CompanySnapshot(company_id="CO-2", name="Acme"))
    assert plays  # always returns a ranked list
    assert plays[0].play_id == "category-creator"  # gentle fallback for an undefined market


async def test_brand_core_deterministic_without_model() -> None:
    snap = _fintech()
    core = await generate_brand_core(snap, "trust-first")  # no model, no search
    assert core.source == "engine"
    assert core.play_id == "trust-first"
    assert "Northwind" in core.positioning and "startup finance teams" in core.positioning
    assert core.tagline and len(core.pillars) == 3
    assert core.play_rationale  # carries the co-founder's reasoning


async def test_visual_system_matches_the_play() -> None:
    core = await generate_brand_core(_fintech(), "trust-first")
    vis = generate_visual_system(core)
    assert len(vis.palette) >= 3 and vis.type_display and vis.type_body
    assert any(sw.role == "primary" for sw in vis.palette)


async def test_brand_health_scores_a_full_core() -> None:
    snap = _fintech()
    core = await generate_brand_core(snap, "trust-first")
    state = BrandState(core=core, visual=generate_visual_system(core),
                       presence=await check_presence(snap.name))
    health = brand_health(state)
    assert 0 <= health.score <= 100
    assert health.score >= 75 and health.label == "Strong"
    assert len(health.dimensions) == 6


def test_brand_cases_match_play_and_step() -> None:
    cases = brand_cases_for("trust-first", "design")
    assert cases and all("design" in c.steps for c in cases)
    assert any(c.brand == "Mercury" for c in cases)  # a real, named case study


async def test_wordmark_favicon_and_site_derive_from_the_core() -> None:
    from startupkit.core.services.brand_assets import (
        render_site_html,
        svg_favicon,
        svg_wordmark,
    )

    snap = _fintech()
    snap.name = "Northwind"
    snap.brand.core = await generate_brand_core(snap, "trust-first")
    snap.brand.visual = generate_visual_system(snap.brand.core)

    wm = svg_wordmark(snap.name, snap.brand.visual)
    assert wm.startswith("<svg") and "Northwind" in wm
    assert snap.brand.visual.palette[0].hex in wm  # uses the brand's primary color
    fav = svg_favicon(snap.name, snap.brand.visual)
    assert fav.startswith("<svg") and ">N<" in fav  # the initial
    site = render_site_html(snap)
    assert "<!doctype html>" in site and "Northwind" in site
    assert snap.brand.core.tagline in site  # the page is built from the Core


async def test_site_templates_are_distinct_and_on_brand() -> None:
    from startupkit.core.services.brand_assets import SITE_TEMPLATES, render_site_html

    snap = _fintech()
    snap.name = "Northwind"
    snap.brand.core = await generate_brand_core(snap, "challenger")
    snap.brand.visual = generate_visual_system(snap.brand.core)
    markers = {"minimal": "hero-min", "bold": "bold-hero", "classic": "class=\"split\""}
    for tpl in SITE_TEMPLATES:
        html = render_site_html(snap, tpl)
        assert html.startswith("<!doctype html>") and "Northwind" in html
        assert markers[tpl] in html  # each template renders its own distinct layout
        assert snap.brand.visual.palette[0].hex in html  # on-brand color


async def test_brand_chat_falls_back_without_a_model() -> None:
    from startupkit.core.services.brand import brand_chat

    snap = _fintech()
    snap.brand.core = await generate_brand_core(snap, "trust-first")
    reply = await brand_chat(snap, "Is my tagline strong enough?", [])  # no model
    assert reply.source == "engine" and reply.reply
    assert snap.brand.core.positioning in reply.reply  # grounded in the Brand Core


async def test_brand_coach_guides_each_step_with_cases() -> None:
    snap = _fintech()
    for step in ("define", "design", "deploy"):
        tip = await brand_coach(snap, "trust-first", step)  # no model -> deterministic
        assert tip.step == step and tip.headline and tip.guidance and tip.watch_out
        assert tip.cases  # always backs the guidance with real brands
        assert tip.source == "engine"
