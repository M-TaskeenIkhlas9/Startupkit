"""Compliance & Regulatory Intelligence — the per-company deadline calendar (FR-M1, FR-M2).

A deterministic rule-pack (data, not AI) that derives a company's filing obligations from its
Company Object: entity type, jurisdiction, formation date, team, and revenue. This is the engine
behind "kept current for life" — it surfaces what's due, when, and whether it's overdue, with the
83(b) election treated as a critical fuse.

The company's formation date is taken from its ID (CO-YYYYMMDD-XXXX), so the calendar is fully
deterministic and needs no external service.
"""

from __future__ import annotations

from datetime import date, timedelta

from pydantic import BaseModel

from startupkit.core.company_object.projections.snapshot import CompanySnapshot

Status = ["overdue", "due-soon", "upcoming", "done"]


class ComplianceItem(BaseModel):
    id: str
    title: str
    authority: str  # IRS, Delaware, FinCEN, State
    category: str  # tax | corporate | regulatory
    due_date: str  # ISO (YYYY-MM-DD)
    frequency: str  # one-time | annual | quarterly
    status: str  # overdue | due-soon | upcoming | done
    severity: str  # critical | standard
    note: str = ""


def compliance_calendar(snap: CompanySnapshot, today: date | None = None) -> list[ComplianceItem]:
    today = today or date.today()
    formed_on = _formation_date(snap.company_id) or today
    items: list[ComplianceItem] = []

    if snap.formation_status != "formed":
        return items  # obligations begin at formation

    is_ccorp = snap.entity_type == "c-corp"
    us = snap.jurisdiction == "US"
    eightythree_b_done = 4 in snap.completed_phases.get("W1", [])

    # 83(b) election — the irreversible fuse: 30 days from the stock grant (≈ formation here).
    items.append(
        _item(
            "83b",
            "File 83(b) election",
            "IRS",
            "tax",
            formed_on + timedelta(days=30),
            "one-time",
            today,
            severity="critical",
            done=eightythree_b_done,
            note="Form 15620 — 30 days from stock grant. No extensions.",
        )
    )
    # FinCEN Beneficial Ownership Information — within 90 days of formation.
    if us:
        items.append(
            _item(
                "boi",
                "FinCEN Beneficial Ownership (BOI) report",
                "FinCEN",
                "regulatory",
                formed_on + timedelta(days=90),
                "one-time",
                today,
                note="Initial BOI report due within 90 days of formation.",
            )
        )
    # Delaware franchise tax + annual report — annually by March 1 (C-corps).
    if is_ccorp and us:
        items.append(
            _item(
                "de-franchise",
                "Delaware franchise tax & annual report",
                "Delaware",
                "corporate",
                _next_annual(today, month=3, day=1),
                "annual",
                today,
                note="Filed with the Delaware Secretary of State.",
            )
        )
    # Federal corporate income tax — Form 1120, annually by April 15.
    if us:
        items.append(
            _item(
                "fed-1120",
                "Federal income tax return (Form 1120)",
                "IRS",
                "tax",
                _next_annual(today, month=4, day=15),
                "annual",
                today,
            )
        )
    # Payroll tax — Form 941, quarterly, once there's a team beyond the founders.
    if snap.team_size > len(snap.founders):
        items.append(
            _item(
                "payroll-941",
                "Payroll tax filing (Form 941)",
                "IRS",
                "tax",
                _next_quarter_end(today),
                "quarterly",
                today,
                note="Required once you have employees on payroll.",
            )
        )
    # Registered agent renewal — annual.
    if us:
        items.append(
            _item(
                "registered-agent",
                "Registered agent renewal",
                "Delaware",
                "corporate",
                _next_annual(today, formed_on.month, formed_on.day),
                "annual",
                today,
            )
        )

    return sorted(items, key=lambda i: (i.status != "overdue", i.due_date))


def _item(
    id_: str,
    title: str,
    authority: str,
    category: str,
    due: date,
    frequency: str,
    today: date,
    *,
    severity: str = "standard",
    done: bool = False,
    note: str = "",
) -> ComplianceItem:
    if done:
        status = "done"
    elif due < today:
        status = "overdue"
    elif due <= today + timedelta(days=30):
        status = "due-soon"
    else:
        status = "upcoming"
    return ComplianceItem(
        id=id_,
        title=title,
        authority=authority,
        category=category,
        due_date=due.isoformat(),
        frequency=frequency,
        status=status,
        severity=severity,
        note=note,
    )


def _formation_date(company_id: str) -> date | None:
    # CO-YYYYMMDD-XXXX
    parts = company_id.split("-")
    if len(parts) >= 2 and len(parts[1]) == 8 and parts[1].isdigit():
        try:
            return date(int(parts[1][:4]), int(parts[1][4:6]), int(parts[1][6:8]))
        except ValueError:
            return None
    return None


def _next_annual(today: date, month: int, day: int) -> date:
    candidate = date(today.year, month, min(day, 28))
    return candidate if candidate >= today else date(today.year + 1, month, min(day, 28))


def _next_quarter_end(today: date) -> date:
    ends = [date(today.year, 3, 31), date(today.year, 6, 30),
            date(today.year, 9, 30), date(today.year, 12, 31)]
    for e in ends:
        if e >= today:
            return e
    return date(today.year + 1, 3, 31)
