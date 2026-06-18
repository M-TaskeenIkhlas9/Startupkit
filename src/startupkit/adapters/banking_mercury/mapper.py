"""Anti-corruption layer: Mercury's wire format -> domain types; vendor errors -> ProviderError.

Nothing Mercury-shaped is allowed to escape this file.
"""

from __future__ import annotations

from typing import Literal

from startupkit.ports.banking import BankAccount
from startupkit.ports.shared import ErrorCode, ProviderError

_STATUS_MAP: dict[int, ErrorCode] = {
    401: "unauthorized",
    404: "not_found",
    409: "conflict",
    422: "validation_failed",
    429: "rate_limited",
    503: "provider_unavailable",
}


def to_bank_account(dto: dict[str, object]) -> BankAccount:
    status = str(dto["status"])
    domain_status: Literal["pending", "active", "rejected"] = (
        "active" if status == "approved" else "rejected" if status == "denied" else "pending"
    )
    return BankAccount(
        id=str(dto["id"]),
        routing_number=str(dto["routingNumber"]),
        account_number_last4=str(dto["accountNumber"])[-4:],
        status=domain_status,
    )


def to_provider_error(http_status: int, body: object) -> ProviderError:
    code = _STATUS_MAP.get(http_status, "unknown")
    return ProviderError(
        code=code,
        message=f"mercury: {http_status}",
        retryable=http_status >= 500 or http_status == 429,
        cause=body,
    )
