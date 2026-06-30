"""Early-journey assessment persistence tests."""

from __future__ import annotations

from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.intake import FounderIntake, IntakeRequest


def _intake() -> IntakeRequest:
    return IntakeRequest(
        company_name="Acme AI",
        owner_email="m@acme.ai",
        one_liner="x",
        industry="logistics",
        stage="mvp-build",
        jurisdiction="US",
        founders=[FounderIntake(name="M", email="m@acme.ai", role="CEO", equity_pct=100.0)],
    )


async def test_assessment_answers_persist_and_merge() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake())

    await svc.save_assessment(cid, 1, {"p1.m0.q0": "Marcus Lee", "p1.m0.q1": "USA"})
    await svc.save_assessment(cid, 1, {"p1.m1.q0": "Solve a problem"})  # merges into phase 1
    await svc.save_assessment(cid, 2, {"p2.m0.q0": "3PL ops managers"})

    snap = await svc.snapshot(cid)
    assert snap.assessments["1"]["p1.m0.q0"] == "Marcus Lee"
    assert snap.assessments["1"]["p1.m1.q0"] == "Solve a problem"  # merged, not overwritten
    assert snap.assessments["2"]["p2.m0.q0"] == "3PL ops managers"
