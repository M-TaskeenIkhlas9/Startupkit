# Domain glossary (ubiquitous language)
Use these exact terms in code, docs, and conversation.

- **Company Object** — the event-sourced single source of truth for one tenant's company.
- **Tenant** — one company using StartupKit. All data is tenant-scoped.
- **Workflow** — a gated process (W1–W8, FR), expressed as a declarative manifest.
- **Step** — one node in a workflow: action, generate-doc, human-task, wait-event, decision, emit-trigger.
- **Capability** — a kind of thing a step needs done (banking, esign, payroll, model…).
- **Port** — the interface for a capability. Workflows depend on ports.
- **Adapter** — a concrete implementation of a port for one provider.
- **Provider** — the underlying tool (Mercury, DocuSign…) or, later, a first-party StartupKit option.
- **Registry** — resolves `capability -> adapter` from a tenant's provider config.
- **Conformance suite** — the test contract every adapter for a port must pass.
- **Anti-corruption layer** — adapter-internal mapping; vendor models never escape it.
- **Trigger** — a cross-workflow signal emitted by one workflow that unblocks others.
- **Outbox** — the transactional table guaranteeing triggers are never lost.
- **Projection** — a view derived from Company Object events (cap table, documents, calendar).
- **Rule-pack** — versioned jurisdiction/entity compliance data.
- **Fuse** — an irreversible deadline (e.g. 83(b)) with guaranteed-delivery reminders.
- **Variation point** — where a tenant's instance differs (entity, jurisdiction, industry, providers, plan).
- **Configurator** — assembles a tenant's active workflows, rule-packs, and adapters from their selections.
