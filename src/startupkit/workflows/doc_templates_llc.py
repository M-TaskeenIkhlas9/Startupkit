"""LLC formation document templates — the W1 set served when the company is an LLC (not a C-Corp).

An LLC files a Certificate of Formation (not Incorporation), is governed by an Operating Agreement
(not Bylaws), issues membership units (not stock), and keeps a membership ledger. These map to the
same doc_key scheme; catalog.W1_LLC uses these document names. Vesting / units / management fields
pre-fill from the Phase-0 (LLC) answers on the Company Object.

Drafts for review — not legal advice; have counsel review before signing/filing.
"""

from __future__ import annotations

from startupkit.workflows.catalog import DocField

# --- Certificate of Formation --------------------------------------------------------------------

CERT_OF_FORMATION_FIELDS = [
    DocField(
        key="registered_agent", label="Registered agent name", placeholder="e.g. Cogency Global"
    ),
    DocField(key="agent_street", label="Registered office street", placeholder="850 New Burton Rd"),
    DocField(key="agent_city", label="City", placeholder="Dover"),
    DocField(key="agent_county", label="County", placeholder="Kent"),
    DocField(key="agent_zip", label="ZIP", placeholder="19904"),
    DocField(key="authorized_person", label="Authorized person", prefill="founder.name"),
]

CERT_OF_FORMATION_TEMPLATE = """\
# Certificate of Formation
### of {{company.name}} · a {{company.jurisdiction}} Limited Liability Company

**FIRST — Name.** The name of the limited liability company is **{{company.name}}**.

**SECOND — Registered office and agent.** The address of its registered office in the State of
Delaware is {{agent_street}}, {{agent_city}}, {{agent_county}} County, Delaware {{agent_zip}}. The
name of its registered agent at that address is **{{registered_agent}}**.

---

IN WITNESS WHEREOF, the undersigned authorized person has executed this Certificate of Formation on
{{company.date}}.

_________________________
{{authorized_person}}, Authorized Person

## 📤 What to do next
File with the **Delaware Division of Corporations** (online or by mail) with the filing fee. When
accepted, your LLC legally exists. Official form:
[Delaware Certificate of Formation](https://corp.delaware.gov/corpforms/).

> A Delaware Certificate of Formation is short by design — name + registered agent. Not legal
> advice — have an attorney review before filing.
"""

# --- Operating Agreement (the LLC's core governance + ownership document) -------------------------

OPERATING_AGREEMENT_FIELDS = [
    DocField(key="members", label="Members — 'Name — units', one per line", kind="textarea"),
    DocField(key="total_units", label="Total authorized units", placeholder="10,000,000"),
    DocField(
        key="capital_contribution", label="Capital contribution / unit", placeholder="$0.0001"
    ),
    DocField(key="management_structure", label="Management (member- or manager-managed)"),
    DocField(key="profit_loss_allocation", label="Profit / loss allocation"),
    DocField(key="tax_election", label="Tax election"),
]

OPERATING_AGREEMENT_TEMPLATE = """\
# Operating Agreement
### {{company.name}} · a {{company.jurisdiction}} LLC

This Operating Agreement is adopted by the members of **{{company.name}}**, effective
{{company.date}}.

## 1 · Formation & purpose
The company is a {{company.jurisdiction}} limited liability company formed by filing a Certificate
of Formation. Its purpose is to engage in any lawful business.

## 2 · Members & membership units
The company is authorized to issue **{{total_units}}** membership units. The following members hold
units as set out below:

{{members}}

## 3 · Capital contributions
Members contribute capital at **{{capital_contribution}}** per unit, in cash, property, or services.

## 4 · Management
The company is **{{management_structure}}**.

## 5 · Profits, losses & distributions
Profits and losses are allocated **{{profit_loss_allocation}}**; distributions are made at the
discretion of management.

## 6 · Tax treatment
The company elects to be taxed as: **{{tax_election}}**.

## 7 · Transfer restrictions
Units may not be transferred without the consent of the members, and the company holds a right of
first refusal on any proposed transfer.

---

Adopted on {{company.date}} by all members:

{{members}}
_________________________
(Member signatures)

## 📤 What to do next
All members sign; keep it in the company records. This is the LLC's **core governance document** —
banks and investors will ask for it. There is no state filing for the Operating Agreement itself.

> Draft modeled on a standard LLC Operating Agreement (Cooley GO / Orrick). Not legal advice.
"""

# --- Membership Unit Purchase Agreement (LLC analog of the FSPA) ---------------------------------

UNIT_PURCHASE_FIELDS = [
    DocField(key="member_name", label="Member (purchaser) name", prefill="founder.name"),
    DocField(key="member_address", label="Member address", kind="textarea"),
    DocField(key="units", label="Units purchased", placeholder="e.g. 8,500,000", kind="number"),
    DocField(
        key="capital_contribution", label="Price per unit", kind="money", placeholder="$0.0001"
    ),
    DocField(key="total_price", label="Total purchase price", kind="money"),
    DocField(
        key="payment_form", label="Form of payment", placeholder="cash / IP assignment / services"
    ),
    DocField(key="vesting_start_date", label="Vesting commencement date", kind="date"),
    DocField(key="vesting_years", label="Vesting period (years)", placeholder="4", kind="number"),
    DocField(key="cliff_months", label="Cliff (months)", placeholder="12", kind="number"),
]

UNIT_PURCHASE_TEMPLATE = """\
# Membership Unit Purchase Agreement
### {{company.name}}

This Agreement, dated {{company.date}}, is between **{{company.name}}** (the "Company") and
**{{member_name}}** (the "Member"), of {{member_address}}.

## 1 · Purchase of units
The Member purchases **{{units}}** membership units at **{{capital_contribution}}** per unit, for a
total of **{{total_price}}**.

## 2 · Payment
The purchase price is paid by: {{payment_form}}.

## 3 · Vesting
The units vest over **{{vesting_years}} years** from commencement date **{{vesting_start_date}}**,
with a **{{cliff_months}}-month** cliff. The Company may repurchase unvested units at the original
price if the Member's service ends.

## 4 · Tax election
If these are a capital interest subject to vesting, the Member may consider an **83(b) election**
within 30 days. Profits interests have a separate safe harbor (Rev. Proc. 93-27). The Member is
solely responsible for their own tax filings.

## 5 · Intellectual property
The Member assigns to the Company all intellectual property created in connection with its business.

---

Agreed on {{company.date}}.

_________________________            _________________________
{{member_name}}, Member               {{company.name}}

## 📤 What to do next
Both sign; record the units in the membership ledger and cap table. One agreement per founding
member.

> Draft for review. Not legal or tax advice — have counsel review before signing.
"""

# --- Membership Ledger (LLC analog of the Stock Ledger) ------------------------------------------

MEMBERSHIP_LEDGER_FIELDS = [
    DocField(
        key="membership_ledger",
        label="Ledger entries — one member per line",
        kind="textarea",
        placeholder="Ahmad Mateen — 8,500,000 units — issued 2026-07-01 — $850 (cash)",
    ),
]

MEMBERSHIP_LEDGER_TEMPLATE = """\
# Membership Ledger
### {{company.name}} · register of members

The company's record of who holds membership units. Kept current as units are issued or
transferred.

Each entry: member name & address · units held & class · date of issuance · capital contribution ·
any transfers with dates.

{{membership_ledger}}

## 📤 What to do next
Record every issuance and transfer the moment it happens — this is the LLC's book of record for
ownership.

> Internal company book. Not legal advice.
"""


LLC_TEMPLATES: dict[str, tuple[list[DocField], str]] = {
    "W1-certificate-of-formation": (CERT_OF_FORMATION_FIELDS, CERT_OF_FORMATION_TEMPLATE),
    "W1-operating-agreement": (OPERATING_AGREEMENT_FIELDS, OPERATING_AGREEMENT_TEMPLATE),
    "W1-membership-unit-purchase-agreement": (UNIT_PURCHASE_FIELDS, UNIT_PURCHASE_TEMPLATE),
    "W1-membership-ledger": (MEMBERSHIP_LEDGER_FIELDS, MEMBERSHIP_LEDGER_TEMPLATE),
}
