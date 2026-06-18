"""Append-only event store interface. Postgres implementation lives in db/ + here."""

from __future__ import annotations

from typing import Protocol

from startupkit.core.company_object.events import CompanyEvent, EventEnvelope


class EventStore(Protocol):
    async def append(
        self,
        tenant_id: str,
        events: list[CompanyEvent],
        expected_sequence: int,
    ) -> list[EventEnvelope]: ...
    async def load(self, tenant_id: str) -> list[EventEnvelope]: ...


# TODO(@eng-spine): Postgres impl + write the transactional outbox row in the SAME transaction
# so cross-workflow triggers (e.g. "entity.formed") are never lost. See ADR-0003.
