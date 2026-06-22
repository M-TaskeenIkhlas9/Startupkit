"""Intelligence layer tests: guardrails, risk register, and the AI Co-Founder advisor."""

from __future__ import annotations

from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.services.advisor import ask
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.guardrails import check
from startupkit.core.services.intake import FounderIntake, IntakeRequest
from startupkit.core.services.risks import company_risks


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


async def test_guardrail_blocks_hiring_before_formation() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("idea")))
    g = check("hire-employee", snap, {})
    assert g.verdict == "blocked"
    assert any(p.label == "Entity is formed" and not p.met for p in g.prerequisites)


async def test_guardrail_blocks_banking_without_ein() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("formed")))  # no EIN
    g = check("open-banking", snap, {})
    assert g.verdict == "blocked"
    assert any("EIN" in p.label and not p.met for p in g.prerequisites)


async def test_risk_register_flags_unfiled_83b_for_formed_company() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    # formed but no EIN -> W1 incomplete -> 83(b) phase (4) not done
    snap = await svc.snapshot(await svc.create_from_intake(_intake("formed")))
    risks = company_risks(snap, {})
    assert any(r.id == "no-ein" for r in risks)
    assert risks[0].severity in ("critical", "high")  # sorted worst-first


async def test_advisor_routes_questions_to_grounded_answers() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("idea")))

    nxt = ask("what should I do next?", snap, {"W1": "available"})
    assert nxt.intent == "next-step"
    assert nxt.actions  # has at least one suggested action

    hire = ask("can I hire someone?", snap, {})
    assert hire.intent == "hiring"
    assert "✗" in " ".join(hire.facts)  # an unmet prerequisite is shown

    health = ask("how healthy is my company?", snap, {})
    assert health.intent == "health"
    assert "/100" in health.headline
