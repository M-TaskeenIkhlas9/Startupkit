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
### IRS Form 15620 (Rev. 4-2025) · {{company.name}}

The undersigned taxpayer elects under Section 83(b) of the Internal Revenue Code and Treasury
Regulation § 1.83-2 to include in gross income for the current taxable year the excess (if any) of
the fair market value of the property described below over the amount paid for it.

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
**{{fmv_total}}** total ({{fmv_per}} per share), determined **without regard to any lapse
restriction**, as required by Treas. Reg. § 1.83-2(a).

## 6 · Amount paid
{{price_per}} per share ({{amount_paid_total}} total).

## 7 · Service recipient (the company)
**{{company.name}}** — EIN {{company_ein}} — {{company_address}}. A copy of this election has been
furnished to the Service Recipient as required by Treas. Reg. § 1.83-2(d).

## 8 · Amount included in income
The amount includible in gross income for {{taxable_year}} is the excess (if any) of the fair
market value in Section 5 over the amount paid in Section 6.

Under penalties of perjury, the undersigned declares that the above is true, correct, and complete.

Dated: {{company.date}}

_________________________
{{taxpayer_name}}

---

> ⏰ **Hard deadline:** file within **30 days** of the transfer date — calendar days, not business
> days. There is no extension and no exception for a late election outside a narrow IRS relief
> procedure for inadvertent failures, which is not something to plan around.

## 📤 What to do next
**How to file — pick one method.** Electronic (the IRS's preferred method, live since July 2025):
sign in via ID.me at the IRS's online portal, complete Form 15620, and submit — you get an instant,
time-stamped confirmation, meaningfully stronger proof of timely filing than mail. Paper, by mail:
download [Form 15620](https://www.irs.gov/pub/irs-pdf/f15620.pdf), sign it, and mail it to the IRS
service center where your return is filed, by **certified mail with return receipt**. File by only
one method — filing both risks confusing the IRS's records.

**After filing:**
- **Give a signed copy to {{company.name}}** — required by Treas. Reg. § 1.83-2(d), and the
  company needs it for its own records and any later 409A/cap-table diligence.
- **Keep your own copy indefinitely** — this is a **permanent tax record**, not a "keep a few
  years" document. It establishes your cost basis in the stock and may be needed decades later, at
  sale, in financing diligence, or in an IRS inquiry. If mailed, keep the certified-mail receipt
  with it.

> Form 15620 is the IRS's standard path but the underlying election is a Code-based right — not
> legal or tax advice. Confirm the specific numbers and filing mechanics with a CPA or tax attorney
> before filing; the 30-day window leaves no room to fix a mistake.
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
    DocField(
        key="community_property",
        label="Married and resident in a community-property state?",
        placeholder="No — leave blank if not applicable",
    ),
    DocField(key="spouse_name", label="Spouse's name (if applicable)", placeholder=""),
]

FSPA_TEMPLATE = """\
# Restricted Stock Purchase Agreement
### {{company.name}} · Founder Common Stock

This Agreement, dated {{company.date}}, is between **{{company.name}}** (the "Company") and
**{{founder_name}}** (the "Purchaser"), of {{founder_address}}.

## 1 · Definitions
**"Cause"** means the Purchaser's gross negligence, willful misconduct, conviction of a felony, or
material breach of any agreement with the Company, as determined in good faith by the Board.
**"Change of Control"** means a merger, consolidation, or sale of all or substantially all of the
Company's assets or voting stock, after which the Company's stockholders hold less than a majority
of the surviving entity's voting power.
**"Involuntary Termination"** means termination other than for Cause, or resignation following a
material reduction in duties, compensation, or a required relocation, without the Purchaser's
consent.

## 2 · Purchase of shares
The Purchaser buys **{{shares}}** shares of the Company's Common Stock at **{{price_per_share}}**
per share, for a total of **{{total_price}}**, as authorized by the Board on {{board_date}}.

## 3 · Payment
The purchase price is paid by: {{payment_form}}. If paid in whole or in part by services rendered
or IP assigned, the Board has determined the value of that consideration is not less than the
aggregate par value of the shares issued.

## 4 · Vesting
The shares vest over **{{vesting_years}} years** beginning on the vesting commencement date of
**{{vesting_start_date}}**, with a **{{cliff_months}}-month** cliff — no shares vest before the
cliff, and thereafter they vest in equal monthly installments. Unvested shares remain subject to
the Company's repurchase right below.

## 5 · Company repurchase right
If the Purchaser's service to the Company ends for any reason, the Company may repurchase any
**unvested** shares at the lower of the original purchase price or current fair market value,
exercisable for 90 days following termination.

## 6 · Acceleration on Change of Control
**{{acceleration}}.** If double-trigger, unvested shares accelerate only on an Involuntary
Termination within 12 months of a Change of Control. If single-trigger, they accelerate immediately
on the Change of Control. If none, the original vesting schedule continues to govern.

## 7 · Right of first refusal
Before transferring any shares to a third party, the Purchaser must first offer them to the
Company, then to the Company's other stockholders, on the same terms. This right terminates on the
Company's first firm-commitment underwritten public offering.

## 8 · Market standoff
In connection with the Company's IPO, the Purchaser will not sell or transfer any shares for a
period the underwriters specify (customarily up to 180 days following the registration statement's
effective date), and will sign any further agreement the underwriters reasonably request.

## 9 · Restrictive legend
The shares are unregistered "restricted securities" under Rule 144. Each certificate (or
book-entry notation) will bear a legend to that effect, plus a legend referencing the repurchase
right and right of first refusal in this Agreement. The legend is removed only per the Company's
standard legend-removal procedure once the restrictions no longer apply.

## 10 · Section 83(b) election
The Purchaser has been advised to consult their own tax advisor about filing an election under
Section 83(b) of the Internal Revenue Code. **If made, it must be filed with the IRS within 30
days of this Agreement's date** (the stock transfer date) — there is no extension. The Purchaser is
**solely responsible** for timely filing and for providing a copy to the Company per Treas. Reg.
§ 1.83-2(d). See the separate 83(b) Election document.

## 11 · Intellectual property
The Purchaser assigns to the Company all IP created in connection with the Company's business
before or during the Purchaser's service, to the extent not already assigned under a separate PIIA
or Technology Assignment Agreement, which remains the controlling document for IP terms.

## 12 · Spousal consent
Married in a community-property state: **{{community_property}}**. If yes, the Purchaser's spouse,
**{{spouse_name}}**, must sign the consent below acknowledging the shares (including any
community-property interest) are subject to this Agreement. If not applicable, this section and
signature line are omitted.

## 13 · Miscellaneous
This Agreement is governed by the laws of the State of {{company.jurisdiction}}. It, together with
any PIIA and the Company's Bylaws, is the entire agreement between the parties regarding the
shares, and may be amended only in a signed writing.

---

Agreed on {{company.date}}.

_________________________            _________________________
{{founder_name}}, Purchaser           {{company.name}}, by an officer

SPOUSAL CONSENT (if applicable — see Section 12)

_________________________
{{spouse_name}}, Spouse

## 📤 What to do next
The founder **and a company officer** both sign. **The signing date is the stock transfer date —
it starts the 30-day 83(b) clock.** Issue the certificate (or book-entry) with the restrictive
legend, and record the issuance in the Stock Ledger and Cap Table. One FSPA per founder.

> Draft modeled on the Cooley GO / market-practice founder Restricted Stock Purchase Agreement,
> cross-checked against SEC guidance on restricted securities. Not legal advice — the "Cause" and
> acceleration terms are frequently negotiated and should be reviewed by counsel before signing.
"""


# --- W1 · Bylaws ---------------------------------------------------------------------------------

BYLAWS_FIELDS = [
    DocField(key="director_signatory", label="Adopted by (director name)", prefill="founder.name"),
    DocField(key="min_directors", label="Minimum directors", placeholder="1", kind="number"),
    DocField(key="max_directors", label="Maximum directors", placeholder="9", kind="number"),
    DocField(key="director_term", label="Director term", placeholder="One year, until re-elected"),
    DocField(
        key="annual_meeting_date", label="Annual stockholder meeting", placeholder="Each April"
    ),
    DocField(
        key="special_meeting_notice",
        label="Special meeting notice period",
        placeholder="48 hours",
    ),
    DocField(key="board_quorum", label="Board quorum", placeholder="A majority of directors"),
    DocField(
        key="officer_titles",
        label="Officer titles — one per line",
        kind="textarea",
        placeholder="President\nSecretary\nTreasurer",
    ),
    DocField(key="fiscal_year_end", label="Fiscal year end", placeholder="December 31"),
    DocField(
        key="disbursement_threshold",
        label="Disbursements above this need 2 signatures",
        kind="money",
        placeholder="$10,000",
    ),
    DocField(
        key="amendment_threshold",
        label="Vote needed to amend these Bylaws",
        placeholder="A majority of the Board or of outstanding shares",
    ),
]

BYLAWS_TEMPLATE = """\
# Bylaws
### of {{company.name}} · a {{company.jurisdiction}} {{company.entity}}

## Article I — Offices
The registered office of the Corporation shall be as stated in its Certificate of Incorporation, \
as amended from time to time. The Corporation may also maintain other offices as the Board of \
Directors (the "Board") may determine.

## Article II — Board of Directors
**2.1 Number.** The Board shall consist of not less than **{{min_directors}}** and not more than \
**{{max_directors}}** directors, as fixed from time to time by Board resolution.

**2.2 Term.** Each director serves a term of **{{director_term}}**, and holds office until a \
successor is duly elected and qualified.

**2.3 Vacancies.** Vacancies and newly created directorships may be filled by a majority vote of \
the remaining directors then in office.

**2.4 Meetings.** Regular Board meetings shall be held as the Board determines. Special meetings \
may be called by any director on at least **{{special_meeting_notice}}** notice.

**2.5 Quorum.** **{{board_quorum}}** constitutes a quorum, and the act of a majority of directors \
present at a meeting with quorum is the act of the Board, unless the Certificate of Incorporation \
requires a greater number.

**2.6 Action without a meeting.** Any action that may be taken at a Board meeting may be taken \
without one if all directors consent in writing, filed with the minutes.

**2.7 Remote participation.** Directors may participate by telephone or video conference and shall \
be deemed present in person.

**2.8 Indemnification.** The Corporation shall, to the fullest extent permitted by the laws of \
{{company.jurisdiction}}, indemnify and advance expenses to its directors and officers.

## Article III — Stockholders
**3.1 Annual meeting.** The annual meeting of stockholders shall be held \
**{{annual_meeting_date}}** for the election of directors and other business.

**3.2 Special meetings.** Special meetings may be called by the Board or by holders of a majority \
of the outstanding voting stock.

**3.3 Notice.** Notice of any stockholder meeting shall be given not less than 10 nor more than 60 \
days before the meeting.

**3.4 Quorum & voting.** A majority of outstanding shares entitled to vote, present in person or \
by proxy, constitutes a quorum. Each share is entitled to one vote unless the Certificate of \
Incorporation provides otherwise.

**3.5 Action without a meeting.** Stockholders may act without a meeting by written consent as \
permitted by {{company.jurisdiction}} law.

## Article IV — Officers
**4.1 Designations.** The officers of the Corporation shall be:

{{officer_titles}}

each elected by, and serving at the discretion of, the Board.

**4.2 Duties.** The Secretary keeps the minutes and corporate records. The Treasurer has custody \
of corporate funds and keeps the financial records. Other officers have the duties the Board \
assigns.

**4.3 Removal.** Any officer may be removed by the Board at any time, with or without cause.

## Article V — Stock
Shares shall be represented by certificates or held in uncertificated (book-entry) form and \
recorded in the Corporation's stock ledger, which is the authoritative record of ownership.

## Article VI — Finance & Records
**6.1 Fiscal year.** The Corporation's fiscal year ends **{{fiscal_year_end}}**.

**6.2 Signing authority.** Disbursements above **{{disbursement_threshold}}** require the \
signatures of two authorized officers.

**6.3 Books.** The Corporation shall maintain accurate books of account, minutes of Board and \
stockholder meetings, and a current stock ledger at its principal office.

## Article VII — Notices
Notice may be given personally, by mail, or by electronic transmission. Notice is waived by a \
signed written waiver or by attendance at a meeting without objecting to lack of notice.

## Article VIII — Amendments
These Bylaws may be amended by **{{amendment_threshold}}**, provided the amendment is consistent \
with the Certificate of Incorporation and the laws of {{company.jurisdiction}}.

---

Adopted by the Board of Directors on {{company.date}}.

_________________________
{{director_signatory}}, Director

## 📤 What to do next
Bylaws are not filed with the state — they're the Corporation's internal governing rules, adopted \
by the Incorporator and then ratified by the Board (see the Initial Board Consent). Keep the \
executed copy in the minute book; investors and banks will ask to see it in diligence.

> Draft modeled on standard startup C-Corp bylaws (Cooley GO / Orrick). Not legal advice — have \
> counsel review before adoption.
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

Delaware law (8 Del. C. § 224) defines the **stock ledger** as the record of every stockholder's
name and address, the shares registered in each name, and all issuances and transfers. Two points
that matter in practice:

- **It governs over any other summary.** If this ledger and the Cap Table (or any spreadsheet or
  deck) ever disagree, the Stock Ledger controls for voting rights, dividends, and record dates
  (8 Del. C. § 219).
- **It is what a stockholder inspection demand reaches.** Under 8 Del. C. § 220, a stockholder may
  demand to inspect the corporation's stock ledger for a proper purpose — keeping it accurate is a
  statutory requirement, not optional bookkeeping.

It may be kept electronically, including on a cap-table platform (Carta, Pulley, Clerky), so long
as it can be converted to legible paper form on request (8 Del. C. § 224) — it does **not** need to
be a physical book. It is **not filed** with the State of Delaware.

Each entry: stockholder name & address · shares & class · certificate or book-entry reference ·
date of issuance · price / consideration · any transfers with dates.

{{stock_ledger}}

## 📤 What to do next
Record every issuance and transfer the moment it happens — outside financings, 409A valuations, and
diligence all depend on this being current. **Reconcile against the Cap Table** after every change;
if they disagree, this ledger is the one that is legally correct.

> Internal corporate book of record, required under 8 Del. C. § 224. Not legal advice — if the
> company issued stock before this ledger existed, have counsel reconstruct it before relying on it.
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

The summary of who owns what — the view investors read to model dilution. It is **not** the
corporation's legal record: that is the **Stock Ledger**, which governs under Delaware law if the
two ever disagree.

## Outstanding vs. fully-diluted
- **Outstanding** — shares actually issued and held today (common + preferred).
- **Fully-diluted** — outstanding shares **plus** the entire option pool (granted and unissued),
  **plus** warrants, **plus** any SAFEs/notes on an as-converted basis. Investors evaluate ownership
  on the **fully-diluted** basis, because pool shares dilute everyone once granted, whether or not
  they're issued yet — showing only outstanding shares understates dilution.

## Holders
{{cap_table}}

## Option pool
- Reserved (unissued): **{{option_pool_pct}}%** of the fully-diluted share count. Investors
  typically require a **10–15%** pool carved out of founders' equity before their investment
  closes, sized to cover roughly the next 12–18 months of hiring.
- Pool shares count in the fully-diluted total the moment the pool is authorized, not only once
  individual grants are made.

## Pricing reference
- Price per share / most recent reference: **{{price_per_share}}**.
- Valuation reference: {{valuation}} — note whether this is **pre-money** or **post-money**, since
  the two produce materially different ownership percentages for the same investment.

## 📤 What to do next
Reconcile this against the Stock Ledger after every issuance, grant, or transfer — if they
disagree, the Stock Ledger is legally correct and this summary needs to be fixed to match it. Most
teams run it in Carta or Pulley once there are more than a couple of holders.

> Summary/planning tool — the Stock Ledger governs. Not legal or financial advice — have counsel or
> a cap-table platform verify the fully-diluted math before sharing this with investors.
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
from startupkit.workflows.doc_templates_w3 import W3_TEMPLATES  # noqa: E402

TEMPLATES: dict[str, tuple[list[DocField], str]] = {
    "W1-certificate-of-incorporation": (
        CERT_OF_INCORPORATION_FIELDS,
        CERT_OF_INCORPORATION_TEMPLATE,
    ),
    "W1-incorporator-statement-organizer-documents": (
        INCORPORATOR_STATEMENT_FIELDS,
        INCORPORATOR_STATEMENT_TEMPLATE,
    ),
    "W1-bylaws": (BYLAWS_FIELDS, BYLAWS_TEMPLATE),
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
    **W3_TEMPLATES,  # W3 Generate: YC SAFEs, board consent, side letter, financial policy
}
