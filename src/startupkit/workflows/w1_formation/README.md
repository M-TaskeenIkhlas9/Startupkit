# W1 — Business Formation (reference workflow)
The gating workflow; everything else depends on its triggers. Template for W2–W8.
- `manifest.py` — the declarative step graph.
- `steps/` — only for genuinely custom logic that doesn't fit a generic step kind.
- `templates/` — document templates consumed by `generate-doc` steps.
Triggers emitted: `name.confirmed` (->W4,W5), `ein.received` (->W3), `entity.formed` (->W2,W6).
