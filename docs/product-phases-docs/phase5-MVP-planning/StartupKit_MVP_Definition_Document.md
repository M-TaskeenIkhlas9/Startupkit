# StartupKit — MVP Definition Document

**Phase:** 5 — MVP Planning  
**Version:** 1.0 Draft  
**Initial market:** United States  
**Audience:** Product, Design, Engineering, QA, Operations, and Stakeholders

---

## 1. Purpose

This document defines the minimum viable product for StartupKit.

The MVP must prove that StartupKit can guide and execute one meaningful founder journey from workspace creation to a verified company outcome while establishing a reusable core for future workflows.

The MVP is not the smallest collection of screens. It is the smallest end-to-end system that proves the product promise safely.

---

## 2. MVP Product Hypothesis

StartupKit will create meaningful value if it can:

1. understand a founder’s starting point;
2. create a personalized route;
3. guide the founder through focused steps;
4. coordinate documents, approvals, and provider work;
5. store completion evidence;
6. update verified company state;
7. unlock the correct next action;
8. show progress across the broader startup journey.

---

## 3. MVP Target Users

### Primary

- first-time founders;
- technical founders;
- founders creating a U.S. startup;
- founders using the supported entity and jurisdiction path.

### Secondary

- existing-company founders receiving a limited gap assessment;
- co-founders participating in approvals and signatures;
- internal specialists or operators completing assigned work.

### Not a Primary MVP Focus

- mature companies;
- large enterprise teams;
- complex international structures;
- companies requiring unsupported legal or tax structures;
- portfolio-level accelerator administration.

---

## 4. MVP Reference Journey

The MVP reference journey is:

```text
Create Workspace
→ Complete W0 Assessment
→ Confirm Recommended Route
→ Start Supported W1 Formation Path
→ Submit Founder and Company Information
→ Generate Formation Document
→ Review and Approve Exact Version
→ Send Through Provider Integration
→ Wait for Provider Result
→ Store Evidence
→ Update Company Object
→ Unlock Next Action
→ Show Updated Journey
```

This journey must work from beginning to end.

---

## 5. MVP Scope Principles

### Build the reusable spine first

The majority of MVP effort should establish reusable platform capabilities.

### Prove one workflow deeply

W1 is the reference workflow used to prove the platform.

### Track broader workflows without fully automating them

W2–W8 must be visible and trackable, but full automation is deferred.

### Use integrations where practical

The platform should coordinate providers rather than rebuild their capabilities.

### Support manual fallback

The founder journey must continue when an API or provider is unavailable.

### Protect high-risk actions

Legal, financial, deadline-sensitive, and irreversible actions require strong controls.

---

## 6. In-Scope MVP Capabilities

## 6.1 Foundations and Data Layer

The MVP must include:

- tenant-scoped data;
- user and membership records;
- forward-only migrations;
- append-only event storage;
- transactional outbox;
- audit records;
- tenant context on all relevant operations.

**Purpose:** Establish a secure and durable base.

---

## 6.2 Company Object

The MVP must include:

- immutable company events;
- optimistic concurrency;
- verified company facts;
- basic projections;
- source and evidence links;
- event-version support;
- founder-facing company state.

**Minimum company state**

- company identity;
- founders;
- entity path;
- jurisdiction;
- formation status;
- document status;
- provider status;
- evidence status;
- current journey stage.

---

## 6.3 Provider Framework

The MVP must include:

- capability ports;
- provider registry;
- one provider adapter for the reference journey;
- provider error normalization;
- conformance tests;
- idempotency;
- webhook or polling support;
- manual fallback.

**Purpose:** Prove that providers can be replaced without changing core workflow logic.

---

## 6.4 Durable Workflow Orchestration

The MVP must include:

- durable workflow state;
- action steps;
- human-task steps;
- document-generation steps;
- wait-event steps;
- decision steps;
- trigger emission;
- retries;
- restart recovery;
- workflow versioning;
- cross-workflow outbox triggers.

---

## 6.5 Shared Services

The MVP must include:

- task and work-item tracking;
- approval inbox;
- document storage;
- document versions;
- evidence storage;
- audit trail;
- notifications for required actions;
- founder-friendly read models.

---

## 6.6 Document Intelligence

The MVP must support:

- one approved document type for the reference journey;
- generation from verified company facts;
- vetted template or clause source;
- deterministic validation;
- version creation;
- founder approval;
- final evidence storage;
- golden-document evaluation.

The MVP must not depend on unrestricted free-form legal generation.

---

## 6.7 Compliance and Deadlines

The MVP must support:

- applicable deadline creation for the supported W1 path;
- reminder scheduling;
- escalation;
- evidence of completion;
- special protection for irreversible deadlines.

The 83(b) deadline must be treated as a high-risk reliability requirement when applicable.

---

## 6.8 Identity, Tenancy, and Security

The MVP must support:

- authentication;
- founder and co-founder roles;
- tenant isolation;
- row-level access enforcement where applicable;
- field protection for sensitive data;
- provider-token protection;
- webhook verification;
- audit of sensitive actions.

---

## 6.9 API and Founder Web Experience

The MVP must provide:

- account and workspace creation;
- W0 onboarding;
- current-step experience;
- route recommendation;
- journey view;
- Work view;
- document review and approval;
- provider-status view;
- waiting and blocker states;
- evidence visibility;
- webhook endpoints.

The UI must remain step-by-step rather than placing all workflows on one screen.

---

## 6.10 W0 — Stage and Route Assessment

The MVP must support:

- new-founder entry;
- limited existing-company entry;
- stage questions;
- save and resume;
- route calculation;
- recommendation explanation;
- founder confirmation;
- initial journey-plan creation.

---

## 6.11 W1 — Reference Formation Workflow

The MVP must support one clearly defined formation path.

The chosen path must specify:

- supported entity type;
- supported jurisdiction;
- eligible founder conditions;
- required provider;
- required documents;
- approval points;
- provider outputs;
- completion evidence;
- deadline handling.

The target outcome is not simply “filing submitted.” The supported path must reach the agreed verified completion state.

---

## 6.12 W2–W8 Journey Tracking

The MVP must represent:

- W2 Legal/IP;
- W3 Finance;
- W4 Technical Infrastructure;
- W5 Brand and Market Presence;
- W6 People and HR;
- W7 Launch and GTM;
- W8 Operations and Tooling.

For each relevant workflow, the MVP must show:

- relevance;
- status;
- owner;
- founder action;
- provider state;
- blocker;
- evidence;
- next dependency.

Full workflow automation is not required.

---

## 7. Out-of-Scope MVP Capabilities

The MVP does not include:

- complete W2–W8 automation;
- all entity types;
- all U.S. states;
- international legal structures;
- complete fundraising workflow;
- full bookkeeping and tax engine;
- full payroll system;
- full CRM;
- full website builder;
- full cloud infrastructure provisioning;
- advanced portfolio administration;
- multiple providers for every capability;
- advanced health scoring;
- predictive risk recommendations;
- full PLE configurator depth.

These may be represented as later workflows, integrations, or roadmap items.

---

## 8. MVP Epic Cut

### MVP Platform Epics

- E0 — Foundations and Data Layer
- E1 — Company Object and Projections
- E2 — Provider Framework
- E3 — Orchestration Engine
- E4 — Shared Services
- E5 — Document Intelligence
- E6 — Compliance and Deadlines
- E7 — Identity, Tenancy, and Security
- E8 — API and Founder Web App

### MVP Workflow Epics

- E11 — W1 Business Formation
- E12 — Template Workflow Proof

### Partial MVP Representation

- W0 routing and intake
- W2–W8 journey tracking

### Deferred

- E9 — Advanced Observability and Health Score
- E10 — Full PLE Configurator
- E13–E17 full workflow automation

Some observability is still required for MVP reliability even if the complete health-score epic is deferred.

---

## 9. MVP User Stories

## MVP-001 — Create Workspace

**As a** founder,  
**I want to** create a secure workspace,  
**So that** I can begin and save my startup journey.

## MVP-002 — Complete W0

**As a** founder,  
**I want to** complete a stage assessment,  
**So that** I receive the correct route.

## MVP-003 — View Journey

**As a** founder,  
**I want to** see my current stage and next outcome,  
**So that** I understand my progress.

## MVP-004 — Complete Focused Step

**As a** founder,  
**I want to** complete one clear step at a time,  
**So that** I am not overwhelmed.

## MVP-005 — Approve Document Version

**As a** founder,  
**I want to** approve the exact version I reviewed,  
**So that** no different document is submitted.

## MVP-006 — Track Provider Work

**As a** founder,  
**I want to** see provider status and required actions,  
**So that** I know what is happening.

## MVP-007 — Resume Durable Workflow

**As the** system,  
**I want to** resume work after restarts and waiting periods,  
**So that** no founder journey is lost.

## MVP-008 — Store Evidence

**As a** founder,  
**I want to** retain proof of completed work,  
**So that** I can trust the company record.

## MVP-009 — Unlock Next Outcome

**As a** founder,  
**I want the correct next step to appear after completion,  
**So that** I can continue the journey.

## MVP-010 — Track W2–W8

**As a** founder,  
**I want to** see the status of later workflows,  
**So that** I understand the complete company journey.

---

## 10. MVP Success Criteria

The MVP is successful when it demonstrates:

### Product

- founders complete W0;
- founders understand the recommended route;
- the reference W1 path can complete;
- the UI remains understandable;
- founders can see work, blockers, and provider status;
- W2–W8 have meaningful journey status.

### Technical

- workflows survive restarts;
- provider calls are idempotent;
- cross-workflow triggers are durable;
- tenant isolation is proven;
- document approval is version-specific;
- evidence is retained;
- Company Object projections can be rebuilt;
- provider callbacks are verified and deduplicated.

### Operational

- internal teams can inspect failed workflows;
- manual fallback is available;
- deadlines and escalations work;
- provider failures are visible;
- support can identify the current owner and blocker.

---

## 11. MVP Definition of Done

The MVP is complete when a supported founder can:

1. Create an account and workspace.
2. Complete W0 assessment.
3. Receive and confirm a route.
4. See the startup journey.
5. Begin the supported W1 path.
6. Submit required company and founder data.
7. Generate the supported document.
8. Review and approve the exact document version.
9. Send work through the provider framework.
10. See pending, blocked, and completed provider states.
11. Complete required founder actions.
12. Receive provider completion.
13. Store valid evidence.
14. Update the Company Object.
15. Trigger and display the correct next action.
16. See W2–W8 tracking.
17. Resume after API, worker, or workflow interruption.
18. Avoid duplicate external mutations.
19. Maintain tenant isolation.
20. Produce a complete audit trail.

---

## 12. Milestone Plan

## M0 — Contracts and Scope Locked

**Exit criteria**

- MVP path confirmed;
- terminology approved;
- requirements IDs stable;
- first provider selected;
- workflow and port contracts approved;
- risk review completed.

## M1 — Durable Spine Proven

**Exit criteria**

- tenant data foundation exists;
- event and outbox tables exist;
- basic Company Object works;
- trivial workflow survives restart;
- cross-workflow trigger is proven.

## M2 — Provider Framework Proven

**Exit criteria**

- capability port exists;
- registry resolves provider;
- adapter passes conformance tests;
- idempotent provider call succeeds;
- normalized provider status reaches the workflow.

## M3 — Document and Approval Flow Proven

**Exit criteria**

- one document is generated;
- deterministic validation runs;
- founder approves exact version;
- audit is recorded;
- waiting workflow resumes.

## M4 — W1 End-to-End Pilot

**Exit criteria**

- W0 routes founder to W1;
- supported W1 path completes;
- provider completion is reconciled;
- evidence is stored;
- Company Object updates;
- deadline flow works;
- founder sees updated journey.

## M5 — Baseline and Template Proof

**Exit criteria**

- `_template` workflow runs without core changes;
- W2–W8 tracking exists;
- manual fallback works;
- reliability and security acceptance tests pass;
- MVP release decision is made.

---

## 13. Risk Controls

The MVP must explicitly mitigate the following high-impact risks:

### R1 — Missed 83(b) deadline

- durable deadline workflow;
- escalating reminders;
- acknowledgment;
- human backstop;
- clock-advance reliability test.

### R2 — Incorrect generated document

- vetted templates;
- deterministic validators;
- founder approval;
- golden-document evaluation.

### R3 — Sensitive-data exposure

- tenant isolation;
- field encryption;
- secret management;
- audit.

### R5 — Provider outage or API change

- adapter boundary;
- retries;
- circuit breaking;
- dead-letter handling;
- manual fallback.

### R6 — Workflow state loss

- proven durable workflow engine;
- restart tests;
- replay tests.

### R8 — Scope creep

- fixed MVP cut;
- roadmap gate;
- change-control process.

### R11 — Lost cross-workflow trigger

- transactional outbox;
- idempotent consumers;
- crash test.

### R12 — Duplicate provider action

- internal idempotency key;
- provider idempotency where available;
- duplicate-callback protection.

---

## 14. MVP Metrics

### North Star

- Verified Startup Outcomes Completed

### Activation

- W0 completion rate;
- route confirmation rate;
- time to first verified outcome;
- first workflow start rate.

### Execution

- W1 completion rate;
- provider completion rate;
- workflow recovery rate;
- evidence completion rate;
- manual fallback completion rate.

### Experience

- current-step completion;
- founder-blocked time;
- route confidence;
- founder satisfaction.

### Reliability and Safety

- duplicate provider-action rate;
- webhook-processing success;
- audit coverage;
- tenant-isolation incidents;
- approval coverage;
- missed critical deadlines.

---

## 15. MVP Release Gate

The MVP may be released to external pilot users only when:

- all M0–M5 exit criteria required for pilot are complete;
- no unresolved high-impact security issue remains;
- supported legal templates have been reviewed;
- provider sandbox and production behavior are understood;
- restart and idempotency tests pass;
- tenant-isolation tests pass;
- deadline reliability test passes;
- support and manual fallback procedures exist;
- pilot eligibility criteria are documented;
- product, engineering, security, and operations approve release.

---

## 16. Pilot Constraints

The initial pilot should limit:

- number of companies;
- supported entity type;
- supported jurisdiction;
- founder eligibility;
- provider selection;
- document types;
- operational support hours.

Pilot users must be told clearly which paths are supported.

---

## 17. Post-MVP Expansion

After the MVP baseline is stable:

1. deepen W2 legal and IP;
2. deepen W3 finance;
3. expand W6 people and payroll;
4. add W4 technical setup;
5. add W5 brand and website;
6. add W7 GTM;
7. add W8 operations;
8. add advanced health score;
9. expand providers and jurisdictions;
10. add fundraising workflows.

Expansion should reuse the same core without adding workflow-specific logic to the engine.
