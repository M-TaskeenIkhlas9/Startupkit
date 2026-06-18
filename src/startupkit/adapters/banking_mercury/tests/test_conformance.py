"""Runs the shared banking conformance suite against Mercury using a fake transport.

If this fails, the adapter is NOT swap-safe. CI gates on it.
"""

from __future__ import annotations

from startupkit.adapters.banking_mercury.adapter import MercuryBankingAdapter
from startupkit.core.ports_runtime.conformance.banking import BankingConformance
from startupkit.ports.banking import BankingPort


class FakeTransport:
    async def request(
        self,
        path: str,
        *,
        method: str,
        body: dict[str, object] | None = None,
        idempotency_key: str | None = None,
        credential_ref: str,
    ) -> tuple[int, object]:
        if method == "POST" and path == "/accounts":
            return 200, {
                "id": "acc_1",
                "routingNumber": "021000021",
                "accountNumber": "123456789",
                "status": "pending",
            }
        if path.startswith("/accounts/"):
            return 200, {
                "id": "acc_1",
                "routingNumber": "021000021",
                "accountNumber": "123456789",
                "status": "approved",
            }
        return 404, {}


class TestMercuryConformance(BankingConformance):
    def make(self) -> BankingPort:
        return MercuryBankingAdapter(FakeTransport())
