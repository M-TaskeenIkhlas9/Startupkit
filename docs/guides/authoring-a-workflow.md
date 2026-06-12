# Authoring a workflow
Workflows are **data**. You describe steps; the generic runner executes them.

1. **Copy `workflows/_template`** and rename (`wX_...`).
2. **Define steps** in `manifest.py` using the standard Pydantic step models:
   - `ActionStep` — calls a capability via a port (resolved per tenant by the registry).
   - `GenerateDocStep` — runs the Document Intelligence pipeline (ground -> generate -> validate -> approve -> store).
   - `HumanTaskStep` — assigns a task to the founder/candidate; optional `remind_after_hours`.
   - `WaitEventStep` — durably waits for a webhook/timer (survives restarts).
   - `DecisionStep` — branches on Company Object state.
   - `EmitTriggerStep` — emits a cross-workflow trigger via the outbox (unblocks other workflows).
3. **Only add code in `steps/` for custom logic** that genuinely doesn't fit a generic kind. Prefer data.
4. **Wire triggers carefully** — they are the dependency graph. Document emitted/consumed triggers in the
   workflow README (see `w1_formation` for the canonical example).
5. **Templates** for generated docs live in `templates/`.
