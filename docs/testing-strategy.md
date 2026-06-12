# Testing strategy

| Layer | What | Tooling |
|---|---|---|
| **Unit** | pure logic: projections, validators, mappers | pytest |
| **Conformance** | every adapter vs its port contract — the swap-safety guarantee | base classes in `core/ports_runtime/conformance`, run via `uv run pytest` |
| **Document evals** | generated docs vs golden references; gates prompt/model changes | pytest over a fixtures set |
| **Workflow replay** | deterministic re-execution of recorded histories (free with Temporal) | `temporalio` replay tests |
| **Integration** | a workflow against real core services with adapters on fakes | pytest + test DB |
| **E2E (smoke)** | W1 happy path through the API | Playwright (post-M4) |

## Rules
- An adapter without a passing conformance test cannot merge. Conformance bases are shared classes;
  an adapter's test subclasses the base and implements `make()` — pytest collects the inherited tests.
- The 83(b) fuse has a dedicated reliability test: simulate clock advance + missed acknowledgement and
  assert escalation fires. **Non-negotiable.**
- Projections are pure ⇒ test them with event fixtures, no DB.
- Async tests run under `pytest-asyncio` (`asyncio_mode = "auto"`).
