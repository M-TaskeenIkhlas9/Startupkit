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
    DocField(key="incorporator_name", label="Incorporator name", placeholder="Person filing this"),
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
        label="Property description",
        placeholder="shares of common stock",
    ),
    DocField(
        key="quantity", label="Quantity received", placeholder="e.g. 4,000,000", kind="number"
    ),
    DocField(key="transfer_date", label="Date shares were transferred to you", kind="date"),
    DocField(key="taxable_year", label="Taxable year of the election", placeholder="2026"),
    DocField(
        key="restrictions",
        label="Restrictions on the property",
        kind="textarea",
        placeholder="Subject to repurchase at cost; vests over 4 years.",
    ),
    DocField(key="fmv_total", label="Total fair market value at transfer", kind="money"),
    DocField(key="fmv_per", label="Fair market value per share", kind="money"),
    DocField(key="price_per", label="Price you paid per share", kind="money"),
]

ELECTION_83B_TEMPLATE = """\
# Section 83(b) Election
### IRS Form 15620 · {{company.name}}

The undersigned taxpayer elects under Section 83(b) of the Internal Revenue Code to include in
gross income the excess (if any) of the fair market value of the property described below over the
amount paid for it.

## 1 · Taxpayer
**{{taxpayer_name}}** — {{taxpayer_address}} — Taxpayer ID {{taxpayer_tin}}

## 2 · Property transferred
{{quantity}} {{property_description}} of **{{company.name}}**, a {{company.jurisdiction}}
{{company.entity}}.

## 3 · Date of transfer and taxable year
Transferred on **{{transfer_date}}**. Election made for the taxable year **{{taxable_year}}**.

## 4 · Restrictions
{{restrictions}}

## 5 · Fair market value at transfer
**{{fmv_total}}** total ({{fmv_per}} per share), determined without regard to lapse restrictions.

## 6 · Amount paid
{{price_per}} per share.

Under penalties of perjury, the taxpayer declares the above is true, correct, and complete, and
will furnish a copy of this election to the corporation.

Dated: {{company.date}}

_________________________
{{taxpayer_name}}

---

> ⏰ **Hard deadline:** file within **30 days** of the transfer date. No extensions — a late
> election is simply invalid.

## 📤 What to do next
File **IRS Form 15620**. As of 2025 you can file it **electronically on the IRS website**, or mail
it to your IRS service center (send certified, keep the receipt). Give a copy to {{company.name}}.
Official form: [IRS Form 15620](https://www.irs.gov/pub/irs-pdf/f15620.pdf).

> Not legal or tax advice — confirm with a CPA or attorney before filing.
"""

# --- W1 · Founder Restricted Stock Purchase Agreement -------------------------------------------

FSPA_FIELDS = [
    DocField(key="founder_name", label="Founder name", prefill="founder.name"),
    DocField(key="shares", label="Shares purchased", placeholder="e.g. 4,000,000", kind="number"),
    DocField(
        key="price_per_share",
        label="Purchase price per share",
        kind="money",
        placeholder="$0.00001",
    ),
    DocField(key="vesting_years", label="Vesting period (years)", placeholder="4", kind="number"),
    DocField(key="cliff_months", label="Cliff (months)", placeholder="12", kind="number"),
    DocField(key="board_date", label="Board approval date", kind="date"),
]

FSPA_TEMPLATE = """\
# Restricted Stock Purchase Agreement
### {{company.name}} · Founder Common Stock

This Agreement, dated {{company.date}}, is between **{{company.name}}** (the "Company") and
**{{founder_name}}** (the "Purchaser").

## 1 · Purchase
The Purchaser buys **{{shares}}** shares of the Company's Common Stock at **{{price_per_share}}**
per share, approved by the Board on {{board_date}}.

## 2 · Vesting
The shares vest over **{{vesting_years}} years** with a **{{cliff_months}}-month** cliff. Unvested
shares are subject to repurchase by the Company at the original price if the Purchaser's service
ends.

## 3 · Right of first refusal & transfer restrictions
The Company holds a right of first refusal on any proposed transfer of shares. Shares may not be
transferred except as permitted by this Agreement.

## 4 · 83(b) election
The Purchaser understands they may file an 83(b) election within **30 days** of this purchase and
is **solely responsible** for filing it.

## 5 · Intellectual property
The Purchaser assigns to the Company all intellectual property created in connection with the
Company's business.

---

Agreed on {{company.date}}.

_________________________            _________________________
{{founder_name}}, Purchaser           {{company.name}}

## 📤 What to do next
Both parties sign; keep the executed copy in the corporate records and update the stock ledger and
cap table. File your 83(b) within 30 days if you elect.

> Draft for review. Not legal advice — have counsel review before signing.
"""


# doc_key -> (fields, template). Keyed exactly like catalog.doc_key(workflow, name).
# W1 lives here; W2–W8 form templates live in doc_templates_w2_w8 and are merged in below.
from startupkit.workflows.doc_templates_w2_w8 import MORE_TEMPLATES  # noqa: E402

TEMPLATES: dict[str, tuple[list[DocField], str]] = {
    "W1-certificate-of-incorporation": (
        CERT_OF_INCORPORATION_FIELDS,
        CERT_OF_INCORPORATION_TEMPLATE,
    ),
    "W1-83-b-election": (ELECTION_83B_FIELDS, ELECTION_83B_TEMPLATE),
    "W1-founder-stock-purchase-agreement-fspa": (FSPA_FIELDS, FSPA_TEMPLATE),
    **MORE_TEMPLATES,
}
