# platform-architecture

Fresh architecture pass for the StartupKit platform, grounded in the Next.js app running on
`:3200` (`apps/web`, routes under `company/[id]/*`). Deliberately independent of the prior
`/docs` architecture and backend — those informed direction only.

**Status: HTML working draft. Nothing is ported to eraser.io yet — that happens only after sign-off.**

## Files

| File | What it is |
|------|-----------|
| `index.html` | The main document — surface map, positioning vs competitors, 7-layer system stack, storage decision (Postgres/Supabase with the bytea/jsonb/encrypted-PII split), RBAC model, per-role permission matrix, AI/document pipeline, security, open decisions. |
| `diagrams.html` | The five standard architecture-diagram types (conceptual, component, deployment, sequence, data-flow) applied to this platform, per the system-design diagramming method. |
| `ui-access-sharing.html` | Mock of the proposed founder-facing **Access & sharing** screen — invite by email, role + workflow-scope + expiry, active/pending grants with revoke. Uses the real product design tokens. |
| `ui-admin-console.html` | Mock of the proposed internal **Admin console** — break-glass session flow, cross-tenant health overview, hash-chained audit trail. Violet accent to distinguish it from tenant surfaces. |

The two `ui-*` mocks are static illustrations (a little inline JS for interactivity) — not wired to any backend.

## Key decisions captured here

- **One database: Postgres (via Supabase to start).** Relational tables + `JSONB` per-workflow state;
  templates in `bytea`; submission answers in `jsonb` as the real audit record; SSN/EIN in a separate
  application-encrypted (KMS) `submission_pii` table; signed artifacts in object storage. No Mongo.
- **RBAC as data, not code.** Five roles today (Founder, Team, Ops/Admin, Advisor/Investor,
  Lawyer/Accountant) seeded from a `roles` table so a sixth is a config change. Grants are
  `{role, resource, scope, expires_at}` rows, scopeable to a single workflow.
- **Principles:** maintainable (bounded services), extensible (roles/workflows/integrations are
  config), component-swappable (every external dependency behind a narrow adapter).

Open in a browser; start from `index.html`.
