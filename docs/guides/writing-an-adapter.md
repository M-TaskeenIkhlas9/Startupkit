# Writing an adapter
Goal: make a new provider usable by any workflow without changing the workflow.

1. **Confirm the port exists** in `src/startupkit/ports/<capability>.py`. If not, define the `Protocol`
   first (RFC) and add a conformance base in `core/ports_runtime/conformance`.
2. **Copy `adapters/banking_mercury`** as your template — it shows the full pattern.
3. **Inject a transport** (don't hardcode `httpx`) so the adapter is testable without real HTTP.
4. **Implement the Protocol methods.** Return `Result[T]` (`Ok`/`Err`) — never raise across the boundary.
5. **Write the anti-corruption mapper** (`mapper.py`): vendor dict -> domain model, vendor error ->
   `ProviderError`. Nothing vendor-shaped may leave this file.
6. **Declare `optional_features`** in the descriptor (capability negotiation) and implement `supports()`.
7. **Pass conformance:** subclass the shared base in `tests/test_conformance.py` and implement `make()`
   with a fake transport. CI won't merge until it's green.
8. **Register it** so the registry can resolve it for tenants that pick this provider.
