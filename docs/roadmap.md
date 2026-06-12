# Roadmap — the MVP cut line
Each milestone has an exit criterion. Ship the spine on W1 before scaling to eight.

## M0 — Foundations (week 0)
Interfaces locked (ports, Step kinds, events, activity contracts). Repo, CI, infra (`docker compose`) green.
**Exit:** `uv run` works; conformance bases import (no adapters yet); everyone unblocked.

## M1 — Platform spine
Durable workflow engine (Temporal) + event-sourced Company Object + transactional outbox + multi-tenant auth.
**Exit:** a trivial 2-step workflow runs end-to-end, survives a worker restart, and emits a trigger via outbox.

## M2 — Port framework + first adapters
Registry + conformance for `incorporation`, `esign`, `banking`; one real adapter each.
**Exit:** all three adapters pass conformance in CI; registry resolves them per tenant.

## M3 — Document Intelligence v1
Grounded generation → validators → human approval → versioned store; golden-document eval set.
**Exit:** Articles of Incorporation generated, validated, approved, stored; eval suite green.

## M4 — W1 end-to-end + compliance fuse
W1 manifest wired to real activities; compliance engine with the 83(b) guaranteed-delivery path.
**Exit:** a founder completes W1 (entity formed + EIN + 83(b) filed) in one guided session; fuse fires reliably.

## M5 — Scale to manifests
W2–W8 authored as manifests reusing the spine; founder web app polished.
**Exit:** at least W2 and W6 (the entity-formed-gated pair) run on the same engine with no new platform code.
