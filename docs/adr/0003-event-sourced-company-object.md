# ADR-0003: Event-sourced Company Object
**Status:** accepted
**Decision:** The Company Object is an append-only event log; cap table, documents, compliance calendar,
and cross-workflow triggers are projections.
**Why:** Delivers "documents stay in sync" for free (re-derive on change), gives an immutable audit trail
(needed for legal/financial actions anyway), and makes cross-workflow triggers reliable via a transactional
outbox written in the same transaction as the causing event.
**Consequences:** Events are forever ⇒ version/upcast them deliberately. Reads go through projections,
which are eventually consistent with the log. Define aggregate/consistency boundaries explicitly.
