# document_intelligence (core) — the AI layer
The product generates legal/financial documents, so generation is bracketed by guardrails:
**ground -> generate -> validate -> human approve -> versioned store.**
- `grounding/` — template + vetted clause retrieval (no free-form generation).
- `validators/` — deterministic checks (schema, required fields, jurisdiction rules).
- `pipeline.py` — wires the stages; the model is a swappable `ModelPort` (e.g. Anthropic/Claude).
- Eval suite of golden documents gates every prompt/model change (see docs/testing-strategy.md).
