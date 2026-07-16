/* ============================================================
   data.js — the connector inventory

   Shape mirrors the repo's real integration model:
     src/startupkit/core/company_object/projections/snapshot.py
       class Integration { integration_id, provider, capability, status }
     src/startupkit/core/company_object/events.py
       IntegrationConnected(provider, capability, status)

   We add three facets the model doesn't have yet, because a hub needs them:
     workflows[]  — who consumes it   (a provider is rarely used by one workflow)
     readiness    — wired | scaffolded | planned  (is the port/adapter real?)
     ownership    — yours | onbehalf | managed

   readiness is derived from src/startupkit/ports + src/startupkit/adapters:
     wired      = Protocol defined AND adapter implemented   (banking, search, model)
     scaffolded = adapter folder exists, port is a TODO stub (esign, incorporation)
     planned    = named in a workflow mock, no port, no adapter
============================================================ */
(function () {
'use strict';

const WF = {
  W1:{ name:'Business Formation',        c:'#185FA5' },
  W2:{ name:'IP & Legal Contracts',      c:'#534AB7' },
  W3:{ name:'Financial Infrastructure',  c:'#0F6E56' },
  W4:{ name:'Technical Infrastructure',  c:'#BA7517', skipped:true },
  W5:{ name:'Brand & Market Presence',   c:'#D85A30' },
  W6:{ name:'People & HR',               c:'#3B6D11' },
  W7:{ name:'Go-To-Market',              c:'#A32D2D' },
  W8:{ name:'Operations & Tooling',      c:'#6C7773', skipped:true }
};

const CATS = [
  { id:'money',  n:'01', name:'Money & Finance',   d:'banking · accounting · payments · cap table' },
  { id:'legal',  n:'02', name:'Legal & Identity',  d:'incorporation · e-signature · government registries' },
  { id:'brand',  n:'03', name:'Brand & Web',       d:'domain · email · hosting · design · office' },
  { id:'growth', n:'04', name:'Growth & Revenue',  d:'CRM · data · outreach · calls · analytics · support' },
  { id:'people', n:'05', name:'People',            d:'payroll · hiring' },
  { id:'tech',   n:'06', name:'Technical',         d:'code · infra · auth · secrets — W4 is skipped today' }
];

/* status: connected | attention | blocked | available | completed | declined | skipped */
const C = [

/* ─────────────────── 01 · MONEY & FINANCE ─────────────────── */
{ id:'mercury', name:'Mercury', cat:'money', cap:'banking', logo:'M', lc:'#1B1B1B',
  status:'connected', readiness:'wired', own:'yours', dir:'read', cost:'Free',
  wf:['W3','W6'], alts:['Brex','Relay'],
  desc:'The business bank account. The only connector with a real Protocol and a real adapter.',
  scopes:['accounts:read','transactions:read','balances:read'],
  uses:[
    {wf:'W3', step:'Banking', what:'Opens the account with your EIN + formation docs'},
    {wf:'W3', step:'Reporting', what:'Feeds cash trend, opening balance sheet, and the investor snapshot'},
    {wf:'W6', step:'Onboarding & payroll', what:'Funds payroll — W6 gates on the bank account being live'}
  ],
  breaks:'W3 loses cash trend, the opening balance sheet and the investor-ready snapshot. W6 cannot run payroll — the phase is explicitly gated on a live bank account.',
  src:'catalog.py W3 P1 · adapters/banking_mercury · ports/banking.py',
  note:'This is the reference implementation. <b>ports/banking.py defines the Protocol; adapters/banking_mercury implements it, with an anti-corruption mapper and a conformance suite.</b> Everything else in this hub is aspiring to this.' },

{ id:'quickbooks', name:'QuickBooks', cat:'money', cap:'accounting', logo:'QB', lc:'#2CA01C',
  status:'available', readiness:'planned', own:'yours', dir:'both', cost:'~$30/mo',
  wf:['W3'], alts:['Xero'],
  desc:'Bookkeeping. Chart of accounts, P&L, balance sheet, cash flow.',
  scopes:['accounts:write','journal:write','reports:read'],
  uses:[{wf:'W3', step:'Reporting', what:'Generates P&L, balance sheet and cash flow from the chart of accounts'}],
  breaks:'You keep the books by hand. W3 still produces the templates; nothing reconciles them.',
  src:'w3-ui-mock-v3-unified.html · catalog.py W3 P6' },

{ id:'stripe', name:'Stripe', cat:'money', cap:'payments', logo:'S', lc:'#635BFF',
  status:'attention', readiness:'scaffolded', own:'yours', dir:'both', cost:'2.9% + 30¢',
  wf:['W3','W7'], alts:['Paddle','Lemon Squeezy'],
  desc:'Collect money. One account, two workflows — W3 owns the setup, W7 consumes it.',
  scopes:['charges:write','customers:write','payouts:read'],
  uses:[
    {wf:'W3', step:'Revenue', what:'Collects customer payments and keeps records'},
    {wf:'W7', step:'Checkout', what:'Publishes a checkout link to the site W5 deployed'}
  ],
  breaks:'W7 checkout stays locked. W3 revenue has no rail.',
  attention:'<b>W7 is waiting on this.</b> Opening W7 → Checkout fires <span class="mono">stripe_needed</span> and puts W7 into a wait state until W3 reports <i>Stripe live</i>. W7 must reuse this account — never create a second one.',
  src:'w3 mock · w7-gtm checkout · ports/payments.py <i>(Protocol is a TODO stub)</i>' },

{ id:'carta', name:'Carta', cat:'money', cap:'captable', logo:'C', lc:'#3F2A56',
  status:'available', readiness:'planned', own:'yours', dir:'both', cost:'Free tier',
  wf:['W1','W3'], alts:['Pulley','a Cooley GO spreadsheet'],
  desc:'Cap table and stock ledger. Free at this size — a spreadsheet is also a legitimate answer.',
  scopes:['captable:write','securities:read'],
  uses:[
    {wf:'W1', step:'Founder stock', what:'Holds the stock ledger and cap table after the FSPA is signed'},
    {wf:'W3', step:'Fundraising', what:'Records the SAFE and updates the investor tracker'}
  ],
  breaks:'Cap table lives in a spreadsheet. Fine at one founder; painful at the first SAFE.',
  src:'catalog.py W1 documents · doc_templates SAFE' },

/* ─────────────────── 02 · LEGAL & IDENTITY ─────────────────── */
{ id:'atlas', name:'Stripe Atlas', cat:'legal', cap:'incorporation', logo:'A', lc:'#635BFF',
  status:'completed', readiness:'scaffolded', own:'onbehalf', dir:'write', cost:'$500 one-off',
  wf:['W1'], alts:['Clerky','Firstbase','file it yourself'],
  desc:'Incorporation. Filed the Delaware C-Corp, issued founder stock, requested the EIN.',
  scopes:['incorporation:write'],
  uses:[{wf:'W1', step:'Incorporate', what:'Certificate of Incorporation, bylaws, initial board consent, FSPA'}],
  breaks:'Nothing — it is a one-time act, already done. The artefacts live in your data room.',
  src:'adapters/incorporation_stripe_atlas · ports/incorporation.py <i>(Protocol is a TODO stub)</i>' },

{ id:'docusign', name:'DocuSign', cat:'legal', cap:'esign', logo:'D', lc:'#D4241F',
  status:'connected', readiness:'scaffolded', own:'yours', dir:'both', cost:'~$15/mo',
  wf:['W1','W2','W6'], alts:['Dropbox Sign'],
  desc:'One e-signature rail, three workflows. Founder docs, customer contracts, and offer letters all run through it.',
  scopes:['envelopes:write','signatures:read','webhooks'],
  uses:[
    {wf:'W1', step:'Founder stock', what:'FSPA, bylaws, initial board consent'},
    {wf:'W2', step:'Contracts', what:'NDAs, ICA, MSA, SOW, advisor agreements'},
    {wf:'W6', step:'Hiring', what:'Offer letters and employee PIIA — same rail as W1/W2'}
  ],
  breaks:'Every signature becomes print-sign-scan. W6 loses the automatic 48-hour nudge on unsigned offers.',
  src:'adapters/esign_docusign · w6 mock · ports/esign.py <i>(Protocol is a TODO stub)</i>',
  note:'The clearest case of <b>cross-workflow reuse</b> in the platform. Three workflows, one connector, one bill.' },

{ id:'agent', name:'Registered Agent', cat:'legal', cap:'agent', logo:'RA', lc:'#185FA5',
  status:'connected', readiness:'planned', own:'onbehalf', dir:'read', cost:'~$50/yr',
  wf:['W1'], alts:[],
  desc:'Delaware requires one. Receives service of process on the company’s behalf.',
  scopes:['mail:forward'],
  uses:[{wf:'W1', step:'Federal & Finalize', what:'Registered Agent Agreement; forwards state mail'}],
  breaks:'The state can dissolve the entity for want of an agent. Not optional.',
  src:'catalog.py W1 documents' },

{ id:'irs', name:'IRS · EIN', cat:'legal', cap:'gov', logo:'IRS', lc:'#0F6E56',
  status:'completed', readiness:'planned', own:'onbehalf', dir:'write', cost:'Free',
  wf:['W1','W3'], alts:[],
  desc:'The federal tax ID. Everything downstream — the bank, payroll, Stripe — asks for it.',
  scopes:['filing:submit'],
  uses:[
    {wf:'W1', step:'Federal & Finalize', what:'EIN confirmation letter'},
    {wf:'W3', step:'Banking', what:'Mercury will not open an account without it'}
  ],
  breaks:'Nothing — a completed filing, not a live connection.',
  src:'catalog.py W1 P3 (provider/automated)' },

{ id:'delaware', name:'Delaware Div. of Corporations', cat:'legal', cap:'gov', logo:'DE', lc:'#185FA5',
  status:'attention', readiness:'planned', own:'onbehalf', dir:'write', cost:'filing fees',
  wf:['W1','W5'], alts:[],
  desc:'Franchise tax, annual report — and the assumed-name filing if you market under a different name.',
  scopes:['filing:submit'],
  uses:[
    {wf:'W1', step:'Federal & Finalize', what:'Franchise tax registration, compliance calendar'},
    {wf:'W5', step:'Brand name check', what:'Certificate of Assumed Name (DBA) when the trade name ≠ the legal name'}
  ],
  breaks:'Franchise tax is not optional. A DBA gap means you are marketing under a name you have not registered.',
  attention:'<b>W5 flagged a DBA.</b> Your legal name and your trade name differ, which triggers a Certificate of Assumed Name filing. W5 tells you this; nothing files it.',
  src:'catalog.py W1 · w5 studio entity toggle' },

{ id:'uspto', name:'USPTO', cat:'legal', cap:'gov', logo:'TM', lc:'#534AB7',
  status:'blocked', readiness:'planned', own:'onbehalf', dir:'both', cost:'$250–350/class',
  wf:['W2','W5'], alts:[],
  desc:'Trademark clearance for the name and mark W5 generated.',
  scopes:['search:read','filing:submit'],
  uses:[
    {wf:'W5', step:'Send to Legal', what:'Hands over the brand name and logo file, classes 9 and 42'},
    {wf:'W2', step:'IP ownership', what:'Runs the knockout search and reports whether the mark is clear'}
  ],
  breaks:'You print a logo you may not own.',
  attention:'<b>Not connected anywhere.</b> W5’s <span class="mono">trademark</span> card is a button and a toast. There is no USPTO search, no filing, and no result comes back. W2 has nothing to receive.',
  src:'w5 all-features trademark card · catalog.py W2 P2' },

/* ─────────────────── 03 · BRAND & WEB ─────────────────── */
{ id:'registrar', name:'Domain Registrar', cat:'brand', cap:'domain', logo:'@', lc:'#D85A30',
  status:'connected', readiness:'planned', own:'yours', dir:'both', cost:'$79/yr',
  wf:['W5','W4'], alts:['GoDaddy','Namecheap','Cloudflare'],
  desc:'korax.dev — registered in your name, never ours. DNS, SSL and CDN configured automatically.',
  scopes:['dns:write','registration:write'],
  uses:[
    {wf:'W5', step:'Domain · Email · Handles', what:'Search, register, configure DNS + SSL'},
    {wf:'W5', step:'Live landing page', what:'Points the deployed site at the domain'},
    {wf:'W4', step:'Domain & email', what:'W4 also claims this step — the workflow is skipped, so W5 does it'}
  ],
  breaks:'The site goes dark and the mailboxes stop.',
  src:'w5 all-features domain card · catalog.py W4 P1',
  note:'Registered <b>in your name</b>. You can transfer it out at any time without asking us.' },

{ id:'senddomain', name:'Sending Domain', cat:'brand', cap:'dns', logo:'✉', lc:'#A32D2D',
  status:'connected', readiness:'planned', own:'yours', dir:'write', cost:'~$12/yr',
  wf:['W7'], alts:[],
  desc:'A second, throwaway domain for cold outbound. Because sending from your brand domain burns it in 30 days.',
  scopes:['dns:write'],
  uses:[
    {wf:'W7', step:'Domain setup & warmup', what:'SPF, DKIM, DMARC, RFC 8058 one-click unsubscribe, six-week warmup ramp'},
    {wf:'W7', step:'Sequences', what:'Sends only after warmup completes — 5–10/day, ramping to a 120/day cap'}
  ],
  breaks:'Outbound sends from your brand domain. Reputation damage is not reversible on a schedule you control.',
  src:'w7-gtm deliverability',
  note:'The cheapest risk mitigation in outbound sales. <b>Twelve dollars a year to insulate the domain your customers actually visit.</b>' },

{ id:'gworkspace', name:'Google Workspace', cat:'brand', cap:'email', logo:'G', lc:'#4285F4',
  status:'connected', readiness:'planned', own:'yours', dir:'both', cost:'$7/user/mo',
  wf:['W5','W3','W7','W4'], alts:['Microsoft 365'],
  desc:'Business email. One connector, four workflows — each one claims a different alias.',
  scopes:['mail:send','mail:read','calendar:read'],
  uses:[
    {wf:'W5', step:'Domain · Email · Handles', what:'Provisions hello@ and the alias set'},
    {wf:'W3', step:'Revenue', what:'billing@ receives invoices and receipts'},
    {wf:'W7', step:'Support', what:'support@ plus the auto-reply'},
    {wf:'W7', step:'Send first 20 by hand', what:'Your own mailbox sends the outbound — never our IPs'}
  ],
  breaks:'Everything email-shaped, in four workflows at once.',
  src:'w5 domain card · w7 support & first20 · catalog.py W4 P1' },

{ id:'hosting', name:'Hosting · CDN · SSL', cat:'brand', cap:'hosting', logo:'⌘', lc:'#D85A30',
  status:'connected', readiness:'planned', own:'managed', dir:'write', cost:'Included',
  wf:['W5'], alts:['Vercel','Netlify (W4)'],
  desc:'Where the landing page lives. Managed by us; the static build is exportable at any time.',
  scopes:['deploy:write'],
  uses:[
    {wf:'W5', step:'Live landing page', what:'Deploys the site — 96/100 page speed, SSL, CDN'},
    {wf:'W5', step:'Multi-page site', what:'Adds pages that inherit the brand system'}
  ],
  breaks:'The site is offline. Export the static build and host it anywhere.',
  src:'w5 landing card',
  note:'The one connector we <b>manage</b> rather than hand you. Export is always available — that is the deal.' },

{ id:'searchconsole', name:'Google Search Console', cat:'brand', cap:'seo', logo:'GS', lc:'#4285F4',
  status:'connected', readiness:'planned', own:'yours', dir:'read', cost:'Free',
  wf:['W5'], alts:[],
  desc:'Verifies the property and reports impressions. You will correctly ignore it for three months.',
  scopes:['sites:read'],
  uses:[{wf:'W5', step:'SEO basics + hosting', what:'Verification, sitemap submission, impression reporting'}],
  breaks:'You lose search reporting. Nothing else.',
  src:'w5 all-features seo card' },

{ id:'slides', name:'Google Slides', cat:'brand', cap:'office', logo:'GS', lc:'#F4B400',
  status:'connected', readiness:'planned', own:'yours', dir:'write', cost:'Free',
  wf:['W5'], alts:['PowerPoint','PDF','share link'],
  desc:'Export target for the deck. Fonts and palette carry over; edits made there do not sync back.',
  scopes:['presentations:write'],
  uses:[{wf:'W5', step:'Slides export', what:'Exports pitch/sales deck with fonts embedded'}],
  breaks:'Export as PDF instead.',
  src:'w5 all-features export card',
  note:'One-way. <b>The version in W5 stays canonical</b> — the editor says so out loud.' },

{ id:'canva', name:'Canva', cat:'brand', cap:'design', logo:'Cv', lc:'#00C4CC',
  status:'available', readiness:'planned', own:'yours', dir:'write', cost:'Free tier',
  wf:['W5'], alts:[],
  desc:'Optional. For tweaking an exported asset yourself. Never required to finish W5.',
  scopes:['designs:write'],
  uses:[{wf:'W5', step:'Brand kit assets', what:'Opens a kit asset in your own Canva for further edits'}],
  breaks:'Nothing. It is explicitly optional.',
  src:'w5 all-features kit card · studio Connections' },

{ id:'socials', name:'Social Handles', cat:'brand', cap:'identity', logo:'in', lc:'#0A66C2',
  status:'attention', readiness:'planned', own:'yours', dir:'write', cost:'Free',
  wf:['W5'], alts:[],
  desc:'LinkedIn, X, Instagram, YouTube. Checked in the same pass as the domain, claimed one by one.',
  scopes:['handle:claim'],
  uses:[{wf:'W5', step:'Domain · Email · Handles', what:'Checks availability, drops you into each platform’s signup with the name prefilled'}],
  breaks:'Someone else takes the handle.',
  attention:'<b>Instagram is a near-match, not a claim.</b> W5 flags it and suggests an alternative. Nothing claims it for you.',
  src:'w5 all-features domain card' },

{ id:'gbp', name:'Google Business Profile', cat:'brand', cap:'listing', logo:'GB', lc:'#4285F4',
  status:'skipped', readiness:'planned', own:'yours', dir:'write', cost:'Free',
  wf:['W5'], alts:[],
  desc:'Local and search presence. Skipped — a remote software company has no premises to list.',
  scopes:['listing:write'],
  uses:[{wf:'W5', step:'Connections', what:'Claims the local business listing'}],
  breaks:'Nothing, for a company with no storefront.',
  src:'w5 studio.html Connections pane' },

/* ─────────────────── 04 · GROWTH & REVENUE ─────────────────── */
{ id:'folk', name:'Folk', cat:'growth', cap:'crm', logo:'F', lc:'#1C1A16',
  status:'connected', readiness:'planned', own:'yours', dir:'both', cost:'$24/user/mo',
  wf:['W7','W5'], alts:['Attio','HubSpot','Notion','Pipedrive'],
  desc:'The CRM. Organises people by how you know them, not by deal stage — which is how a solo founder actually sells.',
  scopes:['contacts:write','notes:write'],
  uses:[
    {wf:'W7', step:'CRM connect & object model', what:'Relationship model — one contact is beta user, design partner, customer and referrer at once'},
    {wf:'W7', step:'Target account list', what:'Receives 50 accounts built from W5’s ICP'},
    {wf:'W5', step:'CRM Sync → W7', what:'W5 pushes the voice profile, personas and battlecards onto contact records'}
  ],
  breaks:'The pipeline goes back into a spreadsheet, and W5’s handoff has nowhere to land.',
  attention:'<b>Provider mismatch.</b> W7 offers Folk, Attio, HubSpot and Notion. W5’s <span class="mono">crmsync</span> card only offers <b>HubSpot, Attio and Pipedrive</b>. If you pick Folk in W7, W5 cannot hand off to it.',
  src:'w7-gtm crm · w5 all-features crmsync',
  note:'No AI features, no mobile app, enrichment capped at 500–1,000 credits. Chosen anyway, because at 0→10 customers deal flow comes from your network.' },

{ id:'apollo', name:'Apollo', cat:'growth', cap:'prospecting', logo:'Ap', lc:'#1B1B3A',
  status:'connected', readiness:'planned', own:'yours', dir:'read', cost:'$49–99/user/mo',
  wf:['W7'], alts:['Clay (for enrichment)'],
  desc:'275M contacts. Used to build the target list from W5’s ICP — not to send.',
  scopes:['contacts:read','companies:read'],
  uses:[{wf:'W7', step:'Target account list', what:'Queries by ICP criteria; returns accounts for review'}],
  breaks:'You build the list by hand from LinkedIn.',
  src:'w7-gtm targetlist',
  note:'Email accuracy is <b>65–70%</b>. Sending straight from Apollo without a waterfall is how bounce rates cross 2%.' },

{ id:'clay', name:'Clay', cat:'growth', cap:'enrichment', logo:'Cl', lc:'#3B2A1A',
  status:'connected', readiness:'planned', own:'yours', dir:'read', cost:'~$149/mo, credit-based',
  wf:['W7'], alts:[],
  desc:'The enrichment waterfall. 150+ providers tried in order until an email is found.',
  scopes:['enrichment:read'],
  uses:[{wf:'W7', step:'Enrichment waterfall', what:'Apollo → Hunter → Dropcontact → Prospeo → LeadMagic; coverage climbs 42% → 78%'}],
  breaks:'Coverage collapses to ~42%, bounces climb, and the sending domain burns.',
  src:'w7-gtm enrich',
  note:'Coverage is a <b>deliverability decision, not a data one</b>. Bounces above 2% break the Google/Yahoo/Microsoft bulk-sender rules.' },

{ id:'graph', name:'Gmail · LinkedIn · Calendar', cat:'growth', cap:'graph', logo:'∞', lc:'#6A6659',
  status:'connected', readiness:'planned', own:'yours', dir:'read', cost:'Free',
  wf:['W7'], alts:[],
  desc:'Read-only scan of your own network, to find a warm path into a cold account.',
  scopes:['mail:read','contacts:read','calendar:read'],
  uses:[{wf:'W7', step:'Warm-path finder', what:'Finds who you already know at a target account, and how well'}],
  breaks:'Every account is cold. Warm intros convert 33%; outbound converts 5%.',
  src:'w7-gtm warmpaths',
  note:'Read-only. <b>Nothing leaves your account</b> — the editor states this before you grant access.' },

{ id:'instantly', name:'Instantly', cat:'growth', cap:'outreach', logo:'I', lc:'#2B59FF',
  status:'blocked', readiness:'planned', own:'yours', dir:'write', cost:'from $37/mo',
  wf:['W7'], alts:['Apollo sequences','Smartlead'],
  desc:'Sending infrastructure for sequences at volume. Warmup, inbox rotation, deliverability protection.',
  scopes:['campaigns:write','mailboxes:write'],
  uses:[{wf:'W7', step:'Outreach sequences', what:'Sends the sequence W7 composed in W5’s brand voice'}],
  breaks:'You send at volume from your own mailbox, which is how a mailbox gets suspended.',
  attention:'<b>Blocked for six weeks.</b> The sending domain is still warming — week 1 of 6. Until then, outbound happens by hand via <span class="mono">first20</span>. This is the correct answer, not a workaround.',
  src:'w7-gtm sequences · deliverability' },

{ id:'fathom', name:'Fathom + Zoom', cat:'growth', cap:'meetings', logo:'Fa', lc:'#4A55E0',
  status:'connected', readiness:'planned', own:'yours', dir:'read', cost:'Free tier',
  wf:['W7'], alts:['Gong','Grain'],
  desc:'The notetaker joins the call. W7 marks the transcript with objection timestamps.',
  scopes:['meetings:read','transcripts:read'],
  uses:[
    {wf:'W7', step:'Discovery-call kit', what:'Records the call against the discovery template'},
    {wf:'W7', step:'Call intelligence', what:'Transcript → objection timeline. A repeated objection fires deal_lost() at W5'}
  ],
  breaks:'You take notes by hand and lose the exact sentence the customer used — which is the only thing this stage produces.',
  src:'w7-gtm callintel · discovery',
  note:'~95% transcription, 30-second summaries, free on Zoom. Gong’s <b>objection timeline</b> is the idea worth copying; Fathom is the founder-grade version.' },

{ id:'docsend', name:'DocSend', cat:'growth', cap:'docshare', logo:'DS', lc:'#0F6E56',
  status:'connected', readiness:'planned', own:'yours', dir:'both', cost:'~$15/mo',
  wf:['W7','W5'], alts:['Pitch'],
  desc:'W5 builds the deck. This tells you which slide they stopped on — and whether legal opened it.',
  scopes:['documents:write','analytics:read'],
  uses:[
    {wf:'W5', step:'Pitch deck', what:'Source of the deck being shared'},
    {wf:'W7', step:'Deck room & view analytics', what:'Tracked link, per-slide attention, viewer list'}
  ],
  breaks:'You email a PDF and learn nothing.',
  src:'w7-gtm dealroom' },

{ id:'posthog', name:'PostHog', cat:'growth', cap:'analytics', logo:'Ph', lc:'#1D4AFF',
  status:'connected', readiness:'planned', own:'yours', dir:'both', cost:'Free to 1M events/mo',
  wf:['W7','W5'], alts:['Plausible','GA4'],
  desc:'Events, funnels, session replay, feature flags, A/B. Installed on the site W5 deployed.',
  scopes:['events:write','flags:read'],
  uses:[
    {wf:'W7', step:'Analytics & UTM builder', what:'Snippet install, event verification, tagged links'},
    {wf:'W7', step:'Landing-page experiments', what:'A/B test on W5’s page — the winner fires weak_conversion at W5'},
    {wf:'W5', step:'Live landing page', what:'The surface being measured'}
  ],
  breaks:'The funnel is a guess. Attribution is a story.',
  src:'w7-gtm tracking · experiments',
  note:'Replaces Plausible + Amplitude + Fullstory. Plausible is the pick if you want <b>no cookie banner</b>.' },

{ id:'intercom', name:'Intercom Fin', cat:'growth', cap:'support', logo:'Fi', lc:'#1F1F1F',
  status:'declined', readiness:'planned', own:'yours', dir:'both', cost:'~$0.99/resolution',
  wf:['W7'], alts:['Crisp (~$0.05/ticket)','answer it yourself'],
  desc:'AI support agent. Declined — one customer does not justify a 50-resolution monthly minimum.',
  scopes:['conversations:write','kb:read'],
  uses:[{wf:'W7', step:'Support & knowledge base', what:'Would answer tier-1 tickets from the KB seeded by W5’s blog'}],
  breaks:'Nothing. Huzaifa answers his own email, which at one customer is correct.',
  src:'w7-gtm support',
  note:'Real-world resolution is <b>42–50%</b>, not the marketing number. Budget against that. Salesforce agreed to acquire Fin for ~$3.6B in June 2026.' },

/* ─────────────────── 05 · PEOPLE ─────────────────── */
{ id:'gusto', name:'Gusto', cat:'people', cap:'payroll', logo:'Gu', lc:'#F45D48',
  status:'available', readiness:'planned', own:'yours', dir:'both', cost:'$40/mo + $6/person',
  wf:['W6'], alts:['Rippling','Deel'],
  desc:'Payroll and benefits. Not connected — there are no employees yet.',
  scopes:['payroll:write','employees:write'],
  uses:[
    {wf:'W6', step:'Set up payroll', what:'Creates the account, pre-fills company details'},
    {wf:'W6', step:'Employee onboarding', what:'Adds the hire, direct deposit, tax forms, benefits enrollment'}
  ],
  breaks:'Nothing today. The phase is <b>gated on the bank account being live</b> — Mercury first, then this.',
  src:'w6 mock Recommended providers · catalog.py W6 P3 · ports/payroll.py <i>(TODO stub)</i>',
  note:'W6 recommends by shape: <b>Gusto</b> for a US-only team, <b>Rippling</b> if you want HR + IT bundled later, <b>Deel</b> for any international contractor.' },

{ id:'jobboards', name:'LinkedIn · Wellfound · Braintrust', cat:'people', cap:'hiring', logo:'JB', lc:'#3B6D11',
  status:'available', readiness:'planned', own:'yours', dir:'write', cost:'Varies',
  wf:['W6'], alts:[],
  desc:'Where the role gets posted. W6 drafts the JD and the social hiring poster; you press publish.',
  scopes:['jobs:write'],
  uses:[{wf:'W6', step:'Where to post', what:'LinkedIn for broad reach · Wellfound for startup-native candidates comfortable with equity · Braintrust for vetted contractors'}],
  breaks:'Nothing. Sourcing in W6 is guide-only by design.',
  src:'w6 mock Where to post' },

/* ─────────────────── 06 · TECHNICAL (W4 skipped) ─────────────────── */
{ id:'github', name:'GitHub', cat:'tech', cap:'code', logo:'Gh', lc:'#1B1B1B',
  status:'skipped', readiness:'planned', own:'yours', dir:'both', cost:'Free',
  wf:['W4'], alts:[],
  desc:'The code org — commits gated on a signed PIIA. W4 is skipped, so nobody creates it.',
  scopes:['org:write','repos:write'],
  uses:[{wf:'W4', step:'Code repository', what:'Creates the org; gates commit access on the PIIA signed in W2'}],
  breaks:'Nothing today — but the PIIA gate is a real control that nothing currently enforces.',
  src:'catalog.py W4 P2 (provider/automated)' },

{ id:'vercel', name:'Vercel + Supabase', cat:'tech', cap:'infra', logo:'▲', lc:'#1B1B1B',
  status:'skipped', readiness:'planned', own:'yours', dir:'write', cost:'Free tier',
  wf:['W4'], alts:['Netlify','Render','Fly.io','Neon'],
  desc:'Product hosting and managed Postgres. Distinct from the marketing-site hosting W5 manages.',
  scopes:['deploy:write','db:admin'],
  uses:[{wf:'W4', step:'Hosting & infra', what:'Deploys the product; provisions managed Postgres'}],
  breaks:'Nothing today. W4 is skipped.',
  src:'catalog.py W4 P3 · doc_templates security baseline' },

{ id:'auth', name:'Auth Provider', cat:'tech', cap:'auth', logo:'⚿', lc:'#BA7517',
  status:'skipped', readiness:'planned', own:'yours', dir:'both', cost:'Free tier',
  wf:['W4'], alts:['Clerk','Supabase Auth','Auth0','WorkOS'],
  desc:'Product sign-in. WorkOS if enterprise SSO shows up in a security questionnaire.',
  scopes:['users:write'],
  uses:[{wf:'W4', step:'Auth provider setup', what:'Stands up sign-in for the product'}],
  breaks:'Nothing today.',
  src:'catalog.py W4 documents' },

{ id:'secrets', name:'Secrets Manager', cat:'tech', cap:'secrets', logo:'1P', lc:'#1B1B1B',
  status:'skipped', readiness:'planned', own:'yours', dir:'both', cost:'~$8/user/mo',
  wf:['W4','W8'], alts:['1Password','Doppler'],
  desc:'Named as a field in W4’s security baseline. Nothing connects it.',
  scopes:['secrets:read'],
  uses:[{wf:'W4', step:'Security baseline', what:'A free-text field asking which secrets store you use'}],
  breaks:'Nothing today.',
  src:'doc_templates_w2_w8 security baseline field' }
];

/* ─────────────────── capability map ─────────────────── */
const CAPS = [
  { cap:'banking',      active:'Mercury',            wf:['W3','W6'],      readiness:'wired' },
  { cap:'accounting',   active:null,                 wf:['W3'],           readiness:'planned' },
  { cap:'payments',     active:'Stripe',             wf:['W3','W7'],      readiness:'scaffolded' },
  { cap:'captable',     active:null,                 wf:['W1','W3'],      readiness:'planned' },
  { cap:'incorporation',active:'Stripe Atlas',       wf:['W1'],           readiness:'scaffolded' },
  { cap:'esign',        active:'DocuSign',           wf:['W1','W2','W6'], readiness:'scaffolded' },
  { cap:'gov filings',  active:'partial',            wf:['W1','W2','W5'], readiness:'planned' },
  { cap:'domain',       active:'Registrar',          wf:['W5','W4'],      readiness:'planned' },
  { cap:'dns / sending',active:'Sending domain',     wf:['W7'],           readiness:'planned' },
  { cap:'email',        active:'Google Workspace',   wf:['W5','W3','W7'], readiness:'planned' },
  { cap:'hosting',      active:'Managed by us',      wf:['W5'],           readiness:'planned' },
  { cap:'crm',          active:'Folk',               wf:['W7','W5'],      readiness:'planned' },
  { cap:'prospecting',  active:'Apollo',             wf:['W7'],           readiness:'planned' },
  { cap:'enrichment',   active:'Clay',               wf:['W7'],           readiness:'planned' },
  { cap:'outreach',     active:'Instantly',          wf:['W7'],           readiness:'planned' },
  { cap:'meetings',     active:'Fathom',             wf:['W7'],           readiness:'planned' },
  { cap:'docshare',     active:'DocSend',            wf:['W7','W5'],      readiness:'planned' },
  { cap:'analytics',    active:'PostHog',            wf:['W7','W5'],      readiness:'planned' },
  { cap:'support',      active:null,                 wf:['W7'],           readiness:'planned' },
  { cap:'payroll',      active:null,                 wf:['W6'],           readiness:'planned' },
  { cap:'hiring',       active:null,                 wf:['W6'],           readiness:'planned' },
  { cap:'code',         active:null,                 wf:['W4'],           readiness:'planned' },
  { cap:'infra',        active:null,                 wf:['W4'],           readiness:'planned' },
  { cap:'auth',         active:null,                 wf:['W4'],           readiness:'planned' },
  { cap:'secrets',      active:null,                 wf:['W4','W8'],      readiness:'planned' },
  { cap:'booking',      active:null,                 wf:['W7'],           readiness:'missing' },
  { cap:'invoicing',    active:null,                 wf:['W3','W7'],      readiness:'missing' },
  { cap:'trademark',    active:null,                 wf:['W2','W5'],      readiness:'missing' }
];

/* ─────────────────── issues the hub surfaces ─────────────────── */
const ISSUES = [
  { sev:'hi', t:'Only three capabilities are actually wired',
    b:'<b>banking</b> (Mercury), <b>search</b> and <b>model</b> have a Protocol in <span class="mono">ports/</span> and a working adapter. <b>esign</b>, <b>incorporation</b>, <b>payments</b> and <b>payroll</b> have adapter folders but their port is a five-line <span class="mono">TODO(@eng-integrations): define the Protocol</span> stub. Everything else in this hub is named in a mock and implemented nowhere.' },
  { sev:'hi', t:'CRM provider mismatch between W5 and W7',
    b:'W7 offers <b>Folk, Attio, HubSpot, Notion</b>. W5’s <span class="mono">crmsync</span> offers <b>HubSpot, Attio, Pipedrive</b>. Pick Folk — which the research says is right for 0→10 customers — and W5’s handoff of voice, personas and battlecards has nowhere to land. Two workflows, two provider lists, one silent failure.' },
  { sev:'hi', t:'No booking connector, but two workflows assume one',
    b:'W7’s <span class="mono">first20</span> and <span class="mono">discovery</span> both assume a meeting gets scheduled. Nothing schedules one. The founder pastes a Calendly link into his signature by hand. Calendly appears in the reference flow for W8 — it is not built anywhere.' },
  { sev:'md', t:'No invoicing or collections rail',
    b:'W3 ships an <b>Invoice Template</b> document. W7’s <span class="mono">checkout</span> handles self-serve card payments. Nothing sends an invoice or collects a fixed fee — which is how every services engagement gets paid.' },
  { sev:'md', t:'The trademark handoff is a toast',
    b:'W5’s <span class="mono">trademark</span> card says "sent to W2 for clearance". No USPTO search runs, no filing is submitted, and no result comes back. W2’s IP-ownership phase has nothing to receive.' },
  { sev:'md', t:'Stripe can be connected twice',
    b:'W3 sets Stripe up. W7’s <span class="mono">checkout</span> must reuse that account and explicitly says so — but nothing in the model prevents a second connection. The <span class="mono">Integration</span> record has no uniqueness constraint on <span class="mono">capability</span>.' },
  { sev:'md', t:'Delaware assumed-name filing is flagged, never filed',
    b:'W5’s entity toggle correctly tells you a trade name different from the legal name needs a Certificate of Assumed Name. Nothing files it, and nothing tracks whether you did.' },
  { sev:'lo', t:'Analytics ownership is ambiguous',
    b:'PostHog lives in W7. W5 only connects Search Console. The master workflow diagram assigns <b>Analytics</b> to W5. Three sources, three answers.' },
  { sev:'lo', t:'W4 is skipped, so W5 quietly does W4’s job',
    b:'W4 P1 is "Domain & email". W5’s <span class="mono">domain</span> card does exactly that. GitHub, hosting, auth and the secrets store have no owner while W4 stays skipped.' },
  { sev:'lo', t:'Every connector here is a button and a toast',
    b:'Except Mercury, none of these mocks perform an OAuth handshake, an API call or a DNS lookup. This hub is the <b>specification</b> for what the integration layer must eventually manage — not a view onto a live one.' }
];

window.HUB = { WF, CATS, C, CAPS, ISSUES };
})();
