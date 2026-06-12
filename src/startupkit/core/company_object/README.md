# company_object (core) — the single source of truth
Event-sourced. Write facts as events; derive everything else as projections.
- `events.py` — the event vocabulary (events are forever — version carefully, see ADR-0003).
- `store.py` — append-only store Protocol (Postgres impl + outbox).
- `projections/` — pure functions: cap table, documents, compliance calendar, dependency triggers.
