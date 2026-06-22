"""Startup Health Score projection — 0-100 across 8 weighted dimensions.

Weights and status bands come from the canonical spec (PRD v2 Vol 1 / Alignment doc):
  Financial 25 · Legal 20 · People 20 · Technical 10 · Growth 10 · Brand 5 · Ops 5 · Fundraising 5
  Strong 80+ · Healthy 65-79 · Moderate 50-64 · At Risk 35-49 · Critical <35

Phase 1 derives a *baseline* score (typically 30-40 at idea stage) from intake facts alone. Later
phases feed real signals (banking balance, runway, contracts signed, commits) into each dimension.
Pure function of the snapshot — no DB.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from startupkit.core.company_object.projections.snapshot import CompanySnapshot

Dimension = Literal[
    "financial",
    "legal",
    "people",
    "technical",
    "growth",
    "brand",
    "operations",
    "fundraising",
]
Status = Literal["strong", "healthy", "moderate", "at-risk", "critical"]

WEIGHTS: dict[Dimension, int] = {
    "financial": 25,
    "legal": 20,
    "people": 20,
    "technical": 10,
    "growth": 10,
    "brand": 5,
    "operations": 5,
    "fundraising": 5,
}


class DimensionScore(BaseModel):
    dimension: Dimension
    score: int  # 0-100 for this dimension
    weight: int  # percent weight in the overall
    contribution: float  # score * weight / 100


class HealthScore(BaseModel):
    overall: int  # 0-100
    status: Status
    dimensions: list[DimensionScore]


def project_health_score(snap: CompanySnapshot) -> HealthScore:
    raw = _dimension_scores(snap)
    dims: list[DimensionScore] = []
    overall = 0.0
    for dim, weight in WEIGHTS.items():
        score = max(0, min(100, raw[dim]))
        contribution = score * weight / 100
        overall += contribution
        dims.append(
            DimensionScore(dimension=dim, score=score, weight=weight, contribution=contribution)
        )
    total = round(overall)
    return HealthScore(overall=total, status=_status(total), dimensions=dims)


def _dimension_scores(snap: CompanySnapshot) -> dict[Dimension, int]:
    formed = snap.formation_status == "formed"
    forming = snap.formation_status in ("forming", "formed")
    has_ein = snap.ein is not None
    equity_assigned = abs(sum(f.equity_pct for f in snap.founders) - 100.0) < 0.01

    legal = 10
    if forming:
        legal += 25
    if formed:
        legal += 25
    if has_ein:
        legal += 20
    if snap.entity_type == "c-corp":
        legal += 10  # investor-ready entity

    people = 15 + min(len(snap.founders), 3) * 15
    if equity_assigned:
        people += 20

    financial = 10
    if has_ein:
        financial += 15  # can open banking once EIN exists
    if snap.stage in ("first-revenue", "pmf", "pre-seed", "series-a"):
        financial += 25

    technical = 15 + (20 if snap.website else 0)
    if snap.stage in ("mvp-build", "first-revenue", "pmf", "pre-seed", "series-a"):
        technical += 25

    growth = {
        "pre-founder": 5,
        "discovery": 15,
        "problem-solution-fit": 30,
        "mvp-build": 40,
        "first-revenue": 60,
        "pmf": 75,
        "pre-seed": 80,
        "series-a": 90,
    }.get(snap.stage, 10)

    brand = 10 + (25 if snap.one_liner else 0) + (15 if snap.industry else 0)
    operations = 20 if snap.intake_complete else 5
    fundraising = 10 + (20 if snap.target_round else 0) + (10 if snap.target_amount_usd else 0)

    scores: dict[Dimension, int] = {
        "financial": financial,
        "legal": legal,
        "people": people,
        "technical": technical,
        "growth": growth,
        "brand": brand,
        "operations": operations,
        "fundraising": fundraising,
    }

    # Completing workflow phases is real progress — reward it in the mapped dimension (+6 each).
    workflow_dim: dict[str, Dimension] = {
        "W1": "legal",
        "W2": "legal",
        "W3": "financial",
        "W4": "technical",
        "W5": "brand",
        "W6": "people",
        "W7": "growth",
        "W8": "operations",
    }
    for code, phases in snap.completed_phases.items():
        dim = workflow_dim.get(code)
        if dim is not None:
            scores[dim] += len(set(phases)) * 6

    return scores


def _status(total: int) -> Status:
    if total >= 80:
        return "strong"
    if total >= 65:
        return "healthy"
    if total >= 50:
        return "moderate"
    if total >= 35:
        return "at-risk"
    return "critical"
