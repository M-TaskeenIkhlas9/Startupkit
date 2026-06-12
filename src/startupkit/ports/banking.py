"""BankingPort — the interface W3 (Financial Infrastructure) depends on.

Implemented by adapters/banking_* . Conformance-tested in core/ports_runtime/conformance.
"""
from __future__ import annotations

from typing import Literal, Protocol, runtime_checkable

from pydantic import BaseModel

from startupkit.ports.shared import ProviderContext, ProviderDescriptor, Result

BankingFeature = Literal["instant_kyc", "sub_accounts", "wire_transfers"]


class OpenAccountInput(BaseModel):
    legal_name: str
    ein: str
    formation_docs_ref: str  # reference to docs in the document store, not the bytes


class BankAccount(BaseModel):
    id: str
    routing_number: str
    account_number_last4: str
    status: Literal["pending", "active", "rejected"]


@runtime_checkable
class BankingPort(Protocol):
    descriptor: ProviderDescriptor

    def supports(self, feature: BankingFeature) -> bool: ...
    async def open_account(self, ctx: ProviderContext, inp: OpenAccountInput) -> Result[BankAccount]: ...
    async def get_account(self, ctx: ProviderContext, account_id: str) -> Result[BankAccount]: ...
