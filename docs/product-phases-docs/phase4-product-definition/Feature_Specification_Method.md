# StartupKit — Feature Specification Method

**Phase:** 4 — Feature Definition  
**Version:** 1.0 Draft  
**Audience:** Product, Design, Engineering, QA, Operations, and Stakeholders

---

## 1. Purpose

This document defines the standard method used to specify StartupKit features before they enter implementation.

The goal is to ensure that every feature:

- solves a validated user problem;
- is connected to a product outcome;
- has a clear owner and scope;
- includes testable acceptance criteria;
- identifies dependencies and risks;
- is traceable to the PRD and MVP;
- can be implemented without ambiguity.

---

## 2. Feature Specification Hierarchy

StartupKit uses the following hierarchy:

```text
Product Goal
→ Product Pillar
→ Epic
→ Feature
→ User Story
→ Acceptance Criteria
→ Engineering Tasks
→ Tests
```

### Product Goal

A measurable product outcome.

Example:

> Help founders complete verified startup outcomes with less coordination effort.

### Product Pillar

A major capability area.

Examples:

- Guided Startup Journey
- Company Object
- Workflow Execution
- Documents and Approvals
- Provider Integrations
- Compliance and Evidence

### Epic

A large feature area that may contain multiple stories.

Example:

> E3 — Orchestration Engine

### Feature

A specific capability inside an epic.

Example:

> Pause a workflow for founder approval and resume it after approval.

### User Story

A testable user need written from one role’s perspective.

### Acceptance Criteria

Observable conditions that must be true for the story to be complete.

### Engineering Tasks

Implementation work derived from approved stories.

### Tests

Unit, integration, conformance, replay, security, and end-to-end checks.

---

## 3. Required Feature Specification Template

Every feature must use the following structure.

## Feature: `[FEATURE-ID] — Feature Name`

### Summary

A short description of what the feature does.

### User Problem

The specific problem this feature solves.

### Product Outcome

The measurable result the feature should create.

### Primary User

One primary role:

- Founder
- Co-Founder
- Operator
- Specialist
- Administrator
- Engineer
- System

### Scope

**In scope**

- Included behavior
- Supported paths
- Supported users

**Out of scope**

- Deferred behavior
- Unsupported cases
- Later-phase capabilities

### User Story

**As a** [role],  
**I want to** [action],  
**So that** [outcome].

### Acceptance Criteria

1. Specific testable behavior
2. Specific testable behavior
3. Specific testable behavior

### Validations

- Required fields
- Business-rule checks
- Permission checks
- State-transition checks
- Data-integrity checks

### Dependencies

- Other epics or stories
- External providers
- Company Object facts
- Workflow events
- Technical infrastructure

### Error States

List user-visible and system error cases.

### Ripple Effects

Describe what changes elsewhere when the feature succeeds.

### Data Created or Updated

List the domain objects, events, and read models affected.

### Security and Privacy

Describe:

- required permissions;
- sensitive data involved;
- tenant-isolation expectations;
- audit requirements.

### Analytics

List the events and metrics required.

### Risks

Link relevant risk-register IDs.

### Definition of Done

The feature is complete only when:

- acceptance criteria pass;
- required tests pass;
- audit and telemetry are present;
- documentation is updated;
- security requirements are satisfied;
- no unresolved blocking risk remains.

---

## 4. User Story Method

### Standard Format

```markdown
### User Story: [CODE-001] — [Title]

**As a** [role],

**I want to** [action],

**So that** [outcome].

**Acceptance Criteria:**

1. [Testable condition]
2. [Testable condition]
3. [Testable condition]

**Validations & Dependencies:**

- [Dependency]
- [Validation]

**Error Messages:**

- "[Exact error text]"

**Ripple Effects:**

- [Downstream impact]
```

### Good Story Characteristics

A good story is:

- focused on one outcome;
- independently testable;
- understandable without implementation details;
- linked to a user or system need;
- small enough to estimate;
- explicit about dependencies.

### Bad Story Characteristics

Avoid stories that:

- combine multiple unrelated roles;
- describe only a technical task;
- contain vague outcomes;
- have no acceptance criteria;
- include future-phase work;
- depend on undefined terminology.

---

## 5. Acceptance Criteria Method

Acceptance criteria must be:

- specific;
- observable;
- testable;
- limited to the story;
- written before implementation.

### Good Examples

- “The founder can save the current step and resume from the same step.”
- “An approval records the document version, approver, decision, and timestamp.”
- “A duplicate webhook does not create a second provider completion event.”
- “Tenant A cannot read Tenant B’s company facts.”

### Weak Examples

- “The page should be user friendly.”
- “The API should be fast.”
- “Errors should be handled properly.”
- “The workflow should work.”

### Acceptance Criteria Categories

Where relevant, criteria should cover:

1. Happy path
2. Permissions
3. Validation
4. Failure path
5. Retry or recovery
6. Audit
7. Analytics
8. Accessibility
9. Security
10. State transition

---

## 6. Feature Prioritization Method

Each feature must be assigned one priority.

### MVP

Required to prove the core product promise.

A feature is MVP only if its absence prevents the first end-to-end founder outcome or creates unacceptable risk.

### v1

Important for a usable first release but not required for the baseline proof.

### Later

Useful but not required for initial validation.

### Prioritization Questions

Before marking a feature MVP, ask:

1. Does it support the first vertical slice?
2. Does it prevent a high-impact legal, security, or reliability failure?
3. Is it required by another MVP feature?
4. Can the outcome be completed manually without it?
5. Does it prove a reusable platform capability?
6. Can it be deferred without breaking the founder journey?

---

## 7. Feature Sizing Method

Use relative sizes:

- **S** — small, limited scope, few dependencies
- **M** — multiple components or moderate integration
- **L** — cross-component, high-risk, or workflow-heavy

Size is not a time commitment. It is used for comparison and planning.

A feature should be split if:

- it contains more than one independent user outcome;
- it has unrelated acceptance criteria;
- it spans too many ownership boundaries;
- it cannot be completed within a reasonable delivery cycle.

---

## 8. Traceability Method

Every feature must link to:

- PRD section or requirement ID;
- product pillar;
- epic ID;
- user story ID;
- risk-register IDs;
- roadmap milestone;
- test cases;
- related architecture decision where applicable.

### Example

| Item | Reference |
|---|---|
| Product requirement | FR-P3 |
| Epic | E3 |
| User story | ORCH-004 |
| Risk | R6, R11 |
| Milestone | M1 |
| Test | `test_workflow_resume_after_restart` |

This traceability allows the team to understand why a feature exists and how it is verified.

---

## 9. Role-Based Organization

Feature specifications should be organized by user role and workflow outcome, not only by technical layer.

Recommended groups:

### Founder Features

- onboarding;
- stage assessment;
- current step;
- approvals;
- document review;
- provider tracking;
- journey progress.

### Co-Founder Features

- invitation;
- ownership confirmation;
- approvals;
- signatures.

### Operator and Specialist Features

- assigned work;
- requests for information;
- review;
- evidence;
- escalation.

### Platform Features

- Company Object;
- workflow orchestration;
- provider framework;
- document intelligence;
- compliance;
- security;
- audit;
- observability.

---

## 10. Cross-Feature Dependency Rules

A feature specification must explicitly state:

- what must exist before it can start;
- what event activates it;
- what data it requires;
- what downstream work it unlocks;
- what happens if the dependency fails.

Examples:

- `entity.formed` unlocks W2 legal setup.
- `ein.received` unlocks banking in W3.
- bank activation may unlock payroll in W6.
- approved positioning may unlock GTM work in W7.

Cross-workflow triggers must be treated as product requirements, not hidden engineering details.

---

## 11. Error-State Requirements

Every feature must document relevant error states.

Error definitions should include:

- trigger;
- exact user-facing message where required;
- retry behavior;
- whether the workflow pauses;
- whether support is notified;
- whether the error is auditable;
- recovery action.

### Example

**Condition:** Provider times out

**User message:**  
“Your request was submitted, but the provider has not responded yet. No action is required from you.”

**System behavior:**

- retain the integration run;
- retry according to policy;
- prevent duplicate submission;
- keep workflow in waiting state;
- alert operations after the threshold.

---

## 12. Ripple-Effect Requirements

Every story must list downstream effects.

Possible ripple effects include:

- Company Object update;
- workflow resume;
- new task creation;
- provider call;
- notification;
- compliance deadline;
- read-model update;
- audit event;
- analytics event;
- downstream workflow unlock.

This prevents isolated feature delivery that breaks the broader journey.

---

## 13. Feature Review Process

A feature passes through these stages:

```text
Draft
→ Product Review
→ Design Review
→ Technical Review
→ Risk/Security Review
→ Approved for Delivery
→ Implemented
→ Verified
→ Released
```

### Product Review

Confirms:

- user problem;
- outcome;
- scope;
- priority;
- acceptance criteria.

### Design Review

Confirms:

- step-by-step experience;
- states;
- accessibility;
- error handling;
- mobile and responsive behavior where relevant.

### Technical Review

Confirms:

- ownership boundaries;
- data changes;
- dependencies;
- events;
- provider behavior;
- reliability.

### Risk and Security Review

Required when the feature involves:

- PII;
- legal or financial outputs;
- external provider mutations;
- deadlines;
- permissions;
- AI-generated high-risk content.

---

## 14. Feature Readiness Checklist

A feature is ready for implementation when:

- [ ] User problem is clear
- [ ] Product outcome is defined
- [ ] Primary role is identified
- [ ] In-scope and out-of-scope boundaries are written
- [ ] User story follows the standard format
- [ ] Acceptance criteria are testable
- [ ] Error states are documented
- [ ] Dependencies are identified
- [ ] Ripple effects are listed
- [ ] Data and events are identified
- [ ] Security and audit requirements are defined
- [ ] Analytics requirements are defined
- [ ] Risks are linked
- [ ] Designs are linked where needed
- [ ] Priority and size are assigned
- [ ] Product, design, and engineering approve the feature

---

## 15. Example Feature Specification

## Feature: `DOC-APPROVAL-001 — Approve Document Version`

### Summary

Allow a founder to approve the exact version of a generated document before signature or provider execution.

### User Problem

Founders need confidence that no outdated or unreviewed document is submitted.

### Product Outcome

A valid, version-specific approval safely unlocks the next workflow action.

### Primary User

Founder

### Scope

**In scope**

- view current document;
- approve current version;
- request changes;
- record decision;
- resume waiting workflow.

**Out of scope**

- editing document content;
- multi-party signature;
- legal advice.

### User Story

**As a** founder,  
**I want to** approve the exact document version I reviewed,  
**So that** no different version can be submitted without my consent.

### Acceptance Criteria

1. The current document version is visible.
2. Approval stores document ID and version ID.
3. Superseded versions cannot be approved.
4. Approval records user, timestamp, and decision.
5. Approval resumes the waiting workflow.
6. Requesting changes returns the document to review.
7. All decisions are audited.

### Dependencies

- document storage;
- workflow human-task step;
- identity and permissions;
- audit.

### Error Messages

- “This document has changed. Review the latest version.”
- “You do not have permission to approve this document.”
- “Approval could not be recorded. Please try again.”

### Ripple Effects

- creates `document.approved`;
- resumes workflow;
- may create an integration run;
- updates founder Work view.

### Risk Links

- R2
- R4

---

## 16. Relationship to Existing Documents

- `prd` defines what the product must achieve.
- `requirements` contains stable functional and non-functional requirement IDs.
- `epics-and-stories` contains the delivery backlog.
- this method defines how features and stories must be written.
- `roadmap` determines delivery phases.
- `risk-register` records risks.
- technical design documents define implementation details.
