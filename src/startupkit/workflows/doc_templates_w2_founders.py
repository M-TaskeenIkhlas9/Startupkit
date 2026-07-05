"""W2 Founders' Agreement — entity-conditional (Delaware C-Corp stock vs LLC units).

Authored from the founder's spec drop in `W2/Documents with their inputs/` (2026-07-04):
- `{Company Name} - Founders' Agreement (Delaware C-Corp).docx`
- `{Company Name} - Founders' Agreement (LLC).docx`
- `Document Inputs and Blanks.md` (the field map)

Records the founders' understanding on roles, equity, vesting, IP, decision-making, transfer
restrictions, and departure (Good/Bad Leaver + repurchase/redemption). Supplements — does not
replace — the formation documents. The LLC variant registers under the C-Corp doc_key + "-llc" and
is swapped in by catalog._build_w2_llc, like the TAA.

Drafts for review — not legal advice; the non-compete is void in California.
"""

from __future__ import annotations

from startupkit.workflows.catalog import DocField

# Fields shared by both entity variants (same keys so the frontend layout works for both).
_FA_SHARED_TOP = [
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(
        key="business_description",
        label="Business description (Recital D)",
        placeholder="one line — what the company does",
    ),
    DocField(
        key="minimum_hours",
        label="Minimum weekly hours (§2.2)",
        kind="number",
        placeholder="40",
    ),
    DocField(
        key="outside_activities",
        label="Permitted outside activities — 'Founder — activities (or none)' per line",
        kind="textarea",
        placeholder="Ada Lovelace — university guest lectures\nAlan Turing — none",
    ),
    DocField(
        key="option_pool_pct",
        label="Option/incentive pool (% fully diluted, §3.1)",
        kind="number",
        placeholder="15",
    ),
    DocField(
        key="vesting_period", label="Vesting period (§4.1)", placeholder="4 years"
    ),
    DocField(key="vesting_commencement_date", label="Vesting commencement date", kind="date"),
    DocField(
        key="cliff_pct", label="Cliff % at first anniversary", kind="number", placeholder="25"
    ),
    DocField(
        key="remaining_installments",
        label="Remaining monthly installments",
        kind="number",
        placeholder="36",
    ),
]

_FA_SHARED_GOVERNANCE = [
    DocField(
        key="decision_standard",
        label="Major-decision standard (§5.3)",
        placeholder="all Founders (unanimous) / holders of a majority",
    ),
    DocField(
        key="debt_threshold", label="Debt threshold (§5.3)", kind="money", placeholder="$25,000"
    ),
    DocField(
        key="spending_threshold",
        label="Unbudgeted spending threshold (§5.3)",
        kind="money",
        placeholder="$10,000",
    ),
    DocField(
        key="final_say",
        label="Final-say categories (§5.4)",
        placeholder="none — or e.g. Ada has final say over product; Alan over sales",
    ),
    DocField(
        key="transfer_consent",
        label="Transfer consent (§6.1)",
        placeholder="all / a majority in interest of",
    ),
    DocField(
        key="confidentiality_tail",
        label="Confidentiality tail, years (§8.4)",
        kind="number",
        placeholder="3",
    ),
    DocField(
        key="noncompete_tail",
        label="Non-compete tail, months (§9.1 — void in California)",
        kind="number",
        placeholder="12",
    ),
    DocField(
        key="restricted_territory",
        label="Non-compete territory (§9.1)",
        placeholder="e.g. the United States",
    ),
    DocField(
        key="nonsolicit_tail",
        label="Non-solicit tail, months (§9.3)",
        kind="number",
        placeholder="12",
    ),
    DocField(
        key="dispute_forum",
        label="Dispute forum (§11.2)",
        placeholder="AAA arbitration in Wilmington, DE / the courts of New Castle County, DE",
    ),
]

_FA_SHARED_SCHEDULES_CCORP = [
    DocField(
        key="cap_table_rows",
        label="Schedule A — 'Founder | Shares | Equity % | Consideration' per line (+ pool row)",
        kind="textarea",
        placeholder="Ada | 4,250,000 | 42.5% | $425 cash\nOption Pool | 1,500,000 | 15% | N/A",
    ),
    DocField(
        key="roles_rows",
        label="Schedule B — 'Founder | Role/Title | Main responsibilities' per line",
        kind="textarea",
        placeholder="Ada Lovelace | CEO | fundraising, GTM, hiring",
    ),
    DocField(
        key="contributions_rows",
        label="Schedule C — 'Founder | Cash (or none) | Stock purchase or Loan | Terms' per line",
        kind="textarea",
        placeholder="Ada Lovelace | $5,000 | Stock purchase | N/A",
    ),
    DocField(
        key="contributed_ip_rows",
        label="Schedule D — 'Founder | Contributed IP (or None)' per line",
        kind="textarea",
        placeholder="Ada Lovelace | The prototype codebase (github.com/...)",
    ),
]

_FA_SHARED_SIG = [
    DocField(key="founder_name", label="Lead founder name", prefill="founder.name"),
    DocField(key="founder_role", label="Lead founder role/title", placeholder="CEO"),
    DocField(key="founder_email", label="Lead founder email"),
    DocField(key="founder_address", label="Lead founder home address", kind="textarea"),
    DocField(key="company_address", label="Company address", kind="textarea"),
    DocField(key="company_email", label="Company email", placeholder="legal@company.com"),
    DocField(key="signatory_name", label="Company signatory name", placeholder="e.g. the CEO"),
    DocField(key="signatory_title", label="Company signatory title", placeholder="CEO"),
]

FOUNDERS_CCORP_FIELDS = [
    *_FA_SHARED_TOP,
    DocField(
        key="vested_share_treatment",
        label="Good-Leaver vested shares (§4.5)",
        placeholder="none — retains all vested Shares / repurchase at Fair Market Value",
    ),
    DocField(
        key="num_directors", label="Number of directors (§5.1)", kind="number", placeholder="2"
    ),
    DocField(key="director_names", label="Initial director name(s)", placeholder="Ada, Alan"),
    *_FA_SHARED_GOVERNANCE,
    *_FA_SHARED_SCHEDULES_CCORP,
    *_FA_SHARED_SIG,
]

FOUNDERS_CCORP_TEMPLATE = """\
# Founders' Agreement

This Founders' Agreement (this "Agreement") is dated {{effective_date}} (the "Effective Date") and
is entered into by and among **{{company.name}}**, a Delaware corporation (the "Company"), and each
of the founders listed on the signature page (each a "Founder" and together the "Founders"; the
Company and the Founders each a "Party" and together the "Parties").

[[PARTIES]]

## Recitals

**A.** The Founders are stockholders of the Company, each holding the shares of the Company's
Common Stock (the "Shares") set forth opposite the Founder's name on Schedule A.

**B.** The Parties wish to record their understanding on the Founders' roles, equity ownership,
vesting, intellectual property, decision-making, transfer restrictions and the consequences of a
Founder's departure.

**C.** This Agreement supplements, and does not replace, the Company's Certificate of
Incorporation, Bylaws, and any stock purchase or restricted stock agreements between the Company
and a Founder (together, the "Governing Documents"). If this Agreement conflicts with a Governing
Document, the Governing Document controls as to matters required by law to be addressed there, and
this Agreement controls as among the Founders in all other respects.

**D.** The Company's business is {{business_description}} (the "Business").

## 1. Company and Business

**1.1 Conduct of the Business.** The Company shall conduct the Business in accordance with industry
best practice and in compliance with applicable law, and the Founders shall promote the best
interests of the Company with the aim of increasing its value.

**1.2 Related-Party Transactions.** All transactions between the Company and any Founder (or any
person related to a Founder) must reflect arm's-length market terms and be documented in writing.

**1.3 Protection of Intellectual Property.** The Company shall use reasonable efforts to ensure
that its operations do not infringe the intellectual property of any third party and that its own
intellectual property is adequately protected. Every person creating intellectual property for the
Company (including each Founder, employee, and contractor) must sign a proprietary information and
inventions assignment agreement (PIIA/CIIAA) or equivalent before beginning work.

## 2. Founder Roles and Commitment

**2.1 Roles and Responsibilities.** Each Founder's role, title and main responsibilities are set
forth on Schedule B.

**2.2 Devotion of Time.** Each Founder shall devote the Founder's full business time and attention
to the Company (no less than {{minimum_hours}} hours per week) and shall not undertake other
business activities without the prior written approval of all other Founders, except for the
following permitted activities, provided they do not interfere with the Founder's duties:

{{outside_activities}}

**2.3 Corporate Opportunities.** Each Founder shall present all business opportunities relevant to
the Business to the Company, and such opportunities may be pursued only through the Company or its
wholly owned subsidiary.

## 3. Equity and Capital Contributions

**3.1 Equity Split.** The Founders' agreed equity ownership is set forth on Schedule A. The Company
may reserve an option pool of {{option_pool_pct}}% of its fully diluted capitalization for issuance
to employees, advisors and service providers, with grants vesting, unless the Board approves
otherwise, over four years with 25% vesting after one year and the remainder in equal monthly
installments over the following three years.

**3.2 Capital Contributions.** Any cash contributed by a Founder is set forth on Schedule C, which
states for each contribution whether it (a) was consideration for the purchase of Shares or (b)
constitutes a loan to the Company, and, if a loan, its repayment and interest terms.

**3.3 Future Issuances.** Nothing in this Agreement restricts the Company from issuing additional
equity as approved under Section 5 and the Governing Documents; the Founders acknowledge such
issuances will dilute their percentage ownership.

## 4. Vesting; Departure of a Founder

**4.1 Vesting Schedule.** Each Founder's Shares are subject to vesting over {{vesting_period}} from
{{vesting_commencement_date}} (the "Vesting Period"): {{cliff_pct}}% of the Shares vest on the
first anniversary of the vesting commencement date (the "Cliff"), and the remainder vests in
{{remaining_installments}} equal monthly installments thereafter. Shares that have not vested at
any time are "Unvested Shares".

**4.2 Section 83(b) Election.** Each Founder confirms that the Founder has timely filed (or will
timely file within 30 days of the applicable purchase) an election under Section 83(b) of the
Internal Revenue Code with respect to the Founder's Shares, and has provided a copy to the Company.
Each Founder is solely responsible for the Founder's own tax filings and consequences.

**4.3 Bad Leaver.** A Founder is a "Bad Leaver" if, during the Vesting Period: (a) the Founder
voluntarily resigns from all service relationships with the Company, other than a resignation
caused by the Company's material breach or by the Founder's death or permanent disability; (b) the
Founder's service relationship is terminated by the Company for Cause; or (c) the Founder has
substantially failed to perform the role and responsibilities on Schedule B, the other Founders
have given written notice requiring performance, and the Founder has not significantly improved
within 30 days — unless, in each case, all other Founders determine the Founder should be treated
as a Good Leaver. "Cause" means: (i) a material breach of this Agreement or any service agreement
uncured 30 days after written notice; (ii) conviction of, or plea of guilty or no contest to, a
felony or a crime involving fraud or dishonesty; or (iii) willful misconduct or gross negligence
causing material harm to the Company not remedied within 30 days of written notice.

**4.4 Good Leaver.** A Founder whose service relationship ends during the Vesting Period in
circumstances where the Founder is not a Bad Leaver is a "Good Leaver".

**4.5 Repurchase Rights.** If a Founder becomes a Bad Leaver, the Company has the right (the
"Repurchase Right") to repurchase all of the Founder's Shares — vested and unvested — at the lower
of (a) the price originally paid and (b) their Fair Market Value. If a Founder becomes a Good
Leaver, the Company has the Repurchase Right over (a) all of the Founder's Unvested Shares at the
price originally paid for them, and (b) {{vested_share_treatment}}.

**4.6 Exercise Mechanics.** The date a Founder becomes a Good Leaver or Bad Leaver is the "Trigger
Date." The Company may exercise the Repurchase Right by written notice to the Founder (with a copy
to the other Founders) within 90 calendar days after the Trigger Date. The closing occurs within 30
days after the notice or, if Fair Market Value must be determined, within 30 days after that
determination. The departing Founder shall take all actions reasonably requested to transfer the
repurchased Shares.

**4.7 Fair Market Value.** "Fair Market Value" is determined in good faith by the Company's Board
of Directors. If the Founder disputes the determination by written notice within 14 days, Fair
Market Value shall be determined by an independent appraiser jointly appointed by the Founder and
the Company (or, failing agreement within 14 days, appointed at the request of either party by the
American Arbitration Association), whose determination is final and binding. Appraiser costs are
shared equally unless the appraiser determines otherwise.

**4.8 Assignment of Repurchase Right.** If applicable law prevents the Company from exercising the
Repurchase Right, the Company may assign it to the other Founders pro rata to their shareholdings
or as they otherwise agree.

## 5. Decision-Making and Governance

**5.1 Board of Directors.** The Company's Board of Directors consists of {{num_directors}}
director(s), initially: {{director_names}}. The Board manages the Company as provided in the
Governing Documents and the Delaware General Corporation Law.

**5.2 Day-to-Day Authority.** Each Founder-officer has day-to-day authority over the areas of
responsibility assigned on Schedule B, subject to the Board's oversight and the approved budget.

**5.3 Major Decisions.** None of the following actions may be taken without the approval of
{{decision_standard}}:
- issuing equity, options or convertible instruments, other than grants from the approved pool;
- incurring indebtedness exceeding {{debt_threshold}} in the aggregate;
- approving or materially deviating from the annual budget, or any unbudgeted expenditure over
  {{spending_threshold}};
- hiring or terminating any officer, or changing any Founder's compensation;
- selling the Company, merging, dissolving, or disposing of all or substantially all assets
  (including any exclusive license of material intellectual property);
- amending the Certificate of Incorporation, Bylaws or this Agreement;
- entering into any transaction with a Founder or a person related to a Founder.

**5.4 Final-Say Categories.** {{final_say}} (in each case within the approved budget and subject to
Section 5.3).

**5.5 Deadlock.** If the Founders are deadlocked on a Major Decision for more than 30 days, the
Founders shall first negotiate in good faith and then submit the matter to non-binding mediation
with a mutually acceptable mediator before pursuing any other remedy.

## 6. Transfer Restrictions

**6.1 General Restriction.** No Founder may sell, assign, pledge, encumber or otherwise transfer
any Shares (a "Transfer") without the prior written consent of {{transfer_consent}} the other
Founders, except for Permitted Transfers under Section 6.2. Any purported Transfer in violation of
this Agreement is void.

**6.2 Permitted Transfers.** A Founder may Transfer Shares to a trust or entity wholly owned and
controlled by the Founder for bona fide estate-planning purposes, provided the transferee first
signs a joinder agreeing to be bound by this Agreement and the Founder remains liable for the
transferee's obligations.

**6.3 Right of First Refusal.** Any proposed Transfer (other than a Permitted Transfer) is subject
to a right of first refusal, first in favor of the Company and then the other Founders pro rata:
the selling Founder must give written notice of the proposed Transfer and its terms, and the
Company (then the other Founders) have 30 days to elect to purchase all or part of the offered
Shares on the same terms.

**6.4 Joinder.** No Transfer is effective, and the Company shall not issue Shares to any new
holder, until the transferee signs a joinder to this Agreement in form reasonably approved by the
Company.

**6.5 Legend.** Each certificate or book-entry notation for the Shares shall bear a legend
referring to the restrictions in this Agreement and the Governing Documents.

## 7. Intellectual Property

**7.1 Assignment.** Each Founder hereby irrevocably assigns to the Company all right, title and
interest worldwide in and to all inventions, works of authorship, software, designs, know-how,
trade secrets, trademarks and other intellectual property that the Founder has conceived, created
or developed relating to the Business, whether before or after the Effective Date (including the
pre-formation contributions listed on Schedule D), together with all associated rights.

**7.2 Invention Assignment Agreements.** Each Founder shall sign the Company's standard PIIA/CIIAA
and any state-specific version required for the Founder's state of work.

**7.3 Further Assurances.** Each Founder shall execute all documents and take all actions
reasonably requested to perfect, register or enforce the assigned intellectual property, and waives,
to the maximum extent permitted by law, all moral rights in the assigned works.

## 8. Confidentiality

**8.1 Definition.** "Confidential Information" means the terms of this Agreement and any non-public
information relating to the Company or its business, in whatever form, including financial data;
strategies and plans; products, roadmaps and pricing; customer, supplier and partner identities and
terms; agreements and negotiations; intellectual property, know-how and processes; IT systems and
credentials; personnel and compensation information; investor information; governing-body matters;
information held under obligation to a third party; and any other information the Company has a
reasonably identifiable interest in keeping confidential.

**8.2 Exclusions.** Confidential Information does not include information that: (a) is or becomes
publicly available other than through a breach; (b) was already lawfully known without restriction;
(c) is lawfully received from a third party without an obligation of confidence; (d) is approved
for release by the Company in writing; or (e) must be disclosed by law or court order, provided the
disclosing Party gives the Company prompt prior written notice where legally permitted.

**8.3 Obligations.** Each Founder shall hold Confidential Information in strict confidence, use it
only for the Company's business, and not disclose it except (a) in the course of performing duties
or (b) to attorneys, accountants and advisors bound by confidentiality at least as protective.

**8.4 Term.** These obligations apply while the Founder is a stockholder or service provider and
for {{confidentiality_tail}} years thereafter; trade-secret obligations continue for as long as the
information remains a trade secret under applicable law.

## 9. Non-Competition and Non-Solicitation

**9.1 Non-Compete.** Each Founder agrees that, while the Founder is a stockholder or service
provider of the Company and for {{noncompete_tail}} months thereafter, the Founder will not, within
{{restricted_territory}}, directly or indirectly engage in, own, manage, advise or provide services
to any business that competes with the Business, without the prior written consent of the other
Founders. (Note: this covenant is **void in California** and restricted in several other states —
delete it if any Founder works in California.)

**9.2 Permitted Investments.** Section 9.1 does not prohibit passive ownership of up to 5% of a
publicly traded company.

**9.3 Non-Solicitation.** Each Founder agrees that, while the Founder is a stockholder or service
provider and for {{nonsolicit_tail}} months thereafter, the Founder will not, directly or
indirectly, (a) solicit, hire or engage, or seek to induce to leave, any employee, officer,
consultant or key service provider of the Company, or (b) solicit any customer or business partner
of the Company for the purpose of diverting business away from the Company.

**9.4 Remedies.** A breach of this Section 9 or Section 8 may cause irreparable harm for which
monetary damages would be inadequate; the Company is entitled to seek injunctive relief and
specific performance, without posting bond, and may require the breaching Founder to surrender
revenue derived from the breach and compensate the Company for damages exceeding it.

## 10. Representations and Warranties

Each Party represents and warrants that: (a) it has full power and authority to enter into and
perform this Agreement, which is a valid and binding obligation; (b) neither execution nor
performance conflicts with any law, judgment, or agreement binding on the Party, including any
employment, consulting, confidentiality, non-competition or invention-assignment agreement with any
former employer or third party; (c) no insolvency or bankruptcy proceeding has been filed by or
against the Party; and (d) if the Party resides in a community property state, any required spousal
consent has been obtained.

## 11. Dispute Resolution; Governing Law

**11.1 Governing Law.** This Agreement and any dispute arising out of or relating to it (including
non-contractual claims) are governed by the laws of the State of Delaware, without giving effect to
conflict-of-laws rules.

**11.2 Dispute Resolution.** The Parties shall first attempt in good faith to resolve any dispute
by negotiation among the Founders for at least 30 days after written notice. Any dispute not so
resolved shall be finally resolved by {{dispute_forum}}.

**11.3 Equitable Relief.** Nothing in this Section prevents a Party from seeking injunctive or
other equitable relief from a court of competent jurisdiction to prevent a breach of Sections 7, 8
or 9.

## 12. General Provisions

**Entire Agreement.** This Agreement, together with the Certificate of Incorporation, the Bylaws
and any stock purchase or restricted stock agreement, is the entire agreement on its subject.
**Amendment.** Only by a writing signed by all Parties. **Severability.** Invalid provisions are
replaced with valid ones that most closely achieve the original intent; the remainder stays in
effect. **Waiver.** A waiver on one occasion is not a waiver on any other. **Notices.** In writing —
personally, by overnight courier, certified mail, or email to the signature-page addresses; email
is effective unless the sender receives a non-delivery notification. **Assignment.** No assignment
without the other Parties' prior written consent, except with an equity transfer made in accordance
with this Agreement. **Counterparts; Electronic Signatures.** May be executed in counterparts,
including by PDF or e-signature under the U.S. ESIGN Act. **Independent Legal Counsel.** Each
Founder acknowledges being advised to seek independent counsel; Company counsel represents the
Company only. **Survival.** Sections 7, 8, 9, 11 and 12 survive termination and any Founder's
departure. **Term.** This Agreement remains in effect until (a) terminated in writing by all
Parties, (b) the Company is dissolved, or (c) as to a Founder, when the Founder no longer holds
equity and has satisfied all transfer obligations.

## Schedule A — Capitalization Table

| Founder / Holder | Shares of Common Stock | Equity % | Consideration Paid |
|---|---|---|---|
{{cap_table_rows}}

## Schedule B — Roles and Responsibilities

| Founder | Role / Title | Main Responsibilities |
|---|---|---|
{{roles_rows}}

## Schedule C — Capital Contributions

| Founder | Cash Contributed | Treatment | Loan Terms (if applicable) |
|---|---|---|---|
{{contributions_rows}}

## Schedule D — Contributed Intellectual Property

| Founder | Description of IP Contributed (or "None") |
|---|---|
{{contributed_ip_rows}}

*The Parties have executed this Founders' Agreement as of the Effective Date. Add a signature block
per founder; a solo founder signs both as the Company's authorized officer and as the sole Founder.*

[[SIGNATURES]]

## 📤 What to do next
All founders sign **before or alongside** their stock purchase agreements — this is the document
investors ask about when the founder story gets complicated. Confirm the equity split (Schedule A),
vesting (default 4-year/1-year cliff), each founder's contributed IP (Schedule D, even if "None"),
and the decision-making standard before signing. **Each founder must file their 83(b) within 30
days of purchase — no extensions (§4.2).** Delete §9.1 if any founder works in California.

> Draft per the StartupKit Founders' Agreement (Delaware C-Corp) spec. A simplified form — not
> legal advice; have an attorney review before use.
"""

FOUNDERS_LLC_FIELDS = [
    *_FA_SHARED_TOP,
    DocField(
        key="operating_agreement_date", label="Operating Agreement date (Recital C)", kind="date"
    ),
    DocField(
        key="controlling_document",
        label="Controls on conflict (Recital C)",
        placeholder="the Operating Agreement / this Agreement",
    ),
    DocField(
        key="tax_distributions",
        label="Tax distributions (§3.3)",
        placeholder="include / omit",
    ),
    DocField(
        key="vested_share_treatment",
        label="Good-Leaver vested units (§4.5)",
        placeholder="none — retains all vested Units / redeem at Fair Market Value",
    ),
    DocField(
        key="fmv_determiner",
        label="Who determines Fair Market Value (§4.7)",
        placeholder="the Managers / Members holding a majority (excl. departing Founder)",
    ),
    DocField(
        key="management_structure",
        label="Management structure (§5.1)",
        placeholder="member-managed / manager-managed",
    ),
    DocField(
        key="manager_names",
        label="Manager name(s) + appointment threshold (if manager-managed, or 'N/A')",
        placeholder="Ada Lovelace, appointed by a majority of Percentage Interests — or N/A",
    ),
    DocField(
        key="ordinary_voting_threshold",
        label="Ordinary voting threshold (§5.2)",
        placeholder="a majority / two-thirds",
    ),
    *_FA_SHARED_GOVERNANCE,
    DocField(
        key="cap_table_rows",
        label="Schedule A — 'Member | Units | Percentage Interest % | Contribution' per line",
        kind="textarea",
        placeholder="Ada | 4,250,000 | 42.5% | $425\nIncentive Pool | 1,500,000 | 15% | N/A",
    ),
    DocField(
        key="roles_rows",
        label="Schedule B — 'Founder | Role/Title | Main responsibilities' per line",
        kind="textarea",
        placeholder="Ada Lovelace | CEO | fundraising, GTM, hiring",
    ),
    DocField(
        key="contributions_rows",
        label="Schedule C — 'Founder | Cash (or none) | Contribution or Loan | Terms' per line",
        kind="textarea",
        placeholder="Ada Lovelace | $5,000 | Capital contribution | N/A",
    ),
    DocField(
        key="contributed_ip_rows",
        label="Schedule D — 'Founder | Contributed IP (or None)' per line",
        kind="textarea",
        placeholder="Ada Lovelace | The prototype codebase (github.com/...)",
    ),
    *_FA_SHARED_SIG,
]

FOUNDERS_LLC_TEMPLATE = """\
# Founders' Agreement

This Founders' Agreement (this "Agreement") is dated {{effective_date}} (the "Effective Date") and
is entered into by and among **{{company.name}}**, a {{company.jurisdiction}} limited liability
company (the "Company"), and each of the founders listed on the signature page (each a "Founder"
and together the "Founders"; the Company and the Founders each a "Party" and together the
"Parties").

[[PARTIES]]

## Recitals

**A.** The Founders are the Members of the Company, each holding the membership units and
percentage interest (the "Units" and "Percentage Interest") set forth opposite the Founder's name
on Schedule A.

**B.** The Parties wish to record their understanding on the Founders' roles, equity ownership,
vesting, intellectual property, decision-making, transfer restrictions and the consequences of a
Founder's departure.

**C.** This Agreement supplements the Company's Certificate of Formation and Operating Agreement
dated {{operating_agreement_date}} (together, the "Governing Documents"). If this Agreement
conflicts with the Operating Agreement, {{controlling_document}} controls as among the Founders to
the extent permitted by law, and the Parties shall amend the other document to conform.

**D.** The Company's business is {{business_description}} (the "Business").

## 1. Company and Business

**1.1 Conduct of the Business.** The Company shall conduct the Business in accordance with industry
best practice and in compliance with applicable law, and the Founders shall promote the best
interests of the Company with the aim of increasing its value.

**1.2 Related-Party Transactions.** All transactions between the Company and any Founder (or any
person related to a Founder) must reflect arm's-length market terms and be documented in writing.

**1.3 Protection of Intellectual Property.** Every person creating intellectual property for the
Company (including each Founder, employee, and contractor) must sign a proprietary information and
inventions assignment agreement (PIIA/CIIAA) or equivalent before beginning work, and the Company
shall protect its own intellectual property and avoid infringing others'.

## 2. Founder Roles and Commitment

**2.1 Roles and Responsibilities.** Each Founder's role, title and main responsibilities are set
forth on Schedule B.

**2.2 Devotion of Time.** Each Founder shall devote the Founder's full business time and attention
to the Company (no less than {{minimum_hours}} hours per week) and shall not undertake other
business activities without the prior written approval of all other Founders, except for the
following permitted activities, provided they do not interfere with the Founder's duties:

{{outside_activities}}

**2.3 Corporate Opportunities.** Each Founder shall present all business opportunities relevant to
the Business to the Company, and such opportunities may be pursued only through the Company or its
wholly owned subsidiary.

## 3. Equity and Capital Contributions

**3.1 Units.** The Founders' agreed ownership is set forth on Schedule A. The Company may reserve
an incentive pool of {{option_pool_pct}}% of its fully diluted Units (including profits interests)
for issuance to employees, advisors and service providers, vesting, unless otherwise approved under
Section 5, over four years with 25% after one year and the remainder in equal monthly installments.

**3.2 Capital Contributions.** Any cash contributed by a Founder is set forth on Schedule C, which
states whether it is a capital contribution or a loan and, if a loan, its repayment and interest
terms.

**3.3 Distributions; Tax Distributions.** Distributions are made as provided in the Operating
Agreement; absent a contrary provision, distributions are made to the Members pro rata to their
Percentage Interests when and as determined under Section 5. The Parties intend the Company to be
taxed as a partnership; the Company shall use reasonable efforts to distribute to each Member,
before each estimated-tax deadline, at least the Member's estimated tax liability attributable to
Company income allocated to that Member ({{tax_distributions}}).

## 4. Vesting; Departure of a Founder

**4.1 Vesting Schedule.** Each Founder's Units are subject to vesting over {{vesting_period}} from
{{vesting_commencement_date}} (the "Vesting Period"): {{cliff_pct}}% of the Units vest on the first
anniversary of the vesting commencement date (the "Cliff"), and the remainder vests in
{{remaining_installments}} equal monthly installments thereafter. Units that have not vested are
"Unvested Units".

**4.2 Section 83(b) Election.** Each Founder receiving Units subject to vesting confirms the
Founder has timely filed (or will timely file within 30 days of the applicable grant) an election
under Section 83(b) of the Internal Revenue Code where applicable (a protective filing is standard
for profits interests), and has provided a copy to the Company. Each Founder is solely responsible
for the Founder's own tax filings and consequences.

**4.3 Bad Leaver.** A Founder is a "Bad Leaver" if, during the Vesting Period: (a) the Founder
voluntarily resigns from all service relationships with the Company, other than a resignation
caused by the Company's material breach or by the Founder's death or permanent disability; (b) the
Founder's service relationship is terminated by the Company for Cause; or (c) the Founder has
substantially failed to perform the role on Schedule B, the other Founders have given written
notice requiring performance, and the Founder has not significantly improved within 30 days —
unless, in each case, all other Founders determine the Founder should be treated as a Good Leaver.
"Cause" has the meaning in the C-Corp form: uncured material breach, felony or fraud conviction or
plea, or willful misconduct or gross negligence causing unremedied material harm.

**4.4 Good Leaver.** A Founder whose service relationship ends during the Vesting Period in
circumstances where the Founder is not a Bad Leaver is a "Good Leaver".

**4.5 Redemption Rights.** If a Founder becomes a Bad Leaver, the Company has the right (the
"Redemption Right") to redeem all of the Founder's Units — vested and unvested — at the lower of
(a) the Founder's unreturned capital contribution attributable to those Units and (b) their Fair
Market Value. If a Founder becomes a Good Leaver, the Company has the Redemption Right over (a) all
of the Founder's Unvested Units at the Founder's unreturned capital contribution attributable to
them (or, for profits interests, for no consideration), and (b) {{vested_share_treatment}}.

**4.6 Exercise Mechanics.** The date a Founder becomes a Good or Bad Leaver is the "Trigger Date."
The Company may exercise the Redemption Right by written notice within 90 calendar days after the
Trigger Date; closing occurs within 30 days after the notice or the Fair Market Value
determination. The departing Founder shall take all actions reasonably requested to effect the
redemption, and the Members consent to any related amendment of the Operating Agreement and
Schedule A.

**4.7 Fair Market Value.** "Fair Market Value" is determined in good faith by {{fmv_determiner}}.
If the Founder disputes the determination by written notice within 14 days, Fair Market Value shall
be determined by an independent appraiser jointly appointed by the Founder and the Company (or,
failing agreement within 14 days, appointed at the request of either party by the American
Arbitration Association), whose determination is final and binding. Appraiser costs are shared
equally unless the appraiser determines otherwise.

**4.8 Assignment of Redemption Right.** If applicable law or the Operating Agreement prevents the
Company from exercising the Redemption Right, the Company may assign it to the other Founders pro
rata to their Percentage Interests or as they otherwise agree.

## 5. Decision-Making and Governance

**5.1 Management Structure.** The Company is {{management_structure}}. If manager-managed, the
Manager(s) is/are {{manager_names}}. Day-to-day operations are conducted by the Founders in
accordance with the areas of responsibility on Schedule B, subject to the Operating Agreement.

**5.2 Voting.** Except as otherwise provided in this Agreement or the Operating Agreement, Member
decisions are made by Members holding {{ordinary_voting_threshold}} of the Percentage Interests,
with each Member voting in proportion to its Percentage Interest.

**5.3 Major Decisions.** None of the following actions may be taken without the approval of
{{decision_standard}}:
- issuing Units, options or convertible instruments, other than grants from the incentive pool;
- admitting a new Member;
- incurring indebtedness exceeding {{debt_threshold}} in the aggregate;
- approving or materially deviating from the annual budget, or any unbudgeted expenditure over
  {{spending_threshold}};
- hiring or terminating any officer, or changing any Founder's compensation;
- making non-tax distributions, changing the Company's tax classification, or making material tax
  elections;
- selling the Company, merging, converting (including conversion to a corporation), dissolving, or
  disposing of all or substantially all assets (including any exclusive IP license);
- amending the Certificate of Formation, Operating Agreement or this Agreement;
- entering into any transaction with a Founder or a person related to a Founder.

**5.4 Final-Say Categories.** {{final_say}} (in each case within the approved budget and subject to
Section 5.3).

**5.5 Deadlock.** If the Founders are deadlocked on a Major Decision for more than 30 days, the
Founders shall first negotiate in good faith and then submit the matter to non-binding mediation
before pursuing any other remedy.

**5.6 Future Conversion to Corporation.** If the Founders approve a financing or other transaction
that requires the Company to convert to a Delaware corporation (for example, issuing SAFEs or
priced preferred stock), each Founder shall take all actions reasonably necessary to effect the
conversion, with equity in the resulting corporation issued in proportion to the Members'
Percentage Interests and subject to vesting terms no less favorable than those in Section 4.

## 6. Transfer Restrictions

**6.1 General Restriction.** No Founder may sell, assign, pledge, encumber or otherwise transfer
any Units (a "Transfer") without the prior written consent of {{transfer_consent}} the other
Founders, except for Permitted Transfers. Any purported Transfer in violation of this Agreement is
void.

**6.2 Permitted Transfers.** A Founder may Transfer Units to a trust or entity wholly owned and
controlled by the Founder for bona fide estate-planning purposes, provided the transferee first
signs a joinder and the Founder remains liable for the transferee's obligations.

**6.3 Right of First Refusal.** Any proposed Transfer (other than a Permitted Transfer) is subject
to a right of first refusal, first in favor of the Company and then the other Founders pro rata,
with 30 days to elect to purchase on the same terms.

**6.4 Joinder.** No Transfer is effective, and the Company shall not issue Units to any new holder,
until the transferee signs a joinder to this Agreement.

**6.5 Records.** The Company's records and Schedule A shall note the restrictions in this Agreement
and the Governing Documents.

## 7. Intellectual Property

**7.1 Assignment.** Each Founder hereby irrevocably assigns to the Company all right, title and
interest worldwide in and to all inventions, works of authorship, software, designs, know-how,
trade secrets, trademarks and other intellectual property that the Founder has conceived, created
or developed relating to the Business, whether before or after the Effective Date (including the
pre-formation contributions listed on Schedule D), together with all associated rights.

**7.2 Invention Assignment Agreements.** Each Founder shall sign the Company's standard PIIA/CIIAA
and any state-specific version required for the Founder's state of work.

**7.3 Further Assurances.** Each Founder shall execute all documents reasonably requested to
perfect, register or enforce the assigned intellectual property, and waives, to the maximum extent
permitted by law, all moral rights in the assigned works.

## 8. Confidentiality

**8.1–8.3** As in the C-Corp form: "Confidential Information" covers the terms of this Agreement
and all non-public Company information (financial, strategic, product, customer, IP, systems,
personnel, investor, and governing-body information); excludes public, independently known,
third-party-received, Company-approved, and legally compelled disclosures (with prompt notice);
each Founder holds it in strict confidence, uses it only for the Company's business, and shares it
only with duty-bound advisors.

**8.4 Term.** These obligations apply while the Founder is a Member or service provider and for
{{confidentiality_tail}} years thereafter; trade-secret obligations continue for as long as the
information remains a trade secret under applicable law.

## 9. Non-Competition and Non-Solicitation

**9.1 Non-Compete.** Each Founder agrees that, while the Founder is a Member or service provider of
the Company and for {{noncompete_tail}} months thereafter, the Founder will not, within
{{restricted_territory}}, directly or indirectly engage in, own, manage, advise or provide services
to any business that competes with the Business, without the prior written consent of the other
Founders. (Note: **void in California** — delete if any Founder works there.)

**9.2 Permitted Investments.** Passive ownership of up to 5% of a publicly traded company is
permitted.

**9.3 Non-Solicitation.** Each Founder agrees that, while the Founder is a Member or service
provider and for {{nonsolicit_tail}} months thereafter, the Founder will not, directly or
indirectly, (a) solicit, hire or engage, or seek to induce to leave, any employee, officer,
consultant or key service provider of the Company, or (b) solicit any customer or business partner
of the Company for the purpose of diverting business away.

**9.4 Remedies.** A breach of this Section 9 or Section 8 may cause irreparable harm; the Company
is entitled to seek injunctive relief and specific performance without posting bond, and may
require surrender of revenue derived from the breach plus damages exceeding it.

## 10. Representations and Warranties

Each Party represents and warrants that: (a) it has full power and authority to enter into and
perform this Agreement; (b) neither execution nor performance conflicts with any law, judgment, or
agreement binding on the Party, including any agreement with a former employer; (c) no insolvency
or bankruptcy proceeding has been filed by or against the Party; and (d) any required spousal
consent has been obtained.

## 11. Dispute Resolution; Governing Law

**11.1 Governing Law.** This Agreement and any dispute arising out of or relating to it are
governed by the laws of the State of {{company.jurisdiction}}, without giving effect to
conflict-of-laws rules.

**11.2 Dispute Resolution.** The Parties shall first attempt good-faith negotiation for at least 30
days after written notice of a dispute. Any dispute not so resolved shall be finally resolved by
{{dispute_forum}}.

**11.3 Equitable Relief.** Nothing prevents a Party from seeking injunctive or other equitable
relief from a court to prevent a breach of Sections 7, 8 or 9.

## 12. General Provisions

As in the C-Corp form: entire agreement (with the Certificate of Formation and Operating
Agreement); amendment only in a writing signed by all Parties; severability with
closest-intent replacement; no implied waivers; notices in writing (email effective unless
non-delivery notice); no assignment without consent except with a permitted equity transfer;
counterparts and electronic signatures (ESIGN Act); each Founder advised to seek independent
counsel; Sections 7, 8, 9, 11 and 12 survive; in force until terminated by all Parties, dissolution,
or, as to a Founder, when the Founder no longer holds Units and has satisfied transfer obligations.

## Schedule A — Members and Units

| Member | Units | Percentage Interest % | Capital Contribution |
|---|---|---|---|
{{cap_table_rows}}

## Schedule B — Roles and Responsibilities

| Founder | Role / Title | Main Responsibilities |
|---|---|---|
{{roles_rows}}

## Schedule C — Capital Contributions

| Founder | Cash Contributed | Treatment | Loan Terms (if applicable) |
|---|---|---|---|
{{contributions_rows}}

## Schedule D — Contributed Intellectual Property

| Founder | Description of IP Contributed (or "None") |
|---|---|
{{contributed_ip_rows}}

*The Parties have executed this Founders' Agreement as of the Effective Date. Add a signature block
per Founder/Member; a solo founder signs both as the Company's authorized representative and as the
sole Founder.*

[[SIGNATURES]]

## 📤 What to do next
All founding members sign alongside the Operating Agreement. Confirm the Units and Percentage
Interests (Schedule A), vesting, contributed IP (Schedule D, even if "None"), management structure,
and decision standard before signing. Vesting Units may need a **protective 83(b) within 30 days**
(§4.2); §5.6 commits everyone to cooperate with a future conversion to a Delaware corporation when
you raise. Delete §9.1 if any founder works in California.

> Draft per the StartupKit Founders' Agreement (LLC) spec. A simplified form — not legal advice;
> have an attorney review before use.
"""


FOUNDERS_TEMPLATES: dict[str, tuple[list[DocField], str]] = {
    # C-Corp is the default; the "-llc" key is swapped in by catalog._build_w2_llc for LLCs.
    "W2-founders-agreement": (FOUNDERS_CCORP_FIELDS, FOUNDERS_CCORP_TEMPLATE),
    "W2-founders-agreement-llc": (FOUNDERS_LLC_FIELDS, FOUNDERS_LLC_TEMPLATE),
}
