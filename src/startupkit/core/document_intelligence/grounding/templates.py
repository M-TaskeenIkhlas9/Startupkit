"""Grounding: vetted standard-form templates + clause sets (FR-D1 — no free-form output).

These are faithful representations of the publicly-available, industry-standard startup forms that
founders and their counsel already recognize — the spec's "Tier-1 sources":

  - Y Combinator post-money SAFE (Valuation Cap, no Discount)
  - IRS §83(b) election / Form 15620
  - NVCA / Cooley GO / Orrick standard formation + equity forms
  - Founder Institute FAST advisor agreement

The model only *fills* one of these from the Company Object; it never drafts from scratch. Every
output is a draft flagged 'pending attorney review' (FR-D3). Deal-specific blanks render as explicit
[TO BE COMPLETED] markers so the validators and the human gate catch them.
"""

from __future__ import annotations

from startupkit.core.document_intelligence.pipeline import GenerateRequest, Grounding

_DISCLAIMER = (
    "\n\n---\n"
    "*StartupKit-generated draft from a standard form. Not legal advice. "
    "Review by a licensed attorney is required before signing.*"
)

# --- W3: Y Combinator post-money SAFE -----------------------------------------------------------

_YC_SAFE = (
    "# SAFE — Simple Agreement for Future Equity\n"
    "_Post-Money Valuation Cap, no Discount · based on the Y Combinator standard SAFE (v1.2)_\n"
    "**{company_name}** · Draft {today} · Pending attorney review\n\n"
    "THIS CERTIFIES THAT in exchange for the payment by [INVESTOR NAME — TO BE COMPLETED] "
    '(the "Investor") of [PURCHASE AMOUNT — TO BE COMPLETED] (the "Purchase Amount"), '
    "{company_name}, a {jurisdiction} corporation (the \"Company\"), issues to the Investor the "
    "right to certain shares of the Company's Capital Stock, subject to the terms below.\n\n"
    'The "Post-Money Valuation Cap" is [VALUATION CAP — TO BE COMPLETED].\n\n'
    "## 1. Events\n"
    "**(a) Equity Financing.** If there is an Equity Financing before this SAFE terminates, the "
    "Company will automatically issue to the Investor a number of shares of SAFE Preferred Stock "
    "equal to the Purchase Amount divided by the Conversion Price.\n\n"
    "**(b) Liquidity Event.** If there is a Liquidity Event before termination, the Investor will "
    "automatically receive, at its option, either the Purchase Amount (Cash-Out Amount) or shares "
    "of Common Stock equal to the Purchase Amount divided by the Liquidity Price.\n\n"
    "**(c) Dissolution Event.** If there is a Dissolution Event, the Investor will be paid the "
    "Purchase Amount, subject to the legal availability of funds, before distributions to holders "
    "of Common Stock.\n\n"
    "## 2. Definitions\n"
    "Capitalized terms have the meanings given in the Y Combinator post-money SAFE — including "
    "Capital Stock, Conversion Price, Equity Financing, Liquidity Event, Dissolution Event, "
    "Liquidity Capitalization, and Safe Price.\n\n"
    "## 3. Company Representations\n"
    "The Company is duly organized and validly existing under the laws of {jurisdiction} and has "
    "the power to execute and perform this SAFE.\n\n"
    "## 4. Investor Representations\n"
    "The Investor has the capacity to enter into this SAFE, is an accredited investor, and is "
    "acquiring this instrument for its own account.\n\n"
    "## 5. Miscellaneous\n"
    "This SAFE is governed by the laws of the State of {governing_state}. Any notices must be in "
    "writing. This SAFE is the entire agreement between the parties.\n\n"
    "**COMPANY:** {company_name} — By: {founder_name}, {founder_title}\n"
    "**INVESTOR:** [INVESTOR NAME — TO BE COMPLETED]" + _DISCLAIMER
)

# --- W1: IRS §83(b) election (Form 15620) -------------------------------------------------------

_ELECTION_83B = (
    "# Election Under Section 83(b) of the Internal Revenue Code\n"
    "_Based on IRS Form 15620 / the standard §83(b) election · **file within 30 days of "
    "transfer — no extensions**_\n"
    "**Draft {today} · Pending attorney review · TIME-SENSITIVE**\n\n"
    "The undersigned taxpayer hereby elects, pursuant to Section 83(b) of the Internal Revenue "
    "Code of 1986, as amended, to include in gross income for the taxable year specified below "
    "the excess (if any) of the fair market value of the property described below over the amount "
    "paid for such property.\n\n"
    "1. **Taxpayer name:** {founder_name}\n"
    "2. **Taxpayer address:** [ADDRESS — TO BE COMPLETED]\n"
    "3. **Taxpayer identification number (SSN/ITIN):** [SSN/ITIN — TO BE COMPLETED]\n"
    "4. **Taxable year for which the election is made:** {tax_year}\n"
    "5. **Description of property:** [NUMBER OF SHARES — TO BE COMPLETED] shares of common stock "
    "of {company_name}, a {jurisdiction} corporation.\n"
    "6. **Date of transfer:** [DATE OF TRANSFER — TO BE COMPLETED]\n"
    "7. **Nature of restrictions:** The shares are subject to a repurchase option in favor of the "
    "Company that lapses over a vesting schedule.\n"
    "8. **Fair market value at transfer (determined without regard to lapse restrictions):** "
    "[FAIR MARKET VALUE — TO BE COMPLETED]\n"
    "9. **Amount paid for the property:** [AMOUNT PAID — TO BE COMPLETED]\n\n"
    "The undersigned will file this statement with the Internal Revenue Service office where the "
    "taxpayer files their return within 30 days of the date of transfer, and will provide a copy "
    "to {company_name}.\n\n"
    "Signature: ________________________   Date: ____________\n"
    "{founder_name}" + _DISCLAIMER
)

# --- W1: Delaware Certificate of Incorporation --------------------------------------------------

_CERTIFICATE = (
    "# Certificate of Incorporation of {company_name}\n"
    "_Delaware C-Corporation · Cooley GO / standard form · Draft {today} · Pending attorney "
    "review_\n\n"
    "**FIRST.** The name of the corporation is {company_name} (the \"Corporation\").\n\n"
    "**SECOND.** The address of the Corporation's registered office in the State of Delaware is "
    "[REGISTERED OFFICE ADDRESS — TO BE COMPLETED], and the name of its registered agent at that "
    "address is [REGISTERED AGENT — TO BE COMPLETED].\n\n"
    "**THIRD.** The purpose of the Corporation is to engage in any lawful act or activity for "
    "which corporations may be organized under the General Corporation Law of Delaware. "
    "Business: {one_liner}.\n\n"
    "**FOURTH.** The total number of shares of stock the Corporation is authorized to issue is "
    "{authorized_shares} shares of Common Stock, par value {par_value} per share.\n\n"
    "**FIFTH.** The name and mailing address of the incorporator is "
    "[INCORPORATOR — TO BE COMPLETED].\n\n"
    "**SIXTH.** The Corporation shall, to the fullest extent permitted by the DGCL, indemnify and "
    "advance expenses to its directors and officers.\n\n"
    "**SEVENTH.** A director shall not be personally liable to the Corporation or its stockholders "
    "for monetary damages for breach of fiduciary duty to the fullest extent permitted by the "
    "DGCL." + _DISCLAIMER
)

# --- W1: Bylaws ---------------------------------------------------------------------------------

_BYLAWS = (
    "# Bylaws of {company_name}\n"
    "_A {entity_type} · standard form · Draft {today} · Pending attorney review_\n\n"
    "## Article I — Offices\n"
    "The registered office shall be in the State of {jurisdiction}. The Corporation may also have "
    "offices at such other places as the Board of Directors may from time to time determine.\n\n"
    "## Article II — Meetings of Stockholders\n"
    "Annual meetings shall be held for the election of directors. Special meetings may be called "
    "by the Board or the holders of a majority of the outstanding voting stock. Each holder of "
    "record is entitled to one vote per share of Common Stock.\n\n"
    "## Article III — Board of Directors\n"
    "The business and affairs of the Corporation shall be managed by its Board of Directors. The "
    "initial directors are: {founders}. Directors are elected at the annual meeting and hold "
    "office until their successors are elected.\n\n"
    "## Article IV — Officers\n"
    "The officers shall be a President, a Secretary, and a Treasurer, and such other officers as "
    "the Board may appoint, each elected by and serving at the discretion of the Board.\n\n"
    "## Article V — Stock\n"
    "Shares shall be represented by certificates or held in uncertificated (book-entry) form and "
    "recorded in the Corporation's stock ledger.\n\n"
    "## Article VI — Indemnification\n"
    "The Corporation shall indemnify its directors and officers to the fullest extent permitted "
    "by law.\n\n"
    "## Article VII — Amendments\n"
    "These Bylaws may be amended by the Board of Directors or by the stockholders." + _DISCLAIMER
)

# --- W1: Action of Incorporator / Initial Board Consent -----------------------------------------

_BOARD_CONSENT = (
    "# Action by Unanimous Written Consent of the Board of Directors\n"
    "## of {company_name}\n"
    "_In lieu of an organizational meeting · standard form · Draft {today} · Pending attorney "
    "review_\n\n"
    "The undersigned, being all of the directors of {company_name}, a {jurisdiction} corporation, "
    "adopt the following resolutions by written consent:\n\n"
    "**1. Adoption of Bylaws.** RESOLVED, that the Bylaws presented to the Board are adopted as "
    "the Bylaws of the Corporation.\n\n"
    "**2. Election of Officers.** RESOLVED, that the following persons are elected to the offices "
    "set forth beside their names: {founders}.\n\n"
    "**3. Issuance of Founder Stock.** RESOLVED, that the Corporation issue shares of Common Stock "
    "to the founders pursuant to Restricted Stock Purchase Agreements, subject to vesting.\n\n"
    "**4. Bank Account.** RESOLVED, that the officers are authorized to open a bank account in "
    "the name of the Corporation.\n\n"
    "**5. Tax & EIN.** RESOLVED, that the officers are authorized to obtain an Employer "
    "Identification Number and make any necessary tax elections.\n\n"
    "Directors: {founders}" + _DISCLAIMER
)

# --- W1: Founder Restricted Stock Purchase Agreement --------------------------------------------

_FSPA = (
    "# Restricted Stock Purchase Agreement\n"
    "_Founder common stock with vesting · standard form · Draft {today} · Pending attorney "
    "review_\n\n"
    "This Restricted Stock Purchase Agreement is made between {company_name}, a {jurisdiction} "
    "corporation (the \"Company\"), and the purchaser named below (the \"Purchaser\").\n\n"
    "## 1. Purchase\n"
    "The Purchaser agrees to purchase [NUMBER OF SHARES — TO BE COMPLETED] shares of the "
    "Company's Common Stock at {par_value} per share.\n\n"
    "## 2. Vesting / Repurchase Option\n"
    "The shares are subject to a Repurchase Option in favor of the Company that lapses over a "
    "four-year period with a one-year cliff (25% after twelve months, the remainder monthly "
    "thereafter), unless otherwise specified.\n\n"
    "## 3. 83(b) Election\n"
    "The Purchaser is strongly advised to file an election under Section 83(b) of the Internal "
    "Revenue Code within 30 days of purchase. **This deadline cannot be extended.**\n\n"
    "## 4. Restrictions on Transfer\n"
    "The shares may not be transferred except in compliance with this Agreement and applicable "
    "securities laws, and are subject to a right of first refusal.\n\n"
    "## 5. Purchaser\n"
    "Name: {founder_name} · Title: {founder_title}" + _DISCLAIMER
)

# --- W2: PIIA -----------------------------------------------------------------------------------

_PIIA = (
    "# Proprietary Information and Inventions Assignment Agreement (PIIA)\n"
    "_Standard form · Draft {today} · Pending attorney review_\n\n"
    "In consideration of my engagement by {company_name} (the \"Company\"), I agree as follows:\n\n"
    "## 1. Proprietary Information\n"
    "I will hold in strict confidence and not disclose or use, except for the Company's benefit, "
    "any Proprietary Information of the Company.\n\n"
    "## 2. Assignment of Inventions\n"
    "I assign to the Company all right, title, and interest in any Inventions that I make or "
    "conceive during my engagement that relate to the Company's business or result from work "
    "performed for the Company.\n\n"
    "## 3. Prior Inventions\n"
    "Inventions I made before this engagement are listed in Exhibit A; if none are listed, I "
    "represent there are none. [PRIOR INVENTIONS — TO BE COMPLETED, OR 'NONE']\n\n"
    "## 4. Further Assurances\n"
    "I will assist the Company in obtaining and enforcing intellectual property rights in the "
    "Inventions, and appoint the Company as my attorney-in-fact for that purpose.\n\n"
    "## 5. No Conflicting Obligations\n"
    "My performance does not breach any agreement to keep confidential the proprietary "
    "information of a third party.\n\n"
    "Signed: ________________________   Date: ____________" + _DISCLAIMER
)

# --- W2: Technology Assignment Agreement --------------------------------------------------------

_TAA = (
    "# Technology Assignment Agreement (TAA)\n"
    "_Assigns pre-incorporation IP to the company · standard form · Draft {today} · Pending "
    "attorney review_\n\n"
    "This Technology Assignment Agreement is made between {company_name}, a {jurisdiction} "
    "corporation (the \"Company\"), and the assignor named below (the \"Assignor\").\n\n"
    "## 1. Assignment\n"
    "The Assignor irrevocably assigns to the Company all right, title, and interest in the "
    "technology, code, designs, content, and other intellectual property developed before "
    "incorporation that relates to the Company's business: {one_liner}.\n\n"
    "## 2. Consideration\n"
    "In exchange, the Company issues shares of Common Stock to the Assignor under a separate "
    "Restricted Stock Purchase Agreement.\n\n"
    "## 3. Moral Rights & Further Assurances\n"
    "The Assignor waives any moral rights and agrees to execute documents reasonably necessary to "
    "perfect the Company's ownership.\n\n"
    "## 4. Representations\n"
    "The Assignor represents that they have the right to make this assignment and that the "
    "assigned IP does not knowingly infringe the rights of others.\n\n"
    "Assignor: {founder_name}" + _DISCLAIMER
)

# --- W2: Mutual NDA -----------------------------------------------------------------------------

_NDA = (
    "# Mutual Non-Disclosure Agreement\n"
    "_Standard form · Draft {today} · Pending attorney review_\n\n"
    "This Agreement is between {company_name} and [COUNTERPARTY — TO BE COMPLETED] "
    "(each a \"Party\").\n\n"
    "## 1. Confidential Information\n"
    "Each Party may disclose confidential business, technical, and financial information in "
    "connection with evaluating a potential relationship regarding {one_liner}.\n\n"
    "## 2. Obligations\n"
    "The receiving Party shall (a) hold Confidential Information in strict confidence, (b) use it "
    "solely to evaluate the relationship, and (c) limit access to those with a need to know.\n\n"
    "## 3. Exclusions\n"
    "Confidential Information does not include information that is public, independently "
    "developed, or rightfully received from a third party.\n\n"
    "## 4. Term\n"
    "Confidentiality obligations survive for three (3) years from the date of disclosure.\n\n"
    "## 5. Governing Law\n"
    "This Agreement is governed by the laws of the State of {governing_state}." + _DISCLAIMER
)

# --- W2: FAST advisor agreement -----------------------------------------------------------------

_ADVISOR = (
    "# Advisor Agreement\n"
    "_Based on the Founder Institute FAST (Founder/Advisor Standard Template) · Draft {today} · "
    "Pending attorney review_\n\n"
    "This Agreement is between {company_name} (the \"Company\") and "
    "[ADVISOR NAME — TO BE COMPLETED] (the \"Advisor\").\n\n"
    "## 1. Services\n"
    "The Advisor will provide advice and mentorship to the Company on a non-exclusive basis.\n\n"
    "## 2. Compensation — Equity\n"
    "The Company will grant the Advisor a restricted stock or option award equal to "
    "[0.25%–1.00% — TO BE COMPLETED] of the Company, vesting monthly over 24 months, per the FAST "
    "engagement level selected.\n\n"
    "## 3. Confidentiality & IP\n"
    "The Advisor will keep Company information confidential and assigns to the Company any IP "
    "created in the course of advising.\n\n"
    "## 4. Independent Contractor\n"
    "The Advisor is an independent contractor, not an employee, and is responsible for their own "
    "taxes.\n\n"
    "## 5. Term\n"
    "Either party may terminate on 30 days' notice; vested equity is retained." + _DISCLAIMER
)

# --- W2/W6: Independent Contractor Agreement ----------------------------------------------------

_CONTRACTOR = (
    "# Independent Contractor Agreement\n"
    "_Standard form · Draft {today} · Pending attorney review_\n\n"
    "This Agreement is between {company_name} (the \"Company\") and "
    "[CONTRACTOR — TO BE COMPLETED] (the \"Contractor\").\n\n"
    "## 1. Services\n"
    "The Contractor will perform the services described in the applicable Statement of Work.\n\n"
    "## 2. Compensation\n"
    "The Company will pay the fees set out in the Statement of Work: "
    "[FEES — TO BE COMPLETED].\n\n"
    "## 3. Work Product & IP Assignment\n"
    "All work product is a \"work made for hire,\" and the Contractor assigns to the Company all "
    "right, title, and interest in the deliverables and related intellectual property.\n\n"
    "## 4. Confidentiality\n"
    "The Contractor will keep the Company's confidential information confidential.\n\n"
    "## 5. Independent Contractor Status\n"
    "The Contractor is not an employee and is responsible for their own taxes and benefits."
    + _DISCLAIMER
)

# --- W6: Offer Letter ---------------------------------------------------------------------------

_OFFER = (
    "# Employment Offer Letter\n"
    "_At-will employment · standard form · Draft {today} · Pending attorney review_\n\n"
    "Dear [CANDIDATE NAME — TO BE COMPLETED],\n\n"
    "{company_name} (the \"Company\") is pleased to offer you the position of "
    "[TITLE — TO BE COMPLETED], reporting to [MANAGER — TO BE COMPLETED].\n\n"
    "## Compensation\n"
    "Base salary of [SALARY — TO BE COMPLETED], paid on the Company's regular payroll schedule.\n\n"
    "## Equity\n"
    "Subject to Board approval, you will be granted an option to purchase "
    "[NUMBER OF SHARES — TO BE COMPLETED] shares, vesting over four years with a one-year "
    "cliff.\n\n"
    "## At-Will Employment\n"
    "Your employment is at-will and may be terminated by you or the Company at any time, with or "
    "without cause or notice.\n\n"
    "## Conditions\n"
    "This offer is contingent on signing the Company's PIIA and verifying your eligibility to "
    "work.\n\n"
    "Sincerely,\n{founder_name}, {founder_title} — {company_name}" + _DISCLAIMER
)

# --- Generic fallback for everything else -------------------------------------------------------

GENERIC_TEMPLATE = (
    "# {doc_title}\n"
    "**{company_name}** · {entity_type} · {jurisdiction}\n"
    "_Draft · {today} · Pending attorney review_\n\n"
    "## 1. Parties\n"
    "This {doc_title} is made by and on behalf of **{company_name}**, a {entity_type} organized "
    "under the laws of {jurisdiction}{founders_clause}.\n\n"
    "## 2. Purpose\n{purpose}\n\n"
    "## 3. Company details\n"
    "- Legal name: {company_name}\n"
    "- Entity type: {entity_type}\n"
    "- Jurisdiction: {jurisdiction}\n"
    "- EIN: {ein}\n"
    "- Business: {one_liner}\n" + _DISCLAIMER
)

_SPECIFIC: list[tuple[tuple[str, ...], str, list[str]]] = [
    (("safe",), _YC_SAFE, ["Pro rata side letter (optional)", "Cap table impact review"]),
    (("83(b)", "83b"), _ELECTION_83B, ["Certified-mail proof of filing", "Copy to the company"]),
    (
        ("certificate of incorporation", "articles of organization"),
        _CERTIFICATE,
        ["Registered agent designation", "Authorized share count confirmation"],
    ),
    (("bylaws",), _BYLAWS, ["Indemnification of directors and officers", "Amendment procedure"]),
    (
        ("board consent", "incorporator"),
        _BOARD_CONSENT,
        ["Officer titles confirmed", "Share issuance approved"],
    ),
    (
        ("stock purchase",),
        _FSPA,
        ["Vesting schedule confirmed", "83(b) election filed within 30 days"],
    ),
    (
        ("proprietary information", "piia"),
        _PIIA,
        ["Exhibit A — prior inventions", "Signed before access to code"],
    ),
    (("technology assignment",), _TAA, ["Scope of assigned IP", "Stock issued as consideration"]),
    (
        ("non-disclosure", "nda"),
        _NDA,
        ["Definition of Confidential Information", "Return/destruction of materials"],
    ),
    (("advisor",), _ADVISOR, ["FAST engagement level", "Equity vesting over 24 months"]),
    (
        ("independent contractor", "consulting"),
        _CONTRACTOR,
        ["Statement of Work attached", "Work-made-for-hire + IP assignment"],
    ),
    (("offer letter",), _OFFER, ["At-will language", "Contingent on signed PIIA"]),
]

_GENERIC_CLAUSES = [
    "Entire agreement and severability",
    "Governing law and dispute resolution",
    "Counterparts and electronic signature",
]


def grounding_for(doc_type: str) -> Grounding:
    name = doc_type.lower()
    for keywords, template, clauses in _SPECIFIC:
        if any(k in name for k in keywords):
            return Grounding(template=template, clauses=clauses)
    return Grounding(template=GENERIC_TEMPLATE, clauses=_GENERIC_CLAUSES)


async def load_grounding(req: GenerateRequest) -> Grounding:
    return grounding_for(req.doc_type)
