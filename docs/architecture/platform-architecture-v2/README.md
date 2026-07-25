# platform-architecture-v2

System-design diagrams for the StartupKit platform, **per section**, drawn with the six standard
diagram types from the system-design method (conceptual, component, sequence, communication,
data-flow, deployment). Companion to — and independent of — `../platform-architecture/` (v1),
which is left untouched.

**Status: HTML working draft. Not ported to eraser.io.**

## What changed from v1

- **Storage: self-managed PostgreSQL only.** No managed database (no Supabase), **no object
  storage**. Document templates and filled/signed document bytes all live in Postgres `bytea`
  for now; per-workflow state in `JSONB`; PII (EIN/SSN/tokens) in a separate, application-encrypted
  table. We run, patch, and back up Postgres ourselves. Object storage is a deliberate "later."
- **Diagrams per section**, not just for documents. Every section of the running app gets its own
  page with the applicable diagram types.
- **Rendered with Mermaid** (auto-layout) instead of hand-placed SVG, so diagrams render reliably —
  the fix for the v1 data-flow diagram that laid out badly. All 67 diagrams are validated with
  `mermaid.parse()`.

## Pages

| File | Section | Diagram types |
|------|---------|---------------|
| `index.html` | Hub + **whole platform** | all 6 (incl. the shared deployment topology) |
| `journey.html` | Journey | conceptual · component · sequence · data-flow |
| `dashboard.html` | Dashboard | conceptual · component · sequence · data-flow |
| `knowledge-graph.html` | Knowledge graph | conceptual · component · communication · data-flow |
| `workflows.html` | Workflows W1–W8 | shared engine: all 6 · then per-workflow W1–W8 |
| `assessment.html` | Assessment questionnaire | conceptual · component · sequence · data-flow |
| `ai-cofounder.html` | AI Co-Founder | conceptual · component · sequence · communication · data-flow |
| `intelligence.html` | Intelligence & scoring: **health score** + **case studies** (+ co-founder recap) | health: 4 · case studies: 4 |
| `input-layer.html` | Input layer (raw facts & PII) | conceptual · component · sequence · data-flow |
| `access-sharing.html` | Access & sharing (RBAC) | conceptual · component · sequence · communication · data-flow |
| `admin-console.html` | Admin console | conceptual · component · sequence · communication · data-flow |
| `styles.css` | shared page chrome | — |
| `diagram.js` | shared Mermaid theme/init | — |

**Deployment** is one shared topology (on the hub); section pages reference it rather than
repeating it, because self-managed-Postgres-only means there is only one deployment picture.

## Notes

- Diagrams need an **internet connection** to render (Mermaid loads from a CDN, like the fonts).
- Grounded in the real routes + API surface of `apps/web` (`lib/api.ts`, the workflow components,
  the knowledge-graph and journey code) — not invented.
- To re-validate after edits: the parser script lives in the session scratchpad; it extracts every
  `<pre class="mermaid">` block and runs `mermaid.parse()` on it.

Open `index.html` first.
