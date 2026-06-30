"""Journey graph tests: position derivation and next-step."""

from __future__ import annotations

from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.intake import FounderIntake, IntakeRequest
from startupkit.core.services.journey import journey_graph


def _intake(stage: str = "mvp-build", formation_status: str = "idea") -> IntakeRequest:
    return IntakeRequest(
        company_name="Acme AI",
        owner_email="m@acme.ai",
        one_liner="AI router",
        industry="logistics",
        stage=stage,  # type: ignore[arg-type]
        jurisdiction="US",
        formation_status=formation_status,  # type: ignore[arg-type]
        readiness_score=60,
        problem="x",
        customer="y",
        solution="z",
        founders=[FounderIntake(name="M", email="m@acme.ai", role="CEO", equity_pct=100.0)],
    )


async def test_journey_positions_founder_and_marks_next() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake(stage="mvp-build")))
    j = journey_graph(snap, {})

    by_id = {n.id: n for n in j.nodes}
    # idea, validation, discovery, psf are done at mvp-build stage; mvp is current
    assert by_id["idea"].status == "done"
    assert by_id["validation"].status == "done"
    assert by_id["mvp"].status in ("done", "current")
    cur = j.nodes[j.current_index]
    assert cur.status == "current"
    assert j.next_action  # there's always a clear next step
    # the current/next node names a winning move to learn from
    assert any(n.winner_move for n in j.nodes)


async def test_formation_node_completes_when_w1_done() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake(formation_status="formed")))
    # W1 complete -> formation node done
    j = journey_graph(snap, {"W1": "complete", "W2": "complete"})
    by_id = {n.id: n for n in j.nodes}
    assert by_id["formation"].status == "done"
    assert by_id["ip"].status == "done"
