# StartupKit — Success Metrics Document

**Phase:** 3 — Product Vision and Success Definition  
**Version:** 1.0 Draft  
**Initial market:** United States  
**Audience:** Product, Engineering, Design, Operations, Research, Growth, and Stakeholders

---

## 1. Purpose

This document defines how StartupKit will measure whether it is solving the founder problem and creating successful company outcomes.

The metrics are grouped into:

- North Star metric;
- founder outcome metrics;
- acquisition and activation;
- engagement and progression;
- workflow and provider execution;
- quality and trust;
- retention and business;
- technical reliability;
- operational efficiency;
- guardrail metrics.

The initial targets are hypotheses and should be finalized after baseline data and pilot testing are available.

---

## 2. Measurement Principles

### Measure outcomes, not only activity

Completing a company outcome matters more than opening a page or checking a task.

### Separate founder delay from platform delay

The system should distinguish:

- founder waiting time;
- provider waiting time;
- specialist waiting time;
- platform processing time.

### Measure the complete journey

Formation alone is not sufficient. StartupKit should measure progress from W0 through W8.

### Preserve metric definitions

Every metric should have:

- a clear formula;
- an owner;
- a source of truth;
- a reporting frequency;
- defined exclusions.

### Use guardrails

Growth should not come at the cost of incorrect legal work, duplicated provider actions, data exposure, or poor founder outcomes.

---

## 3. North Star Metric

## Verified Startup Outcomes Completed

**Definition:** The number of meaningful startup outcomes completed and supported by the required verification or evidence.

Examples:

- problem validation completed;
- MVP plan approved;
- entity formed;
- EIN verified;
- founder IP agreement signed;
- bank account activated;
- payment provider activated;
- website published;
- payroll activated;
- launch readiness completed.

**Formula**

```text
Count of qualifying outcomes that reached verified completion
```

**Why this metric**

It reflects StartupKit’s central value: helping founders build and operate a company, not merely providing information or generating tasks.

**Important limitation**

The metric must not be increased through trivial tasks. Only approved outcome types should count.

---

## 4. Primary Product Success Metrics

| Metric | Definition | Why It Matters | Initial Direction |
|---|---|---|---|
| W0 Completion Rate | Percentage of started W0 assessments completed | Measures onboarding value | Increase |
| Journey Plan Creation Rate | Percentage of qualified workspaces receiving a plan | Shows successful routing | Increase |
| Time to First Verified Outcome | Time from workspace creation to first verified outcome | Measures early value | Decrease |
| Stage Progression Rate | Percentage moving from one stage to the next | Measures journey effectiveness | Increase |
| Workflow Completion Rate | Percentage of activated workflows completed | Measures execution | Increase |
| Founder-Blocked Time | Time work waits for founder action | Identifies UX or communication friction | Decrease |
| Provider-Blocked Time | Time work waits on an external provider | Identifies integration bottlenecks | Decrease |
| Evidence Completion Rate | Percentage of qualifying outcomes with valid evidence | Measures trustworthy completion | Increase |
| Existing Work Reuse Rate | Percentage of verified existing outcomes not repeated | Measures Company Object value | Increase |
| Founder Satisfaction | Stage or outcome satisfaction score | Measures perceived value | Increase |

---

## 5. Acquisition Metrics

### 5.1 Assessment Start Rate

**Definition:** Percentage of qualified visitors who begin the W0 assessment.

```text
Assessment starts ÷ qualified landing-page visitors
```

### 5.2 Workspace Creation Rate

**Definition:** Percentage of assessment starters who create a workspace.

```text
New workspaces ÷ assessment starters
```

### 5.3 Qualified Founder Rate

**Definition:** Percentage of new workspaces matching the target market and supported paths.

### 5.4 Acquisition Source Quality

Measure workspace creation, activation, and paid conversion by:

- organic search;
- founder communities;
- accelerators;
- referrals;
- partners;
- paid acquisition;
- content;
- events.

### 5.5 Cost per Qualified Founder

```text
Acquisition spend ÷ qualified founders acquired
```

---

## 6. Activation Metrics

A founder is activated when they receive meaningful product value, not only when they create an account.

### Recommended Activation Definition

A founder is activated when they:

1. create a workspace;
2. complete W0 or existing-company intake;
3. receive and confirm a journey route;
4. start the first meaningful workflow or outcome.

### Activation Metrics

| Metric | Definition |
|---|---|
| Onboarding Completion Rate | Completed onboarding ÷ started onboarding |
| Route Confirmation Rate | Confirmed route ÷ generated route |
| First Workflow Start Rate | Workspaces starting first workflow ÷ eligible workspaces |
| First Outcome Completion Rate | Workspaces completing first verified outcome ÷ activated workspaces |
| Median Time to Activation | Median time from workspace creation to activation |

---

## 7. Journey and Engagement Metrics

### 7.1 Current-Step Completion Rate

```text
Completed current steps ÷ current steps started
```

Measure by:

- step type;
- workflow;
- persona;
- device;
- provider.

### 7.2 Step Abandonment Rate

Percentage of founders who leave a step and do not return within the defined period.

### 7.3 Save-and-Resume Rate

Percentage of founders who successfully continue after leaving a workflow.

### 7.4 Stage Progression Rate

Measure transitions such as:

- Discover → Validate
- Validate → Plan
- Plan → Establish
- Establish → Build
- Build → Launch
- Launch → Operate
- Operate → Grow

### 7.5 Journey Coverage

Percentage of relevant W0–W8 workflows with a known status.

### 7.6 Next-Action Engagement

Percentage of founders who begin the recommended next action within a defined period.

---

## 8. Workflow Success Metrics

### 8.1 Workflow Completion Rate

```text
Completed workflow runs ÷ activated workflow runs
```

Report separately for W0–W8.

### 8.2 Workflow Cycle Time

Time from workflow activation to verified completion.

Separate into:

- active founder time;
- provider waiting;
- specialist waiting;
- platform processing;
- blocked time.

### 8.3 Blocker Rate

Percentage of workflow runs that enter a blocked state.

### 8.4 Recovery Rate

Percentage of blocked or failed workflows that later complete.

### 8.5 Manual Fallback Rate

Percentage of outcomes completed manually because an integration was unavailable or unsuccessful.

A high value may indicate insufficient integration coverage, but manual fallback is not automatically a failure.

### 8.6 Cross-Workflow Unlock Accuracy

Percentage of downstream workflows unlocked correctly after prerequisite events.

---

## 9. Provider and Integration Metrics

### 9.1 Integration Completion Rate

```text
Successful integration runs ÷ total completed integration runs
```

### 9.2 Provider Failure Rate

Percentage of provider runs ending in a non-recoverable failure.

### 9.3 Retry Success Rate

Percentage of retryable failures recovered successfully.

### 9.4 Duplicate External Action Rate

Percentage of provider actions executed more than once incorrectly.

**Target direction:** As close to zero as possible.

### 9.5 Webhook Processing Success

Percentage of valid provider webhooks processed successfully.

### 9.6 Provider Response Time

Time between request submission and first provider response.

### 9.7 Provider Completion Time

Time between request submission and completed outcome.

### 9.8 Additional-Information Rate

Percentage of provider runs requiring extra founder information.

### 9.9 Evidence Retrieval Rate

Percentage of successful provider outcomes for which StartupKit obtains completion evidence.

---

## 10. Document and Approval Metrics

### 10.1 Document Generation Success Rate

Percentage of document-generation requests producing a valid draft.

### 10.2 Document Revision Rate

Average number of revisions before approval.

### 10.3 Approval Completion Rate

```text
Completed approvals ÷ approval requests
```

### 10.4 Median Approval Time

Time between approval request and founder decision.

### 10.5 Outdated-Version Approval Attempts

Count of attempts to approve superseded document versions.

### 10.6 Signature Completion Rate

Percentage of documents sent for signature that become fully signed.

### 10.7 Evidence Attachment Rate

Percentage of completed document outcomes linked to signed or final evidence.

---

## 11. Company Object Metrics

### 11.1 Verified Fact Rate

Percentage of active company facts that are approved or provider-verified.

### 11.2 Fact Reuse Rate

Number of workflow inputs populated from existing verified facts rather than requested again.

### 11.3 Duplicate Question Reduction

Percentage reduction in repeated founder questions.

### 11.4 Fact Conflict Rate

Percentage of incoming facts conflicting with existing verified facts.

### 11.5 Conflict Resolution Time

Time required to resolve a company-fact conflict.

### 11.6 Stale Fact Rate

Percentage of company facts requiring re-verification based on policy or age.

---

## 12. Existing-Company Metrics

### 12.1 Existing-Company Intake Completion

Percentage of existing-company founders completing intake and audit.

### 12.2 Extraction Verification Rate

Percentage of extracted facts approved, corrected, or rejected by the founder.

### 12.3 Existing Work Reuse Rate

```text
Verified outcomes reused ÷ outcomes assessed
```

### 12.4 Gap Identification Rate

Average number of relevant missing or risky outcomes identified per assessed company.

### 12.5 Remediation Completion Rate

Percentage of prioritized gaps resolved.

### 12.6 Time to Trusted Company State

Time from intake start until the Company Object reaches the required verification threshold.

---

## 13. Founder Experience Metrics

### 13.1 Founder Satisfaction

Collect satisfaction after:

- W0;
- first verified outcome;
- formation;
- provider completion;
- launch readiness;
- support interaction.

### 13.2 Customer Effort Score

Measure how easy founders found it to complete an important outcome.

### 13.3 Recommendation Confidence

Ask whether the founder understood and trusted the recommended route.

### 13.4 Status Clarity

Measure whether founders understood:

- who was responsible;
- what was happening;
- whether they needed to act;
- what would happen next.

### 13.5 Support Contact Rate

Number of support contacts per active company or workflow.

A falling rate is positive only if outcome completion and satisfaction remain healthy.

### 13.6 Founder Error Rate

Percentage of steps requiring correction because instructions or validation were unclear.

---

## 14. Retention Metrics

### 14.1 Post-Formation Retention

Percentage of formed companies active after:

- 30 days;
- 90 days;
- 180 days;
- 12 months.

### 14.2 Multi-Workflow Adoption

Percentage of companies using more than one of W1–W8.

### 14.3 Recurring Workflow Usage

Companies using compliance, finance, people, or operations workflows repeatedly.

### 14.4 Monthly Active Companies

Count of company workspaces completing a meaningful action or outcome during the month.

### 14.5 Company Continuation Rate

Percentage of companies progressing into a later stage after completing an earlier one.

---

## 15. Business Metrics

### 15.1 Free-to-Paid Conversion

```text
Paid workspaces ÷ eligible activated workspaces
```

### 15.2 Conversion by Segment

Measure separately for:

- first-time founders;
- technical founders;
- non-technical founders;
- existing companies;
- international founders.

### 15.3 Revenue per Activated Company

Total recognized revenue divided by activated companies.

### 15.4 Setup Revenue

Revenue from initial company-creation workflows.

### 15.5 Recurring Revenue

Subscription or recurring operational revenue.

### 15.6 Gross Margin by Workflow

Revenue minus provider, specialist, and processing cost for each workflow.

### 15.7 Customer Acquisition Cost

Acquisition and sales cost divided by new paying customers.

### 15.8 Payback Period

Time required for gross profit to recover acquisition cost.

### 15.9 Retention and Expansion Revenue

Track subscription retention and additional workflow purchases.

---

## 16. Operational Metrics

### 16.1 Specialist Review Time

Time between work assignment and review completion.

### 16.2 Work Reassignment Rate

Percentage of work items reassigned due to capacity, permissions, or skill mismatch.

### 16.3 Service-Level Compliance

Percentage of work completed within the defined service target.

### 16.4 Manual Intervention Rate

Percentage of workflows requiring internal operational intervention.

### 16.5 Support Resolution Time

Time from support request to resolution.

### 16.6 Cost per Verified Outcome

```text
Platform + provider + specialist cost ÷ verified outcomes
```

---

## 17. Technical Reliability Metrics

### 17.1 API Availability

Availability of founder-facing and provider-facing APIs.

### 17.2 API Error Rate

Percentage of requests ending in server or unhandled errors.

### 17.3 Read-Model Latency

Time required to load Home, Journey, Work, and Current Step views.

### 17.4 Workflow Recovery Rate

Percentage of interrupted workflows that resume successfully.

### 17.5 Background Job Success Rate

Percentage of jobs completed successfully after permitted retries.

### 17.6 Queue Delay

Time jobs wait before processing begins.

### 17.7 Event Delivery Reliability

Percentage of outbox events successfully delivered and processed.

### 17.8 Audit Coverage

Percentage of defined critical actions recorded in the audit trail.

### 17.9 Tenant Isolation Incidents

Count of confirmed cross-tenant data-access incidents.

**Target:** Zero.

### 17.10 Provider Secret Exposure

Count of provider credentials exposed in logs, errors, or user responses.

**Target:** Zero.

---

## 18. AI and Document Intelligence Metrics

### 18.1 Structured Output Validity

Percentage of AI outputs matching the required schema.

### 18.2 Extraction Accuracy

Accuracy of facts extracted from supported documents.

### 18.3 Founder Correction Rate

Percentage of extracted or generated information corrected by founders.

### 18.4 Specialist Revision Rate

Percentage of AI-generated documents requiring material specialist revision.

### 18.5 AI Failure Rate

Percentage of AI requests failing after retries or fallbacks.

### 18.6 AI Cost per Company

Total AI processing cost divided by active companies.

### 18.7 AI Cost per Verified Outcome

Total AI processing cost divided by AI-assisted verified outcomes.

### 18.8 Provenance Coverage

Percentage of high-risk AI outputs linked to the required source or context.

---

## 19. Guardrail Metrics

StartupKit should not improve conversion or speed by reducing safety or quality.

Guardrails include:

- incorrect company-state updates;
- invalid legal-document completion;
- missing founder approval;
- duplicate provider actions;
- evidence missing from qualifying outcomes;
- unresolved fact conflicts;
- cross-tenant access;
- sensitive data sent to unauthorized AI providers;
- missed critical compliance deadlines;
- provider failures hidden from founders;
- excessive support burden;
- high refund or complaint rates.

---

## 20. MVP Metric Set

The MVP should initially focus on a smaller metric set.

### North Star

- Verified Startup Outcomes Completed

### Activation

- W0 completion rate
- journey-plan creation rate
- first workflow start rate
- time to first verified outcome

### Execution

- W1 completion rate
- integration completion rate
- provider waiting time
- evidence completion rate
- workflow recovery rate
- duplicate provider-action rate

### Experience

- current-step completion rate
- founder-blocked time
- route confidence
- founder satisfaction

### Cross-Workflow

- percentage of W2–W8 outcomes with known status
- next-action accuracy
- manual-fallback completion rate

### Safety

- approval coverage
- audit coverage
- tenant isolation incidents
- incorrect Company Object updates

---

## 21. Metric Ownership

| Metric Area | Suggested Owner |
|---|---|
| Acquisition and conversion | Growth/Product |
| Activation and journey | Product |
| Workflow completion | Product/Operations |
| Provider performance | Integrations/Operations |
| Documents and approvals | Product/Legal Operations |
| Company Object quality | Core Platform |
| Technical reliability | Engineering/SRE |
| AI quality and cost | AI Platform |
| Security guardrails | Security |
| Revenue and margin | Finance/Business |

---

## 22. Reporting Cadence

### Real-Time or Daily

- system availability;
- workflow failures;
- provider failures;
- queue health;
- webhook errors;
- security incidents.

### Weekly

- onboarding;
- activation;
- current-step completion;
- workflow progression;
- blockers;
- support volume.

### Monthly

- North Star metric;
- retention;
- business metrics;
- provider comparison;
- operational efficiency;
- AI cost;
- persona and segment performance.

### Quarterly

- strategic stage progression;
- pricing performance;
- market-segment quality;
- workflow expansion decisions;
- product-vision alignment.

---

## 23. Initial Target-Setting Process

The team should not invent final targets before baseline data exists.

Recommended process:

1. instrument the MVP;
2. run internal and concierge tests;
3. establish a baseline;
4. identify the largest funnel losses;
5. set targets for the next release cycle;
6. review quality and safety guardrails;
7. update targets quarterly.

---

## 24. Instrumentation Requirements

The product must record enough information to calculate metrics without exposing sensitive content unnecessarily.

Required tracking includes:

- tenant and company identifiers;
- persona or segment where known;
- workflow and step identifiers;
- activation and completion timestamps;
- responsibility and waiting reason;
- provider and adapter identifiers;
- retry and failure category;
- evidence status;
- approval status;
- company-event type;
- read-model load performance;
- support and manual-intervention markers;
- AI model, cost, latency, and output validity.

Metrics should use pseudonymous identifiers where possible.

---

## 25. Success Definition

StartupKit is successful when founders consistently progress through the startup journey, complete verified company outcomes faster and with less coordination effort, continue using the product beyond formation, and do so without compromising legal quality, data security, or founder control.
