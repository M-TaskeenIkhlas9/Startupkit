"""Compliance calendar tests: rule-pack derivation, statuses, and the 83(b) fuse."""

from __future__ import annotations

from datetime import date

from startupkit.core.company_object.projections.snapshot import CompanySnapshot, FounderView
from startupkit.core.services.compliance import compliance_calendar


def _founder() -> FounderView:
    return FounderView(
        founder_id="FD-1", name="M", email="m@x.co", role="CEO", equity_pct=100.0, vesting="4yr"
    )


def _formed(**kw: object) -> CompanySnapshot:
    base: dict[str, object] = {
        "company_id": "CO-20260101-AB12",
        "name": "Acme AI",
        "entity_type": "c-corp",
        "jurisdiction": "US",
        "formation_status": "formed",
        "team_size": 2,
    }
    base.update(kw)
    return CompanySnapshot(**base)  # type: ignore[arg-type]


def test_no_obligations_before_formation() -> None:
    snap = CompanySnapshot(company_id="CO-20260101-AB12", formation_status="idea")
    assert compliance_calendar(snap) == []


def test_formed_company_has_core_obligations() -> None:
    items = {i.id for i in compliance_calendar(_formed(), today=date(2026, 6, 21))}
    assert {"83b", "boi", "de-franchise", "fed-1120", "registered-agent"} <= items


def test_83b_is_overdue_and_critical_long_after_formation() -> None:
    # formed 2026-01-01 -> 83(b) due 2026-01-31; by June it's overdue
    cal = compliance_calendar(_formed(), today=date(2026, 6, 21))
    fuse = next(i for i in cal if i.id == "83b")
    assert fuse.severity == "critical"
    assert fuse.status == "overdue"


def test_83b_marked_done_when_phase_completed() -> None:
    snap = _formed(completed_phases={"W1": [1, 2, 3, 4]})
    fuse = next(i for i in compliance_calendar(snap, today=date(2026, 6, 21)) if i.id == "83b")
    assert fuse.status == "done"


def test_payroll_appears_only_with_employees() -> None:
    solo = _formed(team_size=1, founders=[_founder()])  # headcount == founders -> no payroll
    ids = {i.id for i in compliance_calendar(solo, today=date(2026, 6, 21))}
    assert "payroll-941" not in ids

    with_team = _formed(team_size=5, founders=[_founder()])  # hired beyond founders
    ids2 = {i.id for i in compliance_calendar(with_team, today=date(2026, 6, 21))}
    assert "payroll-941" in ids2
