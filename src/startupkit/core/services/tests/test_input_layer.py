"""Founder Input Layer tests: profile, milestones, integrations, notes, evidence."""

from __future__ import annotations

from startupkit.core.company_object.events import FounderProfileSet
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
        founder_name="Marcus Lee",
        founder_background="10 years in warehouse robotics",
        founder_goals="Build a category-defining logistics AI company",
        risk_tolerance="aggressive",
        founder_experience="serial",
        founders=[
            FounderIntake(name="Marcus Lee", email="m@acme.ai", role="CEO", equity_pct=100.0)
        ],
    )


async def test_intake_captures_founder_profile() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake()))
    p = snap.founder_profile
    assert p.completed is True
    assert p.name == "Marcus Lee"
    assert p.risk_tolerance == "aggressive"
    assert p.experience == "serial"
    assert "robotics" in p.background


async def test_input_layer_items_accumulate() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake())

    await svc.log_milestone(cid, "First 10 customer interviews", "customer", "2026-06-01")
    await svc.connect_integration(cid, "Mercury", "banking")
    await svc.record_note(cid, "question", "Should I form before or after my first hire?")
    await svc.add_evidence(cid, "Seed pitch deck v3", "pitch", ref="deck.pdf")

    snap = await svc.snapshot(cid)
    assert [m.title for m in snap.milestones] == ["First 10 customer interviews"]
    assert snap.integrations[0].provider == "Mercury"
    assert snap.notes[0].kind == "question"
    assert snap.notes[0].created_at  # stamped from the event envelope
    assert snap.evidence[0].name == "Seed pitch deck v3"


async def test_founder_profile_can_be_updated() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake())
    await svc.set_founder_profile(
        cid,
        FounderProfileSet(name="Marcus Lee", goals="Reach $1M ARR", risk_tolerance="balanced"),
    )
    snap = await svc.snapshot(cid)
    assert snap.founder_profile.goals == "Reach $1M ARR"
    assert snap.founder_profile.risk_tolerance == "balanced"
