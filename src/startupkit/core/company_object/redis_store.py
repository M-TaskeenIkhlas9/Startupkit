"""RedisEventStore — the EventStore Protocol backed by Upstash/Vercel KV's REST API.

Exists for one reason: on Vercel, InMemoryEventStore's dict lives in one function instance's
memory, and Vercel can serve consecutive requests from different instances (or cold-start a fresh
one after idling) — so a company created a moment ago can simply be gone on the next request.
Redis lives outside the function process, so state survives both cold starts and instance
fan-out. Uses httpx (already a dependency) against Upstash's plain HTTP REST API — no new SDK,
no long-lived TCP connection, which matters for a serverless caller.

Each tenant's full event list is stored as one JSON array under `company:{tenant_id}` — the same
"whole list, read/append together" shape memory_store.py uses, just persisted. A `company:index`
set tracks known tenant ids for list_tenants().

Known simplification: the read-modify-write in `append` is optimistic-locked the same way
memory_store.py's in-process version is (check `len(current) == expected_sequence` before
writing), but without a server-side atomic compare-and-set — two genuinely simultaneous writes to
the *same* tenant could race. Fine for a single founder working their own company; not a
substitute for a real transactional store if this ever needs to hold concurrent multi-writer load.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import cast
from uuid import uuid4

import httpx

from startupkit.core.company_object.events import CompanyEvent, EventEnvelope
from startupkit.core.company_object.memory_store import ConcurrencyError

_INDEX_KEY = "company:index"


def _key(tenant_id: str) -> str:
    return f"company:{tenant_id}"


class RedisEventStore:
    def __init__(self, rest_url: str, rest_token: str) -> None:
        self._base = rest_url.rstrip("/")
        self._headers = {"Authorization": f"Bearer {rest_token}"}

    async def _command(self, *parts: str) -> object:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(self._base, headers=self._headers, json=list(parts))
            r.raise_for_status()
            return r.json().get("result")

    async def _load_raw(self, tenant_id: str) -> list[EventEnvelope]:
        raw = await self._command("GET", _key(tenant_id))
        if not raw:
            return []
        return [EventEnvelope.model_validate(e) for e in json.loads(cast(str, raw))]

    async def append(
        self,
        tenant_id: str,
        events: list[CompanyEvent],
        expected_sequence: int,
    ) -> list[EventEnvelope]:
        stream = await self._load_raw(tenant_id)
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
        payload = json.dumps([e.model_dump(mode="json") for e in stream])
        await self._command("SET", _key(tenant_id), payload)
        await self._command("SADD", _INDEX_KEY, tenant_id)
        return appended

    async def load(self, tenant_id: str) -> list[EventEnvelope]:
        return await self._load_raw(tenant_id)

    async def list_tenants(self) -> list[str]:
        result = await self._command("SMEMBERS", _INDEX_KEY)
        return cast(list[str], result) if result else []
