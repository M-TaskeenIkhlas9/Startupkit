# ports_runtime (core)
Registry + conformance — the machinery that makes ports swappable *and provably safe*.
- `registry.py` — resolves `capability -> adapter` from per-tenant config.
- `conformance/` — base test classes every adapter must pass (CI-gated via `uv run pytest`).
Add a port in `ports/` → add its conformance base here in the same PR.
