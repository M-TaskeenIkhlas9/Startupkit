"""Runs the shared banking conformance suite against Mercury using a fake transport.

If this fails, the adapter is NOT swap-safe. CI gates on it.
"""
from __future__ import annotations

from startupkit.adapters.banking_mercury.adapter import MercuryBankingAdapter
from startupkit.core.ports_runtime.conformance.banking import BankingConformance


class FakeTransport:
    async def request(self, path, *, method, body=None, idempotency_key=None, credential_ref):
        if method == "POST" and path == "/accounts":
            return 200, {"id": "acc_1", "routingNumber": "021000021",
                         "accountNumber": "123456789", "status": "pending"}
        if path.startswith("/accounts/"):
            return 200, {"id": "acc_1", "routingNumber": "021000021",
                         "accountNumber": "123456789", "status": "approved"}
        return 404, {}


class TestMercuryConformance(BankingConformance):
    def make(self):
        return MercuryBankingAdapter(FakeTransport())
