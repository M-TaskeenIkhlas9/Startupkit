"""ModelPort — the LLM behind Document Intelligence. Same swappable pattern as banking."""
from __future__ import annotations

from typing import Protocol, runtime_checkable

from startupkit.ports.shared import ProviderDescriptor


@runtime_checkable
class ModelPort(Protocol):
    descriptor: ProviderDescriptor

    async def fill_template(self, template: str, fields: dict[str, object], clauses: list[str]) -> str: ...
