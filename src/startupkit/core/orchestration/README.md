# orchestration (core) — durable execution
Workflows are long-running and human-in-the-loop; they wait days. We use **Temporal (Python SDK)**
so state survives restarts (ADR-0002).
- `runner.py` — a single generic interpreter that executes any workflow's declarative manifest.
- `activities.py` — idempotent side-effecting executors (port calls, doc gen, notifications).
- `outbox.py` — transactional outbox for never-lost cross-workflow triggers.
