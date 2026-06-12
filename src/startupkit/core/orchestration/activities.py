"""Activity contracts: the side-effecting executors a step maps to (port calls, doc gen, notify).

Implemented + registered with the Temporal worker in apps/worker. Each MUST be idempotent.
"""
from __future__ import annotations

from pydantic import BaseModel


class StepResult(BaseModel):
    ok: bool
    next_step_id: str | None = None
