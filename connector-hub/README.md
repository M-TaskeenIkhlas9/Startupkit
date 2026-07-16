# Connector Hub

Open `index.html`. The place where every externally connected tool lives and is managed.

```
connector-hub/
  index.html
  assets/hub.css    warm-beige design system (matches w7-gtm)
  assets/data.js    34 connectors + 28 capabilities + 10 gap findings
  assets/app.js     4 views, filters, search, detail modal
```

## Where the connectors come from
Sourced from five mocks + the repo:
- **W5** — `w5-final-combined-v2` and `w5-ui-mock-v3-all-features` (domain, email, hosting, Search Console, Canva, Slides, socials, GBP, DocSend, CRM)
- **W7** — `w7-gtm` (Folk, Apollo, Clay, Instantly, Fathom, PostHog, Intercom, sending domain, Stripe)
- **W6** — `w6-preview` (Gusto/Rippling/Deel, LinkedIn/Wellfound/Braintrust, DocuSign e-sign)
- **W3** — `w3` mocks (Mercury, QuickBooks, Stripe)
- **W1/W2/W4** — the repo `catalog.py`, `ports/`, `adapters/` (Stripe Atlas, DocuSign, registered agent, IRS, Delaware, USPTO, GitHub, Vercel, auth, secrets)

## Data model — mirrors the real one
`data.js` follows `snapshot.py :: Integration { provider, capability, status }`, and adds three facets a hub needs: **workflows[]** (who consumes it), **readiness** (wired / scaffolded / planned / missing), **ownership** (yours / on-behalf / managed).

`readiness` is derived from `ports/` + `adapters/`: only **banking (Mercury)** is fully wired; esign/incorporation/payments/payroll are scaffolded (adapter folder, TODO-stub port); the rest are named in a mock and built nowhere.

## Four views
1. **By function** — 6 categories (Money · Legal · Brand · Growth · People · Technical)
2. **By workflow** — grouped W1→W8, each connector tagged with every workflow that uses it
3. **Capability map** — one active provider per capability, with alternatives and readiness
4. **Health & gaps** — 10 cross-workflow findings the hub is the first screen to expose

Filter by workflow chip, search by tool/capability/alternative, click any card for scopes, per-workflow usage, what-breaks-on-disconnect, and provenance.

## The point of the view
A connector hub is where cross-workflow assumptions become visible. Top findings: only 3 capabilities are actually wired; W5 and W7 offer **different CRM provider lists** (pick Folk in W7 and W5's handoff has nowhere to land); **no booking connector** though two W7 tools assume one; **no invoicing rail**; the **trademark handoff is a toast**.
