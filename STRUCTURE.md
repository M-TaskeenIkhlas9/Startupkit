# Repository structure

Reflects what's actually built, not the original scaffold. Re-generate this by hand when the tree
drifts — there's no automation enforcing it.

```
.
├── apps/
│   ├── api/
│   │   ├── main.py            # the entire HTTP surface — FastAPI, ~55 routes, one file
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   ├── web/                    # Next.js app (App Router)
│   │   ├── app/
│   │   │   ├── (marketing)/    # pre-auth: landing, intake, onboarding, validate
│   │   │   └── company/[id]/   # the founder workspace — journey, dashboard, workflows,
│   │   │                       #   assessment, AI co-founder, knowledge graph, inputs
│   │   ├── components/
│   │   │   ├── w3-workflow.tsx        # bespoke Track B workflows —
│   │   │   ├── w5-workflow.tsx        #   real per-domain state (Brand/People/GTM/Ops),
│   │   │   ├── w6-workflow.tsx        #   not generic form-filling
│   │   │   ├── w7-workflow.tsx
│   │   │   ├── w8-workflow.tsx
│   │   │   ├── workflow-phases.tsx    # generic renderer for W1/W2/W4 (Track A —
│   │   │   ├── document-template.tsx  #   catalog-driven, fillable templates only)
│   │   │   └── ...                    # journey-graph, knowledge-graph, assessment, etc.
│   │   ├── lib/
│   │   │   ├── types.ts        # hand-mirrors the backend Pydantic models
│   │   │   └── api.ts          # typed fetch wrapper — the only thing that calls apps/api
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   └── worker/
│       └── main.py             # Temporal worker host — stub, not implemented (@eng-spine)
│
├── src/startupkit/              # the shared backend package (src-layout)
│   ├── core/
│   │   ├── company_object/      # the event-sourced "Company Object" — the core of the app
│   │   │   ├── events.py            # CompanyEvent union — every fact is one of these
│   │   │   ├── *_types.py           # BrandState / PeopleState / GtmState / OpsState
│   │   │   ├── store.py             # EventStore Protocol
│   │   │   ├── memory_store.py      # the only impl today — in-RAM, no persistence
│   │   │   └── projections/
│   │   │       └── snapshot.py      # project_snapshot() — pure fold over events
│   │   ├── services/             # company_object_service, brand, gtm, cofounder_chat,
│   │   │                         # document_engine, journey, compliance, risks, ...
│   │   ├── document_intelligence/  # LLM ground→generate→validate pipeline — built,
│   │   │                           #   not routed to by any live document today
│   │   ├── orchestration/        # Temporal-based durable-execution design — written,
│   │   │                         #   not imported anywhere (see docs/adr/0002)
│   │   ├── ports_runtime/        # capability→adapter registry + conformance base classes —
│   │   │                         #   written, not imported (adapters are wired by hand)
│   │   ├── compliance/, observability/, ple/, security/, tenancy/   # scaffolded, mostly empty
│   │   └── company_object/tests/, services/tests/   # co-located tests
│   │
│   ├── ports/                    # capability Protocols — one file per capability
│   │   ├── model.py, search.py          # ← actually wired (Anthropic/Groq/Tavily/DDG)
│   │   └── banking.py, esign.py, incorporation.py, payments.py, payroll.py, shared.py
│   ├── adapters/                 # concrete implementations, one folder per vendor
│   │   ├── model_anthropic/, model_groq/, model_template/   # model.py adapters
│   │   ├── search_tavily/, search_duckduckgo/, search_none/  # search.py adapters
│   │   └── banking_mercury/, esign_docusign/, incorporation_stripe_atlas/  # written, unwired
│   ├── workflows/                # the founder-facing W1–W8 catalog
│   │   ├── catalog.py                # WorkflowDef / Phase / DocumentDef, status_for()
│   │   ├── doc_templates*.py         # TEMPLATES dict — the live fillable-document system
│   │   ├── doc_guidance.py           # GUIDANCE dict — non-fillable "do this, mark done" tasks
│   │   ├── w1_formation/             # reference WorkflowManifest against orchestration/runner.py
│   │   │                             #   — an example, not wired into the live app
│   │   └── _template/                # scaffold for authoring a new workflow module
│   └── domain/, config/          # scaffolded, mostly empty
│
├── db/
│   ├── README.md
│   └── migrations/               # empty until Postgres persistence is actually built
│
├── deploy/                       # everything about running this somewhere real
│   ├── docker-compose.prod.yml   # api + web + postgres — the actual prod topology
│   ├── env/
│   │   ├── .env.staging.example
│   │   └── .env.production.example
│   └── README.md
│
├── docs/
│   ├── adr/                      # real decision records (0001–0005)
│   ├── architecture/             # target-state system design (Mermaid + HTML), not the
│   │   ├── architecture.html         #   as-built code — see the backend architecture
│   │   ├── platform-architecture/    #   artifact for what's actually running
│   │   └── platform-architecture-v2/
│   ├── guides/                   # authoring-a-workflow, local-setup, writing-an-adapter
│   ├── product-phases-docs/      # PRD, personas, journey map, MVP definition, by phase
│   ├── research-archive/         # raw dated research dumps, per person — historical,
│   │                             #   not authoritative; don't treat as current spec
│   ├── domain-glossary.md, engineering-guidelines.md, git-policy.md,
│   ├── prd.md, requirements.md, roadmap.md, security-compliance.md,
│   └── team-ownership.md, testing-strategy.md, two-week-plan.md
│
├── reference/                    # real-world source material, not app code
│   ├── w1/                       # gitignored — the raw legal-template dump; its content is
│   │                             #   already absorbed into workflows/doc_templates.py
│   └── w6/                       # tracked — W6 legal-doc samples + the HTML mockup that
│                                 #   w6-workflow.tsx was ported from
│
├── connector-hub/                # standalone HTML mockup — third-party integration catalog
│                                 #   (not yet relocated; same category as docs/architecture)
│
├── .github/workflows/
│   ├── ci.yml                    # ruff, mypy, lint-imports, pytest (backend) + web build/typecheck
│   └── deploy.yml                # build + push images on merge to main
│
├── .env.example                  # target-state env vars (Postgres, Temporal, encryption key) —
│                                 #   most aren't consumed by the code yet; see docs/architecture
├── docker-compose.yml            # LOCAL DEV infra only (Postgres + Temporal) — not prod
├── pyproject.toml, uv.lock       # Python deps, ruff/mypy/import-linter/pytest config
├── CODEOWNERS
└── README.md
```

## Notes on things that look like they should exist but don't

- **No Postgres, no auth, no multi-tenancy** in the running code — `memory_store.py` is an
  in-process dict. `docker-compose.yml` and `.env.example` describe the target state, not what
  `apps/api` actually reads today.
- **`document_intelligence/` and `orchestration/`** are real, tested code that nothing imports.
  Don't assume a document or a workflow phase goes through them without checking.
- **`workflows/w1_formation/`** is a *reference* manifest for the orchestration design, not the
  thing that actually gates W1–W8 today — that's `catalog.status_for()`, a plain function.

See the "Current Backend Architecture" artifact (backend, as-built, sequence diagrams) and the
`docs/architecture/` folder (target design) for the long version of all of the above.
