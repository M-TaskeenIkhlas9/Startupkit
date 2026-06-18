"""Mercury adapter for BankingPort. Reference implementation — copy this shape for new adapters.

See docs/guides/writing-an-adapter.md.
"""

from __future__ import annotations

from typing import Protocol

from startupkit.ports.banking import BankAccount, BankingFeature, OpenAccountInput
from startupkit.ports.shared import Err, Ok, ProviderContext, ProviderDescriptor, Result

from .mapper import to_bank_account, to_provider_error


class Transport(Protocol):
    """Injectable so the adapter is unit- and conformance-testable without real HTTP."""

    async def request(
        self,
        path: str,
        *,
        method: str,
        body: dict[str, object] | None = None,
        idempotency_key: str | None = None,
        credential_ref: str,
    ) -> tuple[int, object]: ...


_DESCRIPTOR = ProviderDescriptor(
    id="mercury",
    capability="banking",
    optional_features=("instant_kyc", "sub_accounts"),  # no wire_transfers in v1
)


class MercuryBankingAdapter:
    descriptor = _DESCRIPTOR

    def __init__(self, transport: Transport) -> None:
        self._t = transport

    def supports(self, feature: BankingFeature) -> bool:
        return feature in self.descriptor.optional_features

    async def open_account(
        self, ctx: ProviderContext, inp: OpenAccountInput
    ) -> Result[BankAccount]:
        status, body = await self._t.request(
            "/accounts",
            method="POST",
            body={"legalName": inp.legal_name, "ein": inp.ein, "docsRef": inp.formation_docs_ref},
            idempotency_key=ctx.idempotency_key,  # never double-open on retry
            credential_ref=ctx.credential_ref,
        )
        if status >= 400:
            return Err(to_provider_error(status, body))
        assert isinstance(body, dict)
        return Ok(to_bank_account(body))

    async def get_account(self, ctx: ProviderContext, account_id: str) -> Result[BankAccount]:
        status, body = await self._t.request(
            f"/accounts/{account_id}",
            method="GET",
            credential_ref=ctx.credential_ref,
        )
        if status >= 400:
            return Err(to_provider_error(status, body))
        assert isinstance(body, dict)
        return Ok(to_bank_account(body))
