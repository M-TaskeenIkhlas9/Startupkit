"""Themed, fillable document templates for workflow documents.

Each template is themed markdown the frontend renders into a letterhead-style document. Tokens:
  {{company.name}}, {{company.entity}}, {{company.jurisdiction}}, {{company.date}}  — company data
  {{field_key}}                                                                     — founder input

Every template has three parts the founder sees: the document itself, the INPUT fields they fill,
and an OUTPUT section ("What to do next") with the real filing steps + a link to the official
government form. Content is modeled on the actual authoritative sources (Delaware Division of
Corporations certificate of incorporation; IRS Form 15620 for the 83(b) election). These are
drafts for review — not legal advice; an attorney should review before filing.

`fields` are the blanks the founder fills. When all required documents in a phase are filled (or a
copy is uploaded), the phase auto-completes. Seeded richly for W1 (Formation) as the exemplar.
"""

from __future__ import annotations

from startupkit.workflows.catalog import DocField

# --- W1 · Certificate of Incorporation (Delaware Division of Corporations) -----------------------

CERT_OF_INCORPORATION_FIELDS = [
    DocField(
        key="registered_agent", label="Registered agent name", placeholder="e.g. Cogency Global"
    ),
    DocField(key="agent_street", label="Registered office street", placeholder="850 New Burton Rd"),
    DocField(key="agent_city", label="City", placeholder="Dover"),
    DocField(key="agent_county", label="County", placeholder="Kent"),
    DocField(key="agent_zip", label="ZIP", placeholder="19904"),
    DocField(
        key="authorized_shares",
        label="Authorized shares of common stock",
        placeholder="10,000,000",
        kind="number",
    ),
    DocField(key="par_value", label="Par value per share", placeholder="$0.00001"),
    DocField(
        key="incorporator_name",
        label="Incorporator name",
        placeholder="Person filing this — not the company itself",
        prefill="founder.name",
    ),
    DocField(key="incorporator_address", label="Incorporator mailing address", kind="textarea"),
]

CERT_OF_INCORPORATION_TEMPLATE = """\
# Certificate of Incorporation
### of {{company.name}} · a {{company.jurisdiction}} {{company.entity}}

**ARTICLE FIRST — Name.** The name of this corporation is **{{company.name}}**.

**ARTICLE SECOND — Registered office and agent.** The address of its registered office in the
State of Delaware is {{agent_street}}, {{agent_city}}, {{agent_county}} County, Delaware
{{agent_zip}}. The name of its registered agent at such address is **{{registered_agent}}**.

**ARTICLE THIRD — Purpose.** The purpose of the corporation is to engage in any lawful act or
activity for which corporations may be organized under the General Corporation Law of Delaware.

**ARTICLE FOURTH — Authorized stock.** The total number of shares of stock the corporation is
authorized to issue is **{{authorized_shares}}** shares of Common Stock, par value
**{{par_value}}** per share.

**ARTICLE FIFTH — Incorporator.** The name and mailing address of the incorporator is
**{{incorporator_name}}**, {{incorporator_address}}.

---

IN WITNESS WHEREOF, the undersigned incorporator has executed this Certificate of Incorporation on
{{company.date}}.

_________________________
{{incorporator_name}}, Incorporator

---

## 📤 What to do next
File this with the **Delaware Division of Corporations** (online or by mail) with the filing fee.
When accepted you'll receive a stamped copy — your company legally exists. Official form:
[Delaware Certificate of Incorporation (stock)](https://corpfiles.delaware.gov/incstk.pdf).

> Draft modeled on the standard Delaware form. Not legal advice — have an attorney review first.
"""

# --- W1 · 83(b) Election (IRS Form 15620) -------------------------------------------------------

ELECTION_83B_FIELDS = [
    DocField(
        key="taxpayer_name", label="Your full legal name", placeholder="As on your tax return"
    ),
    DocField(key="taxpayer_tin", label="Taxpayer ID (SSN/ITIN)", placeholder="XXX-XX-XXXX"),
    DocField(key="taxpayer_address", label="Your address", kind="textarea"),
    DocField(
        key="property_description",
        label="Property — number & class of shares",
        placeholder="shares of common stock",
    ),
    DocField(
        key="quantity", label="Quantity received", placeholder="e.g. 8,500,000", kind="number"
    ),
    DocField(
        key="transfer_date", label="Date of transfer (FSPA signing date)", kind="date"
    ),
    DocField(key="taxable_year", label="Taxable year of the election", placeholder="2026"),
    DocField(
        key="restrictions",
        label="Restrictions on the property (vesting / forfeiture)",
        kind="textarea",
        placeholder="Subject to repurchase at cost; vests over 4 years.",
    ),
    DocField(key="fmv_per", label="Fair market value per share (at transfer)", kind="money"),
    DocField(key="fmv_total", label="Total fair market value (at transfer)", kind="money"),
    DocField(key="price_per", label="Amount paid per share", kind="money"),
    DocField(key="amount_paid_total", label="Total amount paid", kind="money"),
    DocField(
        key="company_ein",
        label="Company EIN (service recipient)",
        prefill="company.ein",
        placeholder="88-1234567",
    ),
    DocField(key="company_address", label="Company address (service recipient)", kind="textarea"),
]

ELECTION_83B_TEMPLATE = """\
# Section 83(b) Election
### IRS Form 15620 · {{company.name}}

The undersigned taxpayer elects under Section 83(b) of the Internal Revenue Code to include in
gross income the excess (if any) of the fair market value of the property described below over the
amount paid for it.

## 1 · Taxpayer (service provider)
**{{taxpayer_name}}** — {{taxpayer_address}} — Taxpayer ID {{taxpayer_tin}}

## 2 · Property transferred
{{quantity}} {{property_description}} of **{{company.name}}**, a {{company.jurisdiction}}
{{company.entity}}.

## 3 · Date of transfer and taxable year
Transferred on **{{transfer_date}}** (the FSPA signing date). Election for the taxable year
**{{taxable_year}}**.

## 4 · Restrictions
{{restrictions}}

## 5 · Fair market value at transfer
**{{fmv_total}}** total ({{fmv_per}} per share), determined without regard to lapse restrictions.

## 6 · Amount paid
{{price_per}} per share ({{amount_paid_total}} total).

## 7 · Service recipient (the company)
**{{company.name}}** — EIN {{company_ein}} — {{company_address}}.

Under penalties of perjury, the undersigned declares that the above is true, correct, and complete,
and will furnish a copy of this election to the company named above.

Dated: {{company.date}}

_________________________
{{taxpayer_name}}

---

> ⏰ **Hard deadline:** file within **30 days** of the transfer date. No extensions — a late
> election is simply invalid, and the future tax cost can be large.

## 📤 What to do next
File **IRS Form 15620** — either **electronically** on the IRS website (ID.me login) or by mail to
your IRS service center (send certified). Then **give a copy to {{company.name}}**, and **keep your
own copy for at least 3 years** — the IRS often can't reproduce it later.
Official form: [IRS Form 15620](https://www.irs.gov/pub/irs-pdf/f15620.pdf).

> Form 15620 is the standard path but optional — a compliant self-drafted statement is still
> accepted. Not legal or tax advice — confirm with a CPA before filing.
"""

# --- W1 · Founder Restricted Stock Purchase Agreement -------------------------------------------

FSPA_FIELDS = [
    DocField(key="founder_name", label="Founder (purchaser) name", prefill="founder.name"),
    DocField(key="founder_address", label="Founder address", kind="textarea"),
    DocField(key="shares", label="Shares purchased", placeholder="e.g. 8,500,000", kind="number"),
    DocField(
        key="price_per_share",
        label="Purchase price per share",
        kind="money",
        placeholder="$0.00001",
    ),
    DocField(key="total_price", label="Total purchase price", kind="money", placeholder="$85.00"),
    DocField(
        key="payment_form",
        label="Form of payment",
        placeholder="cash / IP assignment / prior services",
    ),
    DocField(key="vesting_start_date", label="Vesting commencement date", kind="date"),
    DocField(key="vesting_years", label="Vesting period (years)", placeholder="4", kind="number"),
    DocField(key="cliff_months", label="Cliff (months)", placeholder="12", kind="number"),
    DocField(
        key="acceleration",
        label="Acceleration (single / double trigger, or none)",
        placeholder="double-trigger",
    ),
    DocField(key="board_date", label="Board approval date", kind="date"),
]

FSPA_TEMPLATE = """\
# Restricted Stock Purchase Agreement
### {{company.name}} · Founder Common Stock

This Agreement, dated {{company.date}}, is between **{{company.name}}** (the "Company") and
**{{founder_name}}** (the "Purchaser"), of {{founder_address}}.

## 1 · Purchase of shares
The Purchaser buys **{{shares}}** shares of the Company's Common Stock at **{{price_per_share}}**
per share, for a total of **{{total_price}}**, as authorized by the Board on {{board_date}}.

## 2 · Payment
The purchase price is paid by: {{payment_form}}.

## 3 · Vesting
The shares vest over **{{vesting_years}} years** beginning on the vesting commencement date of
**{{vesting_start_date}}**, with a **{{cliff_months}}-month** cliff — no shares vest before the
cliff, and thereafter they vest in equal monthly installments.

## 4 · Company repurchase right
If the Purchaser's service to the Company ends, the Company may repurchase any **unvested** shares
at the original purchase price. The Company also holds a right of first refusal on transfers.

## 5 · Acceleration
Acceleration of vesting on a change of control: **{{acceleration}}**.

## 6 · 83(b) election
The Purchaser may file an 83(b) election within **30 days** of the date of this Agreement (the
stock transfer date) and is **solely responsible** for filing it.

## 7 · Intellectual property
The Purchaser assigns to the Company all intellectual property created in connection with the
Company's business.

---

Agreed on {{company.date}}.

_________________________            _________________________
{{founder_name}}, Purchaser           {{company.name}}, by an officer

## 📤 What to do next
The founder **and a company officer** both sign. **The signing date is the stock transfer date —
it starts the 30-day 83(b) clock.** Keep the executed copy in the corporate records and update the
stock ledger and cap table. One FSPA per founder.

> Draft modeled on the Cooley GO / Orrick Restricted Stock Purchase Agreement. Not legal advice —
> have counsel review before signing.
"""


# --- W1 · Action by Incorporator (Incorporator's Statement) --------------------------------------

INCORPORATOR_STATEMENT_FIELDS = [
    DocField(key="incorporator_name", label="Incorporator name", prefill="founder.name"),
    DocField(
        key="directors",
        label="Initial director(s) — one name per line",
        kind="textarea",
        placeholder="Ahmad Mateen",
    ),
]

INCORPORATOR_STATEMENT_TEMPLATE = """\
# Action by Incorporator
### {{company.name}}

The undersigned, being the sole incorporator of **{{company.name}}**, a {{company.jurisdiction}}
{{company.entity}} whose Certificate of Incorporation has been filed, hereby takes the following
actions.

## 1 · Adoption of Bylaws
The Bylaws presented to the incorporator are adopted as the Bylaws of the corporation.

## 2 · Appointment of initial director(s)
The following person(s) are appointed as the initial director(s), to serve until the first annual
meeting of stockholders or until their successors are duly elected and qualified:

{{directors}}

## 3 · Resignation of the incorporator
Having appointed the initial director(s) above, the undersigned incorporator hereby resigns. All
further action on behalf of the corporation shall be taken by the Board of Directors.

---

Dated: {{company.date}}

_________________________
{{incorporator_name}}, Incorporator

## 📤 What to do next
Sign and keep this in the corporate records (minute book) — it's an internal record, not a state
filing, but investors diligence it. It hands control to the board, who then adopt their first
resolutions (Initial Board Consent).

> Draft modeled on the standard Action by Incorporator (Cooley GO / Orrick). Not legal advice —
> have counsel review.
"""


# --- W1 · Initial Board Consent (first actions by unanimous written consent) ---------------------

BOARD_CONSENT_FIELDS = [
    DocField(
        key="directors",
        label="Director(s) signing — one name per line",
        kind="textarea",
        prefill="founder.name",
        placeholder="Ahmad Mateen",
    ),
    DocField(
        key="officers",
        label="Officers appointed — 'Name — Title', one per line",
        kind="textarea",
        placeholder="Ahmad Mateen — CEO & President",
    ),
    DocField(
        key="founder_stock",
        label="Founder stock authorized — 'Name — shares', one per line",
        kind="textarea",
        placeholder="Ahmad Mateen — 8,500,000 shares",
    ),
    DocField(key="price_per_share", label="Price per share (founder stock)", kind="money"),
    DocField(key="bank_name", label="Bank for the company account", placeholder="e.g. Mercury"),
    DocField(key="fiscal_year_end", label="Fiscal year end", placeholder="December 31"),
]

BOARD_CONSENT_TEMPLATE = """\
# Action by Unanimous Written Consent of the Initial Board of Directors
### {{company.name}}

The undersigned, being all of the directors of **{{company.name}}**, a {{company.jurisdiction}}
{{company.entity}}, adopt the following resolutions by unanimous written consent, effective
{{company.date}}.

## 1 · Ratification of incorporation
The filing of the Certificate of Incorporation and all actions of the incorporator are ratified,
approved, and adopted as acts of the corporation.

## 2 · Adoption of Bylaws
The Bylaws adopted by the incorporator are ratified and adopted as the Bylaws of the corporation.

## 3 · Appointment of officers
The following are appointed to the offices set opposite their names, to serve until their
successors are duly appointed:

{{officers}}

## 4 · Issuance of founder stock
The corporation is authorized to issue shares of Common Stock to the founders as follows, at a
purchase price of **{{price_per_share}}** per share (equal to par value), in exchange for cash,
services, and/or assigned intellectual property:

{{founder_stock}}

## 5 · Company bank account
The officers are authorized to open and maintain a bank account for the corporation at
**{{bank_name}}** and to execute all documents necessary to do so.

## 6 · Fiscal year
The fiscal year of the corporation shall end on **{{fiscal_year_end}}**.

---

Dated: {{company.date}}. Signed by all directors:

{{directors}}
_________________________
(Director signatures)

## 📤 What to do next
Every director signs; keep it in the minute book. This is the board act that legally **authorizes
your founder stock**, so it must be signed before (or as) the founder FSPAs are issued in the next
phase.

> Draft modeled on the standard first-board consent (Cooley GO / Orrick). Not legal advice.
"""


# --- W1 · Stock Ledger (the legal book of record) -----------------------------------------------
# `stock_ledger` / `cap_table` auto-fill from the founders + share structure (see the workflow
# detail page, which injects the computed rows as facts). Editable after.

STOCK_LEDGER_FIELDS = [
    DocField(
        key="stock_ledger",
        label="Ledger entries — one stockholder per line",
        kind="textarea",
        placeholder="Ahmad Mateen — 8,500,000 common — Cert C-1 — issued 2026-07-01 — $85 (cash)",
    ),
]

STOCK_LEDGER_TEMPLATE = """\
# Stock Ledger
### {{company.name}} · official register of stockholders

Under Delaware law this ledger is the corporation's **authoritative record** of who owns its stock
— it governs voting and record dates. It is an internal book (not filed with the state), kept
current as shares are issued or transferred.

Each entry: stockholder name & address · shares & class · certificate or book-entry reference ·
date of issuance · price / consideration · any transfers with dates.

{{stock_ledger}}

## 📤 What to do next
Record every issuance and transfer the moment it happens. Most companies maintain this in a cap
table tool (Carta, Pulley, Clerky) — it is the **legal book of record**, distinct from the summary
Cap Table.

> Internal corporate book. Not legal advice.
"""

# --- W1 · Cap Table (the summary investors read) -------------------------------------------------

CAP_TABLE_FIELDS = [
    DocField(
        key="cap_table",
        label="Holders — one per line (name — shares class — %)",
        kind="textarea",
        placeholder="Ahmad Mateen — 8,500,000 common — 85%",
    ),
    DocField(key="option_pool_pct", label="Option pool reserved (%)", kind="number"),
    DocField(key="price_per_share", label="Price per share / reference", kind="money"),
    DocField(key="valuation", label="Valuation reference (optional)", placeholder="e.g. $8M cap"),
]

CAP_TABLE_TEMPLATE = """\
# Capitalization Table
### {{company.name}}

The summary of who owns what — the view investors look at. (The **Stock Ledger** is the legal book
of record; this is the planning/summary tool.)

## Holders
{{cap_table}}

## Pool & pricing
- Option pool reserved (unissued): **{{option_pool_pct}}%** of authorized shares.
- Price per share / reference: **{{price_per_share}}**.  Valuation reference: {{valuation}}.

## 📤 What to do next
Keep this current through every hire (option grants) and financing round. Most teams run it in
Carta or Pulley; Cooley GO and Y Combinator publish free spreadsheet templates.

> Summary tool — the Stock Ledger governs. Not legal advice.
"""


# --- W1 · Registered Agent Agreement -------------------------------------------------------------

REGISTERED_AGENT_FIELDS = [
    DocField(
        key="registered_agent", label="Registered agent name", placeholder="e.g. Cogency Global"
    ),
    DocField(key="agent_address", label="Delaware registered office address", kind="textarea"),
    DocField(key="service_term", label="Service term", placeholder="1 year, auto-renewing"),
    DocField(key="annual_fee", label="Annual fee", kind="money", placeholder="$50–$150"),
    DocField(key="signatory", label="Authorized company signatory", prefill="founder.name"),
    DocField(key="effective_date", label="Effective date", kind="date"),
]

REGISTERED_AGENT_TEMPLATE = """\
# Registered Agent Agreement
### {{company.name}}

This Agreement is between **{{company.name}}** (the "Company") and **{{registered_agent}}** (the
"Agent"), effective {{effective_date}}.

## 1 · Appointment
The Company appoints the Agent as its registered agent in {{company.jurisdiction}}, with the
registered office at {{agent_address}}. Delaware law requires every corporation to maintain a
registered agent with a physical in-state street address.

## 2 · Services
The Agent will receive service of process, state notices, and official mail on the Company's
behalf, and forward them promptly to the Company.

## 3 · Term & fee
The term is **{{service_term}}**, for an annual fee of **{{annual_fee}}**, renewing unless
cancelled by either party.

---

Agreed on {{effective_date}}.

_________________________            _________________________
{{signatory}}, for {{company.name}}   {{registered_agent}}

## 📤 What to do next
Sign and keep on file. You already named this agent in your Certificate of Incorporation — this
formalizes the ongoing service. Browse agents in the
[Delaware agent directory](https://corp.delaware.gov/agents/).

> The agreement comes from your chosen agent (Cogency Global, Northwest, CSC, CT Corporation).
> Draft for reference — not legal advice.
"""


# --- W1 · Compliance Calendar (auto-generated from entity type + state) --------------------------
# `compliance_calendar` auto-fills from the workflow detail page (computed from entity type + the
# operating state), so the founder sees their real recurring deadlines. Editable after.

COMPLIANCE_CALENDAR_FIELDS = [
    DocField(key="compliance_owner", label="Responsible owner", prefill="founder.name"),
    DocField(
        key="reminder_lead",
        label="Reminder lead time",
        placeholder="3 weeks before each due date",
    ),
    DocField(
        key="compliance_calendar",
        label="Recurring obligations — one per line (with due date & frequency)",
        kind="textarea",
        placeholder="• Delaware Annual Report + Franchise Tax — due March 1 (annual)",
    ),
]

COMPLIANCE_CALENDAR_TEMPLATE = """\
# Compliance Calendar
### {{company.name}}

The recurring deadlines that keep the company in good standing. Missing them risks penalties and,
eventually, loss of good standing.

**Responsible owner:** {{compliance_owner}}   ·   **Reminder lead time:** {{reminder_lead}}

## Recurring obligations
Each with its due date and frequency:

{{compliance_calendar}}

## 📤 What to do next
Put each of these on your real calendar, set to alert **{{reminder_lead}}**, and assign
**{{compliance_owner}}** to own them. The Delaware franchise tax / annual report (March 1) and your
federal return are the ones founders miss most.

> Auto-generated from your entity type and operating state — confirm the specifics with your
> accountant. Not legal or tax advice.
"""


# doc_key -> (fields, template). Keyed exactly like catalog.doc_key(workflow, name).
# W1 (C-Corp) lives here; W2–W8 forms in doc_templates_w2_w8; LLC W1 forms in doc_templates_llc;
# the spec-standardized W2 IP documents (TAA C-Corp/LLC + PIIA) in doc_templates_w2_ip.
from startupkit.workflows.doc_templates_llc import LLC_TEMPLATES  # noqa: E402
from startupkit.workflows.doc_templates_w2_founders import FOUNDERS_TEMPLATES  # noqa: E402
from startupkit.workflows.doc_templates_w2_ip import IP_TEMPLATES  # noqa: E402
from startupkit.workflows.doc_templates_w2_w8 import MORE_TEMPLATES  # noqa: E402

TEMPLATES: dict[str, tuple[list[DocField], str]] = {
    "W1-certificate-of-incorporation": (
        CERT_OF_INCORPORATION_FIELDS,
        CERT_OF_INCORPORATION_TEMPLATE,
    ),
    "W1-incorporator-statement-organizer-documents": (
        INCORPORATOR_STATEMENT_FIELDS,
        INCORPORATOR_STATEMENT_TEMPLATE,
    ),
    "W1-initial-board-consent": (BOARD_CONSENT_FIELDS, BOARD_CONSENT_TEMPLATE),
    "W1-stock-ledger": (STOCK_LEDGER_FIELDS, STOCK_LEDGER_TEMPLATE),
    "W1-cap-table": (CAP_TABLE_FIELDS, CAP_TABLE_TEMPLATE),
    "W1-registered-agent-agreement": (REGISTERED_AGENT_FIELDS, REGISTERED_AGENT_TEMPLATE),
    "W1-compliance-calendar": (COMPLIANCE_CALENDAR_FIELDS, COMPLIANCE_CALENDAR_TEMPLATE),
    "W1-83-b-election": (ELECTION_83B_FIELDS, ELECTION_83B_TEMPLATE),
    "W1-founder-stock-purchase-agreement-fspa": (FSPA_FIELDS, FSPA_TEMPLATE),
    **LLC_TEMPLATES,
    **MORE_TEMPLATES,
    **IP_TEMPLATES,  # last so the spec-standardized TAA + PIIA win over older W2 entries
    **FOUNDERS_TEMPLATES,  # Founders' Agreement (C-Corp + "-llc" variant)
}
