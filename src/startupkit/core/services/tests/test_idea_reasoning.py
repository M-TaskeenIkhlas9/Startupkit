"""AI Co-Founder idea-reasoning tests (offline/template path)."""

from __future__ import annotations

from startupkit.adapters.model_template import TemplateModelAdapter
from startupkit.core.services.idea_reasoning import reason_about_idea
from startupkit.core.services.idea_validation import IdeaValidationAnswers, assess_idea


def _answers(**kw: object) -> IdeaValidationAnswers:
    base: dict[str, object] = {
        "problem": "Warehouses lose hours every day to manual pick-route planning",
        "customer": "Ops managers at mid-size 3PL warehouses",
        "solution": "AI that generates optimal pick paths from the existing WMS",
    }
    base.update(kw)
    return IdeaValidationAnswers(**base)  # type: ignore[arg-type]


async def test_strong_idea_gets_go_verdict() -> None:
    a = _answers(
        customer_conversations="20+",
        problem_evidence="strong-evidence",
        willingness_to_pay="loi-or-paying",
        market_size="large",
        differentiation="strong-moat",
        founder_market_fit="deep-expertise",
        mvp_status="shipped",
        revenue_status="paying",
    )
    r = await reason_about_idea(a, assess_idea(a), TemplateModelAdapter())
    assert r.verdict in ("strong-go", "promising")
    assert r.should_proceed is True
    assert r.strengths and r.reasoning
    assert r.source == "engine"  # no LLM key -> assembled narrative


async def test_weak_idea_gets_pivot_and_improvements() -> None:
    a = _answers(
        differentiation="me-too",
        market_size="niche",
        willingness_to_pay="no-signal",
        problem_evidence="assumption",
    )
    r = await reason_about_idea(a, assess_idea(a), TemplateModelAdapter())
    assert r.verdict in ("pivot", "needs-work")
    assert r.should_proceed is False
    assert r.improvements  # tells the founder what to fix
    assert r.concerns


async def test_thin_problem_statement_is_flagged() -> None:
    a = _answers(problem="logistics")
    r = await reason_about_idea(a, assess_idea(a), TemplateModelAdapter())
    assert any("thin" in c.lower() or "specific" in c.lower() for c in r.concerns)
