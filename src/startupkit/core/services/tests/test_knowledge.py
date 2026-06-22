"""Case-Study + Recommendation engine tests."""

from __future__ import annotations

from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.company_object.projections.snapshot import CompanySnapshot, FounderView
from startupkit.core.services.case_studies import relevant_case_studies
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.intake import FounderIntake, IntakeRequest
from startupkit.core.services.recommendations import recommendations_for


def _intake(formation_status: str = "idea", ein: str | None = None) -> IntakeRequest:
    return IntakeRequest(
        company_name="Acme AI",
        owner_email="m@acme.ai",
        one_liner="x",
        industry="logistics",
        stage="mvp-build",
        jurisdiction="US",
        entity_type="c-corp",
        formation_status=formation_status,  # type: ignore[arg-type]
        ein=ein,
        founders=[FounderIntake(name="M", email="m@acme.ai", role="CEO", equity_pct=100.0)],
    )


async def test_case_studies_match_situation() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    # formed but no EIN -> 83(b) phase incomplete -> the 83(b) cautionary tale is relevant
    snap = await svc.snapshot(await svc.create_from_intake(_intake("formed")))
    studies = relevant_case_studies(snap, {})
    ids = {s.id for s in studies}
    assert "no-ein-no-bank" in ids
    assert all(s.story and s.lesson and s.action for s in studies)


async def test_case_studies_never_empty() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("idea")))
    assert relevant_case_studies(snap, {}) != []


async def test_recommendations_are_rich_and_prioritized() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("idea")))
    recs = recommendations_for(snap, {"W1": "available"})

    assert recs[0].priority == 1
    top = recs[0]
    # rich fields are all populated
    assert top.why_it_matters and top.reasoning and top.steps and top.expected_outcome
    assert top.workflow == "W1"  # form the entity first


def test_recommendation_has_83b_deadline_when_formed() -> None:
    # formed + EIN but the 83(b) phase (W1#4) not yet completed -> the fuse recommendation fires
    snap = CompanySnapshot(
        company_id="CO-20260101-AB12",
        formation_status="formed",
        entity_type="c-corp",
        jurisdiction="US",
        ein="88-1234567",
        completed_phases={"W1": [1, 2, 3]},
        founders=[
            FounderView(
                founder_id="FD-1", name="M", email="m@x.co", role="CEO", equity_pct=100.0,
                vesting="4yr",
            )
        ],
    )
    recs = recommendations_for(snap, {})
    fuse = next((r for r in recs if r.id == "file-83b"), None)
    assert fuse is not None
    assert fuse.deadline
    assert fuse.case_study_id == "83b-missed"
