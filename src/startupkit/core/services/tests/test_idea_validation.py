"""Idea validation tests: stage detection, readiness scoring, risks, recommendation."""

from __future__ import annotations

from startupkit.core.services.idea_validation import IdeaValidationAnswers, assess_idea


def _answers(**kw: object) -> IdeaValidationAnswers:
    base: dict[str, object] = {
        "problem": "Warehouses lose hours to manual picking routes",
        "customer": "Mid-size 3PL warehouse ops managers",
        "solution": "AI that generates optimal pick paths",
    }
    base.update(kw)
    return IdeaValidationAnswers(**base)  # type: ignore[arg-type]


def test_pre_founder_when_no_validation() -> None:
    a = assess_idea(_answers())
    assert a.detected_stage == "pre-founder"
    assert a.verdict == "early"
    assert a.recommendation.action == "validate-more"
    assert any(r.title == "Problem not yet validated" for r in a.risks)


def test_strong_traction_detects_revenue_stage_and_recommends_forming() -> None:
    a = assess_idea(
        _answers(
            customer_conversations="20+",
            problem_evidence="strong-evidence",
            willingness_to_pay="loi-or-paying",
            market_size="large",
            differentiation="strong-moat",
            founder_market_fit="deep-expertise",
            mvp_status="shipped",
            revenue_status="paying",
            team="cofounders",
            commitment="full-time",
        )
    )
    assert a.detected_stage in ("first-revenue", "pmf")
    assert a.readiness_score >= 65
    assert a.verdict == "promising"
    assert a.recommendation.action == "form-now"


def test_building_without_discovery_is_flagged() -> None:
    a = assess_idea(_answers(mvp_status="building", customer_conversations="none"))
    assert any(r.title == "Building before talking to customers" for r in a.risks)


def test_readiness_is_bounded_and_signals_present() -> None:
    a = assess_idea(_answers(customer_conversations="5-20", problem_evidence="some-signal"))
    assert 0 <= a.readiness_score <= 100
    assert {s.label for s in a.signals} == {
        "Customer discovery",
        "Problem evidence",
        "Willingness to pay",
        "Market size",
        "Differentiation",
        "Founder–market fit",
        "Product",
        "Revenue",
    }


def test_new_market_questions_drive_risks() -> None:
    # me-too product, niche market, VC ambition, no willingness-to-pay signal while building
    a = assess_idea(
        _answers(
            mvp_status="building",
            willingness_to_pay="no-signal",
            market_size="niche",
            differentiation="me-too",
            goal="vc-scale",
        )
    )
    titles = {r.title for r in a.risks}
    assert "Building without proof anyone will pay" in titles
    assert "Small market for a VC-scale plan" in titles
    assert "No clear differentiation" in titles


def test_willingness_to_pay_lifts_readiness() -> None:
    base = assess_idea(_answers(customer_conversations="5-20", problem_evidence="some-signal"))
    paid = assess_idea(
        _answers(
            customer_conversations="5-20",
            problem_evidence="some-signal",
            willingness_to_pay="loi-or-paying",
        )
    )
    assert paid.readiness_score > base.readiness_score
