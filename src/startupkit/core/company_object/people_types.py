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


class TeamMember(BaseModel):
    """An existing hire, captured before planning new roles — sharpens the gap analysis so the
    recommendation engine doesn't suggest a role someone's already covering."""

    id: str = ""
    name: str = ""
    title: str = ""


class DocRecord(BaseModel):
    """One legal document's state for one employee — real generated text, not a checkbox."""

    generated: bool = False
    text: str = ""
    status: str = "unsigned"  # unsigned | signed
    delivery_mode: str = ""  # "" | manual | auto — "" means not yet chosen
    reminder_hours: int = 48
    sent_confirm: str = ""
    uploaded_file: str = ""


class PayrollPacket(BaseModel):
    """What the employee submitted via their own onboarding link — never relayed by the founder."""

    work_state: str = ""
    tax_form: str = ""
    i9: str = ""
    bank: str = ""
    deposit: str = ""


class Employee(BaseModel):
    """One person on the roster, tracked across onboarding, payroll, and access."""

    id: str = ""
    name: str = ""
    role: str = ""
    email: str = ""
    start_date: str = ""
    # keyed piia | nda | ipa | atwill | handbook | arbitration
    docs: dict[str, DocRecord] = Field(default_factory=dict)
    onboarding_link: str = ""
    onboarding_send_mode: str = "email"  # email | copy
    onboarding_sent: bool = False
    onboarding_complete: bool = False
    onboarding_confirm: str = ""
    payroll_packet: PayrollPacket | None = None
    tier: str = "Module Access"  # Full Access | Module Access | View Only | No Access
    access_granted: bool = False
    access_confirm: str = ""


class PeopleState(BaseModel):
    existing_team: list[TeamMember] = Field(default_factory=list)
    roles: list[HiringRole] = Field(default_factory=list)
    employees: list[Employee] = Field(default_factory=list)
    done_steps: list[int] = Field(default_factory=list)  # which of the 6 W6 steps are confirmed
