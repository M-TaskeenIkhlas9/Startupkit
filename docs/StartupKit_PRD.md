# StartupKit — Master Product Requirements Document

**Version:** 1.0 Draft  
**Status:** Product and technical review  
**Initial market:** United States  
**Product type:** End-to-end startup creation and execution platform  
**Document purpose:** Define what StartupKit must provide, for whom, how it should behave, and the constraints that guide design and engineering.

---

## 1. Product Overview

StartupKit helps founders turn an early idea into a functioning, operating, and growing company.

It does more than explain what founders should do. It combines guided decisions, structured workflows, AI assistance, integrated tools and service providers, specialist support where needed, document preparation, founder approvals, and progress tracking to help complete the work required across the startup journey.

A founder should be able to begin with:

> “I have an idea, but I do not know how to turn it into a real company.”

StartupKit should help that founder move through:

1. Idea development
2. Customer discovery and validation
3. Solution and MVP planning
4. Company formation
5. Legal and intellectual-property setup
6. Financial setup
7. Technical and product infrastructure
8. Brand and website creation
9. Launch and customer acquisition
10. First revenue
11. Hiring and internal operations
12. Growth and fundraising readiness

For founders who already have a company, StartupKit should identify what is complete, what is missing, and where they should continue.

---

## 2. Product Vision

StartupKit should become the operating layer that coordinates the founder’s early startup journey from idea to growth.

The founder should not need to independently discover every legal, financial, technical, operational, and go-to-market requirement or manually coordinate every provider.

StartupKit should answer:

- Where am I in the startup journey?
- What outcome should I work toward now?
- What information or decision is required from me?
- What work can StartupKit complete?
- What is waiting on a provider, reviewer, co-founder, or specialist?
- What is blocked and how can it be resolved?
- What evidence proves that an outcome is complete?
- What stage comes next?

---

## 3. Problem Statement

Founders currently create companies using disconnected tools, providers, documents, emails, spreadsheets, and professional services.

This causes several problems:

- Founders do not know the correct sequence of startup activities.
- They may form or build too early without validating the problem.
- The same company information is entered repeatedly.
- Legal, financial, technical, and operational work is fragmented.
- Provider statuses are difficult to track.
- Documents and evidence are spread across different systems.
- Important dependencies and deadlines may be missed.
- Existing companies are often forced to repeat completed work.
- AI-generated outputs may conflict with verified company facts.
- Founders cannot easily see what is complete, pending, blocked, or under review.

StartupKit addresses this by providing one guided and execution-focused system for the startup journey.

---

## 4. Target Users

### 4.1 First-time founder

Has an idea but limited knowledge of startup validation, formation, legal setup, finance, or operations.

**Primary need:** Clear guidance and practical execution support from the beginning.

### 4.2 Technical founder

Can build a product but needs help coordinating company formation, legal work, finance, compliance, hiring, and operations.

### 4.3 Non-technical founder

Needs support with product setup, websites, technical providers, business tools, and startup operations.

### 4.4 Existing-company founder

Already has some combination of an entity, EIN, bank account, website, contracts, employees, or accounting setup.

**Primary need:** An audit of what exists and a personalized plan for what remains.

### 4.5 Co-founder

Needs to provide information, review ownership, approve decisions, sign documents, and complete assigned actions.

### 4.6 Internal administrator or specialist

Needs permission-based access to review work, resolve issues, complete assigned services, or support a founder.

---

## 5. Product Goals

StartupKit must:

1. Guide founders through the complete startup lifecycle.
2. Help complete work rather than only display recommendations.
3. Support both new and existing companies.
4. Maintain one authoritative Company Object.
5. Turn complex processes into understandable, focused steps.
6. Coordinate AI, automation, providers, specialists, and founder actions.
7. Require founder approval for sensitive or irreversible actions.
8. Track documents, evidence, deadlines, and provider outcomes.
9. Preserve a reliable history of company decisions and completed work.
10. Make the founder’s current stage and next outcome clear.

---

## 6. Non-Goals

StartupKit will not initially:

- Replace regulated legal, tax, banking, payroll, or accounting providers.
- Guarantee approval by external providers.
- Support every country, jurisdiction, or business type.
- Automatically execute irreversible actions without authorization.
- Become a full bank, accounting system, CRM, payroll product, or website builder.
- Implement every possible workflow and provider in the first release.
- Treat unreviewed AI output as verified company truth.

---

## 7. Product Principles

### 7.1 End-to-end outcomes over checklists

The product should help founders achieve real outcomes, such as forming a company, signing agreements, launching a website, or opening a bank account.

### 7.2 Adaptive journey

The startup journey is not identical for every founder. Steps may be skipped, repeated, paused, or adapted based on stage, entity type, jurisdiction, business model, and existing setup.

### 7.3 Step-by-step experience

The UI should present focused steps rather than showing the entire system on one screen.

### 7.4 One source of company truth

All workflows should use the same verified Company Object.

### 7.5 Human control for important decisions

The founder remains responsible for key business decisions, approvals, signatures, and authorizations.

### 7.6 Provider-neutral capabilities

Workflows should request capabilities such as formation, banking, payroll, or e-signature rather than directly depending on one provider.

### 7.7 Evidence-based completion

Important outcomes should be supported by documents, receipts, confirmations, signed records, or other evidence.

---

## 8. End-to-End Founder Journey

StartupKit organizes the startup journey into broad stages.

### Stage 1 — Discover

- Define the problem
- Identify possible customers
- Research competitors
- Conduct customer discovery
- Evaluate whether the problem is meaningful

### Stage 2 — Validate and Plan

- Test demand
- Define the solution
- Identify the business model
- Define MVP scope
- Create an initial product plan

### Stage 3 — Establish

- Choose entity type and jurisdiction
- Form the company
- Obtain tax identifiers
- Define ownership
- Complete founder legal documents
- Establish banking and accounting foundations

### Stage 4 — Build

- Set up technical infrastructure
- Build or prepare the MVP
- Create brand foundations
- Create the website and public presence
- Configure internal tools

### Stage 5 — Launch

- Prepare messaging
- Configure analytics and payments
- Set up CRM and support
- Reach initial prospects
- Launch the product
- Collect feedback and first revenue

### Stage 6 — Operate and Grow

- Improve the product
- Track customers and metrics
- Hire and onboard team members
- Run payroll and operations
- Prepare for fundraising and growth

---

## 9. Product Experience

### 9.1 Step-by-step interaction

A typical screen should focus on one clear objective and answer:

- What is this step?
- Why is it needed?
- What information is required?
- What will StartupKit do?
- What must the founder do?
- What happens next?

Long processes should be divided into smaller saved steps.

Example formation flow:

1. Business information
2. Entity structure
3. Jurisdiction
4. Founders
5. Ownership and vesting
6. Formation package
7. Approval and signatures
8. Filing status
9. Post-formation setup

### 9.2 Progressive disclosure

The product should only show information relevant to the current path.

Examples:

- Do not ask LLC founders about C-Corp stock documents.
- Do not show payroll setup before hiring readiness.
- Do not show full software infrastructure to a founder who only needs a basic website.
- Do not show fundraising work to a founder still validating the problem.

### 9.3 High-level journey visibility

The founder should be able to see the broader lifecycle without seeing every task at once.

A journey view may show:

- current stage;
- completed stages;
- outcomes in progress;
- blocked outcomes;
- future stages.

### 9.4 Main product areas

The founder application may include:

- **Home:** current stage, next action, urgent items, blockers
- **Journey:** lifecycle stages and completed outcomes
- **Work:** actions required from the founder and work being completed
- **Documents:** drafts, reviews, signed documents, and evidence
- **Company:** verified company facts and provider status
- **Messages:** questions, comments, and support
- **Settings:** users, permissions, integrations, security, and billing

---

## 10. Core Product Capabilities

### 10.1 Stage assessment and routing

StartupKit must determine the founder’s current stage and recommend the correct starting point.

It must support:

- new founders;
- existing companies;
- founders still validating an idea;
- founders ready for formation;
- founders entering later stages.

### 10.2 Company Object

The Company Object stores or derives the company’s verified operational state.

It may include:

- company profile;
- founders;
- entity and jurisdiction;
- formation status;
- EIN status;
- ownership and vesting;
- document status;
- banking and payment status;
- technical and website status;
- hiring and payroll status;
- compliance deadlines;
- provider connections;
- approved decisions.

Facts should be distinguishable as proposed, extracted, approved, provider-verified, rejected, or superseded.

### 10.3 Workflow execution

The platform must run long-running and adaptive workflows.

Workflows must support:

- human decisions;
- automated actions;
- provider actions;
- reviews and approvals;
- conditions and branches;
- waiting states;
- deadlines;
- retries;
- recovery after interruption;
- workflow versions.

### 10.4 Work and task management

The system must track:

- actions required from founders;
- work completed by StartupKit;
- provider activity;
- review status;
- due dates;
- blockers;
- responsibility;
- completion evidence.

Human specialists may be assigned where professional or judgment-based review is required, but they are one execution method within the broader workflow.

### 10.5 Documents

The system must support:

- uploads;
- generated drafts;
- review and revision;
- approval;
- e-signature;
- versioning;
- signed records;
- templates;
- evidence;
- access permissions.

### 10.6 AI capabilities

AI may support:

- research;
- extraction;
- summarization;
- structured recommendations;
- document drafting;
- validation assistance;
- gap analysis.

AI outputs must use approved context where required, retain provenance, and follow review rules based on risk.

### 10.7 Integrated providers

StartupKit may integrate with capabilities including:

- company formation;
- e-signature;
- banking;
- payments;
- accounting;
- payroll;
- domain and DNS;
- hosting;
- source control;
- CRM;
- workspace and email;
- AI models.

Where an API is unavailable, the workflow may support manual completion and evidence upload.

### 10.8 Compliance and deadlines

The system must:

- identify applicable obligations;
- calculate deadlines;
- create reminders;
- escalate critical items;
- preserve the rule version used;
- require evidence where necessary.

### 10.9 Dashboard and progress

The founder should see:

- current stage;
- next recommended action;
- urgent deadlines;
- work awaiting founder action;
- work being completed;
- provider status;
- blockers;
- recent completed outcomes.

The dashboard should not expose internal workflow complexity.

---

## 11. Workflow Requirements

### W0 — Stage, Validation, and Existing-Company Intake

**Purpose:** Determine where the founder is and what should happen first.

Includes:

- idea refinement;
- problem definition;
- customer discovery;
- competitor research;
- validation;
- MVP planning;
- existing-company assessment;
- formation readiness.

**Outcome:** A personalized journey plan and the correct next workflow.

### W1 — Company Formation

**Purpose:** Create the legal company and complete initial formation obligations.

Includes:

- entity and jurisdiction selection;
- founder information;
- ownership and vesting;
- company name;
- formation documents;
- approval and signatures;
- filing;
- formation evidence;
- EIN;
- corporate records;
- cap table;
- founder stock and RSPA where applicable;
- 83(b) preparation and tracking where applicable.

### W2 — Legal and Intellectual Property

**Purpose:** Establish the legal foundation for founders, contractors, employees, customers, and company IP.

May include:

- founder IP assignment;
- PIIA;
- founder agreements;
- NDA;
- contractor agreements;
- employment-related agreements;
- MSA;
- SOW;
- Terms of Service;
- Privacy Policy;
- DPA and related documents.

### W3 — Finance

**Purpose:** Establish financial infrastructure and basic financial visibility.

Includes:

- banking;
- corporate card;
- payment processing;
- accounting;
- chart of accounts;
- invoicing;
- burn and runway;
- payroll readiness.

### W4 — Product and Technical Infrastructure

**Purpose:** Create the technical foundation appropriate to the business.

May include:

- domain and DNS;
- business email;
- source control;
- hosting;
- environments;
- database;
- authentication;
- email services;
- CI/CD;
- monitoring;
- analytics.

The workflow must adapt for a basic website versus a software product.

### W5 — Brand and Market Presence

**Purpose:** Define how the company presents itself to customers.

Includes:

- ideal customer profile;
- positioning;
- messaging;
- voice and tone;
- logo and visual direction;
- website content;
- website setup;
- analytics.

### W6 — People and HR

**Purpose:** Prepare the company to hire and manage team members.

Includes:

- founder document status;
- payroll;
- offer letters;
- employment documents;
- employee IP documents;
- tax and benefits setup;
- onboarding.

### W7 — Launch and Go-to-Market

**Purpose:** Help the company reach customers and begin generating revenue.

Includes:

- customer messaging;
- sales materials;
- CRM;
- pipeline;
- prospect research;
- outreach;
- analytics;
- support;
- checkout and payment readiness.

Customer GTM should remain distinct from investor fundraising.

### W8 — Operations and Tooling

**Purpose:** Create the internal tools and systems required to operate the company.

Includes:

- business email and workspace;
- shared files;
- communication tools;
- password manager;
- scheduling;
- meetings;
- internal operating practices.

### Future workflows

- product-market fit;
- fundraising;
- governance;
- recurring compliance;
- advanced growth;
- international expansion.

---

## 12. Representative User Stories

### New founder

As a first-time founder, I want StartupKit to identify my current stage so that I do not form or build a company before validating the idea.

### Existing company

As a founder with an existing company, I want to upload my current documents so that StartupKit can identify completed and missing work.

### Legal document

As a founder, I want the required legal document prepared, reviewed, approved, signed, and stored without managing multiple disconnected services.

### Provider action

As a founder, I want to understand whether a provider action is waiting, successful, failed, or requires information from me.

### Journey progress

As a founder, I want to see my current startup stage and next outcome without being overwhelmed by every possible task.

---

## 13. Key Acceptance Criteria

The product is acceptable when:

1. A new founder and an existing-company founder can enter through different paths.
2. W0 recommends an appropriate starting point and allows founder confirmation.
3. The UI presents focused steps and saves progress.
4. Verified company information is reused across workflows.
5. The founder can distinguish their actions from work being completed elsewhere.
6. Long-running work shows a clear waiting state.
7. Documents retain versions, approvals, signatures, and evidence.
8. External provider actions are tracked until completion or failure.
9. Important outcomes update the Company Object.
10. Completed outcomes unlock the appropriate next stage or workflow.
11. The founder can see current stage, next action, blockers, and deadlines.
12. Critical actions remain auditable and tenant-isolated.

---

## 14. Technical Requirements

### 14.1 Technical direction

The backend platform will primarily use Python.

FastAPI may be used for the HTTP API layer, but the backend also includes:

- application services;
- domain and core modules;
- workflow orchestration;
- background workers;
- integration runtime;
- provider adapters;
- databases and storage;
- events and messaging;
- AI services;
- security;
- observability.

### 14.2 Required system capabilities

The platform requires:

- founder web application;
- API layer;
- modular backend;
- durable workflow execution;
- asynchronous background processing;
- Company Object and event history;
- task and work tracking;
- document management;
- AI and document intelligence;
- integration runtime;
- provider adapters;
- authentication and authorization;
- tenant isolation;
- audit and observability.

### 14.3 Integration requirements

Integrations must support:

- common capability contracts;
- provider adapters;
- idempotency;
- retries and timeouts;
- asynchronous status;
- webhooks;
- polling fallback;
- manual fallback;
- evidence capture;
- failure recovery.

### 14.4 Data requirements

The platform must store:

- users and tenants;
- companies and facts;
- workflow definitions and runs;
- tasks and work items;
- approvals;
- documents and versions;
- provider connections;
- integration runs;
- evidence;
- deadlines;
- notifications;
- audit records;
- AI execution records.

Specific database, queue, workflow-engine, cache, and file-storage technologies remain technical decisions.

### 14.5 Reliability and performance

The system must:

- resume long-running workflows after interruption;
- process slow work asynchronously;
- prevent duplicate external actions;
- safely retry provider callbacks and jobs;
- provide fast dashboard reads;
- preserve signed documents and critical evidence.

### 14.6 Security

The system must provide:

- tenant isolation;
- role-based access;
- encryption in transit and at rest;
- secure secret storage;
- webhook verification;
- sensitive-data controls for AI;
- access and action auditing.

---

## 15. Dependencies

StartupKit may depend on:

- formation providers;
- e-signature platforms;
- banking and payment providers;
- accounting and payroll systems;
- domain, hosting, and source-control platforms;
- AI providers;
- approved legal and compliance content;
- specialists where review is required.

Provider availability and API limitations may affect automation depth.

---

## 16. MVP Scope

The MVP should prove one complete end-to-end execution path while also allowing founders to track progress across the broader startup journey.

The MVP does not need to fully automate every workflow, but W0 and W1–W8 must be represented in the product so founders can see:

- whether a workflow is relevant;
- whether it is not started, in progress, blocked, waiting, or complete;
- what outcome the workflow is intended to produce;
- which provider or integration is handling the work;
- what founder action is required;
- what evidence or result confirms completion;
- which next workflow or stage becomes available.

### Must have

- founder onboarding;
- W0 stage routing;
- Company Object;
- workflow execution;
- step-based founder experience;
- task/work tracking;
- approvals;
- document versions;
- integration runtime;
- one fully supported W1 route;
- at least one provider integration for a critical capability;
- provider status and evidence;
- dashboard/read models;
- journey-level tracking for W0 and W1–W8;
- workflow states, blockers, next actions, and completion evidence across all workflows;
- manual fallback for workflows or provider actions not yet automated;
- tenant isolation and audit.

### MVP workflow coverage

#### W0

Must support stage assessment, startup readiness, and routing.

#### W1

Must include one end-to-end supported formation path.

#### W2–W8

Must be visible and trackable in the founder journey, even where execution is mostly handled by integrations or manual completion.

For each workflow, the MVP should support:

- activation and eligibility;
- status tracking;
- current owner or responsible party;
- provider or integration status;
- founder-required actions;
- blockers;
- evidence upload or provider evidence;
- completion confirmation;
- dependency and next-stage unlocking.

### Post-MVP

- deeper automation within W2–W8;
- broader existing-company assessment;
- more providers per capability;
- advanced AI retrieval;
- richer workflow-specific automation;
- fundraising and advanced growth.

---

## 17. Milestones

### Milestone 0 — Product definition

- approve PRD;
- confirm MVP boundaries;
- confirm primary user journeys;
- confirm workflow terminology.

### Milestone 1 — Core platform

- Company Object;
- workflows;
- tasks and approvals;
- documents;
- tenancy;
- audit.

### Milestone 2 — Execution foundation

- background processing;
- integration runtime;
- provider adapters;
- webhooks;
- evidence.

### Milestone 3 — W0

- stage assessment;
- validation route;
- existing-company route;
- formation-readiness route.

### Milestone 4 — W1 pilot

- one end-to-end formation path.

### Milestone 5 — Cross-workflow tracking

- represent W2–W8 in the founder journey;
- support status, blockers, next actions, ownership, and evidence;
- connect available provider integrations;
- support manual completion where automation is not yet available.

### Milestone 6 — Workflow automation expansion

- deepen W2 and W3 first;
- expand automation across W4–W8;
- add more providers and richer workflow-specific capabilities.

Exact delivery dates will be set after product and engineering estimation.

---

## 18. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Product scope becomes too broad | Delayed or incomplete release | Prove one end-to-end journey first |
| Legal or compliance information is incorrect | User harm and loss of trust | Approved sources, versioned rules, review where needed |
| Provider APIs are incomplete | Reduced automation | Manual fallback, evidence upload, provider-neutral design |
| AI invents company facts | Incorrect documents or actions | Verified context, provenance, validation, approvals |
| Sensitive data is exposed | Security and legal risk | Tenant isolation, encryption, least privilege, AI minimization |
| Workflows become difficult to maintain | Slow development and errors | Versioned definitions and reusable core modules |
| Founders feel overwhelmed | Poor completion | Focused steps and progressive disclosure |

---

## 19. Assumptions

- The initial market is the United States.
- Founders will personally approve important decisions and complete required KYC.
- Some work will initially remain manual or specialist-assisted.
- The first release may support one provider per capability.
- Python is the primary backend language.
- FastAPI is an API-layer option, not the full backend architecture.
- Database, workflow, queue, storage, authentication, and AI-provider choices require technical evaluation.
- W0 and one complete W1 path are more important than shallow coverage of every workflow.

---

## 20. Success Metrics

### Founder outcomes

- onboarding completion rate;
- W0 route completion;
- percentage reaching validated-idea or formation outcomes;
- time to complete major startup stages;
- blocked time;
- critical deadline completion;
- work completed through StartupKit;
- founder satisfaction.

### Product and operational metrics

- workflow completion rate;
- document approval and signature rate;
- integration completion rate;
- provider failure rate;
- support intervention rate;
- existing work correctly reused or skipped.

### Technical metrics

- workflow recovery rate;
- background-job recovery rate;
- duplicate provider-action rate;
- webhook success rate;
- dashboard response time;
- AI cost per company;
- time required to add a new provider adapter.

---

## 21. Open Decisions

- Primary database and event-storage approach
- Durable workflow technology
- Background queue and worker technology
- File and document storage
- Authentication provider
- Initial formation, e-sign, banking, payment, and payroll providers
- AI model and fallback strategy
- Full-text or vector retrieval approach
- Supported jurisdictions and entity paths
- Actions requiring specialist review
- Detailed MVP timeline

---

## 22. MVP Definition of Done

The MVP is complete when a founder can:

1. Create a company workspace.
2. Complete W0 stage assessment.
3. Receive an appropriate route.
4. See W0 and W1–W8 represented in the startup journey.
5. Understand which workflows are relevant, blocked, active, waiting, or complete.
6. Begin one supported W1 formation path.
7. Complete focused step-by-step screens.
8. Review and approve a generated document.
9. Send the approved document through an integrated provider.
10. Receive an asynchronous provider result.
11. Track provider status for work handled through integrations.
12. Use a manual completion path when an integration is not yet available.
13. Store provider or founder-supplied evidence.
14. Update the Company Object.
15. Unlock the appropriate next action or workflow.
16. See the updated journey state on the dashboard.
17. Track founder actions, provider work, blockers, and evidence across W2–W8.
18. Resume the process after a backend or worker interruption.
19. Complete the process without duplicate external actions.
20. Access only data belonging to the correct tenant.


---

## 23. Detailed Product Flow: From Workspace Creation to Ongoing Startup Execution

This section explains how a founder moves through StartupKit and how the reusable core platform supports each step.

### 23.1 Workspace creation

The founder creates an account and a company workspace.

The system must:

- create the tenant and company workspace;
- connect the founder to the workspace with the correct role;
- create the initial Company Object;
- create the onboarding state;
- create an audit record;
- attach tenant and company context to all future work.

**Core used**

- **Tenancy:** isolates the company’s data.
- **Security and RBAC:** controls access.
- **Company Object:** creates the initial company record.
- **Audit:** records who created the workspace and when.
- **Observability:** assigns correlation and trace identifiers.

**Data created**

- tenant;
- user;
- membership;
- company workspace;
- initial company state;
- onboarding session;
- audit event.

### 23.2 Entry path selection

The founder selects one of two primary paths:

1. I am starting from an idea.
2. I already have a company.

A new founder enters stage assessment, validation, and planning.

An existing-company founder enters company-data collection, document upload, and gap assessment.

**Core used**

- **Workflow Orchestration:** starts the correct W0 route.
- **Product Configuration:** selects the relevant workflow variation.
- **Task System:** creates the first founder action.
- **Company Object:** records the selected path.

### 23.3 W0 stage assessment

StartupKit asks focused questions about:

- current startup stage;
- whether a company already exists;
- customer validation;
- product status;
- founder count;
- legal and financial setup;
- website and technical setup;
- current goal.

The UI must ask questions step by step and allow save and resume.

**Core used**

- **Workflow Orchestration:** controls question order and branching.
- **Task System:** represents founder actions.
- **Company Object:** stores confirmed stage information.
- **Approvals/Confirmation:** records the founder’s route confirmation.
- **Audit:** records important stage decisions.

**Result**

- current stage;
- recommended route;
- relevant workflows;
- first blockers;
- first required outcome;
- personalized journey plan.

### 23.4 Existing-company intake and audit

If the founder already has a company, StartupKit allows them to:

- enter company details;
- upload formation, tax, legal, banking, and operational documents;
- connect available providers;
- confirm which systems already exist.

Extracted facts must remain unverified until the founder reviews them.

**Core used**

- **Documents:** stores source files and versions.
- **Document Intelligence:** extracts candidate facts.
- **Company Object:** stores facts as extracted or awaiting review.
- **Task System:** creates verification tasks.
- **Approvals:** records founder confirmation.
- **Evidence:** links verified facts to source documents.
- **Workflow Orchestration:** skips or marks complete proven outcomes.

**Result**

- completed outcomes;
- missing outcomes;
- outdated or risky items;
- recommended corrective work;
- the correct place to continue in W1–W8.

### 23.5 Journey plan creation

After W0, StartupKit creates the founder’s journey plan.

The plan must show:

- current stage;
- relevant workflows;
- active outcomes;
- blocked outcomes;
- provider-dependent work;
- founder-dependent work;
- future stages.

It should show meaningful outcomes rather than every internal step.

Examples:

- Validate customer problem
- Form company
- Complete founder legal documents
- Open business bank account
- Set up website
- Prepare launch
- Start payroll

**Core used**

- **Company Object:** provides verified state.
- **Workflow Orchestration:** determines active and eligible workflows.
- **Read Models/Projections:** creates founder-friendly journey views.
- **Task System:** identifies the next action.
- **Compliance:** adds urgent obligations and deadlines.

### 23.6 Outcome activation

When an outcome becomes relevant, the workflow engine activates the required workflow or workflow segment.

Examples:

- formation readiness activates W1;
- verified EIN unlocks banking in W3;
- approved ICP and positioning unlock GTM work in W7;
- bank readiness unlocks payroll in W6.

**Core used**

- **Workflow Orchestration:** starts, pauses, and resumes workflows.
- **Company Events:** represent confirmed changes.
- **Trigger Bus/Outbox:** reliably informs dependent workflows.
- **Company Object:** updates current status.
- **Read Models:** updates journey and dashboard views.

### 23.7 Founder information collection

Each workflow asks only for information needed for the current step.

Previously verified information must be reused.

**Core used**

- **Task System:** creates the information task.
- **Company Object:** provides prefilled facts.
- **Validation Rules:** checks completeness and format.
- **Security:** protects sensitive information.
- **Workflow Orchestration:** decides the next step.

### 23.8 Work-item creation and execution

When work is required, StartupKit creates a work item.

It may be completed by:

- founder;
- platform automation;
- AI;
- integrated provider;
- specialist or reviewer;
- a combination of these.

The work item must show:

- required outcome;
- responsible party;
- current status;
- required inputs;
- due date;
- blocker;
- expected evidence.

**Core used**

- **Task/Work Management:** owns the work lifecycle.
- **Workflow Orchestration:** creates the work and waits for completion.
- **Approvals:** controls sensitive transitions.
- **Audit:** records assignment and status changes.
- **Notifications:** informs the responsible person.

### 23.9 Document preparation and review

When a document is needed, StartupKit must:

1. identify the document type;
2. collect verified company facts;
3. select an approved template or source;
4. generate or populate a draft;
5. run deterministic checks;
6. request review where needed;
7. present the draft to the founder;
8. allow approval or changes;
9. preserve every version.

**Core used**

- **Document Intelligence:** prepares and validates drafts.
- **Documents:** manages lifecycle, versions, and access.
- **Approvals:** records the decision on the exact version.
- **Company Object:** supplies verified company facts.
- **Audit:** records generation, review, and approval.
- **AI Services:** assist with drafting where appropriate.

### 23.10 Provider execution

After approval, StartupKit may send work to an integrated provider.

The workflow requests a capability from the integration runtime rather than calling a provider directly.

**Core used**

- **Integration Runtime:** creates and tracks the provider operation.
- **Provider Registry:** selects the adapter.
- **Adapter:** translates the internal request into the provider API.
- **Idempotency:** prevents duplicate external actions.
- **Background Worker:** performs the provider call.
- **Audit and Observability:** record the operation.

**Flow**

1. Workflow requests a capability.
2. Integration run is created.
3. Provider is selected.
4. Background worker calls the provider.
5. Provider returns immediate, pending, or failed status.
6. StartupKit updates the work item.
7. Founder sees the provider state.

### 23.11 Waiting, webhook, and reconciliation

Provider work may enter states such as:

- submitted;
- waiting for provider;
- waiting for founder KYC;
- additional information requested;
- under review;
- completed;
- failed.

Completion may arrive through:

- webhook;
- polling;
- manual confirmation;
- uploaded evidence.

**Core used**

- **Workflow Orchestration:** waits without losing state.
- **Integration Runtime:** reconciles provider status.
- **Webhook Ingress:** receives callbacks.
- **Background Workers:** process callbacks and polling.
- **Retry and Dead-Letter Handling:** recover failures.
- **Notifications:** alert the founder when action is needed.

### 23.12 Evidence capture and verification

A work item should not be marked complete only because a checkbox was selected.

Where appropriate, the system must capture:

- signed document;
- filing certificate;
- EIN confirmation;
- bank approval;
- provider receipt;
- domain ownership;
- website publication;
- payroll activation.

**Core used**

- **Documents/Evidence:** stores proof and metadata.
- **Approvals or Verification:** confirms evidence where needed.
- **Company Object:** links completion to evidence.
- **Audit:** records who confirmed completion.

### 23.13 Company Object update

After completion is verified, the system updates authoritative company state.

Examples:

- `entity_status = formed`
- `ein_status = verified`
- `bank_status = active`
- `website_status = live`

Important changes must create domain events.

**Core used**

- **Company Object:** stores current verified state.
- **Domain Events:** record what happened.
- **Event Store:** preserves history.
- **Outbox/Trigger Bus:** informs dependent workflows.
- **Read Models:** updates founder-facing views.

### 23.14 Next-action and workflow unlocking

After Company Object changes, StartupKit determines what becomes available next.

Examples:

- entity formed → W2 legal setup can continue;
- EIN verified → W3 banking can proceed;
- bank active → W6 payroll can proceed;
- positioning approved → W7 GTM can proceed.

**Core used**

- **Workflow Orchestration:** evaluates dependencies.
- **Trigger Bus:** sends reliable triggers.
- **Task System:** creates the next action.
- **Read Models:** refreshes Home and Journey.
- **Notifications:** informs the founder.

### 23.15 Ongoing tracking across W1–W8

Even where work is mostly completed through integrations, StartupKit must track:

- relevance;
- status;
- responsible party;
- founder action;
- provider progress;
- blockers;
- evidence;
- completion;
- next dependency.

This applies to W1–W8.

The MVP may automate only part of these workflows, but all must be visible and trackable.

### 23.16 Manual fallback

When no integration is available, StartupKit must:

1. explain the required outcome;
2. provide clear instructions;
3. track responsibility;
4. allow evidence upload;
5. review or verify evidence;
6. update the Company Object;
7. continue the journey.

Manual fallback is a supported execution mode.

### 23.17 Ongoing company operation

After initial setup, StartupKit continues to support:

- recurring compliance;
- new hires;
- new legal documents;
- provider changes;
- website and brand updates;
- GTM campaigns;
- infrastructure changes;
- fundraising readiness.

The founder journey continues beyond formation.

---

## 24. How the Core Is Used Across the Product

| Core capability | Responsibility |
|---|---|
| Company Object | Stores authoritative company state |
| Workflow Orchestration | Controls what happens, waits, branches, and resumes |
| Tasks and Work | Tracks founder, provider, platform, and specialist work |
| Approvals | Protects sensitive and irreversible actions |
| Documents | Stores versions, signed files, and evidence |
| Document Intelligence | Extracts, prepares, and validates content |
| Integration Runtime | Coordinates provider execution and status |
| Provider Adapters | Translate StartupKit requests to provider APIs |
| Compliance | Calculates obligations, deadlines, and escalation |
| Tenancy | Keeps company data isolated |
| Security | Protects sensitive information and permissions |
| Audit | Records who did what and when |
| Observability | Monitors APIs, workers, workflows, providers, and AI |
| Read Models | Creates fast founder-facing views |
| Notifications | Informs users about actions, waiting states, and outcomes |

---

## 25. Basic Requirements Before Core Development Starts

### 25.1 Confirm the first vertical slice

Choose one complete outcome to build first.

Recommended slice:

1. create workspace;
2. start W0 or a simple W1 path;
3. create a founder task;
4. collect company information;
5. generate one document;
6. approve the document;
7. create one integration run;
8. receive provider completion;
9. store evidence;
10. update Company Object;
11. unlock the next action.

This should become the reference implementation for the core.

### 25.2 Confirm domain language

Agree on consistent meanings for:

- tenant;
- company;
- founder;
- Company Object;
- workflow;
- workflow run;
- step;
- task;
- work item;
- approval;
- document;
- document version;
- evidence;
- integration run;
- provider;
- adapter;
- event;
- projection;
- blocker.

Document these terms in a domain glossary.

### 25.3 Define state lifecycles

Define valid states and transitions for:

- workflows;
- steps;
- tasks;
- work items;
- approvals;
- documents;
- integrations;
- evidence.

Example:

`draft → awaiting_review → approved → sent_for_signature → signed`

### 25.4 Define first commands and events

Initial commands may include:

- CreateWorkspace
- SubmitCompanyInformation
- ApproveDocument
- StartIntegration
- ConfirmIntegrationCompletion

Initial events may include:

- WorkspaceCreated
- CompanyInformationSubmitted
- DocumentApproved
- IntegrationStarted
- EvidenceStored
- CompanyOutcomeCompleted

### 25.5 Define ownership boundaries

Decide which module owns each concept.

Examples:

- Company Object owns verified company state.
- Documents owns document versions.
- Approvals owns approval decisions.
- Integration Runtime owns provider operations.
- Workflow Orchestration owns execution.
- Tasks/Work owns responsibility and progress.

### 25.6 Define the initial data model

After flow, states, commands, and ownership are clear, define the first data model.

Likely entities:

- tenants;
- users;
- memberships;
- companies;
- company facts;
- workflow definitions;
- workflow runs;
- step runs;
- tasks;
- work items;
- approvals;
- documents;
- document versions;
- evidence;
- provider connections;
- integration runs;
- domain events;
- outbox events;
- audit events.

Model only what the first vertical slice requires.

### 25.7 Select initial technology decisions

Create short architecture decisions for:

- primary database;
- workflow engine;
- background queue and workers;
- file storage;
- authentication;
- event and outbox approach;
- first provider integration;
- deployment environment;
- observability tools.

### 25.8 Define security and tenancy rules

Before storing real data, define:

- tenant isolation;
- roles and permissions;
- sensitive fields;
- encryption;
- provider-secret storage;
- webhook verification;
- audit requirements;
- AI data-sharing limits.

### 25.9 Define API and application boundaries

Agree that:

- FastAPI is the API layer;
- business rules live in application and domain services;
- provider-specific code lives in adapters;
- long-running work runs in workers or workflow orchestration;
- core logic must be testable without starting the API server.

### 25.10 Define testable acceptance criteria

The first slice must prove:

- workflow survives restart;
- duplicate provider calls are prevented;
- founder progress is saved;
- approval is tied to a document version;
- provider status is trackable;
- evidence is stored;
- Company Object updates correctly;
- next work unlocks;
- tenant data remains isolated;
- critical actions are auditable.

### 25.11 Prepare provider sandbox access

Before a real integration, obtain:

- sandbox account;
- API credentials;
- webhook documentation;
- test data;
- status definitions;
- rate limits;
- error codes;
- receipt or evidence examples.

If unavailable, start with a fake adapter using the same contract.

### 25.12 Confirm initial UI contracts

Define founder-facing read models for:

- Home;
- Journey;
- Current Step;
- Work;
- Document Review;
- Provider Status.

The API should return founder-friendly views rather than the internal workflow graph.

---



