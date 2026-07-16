"""W6 · People/HR persistence — the hiring plan + roster survive as a projected snapshot field."""

from __future__ import annotations

from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.company_object.people_types import Employee, HiringRole, PeopleState
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.intake import FounderIntake, IntakeRequest


def _intake() -> IntakeRequest:
    return IntakeRequest(
        company_name="Loopwell",
        owner_email="f@loopwell.co",
        one_liner="OS for early-stage logistics teams",
        industry="logistics",
        stage="mvp-build",
        jurisdiction="US",
        entity_type="c-corp",
        formation_status="formed",
        founders=[FounderIntake(name="Ada", email="ada@loopwell.co", role="CEO", equity_pct=100.0)],
    )


async def test_people_state_persists_and_replaces() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake())

    await svc.set_people(
        cid,
        PeopleState(
            roles=[HiringRole(id="r1", title="Founding Engineer", priority="High", budget="$150k")],
            employees=[Employee(id="e1", name="Dana Kim", role="Founding Engineer")],
            done_steps=[1, 2],
        ),
    )
    snap = await svc.snapshot(cid)
    assert len(snap.people.roles) == 1 and snap.people.roles[0].title == "Founding Engineer"
    assert len(snap.people.employees) == 1 and snap.people.employees[0].name == "Dana Kim"
    assert snap.people.done_steps == [1, 2]
    # the People domain fields reflect the counts
    people = next(d for d in snap.domains if d.domain == "people")
    assert people.fields.get("hires_planned") == "1"

    # last-write-wins: a second save replaces the whole state
    await svc.set_people(cid, PeopleState(roles=[], employees=[], done_steps=[1, 2, 3]))
    snap2 = await svc.snapshot(cid)
    assert snap2.people.roles == [] and snap2.people.done_steps == [1, 2, 3]
