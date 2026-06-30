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

# ================================ W4 · Technical ===============================================

GUIDANCE: dict[str, str] = {
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
}
