# StartupKit — Product Requirements Document
**Owner:** Product · **Status:** v1 (MVP) · **Audience:** founding engineering team + YC diligence

## 1. Vision
StartupKit is the operating system for founders. It runs the entire journey of forming and operating
a startup — eight gated workflows from legal formation to go-to-market — so founders focus on their
product while StartupKit handles the paperwork, like an automated consultant.

## 2. Problem
Founders lose weeks to fragmented, error-prone setup: incorporation, IP assignment, banking, payroll,
compliance deadlines. Each task lives in a different tool, nothing shares state, and a single missed
deadline (e.g. the 83(b) election) can be financially catastrophic and irreversible.

## 3. Users
- **Solo / co-founders (primary):** want to be "company-ready" fast, with correct documents.
- **Early operators (secondary):** manage HR, finance, and GTM as the team grows.
- **Investors (tertiary):** consume the outputs (cap table, data room) during diligence.

## 4. What it does (the eight workflows + fundraising)
| ID | Workflow | Outcome |
|----|----------|---------|
| W1 | Business Formation | Legal entity, EIN, cap table, 83(b) filed |
| W2 | IP & Legal Contracts | Founder IP/PIIA signed; client-contract templates |
| W3 | Financial Infrastructure | Bank, corporate card, accounting, Stripe, invoicing, runway |
| W4 | Technical Infrastructure | Domain, repos, secrets, DB, auth, hosting, CI/CD, monitoring |
| W5 | Brand & Product | ICP, positioning, logo, website, analytics |
| W6 | People & HR | Founder docs, payroll, hiring, onboarding, benefits |
| W7 | Go-to-Market | Messaging, decks, CRM, outreach, analytics |
| W8 | Operations & Tooling | Workspace, comms, scheduling, password mgmt |
| FR | Fundraising | Pitch materials, investor pipeline, closing docs |

Workflows are **gated**: W1 emits triggers (`name.confirmed`, `ein.received`, `entity.formed`) that
unblock the others. The full dependency graph is the master spec (see architecture doc).

## 5. Core product principles
- **One source of truth.** Everything reads/writes the Company Object; documents stay in sync.
- **Choose your provider.** Each capability (banking, e-sign, payroll…) is a third-party tool today,
  selectable by the founder; first-party StartupKit options can be added later without disruption.
- **Human-approved, never blindly generated.** Every generated legal/financial document passes
  deterministic validation and a human approval gate before it becomes real.
- **No missed deadlines.** Irreversible deadlines get guaranteed, escalating reminders.

## 6. MVP scope (v1)
- W1 end-to-end (the gating workflow), proving the full platform spine.
- Third-party adapters only, for the W1-critical capabilities: incorporation, e-sign, banking.
- Document Intelligence v1 with a human approval gate and a golden-document eval set.
- Compliance engine with the 83(b) guaranteed-deadline path.
- Founder web app: onboarding, workflow status, approval inbox, provider selection.

## 7. Out of scope (v1)
First-party provider implementations; W2–W8 full builds (manifests stubbed); marketplace; mobile app;
non-US jurisdictions (architecture supports them via rule-packs; not shipped in v1).

## 8. Success metrics
- A founder reaches "entity formed + EIN + 83(b) filed" in a single guided session.
- 0 missed 83(b) deadlines (hard requirement).
- 100% of generated documents pass validation + human approval before storage.
- Adding a new banking provider = one adapter + a passing conformance test (no workflow change).
