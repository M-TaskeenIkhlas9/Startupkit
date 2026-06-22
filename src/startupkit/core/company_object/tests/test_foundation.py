"""Phase 1 (Foundation) tests: intake -> events -> snapshot -> Health Score -> next-actions."""

from __future__ import annotations

import pytest

from startupkit.core.company_object.memory_store import ConcurrencyError, InMemoryEventStore
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.intake import FounderIntake, IntakeRequest


def _intake() -> IntakeRequest:
    return IntakeRequest(
        company_name="Acme AI",
        owner_email="marcus@acme.ai",
        one_liner="AI co-pilot for warehouse logistics",
        industry="logistics",
        stage="mvp-build",
        jurisdiction="US",
        entity_type="c-corp",
        formation_status="idea",
        founders=[
            FounderIntake(name="Marcus", email="marcus@acme.ai", role="CEO", equity_pct=60.0),
            FounderIntake(name="Priya", email="priya@acme.ai", role="CTO", equity_pct=40.0),
        ],
    )


async def test_intake_creates_company_object() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    company_id = await svc.create_from_intake(_intake())

    assert company_id.startswith("CO-")
    snap = await svc.snapshot(company_id)
    assert snap.name == "Acme AI"
    assert snap.intake_complete is True
    assert len(snap.founders) == 2
    assert {d.domain for d in snap.domains} == {
        "legal", "finance", "equity", "technical", "brand",
        "people", "gtm", "operations", "fundraising", "compliance",
    }
    # every event was folded -> version reflects the full stream
    # created + profile + 2 founders + founder.profile + intake.completed = 6
    assert snap.version == 6


async def test_health_score_is_weighted_and_banded() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    company_id = await svc.create_from_intake(_intake())
    hs = await svc.health(company_id)

    assert 0 <= hs.overall <= 100
    assert sum(d.weight for d in hs.dimensions) == 100
    assert hs.status in {"strong", "healthy", "moderate", "at-risk", "critical"}
    # idea-stage company should not look investor-ready yet
    assert hs.overall < 65


async def test_formed_company_scores_higher_than_idea() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    idea = await svc.health(await svc.create_from_intake(_intake()))

    formed_req = _intake()
    formed_req.formation_status = "formed"
    formed_req.ein = "88-1234567"
    formed = await svc.health(await svc.create_from_intake(formed_req))

    assert formed.overall > idea.overall


async def test_next_actions_follow_dependency_order() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    company_id = await svc.create_from_intake(_intake())
    actions = await svc.next_actions(company_id)

    assert actions[0].priority == 1
    assert actions[0].workflow == "W1"  # not formed yet -> form the entity first


async def test_optimistic_concurrency_guard() -> None:
    store = InMemoryEventStore()
    svc = CompanyObjectService(store)
    company_id = await svc.create_from_intake(_intake())

    # the stream head is no longer 0, so a second append at sequence 0 must fail
    with pytest.raises(ConcurrencyError):
        await store.append(company_id, [], expected_sequence=0)
