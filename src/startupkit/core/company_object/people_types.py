"""Persisted People/HR types for W6 — the hiring plan, employee roster, and step progress.

Same pattern and layering as `brand_types.py`: these live in the company-object layer so both
`events.py` and the snapshot projection import them without a cycle. The W6 UI edits them; they are
stored via the `people.state.set` event and replace the state wholesale (last-write-wins), so the
hiring plan and roster are a single source of truth the rest of the app can read.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class HiringRole(BaseModel):
    """One row of the "map out each role" hiring plan."""

    id: str = ""
    title: str = ""
    dept: str = ""
    reports_to: str = ""
    priority: str = "High"  # High | Med | Low
    goal: str = ""
    why_not_founders: str = ""
    hours_lost: str = ""
    revenue_unlocked: str = ""
    hire_type: str = "Employee"  # Employee | Contractor
    full_time: str = "Yes"  # Yes | No
    remote: str = "Remote"  # Remote | Hybrid | Onsite
    budget: str = ""
    start_date: str = ""


class Employee(BaseModel):
    """One person on the roster, tracked across onboarding, payroll, and access."""

    id: str = ""
    name: str = ""
    role: str = ""
    email: str = ""
    start_date: str = ""
    docs_generated: bool = False
    onboarding_sent: bool = False
    onboarding_complete: bool = False
    tier: str = "Module Access"  # Full Access | Module Access | View Only | No Access
    access_granted: bool = False


class PeopleState(BaseModel):
    roles: list[HiringRole] = Field(default_factory=list)
    employees: list[Employee] = Field(default_factory=list)
    done_steps: list[int] = Field(default_factory=list)  # which of the 6 W6 steps are confirmed
