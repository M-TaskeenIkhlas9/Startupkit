# Requirements (the build contract)
IDs are stable references. "MUST" = required for v1 unless marked (post-v1).

## Functional — platform
- **FR-P1** The orchestrator MUST execute workflows defined as declarative manifests.
- **FR-P2** Workflow state MUST survive process restarts and deploys (durable execution).
- **FR-P3** A workflow MUST support: action steps, document-generation steps, human-task steps,
  durable wait-for-event steps, decisions, and trigger emission.
- **FR-P4** Cross-workflow triggers MUST be delivered exactly-once-effectively via a transactional outbox.
- **FR-P5** The Company Object MUST be event-sourced; projections MUST derive cap table, documents,
  compliance calendar, and triggers.
- **FR-P6** Every external mutation MUST carry an idempotency key.

## Functional — capabilities (ports/adapters)
- **FR-C1** A workflow MUST depend only on a capability port, never on a concrete provider.
- **FR-C2** The registry MUST resolve `capability -> adapter` from per-tenant configuration.
- **FR-C3** Every adapter MUST pass its port's conformance suite in CI.
- **FR-C4** Adapters MUST map vendor models/errors to domain types (anti-corruption); no vendor type leaks.
- **FR-C5** Adapters MUST declare supported optional features (capability negotiation).

## Functional — document intelligence
- **FR-D1** Generation MUST be grounded in a vetted template + clause set (no free-form output).
- **FR-D2** Drafts MUST pass deterministic validators (schema, required fields, jurisdiction rules).
- **FR-D3** A document MUST receive human approval before being stored as source-of-truth.
- **FR-D4** Stored documents MUST be immutable and versioned.
- **FR-D5** Prompt/model changes MUST be gated by a golden-document eval suite.

## Functional — compliance
- **FR-M1** Compliance MUST be driven by versioned jurisdiction rule-packs (data, not code).
- **FR-M2** The engine MUST generate a per-tenant deadline calendar and recurring filings.
- **FR-M3** Irreversible deadlines (83(b)) MUST use guaranteed, multi-channel, acknowledged,
  escalating delivery with a human backstop.

## Non-functional
- **NFR-1 Reliability:** no lost triggers; failed external calls retry with backoff; circuit breakers + DLQ per adapter.
- **NFR-2 Security:** per-tenant isolation (RLS); field-level encryption for PII + provider tokens; scoped/rotated tokens.
- **NFR-3 Auditability:** tamper-evident (hash-chained) audit log of all state-changing actions.
- **NFR-4 Compliance posture:** designed for SOC 2; GDPR-ready (region-aware storage for EU tenants).
- **NFR-5 Performance:** founder-facing actions p95 < 500ms excluding external provider latency.
- **NFR-6 Observability:** distributed tracing across adapter calls; per-workflow funnel + health score.
- **NFR-7 Modularity:** module boundaries enforced; no cross-imports except via published interfaces.
