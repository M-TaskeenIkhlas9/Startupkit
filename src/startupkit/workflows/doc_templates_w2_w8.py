"""Fillable document templates for W2–W8 — the form-type documents across every workflow.

Same shape as the W1 set in `doc_templates.py`: themed markdown with {{company.*}} + {{field}}
tokens, a `fields` list of blanks the founder fills, and a "📤 What to do next" output section.

The W2 (IP & Legal) set implements the full W2 legal journey (W2/w2-legal-journey.md) — 5 stages,
18 documents (incl. the Order Form + SLA attachments to the client MSA) — with input fields taken
from the contract intake guide
(W2/Common_Contract_Intake_And_Questions_Guide.md) and grounded in the market-standard startup
forms: Cooley GO / Stripe Atlas founder IP assignment, the CIIAA/PIIA with the state statutory
carve-out (CA Labor Code §2870 etc.), Common Paper / Bonterms MSA framework, a work-made-for-hire +
assignment-fallback agreement, a GDPR-shaped DPA, the Bonterms AI Standard Clauses, the FAST advisor
template, plus Terms of Service and a GDPR/CCPA Privacy Policy. W2 is entity-agnostic (an LLC signs
as "a Delaware limited liability company"; only the founder-IP path can fold into an LLC Operating
Agreement).

Drafts for review — not legal/financial advice; have counsel review before signing.
"""

from __future__ import annotations

from startupkit.workflows.catalog import DocField

# ============================ W2 · IP & Legal — Stage 1: Establish IP ============================

# ======================= W2 · Stage 2: Confirm & record IP ownership ============================

CONFIRMATION_LETTER_FIELDS = [
    DocField(key="transfer_date", label="Date of IP transfer", kind="date"),
    DocField(
        key="founders_ip",
        label="Per founder — 'Name — IP assigned (or None) — signed date' (one per line)",
        kind="textarea",
        placeholder="Ada Lovelace — the codebase & designs — signed 2026-07-01\nAlan Turing — None",
    ),
]
CONFIRMATION_LETTER_TEMPLATE = """\
# Invention Assignment Confirmation Letter
### {{company.name}}

**Date:** {{company.date}}

This letter summarizes the intellectual property assigned to **{{company.name}}** (the "Company") by
its founders as of {{transfer_date}}, for the Company's records and investor due diligence.

## Assignments of record
{{founders_ip}}

## Confirmation
The above intellectual property has been fully assigned to {{company.name}} as of {{transfer_date}}
under each founder's IP & Technology Assignment Agreement. All prior inventions excluded from
assignment are listed in Exhibit A of each founder's PIIA. The Company represents that it owns the
foregoing free of any founder claim.

_________________________
{{company.name}} · an officer

## 📤 What to do next
No signature required — this is the one-page summary an IP attorney looks for first. Place it at the
front of your investor data room; regenerate it whenever a new founder assignment is signed.

> System-generated summary of the underlying signed assignments. Not legal advice.
"""

# ===================== W2 · Stage 3: Confidentiality framework (NDAs) ============================

# Shared party/company fields for both NDA variants.
_NDA_PARTY_FIELDS = [
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="governing_state", label="Governing law (state)", placeholder="Delaware"),
    DocField(key="signatory_name", label="Company signatory name", placeholder="e.g. the CEO"),
    DocField(key="signatory_title", label="Company signatory title", placeholder="CEO"),
    DocField(key="company_email", label="Company email", placeholder="legal@company.com"),
    DocField(key="company_address", label="Company address", kind="textarea"),
    DocField(key="receiving_name", label="Other party name", placeholder="person or company"),
    DocField(
        key="receiving_type",
        label="Other party type",
        placeholder="individual / Delaware LLC — optional",
    ),
    DocField(key="receiving_signatory_name", label="Other party signatory name"),
    DocField(key="receiving_signatory_title", label="Other party signatory title (if applicable)"),
    DocField(key="receiving_email", label="Other party email"),
    DocField(key="receiving_address", label="Other party address", kind="textarea"),
]

NDA_ONEWAY_FIELDS = list(_NDA_PARTY_FIELDS)
NDA_ONEWAY_TEMPLATE = """\
# Non-Disclosure Agreement (One-Way)

This Non-Disclosure Agreement (this "Agreement") is entered into between **{{company.name}}**, a
{{company.jurisdiction}} {{company.entity}} (the "Company"), and the recipient named on the
signature page (the "Recipient"), as of {{effective_date}} (the "Effective Date"), to protect the
confidentiality of certain confidential information of the Company to be disclosed to the Recipient
solely for use in evaluating or pursuing a business relationship with the Company (the "Permitted
Use").

[[PARTIES]]

## 1. Confidential Information

"Confidential Information" means any and all technical and non-technical information provided by or
on behalf of the Company to the Recipient, whether before or after the Effective Date, in oral,
written, graphic, visual, electronic or other form, including without limitation: (a) patents and
patent applications (including unpublished applications) and patent strategy; (b) trade secrets;
(c) proprietary and confidential information, ideas, techniques, sketches, drawings, works of
authorship, models, inventions (whether patentable or not), know-how, data, discoveries, designs,
processes, methods, algorithms, software programs and source documents, and formulae related to the
Company's current, future and proposed products and services — including research and development
work, prototypes, design details and specifications, engineering, financial information,
procurement, purchasing, manufacturing, customer lists, business and contractual relationships,
forecasts, plans, budgets, unpublished financial statements, licensing and strategic arrangements,
prices and costs, suppliers, vendors, partners, and marketing plans; (d) any data related to
customers, investors, employees, or others; and (e) all other information the Recipient knew, or
reasonably should have known, was Confidential Information of the Company. The existence and terms
of this Agreement and of any discussions between the parties are also Confidential Information.

## 2. Nondisclosure and Non-Use

Subject to Section 3, the Recipient will at all times — notwithstanding any termination or
expiration of this Agreement — hold the Confidential Information in strict confidence, not disclose
it to any third party except as approved in writing by the Company, and use it for no purpose other
than the Permitted Use. The Recipient will protect the Confidential Information with at least the
same degree of care it uses for its own confidential information, and no less than reasonable care.
Without limiting the foregoing, the Recipient will not (a) file any patent application claiming or
disclosing any Confidential Information, or (b) use any Confidential Information to support any
application for regulatory or marketing approval. The Recipient will limit access to those of its
officers, directors, employees, consultants and authorized representatives ("Representatives") who
need to know it for the Permitted Use, have been advised of the Recipient's obligations, and are
bound by confidentiality obligations at least as restrictive as this Agreement. Any failure of a
Representative to comply is a breach by the Recipient.

## 3. Exclusions

The Recipient has no obligations with respect to a specific portion of Confidential Information the
Recipient can demonstrate with competent written evidence: (a) was in the public domain when
disclosed; (b) entered the public domain afterward through no fault of the Recipient; (c) was in
the Recipient's possession free of any obligation of confidence when disclosed; (d) was rightfully
communicated by a third party free of any obligation of confidence; or (e) was developed by
employees or agents of the Recipient who had no access to the Confidential Information. No
combination of elements is public merely because its individual elements are; the entire
combination itself must be public.

## 4. Compelled Disclosure

The Recipient may disclose Confidential Information to the extent required by a valid court or
governmental order or by law, provided the Recipient gives the Company reasonable prior written
notice and, at the Company's request, reasonably assists in obtaining a protective order; any
information so disclosed retains its confidentiality protections for all other purposes.

## 5. Notification

The Recipient will immediately notify the Company upon discovery of any loss, unauthorized
disclosure or unauthorized use of, or inability to account for, the Confidential Information.

## 6. Return or Destruction

Upon termination or expiration of this Agreement, or upon the Company's written request, the
Recipient will promptly, at the Company's election, return or destroy (and certify in writing the
destruction of) all documents and tangible materials representing the Confidential Information and
all copies, summaries and notes, in any medium — except that the Recipient may retain (a) one
archival copy solely for compliance with legal or regulatory requirements and (b) automatic
electronic back-ups on centralized servers not readily accessible, in each case remaining subject
to this Agreement.

## 7. Ownership; No License; No Obligation

The Confidential Information is and remains the sole property of the Company. Nothing in this
Agreement grants the Recipient any property right or license, by estoppel or otherwise, to any
Confidential Information or any patent, copyright, trademark or other intellectual property right,
nor obligates either party to enter into any further agreement. Nothing creates any employment,
joint venture, or agency between the parties. The Recipient will not reproduce Confidential
Information except as required for the Permitted Use, and reproductions remain the Company's
property and must carry the original notices.

## 8. Feedback

Any ideas, suggestions, or guidance the Recipient provides related to the Confidential Information
(and any related intellectual property rights) are "Feedback." The Recipient hereby grants the
Company a nonexclusive, perpetual, irrevocable, royalty-free, worldwide license (with the right to
sublicense) to use and exploit such Feedback without restriction.

## 9. Term; Termination; Survival

This Agreement terminates five years after the Effective Date, or may be terminated by either party
at any time upon 30 days' written notice, or by either party for material breach upon 10 days'
written notice. Expiration or termination is without prejudice to rights accruing before it. The
Recipient's obligations survive termination or expiration and are binding upon the Recipient's
heirs, successors, and assigns; obligations for trade secrets continue until the information ceases
to be a trade secret.

## 10. Disclaimer

The Company provides Confidential Information "AS IS", for use at the Recipient's own risk, and
DISCLAIMS ALL WARRANTIES, EXPRESS, IMPLIED OR STATUTORY, INCLUDING TITLE, NON-INFRINGEMENT,
MERCHANTABILITY, AND FITNESS FOR A PARTICULAR PURPOSE, and makes no warranty as to accuracy or
completeness.

## 11. No Reverse Engineering; AI Restrictions

The Recipient will not (a) modify, reverse engineer, decompile, create other works from, or
disassemble, or (b) disclose, upload, transmit or otherwise make available to any training,
self-improving, or machine-learning software, algorithms, or other artificial-intelligence tools of
any kind, any data, software, hardware, prototypes, samples or other materials contained in the
Confidential Information, without the Company's prior written consent.

## 12. General

**Governing Law.** This Agreement is governed by the laws of the State of {{governing_state}},
without giving effect to conflicts-of-laws principles. **Equitable Relief.** A breach may cause
irreparable damage, and the Company is entitled to seek injunctive relief, specific performance, or
other equitable relief without bond or proof of damages. **Severability; Waiver.** Invalid
provisions are reformed to best accomplish their objectives; a waiver on one occasion is not a
waiver on any other. **Third-Party Rights.** Neither party will communicate information in
violation of any third party's proprietary rights. **Assignment.** Neither party may assign this
Agreement without the other's prior written consent (not unreasonably withheld), except to a
successor by merger, acquisition or sale of substantially all assets. **Export.** The Recipient
will not export U.S. technical data acquired under this Agreement in violation of U.S. export laws.
**Notices.** In writing, by personal delivery, overnight courier, email (unless a non-delivery
notification is received), or certified mail to the signature-page addresses. **Entire Agreement.**
This is the final, complete and exclusive agreement on this subject; modifications must be in
writing and signed. **English; Counterparts.** English controls; counterparts (including PDF and
e-signatures under the ESIGN Act) are effective.

*The parties have executed this Non-Disclosure Agreement as of the Effective Date.*

[[SIGNATURES]]

## 📤 What to do next
Use this when **only the company** is disclosing (pitching, briefing a vendor or candidate). Send
for signature before sharing anything sensitive; the term is 5 years with obligations surviving
termination. Note investors typically decline NDAs — use it for vendors, contractors, and partners.

> Draft per the StartupKit one-way NDA form. Not legal advice.
"""

NDA_MUTUAL_FIELDS = list(_NDA_PARTY_FIELDS)
NDA_MUTUAL_TEMPLATE = """\
# Mutual Non-Disclosure Agreement
This Mutual Non-Disclosure Agreement (this "Agreement") is entered into between
**{{company.name}}**, a {{company.jurisdiction}} {{company.entity}} ("Company"), and the other
party named on the signature page ("Other Signatory"), as of {{effective_date}} (the "Effective
Date"), to protect the confidentiality of certain confidential information of the Company or of
the Other Signatory to be disclosed solely for use in evaluating or pursuing a business
relationship between the parties (the "Permitted Use"). Each party may be referred to individually
as a "Party" and collectively as the "Parties."

[[PARTIES]]

## 1. Confidential Information

The "Confidential Information" of a Party means any and all technical and non-technical information
disclosed by or on behalf of that Party (the "Disclosing Party") to the other Party (the "Receiving
Party"), whether before or after the Effective Date, in oral, written, graphic, visual, electronic
or other form, including without limitation: (a) patents and patent applications (including
unpublished applications) and patent strategy; (b) trade secrets; (c) proprietary and confidential
information, ideas, techniques, sketches, drawings, works of authorship, models, inventions
(whether patentable or not), know-how, data, discoveries, designs, processes, methods, algorithms,
software programs and source documents, and formulae related to the Disclosing Party's current,
future and proposed products and services — including research and development work, prototypes,
design details and specifications, engineering, financial information, procurement, purchasing,
manufacturing, customer lists, business and contractual relationships, forecasts, plans, budgets,
unpublished financial statements, licensing and strategic arrangements, prices and costs,
suppliers, vendors, partners, potential business opportunities, personnel skills and compensation,
and marketing plans; (d) any data related to customers, investors, employees, or others; and (e)
all other information the Receiving Party knew, or reasonably should have known, was Confidential
Information of the Disclosing Party. The existence and terms of this Agreement, of any discussions
between the Parties, and the fact that either Party has disclosed Confidential Information, are
Confidential Information of both Parties.

## 2. Certain Definitions

An "Affiliate" of a Party means any business entity controlled by, controlling, or under common
control with that Party (ownership, directly or indirectly, of more than 50% of the voting
securities or comparable equity). "Representatives" of a Party means its or its Affiliates'
officers, directors, employees, consultants and other authorized representatives.

## 3. Nondisclosure and Non-Use

Subject to Section 4, the Receiving Party will at all times — notwithstanding any termination or
expiration — hold the Disclosing Party's Confidential Information in strict confidence, not
disclose it to any third party except as approved in writing, and use it for no purpose other than
the Permitted Use, protecting it with at least the care it uses for its own confidential
information and no less than reasonable care. The Receiving Party will not (a) file any patent
application claiming or disclosing the Disclosing Party's Confidential Information, or (b) use it
to support any application for regulatory or marketing approval. Access is limited to
Representatives who need to know it for the Permitted Use, have been advised of these obligations,
and are bound by confidentiality at least as restrictive; no disclosure may be made to any
Affiliate without the Disclosing Party's express prior written consent (a consented Affiliate, a
"Permitted Affiliate"). Any failure of an Affiliate or Representative to comply is a breach by the
Receiving Party. The Receiving Party will immediately notify the Disclosing Party of any loss or
unauthorized disclosure or use.

## 4. Exclusions

The Receiving Party has no obligations with respect to a specific portion of Confidential
Information it can demonstrate with competent written evidence: (a) was in the public domain when
disclosed; (b) entered the public domain afterward through no fault of the Receiving Party or its
Representatives; (c) was in its possession free of any obligation of confidence when disclosed;
(d) was rightfully communicated by a third party free of any obligation of confidence; or (e) was
developed by its employees or agents who had no access to the Confidential Information, as shown by
contemporaneous written evidence. No combination of elements is public merely because its
individual elements are, and no element is public merely because it is embraced by more general
public information.

## 5. Compelled Disclosure

The Receiving Party may disclose Confidential Information to the extent required by a valid court
or governmental order or by law, provided it gives the Disclosing Party reasonable prior written
notice and, at the Disclosing Party's request, reasonably assists in obtaining a protective order;
information so disclosed retains its confidentiality protections for all other purposes.

## 6. Return or Destruction

Upon termination or expiration, or upon the Disclosing Party's written request, the Receiving Party
will promptly, at the Disclosing Party's election, return or destroy (and certify in writing the
destruction of) all documents and tangible materials representing the Disclosing Party's
Confidential Information and all copies, summaries and notes — except that it may retain (a) one
archival copy solely for compliance with legal or regulatory requirements and (b) automatic
electronic back-ups on centralized servers not readily accessible, in each case remaining subject
to this Agreement.

## 7. Ownership; No License; No Obligation

Confidential Information is and remains the sole property of the Disclosing Party. Nothing grants
the Receiving Party any property right or license to any Confidential Information or any patent,
copyright, trademark or other intellectual property right, nor obligates either Party to enter any
further agreement or disclose any particular information. Nothing creates any employment, joint
venture, or agency. The Receiving Party will not reproduce Confidential Information except as
required for the Permitted Use; reproductions remain the Disclosing Party's property and must carry
the original notices.

## 8. Feedback

Any ideas, suggestions or guidance disclosed by the Receiving Party related to the Disclosing
Party's Confidential Information (and related intellectual-property rights) are "Feedback." The
Receiving Party grants the Disclosing Party a nonexclusive, perpetual, irrevocable, royalty-free,
worldwide license (with the right to sublicense) to use and exploit such Feedback without
restriction.

## 9. Term; Termination; Survival

This Agreement terminates five years after the Effective Date, or may be terminated by either Party
at any time upon 30 days' prior written notice, or by either Party for material breach upon 10
days' written notice. Expiration or termination is without prejudice to accrued rights and
obligations. Each Party's obligations survive for **seven years** after expiration or termination —
except that obligations for trade secrets continue until the information ceases to be a trade
secret. This Agreement binds each Party's heirs, successors, and assigns.

## 10. Disclaimer

THE DISCLOSING PARTY PROVIDES CONFIDENTIAL INFORMATION "AS IS", FOR USE AT THE RECEIVING PARTY'S
OWN RISK, AND DISCLAIMS ALL WARRANTIES, EXPRESS, IMPLIED OR STATUTORY, INCLUDING TITLE,
NON-INFRINGEMENT, MERCHANTABILITY, AND FITNESS FOR A PARTICULAR PURPOSE, and makes no warranty as
to accuracy or completeness. The Disclosing Party has no liability resulting from the Receiving
Party's receipt or use of the Confidential Information.

## 11. No Reverse Engineering; AI Restrictions

Each Party agrees it will not (a) modify, reverse engineer, decompile, create other works from, or
disassemble, or (b) disclose, upload, transmit, export or otherwise make available to any training,
self-improving, or machine-learning software, algorithms, hardware or other artificial-intelligence
tools of any kind, any data, software, hardware, prototypes, samples or other materials contained
in the other Party's Confidential Information, without prior written consent. Except as necessary
for the Permitted Use, the Receiving Party will not analyze or attempt to determine the structure
or composition of any materials or technologies provided by the Disclosing Party.

## 12. General

**Governing Law.** The laws of the State of {{governing_state}}, without giving effect to
conflicts-of-laws principles. **Equitable Relief.** A breach may cause irreparable damage; the
non-breaching Party is entitled to seek injunctive relief, specific performance, or other equitable
relief without bond or proof of damages. **Severability; Waiver.** Invalid provisions are reformed
to best accomplish their objectives; a waiver on one occasion is not a waiver on any other.
**Third-Party Rights.** Neither Party will communicate information in violation of any third
party's proprietary rights. **Assignment.** No assignment without the other Party's prior written
consent (not unreasonably withheld), except to a successor by merger, acquisition or sale of
substantially all assets. **Export.** Neither Party will export U.S. technical data acquired under
this Agreement in violation of U.S. export laws. **Notices.** In writing by personal delivery,
overnight courier, email (unless a non-delivery notification is received), or certified mail to the
signature-page addresses. **Entire Agreement.** The final, complete and exclusive agreement on this
subject; modifications must be in writing and signed. **English; Counterparts.** English controls;
counterparts (including PDF and e-signatures under the ESIGN Act) are effective.

*The Parties have executed this Non-Disclosure Agreement as of the Effective Date.*

[[SIGNATURES]]

## 📤 What to do next
Use this when **both** sides will share confidential information (partnership, M&A, co-development
talks). The term is 5 years, with obligations surviving 7 years after termination (trade secrets
indefinitely). Both parties sign before exchanging anything sensitive.

> Draft per the StartupKit mutual NDA form. Not legal advice.
"""

# ================== W2 · Stage 4: Third-party engagement framework ==============================

ICA_FIELDS = [
    # SOW cover page (Common Paper structure: the cover page IS the Statement of Work)
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="contractor_name", label="Contractor name / legal business name"),
    DocField(
        key="contractor_type",
        label="Contractor type",
        placeholder="Individual (W-9 w/ SSN) or Business (W-9 w/ EIN)",
    ),
    DocField(key="contractor_address", label="Contractor address", kind="textarea"),
    DocField(key="contractor_email", label="Contractor email"),
    DocField(key="company_address", label="Company address", kind="textarea"),
    DocField(key="company_email", label="Company email", placeholder="legal@company.com"),
    DocField(
        key="services",
        label="Services (SOW)",
        kind="textarea",
        placeholder="Description of the services the contractor will perform",
    ),
    DocField(
        key="schedule",
        label="Schedule (SOW)",
        kind="textarea",
        placeholder="Start date, end date, timeline, milestones",
    ),
    DocField(
        key="rate",
        label="Rate (SOW)",
        kind="money",
        placeholder="$X/hour or fixed — consider a max hours or fee cap",
    ),
    DocField(
        key="payment_terms",
        label="Payment terms (SOW)",
        placeholder="How and when the contractor invoices and is paid",
    ),
    DocField(key="governing_state", label="Governing Law (state)", placeholder="Delaware"),
    DocField(
        key="chosen_courts",
        label="Chosen Courts (county, state)",
        placeholder="e.g. New Castle County, Delaware",
    ),
    DocField(
        key="other_terms",
        label="Other terms — expenses, travel, etc. (or 'None')",
        kind="textarea",
        placeholder="e.g. pre-approved travel reimbursed at cost — or 'None'",
    ),
    DocField(key="signatory_name", label="Company signatory name", placeholder="e.g. the CEO"),
    DocField(key="signatory_title", label="Company signatory title", placeholder="CEO"),
    DocField(
        key="contractor_role", label="Contractor signature title", placeholder="Contractor"
    ),
]
ICA_TEMPLATE = """\
# Independent Contractor Agreement (ICA)

## Statement of Work

This Independent Contractor Agreement is entered into as of {{effective_date}} (the "Effective
Date") between Company and Contractor, each identified below. This cover page is the Statement of
Work (the "SOW"); by signing it, each party agrees to enter into this SOW subject to, and
incorporating, the Terms and Conditions below.

[[PARTIES]]

**Services.** {{services}}

**Schedule.** {{schedule}}

**Rate.** {{rate}}

**Payment Terms.** {{payment_terms}}

**Governing Law & Chosen Courts.** "Governing Law" means the laws of the State of
{{governing_state}}. "Chosen Courts" means the state or federal courts in {{chosen_courts}}.

**Other Terms.** {{other_terms}}

## Terms and Conditions

## 1. Services & Restrictions

**1.1 Performing Services.** Contractor will perform the Services described on the SOW in
accordance with the terms and conditions in the Agreement. Contractor and Company may amend the SOW
upon mutual written agreement.

**1.2 Non-Solicitation.** During the term of this Agreement and for one (1) year thereafter,
Contractor will not directly or indirectly solicit the services of any Company personnel for
Contractor's own benefit or for the benefit of any other person or entity.

**1.3 Independent Contractor.** Contractor is an independent contractor providing the Services,
which is outside the Company's usual course of business. Nothing in this Agreement establishes an
employment or agency relationship between Company and Contractor. Contractor has no authority to
bind Company. Contractor will perform Services under the general direction of Company, but
Contractor determines the manner and means by which Services are accomplished.

**1.4 Insurance.** Company will not carry any liability insurance on behalf of Contractor.
Contractor will maintain adequate liability insurance to protect itself from: (a) claims under
workers' compensation and state disability acts; and (b) claims of personal injury (or death) or
tangible or intangible property damage that arise out of any act or omission of Contractor.

**1.5 Materials, Supplies, Equipment and Tools.** Contractor will supply, at its own expense, all
materials, supplies, equipment, and tools required to provide the Services.

## 2. Payment & Taxes

**2.1 Payment.** Company will pay Contractor the fees set forth in the SOW. If the SOW requires
milestones, Company's payment obligation is subject to Contractor's completion of the milestones to
Company's reasonable satisfaction. Unless the SOW says otherwise, Company will not reimburse
Contractor's expenses.

**2.2 Taxes.** Payroll taxes will not be withheld or paid by Company on behalf of Contractor.
Contractor is not treated as an employee for federal or state tax purposes, is responsible for
paying all taxes mandated by law, and is not eligible for any Company employee benefit. Contractor
will indemnify and hold Company harmless from all damages, liabilities, penalties, and costs
(including reasonable attorneys' fees) arising out of any obligation imposed on Company to pay
withholding taxes, social security, unemployment, or disability insurance in connection with
Contractor's compensation. Contractor will provide Company with a **W-9** for tax reporting.

## 3. Intellectual Property

**3.1 Work Product.** Contractor will disclose all Work Product to Company in writing. To the
fullest extent legally possible, all Work Product will be works made for hire owned exclusively by
Company. Regardless of whether the Work Product is legally a work made for hire, Contractor hereby
irrevocably transfers and assigns to Company all right, title, and interest in and to the Work
Product, including all worldwide patent rights, copyright rights, mask work rights, trade secret
rights, know-how, and all other intellectual property or proprietary rights. At Company's request
and expense, during and after the term, Contractor will assist Company in acquiring, perfecting,
and enforcing its rights in the Work Product, and appoints the officers of Company as Contractor's
attorney-in-fact to execute documents for this limited purpose.

**3.2 Moral Rights.** Contractor irrevocably transfers and assigns to Company, and waives and
agrees never to assert, any and all Moral Rights Contractor may have in any Work Product, during
and after the term of this Agreement.

## 4. Term & Termination

**4.1 Term.** This Agreement commences on the Effective Date and, unless terminated earlier,
remains in effect for as long as Contractor is performing Services pursuant to the SOW.

**4.2 Termination.** (a) Either party may terminate immediately if the other fails to cure a
material breach within 15 days of notice, materially breaches in a way that cannot be cured,
dissolves or stops conducting business without a successor, makes an assignment for the benefit of
creditors, or becomes a debtor in insolvency or bankruptcy proceedings continuing more than 60
days. (b) Company may terminate at any time, for any or no reason, on thirty (30) days' prior
written notice, during which the parties continue performing in good faith. (c) The parties may
terminate at any time by written mutual consent.

**4.3 Effect of Termination.** Upon expiration or termination: Contractor promptly delivers all
Work Product (including work in progress); Contractor stops providing Services; Contractor returns
or, at Company's election, destroys Confidential Information; except where Company terminates for
cause, Contractor submits a final invoice for fees accrued before termination, which Company pays
per Section 2; and except where Contractor terminates for cause, Contractor refunds prepaid fees
for Services not performed.

**4.4 Survival.** Sections 1.2 (for the period specified), 3, 4.3, 4.4, 5, 7, 8, 9, and 10 survive
expiration or termination.

## 5. Confidentiality

**5.1 Non-Use and Non-Disclosure.** Contractor will (a) only use Confidential Information to
fulfill its obligations under this Agreement; and (b) not disclose Confidential Information to
anyone else, protecting it with at least the protections it uses for its own similar information
and no less than a reasonable standard of care.

**5.2 Exclusions.** Confidential Information does not include information that Contractor knew
without confidentiality obligations before disclosure; that is or becomes publicly known through no
fault of Contractor; that Contractor rightfully receives from someone authorized to disclose it; or
that Contractor independently developed without use of Confidential Information.

**5.3 Required Disclosures.** Contractor may disclose Confidential Information to the extent
required by Applicable Laws if, unless prohibited, it gives Company reasonable advance notice and
reasonably cooperates with Company's efforts to obtain confidential treatment.

**5.4 Injunctive Relief.** Breach of this Section could cause irreparable harm that money cannot
adequately compensate; Company may seek equitable relief, including an injunction, without posting
a bond and without limiting its other remedies.

## 6. Representations & Warranties

**6.1 Mutual.** Each party represents that it has the legal power to enter into this Agreement and
will comply with all Applicable Laws in performing it.

**6.2 From Contractor.** Contractor represents and warrants that: (a) it will perform the Services
in a timely, competent, and professional manner consistent with high professional and industry
standards; (b) it has no pre-existing obligations in conflict with this Agreement; (c) the Work
Product does not and will not infringe or misappropriate anyone else's intellectual property,
privacy, or publicity rights; (d) the Work Product will conform to the requirements in the SOW; and
(e) it has all rights, permits, and licenses necessary to perform the Services and convey the Work
Product.

## 7. Indemnification

Contractor will indemnify and hold harmless Company from all claims, damages, losses, and expenses
(including court costs and reasonable attorneys' fees), and at Company's option defend Company
against any third-party action, based on: (a) a claim that any Service or Work Product infringes,
misappropriates, or violates a third party's intellectual property rights; (b) a breach or alleged
breach by Contractor of Section 6; or (c) any negligent, reckless, or willful act or omission of
Contractor resulting in bodily injury or death, damage to tangible or intangible property, or
violation of Applicable Laws.

## 8. Limitation of Liability

**8.1 Damages Waiver.** Under no circumstances will Company be liable for lost profits or revenues,
or for consequential, special, indirect, exemplary, punitive, or incidental damages relating to
this Agreement, even if informed of the possibility in advance.

**8.2 Liability Cap.** Company's total cumulative liability for all claims arising out of or
relating to this Agreement will not exceed the fees paid or payable to Contractor in the twelve
(12) months preceding the events giving rise to the claim.

**8.3 Applicability; Exceptions.** These limits apply to all liability, whether in tort (including
negligence), contract, breach of statutory duty, or otherwise — except to the extent prohibited by
Applicable Laws.

## 9. General Terms

**Entire Agreement.** This Agreement (the SOW together with these Terms) is the only agreement
between the parties about its subject and supersedes all prior statements. **Modifications,
Severability, and Waiver.** Changes must be in writing and signed or electronically accepted by
each party; invalid terms do not affect the rest; failure to enforce is not a waiver.
**Assignment.** Contractor may not assign or delegate without Company's prior written consent;
Company may assign in connection with a sale of its business or assets. **Governing Law and Chosen
Courts.** The Governing Law identified in the SOW governs, without regard to conflicts of laws; the
parties will bring any proceeding in the Chosen Courts and irrevocably submit to their exclusive
jurisdiction. **Notices.** Notices must be in writing to the email or address in the SOW, deemed
given on confirmed delivery. **No Third-Party Beneficiaries.** There are none. **Anti-Bribery.**
Neither party will violate anti-corruption laws (e.g. the U.S. FCPA, UK Bribery Act 2010).
**Signature.** This Agreement may be signed in counterparts, including electronically.

## 10. Definitions

**"Work Product"** means all inventions, products, designs, drawings, notes, information,
documentation, works of authorship, processes, techniques, know-how, algorithms, plans,
specifications, computer programs, interfaces, and other materials or innovations of any kind that
Contractor makes, conceives, develops, or reduces to practice, alone or jointly, in connection with
performing Services or that result from or relate to the Services, whether or not eligible for
legal protection. **"Confidential Information"** means information in any form disclosed by or on
behalf of Company to Contractor in connection with this Agreement that is identified as
confidential or should reasonably be understood as confidential, including the existence of this
Agreement. **"Moral Rights"** means any rights to claim authorship, object to or prevent
modification or destruction, or withdraw from circulation or control publication of any Work
Product, under the law of any country or treaty. **"Effective Date"** means the date of last
signature on the SOW. **"Applicable Laws"** means the laws, rules, regulations, court orders, and
other binding requirements of a relevant government authority.

*By signing, each party agrees to this SOW and the incorporated Terms.*

[[SIGNATURES]]

## 📤 What to do next
Sign before work begins and pair with a PIIA. Collect a **W-9** and issue a **1099-NEC** if you pay
$600+ in a year. The cover page is the SOW — amend it in writing as scope changes. Misclassifying
an employee as a contractor is a real liability; sanity-check control and independence.

> Modeled on the Common Paper Independent Contractor Agreement (SOW cover page + standard terms).
> Not legal advice — worker classification is state- and fact-specific.
"""


_MSA_COMPANY_FIELDS = [
    DocField(key="company_address", label="Company address", kind="textarea"),
    DocField(key="company_email", label="Company email", placeholder="legal@company.com"),
    DocField(key="signatory_name", label="Company signatory name", placeholder="e.g. the CEO"),
    DocField(
        key="signatory_title", label="Company signatory title", placeholder="CEO"
    ),
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="term_length", label="Initial term", placeholder="1 Year"),
    DocField(key="payment_terms", label="Payment terms", placeholder="Net 30"),
    DocField(key="liability_cap", label="Liability cap", placeholder="Fees paid, 12-mo"),
    DocField(
        key="termination_notice",
        label="Termination-for-convenience notice",
        placeholder="30 days",
    ),
    DocField(key="governing_state", label="Governing law (state)", placeholder="Delaware"),
    DocField(
        key="dispute_venue",
        label="Dispute venue (county, state)",
        placeholder="New Castle County, Delaware",
    ),
]
MSA_CLIENT_FIELDS = [
    *_MSA_COMPANY_FIELDS,
    DocField(key="client_name", label="Customer name", placeholder="Acme Solutions LLC"),
    DocField(key="client_type", label="Customer type", placeholder="Delaware LLC"),
    DocField(key="client_address", label="Customer address", kind="textarea"),
    DocField(key="client_email", label="Customer email"),
    DocField(key="client_signatory_name", label="Customer signatory name"),
    DocField(key="client_signatory_title", label="Customer signatory title"),
]
MSA_CLIENT_TEMPLATE = """\
# Master Services Agreement (MSA)

This Master Services Agreement ("Agreement") is made as of {{effective_date}} (the "Effective
Date"), by and between:

[[PARTIES]]

The Company (as "Provider") and the Customer are each a "Party" and together the "Parties".

## 1. Purpose & Structure
This Agreement sets the general terms under which Provider may provide software, AI, cloud, API, and
professional services to Customer. Specific commercial terms are defined in **Order Forms**,
**Statements of Work (SOWs)**, **Service Level Agreements (SLAs)**, **Data Processing Addenda
(DPAs)**, and **AI Addenda**, each of which is incorporated into this Agreement. If one conflicts
with this Agreement, this Agreement controls unless it expressly overrides a specific section.

## 2. Definitions
- **Services** — any software, platform, API, AI functionality, or professional service described in
  an Order Form or SOW.
- **Platform** — Provider's hosted technology platform.
- **Customer Data** — any information submitted by Customer or its Authorized Users.
- **Authorized User** — an individual Customer permits to access the Services.
- **Documentation** — the guides, manuals, and specifications Provider makes available.
- **Confidential Information** — non-public information disclosed by either Party.

## 3. Access & Use Rights
Subject to this Agreement, Provider grants Customer a **limited, non-exclusive, non-transferable,
revocable** right to access and use the Services during the subscription term, solely for Customer's
internal business purposes.

## 4. Acceptable Use
Customer shall not:
- reverse engineer the Services or access their source code;
- resell or sublicense the Services without authorization;
- circumvent security controls or perform unauthorized security testing;
- upload malicious code; or
- use the Services in violation of applicable law.

## 5. Customer Responsibilities
Customer shall maintain account security, manage its users' permissions, ensure its use is lawful,
obtain any required consents, keep Customer Data accurate, and comply with applicable laws. Customer
remains responsible for all activity under its accounts.

## 6. Services & Support
Provider will make the Services available during the subscription period, provide support in
accordance with any applicable **SLA**, and use commercially reasonable efforts to maintain
availability. Uptime commitments and response times, if any, are defined in the SLA.

## 7. Fees & Payment
Customer shall pay the fees in each Order Form and SOW. Invoices are due {{payment_terms}} from the
invoice date. Overdue amounts may accrue interest at 1.5% per month or the maximum permitted by law,
whichever is lower. Fees exclude taxes (other than taxes on Provider's income). Customer must
dispute an invoice in good faith within 10 days and pay the undisputed portion when due.

## 8. Intellectual Property
**Provider** retains all right, title, and interest in the Services, software, models, algorithms,
APIs, Documentation, trademarks, platform infrastructure, and any improvements. **Customer** retains
ownership of Customer Data, Customer content, and Customer branding. Provider may use feedback and
suggestions without restriction or obligation.

## 9. Confidentiality
Each Party will protect the other's Confidential Information, use it only to perform under this
Agreement, and not disclose it except to personnel and advisors bound by comparable obligations.
This excludes information that is public, already known, independently developed, or rightfully
received from a third party. A Party may disclose Confidential Information if compelled by law,
with prompt notice to the other Party where legally permitted. These obligations survive for
**five (5) years** after termination; trade secrets remain protected for as long as they qualify.

## 10. Data Protection
If Provider processes personal data on Customer's behalf, the Parties will execute a **Data
Processing Addendum (DPA)**, which governs that processing. Provider will maintain reasonable
safeguards, including encryption, access controls, backups, and incident-response procedures.

## 11. AI Services (Conditional)
Where the Services include AI features, they are governed by the **AI Addendum**. AI output may
contain inaccuracies or "hallucinations," and Customer will independently review output before
relying on it. Provider will not use Customer Data to train models unless expressly authorized, and
will disclose any third-party model providers (e.g. OpenAI, Anthropic, Google) in the Documentation.

## 12. Warranties; Disclaimer
Provider warrants that it has authority to enter this Agreement and that the Services will be
performed professionally and will substantially conform to the Documentation. For breach of this
warranty, Provider will repair or re-perform the affected Services or, if that is not commercially
reasonable, refund the fees paid for them — Customer's exclusive remedy. Customer must report
warranty claims in writing within 30 days of discovering the nonconformity. EXCEPT AS EXPRESSLY
STATED, THE SERVICES ARE PROVIDED "AS IS" AND PROVIDER DISCLAIMS ALL OTHER WARRANTIES, INCLUDING
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

## 13. Indemnification
Provider will defend and indemnify Customer against third-party claims that the Services infringe
intellectual-property rights. If the Services become (or Provider believes they may become) subject
to such a claim, Provider may modify or replace them with a functional equivalent or, if neither is
commercially reasonable, terminate the affected Order Form or SOW and refund prepaid unused fees —
Customer's exclusive remedy for infringement claims. Customer will defend and indemnify Provider
against claims arising from Customer Data, Customer's unlawful use, or Customer misconduct.

## 14. Limitation of Liability
EXCEPT FOR FRAUD, WILLFUL MISCONDUCT, BREACH OF CONFIDENTIALITY, OR INDEMNIFICATION OBLIGATIONS,
NEITHER PARTY WILL BE LIABLE FOR INDIRECT, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS,
REVENUE, OR BUSINESS. EACH PARTY'S MAXIMUM AGGREGATE LIABILITY SHALL NOT EXCEED {{liability_cap}}.

## 15. Term & Termination
This Agreement begins on the Effective Date and continues for an initial term of {{term_length}},
auto-renewing for successive one-year terms unless a Party gives 30 days' notice of non-renewal.
Either Party may terminate for material breach uncured within 30 days of notice, for convenience on
{{termination_notice}} notice, or immediately upon the other's insolvency or cessation of business.

## 16. Effect of Termination
Upon termination, Customer's access to the Services ends, all accrued fees become due, and
confidentiality obligations survive. Customer may export its Customer Data for **30 days** after
termination, after which Provider may delete it.

## 17. Non-Solicitation, Publicity & Notices
During the term and for 12 months after, neither Party will solicit for employment any of the
other's personnel who worked on the Services. Neither Party will use the other's name or logo
publicly without prior written consent. All notices under this Agreement must be in writing, sent
to the addresses or emails on the first page, and are effective upon receipt.

## 18. Governing Law & Disputes
This Agreement is governed by the laws of the State of {{governing_state}}, excluding its
conflict-of-law principles. The Parties will attempt good-faith negotiation before litigation; the
exclusive venue is the state or federal courts located in {{dispute_venue}}.

## 19. Miscellaneous
This Agreement plus its Order Forms, SOWs, and addenda is the entire agreement and supersedes prior
discussions. Amendments must be signed by both Parties. Neither Party may assign without consent,
except in a merger or sale of substantially all assets. Neither Party is liable for delays beyond
its reasonable control. The Parties are independent contractors; nothing in this Agreement creates
a partnership, joint venture, employment relationship, or agency. During the term, Provider will
maintain commercially reasonable insurance (including cyber liability) and will provide
certificates of insurance on request. There are no third-party beneficiaries to this Agreement. If
any provision is unenforceable, the rest remains in effect. This Agreement may be executed in
counterparts, including by electronic signature.

## 20. Attachments
The following may be attached and incorporated as executed: **A** — Order Form; **B** — Statement
of Work (SOW); **C** — Service Level Agreement (SLA); **D** — Data Processing Addendum (DPA);
**E** — AI Addendum; **F** — Security Addendum.

*IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.*

[[SIGNATURES]]

## 📤 What to do next
Sign **once** per customer, then attach an Order Form / SOW per project. Attach the **DPA** whenever
you process personal data and the **AI Addendum** whenever AI features are involved — this MSA
points to both rather than repeating them. Enterprise or regulated customers will usually redline
this and may require an SLA, security addendum, or insurance minimums — route significant changes
through counsel. Keep the MSA + every SOW together in the customer record.

> Draft modeled on standard startup services agreements (Common Paper / Bonterms). Not legal advice.
"""

MSA_VENDOR_FIELDS = [
    *_MSA_COMPANY_FIELDS,
    DocField(key="vendor_name", label="Vendor name", placeholder="Acme Solutions LLC"),
    DocField(key="vendor_type", label="Vendor type", placeholder="Delaware LLC"),
    DocField(key="vendor_address", label="Vendor address", kind="textarea"),
    DocField(key="vendor_email", label="Vendor email"),
    DocField(key="vendor_signatory_name", label="Vendor signatory name"),
    DocField(key="vendor_signatory_title", label="Vendor signatory title"),
    DocField(
        key="insurance_minimum",
        label="Vendor insurance minimum (per claim)",
        kind="money",
        placeholder="$1,000,000",
    ),
]
MSA_VENDOR_TEMPLATE = """\
# Master Services Agreement (MSA)

This Master Services Agreement ("Agreement") is made as of {{effective_date}} (the "Effective
Date"), by and between the parties below. The Company **purchases** services from the Vendor; the
terms are oriented to protect the Company as the purchasing party.

[[PARTIES]]

The Company and the Vendor are sometimes referred to individually as a "Party" and collectively as
the "Parties".

## 1. Purpose & Structure
This Agreement sets the general terms under which the Vendor provides services to the Company.
Specific work is defined in **Statements of Work ("SOWs")** or **Order Forms** executed by both
Parties, each incorporating this Agreement by reference; a **Data Processing Addendum** applies
whenever the Vendor processes personal data, and an **AI Addendum** applies whenever the Vendor
uses AI in delivery. This Agreement does not authorize any services on its own. If an SOW conflicts
with this Agreement, this Agreement controls unless the SOW expressly overrides a specific section
by name.

## 2. Term
This Agreement begins on the Effective Date and continues for an initial term of {{term_length}}
unless terminated earlier in accordance with Section 12, renewing for successive one-year terms
unless either Party gives written notice of non-renewal at least 30 days before the end of the
then-current term.

## 3. Fees & Payment
The Company shall pay the fees set forth in each SOW, {{payment_terms}} from the invoice date, only
for services and deliverables accepted under Section 4. Fees are exclusive of taxes; the Vendor is
responsible for its own taxes. Fees are fixed for the term of each SOW, and the Company will not
reimburse expenses unless approved in writing in advance.

## 4. Acceptance
The Company has 10 business days from delivery to review each deliverable and accept it or reject
it in writing with reasons. The Vendor will correct rejected deliverables and resubmit at no
additional charge. Payment obligations for a deliverable arise only upon acceptance.

## 5. Independent Contractor; Personnel; Subcontracting
The Vendor is an independent contractor responsible for its own personnel, payroll taxes, and
benefits. Nothing in this Agreement creates a partnership, joint venture, employment relationship,
or agency. The Vendor may not subcontract without the Company's prior written consent, remains
fully responsible for any approved subcontractor, and will ensure everyone performing services is
bound by confidentiality and IP terms at least as protective as this Agreement.

## 6. Confidentiality
The Vendor will use the Company's Confidential Information (non-public information a reasonable
person would understand to be confidential) only to perform under this Agreement, protect it with
no less than reasonable care, and not disclose it except to personnel bound by comparable
obligations, or as compelled by law with prompt notice to the Company. These obligations survive
for 3 years after termination; trade secrets remain protected for as long as they qualify as such.

## 7. Intellectual Property (Company-favorable)
All deliverables created by the Vendor for the Company are works made for hire owned by the
Company; to the extent any deliverable is not a work made for hire, the Vendor irrevocably assigns
all right, title, and interest in it to the Company and waives moral rights. The Vendor retains its
pre-existing tools and materials, but grants the Company a perpetual, worldwide, royalty-free
license to use anything of the Vendor's embedded in a deliverable. The Vendor will not incorporate
third-party or open-source material that restricts the Company's ownership or use without prior
written consent.

## 8. Warranties
The Vendor warrants that it will perform the services in a professional and workmanlike manner
consistent with industry standards; that the deliverables are original, will conform to the
requirements in the applicable SOW, and will not infringe any third party's rights; that the
deliverables contain no viruses or malicious code; and that it will comply with all applicable laws
(including anti-bribery laws such as the U.S. FCPA and UK Bribery Act) in performing the services.

## 9. Insurance
During the term and for one year after, the Vendor will maintain, with reputable insurers,
commercial general liability and professional liability (errors & omissions) insurance of at least
{{insurance_minimum}} per claim — plus cyber liability insurance at the same minimum if the Vendor
accesses Company systems or personal data — and will provide certificates of insurance on request.

## 10. Data Protection & Security
If the Vendor accesses the Company's systems or processes personal data on its behalf, the Vendor
will use reasonable administrative, technical, and physical safeguards, use such data only to
perform the services, notify the Company of any security breach **within 72 hours** of discovery
(bearing the reasonable costs of remediation and required notifications for breaches it causes),
and execute a Data Processing Addendum if the Company requires one.

## 11. Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE FOR INDIRECT, INCIDENTAL,
SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. THE VENDOR'S CUMULATIVE LIABILITY SHALL NOT EXCEED
{{liability_cap}}. These limits do not apply to the Vendor's indemnification obligations or its
breach of Section 6 (Confidentiality), Section 7 (Intellectual Property), or Section 10 (Data
Protection & Security). The Company's total liability is limited to fees owed under the applicable
SOW.

## 12. Termination; Effect of Termination
The Company may terminate this Agreement or any SOW for convenience on {{termination_notice}}
written notice, or immediately for the Vendor's material breach not cured within 15 days of written
notice. Upon termination: the Vendor promptly delivers all completed and in-progress work; returns
or destroys (and certifies destruction of) all Company Confidential Information, data, credentials,
and property; the Company pays for work accepted through the effective date; and the Vendor refunds
any prepaid fees for work not delivered. Sections 6–11 and 13–15, and accrued payment obligations,
survive termination.

## 13. Indemnification
The Vendor will defend, indemnify, and hold harmless the Company against third-party claims arising
out of infringement by the deliverables, a security or data breach caused by the Vendor, the
Vendor's breach of this Agreement or violation of law, and any claim that Vendor personnel are
employees of the Company.

## 14. Non-Solicitation; Publicity; Notices
During the term and for 12 months after, neither Party will solicit for employment any employee or
contractor of the other who worked on the services, except through general job postings. The Vendor
may not use the Company's name or logo publicly without prior written consent. All notices must be
in writing, sent to the addresses or emails on the first page, and are effective upon receipt.

## 15. Governing Law & Miscellaneous
This Agreement is governed by the laws of the State of {{governing_state}}, without regard to its
conflict of law principles; disputes will be resolved in the state or federal courts located in
{{dispute_venue}}. This Agreement plus its SOWs and addenda is the entire agreement and supersedes
all prior discussions; amendments must be in a signed writing. The Vendor may not assign this
Agreement without the Company's consent. If any provision is unenforceable, the rest remains in
effect. This Agreement may be executed in counterparts, including by electronic signature.

## 16. Attachments
The following may be attached and incorporated as executed: **A** — Statement of Work / Order Form;
**B** — Data Processing Addendum (DPA); **C** — AI Addendum; **D** — Security requirements.

*IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.*

[[SIGNATURES]]

## 📤 What to do next
Use this when the company **hires** a vendor/agency. The IP, acceptance, insurance, indemnity, and
liability clauses run in the company's favor (the reverse of the client-facing MSA) — set the
termination notice short (15 days is common on the buy side). Attach an SOW per engagement, a DPA
if the vendor touches personal data, and collect the certificate of insurance before work starts.

> Modeled on standard buy-side procurement MSAs (Common Paper framework). Not legal advice.
"""

SOW_FIELDS = [
    DocField(key="company_address", label="Company address", kind="textarea"),
    DocField(key="company_email", label="Company email", placeholder="legal@company.com"),
    DocField(key="signatory_name", label="Company contact / signatory", placeholder="e.g. the CEO"),
    DocField(
        key="signatory_title", label="Company signatory title", placeholder="CEO"
    ),
    DocField(key="client_name", label="Customer name", placeholder="Acme Solutions LLC"),
    DocField(key="client_address", label="Customer address", kind="textarea"),
    DocField(key="client_email", label="Customer email"),
    DocField(key="client_signatory_name", label="Customer contact / signatory"),
    DocField(key="client_signatory_title", label="Customer signatory title"),
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="related_msa_date", label="Related MSA date", placeholder="the MSA's date"),
    DocField(key="project_name", label="Project name", placeholder="Analytics Dashboard"),
    DocField(key="project_description", label="Project description", kind="textarea"),
    DocField(
        key="out_of_scope",
        label="Out of scope (one item per line)",
        kind="textarea",
        placeholder="Mobile app development\nOngoing maintenance after launch",
    ),
    DocField(
        key="assumptions",
        label="Assumptions & dependencies (one per line)",
        kind="textarea",
        placeholder="Customer provides API access within 5 business days of signing",
    ),
    DocField(
        key="deliverables_rows",
        label="Deliverables — one per line: # | Deliverable | Description | Acceptance Criteria",
        kind="textarea",
        placeholder="1 | Requirements Document | Functional + technical requirements | Approved",
    ),
    DocField(
        key="milestones_rows",
        label="Milestones — one per line: Milestone | Description | Target Date",
        kind="textarea",
        placeholder="M1 | Requirements Finalized | May 27, 2026",
    ),
    DocField(
        key="fees_rows",
        label="Payments — one per line: Phase | Amount (USD) | Due Date",
        kind="textarea",
        placeholder="Upon SOW Signing (25%) | $12,500 | May 20, 2026",
    ),
    DocField(key="total_fee", label="Total project fee", kind="money", placeholder="$50,000 USD"),
    DocField(
        key="payment_structure", label="Payment structure", placeholder="25% Milestone-Based"
    ),
    DocField(
        key="acceptance_days",
        label="Acceptance review window (business days)",
        kind="number",
        placeholder="5",
    ),
    DocField(key="governing_state", label="Governing law (state)", placeholder="Delaware"),
]
SOW_TEMPLATE = """\
# Statement of Work (SOW)

This Statement of Work ("SOW") is effective as of {{effective_date}} (the "Effective Date"), under
the Master Services Agreement dated {{related_msa_date}} between the parties below.

[[PARTIES]]

## 1. Project Overview
The Company will provide the services described in this SOW to the Customer.

**Project Name:** {{project_name}}

**Project Description:** {{project_description}}

**Points of Contact:** {{signatory_name}} for the Company; {{client_signatory_name}} for the
Customer. Each contact is authorized to give day-to-day project direction and approvals; changes to
scope, timeline, or fees still require a Change Order under Section 6. Issues the contacts cannot
resolve within 10 days are escalated to an executive of each party for good-faith resolution before
either party exercises formal remedies.

## 2. Scope of Work & Deliverables
The Company will deliver the following:

| # | Deliverable | Description | Acceptance Criteria |
|---|---|---|---|
{{deliverables_rows}}

**Out of scope.** The following are excluded from this SOW and require a separate SOW or Change
Order:

{{out_of_scope}}

**Assumptions & dependencies.** The fees and timeline assume the following; if any proves untrue,
the Company may propose an equitable adjustment via Change Order:

{{assumptions}}

## 3. Project Timeline & Milestones

| Milestone | Description | Target Date |
|---|---|---|
{{milestones_rows}}

Dates may shift only within a change order signed by both parties. Delays caused by the Customer
(late feedback, materials, or access) extend the affected dates day-for-day.

## 4. Fees & Payment Schedule

| Phase | Amount (USD) | Due Date |
|---|---|---|
{{fees_rows}}

**Total Project Fee: {{total_fee}}** ({{payment_structure}})

Invoices are payable per the payment terms of the MSA. Out-of-pocket expenses are reimbursable only
at cost and only with the Customer's prior written approval.

## 5. Acceptance
The Customer has {{acceptance_days}} business days from delivery of each deliverable to accept it
or reject it in writing, identifying specifically how it fails the acceptance criteria in Section
2. The Company will correct and resubmit rejected deliverables at no additional charge. A
deliverable is deemed accepted if the Customer does not reject it within the review window or puts
it into productive use.

## 6. Change Requests
Any changes to the scope, timeline, or fees must be documented in a Change Order signed by both
parties. Neither party is obligated to perform changed work until the Change Order is signed.

## 7. Termination
Either party may terminate this SOW for material breach if the breach is not cured within 15 days
of written notice. On termination, the Customer will pay for all work performed and deliverables
accepted through the effective date of termination, and the Company will hand over work in
progress that has been paid for.

## 8. Order of Precedence & Governing Law
This SOW is governed by the Master Services Agreement dated {{related_msa_date}} and shall be
interpreted in accordance with the laws of the State of {{governing_state}}. If this SOW conflicts
with the MSA, the MSA controls unless this SOW expressly overrides a specific section by name.

*IN WITNESS WHEREOF, the Parties have executed this SOW as of the Effective Date.*

[[SIGNATURES]]

## 📤 What to do next
Attach to the signed MSA. Enter each deliverable, milestone, and payment as one row per line, with
values separated by " | ". Make acceptance criteria objective ("loads in under 2s", "approved by
X") — vague criteria are the #1 source of services disputes. Use a signed Change Order for
anything outside this scope.

> Draft for review. Not legal advice.
"""

_ORDER_PARTY_FIELDS = [
    DocField(key="company_address", label="Company address", kind="textarea"),
    DocField(key="company_email", label="Company email", placeholder="legal@company.com"),
    DocField(key="signatory_name", label="Company contact / signatory", placeholder="e.g. the CEO"),
    DocField(key="signatory_title", label="Company signatory title", placeholder="CEO"),
    DocField(key="client_name", label="Customer name", placeholder="Acme Solutions LLC"),
    DocField(key="client_address", label="Customer address", kind="textarea"),
    DocField(key="client_email", label="Customer email"),
    DocField(key="client_signatory_name", label="Customer contact / signatory"),
    DocField(key="client_signatory_title", label="Customer signatory title"),
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="related_msa_date", label="Related MSA date", placeholder="the MSA's date"),
]

SLA_FIELDS = [
    *_ORDER_PARTY_FIELDS,
    DocField(
        key="service_description",
        label="Service covered by this SLA",
        kind="textarea",
        placeholder="The hosted platform and API described in the Order Form",
    ),
    DocField(key="uptime_target", label="Uptime target", placeholder="99.9%"),
    DocField(
        key="measurement_period", label="Measurement period", placeholder="calendar month"
    ),
    DocField(
        key="support_hours",
        label="Support channels & hours",
        placeholder="Email support, Mon–Fri 9:00–18:00 ET",
    ),
    DocField(
        key="support_rows",
        label="Support tiers — one per line: Severity | Description | Response Time",
        kind="textarea",
        placeholder="P1 | Service down for all users | 1 business hour",
    ),
    DocField(
        key="credit_rows",
        label="Service credits — one per line: Monthly Uptime | Credit (% of monthly fee)",
        kind="textarea",
        placeholder="Below 99.9% | 10%",
    ),
    DocField(key="credit_cap", label="Credit cap per period", placeholder="30% of monthly fees"),
    DocField(key="claim_window", label="Credit claim window", placeholder="30 days"),
    DocField(
        key="maintenance_window",
        label="Scheduled maintenance window",
        placeholder="Sundays 02:00–06:00 UTC, with 48 hours' notice",
    ),
]
SLA_TEMPLATE = """\
# Service Level Agreement (SLA)

This Service Level Agreement is effective as of {{effective_date}} (the "Effective Date") as an
addendum to the Master Services Agreement dated {{related_msa_date}} (the "MSA") between the
parties below. Capitalized terms not defined here have the meanings in the MSA.

[[PARTIES]]

## 1. Covered Service & Definitions
This SLA covers: {{service_description}}

"Downtime" means the covered Service is unavailable to all or substantially all users, other than
Excused Downtime (Section 3). "Uptime" is the percentage of total minutes in each
{{measurement_period}} that the Service is not in Downtime, as measured by the Provider's
monitoring systems, which are the system of record for this SLA.

## 2. Uptime Commitment
The Provider will maintain Uptime of at least **{{uptime_target}}** in each {{measurement_period}}.

## 3. Excused Downtime
Downtime does not include unavailability caused by: (a) scheduled maintenance performed within the
window of {{maintenance_window}}; (b) emergency maintenance, with notice as soon as practicable;
(c) the Customer's systems, configurations, or misuse; (d) third-party services or networks outside
the Provider's reasonable control; (e) force majeure events; or (f) beta, trial, or free features.

## 4. Support
The Provider offers support via {{support_hours}}, with the following targets:

| Severity | Description | Response Time |
|---|---|---|
{{support_rows}}

Issues the support process cannot resolve are escalated to an executive of each party for
good-faith resolution.

## 5. Service Credits
If Uptime falls below the commitment in a {{measurement_period}}, the Customer's **sole and
exclusive remedy** is a credit against future invoices, per the schedule below, capped at
{{credit_cap}} per {{measurement_period}}:

| Monthly Uptime | Credit (% of monthly fee) |
|---|---|
{{credit_rows}}

Credits must be claimed in writing within {{claim_window}} of the end of the affected
{{measurement_period}}, are not redeemable for cash, and do not apply to fees already overdue.

## 6. Chronic Failure
If Uptime falls below the commitment in three (3) consecutive measurement periods, the Customer may
terminate the affected Order Form on written notice and receive a refund of prepaid fees for the
unused remainder of the Subscription Term. This is in addition to accrued service credits.

## 7. Order of Precedence
This SLA is governed by the MSA. If this SLA conflicts with the MSA, this SLA controls for service
levels, support, and credits; the MSA controls everything else, including the limitation of
liability, which applies to this SLA.

*IN WITNESS WHEREOF, the parties have executed this SLA as of the Effective Date.*

[[SIGNATURES]]

## 📤 What to do next
Attach to the signed MSA (Exhibit C in the MSA's attachment list). Commit only to an uptime target
your current infrastructure actually delivers — check your last 6 months of monitoring before
promising 99.9%. Undefined maintenance windows are a top source of SLA disputes, so keep the window
specific. Enter support tiers and credits as one row per line, values separated by " | ".

> Draft for review. Not legal advice.
"""

ADVISOR_FIELDS = [
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="advisor_name", label="Advisor full legal name"),
    DocField(key="advisor_address", label="Advisor address", kind="textarea"),
    DocField(key="advisor_email", label="Advisor email"),
    DocField(
        key="service_level",
        label="Services level (Schedule A)",
        placeholder="Standard / Strategic / Expert",
    ),
    DocField(
        key="company_stage",
        label="Company stage (Schedule B)",
        placeholder="Pre-Seed / Seed / Series A",
    ),
    DocField(
        key="equity_pct",
        label="Advisor equity % (from the Schedule A grid)",
        kind="number",
        placeholder="e.g. 0.50 — grid tops out at 1.00; above that see the note",
    ),
    DocField(
        key="cash_fee",
        label="Cash fee, if any (or 'None')",
        placeholder="None / $2,000 monthly retainer — collect a W-9",
    ),
    DocField(
        key="term",
        label="Term",
        placeholder="until terminated on 5 days' written notice (FAST default)",
    ),
    DocField(
        key="prior_inventions",
        label="Exhibit A — advisor's prior/excluded IP (or 'None')",
        kind="textarea",
        placeholder="Anything the advisor made before that stays theirs — or 'None'",
    ),
    DocField(key="company_address", label="Company address", kind="textarea"),
    DocField(key="signatory_name", label="Company signatory name", placeholder="e.g. the CEO"),
    DocField(key="signatory_title", label="Company signatory title", placeholder="CEO"),
]
ADVISOR_TEMPLATE = """\
# Founder Advisor Standard Template (FAST)

This Founder Advisor Standard Template v3.0 (this "Agreement") is entered into as of
{{effective_date}} by and between **{{company.name}}** (the "Company") and **{{advisor_name}}**
(the "Advisor"). This FAST is available at fi.co/fast, and the parties agree that neither has
modified the form, except to fill in blanks and bracketed terms.

[[PARTIES]]

## FAST Terms

| Term | Value |
|---|---|
| Company Name | {{company.name}} |
| Effective Date | {{effective_date}} |
| Governing Law | {{company.jurisdiction}} (jurisdiction of incorporation) |
| Services | {{service_level}} (per Schedule A) |
| Company Stage | {{company_stage}} (per Schedule B) |
| Advisor Equity Compensation | {{equity_pct}}% (fully diluted) |
| Type of Security | Non-Qualified Stock Options (advisors cannot receive ISOs) |
| Total Number of Stock Options | Set in the definitive Stock Option Agreement, which supersedes |
| Exercise Price | Fair market value (409A) of the Common Stock at the Effective Date |
| Vesting | Monthly pro rata over 2 years, 3-month cliff; 100% accelerates on sale |
| Cash Fee (if any) | {{cash_fee}} |
| Term | {{term}} |

## 1. Services
Advisor agrees to act as a mentor or advisor to the Company and provide advice and assistance from
time to time as described on Schedule A or as otherwise mutually agreed (the "Services").

## 2. Compensation
For the Services, Advisor receives the compensation in the FAST Terms above. Percentages are based
on the outstanding Common Stock, calculated on a fully diluted basis of all outstanding and
convertible or issuable securities as of the Effective Date. The Company will seek written Board
approval of the Advisor compensation and deliver definitive stock option purchase agreements within
ninety (90) days of this Agreement; failing that, the Advisor may contact directors of the Company.

## 3. Expenses
Advisor is not reimbursed for expenses without prior written authorization following a detailed
request that includes a maximum amount.

## 4. Term and Termination
This Agreement continues until terminated by either party for any reason on five (5) days' prior
written notice, without further obligation except compensation earned through termination.

## 5. Independent Contractor
Advisor is an independent contractor, not an employee: no employee benefits, no tax withholding
(taxes are Advisor's responsibility), and no authority to bind the Company without prior written
authorization.

## 6. Nondisclosure of Confidential Information
Advisor will not use or disclose the Company's Confidential Information except to perform the
Services, will protect it with reasonable care, and will return or destroy it on request.
"Confidential Information" means all non-public business, technical, or financial information
designated as, or reasonably understood to be, confidential — including source code, inventions,
roadmaps, financial projections, and customer data — excluding information rightfully known before
disclosure or public through no fault of Advisor; disclosure compelled by law is permitted with
prompt notice. No rights under any Company intellectual property are granted beyond the limited
right to use Confidential Information for the Services.

## 7. Assignment of Intellectual Property
Any inventions, works of authorship, developments, know-how, improvements or trade secrets that
clearly relate to the Company's business or technology and are created by Advisor in the course of
performing Services are "work made for hire" for the Company, and Advisor hereby assigns all right,
title and interest in them to the Company. Advisor's prior or excluded IP is listed on
**Exhibit A**.

## 8. Duty to Assist
As reasonably requested and only for Intellectual Property created for the Company, Advisor will
take all steps reasonably necessary to help the Company obtain and enforce such rights, continuing
beyond termination.

## 9. Company's Right to Disclose
During the term, the Company may disclose this Agreement and Advisor's status, and use Advisor's
name, image and profile in promotional and offering materials.

## 10. No Conflicts; Miscellaneous
Advisor represents that performing the Services violates no duty to any other person or entity, and
will promptly notify the Company in writing of any competitor Advisor also serves. Amendments and
waivers require written consent of both parties; this Agreement (with its schedules) is the entire
agreement, is governed by the Governing Law in the FAST Terms, and may be executed in counterparts.

## Schedule A — Services Based on Performance Level

| Level | Monthly Commitment | Pre-Seed | Seed | Series A |
|---|---|---|---|---|
| Standard (top 50%) | 5–10 hrs; quarterly meetings; responsive; intros | 0.50% | 0.25% | 0.10% |
| Strategic (top 25%) | + monthly meetings; deal meetings; recruiting | 0.75% | 0.50% | 0.25% |
| Expert (top 10%) | + bi-monthly; marquee intros; strategic project | 1.00% | 0.75% | 0.50% |

## Schedule B — Company Stage

| Stage | Characteristics |
|---|---|
| Pre-Seed | 1–3 cofounders; validating demand; little revenue; MVP |
| Seed | Full-time founders; LOIs; initial revenue; validated product |
| Series A | Employees; significant traction and revenue; scalable product |

## Exhibit A — Advisor's Prior / Excluded Intellectual Property

{{prior_inventions}}

*The parties have executed this Agreement as of the Effective Date.*

[[SIGNATURES]]

## 📤 What to do next
The compensation case decides the path (StartupKit case matrix):
- **Grid equity (≤1%)** — needs an adopted equity plan, current 409A, and a **Board consent
  approving the grant**; deliver the option agreement within 90 days; restricted stock instead of
  options → **83(b) within 30 days**.
- **Above ~1% (e.g. 4%)** — grid override: use **4-year vesting or milestones**, check pool
  capacity, and record the Board's rationale. Grants that size usually mean the person is really a
  co-founder — consider the FSPA path; counsel review above ~1.5–2%.
- **Cash only** — ignore the equity rows (write 0%), collect a **W-9**, issue a **1099-NEC** at
  $600+/yr; no plan, 409A, or equity consent needed.
- **Salary?** Then they're an employee, not an advisor — use the W6 offer-letter path instead.

> The official FAST v3.0 (Founder Institute, fi.co/fast). Not legal advice.
"""

# LLC variant — FAST base with the equity section replaced by a profits-interest award; picked up
# automatically by catalog._build_w2_llc via the "-llc" key.
ADVISOR_LLC_FIELDS = [
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="advisor_name", label="Advisor full legal name"),
    DocField(key="advisor_address", label="Advisor address", kind="textarea"),
    DocField(key="advisor_email", label="Advisor email"),
    DocField(
        key="service_level",
        label="Services level (Schedule A)",
        placeholder="Standard / Strategic / Expert",
    ),
    DocField(
        key="company_stage",
        label="Company stage (for sizing the % via the grid)",
        placeholder="Pre-Seed / Seed / Series A",
    ),
    DocField(
        key="pi_grant",
        label="Profits-interest grant (units or %) — or 'None' if cash-only",
        placeholder="e.g. 50,000 units (0.50%) — or 'None'",
    ),
    DocField(
        key="liquidation_threshold",
        label="Liquidation threshold (LLC value at grant)",
        kind="money",
        placeholder="the 'strike-equivalent' — participation only above this value",
    ),
    DocField(
        key="vesting",
        label="Vesting",
        placeholder="monthly over 2 years, 3-month cliff (FAST default)",
    ),
    DocField(
        key="cash_fee",
        label="Cash fee, if any (or 'None')",
        placeholder="None / $2,000 monthly retainer — collect a W-9",
    ),
    DocField(
        key="term",
        label="Term",
        placeholder="until terminated on 5 days' written notice (FAST default)",
    ),
    DocField(
        key="prior_inventions",
        label="Exhibit A — advisor's prior/excluded IP (or 'None')",
        kind="textarea",
        placeholder="Anything the advisor made before that stays theirs — or 'None'",
    ),
    DocField(key="company_address", label="Company address", kind="textarea"),
    DocField(
        key="signatory_name", label="Company signatory name", placeholder="Member / Manager name"
    ),
    DocField(
        key="signatory_title",
        label="Company signatory title",
        placeholder="Manager / Managing Member",
    ),
]
ADVISOR_LLC_TEMPLATE = """\
# Founder Advisor Standard Template (FAST) — LLC

This Agreement, based on the Founder Advisor Standard Template v3.0, is entered into as of
{{effective_date}} by and between **{{company.name}}**, a {{company.jurisdiction}} limited
liability company (the "Company"), and **{{advisor_name}}** (the "Advisor"). An LLC cannot issue
stock or options, so the FAST equity section is replaced by a **profits-interest award** (or a cash
fee).

[[PARTIES]]

## FAST Terms

| Term | Value |
|---|---|
| Company Name | {{company.name}} |
| Effective Date | {{effective_date}} |
| Governing Law | {{company.jurisdiction}} (state of formation) |
| Services | {{service_level}} (per Schedule A) |
| Company Stage | {{company_stage}} (per Schedule B) |
| Equity Compensation | Profits interest: {{pi_grant}} |
| Liquidation Threshold | {{liquidation_threshold}} (participation only in value above this) |
| Vesting | {{vesting}} |
| Cash Fee (if any) | {{cash_fee}} |
| Term | {{term}} |

## 1. Services
Advisor agrees to act as a mentor or advisor to the Company and provide advice and assistance from
time to time as described on Schedule A or as otherwise mutually agreed (the "Services").

## 2. Compensation — Profits Interest and/or Cash Fee
For the Services, Advisor receives the compensation in the FAST Terms above.

**(a) Profits interest.** Any equity compensation is granted as a **profits interest** in the
Company (membership units participating only in value above the Liquidation Threshold), documented
in a definitive Profits-Interest Award Agreement that supersedes this section, and subject to: (i)
the Operating Agreement **authorizing profits interests** (or being amended to do so) and admitting
Advisor as a Member per its terms; (ii) approval by the Members or Manager(s) as the Operating
Agreement requires; and (iii) entry in the membership ledger with a capital account. The grant is
intended to qualify under Rev. Proc. 93-27 / 2001-43, and Advisor should file a **protective 83(b)
election within 30 days** of grant.

**(b) Tax status disclosure.** Receiving a profits interest makes Advisor a **member (K-1
partner)**: Advisor receives a Schedule K-1, pays self-employment tax on allocable income, and
cannot simultaneously be a W-2 employee of the Company.

**(c) Cash fee.** Any cash fee is an independent-contractor fee (not a guaranteed payment unless
Advisor is already a Member): collect a W-9 and issue a 1099-NEC at $600+/year.

## 3. Expenses
Advisor is not reimbursed for expenses without prior written authorization following a detailed
request that includes a maximum amount.

## 4. Term and Termination
This Agreement continues until terminated by either party for any reason on five (5) days' prior
written notice, without further obligation except compensation earned through termination.

## 5. Independent Contractor
Except as provided in Section 2(b) upon a profits-interest grant, Advisor is an independent
contractor, not an employee: no employee benefits, no tax withholding, and no authority to bind the
Company without prior written authorization.

## 6. Nondisclosure of Confidential Information
Advisor will not use or disclose the Company's Confidential Information except to perform the
Services, will protect it with reasonable care, and will return or destroy it on request.
"Confidential Information" means all non-public business, technical, or financial information
designated as, or reasonably understood to be, confidential — excluding information rightfully
known before disclosure or public through no fault of Advisor; disclosure compelled by law is
permitted with prompt notice. No rights under any Company intellectual property are granted beyond
the limited right to use Confidential Information for the Services.

## 7. Assignment of Intellectual Property
Any inventions, works of authorship, developments, know-how, improvements or trade secrets that
clearly relate to the Company's business or technology and are created by Advisor in the course of
performing Services are "work made for hire" for the Company, and Advisor hereby assigns all right,
title and interest in them to the Company. Advisor's prior or excluded IP is listed on
**Exhibit A**.

## 8. Duty to Assist; Right to Disclose; No Conflicts; Miscellaneous
As in FAST: Advisor will reasonably assist the Company in perfecting and enforcing assigned IP
(surviving termination); the Company may disclose Advisor's status and use Advisor's name and
profile in materials; Advisor represents no conflicting duties and will disclose service to
competitors; amendments require written consent; this Agreement is the entire agreement, governed
by the law of the state of formation, executable in counterparts.

## Schedule A — Services Based on Performance Level

| Level | Monthly Commitment | Pre-Seed | Seed | Series A |
|---|---|---|---|---|
| Standard (top 50%) | 5–10 hrs; quarterly meetings; responsive; intros | 0.50% | 0.25% | 0.10% |
| Strategic (top 25%) | + monthly meetings; deal meetings; recruiting | 0.75% | 0.50% | 0.25% |
| Expert (top 10%) | + bi-monthly; marquee intros; strategic project | 1.00% | 0.75% | 0.50% |

## Schedule B — Company Stage

| Stage | Characteristics |
|---|---|
| Pre-Seed | 1–3 cofounders; validating demand; little revenue; MVP |
| Seed | Full-time founders; LOIs; initial revenue; validated product |
| Series A | Employees; significant traction and revenue; scalable product |

## Exhibit A — Advisor's Prior / Excluded Intellectual Property

{{prior_inventions}}

*The parties have executed this Agreement as of the Effective Date.*

[[SIGNATURES]]

## 📤 What to do next
The LLC case decides the path (StartupKit case matrix):
- **Cash only** — simplest and fully self-serve: write 'None' for the profits interest, collect a
  W-9, 1099-NEC at $600+/yr.
- **Multi-member LLC + equity** — the profits-interest award needs the **Operating Agreement to
  authorize it (or an amendment)**, a liquidation threshold set at grant, a **protective 83(b) in
  30 days**, a membership-ledger entry — and makes the advisor a **K-1 partner**. Counsel-finalize
  the award agreement. Above ~1%, add long vesting/milestones, or consider **unit appreciation
  rights / phantom equity** instead (upside without a new member).
- **⚠ Single-member LLC + any equity — STOP.** A grant creates a second member and ends
  disregarded-entity status: the LLC becomes a **tax partnership** (Form 1065 + K-1s). Choose:
  phantom equity/cash bonus (keeps SM status), accept partnership conversion (counsel + new tax
  setup), or **convert to a C-Corp first** (right answer if VC-bound).
- **Raising soon?** Consider a **"grant effective upon conversion"** commitment instead of LLC
  equity that must be unwound — counsel drafts it; it fires in the conversion flow.
- **Salary?** Then they're an employee — use the W6 path.

> FAST v3.0 base (Founder Institute) with an LLC profits-interest compensation section. The award
> agreement itself is counsel-territory. Not legal or tax advice.
"""

# ================== W2 · Stage 5: Conditional & compliance ======================================

AI_ADDENDUM_FIELDS = [
    # Cover Page (Bonterms AI Addendum v2.0 structure) — entity-agnostic; the signature block and
    # entity descriptor adapt automatically (C-Corp: officer signs; LLC: authorized member/manager).
    DocField(key="effective_date", label="AI Addendum effective date", kind="date"),
    DocField(
        key="underlying_agreement",
        label="Main Agreement (which MSA/ToS this attaches to)",
        placeholder="e.g. the Master Services Agreement dated May 20, 2026",
    ),
    DocField(key="customer_name", label="Customer name"),
    DocField(key="customer_type", label="Customer type", placeholder="e.g. Delaware LLC"),
    DocField(key="customer_address", label="Customer address", kind="textarea"),
    DocField(key="customer_signatory_name", label="Customer signatory name"),
    DocField(key="customer_signatory_title", label="Customer signatory title"),
    DocField(
        key="model_providers",
        label="Current Model Providers (one per line — also keep in your Documentation)",
        kind="textarea",
        placeholder="OpenAI\nAnthropic\nAWS Bedrock",
    ),
    DocField(
        key="additional_terms",
        label="Additional Terms (control over the standard clauses) — or 'None'",
        kind="textarea",
        placeholder="None",
    ),
    DocField(key="company_address", label="Provider (company) address", kind="textarea"),
    DocField(key="signatory_name", label="Provider signatory name", placeholder="e.g. the CEO"),
    DocField(key="signatory_title", label="Provider signatory title", placeholder="CEO"),
]
AI_ADDENDUM_TEMPLATE = """\
# AI Addendum

## Cover Page

This AI Addendum (modeled on the **Bonterms Standard AI Addendum v2.0, Cover Page Version**) is
entered into between Customer and Provider by executing this Cover Page, effective
{{effective_date}} (the "AI Addendum Effective Date"). **Main Agreement:** {{underlying_agreement}}.

[[PARTIES]]

**Current Model Providers** (maintained in Provider's Documentation; Provider notifies Customer of
changes):
{{model_providers}}

**Additional Terms** (control over the standard terms below): {{additional_terms}}

## 1. Definitions
"**AI Features**" means all generative AI, large language model (LLM) or similar features of the
Cloud Service that generate content, code or data in response to Input (excluding ML used solely
for classification, ranking or non-generative analysis). "**Input**" is data or prompts Customer
submits to the AI Features; "**Output**" is what they generate in response. "**Customer Data**"
includes Input. "**Model Provider**" means any third-party provider of AI models, hosting or
inference used by Provider. "**Retention Period**" means 30 days. "**Main Agreement**" is
identified on the Cover Page; its definitions control where they overlap.

## 2. AI Features
This Addendum applies to the AI Features in the Cloud Service; Provider will identify them in the
Documentation or on request. For **New AI Features** that process Customer Data materially
differently, Provider will (a) give reasonable prior notice before enabling them by default, (b)
let Customer decline or disable them via administrative controls, and (c) ensure disabling them
does not materially reduce the core non-AI functionality of the Cloud Service.

## 3. Data Handling
**3.1 No Training.** Provider will not access, use or retain Input or Output to train, retrain or
fine-tune AI Features, any Model Provider models, or other AI/ML models.
**3.2 Operational Monitoring.** Provider may retain and internally review Input and Output for up
to the Retention Period solely to detect, prevent and remediate abuse, security incidents or
malfunctions — kept logically separated, need-to-know access only, and deleted automatically at the
end of the Retention Period (or the conclusion of a specific investigation).
**3.3 Inference.** Processing to operate the AI Features is subject to **tenant isolation** (no
shared caches, context windows or retrieval systems across customers) and **ephemeral processing**
(no retention beyond the session except as permitted above).

## 4. Intellectual Property
**Input** is Customer Data for all purposes under the Main Agreement. **Customer owns Output** —
Provider assigns Customer all of its right, title and interest (if any) in the Output; Provider
retains its IP in the Cloud Service. Due to the nature of generative AI, Output may not be unique
and different customers may receive similar Output.

## 5. Output Indemnification
Provider's indemnity under the Main Agreement is deemed to include third-party claims that
Customer's use of Output infringes a **copyright** (an "Output Claim") — excluding claims arising
from Customer (a) ignoring the Documentation or safety guardrails, (b) providing infringing Input
or Input designed to generate infringing Output, or (c) modifying or combining Output where the
infringement would not otherwise have occurred. Output Claims are subject to the Main Agreement's
general liability cap.

## 6. AI Warranties and Disclaimers
Provider will maintain commercially reasonable safety measures (content filtering, abuse
monitoring) designed to mitigate harmful or illegal Output. **Output disclaimer:** generative AI is
probabilistic — Output may contain errors, inaccuracies or biases; Provider makes no warranty about
Output accuracy, and Customer is solely responsible for reviewing Output before relying on or
publishing it. **No High-Risk AI:** Provider warrants the AI Features, as provided and used per the
Documentation, are not a "High-Risk AI System" under the EU AI Act unless disclosed in the
Documentation.

## 7. AI-Specific Use Restrictions
Customer will not (and will not permit third parties to) use the AI Features or Output to: (a)
train or fine-tune competing AI/ML models (model extraction or distillation); (b) represent Output
as approved or vetted by Provider; (c) represent Output as wholly human-generated; (d) make
automated decisions with legal or similarly significant effects on individuals without appropriate
human review; (e) violate any Model Provider acceptable-use policy made available to Customer; or
(f) engage in practices prohibited under the EU AI Act or equivalent law.

## 8. Model Providers
Provider maintains a current Model Provider list in its Documentation and notifies Customer before
changes take effect. Customer authorizes Provider to use Model Providers to process Input and
Output; Provider **remains responsible** for the AI Features and will ensure Model Providers are
bound by obligations materially consistent with Section 3. Customer is not required to contract
directly with Model Providers. Provider may temporarily suspend AI Features where a Model Provider
is unavailable or a material security or safety risk requires it, with prompt notice and
commercially reasonable restoration efforts.

## 9. General Terms
Additional Terms control over this Addendum. This Addendum is incorporated into the Main Agreement
and controls over it in a conflict; otherwise it is construed under the Main Agreement's terms.

*Executed by the parties as of the AI Addendum Effective Date.*

[[SIGNATURES]]

## 📤 What to do next
Attach to the Main Agreement whenever your product ships AI features. The template is
**entity-agnostic** — for a C-Corp an officer signs (authority per the Bylaws); for an LLC an
authorized Member or Manager signs per the Operating Agreement (single-member: the sole member).
Keep the Model Provider list in your Documentation current — §8 requires notice before changes.

> Modeled on the Bonterms Standard AI Addendum v2.0 (CC BY 4.0, bonterms.com). Not legal advice.
"""


DPA_FIELDS = [
    # Cover Page — Key Terms (Common Paper DPA v1.1 structure)
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(
        key="underlying_agreement",
        label="Underlying agreement this DPA supplements (name & date)",
        placeholder="e.g. the Master Services Agreement dated May 20, 2026",
    ),
    DocField(key="customer_name", label="Customer (data exporter) name"),
    DocField(key="customer_address", label="Customer address", kind="textarea"),
    DocField(
        key="customer_contact",
        label="Customer contact (name, title)",
        placeholder="e.g. Jane Roe, Data Protection Lead",
    ),
    DocField(key="company_address", label="Provider (company) address", kind="textarea"),
    DocField(
        key="security_contact",
        label="Provider security contact",
        placeholder="security@company.com",
    ),
    DocField(
        key="security_policy",
        label="Security policy",
        placeholder="As defined in the Agreement — or a URL / certifications (SOC 2, ISO 27001)",
    ),
    DocField(
        key="subprocessors",
        label="Approved Subprocessors — 'Name | Country | Processing task' per line (or a URL)",
        kind="textarea",
        placeholder="AWS | USA | hosting\nOpenAI | USA | AI features\nStripe | USA | payments",
    ),
    DocField(key="governing_state", label="Governing State (law & courts)", placeholder="Delaware"),
    DocField(
        key="governing_member_state",
        label="Restricted transfers — Governing Member State",
        placeholder="EEA: e.g. Ireland · UK: laws of England and Wales · or 'None'",
    ),
    # Annex I(B) — description of transfer & processing
    DocField(key="service_name", label="Service (product name)", placeholder="the product/service"),
    DocField(
        key="data_subjects",
        label="Categories of data subjects (one per line)",
        kind="textarea",
        placeholder="Customer's end users or customers\nCustomer's employees",
    ),
    DocField(
        key="personal_data_categories",
        label="Categories of personal data (one per line)",
        kind="textarea",
        placeholder="Name\nContact information (email, phone, address)\nUser activity (device, IP)",
    ),
    DocField(
        key="special_category_data",
        label="Special category data (Art. 9 GDPR)",
        placeholder="No — none processed · or Yes, with safeguards: …",
    ),
    DocField(
        key="processing_nature",
        label="Nature of processing (one per line)",
        kind="textarea",
        placeholder="Receiving data (collection, entry)\nHolding data (storage)\nErasing data",
    ),
    DocField(key="frequency", label="Frequency of transfer", placeholder="Continuous"),
    # Annex II — security measures
    DocField(
        key="security_measures",
        label="Technical & organizational security measures (Annex II)",
        kind="textarea",
        placeholder="See Security Policy — or list: encryption, access controls, backups…",
    ),
    # Signatures
    DocField(key="signatory_name", label="Provider signatory name", placeholder="e.g. the CEO"),
    DocField(key="signatory_title", label="Provider signatory title", placeholder="CEO"),
    DocField(key="customer_signatory_name", label="Customer signatory name"),
    DocField(key="customer_signatory_title", label="Customer signatory title"),
]
DPA_TEMPLATE = """\
# Data Processing Agreement (DPA)

## Cover Page — Key Terms

This DPA has two parts: (1) the Key Terms on this Cover Page and (2) the DPA Standard Terms below
(modeled on the Common Paper DPA Standard Terms v1.1). If there is any inconsistency, the Cover
Page controls over the Standard Terms. This DPA is effective as of {{effective_date}} and
supplements {{underlying_agreement}} (the "Agreement").

[[PARTIES]]

**Approved Subprocessors.**

| Subprocessor | Country | Anticipated Processing task |
|---|---|---|
{{subprocessors}}

**Provider Security Contact.** {{security_contact}}

**Security Policy.** {{security_policy}}

**Governing Law and Chosen Courts.** Notwithstanding the governing-law or forum clauses of the
Agreement, all interpretations and disputes about this DPA are governed by the laws of the State of
{{governing_state}}, without regard to its conflict-of-laws provisions, and the parties submit to
the exclusive jurisdiction of the courts of that state.

**Service Provider Relationship (CCPA).** To the extent the California Consumer Privacy Act, Cal.
Civ. Code § 1798.100 et seq. ("CCPA") applies, the parties acknowledge and agree that Provider is a
**service provider** receiving Personal Data from Customer to provide the Service, a limited and
specified business purpose. Provider will not sell or share any Personal Data provided by Customer,
and will not retain, use, or disclose it except as necessary to provide the Service, as stated in
the Agreement, or as permitted by Applicable Data Protection Laws. Provider will notify Customer if
it can no longer meet its CCPA obligations.

**Restricted Transfers — Governing Member State.** {{governing_member_state}}

## Annex I(A) — List of Parties

**Data Exporter:** {{customer_name}} (Customer) — {{customer_address}}. Contact:
{{customer_contact}}. Role: Controller (or Processor, where Customer processes on behalf of its own
controllers). **Data Importer:** {{company.name}} (Provider) — {{company_address}}. Contact:
{{security_contact}}. Role: Processor. Activities relevant to transfer: see Annex I(B).

## Annex I(B) — Description of Transfer and Processing

**Service.** {{service_name}}

**Categories of Data Subjects.**
{{data_subjects}}

**Categories of Personal Data.**
{{personal_data_categories}}

**Special Category Data.** {{special_category_data}}

**Frequency of Transfer.** {{frequency}}

**Nature and Purpose of Processing.** Provider will Process Customer Personal Data as instructed in
Section 2.2 of the Standard Terms. The nature of processing includes:
{{processing_nature}}

**Duration of Processing.** As long as required (i) to conduct the Processing activities instructed
under the Standard Terms, or (ii) by Applicable Laws.

**Competent Supervisory Authority (Annex I(C)).** The supervisory authority of the data exporter,
determined per Clause 13 of the EEA SCCs or the relevant provision of the UK Addendum.

## Annex II — Technical and Organizational Security Measures

{{security_measures}}

## DPA Standard Terms

## 1. Processor and Subprocessor Relationships

Where Customer is a Controller of Customer Personal Data, Provider is a **Processor** Processing on
behalf of Customer. Where Customer is itself a Processor, Provider is a **Subprocessor**.

## 2. Processing

**2.1 Processing Details.** Annex I(B) describes the subject matter, nature, purpose, and duration
of Processing, and the Categories of Personal Data and Data Subjects.

**2.2 Processing Instructions.** Customer instructs Provider to Process Customer Personal Data:
(a) to provide and maintain the Service; (b) as further specified through Customer's use of the
Service; (c) as documented in the Agreement; and (d) as documented in other written instructions
acknowledged by Provider. Provider will abide by these instructions unless prohibited by Applicable
Laws, and will immediately inform Customer if it is unable to follow them. Customer will only give
lawful instructions.

**2.3 Processing by Provider.** Provider will only Process Customer Personal Data per this DPA,
including the Cover Page. If Provider updates the Service, it may change the processing details in
Annex I(B) as needed by notifying Customer.

**2.4 Customer Processing.** Where Customer is a Processor, it will comply with Applicable Laws and
its own controller agreements, including their Subprocessor requirements.

**2.5 Consent to Processing.** Customer has complied and will comply with Applicable Data
Protection Laws in providing Customer Personal Data — making all disclosures, obtaining all
consents, and implementing required safeguards.

## 3. Subprocessors

Provider will not hand Customer Personal Data to a Subprocessor unless approved. The Approved
Subprocessors list identifies each Subprocessor, its country, and its Processing tasks. Provider
will give at least **10 business days'** advance written notice of any change; Customer has **30
days** to object, after which the change is deemed accepted; on objection the parties will
cooperate in good faith. Provider will bind each Subprocessor by written agreement to terms at
least as protective as this DPA (including GDPR Art. 28(3) obligations where applicable), will
share those agreements on request (redacted as needed), and **remains fully liable** for its
Subprocessors' acts and omissions.

## 4. Restricted Transfers

**4.1 Authorization.** Customer agrees Provider may transfer Customer Personal Data outside the
EEA, UK, or other territory as necessary to provide the Service, implementing appropriate
safeguards where no adequacy decision applies.

**4.2 Ex-EEA Transfers.** Where the GDPR protects the transfer from Customer in the EEA to Provider
outside it without an adequacy decision, the parties are deemed to have signed the **EEA SCCs** and
their Annexes, incorporated by reference: Module Two (Controller→Processor) or Module Three
(Processor→Subprocessor) as applicable; Clause 7 docking does not apply; Clause 9 Option 2 with 10
business days' notice; Clause 11 optional language does not apply; Clause 17 Option 1 governed by
the laws of the Governing Member State; Clause 18(b) disputes in its courts; the Cover Page
supplies Annexes I–III.

**4.3 Ex-UK Transfers.** Where the UK GDPR protects the transfer, the parties are deemed to have
signed the **UK Addendum**, completed per this DPA's Cover Page; neither party may end it as set
out in its Section 19.

**4.4 Other International Transfers.** For transfers governed by Swiss law, references to the GDPR
in Clause 4 of the EEA SCCs are amended to the Swiss Federal Data Protection Act, and the
supervisory authority includes the Swiss FDPIC.

## 5. Security Incident Response

Upon becoming aware of a Security Incident, Provider will: (a) notify Customer without undue delay,
and no later than **72 hours** after becoming aware; (b) provide timely information as it becomes
known or as Customer reasonably requests; and (c) promptly take reasonable steps to contain and
investigate. Notification is not an acknowledgment of fault or liability.

## 6. Audit & Reports

**6.1 Audit Rights.** Provider will give Customer the information reasonably necessary to
demonstrate compliance with this DPA and will allow for and contribute to audits, subject to
protecting Provider's IP, confidentiality, and legal obligations. Customer exercises its audit
rights through the reports and due-diligence mechanisms below. Provider keeps compliance records
for 3 years after the DPA ends.

**6.2 Security Reports.** On written request, Provider will give Customer, confidentially, a
summary copy of its then-current third-party audit Report against the Security Policy standards.

**6.3 Security Due Diligence.** Provider will answer reasonable written information-security and
audit questionnaires from Customer, sent to the Provider Security Contact, no more than once a
year.

## 7. Coordination & Cooperation

**7.1 Response to Inquiries.** If Provider receives an inquiry or request about Customer Personal
Data from anyone else (a regulator, court, or data subject), it will notify Customer (where not
legally prohibited) and will not respond without Customer's prior consent, following Customer's
reasonable instructions and assisting with data-subject requests per Applicable Data Protection
Laws.

**7.2 DPIAs and DTIAs.** Where required, Provider will reasonably assist Customer with data
protection impact assessments, transfer impact assessments, and regulator consultations.

## 8. Deletion of Customer Personal Data

Provider will enable Customer to delete Customer Personal Data consistent with the Service's
functionality. After the DPA expires, Provider will return or delete it at Customer's instruction
unless storage is required or authorized by law; where return or destruction is impracticable,
Provider will prevent further Processing and continue protecting it. A certification of deletion
under the SCCs is provided on request.

## 9. Limitation of Liability

Each party's total cumulative liability under this DPA is subject to the waivers and limitations in
the Agreement. Related-party claims may only be brought by the Customer entity that is party to the
Agreement. This DPA does not limit liability to individuals for their data-protection rights or
between the parties for violations of the EEA SCCs or UK Addendum.

## 10. Conflicts Between Documents

This DPA forms part of and supplements the Agreement. For any inconsistency, precedence is: (1) the
EEA SCCs or UK Addendum, (2) this DPA, then (3) the Agreement.

## 11. Term

This DPA starts when the parties agree to the Cover Page and accept the Agreement, and continues
until the Agreement expires or is terminated — with obligations continuing until Customer stops
transferring and Provider stops Processing Customer Personal Data.

## 12. Key Definitions

**"Customer Personal Data"** — Personal Data Customer uploads or provides to Provider as part of
the Service. **"Security Incident"** — a Personal Data Breach as defined in Article 4 of the GDPR.
**"EEA SCCs"** — the standard contractual clauses in Commission Implementing Decision 2021/914.
**"UK Addendum"** — the ICO's international data transfer addendum to the EEA SCCs.
**"Applicable Data Protection Laws"** — the laws governing how the Service may process personal
data. Controller, Processor, Subprocessor, Personal Data, Processing, and Special Category Data
have the meanings in Applicable Data Protection Laws (incl. GDPR Art. 9 for Special Category Data).

*The parties have not changed the Standard Terms except via the Cover Page. By signing, each party
agrees to enter into this DPA as of the last date of signature.*

[[SIGNATURES]]

## 📤 What to do next
Execute alongside the Agreement it supplements whenever you process personal data for a customer —
enterprise EU/California deals require it. Keep the **Approved Subprocessors** list in sync with
your Privacy Policy and give 10 business days' notice before changes. The EEA SCC / UK Addendum
annex documents live in your W2/docs/annex folder — attach them for any restricted transfer.

> Modeled on the Common Paper DPA v1.1 (Cover Page + Standard Terms). Not legal advice — have a
> privacy specialist review, especially the SCC selections for international transfers.
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
    # W2 · Stage 1 — Establish IP ownership
    # W2 · Stage 2 — Confirm IP ownership
    "W2-invention-assignment-confirmation-letter": (
        CONFIRMATION_LETTER_FIELDS,
        CONFIRMATION_LETTER_TEMPLATE,
    ),
    # W2 · Stage 3 — Confidentiality framework
    "W2-nda-one-way": (NDA_ONEWAY_FIELDS, NDA_ONEWAY_TEMPLATE),
    "W2-nda-mutual": (NDA_MUTUAL_FIELDS, NDA_MUTUAL_TEMPLATE),
    # W2 · Stage 4 — Third-party engagement
    "W2-independent-contractor-agreement-ica": (ICA_FIELDS, ICA_TEMPLATE),
    "W2-msa-client-facing": (MSA_CLIENT_FIELDS, MSA_CLIENT_TEMPLATE),
    "W2-msa-vendor-facing": (MSA_VENDOR_FIELDS, MSA_VENDOR_TEMPLATE),
    "W2-statement-of-work-sow": (SOW_FIELDS, SOW_TEMPLATE),
    "W2-service-level-agreement-sla": (SLA_FIELDS, SLA_TEMPLATE),
    "W2-advisor-agreement": (ADVISOR_FIELDS, ADVISOR_TEMPLATE),
    "W2-advisor-agreement-llc": (ADVISOR_LLC_FIELDS, ADVISOR_LLC_TEMPLATE),
    # W2 · Stage 5 — Conditional & compliance
    "W2-ai-addendum": (AI_ADDENDUM_FIELDS, AI_ADDENDUM_TEMPLATE),
    "W2-data-processing-addendum-dpa": (DPA_FIELDS, DPA_TEMPLATE),
    # W3–W8
    "W3-safe-agreement": (SAFE_FIELDS, SAFE_TEMPLATE),
    "W3-invoice-template": (INVOICE_FIELDS, INVOICE_TEMPLATE),
    "W4-security-baseline": (SECURITY_BASELINE_FIELDS, SECURITY_BASELINE_TEMPLATE),
    "W5-positioning-statement": (POSITIONING_FIELDS, POSITIONING_TEMPLATE),
    "W6-offer-letter": (OFFER_LETTER_FIELDS, OFFER_LETTER_TEMPLATE),
    "W6-option-grant-agreement": (OPTION_GRANT_FIELDS, OPTION_GRANT_TEMPLATE),
    "W7-icp-buyer-personas": (ICP_FIELDS, ICP_TEMPLATE),
    "W8-sop-library": (SOP_FIELDS, SOP_TEMPLATE),
}
