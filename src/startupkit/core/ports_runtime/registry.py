"""Provider registry: resolves capability -> adapter from per-tenant config.

The seam that makes "third-party now, first-party later" a config change, not a code change.
"""
from __future__ import annotations

from collections.abc import Callable

from startupkit.ports.shared import CapabilityId

AdapterFactory = Callable[[str], object]  # credential_ref -> adapter instance


class ProviderRegistry:
    def __init__(self) -> None:
        self._factories: dict[str, dict[str, AdapterFactory]] = {}

    def register(self, capability: CapabilityId, provider_id: str, factory: AdapterFactory) -> None:
        self._factories.setdefault(capability, {})[provider_id] = factory

    def resolve(self, capability: CapabilityId, cfg: dict[str, str], credential_ref: str) -> object:
        provider_id = cfg.get(capability)
        if not provider_id:
            raise KeyError(f'tenant has no provider for capability "{capability}"')
        factory = self._factories.get(capability, {}).get(provider_id)
        if not factory:
            raise KeyError(f"no adapter registered: {capability}/{provider_id}")
        return factory(credential_ref)
