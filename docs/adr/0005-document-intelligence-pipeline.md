# ADR-0005: Document Intelligence pipeline
**Status:** accepted
**Context:** The product generates legal/financial documents; a hallucinated clause is a liability.
**Decision:** Generation is a hard pipeline: ground (vetted template + clauses + company fields) →
generate (via a swappable ModelPort) → validate (deterministic: schema, required fields, jurisdiction rules)
→ human approve → immutable versioned store. A golden-document eval suite gates prompt/model changes.
**Why:** Keeps the AI useful while making unsafe output structurally impossible to reach a founder unreviewed.
**Consequences:** Every doc type needs grounding assets + validators + golden references; the model is a
provider (cost/routing/fallback handled like any other adapter).
