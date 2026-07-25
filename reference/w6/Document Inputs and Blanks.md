# W6 — Document Inputs and Blanks

**Phase 3 · Onboarding & payroll**

All fill-in fields, placeholders, and signature/date blanks for the W6 Onboarding & payroll phase: **Onboarding pack** and **Benefits enrollment**. **Payroll setup** is a guided task only — not a fill-in template — and is documented separately in §3.

**Recurring placeholders used across multiple documents:**

- `[Company Name]` — Company legal name *(prefill: `company.name`)*
- `[Employee Name]` — New hire legal name
- `[Job Title]` / `[Role]` — Position title from signed offer
- `[Start Date]` — First day of employment
- `[Work State]` — U.S. state where the employee actually performs work (may differ from company HQ)
- `[Date]` — Signature / acknowledgment date

---

## Document index — Phase 3

| # | doc_key | Document | Type | Required |
| --- | --- | --- | --- | --- |
| 1 | `W6-onboarding-pack` | Onboarding pack | Template (founder + employee) | Yes |
| 2 | `W6-payroll-setup` | Payroll setup | **Guided task** (no template) | Yes |
| 3 | `W6-benefits-enrollment` | Benefits enrollment | Template | No |

---

## 1. Onboarding pack

A per-employee packet delivered through a personalized self-onboarding link. The founder adds the hire after the offer is signed; the employee completes tax elections, employment eligibility basics, direct deposit, emergency contact, and e-signs the legal document bundle.

**Catalog:** `W6-onboarding-pack`  
**Phase:** 3 · Onboarding & payroll  
**Actor:** StartupKit generates the link and documents; employee fills and signs; founder confirms receipt.

### 1A. Founder setup — employee roster (one row per hire)

| Field | Value / Blank |
| --- | --- |
| Employee legal name | `[Employee Name]` |
| Work email | `[Employee Email]` |
| Job title | `[Job Title]` |
| Start date | `[Start Date]` |
| Onboarding link | `https://startupkit.app/onboard/[company-slug]/[employee-slug]` *(auto-generated)* |
| Delivery mode | Email automatically / Copy link myself |
| Link status | Not generated / Ready to send / Link sent / Complete |

### 1B. Employee self-service — personal & payroll info

Collected through the onboarding link before payroll setup. These fields feed the employee's **payroll packet** shown in the Payroll setup guided task.

#### Home address

| Field | Value / Blank |
| --- | --- |
| Street address | `[Street Address]` |
| City | `[City]` |
| State | `[State]` |
| ZIP code | `[ZIP Code]` |

#### Work location & tax elections

| Field | Value / Blank |
| --- | --- |
| Work state (where employee actually works) | `[Work State]` |
| Federal W-4 — filing status | Single / Married filing jointly / Married filing separately / Head of household / Qualifying surviving spouse |
| Federal W-4 — multiple jobs or spouse works | Yes / No |
| Federal W-4 — dependents (Step 3 amount) | `$[_____________]` |
| Federal W-4 — other income | `$[_____________]` |
| Federal W-4 — deductions | `$[_____________]` |
| Federal W-4 — extra withholding | `$[_____________]` per pay period |
| State withholding form | `[State-specific form name]` — completed per `[Work State]` rules |
| Tax elections status | W-4 complete / Pending |

#### Employment eligibility (I-9 Section 1 basics)

| Field | Value / Blank |
| --- | --- |
| Citizenship / immigration status | U.S. citizen / Noncitizen national / Lawful permanent resident / Alien authorized to work |
| Expiration date (if applicable) | `[Date]` or N/A |
| I-9 status | I-9 basics complete / Pending |
| I-9 Section 2 (employer) | Completed within 3 business days of start — employer responsibility, not collected in self-service link |

#### Direct deposit

| Field | Value / Blank |
| --- | --- |
| Bank name | `[Bank Name]` |
| Routing number | `[Routing Number]` |
| Account number | `[Account Number]` |
| Account type | Checking / Savings |
| Deposit authorization | Direct deposit authorized / Pending |
| Bank details display (masked) | e.g. `[Bank Name]` checking ending `[last 4 digits]` |

#### Emergency contact

| Field | Value / Blank |
| --- | --- |
| Contact name | `[Emergency Contact Name]` |
| Relationship | `[Relationship]` |
| Phone number | `[Phone Number]` |

### 1C. Legal document bundle (e-sign via onboarding link)

Each document is auto-generated from the employee's name and role. All share the same signature block pattern.

| # | Document | Abbrev | Key inputs |
| --- | --- | --- | --- |
| 1 | Proprietary Information & Inventions Agreement | PIIA | `[Company Name]`, `[Employee Name]`, `[Job Title]` |
| 2 | Non-Disclosure Agreement | NDA | `[Company Name]`, `[Employee Name]`, `[Job Title]` |
| 3 | Intellectual Property Assignment Agreement | IPA | `[Company Name]`, `[Employee Name]`, `[Job Title]` |
| 4 | At-Will Employment Agreement | At-Will | `[Company Name]`, `[Employee Name]`, `[Job Title]` |
| 5 | Employee Handbook Acknowledgment | Handbook | `[Company Name]`, `[Employee Name]`, `[Job Title]` |
| 6 | Mutual Arbitration Agreement | Arbitration | `[Company Name]`, `[Employee Name]`, `[Job Title]` |

#### Signature block (all legal documents)

| Field | Value / Blank |
| --- | --- |
| Employee signature | _____________________ |
| Employee printed name | `[Employee Name]` |
| Date | `[Date]` |
| Document status | Awaiting signature / Signed |

### 1D. Direct Deposit Authorization Form

Included in the onboarding packet (separate from the bank-details fields above; employee signs to authorize payroll deposits).

```
DIRECT DEPOSIT AUTHORIZATION FORM

[Company Name] (the "Company")

I, [Employee Name], authorize [Company Name] to deposit my net pay directly into the
bank account(s) I provide below, and to make adjustments for any deposits made in error.

Bank name:        [Bank Name]
Routing number:   [Routing Number]
Account number:   [Account Number]
Account type:     [Checking / Savings]

This authorization remains in effect until I submit a written request to change or cancel it.

_________________________            Date
[Employee Name]
```

### 1E. Payroll packet summary (derived after employee submits)

| Field | Value / Blank |
| --- | --- |
| Work state | `[Work State]` |
| Tax elections | W-4 complete / Pending |
| Employment eligibility | I-9 basics complete / Pending |
| Bank details | `[Bank Name]` · ending `[last 4]` |
| Deposit status | Direct deposit authorized / Pending |
| Overall packet status | Ready for payroll / Waiting on employee / Link not sent |

### 1F. Sample PIIA body (representative legal doc)

```
PROPRIETARY INFORMATION AND INVENTIONS AGREEMENT

[Company Name] (the "Company")

This Agreement is entered into by and between the Company and [Employee Name]
("Employee"), in connection with Employee's role as [Job Title].

In consideration of my employment, I agree to hold all Company confidential and
proprietary information in strict confidence, and I agree that all inventions,
discoveries, and work product I create during my employment relating to the
Company's business are the sole property of the Company.

This Agreement does not alter the at-will nature of my employment and remains in
effect after my employment ends.

Please sign below to accept this agreement.

_________________________            Date
[Employee Name]
```

---

## 2. Benefits enrollment

Optional benefits elections for employees once the company offers health, dental, vision, HSA/FSA, or retirement plans. Typically completed during a new-hire enrollment window or annual open enrollment.

**Catalog:** `W6-benefits-enrollment`  
**Phase:** 3 · Onboarding & payroll  
**Required:** No  
**Actor:** Employee completes; founder/HR confirms enrollment with the benefits provider.

### Header & employee info

| Field | Value / Blank |
| --- | --- |
| Company name | `[Company Name]` |
| Employee name | `[Employee Name]` |
| Job title | `[Job Title]` |
| Employee ID / hire date | `[Employee ID]` / `[Start Date]` |
| Enrollment type | New hire / Open enrollment / Qualifying life event |
| Qualifying event (if applicable) | Marriage / Birth/adoption / Loss of other coverage / Other: `[describe]` |
| Enrollment window start | `[Date]` |
| Enrollment window end | `[Date]` |

### Medical plan

| Field | Value / Blank |
| --- | --- |
| Enroll in medical? | Yes / No / Waive — `[reason if waiving]` |
| Plan tier | `[Plan name — e.g. PPO Gold / HDHP]` |
| Coverage level | Employee only / Employee + spouse / Employee + child(ren) / Family |
| Premium per pay period | `$[_____________]` *(from provider rate sheet)* |

### Dental & vision

| Field | Value / Blank |
| --- | --- |
| Dental enrollment | Yes / No / Waive |
| Dental plan | `[Plan name]` |
| Vision enrollment | Yes / No / Waive |
| Vision plan | `[Plan name]` |

### HSA / FSA

| Field | Value / Blank |
| --- | --- |
| HSA election (if HDHP) | `$[_____________]` per pay period |
| Health FSA election | `$[_____________]` annual amount |
| Dependent care FSA election | `$[_____________]` annual amount |

### Retirement (401(k) or equivalent)

| Field | Value / Blank |
| --- | --- |
| Enroll in retirement plan? | Yes / No |
| Pre-tax contribution % | `[___]`% of eligible compensation |
| Roth contribution % | `[___]`% of eligible compensation |
| Company match acknowledgment | `[Company Name]` matches up to `[___]`% *(from plan document)* |

### Dependents (repeat per dependent)

| Field | Value / Blank |
| --- | --- |
| Dependent full name | `[Dependent Name]` |
| Relationship | Spouse / Child / Other |
| Date of birth | `[Date of Birth]` |
| SSN (last 4 or full — per provider requirement) | `[SSN]` |
| Covered plans | Medical / Dental / Vision |

### Beneficiary designations

| Field | Value / Blank |
| --- | --- |
| Primary beneficiary name | `[Name]` |
| Primary beneficiary relationship | `[Relationship]` |
| Primary beneficiary % | `[___]`% |
| Contingent beneficiary name | `[Name]` |
| Contingent beneficiary relationship | `[Relationship]` |
| Contingent beneficiary % | `[___]`% |

### Acknowledgments

| Field | Value / Blank |
| --- | --- |
| COBRA rights notice received | Yes / N/A *(company under 20 employees)* |
| Summary Plan Description received | Yes |
| Premium deduction authorization | I authorize pre-tax/post-tax payroll deductions per my elections above |
| Employee signature | _____________________ |
| Employee printed name | `[Employee Name]` |
| Date | `[Date]` |

### Benefits enrollment template body

```
BENEFITS ENROLLMENT FORM

[Company Name]

Employee: [Employee Name]          Title: [Job Title]
Hire date: [Start Date]            Enrollment type: [New hire / Open enrollment / QLE]

── Medical ──
Enroll: [Yes / No / Waive]         Plan: [Plan name]         Coverage: [level]

── Dental & Vision ──
Dental: [Yes / No / Waive]         Plan: [Plan name]
Vision: [Yes / No / Waive]         Plan: [Plan name]

── HSA / FSA ──
HSA per pay period: $[_____________]     Health FSA annual: $[_____________]
Dependent care FSA annual: $[_____________]

── Retirement ──
Enroll: [Yes / No]                 Pre-tax: [___]%            Roth: [___]%

── Dependents ──
[List each: Name | Relationship | DOB | Plans covered]

── Beneficiaries ──
Primary: [Name], [Relationship], [___]%
Contingent: [Name], [Relationship], [___]%

I authorize payroll deductions for my elections and confirm I received required notices.

_________________________            Date
[Employee Name]
```



## Notes on the Phase 3 document set

1. **Onboarding pack is link-driven, not a single PDF** — the founder adds employees; StartupKit generates a personalized URL. The employee completes self-service fields and e-signs the legal bundle in one flow.
2. **Payroll setup stays a guided task** — do not add a fill-in template for it. Provider onboarding (Gusto, Rippling, etc.) happens off-platform; StartupKit gates on `payroll.configured` once the founder attests completion.
3. **Benefits enrollment is optional** — mark `required=False` in the catalog. Skip until the company offers benefits (often after ~5–10 employees or first funding).
4. **I-9 Section 2 is employer-side** — the onboarding link collects Section 1 basics; the founder must complete physical document inspection within 3 business days of start (not automated in the self-service link).
5. **Work state drives payroll tax registration** — state withholding forms vary by `[Work State]`. The payroll provider handles registration once work states are known from onboarding submissions.
6. **Legal docs overlap with W2** — PIIA content aligns with `W2-piia` (employee variant). Offer letter and employment agreement are generated in W6 Phase 2 (Hiring), not repeated here.
7. **Cross-phase dependencies** — Payroll setup requires W3 bank live, W1 EIN, and completed onboarding packets per employee before the checklist is fully green.
