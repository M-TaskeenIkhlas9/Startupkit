"""Guided-task how-tos for the task-type workflow documents (not forms, not long-form docs).

Many workflow "documents" are really *tasks* the founder does in another tool — register a domain,
set up a GitHub org, open a bank account. For those, the modal shows these step-by-step steps
(themed markdown, same renderer as templates) and the founder completes them with "Mark as done"
(optionally uploading proof). Tokens: {{company.name}}, {{company.entity}}, {{company.jurisdiction}}
are substituted.

GUIDANCE maps catalog.doc_key(workflow, name) -> markdown how-to. Seeded for W4 (the clearest task
cases) plus a few obvious tasks in W3/W6; extend by adding more keys.
"""

from __future__ import annotations

# ================================ W3 · Financial ===============================================

GUIDANCE: dict[str, str] = {
    "W3-business-banking": """\
# Business Banking
**Why it matters:** a business bank account keeps company money separate from your personal money.
That separation is what protects your personal liability shield — mixing funds can undo it.

## Already have a business account?
Just confirm below (add the bank name if you like). Nothing else to do.

## Need to open one?
- **Already on file** — StartupKit has these ready: legal name, EIN, entity type, state and
  formation date, business address, and your **Certificate of Incorporation** (downloadable).
- **You'll bring** — a government ID, home address, and date of birth for each founder owning
  **more than 25%**.
- **Where** — **Mercury** and **Relay** are built for startups and usually approve same-day:
  Mercury (mercury.com), Relay (relayfi.com).

## 📤 Mark done
Open the account with your chosen provider, then mark this done. StartupKit records that banking is
set up — it never asks for or stores your account or routing numbers.
""",
    "W3-corporate-card": """\
# Corporate Card
**Why it matters:** a corporate card lets the company spend without a personal guarantee and keeps
expenses cleanly on the business.

## Already have one? Confirm below.

## Need one?
- **Already on file** — legal name, EIN, entity type, and your connected business bank account.
- **You'll bring** — an estimate of monthly spend, IDs for each cardholder, and your current bank
  balance (the real gating factor for these cards).
- **Where** — **Ramp** and **Brex** set limits off your bank balance with no personal credit check;
  Ramp is generally more accessible early. **Divvy** has a lower bar below that: Ramp (ramp.com),
  Brex (brex.com), Divvy (getdivvy.com).

## 📤 Mark done
Once you've got the card, mark done. No card numbers or limits are stored.
""",
    "W3-accounting-setup": """\
# Accounting Setup
**Why it matters:** bookkeeping from day one makes taxes and investor diligence easy instead of a
painful reconstruction later.

## Already using QuickBooks or Xero? Confirm below.

## Need to set it up?
- **Already on file** — legal name, EIN, entity type, connected bank account, and a suggested chart
  of accounts (see the Configure step) to start from.
- **Where** — **QuickBooks** and **Xero** are both built for small businesses and connect straight
  to your bank: QuickBooks (quickbooks.intuit.com), Xero (xero.com).

## 📤 Mark done
Set it up with your provider, then mark done. StartupKit reads reports later; it never becomes your
ledger.
""",
    "W3-payment-processing": """\
# Payment Processing
**Why it matters:** this is how revenue actually arrives — and it unblocks your first customer
payment in W7.

## Already have Stripe or another processor? Confirm below.

## Need to set it up?
- **Already on file** — legal name, EIN, entity type, business address, connected bank account.
- **You'll bring** — your website URL, a short description of what you sell, and a government ID for
  whoever applies plus any 25%+ owner (Stripe verifies beneficial owners).
- **Where** — **Stripe** is what most startups use and pays out straight to your bank:
  Stripe (stripe.com).

## 📤 Mark done
Once payments are live, mark done. No processor credentials or webhooks are stored.
""",
    "W3-tax-setup": """\
# Tax Setup
No signup needed — StartupKit builds your tax profile from what it already knows and adds every
deadline to your compliance calendar.

## What gets set up
- **Federal** — C-Corporation files **Form 1120**, annual return due **April 15**.
- **Estimated quarterly** — **Apr 15, Jun 15, Sep 15, Dec 15** (placeholders even if nothing's owed
  yet).
- **Delaware Franchise Tax + Annual Report** — due **March 1** every year regardless of revenue
  (**$175 minimum + $50 report**); your registered agent from W1 usually files it.
- **State registration** — added only for what applies: do you have employees in a state, sell
  there, or have a physical office there? Nothing is assumed.

## 📤 Mark done
Review and confirm your tax profile. Every figure is an estimate, not a filed bill — precision items
route to a CPA partner.
""",
    "W3-chart-of-accounts": """\
# Chart of Accounts
The standard startup account structure your bookkeeper and investors expect — start your books from
this so everything reconciles.

## The starting set
- **Assets** — 1000 Cash, 1200 Accounts Receivable
- **Liabilities** — 2000 Accounts Payable, 2100 Accrued Liabilities
- **Equity** — 3000 Common Stock, 3100 Additional Paid-in Capital, 3900 Retained Earnings
- **Revenue** — 4000 Revenue
- **Expenses** — 6000 Payroll, 6100 Software/SaaS, 6200 Marketing, 6300 Professional Fees,
  6900 Other Operating

## 📤 Mark done
Import or recreate this in QuickBooks/Xero, then mark done.
""",
    "W3-opening-balance-sheet": """\
# Opening Balance Sheet
Your day-one books, auto-built from your cap table. When founders bought their stock, that cash came
into the company against equity.

## The opening entry
- **Assets — Cash** — total the founders paid for their shares.
- **Equity — Common Stock + Paid-in Capital** — the same amount.
- **Assets = Equity** — the books balance on day one.

## 📤 Mark done
Post this opening entry in your accounting tool (or hand it to your bookkeeper), then mark done.
""",
    "W4-domain-registration": """\
# Register your domain
Your domain is your home on the internet and the base of your email — lock it down early.

## Steps
- Pick your primary domain (a `.com` if you can get it). Check availability at a registrar like
  **Cloudflare**, **Namecheap**, or **Porkbun**.
- Register it under a **company account**, not a personal one, so the company owns it.
- Turn on **auto-renew** and **WHOIS privacy** so it never lapses and your details stay private.
- If budget allows, grab close variants and common typos to protect the brand.

## 📤 Mark done
Once the domain is registered under the company and auto-renew is on, mark this done.
""",
    "W4-business-email-setup-google-workspace": """\
# Set up business email (Google Workspace)
Professional email on your own domain — `you@yourcompany.com`, not gmail.

## Steps
- Go to **workspace.google.com**, start the trial, and use your registered domain.
- **Verify the domain** by adding the TXT record Google gives you at your registrar.
- Create accounts for the founders first, then a few groups (`team@`, `hello@`).
- **Enforce 2-step verification** for everyone (Admin console → Security).

## 📤 Mark done
When MX records are verified and the founders' mailboxes work, mark this done.
""",
    "W4-github-organization-piia-gated": """\
# Set up your GitHub Organization
Your code is the company's most valuable asset — make sure the **company** owns it and access is
secure from day one.

## Steps
- On GitHub: **Settings → Organizations → New organization** (Free or Team plan), named for
  **{{company.name}}**.
- **Enforce 2FA** for all members (Org settings → Authentication security → *Require two-factor
  authentication*).
- Create **teams** (e.g. `engineering`) and add people with least-privilege access.
- **Transfer** any company repos out of personal accounts into the org.
- **Gate access on a signed PIIA** (W2): no one gets repo access until they've signed.

## 📤 Mark done
Once the org exists, 2FA is enforced, and repos are owned by the org, mark this done — you can
upload a screenshot of the org's security settings as proof.
""",
    "W4-hosting-database-provisioning": """\
# Provision hosting + database
Stand up where your app runs and where your data lives.

## Steps
- Pick a host: **Vercel**/**Netlify** for the frontend; **Render**/**Fly.io**/**Railway** for the
  backend.
- Provision a **managed Postgres** (**Supabase**, **Neon**, or RDS) — don't run your own DB early.
- Create separate **dev → staging → production** environments.
- Put every credential in your **secrets manager** (never in code or chat).
- Turn on **automated backups** and test a restore.

## 📤 Mark done
When production is deployed, the database is provisioned with backups on, and secrets are in a
vault, mark this done.
""",
    "W4-auth-provider-setup": """\
# Set up your auth provider
Don't roll your own login — use a provider and get security right by default.

## Steps
- Choose a provider: **Clerk**, **Supabase Auth**, **Auth0**, or **WorkOS** (for enterprise SSO).
- Configure sign-in methods (email + Google; add SSO if you sell to enterprises).
- **Enforce 2FA** for admin accounts.
- Wire it into the app and test the full sign-up / sign-in / sign-out flow.

## 📤 Mark done
When users can sign in and out reliably and admins have 2FA, mark this done.
""",
    # ================================ W3 · Financial ===========================================
    "W3-business-bank-account-application": """\
# Open your business bank account
Keep company money separate from personal from day one — it protects your liability shield.

## Steps
- Have ready: your **EIN**, **Certificate of Incorporation**, and a photo ID.
- Apply with a startup-friendly bank — **Mercury** or **Brex** (usually approved online in minutes).
- Open it in the company legal name, **{{company.name}}**.
- Once approved, connect it to your accounting and move your starting capital in.

## 📤 Mark done
When the account is open in the company's name and funded, mark this done.
""",
    # ================================ W6 · People & HR =========================================
    "W6-payroll-setup": """\
# Set up payroll
Run payroll properly so taxes are withheld and filed for you.

## Steps
- Pick a provider: **Gusto**, **Rippling**, or **Justworks**.
- Connect your **EIN** and **business bank account**.
- Add employees with their signed **offer letter** and **employment agreement** (W6).
- Set the pay schedule — the provider handles tax withholding and filings.

## 📤 Mark done
When payroll is connected to your EIN and bank, and your first employee is added, mark this done.
""",
    # ================================ W1 · Federal & Finalize ==================================
    "W1-ein-confirmation-letter": """\
# Get your EIN (and store the CP 575)
Your EIN is the company's federal tax ID — you need it to open a bank account, hire, and file
taxes. You apply with **IRS Form SS-4**; the IRS then issues the **CP 575 confirmation letter** as
proof. That letter isn't something you fill in — you receive it and keep it.

## Steps
- Apply **online** at IRS.gov ("Apply for an EIN online") — fastest; the EIN is issued
  immediately. The responsible party needs a valid SSN/ITIN. Mail or fax via SS-4 also works, just
  slower.
- Have ready (mostly from your Company Object): legal name **{{company.name}}**, entity type
  {{company.entity}}, state {{company.jurisdiction}}, responsible party name + SSN/ITIN, company
  mailing & physical address, reason (started a new business), date the business started, expected
  number of employees, and principal activity.
- Save the **CP 575** confirmation letter PDF — your bank will ask for it.

## 📤 Mark done
When the EIN is issued, **upload the CP 575** here (or mark done and add your EIN to the company
record). Apply / learn more: [IRS Form SS-4](https://www.irs.gov/forms-pubs/about-form-ss-4).

> The CP 575 is issued by the IRS — a document you receive, not a template you fill.
""",
    "W1-delaware-franchise-tax-registration": """\
# Delaware franchise tax & annual report
Every Delaware corporation owes an annual **franchise tax** and must file an **annual report** by
**March 1** each year. It's not income tax — it's a flat state fee for being a Delaware corp.

## Steps
- File and pay online at the **Delaware Division of Corporations** (you'll need your 7-digit
  business file number from the Certificate of Incorporation).
- Delaware shows two calculations — **pick the cheaper**:
- **Authorized Shares Method** — based on your share count. For a startup with 10,000,000
  authorized shares this can read **$85,000+**. Do NOT just pay this number.
- **Assumed Par Value Capital Method** — based on issued shares + gross assets. For an early-stage
  startup this is almost always the **$400–$450 minimum**. Use this one.
- Pay by **March 1**. Late = a **$200 penalty** plus interest, and eventually loss of good standing.

## 📤 Mark done
Once you've registered and paid this year's franchise tax, mark done (upload the receipt if you
like). Portal: [Delaware franchise tax](https://corp.delaware.gov/paytaxes/).

> The giant "authorized shares" figure is the #1 founder trap — the par-value method is the real,
> much smaller bill.
""",
    "W1-delaware-llc-annual-tax": """\
# Delaware LLC annual tax
Every Delaware LLC owes a **flat $300 annual tax** — due **June 1** each year. Unlike a
corporation, there is **no annual report** to file; it's just the payment.

## Steps
- Pay online at the **Delaware Division of Corporations** (you'll need your LLC file number).
- The tax is a flat **$300**, regardless of income, size, or units issued.
- Pay by **June 1**. Late = a **$200 penalty** plus 1.5%/month interest, and eventually loss of
  good standing.

## 📤 Mark done
Once this year's $300 tax is paid, mark done (upload the receipt if you like). Portal:
[Delaware LLC tax](https://corp.delaware.gov/paytaxes/).

> Flat $300, due June 1 — much simpler than a corporation's franchise tax + annual report.
""",
}
