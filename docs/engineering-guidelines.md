# Engineering guidelines

## Module boundaries (enforced by import-linter)
- A `workflow` imports **ports** and **core services** — never an `adapter`.
- An `adapter` imports its **port** + `ports.shared` — nothing else from the app.
- `core` may not import from `workflows` or `adapters`.
- Cross-cutting truth lives in `startupkit.domain`. Shared types go there.
- Contracts live in `pyproject.toml` under `[tool.importlinter]`; CI runs `uv run lint-imports`.

## Typing & style
- `mypy --strict` everywhere. `ruff` for lint + import order.
- Ports are `typing.Protocol` (structural) — adapters don't inherit, they just match the shape.
- Data crossing a boundary is a Pydantic model (validated). Internal pure logic can use dataclasses.

## Error handling
- Port calls return `Result[T]` (`Ok | Err`) — **no raising across the port boundary**.
- Map every vendor error to a stable `ProviderError.code` in the adapter's anti-corruption layer.
- `retryable` on the error drives retry / circuit-breaker behaviour in the activity layer.

## Idempotency & side effects
- Every mutating external call takes `idempotency_key` from `ProviderContext`.
- Temporal activities must be safe to run twice.
- Write the company-object event and the outbox row in the **same DB transaction**.

## Interfaces are contracts
- Changing a `ports/*` Protocol or a shared service signature = an RFC + review by all affected owners.
- Add/extend the port's conformance base in the same PR that changes the port.

## PR rules / definition of done
- `ruff`, `mypy`, `lint-imports`, and `pytest` (incl. conformance) all green.
- New adapter ⇒ passing conformance test. New step kind ⇒ runner support + test.
- No secrets in code or logs; PII never logged. Use the ubiquitous language (`domain-glossary.md`).
