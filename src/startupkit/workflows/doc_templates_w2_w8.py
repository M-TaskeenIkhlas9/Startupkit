"""Fillable document templates for W2–W8 — the form-type documents across every workflow.

Same shape as the W1 set in `doc_templates.py`: themed markdown with {{company.*}} + {{field}}
tokens, a `fields` list of blanks the founder fills, and a "📤 What to do next" output section.
These cover the documents that are genuinely *forms* (agreements, SAFE, offer/option letters,
positioning, ICP, SOP, security baseline). Strategic/long-form docs (brand strategy, GTM, ops
manual) are better produced by the ⚡ generate pipeline and aren't forced into fill-in templates.

Drafts for review — not legal/financial advice; have counsel review before signing.
"""

from __future__ import annotations

from startupkit.workflows.catalog import DocField

# ================================ W2 · IP & Legal ===============================================

PIIA_FIELDS = [
    DocField(key="signer_name", label="Signer's full name", placeholder="Employee / contractor"),
    DocField(key="role", label="Role", placeholder="e.g. Software Engineer"),
    DocField(key="start_date", label="Start date", kind="date"),
    DocField(key="prior_inventions", label="Prior inventions excluded (if any)", kind="textarea"),
]
PIIA_TEMPLATE = """\
# Proprietary Information & Inventions Agreement
### {{company.name}}

This Agreement is between **{{company.name}}** (the "Company") and **{{signer_name}}**
(the "{{role}}"), effective {{start_date}}.

## 1 · Confidentiality
The signer will hold all of the Company's proprietary and confidential information in strict
confidence and use it only for the Company's benefit, during and after the engagement.

## 2 · Assignment of inventions
The signer assigns to the Company all inventions, works, and intellectual property conceived in the
course of their work for the Company.

## 3 · Prior inventions
The following pre-existing inventions are excluded from this assignment:
{{prior_inventions}}

## 4 · Return of materials
On termination, the signer will return all Company property and confidential materials.

---
Signed: {{company.date}}

_________________________            _________________________
{{signer_name}}                       {{company.name}}

## 📤 What to do next
Every employee, founder, and contractor must sign a PIIA **before** they start work — investors
diligence this. Store the executed copy in your records.

> Draft for review. Not legal advice — have counsel review before signing.
"""

NDA_FIELDS = [
    DocField(key="counterparty", label="Other party's name", placeholder="Person or company"),
    DocField(key="purpose", label="Purpose of disclosure", kind="textarea"),
    DocField(
        key="term_years", label="Confidentiality term (years)", placeholder="3", kind="number"
    ),
]
NDA_TEMPLATE = """\
# Mutual Non-Disclosure Agreement
### {{company.name}} & {{counterparty}}

Effective {{company.date}}, between **{{company.name}}** and **{{counterparty}}** (each a "Party").

## 1 · Purpose
The Parties wish to explore: {{purpose}}, and may share confidential information for that purpose.

## 2 · Confidentiality
Each Party will keep the other's confidential information secret, use it only for the Purpose, and
protect it with reasonable care.

## 3 · Exclusions
Information that is public, already known, or independently developed is not confidential.

## 4 · Term
Confidentiality obligations last **{{term_years}} years** from disclosure.

---
_________________________            _________________________
{{company.name}}                      {{counterparty}}

## 📤 What to do next
Both parties sign before sharing sensitive information. Keep a copy with each counterparty record.

> Draft for review. Not legal advice.
"""

ICA_FIELDS = [
    DocField(key="contractor_name", label="Contractor name"),
    DocField(key="services", label="Services / scope", kind="textarea"),
    DocField(key="rate", label="Rate", kind="money", placeholder="$X / hour or fixed"),
    DocField(key="start_date", label="Start date", kind="date"),
]
ICA_TEMPLATE = """\
# Independent Contractor Agreement
### {{company.name}}

Between **{{company.name}}** (the "Company") and **{{contractor_name}}** (the "Contractor"),
effective {{start_date}}.

## 1 · Services
The Contractor will provide: {{services}}.

## 2 · Compensation
The Company will pay **{{rate}}**, invoiced per the agreed schedule.

## 3 · Independent contractor
The Contractor is not an employee, sets their own means and methods, and is responsible for their
own taxes and benefits.

## 4 · IP assignment & confidentiality
All work product is assigned to the Company; the Contractor keeps Company information confidential
(see PIIA).

---
_________________________            _________________________
{{contractor_name}}                   {{company.name}}

## 📤 What to do next
Sign before work begins; pair with a PIIA. Collect a W-9 for US contractors and issue a 1099 if you
pay $600+ in a year.

> Draft for review. Not legal advice.
"""

ADVISOR_FIELDS = [
    DocField(key="advisor_name", label="Advisor name"),
    DocField(key="focus", label="Advisory focus", placeholder="e.g. GTM, hiring, fundraising"),
    DocField(key="equity_pct", label="Advisor equity (%)", placeholder="0.25", kind="number"),
    DocField(key="vesting_years", label="Vesting (years)", placeholder="2", kind="number"),
]
ADVISOR_TEMPLATE = """\
# Advisor Agreement
### {{company.name}} (FAST-style)

Between **{{company.name}}** and **{{advisor_name}}** (the "Advisor"), dated {{company.date}}.

## 1 · Advisory services
The Advisor will provide informal, ongoing advice on **{{focus}}** — typically a few hours a month.

## 2 · Equity
In exchange, the Advisor receives **{{equity_pct}}%** of the Company's equity, vesting monthly over
**{{vesting_years}} years**, subject to a stock/option grant from the Company's plan.

## 3 · Confidentiality & IP
The Advisor keeps Company information confidential and assigns any related IP to the Company.

## 4 · Independent
The Advisor is not an employee and may advise other companies that don't directly compete.

---
_________________________            _________________________
{{advisor_name}}                      {{company.name}}

## 📤 What to do next
Sign, then issue the advisor's equity grant from your option pool and add them to the cap table.

> Draft modeled on the Founder/Advisor Standard Template. Not legal advice.
"""

# ================================ W3 · Financial ================================================

SAFE_FIELDS = [
    DocField(key="investor_name", label="Investor name"),
    DocField(key="amount", label="Investment amount", kind="money", placeholder="$100,000"),
    DocField(key="cap", label="Post-money valuation cap", kind="money", placeholder="$8,000,000"),
    DocField(key="discount", label="Discount rate (%)", placeholder="0 or e.g. 20", kind="number"),
]
SAFE_TEMPLATE = """\
# SAFE
### Simple Agreement for Future Equity · {{company.name}}

THIS CERTIFIES THAT in exchange for **{{amount}}** (the "Purchase Amount"), **{{investor_name}}**
(the "Investor") is entitled to certain shares of **{{company.name}}**, a {{company.jurisdiction}}
corporation, on the terms below. Dated {{company.date}}.

## 1 · Post-money valuation cap
**{{cap}}**.

## 2 · Discount
**{{discount}}%** (0 means no discount).

## 3 · Equity financing
On the next priced equity round, the SAFE converts into shares at the better of the valuation cap
or the discount.

## 4 · Liquidity / dissolution
Standard YC post-money SAFE provisions apply on a liquidity event or dissolution.

---
_________________________            _________________________
{{company.name}}                      {{investor_name}}

## 📤 What to do next
Both parties sign; record the SAFE on your cap table and in the investor tracker. Keep the executed
copy in the data room.

> Draft modeled on the Y Combinator post-money SAFE. Not legal or financial advice.
"""

INVOICE_FIELDS = [
    DocField(key="invoice_no", label="Invoice number", placeholder="INV-0001"),
    DocField(key="bill_to", label="Bill to (customer)", kind="textarea"),
    DocField(key="description", label="Description of services", kind="textarea"),
    DocField(key="amount", label="Amount due", kind="money"),
    DocField(key="due_date", label="Due date", kind="date"),
]
INVOICE_TEMPLATE = """\
# Invoice {{invoice_no}}
### {{company.name}}

**From:** {{company.name}}
**To:** {{bill_to}}
**Date:** {{company.date}}  ·  **Due:** {{due_date}}

---

## Services
{{description}}

## Amount due
**{{amount}}**

Please remit by the due date. Thank you for your business.

## 📤 What to do next
Send to your customer and record it in your accounting (chart of accounts → accounts receivable).

> Template — confirm tax treatment with your accountant.
"""

# ================================ W4 · Technical ===============================================

SECURITY_BASELINE_FIELDS = [
    DocField(key="owner", label="Security owner", prefill="founder.name"),
    DocField(key="sso_provider", label="SSO / auth provider", placeholder="e.g. Google Workspace"),
    DocField(key="secrets_store", label="Secrets manager", placeholder="e.g. 1Password, Doppler"),
    DocField(key="backup_cadence", label="Backup cadence", placeholder="e.g. daily"),
]
SECURITY_BASELINE_TEMPLATE = """\
# Security Baseline
### {{company.name}} · owner: {{owner}}

The minimum controls every early-stage company should have in place.

## 1 · Identity & access
- SSO via **{{sso_provider}}**; 2FA required for all accounts.
- Least-privilege access; offboarding checklist removes access same-day.

## 2 · Secrets
- All credentials in **{{secrets_store}}** — never in code or chat.

## 3 · Data & backups
- Backups run **{{backup_cadence}}**; restores tested quarterly.
- Production data encrypted at rest and in transit.

## 4 · Devices & code
- Disk encryption on all laptops; dependency and secret scanning in CI.

---

## 📤 What to do next
Adopt this as policy, link it in your Company OS doc, and review it each quarter.

> Baseline checklist — adapt to your stack and any compliance needs (SOC 2, HIPAA, GDPR).
"""

# ================================ W5 · Brand ===================================================

POSITIONING_FIELDS = [
    DocField(key="target", label="Target customer", placeholder="who it's for"),
    DocField(key="category", label="Market category", placeholder="e.g. fundraising CRM"),
    DocField(key="benefit", label="Key benefit", placeholder="the #1 outcome"),
    DocField(key="competitor", label="Primary alternative", placeholder="what they use today"),
    DocField(key="differentiator", label="Why you're different", kind="textarea"),
]
POSITIONING_TEMPLATE = """\
# Positioning Statement
### {{company.name}}

> For **{{target}}** who need a better option, **{{company.name}}** is the **{{category}}** that
> **{{benefit}}** — unlike **{{competitor}}**, because {{differentiator}}.

## How to use this
This one sentence drives your website headline, pitch, and sales scripts. Everything you write
should ladder up to it. If you can't fill a blank crisply, that's the part of the strategy to
sharpen next.

## 📤 What to do next
Pressure-test it with 5 target customers — does it land in their words? Then use it as the spine of
your landing page (W5) and GTM messaging (W7).

> A working artifact — revisit as you learn from the market.
"""

# ================================ W6 · People & HR =============================================

OFFER_LETTER_FIELDS = [
    DocField(key="candidate_name", label="Candidate name"),
    DocField(key="title", label="Job title"),
    DocField(key="salary", label="Annual salary", kind="money"),
    DocField(
        key="equity", label="Equity (options/shares)", placeholder="e.g. 0.5% / 50,000 options"
    ),
    DocField(key="start_date", label="Start date", kind="date"),
]
OFFER_LETTER_TEMPLATE = """\
# Offer of Employment
### {{company.name}}

Dear **{{candidate_name}}**,

We're excited to offer you the role of **{{title}}** at **{{company.name}}**, starting
{{start_date}}.

## Compensation
- **Salary:** {{salary}} per year.
- **Equity:** {{equity}}, subject to the Company's equity plan and a 4-year vesting schedule with a
  1-year cliff, approved by the Board.

## Terms
- This is full-time, at-will employment.
- The offer is contingent on signing the Company's PIIA and confirming work authorization.

We can't wait to build with you.

_________________________            _________________________
{{candidate_name}} (accept)           {{company.name}}

## 📤 What to do next
Send for signature; on acceptance, issue the equity grant, send the PIIA + employment agreement,
and start onboarding (W6).

> Draft for review. Not legal advice — employment law is state-specific.
"""

OPTION_GRANT_FIELDS = [
    DocField(key="grantee_name", label="Grantee name"),
    DocField(key="options", label="Number of options", kind="number", placeholder="50,000"),
    DocField(key="strike", label="Strike price (per share)", kind="money", placeholder="409A FMV"),
    DocField(key="grant_date", label="Grant date", kind="date"),
    DocField(key="vesting", label="Vesting schedule", placeholder="4 years, 1-year cliff"),
]
OPTION_GRANT_TEMPLATE = """\
# Stock Option Grant Notice
### {{company.name}} Equity Incentive Plan

The Board of **{{company.name}}** grants **{{grantee_name}}** an option to purchase
**{{options}}** shares of Common Stock.

## Terms
- **Strike price:** {{strike}} per share (the 409A fair market value on the grant date).
- **Grant date:** {{grant_date}}.
- **Vesting:** {{vesting}}.
- **Type & expiry:** subject to the Plan; exercise window and ISO/NSO treatment per the Plan.

---
_________________________            _________________________
{{grantee_name}}                      {{company.name}}

## 📤 What to do next
Board approves the grant; record it on the cap table and in the option ledger. The grantee may
consider an 83(b) election if early-exercising.

> Draft for review. Requires a current 409A valuation and an adopted equity plan. Not legal advice.
"""

# ================================ W7 · Go-To-Market ============================================

ICP_FIELDS = [
    DocField(key="industry", label="Industry / segment", placeholder="who you sell to"),
    DocField(key="company_size", label="Company size", placeholder="e.g. 10–50 employees"),
    DocField(key="buyer_role", label="Buyer / champion role", placeholder="e.g. Head of Ops"),
    DocField(key="pain", label="Top pain you solve", kind="textarea"),
    DocField(key="trigger", label="Buying trigger", placeholder="what makes them look now"),
]
ICP_TEMPLATE = """\
# Ideal Customer Profile & Buyer Persona
### {{company.name}}

## Ideal Customer Profile
- **Industry / segment:** {{industry}}
- **Company size:** {{company_size}}
- **Buying trigger:** {{trigger}}

## Buyer persona
- **Role:** {{buyer_role}}
- **Top pain:** {{pain}}
- **What success looks like for them:** solving the pain above, measurably.

## How to use this
Every outbound list, ad, and sales script targets this profile. If a prospect doesn't match, don't
chase them — focus beats reach early.

## 📤 What to do next
Build your first target list of 50 accounts matching this ICP, then load them into your CRM (W7).

> A working artifact — sharpen it as you close (and lose) deals.
"""

# ================================ W8 · Operations =============================================

SOP_FIELDS = [
    DocField(key="process_name", label="Process name", placeholder="e.g. Customer onboarding"),
    DocField(key="owner", label="Owner", prefill="founder.name"),
    DocField(key="trigger", label="When it runs", placeholder="the trigger / cadence"),
    DocField(key="steps", label="Steps (one per line)", kind="textarea"),
    DocField(key="done_when", label="Done when…", placeholder="definition of done"),
]
SOP_TEMPLATE = """\
# SOP — {{process_name}}
### {{company.name}} · owner: {{owner}}

**Runs when:** {{trigger}}

## Steps
{{steps}}

## Definition of done
{{done_when}}

## 📤 What to do next
Add this to your SOP library / Company OS doc so anyone can run it. Review when the process changes.

> A living document — keep it current as the team grows.
"""


MORE_TEMPLATES: dict[str, tuple[list[DocField], str]] = {
    "W2-proprietary-information-inventions-agreement-piia": (PIIA_FIELDS, PIIA_TEMPLATE),
    "W2-non-disclosure-agreement-nda": (NDA_FIELDS, NDA_TEMPLATE),
    "W2-independent-contractor-agreement-ica": (ICA_FIELDS, ICA_TEMPLATE),
    "W2-advisor-agreement": (ADVISOR_FIELDS, ADVISOR_TEMPLATE),
    "W3-safe-agreement": (SAFE_FIELDS, SAFE_TEMPLATE),
    "W3-invoice-template": (INVOICE_FIELDS, INVOICE_TEMPLATE),
    "W4-security-baseline": (SECURITY_BASELINE_FIELDS, SECURITY_BASELINE_TEMPLATE),
    "W5-positioning-statement": (POSITIONING_FIELDS, POSITIONING_TEMPLATE),
    "W6-offer-letter": (OFFER_LETTER_FIELDS, OFFER_LETTER_TEMPLATE),
    "W6-option-grant-agreement": (OPTION_GRANT_FIELDS, OPTION_GRANT_TEMPLATE),
    "W7-icp-buyer-personas": (ICP_FIELDS, ICP_TEMPLATE),
    "W8-sop-library": (SOP_FIELDS, SOP_TEMPLATE),
}
