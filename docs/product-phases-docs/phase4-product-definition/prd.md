# StartupKit — Product Requirements Document

**Version:** 1.2 Draft  
**Status:** Product and technical review  
**Initial market:** United States  
**Owner:** Product Team  
**Audience:** Product, Design, Engineering, QA, Operations, and Stakeholders

---

# Layer 1 — Executive Overview

## 1. Purpose of the Document

This PRD defines what StartupKit must provide, who it serves, the outcomes it should create, and the requirements needed to design, build, test, and release the product.

StartupKit helps founders move from an early idea to a functioning, operating, and growing company. It does not only guide them. It also helps complete the work through structured workflows, AI assistance, integrated providers, specialist review where required, documents, approvals, and evidence tracking.

## 2. Product Vision and Expected Outcomes

StartupKit should become the operating layer for the early startup journey.

A founder should be able to begin with:

> “I have an idea, but I do not know how to turn it into a real company.”

StartupKit should help the founder:

- understand their current stage;
- identify the next required outcome;
- complete work through the platform and integrations;
- review and approve important actions;
- track provider and workflow progress;
- store documents and evidence;
- avoid repeating verified information;
- continue from idea to validation, formation, launch, operations, and growth.

### Expected Founder Outcomes

1. Validated problem and customer definition
2. MVP plan
3. Legally formed company
4. Required legal and IP documents
5. Banking, payments, and accounting foundations
6. Product and technical infrastructure
7. Brand and website setup
8. Launch and customer-acquisition readiness
9. Hiring and internal operational readiness
10. Growth and fundraising readiness

## 3. Problem Statement

Founders currently create companies through disconnected tools, providers, spreadsheets, emails, documents, and professional services.

This causes:

- unclear startup sequence;
- repeated data entry;
- fragmented legal, financial, technical, and operational work;
- missed dependencies and deadlines;
- unclear provider status;
- scattered documents and evidence;
- difficulty knowing what is complete;
- unnecessary repetition for existing companies;
- poor continuity across startup stages.

StartupKit solves this by combining guidance, execution, tracking, and verified company state in one product.

## 4. Target Audience and Personas

| Persona | Description | Main Need |
|---|---|---|
| First-time founder | Has an idea but limited startup experience | Clear guidance and execution support |
| Technical founder | Can build a product but needs business support | Formation, legal, finance, hiring, operations |
| Non-technical founder | Needs help with product, website, and tools | Technical and launch support |
| Existing-company founder | Already has some setup completed | Gap assessment and continuation |
| Co-founder | Shares decisions, ownership, and signatures | Secure participation |
| Internal specialist/admin | Reviews or completes assigned work | Controlled access and work management |

## 5. Core Product Pillars

1. **Guided Startup Journey** — determines the founder’s stage and next outcome.
2. **Execution and Provider Coordination** — completes or coordinates work through software, AI, providers, and specialists.
3. **Company Object** — stores the authoritative company state.
4. **Documents, Approvals, and Evidence** — manages review, signature, versions, and proof.
5. **Progress and Compliance Tracking** — tracks work, blockers, deadlines, dependencies, and provider status.

## 6. Scope Definition

### In Scope for MVP

- founder onboarding;
- new-founder and existing-company entry paths;
- W0 stage assessment and routing;
- step-by-step user experience;
- Company Object;
- workflow execution;
- task and work tracking;
- approvals;
- document versions;
- integration runtime;
- one end-to-end W1 formation path;
- one critical provider integration;
- journey tracking for W0 and W1–W8;
- provider status and evidence;
- manual fallback;
- dashboard/read models;
- tenant isolation and audit.

### Out of Scope for MVP

- full automation of W2–W8;
- every U.S. jurisdiction and entity type;
- international expansion;
- complete fundraising workflow;
- replacing full banking, accounting, payroll, CRM, or website platforms;
- irreversible actions without founder approval;
- multiple providers for every capability.

## 7. Terminology Dictionary

| Term | Definition |
|---|---|
| Workspace | Secure company environment used by authorized users |
| Tenant | Isolation boundary for one company workspace |
| Company Object | Authoritative operational state of the company |
| Workflow | Reusable process for completing an outcome |
| Workflow Run | One execution of a workflow for a company |
| Task | Action required from a founder or user |
| Work Item | Work handled by StartupKit, provider, AI, automation, or specialist |
| Approval | Recorded decision required before sensitive work continues |
| Evidence | Proof that an outcome was completed |
| Integration Run | One tracked provider execution |
| Provider Adapter | Provider-specific implementation of a capability |
| Company Event | Confirmed change in company state |
| Read Model | Founder-friendly view of internal data |
| Blocker | Condition preventing work from continuing |

---

# Layer 2 — Feature Specifications by Role

# Founder Features

## EPIC F1 — Account and Workspace Setup

**Objective:** Allow a founder to securely create a workspace and start the correct journey.

### User Story: F1-001 — Create Account and Workspace

**As a** founder,  
**I want to** create an account and company workspace,  
**So that** I can begin and save my startup journey.

**Acceptance Criteria:**

1. A founder can register using an approved authentication method.
2. A tenant and company workspace are created.
3. The founder receives the owner role.
4. An initial Company Object is created.
5. The founder is routed to entry-path selection.
6. Progress can be saved and resumed.
7. Workspace creation is audited.

**Validations & Dependencies:**

- Authentication
- Tenant isolation
- Membership creation

**Error Messages:**

- “An account with this email already exists.”
- “We could not create your workspace. Please try again.”

**Ripple Effects:**

- Creates the company context for all workflows
- Unlocks F1-002

### User Story: F1-002 — Select Starting Path

**As a** founder,  
**I want to** indicate whether I am starting from an idea or already have a company,  
**So that** StartupKit gives me the correct experience.

**Acceptance Criteria:**

1. Founder can choose a new-company or existing-company path.
2. The choice is stored.
3. The correct W0 route begins.
4. Only relevant questions are displayed.
5. Founder may change the choice before completing assessment.

---

## EPIC F2 — Stage Assessment and Journey Plan

**Objective:** Determine the founder’s current stage and create the correct journey.

### User Story: F2-001 — Complete W0 Assessment

**As a** founder,  
**I want to** answer focused questions about my startup,  
**So that** StartupKit can determine what I should do next.

**Acceptance Criteria:**

1. Questions appear step by step.
2. Irrelevant questions are hidden.
3. Progress can be saved and resumed.
4. Verified company data is reused.
5. A recommended route is produced.
6. The recommendation is explained in plain language.
7. Founder can confirm or override it.

**Error Messages:**

- “Please complete the required fields.”
- “We could not calculate your route. Please try again.”

**Ripple Effects:**

- Creates the journey plan
- Activates relevant workflows

### User Story: F2-002 — View Startup Journey

**As a** founder,  
**I want to** see my current stage and upcoming outcomes,  
**So that** I understand where I am without seeing every internal task.

**Acceptance Criteria:**

1. Journey shows current, completed, blocked, and future stages.
2. Meaningful outcomes are shown instead of workflow internals.
3. The next recommended action is visible.
4. Blockers explain why progress stopped.
5. Provider-dependent work shows its current status.
6. W0 and W1–W8 appear where relevant.

---

## EPIC F3 — Existing-Company Intake

### User Story: F3-001 — Upload and Verify Existing Information

**As an** existing-company founder,  
**I want to** upload current documents and confirm extracted information,  
**So that** I only complete missing work.

**Acceptance Criteria:**

1. Supported documents can be uploaded.
2. Original files are preserved.
3. Candidate facts may be extracted.
4. Extracted facts remain unverified.
5. Founder can approve, correct, or reject them.
6. Verified facts update the Company Object.
7. Completed outcomes are skipped or marked complete.
8. Missing work is added to the journey.

---

## EPIC F4 — Step-by-Step Work Experience

### User Story: F4-001 — Complete a Focused Step

**As a** founder,  
**I want to** complete one clear step at a time,  
**So that** I am not overwhelmed.

**Acceptance Criteria:**

1. Each screen has one objective or a small related group of inputs.
2. The screen explains why information is required.
3. The founder can see what StartupKit will do next.
4. Progress is saved.
5. Verified data is reused.
6. Irrelevant inputs are hidden.
7. The next step is shown after completion.

---

## EPIC F5 — Documents and Approvals

### User Story: F5-001 — Review and Approve a Document

**As a** founder,  
**I want to** review the exact document version before approval,  
**So that** sensitive work cannot continue without my consent.

**Acceptance Criteria:**

1. Current version is clearly shown.
2. Founder can approve or request changes.
3. Approval records user, timestamp, decision, and version.
4. An outdated version cannot be approved.
5. Approved documents can move to signature or provider execution.
6. All versions remain available according to permissions.

**Error Messages:**

- “This document has changed. Review the latest version.”
- “Approval could not be recorded.”

---

## EPIC F6 — Provider Tracking

### User Story: F6-001 — View Provider Status

**As a** founder,  
**I want to** see whether provider work is submitted, waiting, blocked, or complete,  
**So that** I know whether I need to act.

**Acceptance Criteria:**

1. Provider work has a normalized status.
2. Responsible party is visible.
3. Founder actions are clearly shown.
4. Information requests create a founder task.
5. Completion evidence is stored where available.
6. Failed work shows a recovery path.
7. Duplicate provider requests are prevented.

---

## EPIC F7 — Work, Blockers, and Notifications

### User Story: F7-001 — View Work Requiring Attention

**As a** founder,  
**I want to** see work that requires my action,  
**So that** I can keep the journey moving.

**Acceptance Criteria:**

1. Work is grouped by responsibility and status.
2. Founder work is separated from StartupKit-managed work.
3. Blockers explain why progress stopped.
4. Due dates and deadlines are visible.
5. Completed work remains in history.
6. Notifications link to the correct step.

---

# Co-Founder Features

## EPIC C1 — Shared Decisions and Signatures

### User Story: C1-001 — Invite Co-Founder

**As a** founder,  
**I want to** invite a co-founder,  
**So that** they can provide information, approve decisions, and sign documents.

**Acceptance Criteria:**

1. Founder can invite by email.
2. Invitation belongs to the correct tenant.
3. Co-founder receives an appropriate role.
4. Access is permission-based.
5. Invitation acceptance is audited.
6. Required work appears in the co-founder’s Work view.

---

# Specialist and Administrator Features

## EPIC S1 — Assigned Work and Review

### User Story: S1-001 — Review Assigned Work

**As an** authorized specialist,  
**I want to** access only assigned work,  
**So that** I can review or complete it securely.

**Acceptance Criteria:**

1. Specialist sees only permitted work.
2. Required company context is available.
3. Internal and founder-visible notes are separated.
4. Specialist can request missing information.
5. Review decisions are recorded.
6. Completion requires output or evidence.
7. All actions are audited.

---

# Platform Features

## EPIC P1 — Company Object

### User Story: P1-001 — Update Verified Company State

**As the** StartupKit platform,  
**I want to** update company state only after valid evidence or approval,  
**So that** all workflows use reliable information.

**Acceptance Criteria:**

1. Facts support proposed, extracted, awaiting-review, approved, provider-verified, rejected, and superseded states.
2. Important facts record source and timestamp.
3. Conflicting facts are not silently overwritten.
4. Changes create auditable events.
5. Dependent workflows receive reliable triggers.
6. Founder-facing views update after confirmed changes.

## EPIC P2 — Workflow and Dependency Management

### User Story: P2-001 — Resume a Waiting Workflow

**As the** StartupKit platform,  
**I want to** pause and resume workflows across user and provider waiting periods,  
**So that** long-running work remains reliable.

**Acceptance Criteria:**

1. Workflows can wait for user action, provider action, time, or evidence.
2. State survives process restarts.
3. Retries do not duplicate external actions.
4. Dependencies prevent invalid progression.
5. Events may unlock later workflows.
6. Workflow versions are identifiable.

## EPIC P3 — Cross-Workflow Tracking

### User Story: P3-001 — Track Workflow Outcomes

**As the** StartupKit platform,  
**I want to** track outcomes consistently across W0–W8,  
**So that** founders see reliable progress even when execution is manual or integration-led.

**Acceptance Criteria:**

1. Each workflow exposes status, owner, blocker, founder action, provider state, evidence, and result.
2. W2–W8 remain visible in MVP.
3. Manual completion can be verified with evidence.
4. Completion updates journey views.
5. Dependencies unlock the next outcome.

---

# Workflow Coverage

| Workflow | Purpose | MVP Coverage |
|---|---|---|
| W0 | Stage, validation, and intake | Functional assessment, routing, and journey creation |
| W1 | Company formation | One complete supported path |
| W2 | Legal and IP | Visible, trackable, approval/evidence support, manual fallback |
| W3 | Finance | Provider tracking, founder actions, evidence, manual fallback |
| W4 | Product and technical infrastructure | Required outcomes and setup tracking |
| W5 | Brand and market presence | ICP, messaging, website, and analytics tracking |
| W6 | People and HR | Hiring and payroll readiness tracking |
| W7 | Launch and GTM | CRM, messaging, support, payments, launch status |
| W8 | Operations and tooling | Workspace, files, communication, scheduling, internal tools |

---

# Layer 3 — Roadmap

## Phase 0 — Product Definition

- approve PRD;
- confirm terminology;
- confirm first vertical slice;
- confirm MVP boundaries;
- confirm provider and jurisdiction assumptions.

## Phase 1 — Core Foundation

- tenancy and security;
- Company Object;
- workflow runtime;
- tasks and work;
- approvals;
- documents and evidence;
- audit;
- read models.

## Phase 2 — Execution Foundation

- background processing;
- integration runtime;
- provider adapters;
- webhooks;
- retries and idempotency;
- notifications.

## Phase 3 — W0

- stage assessment;
- new-founder path;
- existing-company path;
- journey-plan creation.

## Phase 4 — W1 Pilot

- one formation path;
- one critical provider integration;
- one document approval/signature flow;
- evidence and Company Object update.

## Phase 5 — Cross-Workflow Tracking

- W2–W8 status models;
- blockers, owner, next action, and evidence;
- manual fallback;
- available integrations.

## Phase 6 — Automation Expansion

- deepen W2 and W3 first;
- expand W4–W8;
- add providers;
- add advanced AI and retrieval.

---

# Success Metrics

## Founder Metrics

- onboarding completion;
- W0 completion;
- stage progression;
- formation completion;
- time blocked;
- deadline completion;
- founder satisfaction.

## Product and Operations Metrics

- workflow completion;
- approval and signature rate;
- integration completion;
- provider failure rate;
- support intervention;
- work correctly reused or skipped.

## Technical Metrics

- workflow recovery;
- background-job recovery;
- duplicate provider actions;
- webhook success;
- dashboard response time;
- AI cost per company;
- time to add a provider adapter.

---

# Risks and Assumptions

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Scope becomes too broad | Delayed release | Prove one complete path first |
| Legal/compliance content is incorrect | User harm | Approved sources, rules, review |
| Provider APIs are incomplete | Reduced automation | Manual fallback and evidence |
| AI invents facts | Incorrect actions | Verified context and approval |
| Sensitive data is exposed | Security risk | Isolation, encryption, least privilege |
| Founders feel overwhelmed | Low completion | Step-by-step UX |

## Assumptions

- Initial market is the United States.
- Founders approve important decisions and complete KYC.
- Some work remains manual or specialist-assisted.
- Initial release may use one provider per capability.
- Python is the primary backend language.
- FastAPI may be used for the API layer only.
- Database, workflow, queue, storage, authentication, and AI choices remain technical decisions.

---

# Appendices

The implementation-heavy material is intentionally placed after the main PRD.

## Appendix A — Detailed Product Flow

1. Founder creates account and workspace.
2. Tenant, membership, Company Object, onboarding state, and audit event are created.
3. Founder selects new or existing company.
4. W0 starts the correct route.
5. Founder completes focused assessment steps.
6. StartupKit creates the journey plan.
7. A relevant outcome activates.
8. A task or work item is created.
9. StartupKit collects required information.
10. A document or provider request is prepared where needed.
11. Founder approval is requested for sensitive work.
12. Integration run is created.
13. Background worker calls the provider.
14. Webhook, polling, or manual confirmation updates status.
15. Evidence is stored.
16. Company Object is updated.
17. Domain event is created.
18. Next workflow or action unlocks.
19. Journey and dashboard views update.

## Appendix B — How the Core Is Used

| Core capability | Responsibility |
|---|---|
| Company Object | Stores authoritative company state |
| Workflow Orchestration | Controls branching, waiting, and resumption |
| Tasks and Work | Tracks responsibility and progress |
| Approvals | Protects sensitive actions |
| Documents | Stores versions, signed files, and evidence |
| Document Intelligence | Extracts and prepares content |
| Integration Runtime | Coordinates provider execution |
| Provider Adapters | Translate requests into provider APIs |
| Compliance | Tracks obligations and deadlines |
| Tenancy | Isolates company data |
| Security | Controls access |
| Audit | Records actions |
| Observability | Monitors the platform |
| Read Models | Creates founder-facing views |
| Notifications | Communicates actions and status |

## Appendix C — Requirements Before Core Development

1. Confirm the first vertical slice.
2. Agree on terminology.
3. Define state lifecycles.
4. Define initial commands and events.
5. Define module ownership boundaries.
6. Define the initial data model.
7. Select database, workflow, queue, storage, authentication, and provider choices.
8. Define security and tenancy rules.
9. Define API and application boundaries.
10. Define UI read-model contracts.
11. Prepare provider sandbox access.
12. Define acceptance tests.

### Recommended First Vertical Slice

1. Create workspace
2. Start W0 or a simple W1 route
3. Create founder task
4. Collect company information
5. Generate one document
6. Approve the document
7. Create one integration run
8. Receive provider completion
9. Store evidence
10. Update Company Object
11. Unlock next action

## Appendix D — Recommended Core Development Order

1. Confirm vertical slice.
2. Define terminology and ownership.
3. Define states, commands, and events.
4. Define plain Python domain models.
5. Define repository and provider interfaces.
6. Design initial database model.
7. Implement application use cases.
8. Implement persistence adapters.
9. Add API layer.
10. Add background execution.
11. Add one provider adapter.
12. Connect durable workflow.
13. Build read models.
14. Test restart, retry, idempotency, evidence, and tenant isolation.
