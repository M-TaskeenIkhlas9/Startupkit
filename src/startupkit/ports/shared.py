"""Shared contracts every capability port builds on.

OWNERSHIP: @eng-spine + @eng-integrations. Change only via RFC (see docs/engineering-guidelines.md).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel

CapabilityId = Literal[
    "banking", "payments", "esign", "payroll",
    "incorporation", "accounting", "hosting", "model",
]
ErrorCode = Literal[
    "unauthorized", "rate_limited", "validation_failed",
    "not_found", "provider_unavailable", "conflict", "unknown",
]

T = TypeVar("T")


class ProviderError(BaseModel):
    """A vendor-agnostic error. Adapters map raw vendor failures into this."""
    code: ErrorCode
    message: str
    retryable: bool  # drives retry / circuit-breaker behaviour in the activity layer
    cause: object | None = None


@dataclass(frozen=True)
class Ok(Generic[T]):
    value: T
    ok: Literal[True] = True


@dataclass(frozen=True)
class Err:
    error: ProviderError
    ok: Literal[False] = False


# All external calls return a Result — no raising across the port boundary.
Result = Ok[T] | Err


class ProviderContext(BaseModel):
    """Passed to every port call. The credential is a *reference*, resolved by the secrets vault."""
    tenant_id: str
    idempotency_key: str  # required on every mutating call — never double-act on a retry
    credential_ref: str


class ProviderDescriptor(BaseModel):
    id: str                       # e.g. "mercury"
    capability: CapabilityId
    optional_features: tuple[str, ...] = ()  # capability negotiation
