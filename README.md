# StartupKit

The operating system for founders. Eight gated workflows from idea to investor-ready, built as a
**modular monolith** in Python with **product-line engineering** (≈70% reusable core, ≈30% variant).

## The one idea
Every workflow step is `{ capability, action, provider }`. Workflows depend on **ports**
(`typing.Protocol` interfaces), never on vendors. A **registry** resolves a port to whichever
**adapter** the founder picked. Third-party adapters today; first-party later, with zero workflow changes.

## Layout (the layout *is* the architecture)
| Path | Tier | What lives here |
|---|---|---|
| `src/startupkit/core/` | core | orchestration, company object, document intelligence, compliance, services, security |
| `src/startupkit/ports/` | core | capability Protocols (`BankingPort`, `ModelPort`, …) |
| `src/startupkit/adapters/` | variant | one thin implementation per third-party tool |
| `src/startupkit/workflows/` | variant | declarative step manifests (W1–W8 + fundraising) |
| `apps/` | — | `api` (FastAPI + webhooks), `web` (Next.js founder app), `worker` (Temporal worker) |
| `src/startupkit/domain/`, `config/` | core | shared types and config |
| `docs/` | — | PRD, requirements, ADRs, guides, ownership, roadmap |

## Quick start
```bash
uv sync --extra dev
docker compose up -d        # postgres + temporal (UI on :8080)
cp .env.example .env         # fill in keys
uv run pytest                # runs adapter conformance suites
uv run uvicorn apps.api.main:app --reload
```

## Read first
- `docs/prd.md`, `docs/requirements.md`, `docs/team-ownership.md`, `docs/roadmap.md`
- `docs/two-week-plan.md` and `docs/git-policy.md`
- `docs/guides/writing-an-adapter.md`, `docs/guides/authoring-a-workflow.md`
