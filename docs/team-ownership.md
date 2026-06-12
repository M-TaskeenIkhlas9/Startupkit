# Team ownership (5 people, interface-first)
Golden rule: **lock interfaces in Day 1, then build in your own folder against stable contracts.**
Shared interfaces (`ports/shared.py`, core service Protocols) change only by RFC reviewed by all.

| Person | Owns | Paths |
|---|---|---|
| **Team Lead** | interface lock, shared seams, CI/branch protection, **all PR reviews + merges** | repo-wide review; `ports/shared.py`, `domain/` |
| **Eng 1 — Spine** | durable orchestration, event-sourced company object, outbox, tenancy, shared services | `core/orchestration`, `core/company_object`, `core/services`, `core/tenancy`, `core/ple` |
| **Eng 2 — Integrations** | ports, registry, conformance, the first adapters | `ports/*`, `adapters/*`, `core/ports_runtime` |
| **Eng 3 — Intelligence** | document pipeline + validators + evals, compliance/regulatory engine | `core/document_intelligence`, `core/compliance` |
| **Eng 4 — Workflows** | W1 end-to-end, then W2–W8 manifests + templates | `workflows/*` |
| **Eng 5 — Product** | API + webhooks, web app, auth, security, observability | `apps/*`, `core/security`, `core/observability` |

(Paths are under `src/startupkit/` except `apps/`. See `CODEOWNERS`.)

## How parallelism works
- **Day 1 (all):** agree the `ports` Protocols, the `Step` kinds, the Company Object event vocabulary,
  and the activity contracts. After this, dependencies are mocked, not blocking.
- Eng 4 builds W1 against mocked activities while Eng 1/2/3 build the real ones behind the same contracts.
- Eng 5 builds the API + approval inbox against the orchestration interface, not its implementation.
- `import-linter` + conformance + mypy gate every PR; the Team Lead reviews and merges.
