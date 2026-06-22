"""In-memory EventStore — runnable today with zero infra.

Implements the same `EventStore` Protocol the Postgres store will (see store.py + ADR-0003), so
swapping to Postgres later is a wiring change, not a domain change. Optimistic concurrency via
`expected_sequence` mirrors the Postgres `WHERE sequence = $expected` guard.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from uuid import uuid4

from startupkit.core.company_object.events import CompanyEvent, EventEnvelope


class ConcurrencyError(RuntimeError):
    """Raised when expected_sequence does not match the current head — a lost-update guard."""


class InMemoryEventStore:
    def __init__(self) -> None:
        self._streams: dict[str, list[EventEnvelope]] = {}
        self._lock = asyncio.Lock()

    async def append(
        self,
        tenant_id: str,
        events: list[CompanyEvent],
        expected_sequence: int,
    ) -> list[EventEnvelope]:
        async with self._lock:
            stream = self._streams.setdefault(tenant_id, [])
            if len(stream) != expected_sequence:
                raise ConcurrencyError(
                    f"expected sequence {expected_sequence}, stream head is {len(stream)}"
                )
            now = datetime.now(UTC).isoformat()
            appended: list[EventEnvelope] = []
            for offset, event in enumerate(events):
                env = EventEnvelope(
                    id=str(uuid4()),
                    tenant_id=tenant_id,
                    sequence=expected_sequence + offset,
                    occurred_at=now,
                    event=event,
                )
                stream.append(env)
                appended.append(env)
            return appended

    async def load(self, tenant_id: str) -> list[EventEnvelope]:
        async with self._lock:
            return list(self._streams.get(tenant_id, []))

    async def list_tenants(self) -> list[str]:
        async with self._lock:
            return list(self._streams.keys())
