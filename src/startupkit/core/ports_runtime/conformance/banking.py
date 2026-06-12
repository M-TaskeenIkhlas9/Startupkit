"""The contract EVERY banking adapter must satisfy. Adapters subclass and implement make().

Add a check here when you tighten the port contract — all adapters re-verify automatically.
"""
from __future__ import annotations

import pytest

from startupkit.ports.banking import BankingPort, OpenAccountInput
from startupkit.ports.shared import ProviderContext

_CTX = ProviderContext(tenant_id="t_test", idempotency_key="idem_1", credential_ref="cred_test")
_CODES = {"unauthorized", "rate_limited", "validation_failed",
          "not_found", "provider_unavailable", "conflict", "unknown"}


class BankingConformance:
    """Subclass in an adapter's tests and implement make()."""

    def make(self) -> BankingPort:
        raise NotImplementedError

    def test_declares_banking_descriptor(self) -> None:
        assert self.make().descriptor.capability == "banking"

    async def test_open_account_returns_normalized_shape(self) -> None:
        r = await self.make().open_account(
            _CTX, OpenAccountInput(legal_name="Acme Inc", ein="12-3456789", formation_docs_ref="doc_1"),
        )
        assert r.ok
        assert len(r.value.account_number_last4) == 4
        assert r.value.status in ("pending", "active", "rejected")

    async def test_never_leaks_a_raw_vendor_error(self) -> None:
        r = await self.make().get_account(_CTX, "does-not-exist")
        if not r.ok:
            assert r.error.code in _CODES

    def test_supports_reflects_declared_features(self) -> None:
        p = self.make()
        for feature in p.descriptor.optional_features:
            assert p.supports(feature)  # type: ignore[arg-type]
