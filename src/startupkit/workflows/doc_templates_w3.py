"""W3 · Financial — Generate-phase templates.

The SAFEs, board consent and pro rata side letter are the UNMODIFIED Y Combinator post-money forms
(https://www.ycombinator.com/documents) with only the blanks and bracketed terms tokenized — the
instruments themselves represent that neither party has modified the form except to fill in blanks.
The Financial and Expense Policy is a StartupKit-authored internal governance document. These are
drafts for review, not legal advice; entity-gated to Delaware C-Corps at the workflow layer.
"""

from __future__ import annotations

from startupkit.workflows.catalog import DocField

_INVESTOR = DocField(key="investor_name", label="Investor name", placeholder="e.g. Y Combinator")
_PURCHASE = DocField(
    key="purchase_amount", label="Purchase amount", placeholder="500,000", kind="money"
)
_OFFICER_NAME = DocField(
    key="officer_name", label="Signing officer name", placeholder="e.g. the CEO",
    prefill="founder.name",
)
_OFFICER_TITLE = DocField(
    key="officer_title", label="Signing officer title", placeholder="Chief Executive Officer"
)
_VALUATION_CAP = DocField(
    key="valuation_cap", label="Post-money valuation cap", placeholder="10,000,000", kind="money"
)

SAFE_COMMON_FIELDS = [
    _INVESTOR,
    _PURCHASE,
    DocField(key="safe_date", label="Date of SAFE", kind="date"),
    DocField(key="governing_law", label="Governing law (state)", placeholder="Delaware"),
    _OFFICER_NAME,
    _OFFICER_TITLE,
]
SAFE_CAP_FIELDS = [*SAFE_COMMON_FIELDS, _VALUATION_CAP]
SAFE_DISCOUNT_FIELDS = [
    *SAFE_COMMON_FIELDS,
    DocField(
        key="discount_rate", label="Discount rate (100 minus your discount)", placeholder="80"
    ),
]
SAFE_MFN_FIELDS = list(SAFE_COMMON_FIELDS)

CONSENT_CAP_FIELDS = [
    DocField(key="consent_date", label="Effective date", kind="date"),
    _INVESTOR,
    _PURCHASE,
    _VALUATION_CAP,
    _OFFICER_NAME,
    _OFFICER_TITLE,
    DocField(
        key="director_name", label="Director name", placeholder="First director",
        prefill="founder.name",
    ),
    DocField(
        key="director_2", label="Second director (optional)",
        placeholder="Leave blank if sole director",
    ),
]

SIDE_LETTER_FIELDS = [
    DocField(key="safe_date", label="Date of SAFE", kind="date"),
    _INVESTOR,
    _OFFICER_NAME,
    _OFFICER_TITLE,
]

FINANCIAL_POLICY_FIELDS = [
    DocField(key="adoption_date", label="Adoption date", kind="date"),
    DocField(key="adopter", label="Adopted by", placeholder="Board of Directors"),
    DocField(
        key="approver_tier2", label="Tier 2 approver (over $500)",
        placeholder="a co-founder or department head",
    ),
    DocField(key="approver_tier3", label="Tier 3 approver (over $5,000)", placeholder="the CEO"),
    DocField(
        key="expense_channel", label="Expense submission channel",
        placeholder="your expense tool or form",
    ),
    DocField(
        key="reimburse_timing", label="Reimbursement timing",
        placeholder="the next regular payroll cycle",
    ),
    DocField(key="admin_role", label="Policy administrator", placeholder="the CEO or finance lead"),
    _OFFICER_NAME,
    _OFFICER_TITLE,
]

SAFE_CAP_TEMPLATE = """\
THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE
SECURITIES ACT OF 1933, AS AMENDED (THE “SECURITIES ACT”), OR UNDER THE SECURITIES LAWS OF CERTAIN
STATES.  THESE SECURITIES MAY NOT BE OFFERED, SOLD OR OTHERWISE TRANSFERRED, PLEDGED OR
HYPOTHECATED EXCEPT AS PERMITTED IN THIS SAFE AND UNDER THE ACT AND APPLICABLE STATE SECURITIES
LAWS PURSUANT TO AN EFFECTIVE REGISTRATION STATEMENT OR AN EXEMPTION THEREFROM.

{{company.name}}

SAFE

(Simple Agreement for Future Equity)

THIS CERTIFIES THAT in exchange for the payment by {{investor_name}} (the “Investor”) of
${{purchase_amount}} (the “Purchase Amount”) on or about {{safe_date}}, {{company.name}}, a
{{company.jurisdiction}} corporation (the “Company”), issues to the Investor the right to certain
shares of the Company’s Capital Stock, subject to the terms described below.

This Safe is one of the forms available at http://ycombinator.com/documents and the Company and the
Investor agree that neither one has modified the form, except to fill in blanks and bracketed
terms.

The “Post-Money Valuation Cap” is ${{valuation_cap}}.  See Section 2 for certain additional defined
terms.

1. Events

(a) Equity Financing. If there is an Equity Financing before the termination of this Safe, on the
initial closing of such Equity Financing, this Safe will automatically convert into the greater of:
(1) the number of shares of Standard Preferred Stock equal to the Purchase Amount divided by the
lowest price per share of the Standard Preferred Stock; or (2) the number of shares of Safe
Preferred Stock equal to the Purchase Amount divided by the Safe Price.

In connection with the automatic conversion of this Safe into shares of Standard Preferred Stock or
Safe Preferred Stock, the Investor will execute and deliver to the Company all of the transaction
documents related to the Equity Financing; provided, that such documents (i) are the same documents
to be entered into with the purchasers of Standard Preferred Stock, with appropriate variations for
the Safe Preferred Stock if applicable, and (ii) have customary exceptions to any drag-along
applicable to the Investor, including (without limitation) limited representations, warranties,
liability and indemnification obligations for the Investor.

(b) Liquidity Event.  If there is a Liquidity Event before the termination of this Safe, the
Investor will automatically be entitled (subject to the liquidation priority set forth in Section
1(d) below) to receive a portion of Proceeds, due and payable to the Investor immediately prior to,
or concurrent with, the consummation of such Liquidity Event, equal to the greater of (i) the
Purchase Amount (the “Cash-Out Amount”) or (ii) the amount payable on the number of shares of
Common Stock equal to the Purchase Amount divided by the Liquidity Price (the “Conversion Amount”).
If any of the Company’s securityholders are given a choice as to the form and amount of Proceeds to
be received in a Liquidity Event, the Investor will be given the same choice, provided that the
Investor may not choose to receive a form of consideration that the Investor would be ineligible to
receive as a result of the Investor’s failure to satisfy any requirement or limitation generally
applicable to the Company’s securityholders, or under any applicable laws.

Notwithstanding the foregoing, in connection with a Change of Control intended to qualify as a
tax-free reorganization, the Company may reduce the cash portion of Proceeds payable to the
Investor by the amount determined by its board of directors in good faith for such Change of
Control to qualify as a tax-free reorganization for U.S. federal income tax purposes, provided that
such reduction (A) does not reduce the total Proceeds payable to such Investor and (B) is applied
in the same manner and on a pro rata basis to all securityholders who have equal priority to the
Investor under Section 1(d).

(c) Dissolution Event. If there is a Dissolution Event before the termination of this Safe, the
Investor will automatically be entitled (subject to the liquidation priority set forth in Section
1(d) below) to receive a portion of Proceeds equal to the Cash-Out Amount, due and payable to the
Investor immediately prior to the consummation of the Dissolution Event.

(d) Liquidation Priority.  In a Liquidity Event or Dissolution Event, this Safe is intended to
operate like standard non-participating Preferred Stock.  The Investor’s right to receive its
Cash-Out Amount is:

(i) Junior to payment of outstanding indebtedness and creditor claims, including contractual claims
for payment and convertible promissory notes (to the extent such convertible promissory notes are
not actually or notionally converted into Capital Stock);

(ii) On par with payments for other Safes and/or Preferred Stock, and if the applicable Proceeds
are insufficient to permit full payments to the Investor and such other Safes and/or Preferred
Stock, the applicable Proceeds will be distributed pro rata to the Investor and such other Safes
and/or Preferred Stock in proportion to the full payments that would otherwise be due; and

(iii) Senior to payments for Common Stock.

The Investor’s right to receive its Conversion Amount is (A) on par with payments for Common Stock
and other Safes and/or Preferred Stock who are also receiving Conversion Amounts or Proceeds on a
similar as-converted to Common Stock basis, and (B) junior to payments described in clauses (i) and
(ii) above (in the latter case, to the extent such payments are Cash-Out Amounts or similar
liquidation preferences).

(e) Termination.  This Safe will automatically terminate (without relieving the Company of any
obligations arising from a prior breach of or non-compliance with this Safe) immediately following
the earliest to occur of: (i) the issuance of Capital Stock to the Investor pursuant to the
automatic conversion of this Safe under Section 1(a); or (ii) the payment, or setting aside for
payment, of amounts due the Investor pursuant to Section 1(b) or Section 1(c).

2. Definitions

“Capital Stock” means the capital stock of the Company, including, without limitation, the “Common
Stock” and the “Preferred Stock.”

“Change of Control” means (i) a transaction or series of related transactions in which any “person”
or “group” (within the meaning of Section 13(d) and 14(d) of the Securities Exchange Act of 1934,
as amended), becomes the “beneficial owner” (as defined in Rule 13d-3 under the Securities Exchange
Act of 1934, as amended), directly or indirectly, of more than 50% of the outstanding voting
securities of the Company having the right to vote for the election of members of the Company’s
board of directors, (ii) any reorganization, merger or consolidation of the Company, other than a
transaction or series of related transactions in which the holders of the voting securities of the
Company outstanding immediately prior to such transaction or series of related transactions retain,
immediately after such transaction or series of related transactions, at least a majority of the
total voting power represented by the outstanding voting securities of the Company or such other
surviving or resulting entity or (iii) a sale, lease or other disposition of all or substantially
all of the assets of the Company.

“Company Capitalization” is calculated as of immediately prior to the Equity Financing and (without
double-counting, in each case calculated on an as-converted to Common Stock basis):

Includes all shares of Capital Stock issued and outstanding;

Includes all Converting Securities;

Includes all (i) issued and outstanding Options and (ii) Promised Options; and

Includes the Unissued Option Pool, except that any increase to the Unissued Option Pool in
connection with the Equity Financing will only be included to the extent that the number of
Promised Options exceeds the Unissued Option Pool prior to such increase.

“Converting Securities” includes this Safe and other convertible securities issued by the Company,
including but not limited to: (i) other Safes; (ii) convertible promissory notes and other
convertible debt instruments; and (iii) convertible securities that have the right to convert into
shares of Capital Stock.

“Direct Listing” means the Company’s initial listing of its Common Stock (other than shares of
Common Stock not eligible for resale under Rule 144 under the Securities Act) on a national
securities exchange by means of an effective registration statement on Form S-1 filed by the
Company with the SEC that registers shares of existing capital stock of the Company for resale, as
approved by the Company’s board of directors. For the avoidance of doubt, a Direct Listing will not
be deemed to be an underwritten offering and will not involve any underwriting services.

“Dissolution Event” means (i) a voluntary termination of operations, (ii) a general assignment for
the benefit of the Company’s creditors or (iii) any other liquidation, dissolution or winding up of
the Company (excluding a Liquidity Event), whether voluntary or involuntary.

“Dividend Amount” means, with respect to any date on which the Company pays a dividend on its
outstanding Common Stock, the amount of such dividend that is paid per share of Common Stock
multiplied by (x) the Purchase Amount divided by (y) the Liquidity Price (treating the dividend
date as a Liquidity Event solely for purposes of calculating such Liquidity Price).

“Equity Financing” means a bona fide transaction or series of transactions with the principal
purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a
fixed valuation, including but not limited to, a pre-money or post-money valuation.

“Initial Public Offering” means the closing of the Company’s first firm commitment underwritten
initial public offering of Common Stock pursuant to a registration statement filed under the
Securities Act.

“Liquidity Capitalization” is calculated as of immediately prior to the Liquidity Event, and
(without double- counting, in each case calculated on an as-converted to Common Stock basis):

Includes all shares of Capital Stock issued and outstanding;

Includes all (i) issued and outstanding Options and (ii) to the extent receiving Proceeds, Promised
Options;

Includes all Converting Securities, other than any Safes and other convertible securities
(including without limitation shares of Preferred Stock) where the holders of such securities are
receiving Cash-Out Amounts or similar liquidation preference payments in lieu of Conversion Amounts
or similar “as-converted” payments; and

Excludes the Unissued Option Pool.

“Liquidity Event” means a Change of Control, a Direct Listing or an Initial Public Offering.

“Liquidity Price” means the price per share equal to the Post-Money Valuation Cap divided by the
Liquidity Capitalization.

“Options” includes options, restricted stock awards or purchases, RSUs, SARs, warrants or similar
securities, vested or unvested.

“Proceeds” means cash and other assets (including without limitation stock consideration) that are
proceeds from the Liquidity Event or the Dissolution Event, as applicable, and legally available
for distribution.

“Promised Options” means promised but ungranted Options that are the greater of those (i) promised
pursuant to agreements or understandings made prior to the execution of, or in connection with, the
term sheet or letter of intent for the Equity Financing or Liquidity Event, as applicable (or the
initial closing of the Equity Financing or consummation of the Liquidity Event, if there is no term
sheet or letter of intent), (ii) in the case of an Equity Financing, treated as outstanding Options
in the calculation of the Standard Preferred Stock’s price per share, or (iii) in the case of a
Liquidity Event, treated as outstanding Options in the calculation of the distribution of the
Proceeds.

“Safe” means an instrument containing a future right to shares of Capital Stock, similar in form
and content to this instrument, purchased by investors for the purpose of funding the Company’s
business operations.  References to “this Safe” mean this specific instrument.

“Safe Preferred Stock” means the shares of the series of Preferred Stock issued to the Investor in
an Equity Financing, having the identical rights, privileges, preferences, seniority, liquidation
multiple and restrictions as the shares of Standard Preferred Stock, except that any price-based
preferences (such as the per share liquidation amount, initial conversion price and per share
dividend amount) will be based on the Safe Price.

“Safe Price” means the price per share equal to the Post-Money Valuation Cap divided by the Company
Capitalization.

“Standard Preferred Stock” means the shares of the series of Preferred Stock issued to the
investors investing new money in the Company in connection with the initial closing of the Equity
Financing.

“Unissued Option Pool” means all shares of Capital Stock that are reserved, available for future
grant and not subject to any outstanding Options or Promised Options (but in the case of a
Liquidity Event, only to the extent Proceeds are payable on such Promised Options) under any equity
incentive or similar Company plan.

3. Company Representations

(a) The Company is a corporation duly organized, validly existing and in good standing under the
laws of its state of incorporation, and has the power and authority to own, lease and operate its
properties and carry on its business as now conducted.

(b) The execution, delivery and performance by the Company of this Safe is within the power of the
Company and has been duly authorized by all necessary actions on the part of the Company (subject
to section 3(d)). This Safe constitutes a legal, valid and binding obligation of the Company,
enforceable against the Company in accordance with its terms, except as limited by bankruptcy,
insolvency or other laws of general application relating to or affecting the enforcement of
creditors’ rights generally and general principles of equity.  To its knowledge, the Company is not
in violation of (i) its current certificate of incorporation or bylaws, (ii) any material statute,
rule or regulation applicable to the Company or (iii) any material debt or contract to which the
Company is a party or by which it is bound, where, in each case, such violation or default,
individually, or together with all such violations or defaults, could reasonably be expected to
have a material adverse effect on the Company.

(c) The performance and consummation of the transactions contemplated by this Safe do not and will
not: (i) violate any material judgment, statute, rule or regulation applicable to the Company;
(ii) result in the acceleration of any material debt or contract to which the Company is a party or
by which it is bound; or (iii) result in the creation or imposition of any lien on any property,
asset or revenue of the Company or the suspension, forfeiture, or nonrenewal of any material
permit, license or authorization applicable to the Company, its business or operations.

(d) No consents or approvals are required in connection with the performance of this Safe, other
than: (i) the Company’s corporate approvals; (ii) any qualifications or filings under applicable
securities laws; and (iii) necessary corporate approvals for the authorization of Capital Stock
issuable pursuant to Section 1.

(e) To its knowledge, the Company owns or possesses (or can obtain on commercially reasonable
terms) sufficient legal rights to all patents, trademarks, service marks, trade names, copyrights,
trade secrets, licenses, information, processes and other intellectual property rights necessary
for its business as now conducted and as currently proposed to be conducted, without any conflict
with, or infringement of the rights of, others.

4. Investor Representations

(a) The Investor has full legal capacity, power and authority to execute and deliver this Safe and
to perform its obligations hereunder. This Safe constitutes a valid and binding obligation of the
Investor, enforceable in accordance with its terms, except as limited by bankruptcy, insolvency or
other laws of general application relating to or affecting the enforcement of creditors’ rights
generally and general principles of equity.

(b) The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D
under the Securities Act, and acknowledges and agrees that if not an accredited investor at the
time of an Equity Financing, the Company may void this Safe and return the Purchase Amount. The
Investor has been advised that this Safe and the underlying securities have not been registered
under the Securities Act, or any state securities laws and, therefore, cannot be resold unless they
are registered under the Securities Act and applicable state securities laws or unless an exemption
from such registration requirements is available. The Investor is purchasing this Safe and the
securities to be acquired by the Investor hereunder for its own account for investment, not as a
nominee or agent, and not with a view to, or for resale in connection with, the distribution
thereof, and the Investor has no present intention of selling, granting any participation in, or
otherwise distributing the same. The Investor has such knowledge and experience in financial and
business matters that the Investor is capable of evaluating the merits and risks of such
investment, is able to incur a complete loss of such investment without impairing the Investor’s
financial condition and is able to bear the economic risk of such investment for an indefinite
period of time.

5. Miscellaneous

(a) Any provision of this Safe may be amended, waived or modified by written consent of the Company
and either (i) the Investor or (ii) the majority-in-interest of all then-outstanding Safes with the
same “Post-Money Valuation Cap” and “Discount Rate” as this Safe (and Safes lacking one or both of
such terms will be considered to be the same with respect to such term(s)), provided that with
respect to clause (ii): (A) the Purchase Amount may not be amended, waived or modified in this
manner, (B) the consent of the Investor and each holder of such Safes must be solicited (even if
not obtained), and (C) such amendment, waiver or modification treats all such holders in the same
manner. “Majority-in-interest” refers to the holders of the applicable group of Safes whose Safes
have a total Purchase Amount greater than 50% of the total Purchase Amount of all of such
applicable group of Safes.

(b) Any notice required or permitted by this Safe will be deemed sufficient when delivered
personally or by overnight courier or sent by email to the relevant address listed on the signature
page, or 48 hours after being deposited in the U.S. mail as certified or registered mail with
postage prepaid, addressed to the party to be notified at such party’s address listed on the
signature page, as subsequently modified by written notice.

(c) The Investor is not entitled, as a holder of this Safe, to vote or be deemed a holder of
Capital Stock for any purpose other than tax purposes, nor will anything in this Safe be construed
to confer on the Investor, as such, any rights of a Company stockholder or rights to vote for the
election of directors or on any matter submitted to Company stockholders, or to give or withhold
consent to any corporate action or to receive notice of meetings, until shares have been issued on
the terms described in Section 1.  However, if the Company pays a dividend on outstanding shares of
Common Stock (that is not payable in shares of Common Stock) while this Safe is outstanding, the
Company will pay the Dividend Amount to the Investor at the same time.

(d) Neither this Safe nor the rights in this Safe are transferable or assignable, by operation of
law or otherwise, by either party without the prior written consent of the other; provided,
however, that this Safe and/or its rights may be assigned without the Company’s consent by the
Investor (i) to the Investor’s estate, heirs, executors, administrators, guardians and/or
successors in the event of Investor’s death or disability, or (ii) to any other entity who directly
or indirectly, controls, is controlled by or is under common control with the Investor, including,
without limitation, any general partner, managing member, officer or director of the Investor, or
any venture capital fund now or hereafter existing which is controlled by one or more general
partners or managing members of, or shares the same management company with, the Investor.

(e) In the event any one or more of the provisions of this Safe is for any reason held to be
invalid, illegal or unenforceable, in whole or in part or in any respect, or in the event that any
one or more of the provisions of this Safe operate or would prospectively operate to invalidate
this Safe, then and in any such event, such provision(s) only will be deemed null and void and will
not affect any other provision of this Safe and the remaining provisions of this Safe will remain
operative and in full force and effect and will not be affected, prejudiced, or disturbed thereby.

(f) All rights and obligations hereunder will be governed by the laws of the State of
{{governing_law}}, without regard to the conflicts of law provisions of such jurisdiction.

(g) The parties acknowledge and agree that for United States federal and state income tax purposes
this Safe is, and at all times has been, intended to be characterized as stock, and more
particularly as common stock for purposes of Sections 304, 305, 306, 354, 368, 1036 and 1202 of the
Internal Revenue Code of 1986, as amended.  Accordingly, the parties agree to treat this Safe
consistent with the foregoing intent for all United States federal and state income tax purposes
(including, without limitation, on their respective tax returns or other informational statements).

(Signature page follows)

IN WITNESS WHEREOF, the undersigned have caused this Safe to be duly executed and delivered.

{{company.name}}

By:

{{officer_name}}

{{officer_title}}

Address:

Email:

INVESTOR:

By:

Name:

Title:

Address:

Email:
---

## 📤 What to do next
1. Confirm the deal terms above match your board consent and, for a cap SAFE, the side letter —
   investor, purchase amount, date and economic term must be identical across all three.
2. Have both parties sign — StartupKit can route it for e-signature, or export and use your own.
3. File a Form D with the SEC within 15 days of the first sale, plus any state "blue sky" notices.
4. Record the SAFE on your cap table and keep the signed copy with your corporate records.

"""

SAFE_DISCOUNT_TEMPLATE = """\
THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE
SECURITIES ACT OF 1933, AS AMENDED (THE “SECURITIES ACT”), OR UNDER THE SECURITIES LAWS OF CERTAIN
STATES.  THESE SECURITIES MAY NOT BE OFFERED, SOLD OR OTHERWISE TRANSFERRED, PLEDGED OR
HYPOTHECATED EXCEPT AS PERMITTED IN THIS SAFE AND UNDER THE ACT AND APPLICABLE STATE SECURITIES
LAWS PURSUANT TO AN EFFECTIVE REGISTRATION STATEMENT OR AN EXEMPTION THEREFROM.

[COMPANY NAME]

SAFE

(Simple Agreement for Future Equity)

THIS CERTIFIES THAT in exchange for the payment by {{investor_name}} (the “Investor”) of
${{purchase_amount}} (the “Purchase Amount”) on or about {{safe_date}}, {{company.name}}, a
{{company.jurisdiction}} corporation (the “Company”), issues to the Investor the right to certain
shares of the Company’s Capital Stock, subject to the terms described below.

This Safe is one of the forms available at http://ycombinator.com/documents and the Company and the
Investor agree that neither one has modified the form, except to fill in blanks and bracketed
terms.

The “Discount Rate” is {{discount_rate}}%.

See Section 2 for certain additional defined terms.

1. Events

(a) Equity Financing. If there is an Equity Financing before the termination of this Safe, on the
initial closing of such Equity Financing, this Safe will automatically convert into the number of
shares of Safe Preferred Stock equal to the Purchase Amount divided by the Discount Price.

In connection with the automatic conversion of this Safe into shares of Safe Preferred Stock, the
Investor will execute and deliver to the Company all of the transaction documents related to the
Equity Financing; provided, that such documents (i) are the same documents to be entered into with
the purchasers of Standard Preferred Stock, with appropriate variations for the Safe Preferred
Stock if applicable, and (ii) have customary exceptions to any drag-along applicable to the
Investor, including (without limitation) limited representations, warranties, liability and
indemnification obligations for the Investor.

(b) Liquidity Event. If there is a Liquidity Event before the termination of this Safe, the
Investor will automatically be entitled (subject to the liquidation priority set forth in Section
1(d) below) to receive a portion of Proceeds, due and payable to the Investor immediately prior to,
or concurrent with, the consummation of such Liquidity Event, equal to the greater of (i) the
Purchase Amount (the “Cash-Out Amount”) or (ii) the amount payable on the number of shares of
Common Stock equal to the Purchase Amount divided by the Liquidity Price (the “Conversion Amount”).
If any of the Company’s securityholders are given a choice as to the form and amount of Proceeds to
be received in a Liquidity Event, the Investor will be given the same choice, provided that the
Investor may not choose to receive a form of consideration that the Investor would be ineligible to
receive as a result of the Investor’s failure to satisfy any requirement or limitation generally
applicable to the Company’s securityholders, or under any applicable laws.

Notwithstanding the foregoing, in connection with a Change of Control intended to qualify as a
tax-free reorganization, the Company may reduce the cash portion of Proceeds payable to the
Investor by the amount determined by its board of directors in good faith for such Change of
Control to qualify as a tax-free reorganization for U.S. federal income tax purposes, provided that
such reduction (A) does not reduce the total Proceeds payable to such Investor and (B) is applied
in the same manner and on a pro rata basis to all securityholders who have equal priority to the
Investor under Section 1(d).

(c) Dissolution Event. If there is a Dissolution Event before the termination of this Safe, the
Investor will automatically be entitled (subject to the liquidation priority set forth in Section
1(d) below) to receive a portion of Proceeds equal to the Cash-Out Amount, due and payable to the
Investor immediately prior to the consummation of the Dissolution Event.

(d) Liquidation Priority.  In a Liquidity Event or Dissolution Event, this Safe is intended to
operate like standard non-participating Preferred Stock.  The Investor’s right to receive its
Cash-Out Amount is:

(i) Junior to payment of outstanding indebtedness and creditor claims, including contractual claims
for payment and convertible promissory notes (to the extent such convertible promissory notes are
not actually or notionally converted into Capital Stock);

(ii) On par with payments for other Safes and/or Preferred Stock, and if the applicable Proceeds
are insufficient to permit full payments to the Investor and such other Safes and/or Preferred
Stock, the applicable Proceeds will be distributed pro rata to the Investor and such other Safes
and/or Preferred Stock in proportion to the full payments that would otherwise be due; and

(iii) Senior to payments for Common Stock.

The Investor’s right to receive its Conversion Amount is (A) on par with payments for Common Stock
and other Safes and/or Preferred Stock who are also receiving Conversion Amounts or Proceeds on a
similar as-converted to Common Stock basis, and (B) junior to payments described in clauses (i) and
(ii) above (in the latter case, to the extent such payments are Cash-Out Amounts or similar
liquidation preferences).

(e) Termination.  This Safe will automatically terminate (without relieving the Company of any
obligations arising from a prior breach of or non-compliance with this Safe) immediately following
the earliest to occur of: (i) the issuance of Capital Stock to the Investor pursuant to the
automatic conversion of this Safe under Section 1(a); or (ii) the payment, or setting aside for
payment, of amounts due the Investor pursuant to Section 1(b) or Section 1(c).

2. Definitions

“Capital Stock” means the capital stock of the Company, including, without limitation, the “Common
Stock” and the “Preferred Stock.”

“Change of Control” means (i) a transaction or series of related transactions in which any “person”
or “group” (within the meaning of Section 13(d) and 14(d) of the Securities Exchange Act of 1934,
as amended), becomes the “beneficial owner” (as defined in Rule 13d-3 under the Securities Exchange
Act of 1934, as amended), directly or indirectly, of more than 50% of the outstanding voting
securities of the Company having the right to vote for the election of members of the Company’s
board of directors, (ii) any reorganization, merger or consolidation of the Company, other than a
transaction or series of related transactions in which the holders of the voting securities of the
Company outstanding immediately prior to such transaction or series of related transactions retain,
immediately after such transaction or series of related transactions, at least a majority of the
total voting power represented by the outstanding voting securities of the Company or such other
surviving or resulting entity or (iii) a sale, lease or other disposition of all or substantially
all of the assets of the Company.

“Direct Listing” means the Company’s initial listing of its Common Stock (other than shares of
Common Stock not eligible for resale under Rule 144 under the Securities Act) on a national
securities exchange by means of an effective registration statement on Form S-1 filed by the
Company with the SEC that registers shares of existing capital stock of the Company for resale, as
approved by the Company’s board of directors. For the avoidance of doubt, a Direct Listing will not
be deemed to be an underwritten offering and will not involve any underwriting services.

“Discount Price” means the lowest price per share of the Standard Preferred Stock sold in the
Equity Financing multiplied by the Discount Rate.

“Dissolution Event” means (i) a voluntary termination of operations, (ii) a general assignment for
the benefit of the Company’s creditors or (iii) any other liquidation, dissolution or winding up of
the Company (excluding a Liquidity Event), whether voluntary or involuntary.

“Dividend Amount” means, with respect to any date on which the Company pays a dividend on its
outstanding Common Stock, the amount of such dividend that is paid per share of Common Stock
multiplied by (x) the Purchase Amount divided by (y) the Liquidity Price (treating the dividend
date as a Liquidity Event solely for purposes of calculating such Liquidity Price).

“Equity Financing” means a bona fide transaction or series of transactions with the principal
purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a
fixed valuation, including but not limited to, a pre-money or post-money valuation.

“Initial Public Offering” means the closing of the Company’s first firm commitment underwritten
initial public offering of Common Stock pursuant to a registration statement filed under the
Securities Act.

“Liquidity Event” means a Change of Control, a Direct Listing or an Initial Public Offering.

“Liquidity Price” means the price per share equal to the fair market value of the Common Stock at
the time of the Liquidity Event, as determined by reference to the purchase price payable in
connection with such Liquidity Event, multiplied by the Discount Rate.

“Proceeds” means cash and other assets (including without limitation stock consideration) that are
proceeds from the Liquidity Event or the Dissolution Event, as applicable, and legally available
for distribution.

“Safe” means an instrument containing a future right to shares of Capital Stock, similar in form
and content to this instrument, purchased by investors for the purpose of funding the Company’s
business operations.  References to “this Safe” mean this specific instrument.

“Safe Preferred Stock” means the shares of the series of Preferred Stock issued to the Investor in
an Equity Financing, having the identical rights, privileges, preferences, seniority, liquidation
multiple and restrictions as the shares of Standard Preferred Stock, except that any price-based
preferences (such as the per share liquidation amount, initial conversion price and per share
dividend amount) will be based on the Discount Price.

“Standard Preferred Stock” means the shares of a series of Preferred Stock issued to the investors
investing new money in the Company in connection with the initial closing of the Equity Financing.

3. Company Representations

(a) The Company is a corporation duly organized, validly existing and in good standing under the
laws of its state of incorporation, and has the power and authority to own, lease and operate its
properties and carry on its business as now conducted.

(b) The execution, delivery and performance by the Company of this Safe is within the power of the
Company and has been duly authorized by all necessary actions on the part of the Company (subject
to section 3(d)). This Safe constitutes a legal, valid and binding obligation of the Company,
enforceable against the Company in accordance with its terms, except as limited by bankruptcy,
insolvency or other laws of general application relating to or affecting the enforcement of
creditors’ rights generally and general principles of equity.  To its knowledge, the Company is not
in violation of (i) its current certificate of incorporation or bylaws, (ii) any material statute,
rule or regulation applicable to the Company or (iii) any material debt or contract to which the
Company is a party or by which it is bound, where, in each case, such violation or default,
individually, or together with all such violations or defaults, could reasonably be expected to
have a material adverse effect on the Company.

(c) The performance and consummation of the transactions contemplated by this Safe do not and will
not: (i) violate any material judgment, statute, rule or regulation applicable to the Company;
(ii) result in the acceleration of any material debt or contract to which the Company is a party or
by which it is bound; or (iii) result in the creation or imposition of any lien on any property,
asset or revenue of the Company or the suspension, forfeiture, or nonrenewal of any material
permit, license or authorization applicable to the Company, its business or operations.

(d) No consents or approvals are required in connection with the performance of this Safe, other
than: (i) the Company’s corporate approvals; (ii) any qualifications or filings under applicable
securities laws; and (iii) necessary corporate approvals for the authorization of Capital Stock
issuable pursuant to Section 1.

(e) To its knowledge, the Company owns or possesses (or can obtain on commercially reasonable
terms) sufficient legal rights to all patents, trademarks, service marks, trade names, copyrights,
trade secrets, licenses, information, processes and other intellectual property rights necessary
for its business as now conducted and as currently proposed to be conducted, without any conflict
with, or infringement of the rights of, others.

4. Investor Representations

(a) The Investor has full legal capacity, power and authority to execute and deliver this Safe and
to perform its obligations hereunder. This Safe constitutes a valid and binding obligation of the
Investor, enforceable in accordance with its terms, except as limited by bankruptcy, insolvency or
other laws of general application relating to or affecting the enforcement of creditors’ rights
generally and general principles of equity.

(b) The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D
under the Securities Act, and acknowledges and agrees that if not an accredited investor at the
time of an Equity Financing, the Company may void this Safe and return the Purchase Amount. The
Investor has been advised that this Safe and the underlying securities have not been registered
under the Securities Act, or any state securities laws and, therefore, cannot be resold unless they
are registered under the Securities Act and applicable state securities laws or unless an exemption
from such registration requirements is available. The Investor is purchasing this Safe and the
securities to be acquired by the Investor hereunder for its own account for investment, not as a
nominee or agent, and not with a view to, or for resale in connection with, the distribution
thereof, and the Investor has no present intention of selling, granting any participation in, or
otherwise distributing the same. The Investor has such knowledge and experience in financial and
business matters that the Investor is capable of evaluating the merits and risks of such
investment, is able to incur a complete loss of such investment without impairing the Investor’s
financial condition and is able to bear the economic risk of such investment for an indefinite
period of time.

5. Miscellaneous

(a) Any provision of this Safe may be amended, waived or modified by written consent of the Company
and either (i) the Investor or (ii) the majority-in-interest of all then-outstanding Safes with the
same “Post-Money Valuation Cap” and “Discount Rate” as this Safe (and Safes lacking one or both of
such terms will be considered to be the same with respect to such term(s)), provided that with
respect to clause (ii): (A) the Purchase Amount may not be amended, waived or modified in this
manner, (B) the consent of the Investor and each holder of such Safes must be solicited (even if
not obtained), and (C) such amendment, waiver or modification treats all such holders in the same
manner. “Majority-in-interest” refers to the holders of the applicable group of Safes whose Safes
have a total Purchase Amount greater than 50% of the total Purchase Amount of all of such
applicable group of Safes.

(b) Any notice required or permitted by this Safe will be deemed sufficient when delivered
personally or by overnight courier or sent by email to the relevant address listed on the signature
page, or 48 hours after being deposited in the U.S. mail as certified or registered mail with
postage prepaid, addressed to the party to be notified at such party’s address listed on the
signature page, as subsequently modified by written notice.

(c) The Investor is not entitled, as a holder of this Safe, to vote or be deemed a holder of
Capital Stock for any purpose other than tax purposes, nor will anything in this Safe be construed
to confer on the Investor, as such, any rights of a Company stockholder or rights to vote for the
election of directors or on any matter submitted to Company stockholders, or to give or withhold
consent to any corporate action or to receive notice of meetings, until shares have been issued on
the terms described in Section 1.  However, if the Company pays a dividend on outstanding shares of
Common Stock (that is not payable in shares of Common Stock) while this Safe is outstanding, the
Company will pay the Dividend Amount to the Investor at the same time.

(d) Neither this Safe nor the rights in this Safe are transferable or assignable, by operation of
law or otherwise, by either party without the prior written consent of the other; provided,
however, that this Safe and/or its rights may be assigned without the Company’s consent by the
Investor (i) to the Investor’s estate, heirs, executors, administrators, guardians and/or
successors in the event of Investor’s death or disability, or (ii) to any other entity who directly
or indirectly, controls, is controlled by or is under common control with the Investor, including,
without limitation, any general partner, managing member, officer or director of the Investor, or
any venture capital fund now or hereafter existing which is controlled by one or more general
partners or managing members of, or shares the same management company with, the Investor.

(e) In the event any one or more of the provisions of this Safe is for any reason held to be
invalid, illegal or unenforceable, in whole or in part or in any respect, or in the event that any
one or more of the provisions of this Safe operate or would prospectively operate to invalidate
this Safe, then and in any such event, such provision(s) only will be deemed null and void and will
not affect any other provision of this Safe and the remaining provisions of this Safe will remain
operative and in full force and effect and will not be affected, prejudiced, or disturbed thereby.

(f) All rights and obligations hereunder will be governed by the laws of the State of
{{governing_law}}, without regard to the conflicts of law provisions of such jurisdiction.

(g) The parties acknowledge and agree that for United States federal and state income tax purposes
this Safe is, and at all times has been, intended to be characterized as stock, and more
particularly as common stock for purposes of Sections 304, 305, 306, 354, 368, 1036 and 1202 of the
Internal Revenue Code of 1986, as amended.  Accordingly, the parties agree to treat this Safe
consistent with the foregoing intent for all United States federal and state income tax purposes
(including, without limitation, on their respective tax returns or other informational statements).

(Signature page follows)

IN WITNESS WHEREOF, the undersigned have caused this Safe to be duly executed and delivered.

{{company.name}}

By:

{{officer_name}}

{{officer_title}}

Address:

Email:

INVESTOR:

By:

Name:

Title:

Address:

Email:
---

## 📤 What to do next
1. Confirm the deal terms above match your board consent and, for a cap SAFE, the side letter —
   investor, purchase amount, date and economic term must be identical across all three.
2. Have both parties sign — StartupKit can route it for e-signature, or export and use your own.
3. File a Form D with the SEC within 15 days of the first sale, plus any state "blue sky" notices.
4. Record the SAFE on your cap table and keep the signed copy with your corporate records.

"""

SAFE_MFN_TEMPLATE = """\
THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE
SECURITIES ACT OF 1933, AS AMENDED (THE “SECURITIES ACT”), OR UNDER THE SECURITIES LAWS OF CERTAIN
STATES.  THESE SECURITIES MAY NOT BE OFFERED, SOLD OR OTHERWISE TRANSFERRED, PLEDGED OR
HYPOTHECATED EXCEPT AS PERMITTED IN THIS SAFE AND UNDER THE ACT AND APPLICABLE STATE SECURITIES
LAWS PURSUANT TO AN EFFECTIVE REGISTRATION STATEMENT OR AN EXEMPTION THEREFROM.

[COMPANY NAME]

SAFE

(Simple Agreement for Future Equity)

THIS CERTIFIES THAT in exchange for the payment by {{investor_name}} (the “Investor”) of
${{purchase_amount}} (the “Purchase Amount”) on or about {{safe_date}}, {{company.name}}, a
{{company.jurisdiction}} corporation (the “Company”), issues to the Investor the right to certain
shares of the Company’s Capital Stock, subject to the terms described below.

This Safe is one of the forms available at http://ycombinator.com/documents and the Company and the
Investor agree that neither one has modified the form, except to fill in blanks and bracketed
terms.

1. Events

(a) Equity Financing. If there is an Equity Financing before the termination of this Safe, on the
initial closing of such Equity Financing, this Safe will automatically convert into the number of
shares of Standard Preferred Stock equal to the Purchase Amount divided by the lowest price per
share of the Standard Preferred Stock.

In connection with the automatic conversion of this Safe into shares of Standard Preferred Stock,
the Investor will execute and deliver to the Company all of the transaction documents related to
the Equity Financing; provided, that such documents (i) are the same documents to be entered into
with the purchasers of Standard Preferred Stock, and (ii) have customary exceptions to any
drag-along applicable to the Investor, including (without limitation) limited representations,
warranties, liability and indemnification obligations for the Investor.

(b) Liquidity Event.  If there is a Liquidity Event before the termination of this Safe, the
Investor will automatically be entitled (subject to the liquidation priority set forth in Section
1(d) below and the “MFN” Amendment Provision in Section 3 below) to receive a portion of Proceeds,
due and payable to the Investor immediately prior to, or concurrent with, the consummation of such
Liquidity Event, equal to the Purchase Amount (the “Cash-Out Amount”).  If any of the Company’s
securityholders are given a choice as to the form and amount of Proceeds to be received in a
Liquidity Event, the Investor will be given the same choice, provided that the Investor may not
choose to receive a form of consideration that the Investor would be ineligible to receive as a
result of the Investor’s failure to satisfy any requirement or limitation generally applicable to
the Company’s securityholders, or under any applicable laws.

Notwithstanding the foregoing, in connection with a Change of Control intended to qualify as a
tax-free reorganization, the Company may reduce the cash portion of Proceeds payable to the
Investor by the amount determined by its board of directors in good faith for such Change of
Control to qualify as a tax-free reorganization for U.S. federal income tax purposes, provided that
such reduction (A) does not reduce the total Proceeds payable to such Investor and (B) is applied
in the same manner and on a pro rata basis to all securityholders who have equal priority to the
Investor under Section 1(d).

(c) Dissolution Event. If there is a Dissolution Event before the termination of this Safe, the
Investor will automatically be entitled (subject to the liquidation priority set forth in Section
1(d) below) to receive a portion of Proceeds equal to the Cash-Out Amount, due and payable to the
Investor immediately prior to the consummation of the Dissolution Event.

(d) Liquidation Priority.  In a Liquidity Event or Dissolution Event, this Safe is intended to
operate like standard non-participating Preferred Stock.  The Investor’s right to receive its
Cash-Out Amount is:

(i) Junior to payment of outstanding indebtedness and creditor claims, including contractual claims
for payment and convertible promissory notes (to the extent such convertible promissory notes are
not actually or notionally converted into Capital Stock);

(ii) On par with payments for other Safes and/or Preferred Stock, and if the applicable Proceeds
are insufficient to permit full payments to the Investor and such other Safes and/or Preferred
Stock, the applicable Proceeds will be distributed pro rata to the Investor and such other Safes
and/or Preferred Stock in proportion to the full payments that would otherwise be due; and

(iii) Senior to payments for Common Stock.

The Investor’s right to receive its Cash-Out Amount is (A) on par with payments for Common Stock
and other Safes and/or Preferred Stock who are also receiving Cash-Out Amounts or Proceeds on a
similar as-converted to Common Stock basis, and (B) junior to payments described in clauses (i) and
(ii) above (in the latter case, to the extent such payments are Cash-Out Amounts or similar
liquidation preferences).

(e) Termination.  This Safe will automatically terminate (without relieving the Company of any
obligations arising from a prior breach of or non-compliance with this Safe) immediately following
the earliest to occur of: (i) the issuance of Capital Stock to the Investor pursuant to the
automatic conversion of this Safe under Section 1(a); or (ii) the payment, or setting aside for
payment, of amounts due the Investor pursuant to Section 1(b) or Section 1(c).

2. Definitions

“Capital Stock” means the capital stock of the Company, including, without limitation, the “Common
Stock” and the “Preferred Stock.”

“Change of Control” means (i) a transaction or series of related transactions in which any “person”
or “group” (within the meaning of Section 13(d) and 14(d) of the Securities Exchange Act of 1934,
as amended), becomes the “beneficial owner” (as defined in Rule 13d-3 under the Securities Exchange
Act of 1934, as amended), directly or indirectly, of more than 50% of the outstanding voting
securities of the Company having the right to vote for the election of members of the Company’s
board of directors, (ii) any reorganization, merger or consolidation of the Company, other than a
transaction or series of related transactions in which the holders of the voting securities of the
Company outstanding immediately prior to such transaction or series of related transactions retain,
immediately after such transaction or series of related transactions, at least a majority of the
total voting power represented by the outstanding voting securities of the Company or such other
surviving or resulting entity or (iii) a sale, lease or other disposition of all or substantially
all of the assets of the Company.

“Direct Listing” means the Company’s initial listing of its Common Stock (other than shares of
Common Stock not eligible for resale under Rule 144 under the Securities Act) on a national
securities exchange by means of an effective registration statement on Form S-1 filed by the
Company with the SEC that registers shares of existing capital stock of the Company for resale, as
approved by the Company’s board of directors. For the avoidance of doubt, a Direct Listing will not
be deemed to be an underwritten offering and will not involve any underwriting services.

“Dissolution Event” means (i) a voluntary termination of operations, (ii) a general assignment for
the benefit of the Company’s creditors or (iii) any other liquidation, dissolution or winding up of
the Company (excluding a Liquidity Event), whether voluntary or involuntary.

“Dividend Amount” means, with respect to any date on which the Company pays a dividend on its
outstanding Common Stock, the amount of such dividend that is paid per share of Common Stock
multiplied by (x) the Purchase Amount divided by (y) the Liquidity Price (treating the dividend
date as a Liquidity Event solely for purposes of calculating such Liquidity Price).

“Equity Financing” means a bona fide transaction or series of transactions with the principal
purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a
fixed valuation, including but not limited to, a pre-money or post-money valuation.

“Initial Public Offering” means the closing of the Company’s first firm commitment underwritten
initial public offering of Common Stock pursuant to a registration statement filed under the
Securities Act.

“Liquidity Event” means a Change of Control, a Direct Listing or an Initial Public Offering.

“Liquidity Price” means the fair market value of the Common Stock at the time of the applicable
Liquidity Event (determined by reference to the purchase price payable in connection with such
Liquidity Event).

“Proceeds” means cash and other assets (including without limitation stock consideration) that are
proceeds from the Liquidity Event or the Dissolution Event, as applicable, and legally available
for distribution.

“Safe” means an instrument containing a future right to shares of Capital Stock, similar in form
and content to this instrument, purchased by investors for the purpose of funding the Company’s
business operations.  References to “this Safe” mean this specific instrument.

“Standard Preferred Stock” means the shares of the series of Preferred Stock issued to the
investors investing new money in the Company in connection with the initial closing of the Equity
Financing.

“Subsequent Convertible Securities” means convertible securities that the Company may issue after
the issuance of this instrument with the principal purpose of raising capital, including but not
limited to, other Safes, convertible debt instruments and other convertible securities.  Subsequent
Convertible Securities excludes: (i) side letters or ancillary agreements that do not amend or
modify the terms of such convertible securities; and (ii) the following types of securities: (A)
options issued pursuant to any equity incentive or similar plan of the Company; (B) convertible
securities issued or issuable to (1) banks, equipment lessors, financial institutions or other
persons engaged in the business of making loans pursuant to a debt financing or commercial leasing
or (2) suppliers or third party service providers in connection with the provision of goods or
services pursuant to transactions; and (C) convertible securities issued or issuable in connection
with sponsored research, collaboration, technology license, development, OEM, marketing or other
similar agreements or strategic partnerships.

3. “MFN” Amendment Provision. If the Company issues any Subsequent Convertible Securities with
terms more favorable than those of this Safe (including, without limitation, a valuation cap and/or
discount) prior to termination of this Safe, the Company will promptly provide the Investor with
written notice thereof, together with a copy of such Subsequent Convertible Securities (the “MFN
Notice”) and, upon written request of the Investor, any additional information related to such
Subsequent Convertible Securities as may be reasonably requested by the Investor.  In the event the
Investor determines that the terms of the Subsequent Convertible Securities are preferable to the
terms of this instrument, the Investor will notify the Company in writing within 10 days of the
receipt of the MFN Notice. Promptly after receipt of such written notice from the Investor, the
Company agrees to amend and restate this instrument to be identical to the instrument(s) evidencing
the Subsequent Convertible Securities.

4. Company Representations

(a) The Company is a corporation duly organized, validly existing and in good standing under the
laws of its state of incorporation, and has the power and authority to own, lease and operate its
properties and carry on its business as now conducted.

(b) The execution, delivery and performance by the Company of this Safe is within the power of the
Company and has been duly authorized by all necessary actions on the part of the Company (subject
to section 4(d)). This Safe constitutes a legal, valid and binding obligation of the Company,
enforceable against the Company in accordance with its terms, except as limited by bankruptcy,
insolvency or other laws of general application relating to or affecting the enforcement of
creditors’ rights generally and general principles of equity.  To its knowledge, the Company is not
in violation of (i) its current certificate of incorporation or bylaws, (ii) any material statute,
rule or regulation applicable to the Company or (iii) any material debt or contract to which the
Company is a party or by which it is bound, where, in each case, such violation or default,
individually, or together with all such violations or defaults, could reasonably be expected to
have a material adverse effect on the Company.

(c) The performance and consummation of the transactions contemplated by this Safe do not and will
not: (i) violate any material judgment, statute, rule or regulation applicable to the Company;
(ii) result in the acceleration of any material debt or contract to which the Company is a party or
by which it is bound; or (iii) result in the creation or imposition of any lien on any property,
asset or revenue of the Company or the suspension, forfeiture, or nonrenewal of any material
permit, license or authorization applicable to the Company, its business or operations.

(d) No consents or approvals are required in connection with the performance of this Safe, other
than: (i) the Company’s corporate approvals; (ii) any qualifications or filings under applicable
securities laws; and (iii) necessary corporate approvals for the authorization of Capital Stock
issuable pursuant to Section 1.

(e) To its knowledge, the Company owns or possesses (or can obtain on commercially reasonable
terms) sufficient legal rights to all patents, trademarks, service marks, trade names, copyrights,
trade secrets, licenses, information, processes and other intellectual property rights necessary
for its business as now conducted and as currently proposed to be conducted, without any conflict
with, or infringement of the rights of, others.

5. Investor Representations

(a) The Investor has full legal capacity, power and authority to execute and deliver this Safe and
to perform its obligations hereunder. This Safe constitutes a valid and binding obligation of the
Investor, enforceable in accordance with its terms, except as limited by bankruptcy, insolvency or
other laws of general application relating to or affecting the enforcement of creditors’ rights
generally and general principles of equity.

(b) The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D
under the Securities Act, and acknowledges and agrees that if not an accredited investor at the
time of an Equity Financing, the Company may void this Safe and return the Purchase Amount. The
Investor has been advised that this Safe and the underlying securities have not been registered
under the Securities Act, or any state securities laws and, therefore, cannot be resold unless they
are registered under the Securities Act and applicable state securities laws or unless an exemption
from such registration requirements is available. The Investor is purchasing this Safe and the
securities to be acquired by the Investor hereunder for its own account for investment, not as a
nominee or agent, and not with a view to, or for resale in connection with, the distribution
thereof, and the Investor has no present intention of selling, granting any participation in, or
otherwise distributing the same. The Investor has such knowledge and experience in financial and
business matters that the Investor is capable of evaluating the merits and risks of such
investment, is able to incur a complete loss of such investment without impairing the Investor’s
financial condition and is able to bear the economic risk of such investment for an indefinite
period of time.

6. Miscellaneous

(a) Any provision of this Safe may be amended, waived or modified by written consent of the Company
and either (i) the Investor or (ii) the majority-in-interest of all then-outstanding Safes with the
same “Post-Money Valuation Cap” and “Discount Rate” as this Safe (and Safes lacking one or both of
such terms will be considered to be the same with respect to such term(s)), provided that with
respect to clause (ii): (A) the Purchase Amount and Section 3 may not be amended, waived or
modified in this manner, (B) the consent of the Investor and each holder of such Safes must be
solicited (even if not obtained), and (C) such amendment, waiver or modification treats all such
holders in the same manner. “Majority-in-interest” refers to the holders of the applicable group of
Safes whose Safes have a total Purchase Amount greater than 50% of the total Purchase Amount of all
of such applicable group of Safes.

(b) Any notice required or permitted by this Safe will be deemed sufficient when delivered
personally or by overnight courier or sent by email to the relevant address listed on the signature
page, or 48 hours after being deposited in the U.S. mail as certified or registered mail with
postage prepaid, addressed to the party to be notified at such party’s address listed on the
signature page, as subsequently modified by written notice.

(c) The Investor is not entitled, as a holder of this Safe, to vote or be deemed a holder of
Capital Stock for any purpose other than tax purposes, nor will anything in this Safe be construed
to confer on the Investor, as such, any rights of a Company stockholder or rights to vote for the
election of directors or on any matter submitted to Company stockholders, or to give or withhold
consent to any corporate action or to receive notice of meetings, until shares have been issued on
the terms described in Section 1.  However, if the Company pays a dividend on outstanding shares of
Common Stock (that is not payable in shares of Common Stock) while this Safe is outstanding, the
Company will pay the Dividend Amount to the Investor at the same time.

(d) Neither this Safe nor the rights in this Safe are transferable or assignable, by operation of
law or otherwise, by either party without the prior written consent of the other; provided,
however, that this Safe and/or its rights may be assigned without the Company’s consent by the
Investor (i) to the Investor’s estate, heirs, executors, administrators, guardians and/or
successors in the event of Investor’s death or disability, or (ii) to any other entity who directly
or indirectly, controls, is controlled by or is under common control with the Investor, including,
without limitation, any general partner, managing member, officer or director of the Investor, or
any venture capital fund now or hereafter existing which is controlled by one or more general
partners or managing members of, or shares the same management company with, the Investor.

(e) In the event any one or more of the provisions of this Safe is for any reason held to be
invalid, illegal or unenforceable, in whole or in part or in any respect, or in the event that any
one or more of the provisions of this Safe operate or would prospectively operate to invalidate
this Safe, then and in any such event, such provision(s) only will be deemed null and void and will
not affect any other provision of this Safe and the remaining provisions of this Safe will remain
operative and in full force and effect and will not be affected, prejudiced, or disturbed thereby.

(f) All rights and obligations hereunder will be governed by the laws of the State of
{{governing_law}}, without regard to the conflicts of law provisions of such jurisdiction.

(g) The parties acknowledge and agree that for United States federal and state income tax purposes
this Safe is, and at all times has been, intended to be characterized as stock, and more
particularly as common stock for purposes of Sections 304, 305, 306, 354, 368, 1036 and 1202 of the
Internal Revenue Code of 1986, as amended.  Accordingly, the parties agree to treat this Safe
consistent with the foregoing intent for all United States federal and state income tax purposes
(including, without limitation, on their respective tax returns or other informational statements).

(Signature page follows)

IN WITNESS WHEREOF, the undersigned have caused this Safe to be duly executed and delivered.

{{company.name}}

By:

{{officer_name}}

{{officer_title}}

Address:

Email:

INVESTOR:

By:

Name:

Title:

Address:

Email:
---

## 📤 What to do next
1. Confirm the deal terms above match your board consent and, for a cap SAFE, the side letter —
   investor, purchase amount, date and economic term must be identical across all three.
2. Have both parties sign — StartupKit can route it for e-signature, or export and use your own.
3. File a Form D with the SEC within 15 days of the first sale, plus any state "blue sky" notices.
4. Record the SAFE on your cap table and keep the signed copy with your corporate records.

"""

BOARD_CONSENT_CAP_TEMPLATE = """\
{{company.name}}

ACTION BY UNANIMOUS WRITTEN CONSENT

OF THE BOARD OF DIRECTORS

(In lieu of a meeting pursuant to Section 141(f) of the

General Corporation Law of the State of Delaware)

The undersigned, constituting all of the members of the board of directors (the “Board”) of
{{company.name}}, a Delaware corporation (the “Company”), acting by written consent without a
meeting pursuant to Section 141(f) of the General Corporation Law of the State of Delaware and the
bylaws of the Company, hereby adopt the following resolutions, effective as of {{consent_date}}:

Issuance of Safe

WHEREAS, the Board has determined that it is in the best interests of the Company and its
stockholders to raise capital to fund the Company’s operations and the development of its business;
and

WHEREAS, the Company proposes to issue and sell to {{investor_name}} (the “Investor”) a simple
agreement for future equity in substantially the form published by Y Combinator and available at
http://ycombinator.com/documents, with a “Post-Money Valuation Cap” of ${{valuation_cap}} and no
discount (the “Safe”), in exchange for the payment by the Investor of ${{purchase_amount}} (the
“Purchase Amount”);

NOW, THEREFORE, BE IT RESOLVED, that the issuance, sale and delivery by the Company of the Safe to
the Investor, in exchange for the payment by the Investor of the Purchase Amount, is hereby
authorized and approved in all respects;

RESOLVED FURTHER, that the form, terms and provisions of the Safe, including the Post-Money
Valuation Cap of ${{valuation_cap}}, are hereby approved, and that the Company and the Investor
shall not modify the form of the Safe, except to fill in blanks and bracketed terms;

RESOLVED FURTHER, that the Company shall at all times reserve and keep available, out of its
authorized but unissued shares of capital stock, such number of shares of capital stock as shall
from time to time be sufficient to effect the conversion of the Safe, and that the Board will take
such action as may be necessary to increase the Company’s authorized capital stock if at any time
such number of shares is insufficient;

RESOLVED FURTHER, that the offer, sale and issuance of the Safe, and of any securities issuable
upon conversion of the Safe, are intended to be exempt from registration under the Securities Act
of 1933, as amended, in reliance on Section 4(a)(2) thereof and/or Regulation D thereunder, and
from qualification under applicable state securities laws, and that the Authorized Officers (as
defined below) are authorized to prepare, execute and file such notices and filings, including a
Form D and any state “blue sky” filings, as they deem necessary or advisable in connection
therewith;

RESOLVED FURTHER, that the Company is authorized to enter into a pro rata agreement with the
Investor in substantially the form published by Y Combinator and available at
http://ycombinator.com/documents (the “Pro Rata Side Letter”), granting the Investor the right to
purchase its pro rata share of the Standard Preferred Stock (as defined in the Safe) sold in the
Equity Financing (as defined in the Safe), and the execution and delivery of the Pro Rata Side
Letter by any Authorized Officer (as defined below) is hereby authorized and approved [delete this
resolution if no Pro Rata Side Letter is being issued];

RESOLVED FURTHER, that each officer of the Company, including {{officer_name}}, {{officer_title}}
(each, an “Authorized Officer”), is hereby authorized, empowered and directed, for and on behalf of
the Company, to execute and deliver the Safe and any other agreements, certificates and documents,
to pay such fees and expenses, and to take such further actions, in each case as such Authorized
Officer deems necessary or advisable to carry out the purposes and intent of the foregoing
resolutions, the taking of any such action to be conclusive evidence of such determination; and

RESOLVED FURTHER, that all actions heretofore taken by any officer or director of the Company in
connection with the transactions contemplated by the foregoing resolutions are hereby ratified,
confirmed, adopted and approved in all respects.

This consent may be executed in one or more counterparts, each of which will be deemed an original
and all of which together will constitute one instrument, and a signature delivered by facsimile,
electronic mail or other electronic means will be deemed an original signature.  This consent shall
be filed with the minutes of the proceedings of the Board.

IN WITNESS WHEREOF, the undersigned, being all of the directors of the Company, have executed this
Action by Unanimous Written Consent as of the date first set forth above.

{{director_name}}, Director

{{director_2}}, Director

[Add or remove signature lines so that each member of the Board signs this consent.  If the Company
has a sole director, use a single signature line.]
---

## 📤 What to do next
1. Confirm the economic terms match the SAFE exactly — investor, purchase amount and cap.
2. Every director signs: add or remove signature lines so the whole board consents; a sole director
   uses a single line.
3. If you are not issuing a Pro Rata Side Letter, delete that resolution before signing.
4. File this consent with the minutes of the board's proceedings.

"""

PRO_RATA_SIDE_LETTER_TEMPLATE = """\
{{company.name}}

PRO RATA AGREEMENT

This agreement (this “Agreement”) is entered into on or about {{safe_date}} in connection with the
purchase by {{investor_name}} (the “Investor”) of that certain simple agreement for future equity
with a “Post-Money Valuation Cap” (the “Investor’s Safe”) issued by {{company.name}} (the
“Company”) on or about the date of this Agreement.  As a material inducement to the Investor’s
investment, the Company agrees to the provisions set forth in this Agreement.  Capitalized terms
used herein shall have the meanings set forth in the Investor’s Safe.

The Investor shall have the right to purchase its pro rata share of Standard Preferred Stock being
sold in the Equity Financing (the “Pro Rata Right”).  Pro rata share for purposes of this Pro Rata
Right is the ratio of (x) the number of shares of Capital Stock issued from the conversion of all
of the Investor’s Safes with a “Post-Money Valuation Cap” to (y) the Company Capitalization.  The
Pro Rata Right described above shall automatically terminate upon the earlier of (i) the initial
closing of the Equity Financing; (ii) immediately prior to the closing of a Liquidity Event; or
(iii) immediately prior to the Dissolution Event.

Neither this Agreement nor the rights contained herein may be assigned, by operation of law or
otherwise, by Investor without the prior written consent of the Company; provided, however, that
this Agreement and/or the rights contained herein may be assigned without the Company’s consent by
the Investor to any other entity who directly or indirectly, controls, is controlled by or is under
common control with the Investor, including, without limitation, any general partner, managing
member, officer or director of the Investor, or any venture capital fund now or hereafter existing
which is controlled by one or more general partners or managing members of, or shares the same
management company with, the Investor.

Any provision of this Agreement may be amended, waived or modified upon the written consent of the
Company and either (i) the holders of a majority of shares of Capital Stock issued from all Safes
converted in connection with the Equity Financing held by the Investor and other Safe holders with
Pro Rata Rights pursuant to agreements on the same form as this Agreement (available at
http://ycombinator.com/documents), provided that such amendment, waiver or modification treats all
such holders in the same manner, or (ii) the Investor.  The Company will promptly notify the
Investor of any amendment, waiver or modification that the Investor did not consent to.  This
Agreement is the form available at http://ycombinator.com/documents and the Company and the
Investor agree that neither one has modified the form, except to fill in blanks and bracketed
terms.  The choice of law governing any dispute or claim arising out of or in connection with this
Agreement shall be consistent with that set forth in the Investor’s Safe.

IN WITNESS WHEREOF, the undersigned have caused this Agreement to be duly executed and delivered.

{{company.name}}

By:

{{officer_name}}

{{officer_title}}

{{investor_name}}

By:

Name:

Title:
---

## 📤 What to do next
1. Issue this only alongside a SAFE that has a Post-Money Valuation Cap — it pairs with that
   instrument and shares its governing law.
2. Confirm the investor name and date match the SAFE.
3. Both parties sign; keep it with the SAFE in your corporate records.

"""

FINANCIAL_POLICY_TEMPLATE = """\
# {{company.name}}
## Financial and Expense Policy
*(Adopted and effective as of {{adoption_date}})*

**1. Purpose and Scope.** This Financial and Expense Policy (this "Policy") sets forth the rules
under which **{{company.name}}**, a {{company.jurisdiction}} corporation (the "Company"),
authorizes, incurs, documents and reimburses business expenses. This Policy applies to all
employees, officers, directors, consultants and interns of the Company (each, a "Covered Person")
who incur or approve expenses on behalf of the Company. It supersedes all prior expense practices.

**2. Spending Authority; Approval Thresholds.** Each commitment of Company funds must be approved
at or above the tier corresponding to the amount of the transaction, before the expense is incurred,
except for routine expenses within a previously approved budget.

- **Tier 1** — Expenses up to **$500** per transaction may be approved by the Covered Person
  incurring them, if within an approved budget, and otherwise by that person's manager.
- **Tier 2** — Expenses over **$500** and up to **$5,000** require the prior approval of
  {{approver_tier2}}. Approval by email or other written electronic communication is sufficient.
- **Tier 3** — Expenses over **$5,000** require the prior written approval of {{approver_tier3}}
  and the Board of Directors of the Company (the "Board").
- **No Splitting** — A single purchase, or an obviously related series of purchases, is treated as
  one transaction. Dividing an expense to stay below a threshold is prohibited.

**3. Payment Methods.** Where the Company has issued corporate cards (each, a "Company Card"), the
Company Card is the default method of payment. Each cardholder shall record each transaction against
the correct expense category, attach the corresponding receipt within **3 business days**, and keep
spending within the assigned limit. Company Cards are Company property and may be used only for
business expenses; personal charges are prohibited even if repaid. Where no Company Card is
available, a Covered Person may pay with personal funds and seek reimbursement under Section 5; the
Company will not reimburse interest, late fees or foreign-transaction fees on personal cards.

**4. Travel; Per Diem Allowances.**

- **Air travel** — Economy class for flights under **6 hours**; premium economy for longer flights
  with Tier 2 approval. Book at least **14 days** ahead where practicable. Airfare over **$750**
  requires Tier 2 approval.
- **Lodging** — Up to **$250** per night, or **$350** per night in high-cost cities.
- **Per diem (domestic)** — breakfast $15, lunch $20, dinner $35, incidentals $10 (**$80/day**).
- **Per diem (international)** — breakfast $20, lunch $30, dinner $50, incidentals $15
  (**$115/day**).
- **Ground transportation** — rideshare, transit, parking and tolls reimbursed at cost with
  receipts; personal-vehicle use at the standard IRS mileage rate.

**5. Reimbursement Procedure.** Requests must be submitted through {{expense_channel}}, with the
documentation required by Section 6, within **30 days** after the expense is incurred; requests
submitted after **60 days** may be denied. The approver will approve or return each request within
**5 business days**. Approved reimbursements are paid within {{reimburse_timing}}.

**6. Documentation.** Each expense charged to a Company Card or submitted for reimbursement must be
substantiated by (a) an itemized receipt for any expense over **$25** (a card statement line item
alone is not sufficient); (b) a brief statement of business purpose; (c) for meals and
entertainment, the names of attendees and their relationship to the Company; and (d) the correct
expense category or general-ledger code.

**7. Prohibited Expenses.** The following are not reimbursable and may not be charged to the
Company, regardless of amount, unless expressly approved in advance and in writing by the Board:
personal or non-business expenses; first- or business-class airfare; alcohol (other than at an
approved client-entertainment or Company event); fines and penalties; cash advances, ATM
withdrawals and gift cards on a Company Card; political contributions and lobbying; personal
entertainment and subscriptions; gifts exceeding **$75** in value; charitable donations in the
Company's name; and any expense structured to circumvent this Policy.

**8. Company Card Administration.** Company Cards are issued at the discretion of {{admin_role}}.
Each cardholder shall keep the card secure, not share card numbers, promptly report a lost or stolen
card, and return or deactivate the card upon separation. The Company may reduce a limit or withdraw
a card at any time.

**9. Violations.** Expenses incurred in violation of this Policy may be denied or charged back to
the responsible Covered Person. Intentional misuse of Company funds is grounds for disciplinary
action up to and including termination, and, where warranted, referral to the appropriate
authorities.

**10. Administration; Amendment.** This Policy is administered by {{admin_role}}, who resolves
questions of interpretation. The Board will review this Policy at least annually, and it may be
amended at any time by the Board. Material changes will be communicated to all Covered Persons.

**11. Acknowledgment.** Each Covered Person shall receive a copy of this Policy and acknowledge in
writing that they have read, understand and agree to comply with it.

Adopted by the {{adopter}} of the Company as of the date first set forth above.

**{{company.name}}**

By: __________________________
{{officer_name}}
{{officer_title}}

### Acknowledgment
The undersigned acknowledges receipt of this Policy and agrees to comply with it.

Signature: __________________________  Name: ______________  Date: __________

## 📤 What to do next
1. Review the thresholds and choices above with your co-founders — the dollar amounts are startup
   norms you can adjust.
2. Adopt it: attach it to a board consent (or, for a sole founder, sign the adoption block).
3. Circulate it and collect a signed acknowledgment from each Covered Person before they spend.
4. Load the tiers into your corporate-card tool (Ramp/Brex) so approvals are enforced automatically.

"""

W3_TEMPLATES: dict[str, tuple[list[DocField], str]] = {
    "W3-financial-expense-policy": (FINANCIAL_POLICY_FIELDS, FINANCIAL_POLICY_TEMPLATE),
    "W3-safe-post-money-valuation-cap": (SAFE_CAP_FIELDS, SAFE_CAP_TEMPLATE),
    "W3-safe-post-money-discount": (SAFE_DISCOUNT_FIELDS, SAFE_DISCOUNT_TEMPLATE),
    "W3-safe-post-money-mfn": (SAFE_MFN_FIELDS, SAFE_MFN_TEMPLATE),
    "W3-board-consent-safe-issuance": (CONSENT_CAP_FIELDS, BOARD_CONSENT_CAP_TEMPLATE),
    "W3-pro-rata-side-letter": (SIDE_LETTER_FIELDS, PRO_RATA_SIDE_LETTER_TEMPLATE),
}
