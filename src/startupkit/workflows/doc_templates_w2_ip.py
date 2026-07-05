"""W2 founder-IP documents — the TAA (entity-conditional) and the standardized PIIA.

Authored from the W2 spec folder (2026-07-04 drop):
- `W2/Technology_Assignment_Agreement_CCorp.md` + `Input_Fields_Technology_Assignment_CCorp.md`
- `W2/Technology_Assignment_Agreement_LLC.md`  + `Input_Fields_Technology_Assignment_LLC.md`
- `W2/PIIA_Standardized_Template.md`           + `PIIA_Input_Fields_Checklist.md`

The TAA is ENTITY-CONDITIONAL: a C-Corp assigns pre-incorporation IP for shares (IRC §351); an LLC
contributes pre-formation IP for membership units (IRC §721) and adds a Relationship-to-Operating-
Agreement section. The LLC variant registers under the C-Corp doc_key + "-llc";
catalog._build_w2_llc swaps it in when the company is an LLC. The PIIA is entity-neutral.

The templates have no conditional blocks, so the spec's optional items (Recital E co-founders,
Exhibit B open-source rows, Exhibit A prior inventions) are fields the founder fills with "None"
when not applicable — the clauses are worded to read correctly either way.

Drafts for review — not legal or tax advice; have counsel review before signing.
"""

from __future__ import annotations

from startupkit.workflows.catalog import DocField

# ==================== Technology Assignment Agreement — C-Corporation ===========================

TAA_CCORP_FIELDS = [
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="assignor_name", label="Assignor full legal name", prefill="founder.name"),
    DocField(key="assignor_address", label="Assignor notice address", kind="textarea"),
    DocField(
        key="company_business_description",
        label="Company business (one line, Recital A)",
        placeholder="e.g. an AI-powered analytics platform for logistics teams",
    ),
    DocField(
        key="share_number",
        label="Shares issued to Assignor",
        kind="number",
        placeholder="8,500,000",
    ),
    DocField(
        key="share_number_words",
        label="Shares in words",
        placeholder="Eight Million Five Hundred Thousand",
    ),
    DocField(
        key="cofounder_names",
        label="Other co-founders (Recital E) — names, or 'None'",
        placeholder="e.g. Ada Lovelace and Alan Turing — or 'None'",
    ),
    DocField(
        key="technology_description",
        label="Description of Technology (Exhibit A)",
        kind="textarea",
        placeholder="Product name(s), repos, patents/applications, domains, marks — be specific",
    ),
    DocField(
        key="open_source_components",
        label="Open-source components (Exhibit B) — 'Name | Version | License | Notes' per line",
        kind="textarea",
        placeholder="React | 18.3 | MIT | frontend UI\nNone (if no open-source components)",
    ),
    DocField(key="governing_law_state", label="Governing law state", placeholder="Delaware"),
    DocField(key="company_address", label="Company notice address", kind="textarea"),
    DocField(key="signatory_name", label="Company signatory name", placeholder="e.g. the CEO"),
    DocField(key="signatory_title", label="Company signatory title", placeholder="CEO"),
]

TAA_CCORP_TEMPLATE = """\
# Technology Assignment Agreement (TAA)

This Technology Assignment Agreement (this "Agreement") is made and entered into effective as of
{{effective_date}} (the "Effective Date"), by and between **{{company.name}}**, a
{{company.jurisdiction}} corporation (the "Company"), and **{{assignor_name}}**, an individual (the
"Assignor", and together with the Company, the "Parties").

[[PARTIES]]

## Recitals

**A.** Assignor is the developer and/or owner of certain technology, intellectual property, and
related rights described herein and in **Exhibit A** (collectively, the "Technology"), which
Technology relates to, or was developed in contemplation of, the business of the Company described
as {{company_business_description}}. Assignor desires to assign and transfer to the Company all of
Assignor's right, title, and interest in and to the Technology and related rights described herein.

**B.** In consideration for such assignment, the Company will issue to Assignor **{{share_number}}**
({{share_number_words}}) shares of the Company's common stock (the "Shares"), pursuant to that
certain Founder Restricted Stock Purchase Agreement between the Company and Assignor of even date
herewith (the "Stock Purchase Agreement").

**C.** Concurrently with this Agreement, Assignor is entering into a Proprietary Information and
Invention Assignment Agreement with the Company (the "PIIA"), governing Assignor's ongoing
obligations with respect to confidentiality and future inventions.

**D.** The assignment and stock issuance contemplated by this Agreement are intended to qualify for
tax-free treatment under Section 351 of the U.S. Internal Revenue Code of 1986, as amended.

**E.** Assignor, together with {{cofounder_names}} (if any), are the founders (collectively, the
"Founders") of the Company, and the Founders have agreed that the assignment of pre-incorporation
IP by each Founder is a condition precedent to that Founder's stock issuance and continued
involvement with the Company.

NOW, THEREFORE, in consideration of the mutual covenants and promises set forth herein, and other
good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the
Parties agree as follows:

## 1. Definitions

**1.1 Technology.** "Technology" means all designs, concepts, discoveries, inventions, products,
computer programs, procedures, improvements, developments, drawings, notes, documents, information,
and materials conceived, reduced to practice, invented, developed, or created by Assignor, whether
alone or jointly with others, prior to the Effective Date, that relate to the business or technology
of the Company, as further described in **Exhibit A** hereto.

**1.2 Derivative.** "Derivative" means, as of the Effective Date: (a) any derivative work of the
Technology (as defined in Section 101 of the U.S. Copyright Act); (b) all improvements,
modifications, alterations, adaptations, enhancements, and new versions of the Technology; and (c)
all technology, inventions, products, or other items that incorporate, or are derived from, any
part of the Technology or any of the foregoing.

**1.3 Intellectual Property Rights.** "Intellectual Property Rights" means, collectively, all
worldwide patents, patent applications, and patent rights; copyrights, copyright registrations, and
moral rights; trade names, trademarks, service marks, domain names, and registrations or
applications for any of the foregoing; trade secrets and know-how; mask work rights; rights in
trade dress and packaging; goodwill; and all other intellectual property and proprietary rights, in
each case relating to the Technology, any Derivative, or any Embodiment, whether arising under the
laws of the United States or any other jurisdiction.

**1.4 Embodiment.** "Embodiment" means all documentation, drafts, papers, designs, schematics,
diagrams, models, prototypes, source and object code (in any form or format, on any hardware
platform), computer-stored data, and other tangible or intangible items describing, recording, or
embodying any part of the Technology, any Derivative, any Intellectual Property Rights, or related
information.

**1.5 Assigned Assets.** "Assigned Assets" means, collectively, the Technology, all Derivatives,
all Intellectual Property Rights, and all Embodiments.

**1.6 Open-Source Components.** "Open-Source Components" means any software, libraries, or code
subject to a license approved by the Open Source Initiative or similar public license, as
identified in **Exhibit B**.

## 2. Assignment

In consideration of the issuance of the Shares, Assignor hereby irrevocably sells, assigns,
transfers, conveys, and releases to the Company, and its successors and assigns, throughout the
world, Assignor's entire right, title, and interest (whether choate or inchoate) in and to each and
all of the Assigned Assets, including all precursors, portions, and work in progress relating
thereto. Assignor agrees to deliver all Embodiments of the Assigned Assets to the Company at a
location designated by the Company no later than the Effective Date.

The assignment under this Section 2 **excludes** any Open-Source Components identified in Exhibit
B, which remain subject to their applicable open-source license terms; provided that Assignor
represents Assignor has complied with all such license terms in incorporating them into the
Technology.

## 3. Consideration

As full consideration for the assignment under Section 2, the Company shall issue to Assignor the
Shares pursuant to the Stock Purchase Agreement. Such Shares shall constitute the sole
consideration owed by the Company to Assignor with respect to the Assigned Assets.

## 4. Further Assurances; Moral Rights

**4.1 Further Assurances.** At the Company's expense, Assignor agrees to assist the Company, and to
execute such further documents and take such further actions as may be reasonably necessary, to
evidence, record, and perfect the assignment under Section 2 and to apply for, obtain, maintain,
enforce, and defend the Assigned Assets. Assignor further agrees to cooperate in the prosecution of
any related opposition, interference, or other proceedings. If the Company is unable, after
reasonable effort, to secure Assignor's signature on any such document, Assignor irrevocably
appoints the Company and its authorized officers as Assignor's agents and attorneys-in-fact to
execute and file such documents on Assignor's behalf, with the same legal force and effect as if
executed by Assignor.

**4.2 Moral Rights.** To the extent permitted by applicable law, the assignment in Section 2
includes all rights of paternity, integrity, disclosure, and withdrawal, and any other rights that
may be known as "moral rights" or "droit moral" (collectively, "Moral Rights"). To the extent
Assignor retains any Moral Rights under applicable law, Assignor hereby ratifies and consents to
any action taken with respect to such Moral Rights by or on behalf of the Company and agrees never
to assert any Moral Rights in or to the Assigned Assets.

## 5. Confidential Information

Assignor will not use or disclose any Assigned Asset or any other technical or business information
or plans of the Company, except (a) to the extent Assignor can document that such information is
generally available to the public through no fault of Assignor, or (b) as permitted under the PIIA.
Assignor acknowledges that a breach of this Section 5 would cause irreparable harm to the Company
for which monetary damages would be an inadequate remedy, and that the Company is entitled to
equitable relief, including injunctions, in addition to any other available remedies.

## 6. Representations and Warranties

Assignor represents and warrants to the Company that:

**(a)** Assignor is, or immediately prior to this Agreement was, the sole owner of all right,
title, and interest in and to the Assigned Assets (excluding Open-Source Components);

**(b)** Assignor has not previously assigned, transferred, licensed, pledged, or otherwise
encumbered any Assigned Asset, and has not agreed to do so;

**(c)** Assignor has full power and authority to enter into this Agreement and to make the
assignment contemplated herein;

**(d)** Assignor is not aware of any actual or threatened claim that the Assigned Assets infringe,
misappropriate, or otherwise violate the rights of any third party;

**(e)** Assignor was not acting within the scope of employment or engagement by any third party
when conceiving, creating, or developing any Assigned Asset;

**(f)** all Open-Source Components incorporated into the Technology are accurately identified in
Exhibit B, and Assignor has complied with the applicable license terms of each; and

**(g)** Assignor is not aware of any facts that would call into question the patentability,
validity, or enforceability of any existing patents, patent applications, or other registrations
relating to the Assigned Assets.

## 7. Non-Assignable Intellectual Property

To the extent any Assigned Asset is not assignable or transferable to the Company under applicable
law ("Non-Assignable IP"), Assignor hereby grants to the Company a non-exclusive, royalty-free,
irrevocable, perpetual, worldwide, sublicensable license to make, have made, modify, manufacture,
reproduce, use, and sell such Non-Assignable IP. Assignor will hold any residual rights in the
Non-Assignable IP in trust for the sole benefit of the Company and will deal with such rights,
including executing and delivering related documents, as the Company may direct from time to time.

## 8. General Provisions

**8.1 Governing Law.** This Agreement will be governed by, and construed and enforced in
accordance with, the laws of the State of {{governing_law_state}}, without giving effect to its
conflict-of-laws principles.

**8.2 Successors and Assigns; Assignment.** This Agreement will be binding upon and inure to the
benefit of the Parties' respective successors, assigns, heirs, executors, administrators, and legal
representatives. The Company may assign its rights and obligations under this Agreement without
restriction. Assignor may not assign this Agreement, whether voluntarily or by operation of law,
without the Company's prior written consent.

**8.3 Notices.** All notices under this Agreement must be in writing and will be deemed given upon:
(a) personal delivery; (b) one (1) business day after deposit with an overnight courier for
domestic delivery, or two (2) business days for international delivery; (c) three (3) business days
after deposit in the mail by certified mail, return receipt requested, for domestic delivery; or
(d) confirmed delivery by facsimile or electronic mail. Notices will be sent to the address set
forth below each Party's signature, or to such other address as a Party may designate in accordance
with this Section.

**8.4 Titles and Headings.** Titles, captions, and headings are included for ease of reference only
and will not affect the interpretation of this Agreement.

**8.5 Severability.** If any provision of this Agreement is held invalid, illegal, or
unenforceable, that provision will be enforced to the maximum extent permitted, and the remainder
of this Agreement will remain in full force and effect. If the invalid provision materially impairs
the value of this Agreement to either Party, the Parties will negotiate in good faith to substitute
a valid provision that most closely reflects their original intent.

**8.6 Amendment and Waiver.** This Agreement may be amended, and any provision waived, only by a
written instrument signed by both Parties. No delay or failure to enforce any provision will
constitute a waiver of that or any other provision.

**8.7 Entire Agreement.** This Agreement, together with the Stock Purchase Agreement and the PIIA,
constitutes the entire agreement between the Parties with respect to its subject matter and
supersedes all prior or contemporaneous understandings, whether oral or written.

**8.8 Attorney Fees.** In any action or proceeding to enforce rights under this Agreement, the
prevailing Party will be entitled to recover its reasonable attorney fees, costs, and expenses, in
addition to any other relief awarded.

**8.9 Counterparts.** This Agreement may be executed in counterparts, including by electronic
signature, each of which will be deemed an original, and all of which together will constitute one
and the same instrument.

*IN WITNESS WHEREOF, the Parties have executed this Technology Assignment Agreement effective as of
the Effective Date first written above.*

[[SIGNATURES]]

---

## Exhibit A — Description of Technology

Describe the Technology being assigned with sufficient specificity to identify it — product
name(s), source code repositories, patent/application numbers, provisional filings, domain names,
and any registered marks.

{{technology_description}}

## Exhibit B — Open-Source Components

| Component / Library | Version | License | Notes |
|---|---|---|---|
{{open_source_components}}

## 📤 What to do next
Every founder signs one **at incorporation**, alongside their Restricted Stock Purchase Agreement
and PIIA — Recitals B and C assume all three are signed the same day so the §351 tax treatment
holds. List the assigned work specifically in Exhibit A and every open-source component in Exhibit
B (write "None" where not applicable). This is the first document diligence looks for at Series A.

> Draft per the StartupKit standardized C-Corp TAA. Not legal or tax advice — if any IP was created
> while employed elsewhere, or §351 treatment matters, consult an attorney/CPA before signing.
"""

# ==================== Technology Assignment Agreement — LLC =====================================

TAA_LLC_FIELDS = [
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="assignor_name", label="Assignor full legal name", prefill="founder.name"),
    DocField(key="assignor_address", label="Assignor notice address", kind="textarea"),
    DocField(
        key="company_business_description",
        label="Company business (one line, Recital A)",
        placeholder="e.g. an AI-powered analytics platform for logistics teams",
    ),
    DocField(
        key="unit_number",
        label="Membership units issued to Assignor",
        kind="number",
        placeholder="8,500,000",
    ),
    DocField(
        key="membership_percentage",
        label="Membership interest (%)",
        kind="number",
        placeholder="85",
    ),
    DocField(
        key="membership_agreement_type",
        label="Companion membership document",
        placeholder="LLC Operating Agreement / Membership Interest Contribution Agreement",
    ),
    DocField(
        key="cofounder_names",
        label="Other co-founding members (Recital E) — names, or 'None'",
        placeholder="e.g. Ada Lovelace and Alan Turing — or 'None'",
    ),
    DocField(
        key="technology_description",
        label="Description of Technology (Exhibit A)",
        kind="textarea",
        placeholder="Product name(s), repos, patents/applications, domains, marks — be specific",
    ),
    DocField(
        key="open_source_components",
        label="Open-source components (Exhibit B) — 'Name | Version | License | Notes' per line",
        kind="textarea",
        placeholder="React | 18.3 | MIT | frontend UI\nNone (if no open-source components)",
    ),
    DocField(key="governing_law_state", label="Governing law state", placeholder="Delaware"),
    DocField(key="company_address", label="Company notice address", kind="textarea"),
    DocField(
        key="signatory_name", label="Company signatory name", placeholder="Manager / member name"
    ),
    DocField(
        key="signatory_title",
        label="Company signatory title",
        placeholder="Manager / Managing Member",
    ),
]

TAA_LLC_TEMPLATE = """\
# Technology Assignment Agreement (TAA)

This Technology Assignment Agreement (this "Agreement") is made and entered into effective as of
{{effective_date}} (the "Effective Date"), by and between **{{company.name}}**, a
{{company.jurisdiction}} limited liability company (the "Company"), and **{{assignor_name}}**, an
individual (the "Assignor", and together with the Company, the "Parties").

[[PARTIES]]

## Recitals

**A.** Assignor is the developer and/or owner of certain technology, intellectual property, and
related rights described herein and in **Exhibit A** (collectively, the "Technology"), which
Technology relates to, or was developed in contemplation of, the business of the Company described
as {{company_business_description}}. Assignor desires to assign and transfer, or contribute, to the
Company all of Assignor's right, title, and interest in and to the Technology and related rights
described herein.

**B.** In consideration for such assignment, the Company will issue to Assignor
**{{unit_number}}** membership units (the "Units"), representing a **{{membership_percentage}}%**
membership interest in the Company, pursuant to that certain {{membership_agreement_type}} between
the Company and Assignor of even date herewith (the "Membership Agreement").

**C.** Concurrently with this Agreement, Assignor is entering into a Proprietary Information and
Invention Assignment Agreement with the Company (the "PIIA"), governing Assignor's ongoing
obligations with respect to confidentiality and future inventions.

**D.** The Parties intend that the assignment and contribution of the Technology in exchange for
the Units be treated, to the extent applicable, as a contribution of property to the Company in
exchange for a membership interest under Section 721 of the U.S. Internal Revenue Code of 1986, as
amended, and not as a taxable sale.

**E.** Assignor, together with {{cofounder_names}} (if any), are the founding members
(collectively, the "Founders") of the Company, and the Founders have agreed that the assignment of
pre-formation IP by each Founder is a condition precedent to that Founder's issuance of Units and
admission as a member of the Company.

NOW, THEREFORE, in consideration of the mutual covenants and promises set forth herein, and other
good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the
Parties agree as follows:

## 1. Definitions

**1.1 Technology.** "Technology" means all designs, concepts, discoveries, inventions, products,
computer programs, procedures, improvements, developments, drawings, notes, documents, information,
and materials conceived, reduced to practice, invented, developed, or created by Assignor, whether
alone or jointly with others, prior to the Effective Date, that relate to the business or
technology of the Company, as further described in **Exhibit A** hereto.

**1.2 Derivative.** "Derivative" means, as of the Effective Date: (a) any derivative work of the
Technology (as defined in Section 101 of the U.S. Copyright Act); (b) all improvements,
modifications, alterations, adaptations, enhancements, and new versions of the Technology; and (c)
all technology, inventions, products, or other items that incorporate, or are derived from, any
part of the Technology or any of the foregoing.

**1.3 Intellectual Property Rights.** "Intellectual Property Rights" means, collectively, all
worldwide patents, patent applications, and patent rights; copyrights, copyright registrations, and
moral rights; trade names, trademarks, service marks, domain names, and registrations or
applications for any of the foregoing; trade secrets and know-how; mask work rights; rights in
trade dress and packaging; goodwill; and all other intellectual property and proprietary rights, in
each case relating to the Technology, any Derivative, or any Embodiment, whether arising under the
laws of the United States or any other jurisdiction.

**1.4 Embodiment.** "Embodiment" means all documentation, drafts, papers, designs, schematics,
diagrams, models, prototypes, source and object code (in any form or format, on any hardware
platform), computer-stored data, and other tangible or intangible items describing, recording, or
embodying any part of the Technology, any Derivative, any Intellectual Property Rights, or related
information.

**1.5 Assigned Assets.** "Assigned Assets" means, collectively, the Technology, all Derivatives,
all Intellectual Property Rights, and all Embodiments.

**1.6 Open-Source Components.** "Open-Source Components" means any software, libraries, or code
subject to a license approved by the Open Source Initiative or similar public license, as
identified in **Exhibit B**.

## 2. Assignment and Contribution

In consideration of the issuance of the Units, Assignor hereby irrevocably sells, assigns,
transfers, contributes, conveys, and releases to the Company, and its successors and assigns,
throughout the world, Assignor's entire right, title, and interest (whether choate or inchoate) in
and to each and all of the Assigned Assets, including all precursors, portions, and work in
progress relating thereto. Assignor agrees to deliver all Embodiments of the Assigned Assets to the
Company at a location designated by the Company no later than the Effective Date.

The assignment under this Section 2 **excludes** any Open-Source Components identified in Exhibit
B, which remain subject to their applicable open-source license terms; provided that Assignor
represents Assignor has complied with all such license terms in incorporating them into the
Technology.

## 3. Consideration

As full consideration for the assignment and contribution under Section 2, the Company shall issue
to Assignor the Units pursuant to the Membership Agreement, and Assignor will be admitted as a
member of the Company in accordance with the Company's operating agreement. Such Units shall
constitute the sole consideration owed by the Company to Assignor with respect to the Assigned
Assets.

## 4. Further Assurances; Moral Rights

**4.1 Further Assurances.** At the Company's expense, Assignor agrees to assist the Company, and to
execute such further documents and take such further actions as may be reasonably necessary, to
evidence, record, and perfect the assignment under Section 2 and to apply for, obtain, maintain,
enforce, and defend the Assigned Assets. Assignor further agrees to cooperate in the prosecution of
any related opposition, interference, or other proceedings. If the Company is unable, after
reasonable effort, to secure Assignor's signature on any such document, Assignor irrevocably
appoints the Company and its authorized officers, managers, or managing members as Assignor's
agents and attorneys-in-fact to execute and file such documents on Assignor's behalf, with the same
legal force and effect as if executed by Assignor.

**4.2 Moral Rights.** To the extent permitted by applicable law, the assignment in Section 2
includes all rights of paternity, integrity, disclosure, and withdrawal, and any other rights that
may be known as "moral rights" or "droit moral" (collectively, "Moral Rights"). To the extent
Assignor retains any Moral Rights under applicable law, Assignor hereby ratifies and consents to
any action taken with respect to such Moral Rights by or on behalf of the Company and agrees never
to assert any Moral Rights in or to the Assigned Assets.

## 5. Confidential Information

Assignor will not use or disclose any Assigned Asset or any other technical or business information
or plans of the Company, except (a) to the extent Assignor can document that such information is
generally available to the public through no fault of Assignor, or (b) as permitted under the PIIA.
Assignor acknowledges that a breach of this Section 5 would cause irreparable harm to the Company
for which monetary damages would be an inadequate remedy, and that the Company is entitled to
equitable relief, including injunctions, in addition to any other available remedies.

## 6. Representations and Warranties

Assignor represents and warrants to the Company that:

**(a)** Assignor is, or immediately prior to this Agreement was, the sole owner of all right,
title, and interest in and to the Assigned Assets (excluding Open-Source Components);

**(b)** Assignor has not previously assigned, transferred, licensed, pledged, or otherwise
encumbered any Assigned Asset, and has not agreed to do so;

**(c)** Assignor has full power and authority to enter into this Agreement and to make the
assignment and contribution contemplated herein;

**(d)** Assignor is not aware of any actual or threatened claim that the Assigned Assets infringe,
misappropriate, or otherwise violate the rights of any third party;

**(e)** Assignor was not acting within the scope of employment or engagement by any third party
when conceiving, creating, or developing any Assigned Asset;

**(f)** all Open-Source Components incorporated into the Technology are accurately identified in
Exhibit B, and Assignor has complied with the applicable license terms of each; and

**(g)** Assignor is not aware of any facts that would call into question the patentability,
validity, or enforceability of any existing patents, patent applications, or other registrations
relating to the Assigned Assets.

## 7. Non-Assignable Intellectual Property

To the extent any Assigned Asset is not assignable, transferable, or contributable to the Company
under applicable law ("Non-Assignable IP"), Assignor hereby grants to the Company a non-exclusive,
royalty-free, irrevocable, perpetual, worldwide, sublicensable license to make, have made, modify,
manufacture, reproduce, use, and sell such Non-Assignable IP. Assignor will hold any residual
rights in the Non-Assignable IP in trust for the sole benefit of the Company and will deal with
such rights, including executing and delivering related documents, as the Company may direct from
time to time.

## 8. Relationship to Operating Agreement

In the event of any conflict between this Agreement and the Company's operating agreement with
respect to the admission of Assignor as a member or the issuance of Units, the operating agreement
will control; provided that the assignment of the Assigned Assets under Section 2 will remain
effective and binding regardless of such conflict.

## 9. General Provisions

**9.1 Governing Law.** This Agreement will be governed by, and construed and enforced in
accordance with, the laws of the State of {{governing_law_state}}, without giving effect to its
conflict-of-laws principles.

**9.2 Successors and Assigns; Assignment.** This Agreement will be binding upon and inure to the
benefit of the Parties' respective successors, assigns, heirs, executors, administrators, and legal
representatives. The Company may assign its rights and obligations under this Agreement without
restriction. Assignor may not assign this Agreement, whether voluntarily or by operation of law,
without the Company's prior written consent.

**9.3 Notices.** All notices under this Agreement must be in writing and will be deemed given upon:
(a) personal delivery; (b) one (1) business day after deposit with an overnight courier for
domestic delivery, or two (2) business days for international delivery; (c) three (3) business days
after deposit in the mail by certified mail, return receipt requested, for domestic delivery; or
(d) confirmed delivery by facsimile or electronic mail. Notices will be sent to the address set
forth below each Party's signature, or to such other address as a Party may designate in accordance
with this Section.

**9.4 Titles and Headings.** Titles, captions, and headings are included for ease of reference only
and will not affect the interpretation of this Agreement.

**9.5 Severability.** If any provision of this Agreement is held invalid, illegal, or
unenforceable, that provision will be enforced to the maximum extent permitted, and the remainder
of this Agreement will remain in full force and effect. If the invalid provision materially impairs
the value of this Agreement to either Party, the Parties will negotiate in good faith to substitute
a valid provision that most closely reflects their original intent.

**9.6 Amendment and Waiver.** This Agreement may be amended, and any provision waived, only by a
written instrument signed by both Parties. No delay or failure to enforce any provision will
constitute a waiver of that or any other provision.

**9.7 Entire Agreement.** This Agreement, together with the Membership Agreement, the Company's
operating agreement, and the PIIA, constitutes the entire agreement between the Parties with
respect to its subject matter and supersedes all prior or contemporaneous understandings, whether
oral or written.

**9.8 Attorney Fees.** In any action or proceeding to enforce rights under this Agreement, the
prevailing Party will be entitled to recover its reasonable attorney fees, costs, and expenses, in
addition to any other relief awarded.

**9.9 Counterparts.** This Agreement may be executed in counterparts, including by electronic
signature, each of which will be deemed an original, and all of which together will constitute one
and the same instrument.

*IN WITNESS WHEREOF, the Parties have executed this Technology Assignment Agreement effective as of
the Effective Date first written above.*

[[SIGNATURES]]

---

## Exhibit A — Description of Technology

Describe the Technology being assigned with sufficient specificity to identify it — product
name(s), source code repositories, patent/application numbers, provisional filings, domain names,
and any registered marks.

{{technology_description}}

## Exhibit B — Open-Source Components

| Component / Library | Version | License | Notes |
|---|---|---|---|
{{open_source_components}}

## 📤 What to do next
Every founding member signs one **at formation**, alongside the Operating Agreement (or Membership
Interest Contribution Agreement) and PIIA. Unlike the C-Corp version there is no IRC §351 treatment
here — LLC property contributions are generally governed by **IRC §721**, which has different
requirements; confirm the tax treatment with counsel/CPA. List the assigned work in Exhibit A and
every open-source component in Exhibit B (write "None" where not applicable).

> Draft per the StartupKit standardized LLC TAA. Not legal or tax advice — LLC IP-contribution
> mechanics vary significantly by state; review with qualified counsel before use.
"""

# ==================== Proprietary Information and Inventions Agreement (standardized) ===========

PIIA_STD_FIELDS = [
    DocField(key="effective_date", label="Effective date", kind="date"),
    DocField(key="employee_name", label="Employee full name", prefill="founder.name"),
    DocField(key="employee_address", label="Employee residential address", kind="textarea"),
    DocField(key="employee_email", label="Employee notices email"),
    DocField(key="job_title", label="Job title", placeholder="e.g. Co-Founder & CTO"),
    DocField(key="company_address", label="Company principal address", kind="textarea"),
    DocField(key="hr_email", label="Company HR / notices email", placeholder="hr@company.com"),
    DocField(
        key="at_will_authority",
        label="Who can alter at-will status (§9.1)",
        placeholder="CEO / Board of Directors",
    ),
    DocField(
        key="work_state",
        label="State where the employee works (§3 notice)",
        placeholder="e.g. California — statutory notice applies in CA, DE, IL, KS, MN, NC, UT, WA",
    ),
    DocField(
        key="non_solicit_months",
        label="Non-solicit period after termination (months, §6)",
        kind="number",
        placeholder="12 or 18",
    ),
    DocField(key="governing_state", label="Governing law state (§11.6)", placeholder="Delaware"),
    DocField(
        key="venue_county_state",
        label="Venue — county, state (§11.7)",
        placeholder="e.g. New Castle County, Delaware",
    ),
    DocField(
        key="prior_inventions",
        label="Exhibit A prior inventions — 'Title | Date | Owner | Related?' per line, or 'None'",
        kind="textarea",
        placeholder="Mobile budgeting app | 03/2024 | Employee | No — unrelated\nNone",
    ),
    DocField(key="signatory_name", label="Company signatory name", placeholder="e.g. the CEO"),
    DocField(key="signatory_title", label="Company signatory title", placeholder="CEO"),
]

PIIA_STD_TEMPLATE = """\
# Proprietary Information & Inventions Agreement (PIIA)

This Proprietary Information and Inventions Agreement (this "Agreement") is entered into as of
{{effective_date}} (the "Effective Date"), by and between **{{company.name}}**, a
{{company.jurisdiction}} {{company.entity}} (together with its direct and indirect parents,
subsidiaries, and affiliates, collectively the "Company"), and **{{employee_name}}**, an individual
("Employee").

[[PARTIES]]

**WHEREAS**, Employee is employed by (or is about to be employed by) the Company in the capacity of
{{job_title}}; **WHEREAS**, in connection with Employee's employment, Employee will have access to
the Company's confidential and proprietary information and will create inventions and other
intellectual property on behalf of the Company; **WHEREAS**, the Company desires to protect its
confidential information, trade secrets, and intellectual property rights; and **WHEREAS**, as a
condition of employment, the Company requires Employee to enter into this Agreement.

NOW, THEREFORE, in consideration of Employee's employment with the Company, the compensation paid
to Employee, and the mutual covenants set forth herein, the parties agree as follows:

## 1. Confidential Information

**1.1 Definition.** "Confidential Information" means all information, in any form, disclosed to or
learned by Employee during employment that (a) relates to the Company's business, products,
services, technology, customers, suppliers, or operations, and (b) is not generally known to the
public or the Company's competitors.

**1.2 Examples** include, but are not limited to:
- **Trade secrets:** proprietary algorithms, formulas, processes, techniques, know-how, and data
- **Business information:** plans, strategies, marketing and sales data, pricing, and financials
- **Product information:** designs, specifications, prototypes, roadmaps, development plans
- **Customer information:** customer lists, data, preferences, and contracts
- **Employee information:** employee data, compensation, performance reviews
- **Technology:** source code, software, databases, data models, APIs, technical documentation
- **Other:** anything marked "Confidential" or that a reasonable person would understand to be so

**1.3 Exclusions.** Confidential Information does not include information that: (a) is or becomes
publicly available through no breach by Employee; (b) was rightfully known to Employee before
employment, as evidenced by written records; (c) is rightfully received from a third party without
confidentiality obligations; or (d) is independently developed by Employee after termination
without use of the Company's Confidential Information, as evidenced by written records.

**1.4 Non-Disclosure Obligation.** Employee agrees to: (a) hold all Confidential Information in
strict confidence and not disclose it except as required to perform duties or as authorized in
writing; (b) use it solely to perform Employee's duties and not for Employee's own or any third
party's benefit; (c) protect it with at least reasonable care; (d) not copy it except as necessary
to perform duties; and (e) immediately notify the Company of any unauthorized use or disclosure.

**1.5 Compelled Disclosure.** If compelled by law to disclose Confidential Information, Employee
shall promptly notify the Company (where legally permitted), reasonably cooperate with efforts to
obtain protective relief, and disclose only the minimum required.

**1.6 No License.** Nothing in this Agreement grants Employee any license to the Company's
Confidential Information, trademarks, patents, copyrights, or other intellectual property, except
as necessary to perform Employee's duties.

**1.7 Third-Party Information.** Employee will hold in strict confidence any confidential
information the Company receives from third parties, and will not disclose or use it except as
necessary in carrying out work for the Company consistent with the Company's obligations to such
third parties.

## 2. Assignment of Inventions

**2.1 Definition.** "Inventions" means all discoveries, inventions, improvements, processes,
designs, formulas, techniques, know-how, data, programs, works of authorship, and other
intellectual property, whether or not patentable or copyrightable.

**2.2 Assignment.** Employee hereby assigns, transfers, and conveys to the Company all right,
title, and interest in and to all Inventions that Employee conceives, creates, develops, or reduces
to practice, alone or jointly, during employment, to the extent they: (a) relate to the Company's
business or actual or demonstrably anticipated research or development; (b) result from any work
performed by Employee for the Company; or (c) are developed using the Company's equipment,
supplies, facilities, trade secrets, or Confidential Information.

**2.3 Work-for-Hire.** To the extent any Inventions are works of authorship, they are "works made
for hire" under 17 U.S.C. § 101 and the Company is the author and owner. If and to the extent any
such Invention is not a work made for hire, Employee hereby irrevocably assigns all right, title,
and interest in it to the Company.

**2.4 Disclosure.** Employee will promptly disclose to the Company in writing all Inventions
created during employment, whether or not Employee believes they are covered, so the Company can
determine whether they are subject to Section 2.2.

**2.5 Prior Inventions.** Employee has listed in **Exhibit A** all Inventions made before
employment that belong to Employee (or a third party) and that Employee wishes to exclude from
Section 2.2. **If no list is attached, Employee represents there are no such Prior Inventions.**
Employee will not incorporate any Prior Invention into a Company product without disclosure; if
Employee does, the Company is granted a nonexclusive, royalty-free, sublicensable, transferable,
irrevocable, perpetual, worldwide license to use it in connection with that product, and Employee
will indemnify the Company against related third-party claims.

**2.6 Records.** Employee will keep adequate, current written records of all Inventions, which
remain the sole property of the Company.

**2.7 Further Assurances.** Employee will execute documents and take actions reasonably requested
to perfect, record, or enforce the Company's ownership of Inventions — including patent
applications, copyright registrations, and assignments — and will cooperate in related proceedings
during and after employment (with reasonable out-of-pocket expenses reimbursed after termination).

**2.8 Attorney-in-Fact.** If the Company cannot secure Employee's signature on any such document,
Employee irrevocably appoints the Company and its authorized officers as Employee's attorney-in-fact
to execute it on Employee's behalf; this power is coupled with an interest and survives Employee's
death or incapacity.

**2.9 Moral Rights Waiver.** To the extent permitted by law, Employee waives all moral rights and
similar rights in Inventions, including attribution and integrity rights under 17 U.S.C. § 106A.

**2.10 Remuneration.** Employee's compensation includes any consideration due under applicable law
for these assignments, unless applicable law requires separate remuneration, in which case the
Company will comply.

## 3. State / Jurisdiction-Specific Invention Notice

Employee works in **{{work_state}}**. Where required (California, Delaware, Illinois, Kansas,
Minnesota, North Carolina, Utah, Washington, or similar), Employee acknowledges the notice required
by California Labor Code Section 2870 (or the equivalent statute of Employee's state):

> "(a) Any provision in an employment agreement which provides that an employee shall assign, or
> offer to assign, any of his or her rights in an invention to his or her employer shall not apply
> to an invention that the employee developed entirely on his or her own time without using the
> employer's equipment, supplies, facilities, or trade secret information except for those
> inventions that either: (1) Relate at the time of conception or reduction to practice of the
> invention to the employer's business, or actual or demonstrably anticipated research or
> development of the employer; or (2) Result from any work performed by the employee for the
> employer. (b) To the extent a provision in an employment agreement purports to require an
> employee to assign an invention otherwise excluded from being required to be assigned under
> subdivision (a), the provision is against the public policy of this state and is unenforceable."

This Agreement does not require Employee to assign any invention excluded by such a statute. The
Exhibit A list is not intended to include inventions falling within the statutory exclusion.

## 4. Conflicting Obligations

**4.1 No Conflicts.** Employee represents and warrants that: (a) Employee is not party to any
agreement that would conflict with or limit Employee's ability to perform duties for the Company or
comply with this Agreement; (b) Employee's services will not violate any obligation to a former
employer or third party; (c) Employee has not and will not enter into any conflicting agreement;
and (d) Employee has not brought and will not bring any third party's confidential information to
the Company without written authorization.

**4.2 No Use of Third-Party Information.** Employee will not use, disclose, or rely on any former
employer's or third party's confidential information, and will not violate any agreement with them.

**4.3 Indemnification.** Employee will indemnify and hold the Company harmless from claims arising
out of Employee's breach of the representations in this Section 4.

**4.4 No Conflicting Employment.** During employment, Employee will devote full business time and
attention to the Company and will not, without prior written consent, engage in any other business
activity that competes or conflicts with the Company.

## 5. Return of Company Property

**5.1 Return.** Upon termination for any reason, or on request, Employee will immediately return
all Company property (devices, keys, access cards, equipment, documents) and all Confidential
Information in any form, including copies, summaries, notes, and access credentials.

**5.2 No Retention.** Employee will not retain any copies (including electronic or cloud copies),
except as required by law or in automatic backups beyond Employee's control.

**5.3 Certification.** On request, Employee will sign the Termination Certification attached as
**Exhibit B**.

**5.4 Remote Work.** Personal devices and networks are not secure substitutes for Company
equipment; Employee will take reasonable precautions for Confidential Information accessed on them.

## 6. Non-Solicitation

**6.1 Employee Non-Solicitation.** During employment and for **{{non_solicit_months}} months**
after termination, Employee will not directly or indirectly solicit, recruit, or induce any
employee, contractor, or consultant of the Company to end their relationship with the Company, nor
assist anyone else in doing so. This applies to anyone engaged by the Company in the 12 months
before Employee's termination.

**6.2 Customer Non-Solicitation.** During employment and for **{{non_solicit_months}} months**
after termination, Employee will not directly or indirectly solicit any customer or prospective
customer of the Company to offer competing products or services, divert any business opportunity,
or assist anyone else in doing so. This applies to customers with whom the Company had active
dealings in the 12 months before termination and with whom Employee had contact or about whom
Employee learned Confidential Information.

**6.3 No Prohibition on Employment.** This Section does not prohibit Employee from working for a
competitor, provided Employee does not violate the restrictions above. (Non-competes are
unenforceable or severely restricted in many states, including California — consult counsel before
adding one.)

**6.4 Blue Pencil.** Any restriction found overbroad will be modified to the minimum extent
necessary to make it enforceable, and enforced as modified.

**6.5 Notification of New Employer.** Employee consents to the Company notifying a new employer of
Employee's obligations under this Agreement.

## 7. Outside Activities

The restrictions in this Agreement do not prohibit: (a) passive ownership of less than 5% of a
publicly traded company; (b) charitable, community, or pro bono work; (c) personal investments; or
(d) outside activities approved in writing by the Company.

## 8. Defend Trade Secrets Act Notice

As required by 18 U.S.C. § 1833(b), Employee is notified:

> **Immunity Under the Defend Trade Secrets Act:** An individual shall not be held criminally or
> civilly liable under any Federal or State trade secret law for the disclosure of a trade secret
> that: (A) is made (i) in confidence to a Federal, State, or local government official, either
> directly or indirectly, or to an attorney, and (ii) solely for the purpose of reporting or
> investigating a suspected violation of law; or (B) is made in a complaint or other document filed
> in a lawsuit or other proceeding, if such filing is made under seal. An individual who files a
> lawsuit for retaliation by an employer for reporting a suspected violation of law may disclose
> the trade secret to the individual's attorney and use the trade secret information in the court
> proceeding, if the individual (A) files any document containing the trade secret under seal, and
> (B) does not disclose the trade secret except pursuant to court order.

## 9. No Employment Contract

**9.1 At-Will Employment.** This Agreement does not create a contract of employment or guarantee
employment for any period. Employment is at-will: either party may end it at any time, with or
without cause or notice, except as required by law. No one other than the {{at_will_authority}} has
authority to alter the at-will nature of employment, and any such agreement must be in a signed
writing.

**9.2 Survival.** The obligations in this Agreement survive termination of employment.

## 10. Remedies

**10.1 Irreparable Harm.** Any breach would cause irreparable harm for which damages are
inadequate; the Company is entitled to seek injunctive and other equitable relief, without posting
a bond, in addition to all other remedies.

**10.2 Costs and Fees.** The prevailing party in any action under this Agreement may recover its
reasonable costs and attorneys' fees.

**10.3 Cumulative Remedies.** All remedies are cumulative and non-exclusive.

## 11. General Provisions

**11.1 Entire Agreement.** This Agreement, together with any offer letter, employment agreement, or
equity grant, is the entire agreement on confidential information, inventions, and intellectual
property, and supersedes all prior understandings. Sections 1 and 2 apply equally to work performed
for the Company before execution of this Agreement.

**11.2 Amendments.** Amendments require a writing signed by Employee and an authorized Company
representative. Changes in duties or compensation do not affect this Agreement.

**11.3 Waiver.** No waiver is effective unless written and signed; no waiver of one breach waives
any other.

**11.4 Severability.** Invalid provisions will be modified to the minimum extent necessary to be
enforceable; a court may reduce any unreasonable scope, duration, or restriction.

**11.5 Assignment.** Employee may not assign this Agreement. The Company may assign it to any
successor, acquirer, or affiliate.

**11.6 Governing Law.** This Agreement is governed by the laws of the State of
{{governing_state}}, without regard to conflict-of-laws principles.

**11.7 Jurisdiction and Venue.** Employee consents to the exclusive jurisdiction and venue of the
state and federal courts located in {{venue_county_state}} for any action arising out of this
Agreement.

**11.8 Notices.** Notices must be in writing and are deemed given when delivered personally, by
confirmed email, or by certified mail to the addresses on the signature page.

**11.9 Successors.** This Agreement binds and benefits the parties and their heirs, successors, and
permitted assigns.

**11.10 Survival.** Sections 1, 2, 4, 5, 6, 8, 10, and 11 survive termination of employment.

**11.11 Counterparts.** This Agreement may be executed in counterparts; electronic signatures have
the same force as originals.

**11.12 Interpretation.** Headings are for convenience; "including" means "including without
limitation"; "or" includes "and/or".

*IN WITNESS WHEREOF, the parties have executed this Proprietary Information and Inventions
Agreement as of the Effective Date.*

[[SIGNATURES]]

---

## Exhibit A — List of Prior Inventions

List all inventions created before employment that belong to Employee (or a third party) and are
excluded from Section 2.2 — or "None". (Statutorily excluded inventions under §3 need not be
listed. If a Prior Invention is later incorporated into a Company product, the Company receives the
license described in Section 2.5.)

| Title / Description | Date Created | Owner | Related to Company Business? |
|---|---|---|---|
{{prior_inventions}}

## Exhibit B — Termination Certification

To be signed at departure: Employee certifies that they have returned all Company property and
Confidential Information, complied with all terms of this Agreement (including disclosure of all
covered Inventions), will continue to preserve all Confidential Information, and for
**{{non_solicit_months}} months** will not solicit any employee, contractor, or consultant of the
Company, per Section 6.

## 📤 What to do next
Every founder, employee, and contractor signs a PIIA **before** starting work — this standardized
version is the canonical template referenced by every offer letter (W6) and contractor/advisor
agreement. Fill Exhibit A carefully (or "None"); it is the signer's only carve-out. The §3 notice
and §6 durations are state-sensitive — have employment counsel confirm for the signer's state.

> Standardized template per the StartupKit PIIA spec. Not legal advice — state-specific provisions
> (non-solicit enforceability, invention-assignment statutes) require counsel review.
"""


IP_TEMPLATES: dict[str, tuple[list[DocField], str]] = {
    # C-Corp TAA is the default; the "-llc" key is swapped in by catalog._build_w2_llc for LLCs.
    "W2-technology-assignment-agreement-taa": (TAA_CCORP_FIELDS, TAA_CCORP_TEMPLATE),
    "W2-technology-assignment-agreement-taa-llc": (TAA_LLC_FIELDS, TAA_LLC_TEMPLATE),
    "W2-proprietary-information-inventions-agreement-piia": (PIIA_STD_FIELDS, PIIA_STD_TEMPLATE),
}
