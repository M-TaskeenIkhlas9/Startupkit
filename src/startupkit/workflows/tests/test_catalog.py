"""Workflow catalog tests: 8 workflows, dependency gating, status derivation from the snapshot."""

from __future__ import annotations

from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.intake import FounderIntake, IntakeRequest
from startupkit.workflows.catalog import CATALOG, WorkflowView, status_for


def _intake(formation_status: str, ein: str | None = None) -> IntakeRequest:
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


def test_catalog_has_eight_workflows() -> None:
    assert [wf.code for wf in CATALOG] == ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]
    for wf in CATALOG:
        assert wf.phases, f"{wf.code} has no phases"


def test_w1_has_the_83b_fuse() -> None:
    w1 = next(wf for wf in CATALOG if wf.code == "W1")
    fuses = [d for ph in w1.phases for d in ph.documents if d.critical]
    assert any("83(b)" in d.name for d in fuses)


async def test_idea_stage_locks_everything_after_w1() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("idea")))
    views: dict[str, WorkflowView] = {v.definition.code: v for v in status_for(snap)}

    assert views["W1"].status == "available"
    assert all(views[c].status == "locked" for c in ["W2", "W3", "W4", "W5", "W6", "W7", "W8"])


async def test_formed_with_ein_unlocks_wave_one() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("formed", ein="88-1234567")))
    views: dict[str, WorkflowView] = {v.definition.code: v for v in status_for(snap)}

    assert views["W1"].status == "complete"
    # Wave 1 (formation-gated) becomes available
    for code in ["W2", "W3", "W4", "W5", "W8"]:
        assert views[code].status == "available", code
    # second-order deps stay locked until their parent is done
    assert views["W6"].status == "locked"  # needs W2
    assert views["W7"].status == "locked"  # needs W5


async def test_formed_without_ein_keeps_banking_locked() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("formed")))
    views: dict[str, WorkflowView] = {v.definition.code: v for v in status_for(snap)}

    assert views["W1"].status == "in-progress"  # formed but no EIN
    # W1 isn't complete without the EIN, so W3 (banking) stays locked behind W1.
    assert views["W3"].status == "locked"
    assert "W1" in views["W3"].blocked_reason


def test_every_phase_has_an_actor_and_cta() -> None:
    actors = {"startupkit", "provider", "founder"}
    for wf in CATALOG:
        for p in wf.phases:
            assert p.actor in actors
            assert p.cta
            # the founder should both get things done for them AND do some themselves
        assert {p.actor for p in wf.phases}, wf.code


async def test_completing_phases_advances_progress_and_unlocks() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake("formed", ein="88-1234567"))

    # W2 starts available with no phases done
    before = {v.definition.code: v for v in status_for(await svc.snapshot(cid))}
    assert before["W2"].status == "available"
    assert before["W6"].status == "locked"  # needs W2

    # complete all 4 phases of W2
    for n in range(1, 5):
        await svc.complete_phase(cid, "W2", n)

    after = {v.definition.code: v for v in status_for(await svc.snapshot(cid))}
    assert after["W2"].status == "complete"
    assert after["W2"].progress_pct == 100
    assert after["W6"].status == "available"  # W2 done -> W6 unlocks


async def test_completing_phases_raises_health_score() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake("formed", ein="88-1234567"))
    before = (await svc.health(cid)).overall
    # W4 (Technical) maps to the technical dimension, which isn't already maxed out.
    for n in range(1, 5):
        await svc.complete_phase(cid, "W4", n)
    after = (await svc.health(cid)).overall
    assert after > before
