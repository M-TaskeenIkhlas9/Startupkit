# First two-week plan (external tools only)

**Goal of the fortnight:** a founder completes **W1 — Business Formation** end-to-end (entity formed →
EIN → 83(b) filed) through third-party tools, on the durable spine, with the 83(b) fuse proven reliable.

> Hours are **with Claude assistance** — deliberately low. They size the PR, not a worst case. If a task
> runs long, it's a signal to split the PR, not to pad estimates.

## Teams
| Role | People | Owns | Never owns |
|---|---|---|---|
| **Team Lead (TL)** | 1 | interface lock, shared seams, CI/branch protection, **all PR reviews + merges** | a feature stream (so they're never the bottleneck) |
| **Team A — Spine** | 2 | orchestration, company object, outbox, runner, doc pipeline, compliance fuse, W1 wiring | adapters, web |
| **Team B — Integrations** | 2 | ports, registry, conformance, external-tool adapters, webhooks, API, web, auth | the engine internals |

**The seam:** Team A depends on ports + activity contracts; Team B implements them. Both are mocked on the
other side until integration day (Day 10), so the two streams run fully parallel.

## Day 1 — kickoff + interface lock (TL-led, ~half day, everyone present)
The single most important block of the fortnight. Nothing downstream compiles without it.
1. **Ratify the seams (TL, ~3h):** `ports/*` interfaces (banking is the template — define `incorporation`,
   `esign`, `model` to the same shape), the `Step` kinds, the Company Object **event vocabulary**, and the
   **activity contracts**. Merge them first.
2. **Decide ADR-0002 (TL + all, 30m):** Temporal vs Inngest. Default is Temporal; confirm or switch now.
3. **Repo ready (TL, ~2h):** branch protection on `main` (see git-policy.md), CI green, `docker compose` up.
4. **Everyone (~1h):** `guides/local-setup.md`, run `uv sync` + `uv run pytest`, claim your first PRs below.

---

## Team A — Spine (≈37h across 2 engineers / 2 weeks)
Each row is one PR. Build order top-to-bottom; "depends" gates the start.

| ID | PR | Hrs | Depends | Acceptance criteria |
|---|---|---|---|---|
| A1 | Temporal worker bootstrap + trivial 2-step workflow | 4 | seam lock | a 2-step workflow runs; **kill the worker mid-run, it resumes** |
| A2 | Postgres event store (impl `EventStore` + migration) | 4 | seam lock | append + load with optimistic concurrency; unit tests on fixtures |
| A3 | Transactional outbox + relayer | 4 | A2 | event + outbox row written in **one tx**; relayer publishes a trigger; lost-on-crash test passes |
| A4a | Runner: `action` / `decision` / `emit-trigger` steps | 4 | A1 | runner executes these kinds against mocked activities; emits trigger via A3 |
| A4b | Runner: `wait-event` / `human-task` (+ reminder) steps | 3 | A4a | durable wait survives restart; `remindAfterHours` schedules a reminder |
| A5 | Company Object projections (cap table + document index) | 3 | A2 | pure functions; tested from event fixtures, no DB |
| A6 | Document Intelligence wiring (ground→generate→validate) | 5 | seam lock | Articles draft produced via `ModelPort` mock; 1 required-fields validator; returns draft + issues |
| A7 | 83(b) fuse: guaranteed delivery + escalation + **reliability test** | 5 | A4b | simulate clock advance + missed ack → escalation fires. **Non-negotiable test.** |
| A8 | W1 manifest wired to real activities (happy path) + integration test | 5 | A4a,A4b,A6 | W1 runs against mocked adapters end-to-end; emits `name.confirmed`, `ein.received`, `entity.formed` |

## Team B — Integrations & surface (≈43h across 2 engineers / 2 weeks)

| ID | PR | Hrs | Depends | Acceptance criteria |
|---|---|---|---|---|
| B1 | Finalize `incorporation` + `esign` ports + conformance suites | 3 | seam lock | suites compile and run (red until adapters exist) |
| B2 | Registry wiring + per-tenant provider config loader | 3 | seam lock | `resolve(capability, cfg)` returns the right adapter; bad config errors clearly |
| B5 | **Mercury** banking adapter — finish from reference (real transport + sandbox) | 3 | B1 | conformance green against Mercury sandbox |
| B6 | **Anthropic (Claude)** model adapter for `ModelPort.fillTemplate` | 3 | seam lock | returns grounded text from a template; basic retry |
| B3 | **Stripe Atlas** incorporation adapter (`fileWithState`, `applyEin`) | 5 | B1 | conformance green; vendor errors mapped; idempotency key honored |
| B4 | **DocuSign** e-sign adapter (`sendForSignature` + status mapping) | 5 | B1 | conformance green; envelope status → domain status in mapper |
| B7 | Webhook ingress (verify signature, dedupe, map → internal event) | 5 | B3,B4 | DocuSign + incorporation + bank callbacks become internal events; replays deduped |
| B8 | API: onboarding + workflow status + approval inbox endpoints | 5 | B2 | start W1, read status, list/act on pending approvals |
| B10 | Auth + multi-tenant context (Clerk/WorkOS) + RLS scoping | 5 | seam lock | every request carries a tenant; queries are tenant-scoped |
| B9 | Web: onboarding wizard + provider selection + approval inbox | 6 | B8 | a founder can start W1, pick providers, approve a document |

---

## Week split (sequencing)
**Week 1 — foundations & adapters.**
- Team A: A1, A2, A3, A4a, A4b, A5.
- Team B: B1, B2, B5, B6, B3, B4 (start B7).
- **Week-1 exit:** spine runs a trivial workflow and survives restart; ≥3 external adapters pass conformance; registry resolves them per tenant.

**Week 2 — W1 end-to-end & surface.**
- Team A: A6, A8, A7.
- Team B: finish B7, then B8, B10, B9.
- **Day 10 — integration day (both teams):** swap W1's mocked adapters for real ones via the registry; run the full path against sandboxes; demo; bugfix.
- **Fortnight exit:** founder completes W1 through external tools in one guided session; 83(b) reliability test green.

## Daily cadence
- **Standup (15m):** yesterday / today / blockers. Blockers on the seam go to the TL immediately.
- **Continuous PRs:** small, single-feature, reviewed and merged by the TL same day where possible.
- **Demo Friday wk1, demo + retro Friday wk2.**

## Definition of done (every PR)
`ruff` + `mypy` + `lint-imports` + `pytest` (incl. conformance) green · acceptance criteria met ·
no secrets/PII in code or logs · docs/README touched if behaviour changed · TL approved.
