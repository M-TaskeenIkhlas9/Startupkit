# ADR-0004: Ports & adapters with a provider registry
**Status:** accepted
**Decision:** Each capability is a port (`typing.Protocol`); providers are adapters; a registry resolves
`capability -> adapter` from per-tenant config. Adapters include an anti-corruption layer and declare
optional features (capability negotiation). Every adapter passes a shared conformance base (pytest).
**Why:** This is the "third-party now, first-party later" mechanism and the PLE variation axis. Workflows
depend only on ports, so swapping or adding a provider is one adapter + a passing test, zero workflow change.
**Consequences:** Every new port needs a conformance base; lowest-common-denominator interfaces are avoided
via capability negotiation. `runtime_checkable` Protocols let us assert shape in tests.
