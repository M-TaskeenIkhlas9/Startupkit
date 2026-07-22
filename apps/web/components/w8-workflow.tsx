"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { completePhase, getHealth, gtmChat, saveOps } from "@/lib/api";
import type { CompanySnapshot, HealthScore, WorkflowView } from "@/lib/types";

// W8 · Operations & Tooling — the founder's design (orange, phase strip, task tables, and the
// AI Company Operator), powered by OUR numbers.
//
// The rule that survived every redesign: every number on screen traces to real company state.
// MRR comes from W7's won accounts × the locked tier. Open risks come from the register. Where a
// source isn't connected (runway needs W3 accounting), the tile says so instead of inventing.
//
// Deliberately NOT built: a kanban board (ClickUp's job), automation *execution* or "time saved"
// counters (Zapier's numbers, not ours — the Automation Layer here is a registry, not an engine),
// SSO/endpoint management (enterprise IT — irrelevant before ~20 people). Knowledge Base is a
// pointer registry, not a wiki — Notion/Confluence hold the content, we track what exists and
// whether it's stale. Asset Management tracks discrete owned/licensed items, distinct from the
// Vendor registry's recurring tool subscriptions.
//
// PERSISTENCE: real, event-sourced — `ops.state.set` on the Company Object, same contract as
// W5's brand state and W7's GTM state. Seeded from `snapshot.ops` on load, saved via `saveOps`.
const R = "#F26B1D"; // W8 orange (matches the catalog + the founder's design)
const BLUE = "#2563EB"; // primary action, like the mock's Continue buttons
const GREEN = "#16A34A";
const INK = "#111827";

const card = "rounded-2xl border border-[#EBECE9] bg-white";
const btnBlue = "rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-[#D9DEE7] bg-white px-4 py-2 text-sm font-medium text-[#3A414D] hover:border-[#9AA3B0] disabled:opacity-50";
const label = "text-[11px] font-semibold uppercase tracking-wide text-[#9AA3B0]";
const input =
  "w-full rounded-lg border border-[#EBECE9] px-3 py-2 text-sm outline-none focus:border-[#F26B1D]";

// ---------------- state ----------------

type Cadence = {
  name: string;
  freq: string; // display label, e.g. "Weekly · Mon"
  kind: string; // weekly | monthly | quarterly
  day: string; // MO..FR for weekly, "" otherwise
  time: string; // "09:30"
  mins: number;
  attendees: string;
  purpose: string;
  booked: boolean; // the founder's act: it's actually on their calendar
};
type DecisionRight = { decision: string; owner: string; note: string };
type AreaOwner = { area: string; owner: string };
type QuarterGoal = { text: string; metric: string; code: string }; // metric = the ONE number; code = the workflow it lives in
type Sop = {
  id: string;
  title: string;
  why: string;
  status: string; // proposed | drafted | adopted
  owner: string;
  trigger: string; // when this SOP runs
  steps: string[]; // the actual steps — drafted by W8, edited by the founder
  done_means: string; // the observable end state
  runs: number; // times it has actually been run (adoption = first completed run)
  last_run: string; // ISO date of the last run
};
type Vendor = {
  id: string;
  name: string;
  category: string;
  cost: string; // $/mo — founder fills; we never invent a price
  renewal: string; // ISO date or ""
  owner: string;
  access: string; // who has a login, comma-separated — this generates the offboarding checklist
  critical: boolean; // company stops without it
  source: string; // where we found it: "W7 connection" | "integration" | "you added it"
};
type Risk = {
  id: string;
  key: string; // stable identity for re-scanning ("key-person", "pricing-unlocked", "custom-…")
  title: string;
  category: string;
  likelihood: number; // 1..3 — editable; severity is computed from L×I
  impact: number; // 1..3
  severity: string; // high | medium | low — sevOf(likelihood × impact)
  evidence: string; // WHY we flagged it — from real company state
  mitigation: string;
  status: string; // open | mitigated | accepted | resolved (resolved = verified by re-scan, never a click)
  workflow: string; // where to fix it, "" if here
};

function sevOf(l: number, i: number): string {
  const s = l * i;
  return s >= 6 ? "high" : s >= 3 ? "medium" : "low";
}
type Policy = {
  id: string;
  name: string;
  summary: string;
  rules: string[]; // the actual rules — editable until they're livable
  adopted: boolean;
  adopted_on: string; // ISO date — stamps the act
  agreed_by: string; // who agreed — adoption is a team act, not a click
};

type OpsReview = {
  date: string; // ISO
  wins: string; // what moved this week
  priority: string; // the ONE priority for next week
};
type Initiative = {
  id: string;
  title: string;
  owner: string;
  target: string; // ISO date
  status: string; // planned | active | done | blocked
  note: string;
};
type KnowledgeItem = {
  id: string;
  title: string;
  category: string;
  owner: string;
  location: string; // a link, or "Notion" / "Confluence" / ... — we point, we don't host
  last_reviewed: string; // ISO date
};
type Asset = {
  id: string;
  name: string;
  category: string;
  assignee: string;
  cost: string;
  purchased: string; // ISO date
  status: string; // active | retired
};
type Automation = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  tool: string;
  owner: string;
  status: string; // active | broken | retired
};

type OpsState = {
  mission: string;
  stakes: string; // "if we die, who loses what?" — sharper than mission alone
  cadences: Cadence[];
  decisions: DecisionRight[];
  owners: AreaOwner[]; // the PRD's Department Registry — who owns each area
  goals: QuarterGoal[]; // this quarter's 3, derived from real state
  sops: Sop[];
  vendors: Vendor[];
  risks: Risk[];
  policies: Policy[];
  reviews: OpsReview[]; // the weekly review, run in the Operator — newest first
  initiatives: Initiative[]; // company-level projects — not a kanban board
  knowledge: KnowledgeItem[]; // what documentation exists and where, not a wiki
  assets: Asset[]; // discrete owned/licensed items, distinct from vendor subscriptions
  automations: Automation[]; // a registry of what runs, not an execution engine
  steps_done: string[];
  generated: boolean;
};

const EMPTY_OPS: OpsState = {
  mission: "",
  stakes: "",
  cadences: [],
  decisions: [],
  owners: [],
  goals: [],
  sops: [],
  vendors: [],
  risks: [],
  policies: [],
  reviews: [],
  initiatives: [],
  knowledge: [],
  assets: [],
  automations: [],
  steps_done: [],
  generated: false,
};

// ---------------- the engines (deterministic, from the Company Object) ----------------

function deriveCadences(snap: CompanySnapshot): Cadence[] {
  const solo = (snap.founders?.length ?? 1) <= 1 && (snap.team_size ?? 1) <= 1;
  const small = (snap.team_size ?? 1) <= 4;
  if (solo) {
    return [
      { name: "Weekly review", freq: "Weekly · Fri", kind: "weekly", day: "FR", time: "16:00", mins: 30, attendees: "You", booked: false, purpose: "What moved, what didn't, one priority for next week. Written, so future-you can read it." },
      { name: "Monthly numbers", freq: "Monthly · 1st", kind: "monthly", day: "", time: "10:00", mins: 45, attendees: "You", booked: false, purpose: "Runway, pipeline (from W7), one metric per active bet." },
      { name: "Quarterly reset", freq: "Quarterly", kind: "quarterly", day: "", time: "10:00", mins: 120, attendees: "You + an advisor", booked: false, purpose: "Kill or double each bet. Rewrite the one-page plan." },
    ];
  }
  return [
    { name: "Weekly tactical", freq: "Weekly · Mon", kind: "weekly", day: "MO", time: "09:30", mins: 30, attendees: small ? "Everyone" : "Leads", booked: false, purpose: "Blockers and this week's commitments. Written updates before, decisions in the room." },
    { name: "Metrics review", freq: "Weekly · Fri", kind: "weekly", day: "FR", time: "16:00", mins: 20, attendees: small ? "Everyone" : "Leads", booked: false, purpose: "Pipeline from W7, product usage, runway. Numbers only, no narrative." },
    { name: "Monthly retro", freq: "Monthly · 1st", kind: "monthly", day: "", time: "10:00", mins: 60, attendees: "Everyone", booked: false, purpose: "What broke this month and which SOP would have prevented it." },
    { name: "Quarterly OKRs", freq: "Quarterly", kind: "quarterly", day: "", time: "10:00", mins: 240, attendees: "Everyone", booked: false, purpose: "3 objectives max. If everything is a priority, nothing is." },
  ];
}

// ---------------- the calendar handoff (the 99/1 move) ----------------
// Same trick as W7's Gmail compose: a prefilled deep link, no OAuth, we're never in the path.
// We write the recurring event; the founder clicks once. `booked` records THEIR act.

function nextOccurrence(c: Cadence): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [h, m] = (c.time || "09:30").split(":").map(Number);
  if (c.kind === "weekly") {
    const idx = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5 }[c.day as "MO"] ?? 1;
    let ahead = (idx - d.getDay() + 7) % 7;
    if (ahead === 0) ahead = 7;
    d.setDate(d.getDate() + ahead);
  } else if (c.kind === "monthly") {
    d.setMonth(d.getMonth() + 1, 1);
  } else {
    d.setMonth(Math.floor(d.getMonth() / 3) * 3 + 3, 1); // first day of next quarter
  }
  d.setHours(h || 9, m || 0, 0, 0);
  return d;
}

function rruleOf(c: Cadence): string {
  if (c.kind === "weekly") return `RRULE:FREQ=WEEKLY;BYDAY=${c.day || "MO"}`;
  if (c.kind === "monthly") return "RRULE:FREQ=MONTHLY;BYMONTHDAY=1";
  return "RRULE:FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=1";
}

function calStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

function gcalUrl(c: Cadence, company: string): string {
  const start = nextOccurrence(c);
  const end = new Date(start.getTime() + c.mins * 60000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `${c.name} — ${company}`,
    details: `${c.purpose}\n\nAttendees: ${c.attendees}\nGenerated by StartupKit W8.`,
    dates: `${calStamp(start)}/${calStamp(end)}`,
    recur: rruleOf(c),
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function icsFile(c: Cadence, company: string): string {
  const start = nextOccurrence(c);
  const end = new Date(start.getTime() + c.mins * 60000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//StartupKit//W8//EN",
    "BEGIN:VEVENT",
    `UID:w8-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}@startupkit`,
    `DTSTART:${calStamp(start)}`,
    `DTEND:${calStamp(end)}`,
    rruleOf(c),
    `SUMMARY:${c.name} — ${company}`,
    `DESCRIPTION:${c.purpose.replace(/\n/g, "\\n")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

// The PRD's Department Registry (W8-001): five areas, one owner each. Solo founders own all
// five — which is exactly the key-person risk, made visible.
const AREAS = ["Finance", "Product", "Engineering", "Sales", "Operations"];

function deriveOwners(snap: CompanySnapshot): AreaOwner[] {
  const f = snap.founders ?? [];
  const first = f[0]?.name || "Founder";
  const second = f[1]?.name || "";
  return AREAS.map((area) => ({
    area,
    owner: second && (area === "Product" || area === "Engineering") ? second : first,
  }));
}

// This quarter's goals — derived from real cross-workflow state, never asked. Max 3.
function deriveGoals(snap: CompanySnapshot): QuarterGoal[] {
  const goals: QuarterGoal[] = [];
  const gtm = snap.gtm;
  const won = (gtm?.accounts ?? []).filter((a) => a.stage === "won").length;
  if (gtm?.strategy?.motion) {
    goals.push({
      text: "Close the first 10 customers",
      metric: `${won}/10 won`,
      code: "W7",
    });
  } else {
    goals.push({ text: "Get the GTM engine live", metric: "5 of 5 questions answered", code: "W7" });
  }
  if ((snap.founders ?? []).length <= 1) {
    goals.push({
      text: "Make the company survive a two-week absence",
      metric: "3 SOPs adopted",
      code: "W8",
    });
  }
  const hasAccounting = (snap.integrations ?? []).some((i) => i.capability === "accounting");
  if (!hasAccounting) {
    goals.push({ text: "Know the runway number", metric: "accounting connected", code: "W3" });
  } else if (gtm && !gtm.pricing.locked) {
    goals.push({ text: "Lock the pricing", metric: "pricing locked", code: "W7" });
  }
  return goals.slice(0, 3);
}

// "If we die, who loses what?" — sharper than a mission statement, seeded from the idea itself.
function deriveStakes(snap: CompanySnapshot): string {
  const who = snap.customer || "your customers";
  const problem = (snap.problem || "the problem you solve").replace(/\.$/, "");
  return `If ${snap.name} disappears tomorrow, ${who.toLowerCase()} keep living with: ${problem.toLowerCase()}.`;
}

function deriveDecisions(snap: CompanySnapshot): DecisionRight[] {
  const f = snap.founders ?? [];
  const ceo = f[0]?.name || "Founder";
  const second = f[1]?.name || "";
  return [
    { decision: "Spend over $500/mo", owner: ceo, note: "Anything recurring lands in the vendor registry first." },
    { decision: "Pricing & discounts", owner: ceo, note: "Locked in W7's Pricing Lab — a discount is a pricing change, not a sales move." },
    { decision: "Hiring & firing", owner: second ? `${ceo} + ${second}` : ceo, note: "Runs through W6. Never solo when there are two founders." },
    { decision: "Product scope", owner: second || ceo, note: "One owner. Committees ship late." },
    { decision: "Legal & contracts", owner: ceo, note: "Drafted in W2, signed by one person, filed in the data room." },
  ];
}

// The step library — REAL steps drafted from the company's own tools and state, not "1. …".
// Deterministic and specific: the CRM below is THEIR CRM, the payment link is THEIR link.
function sopContent(
  title: string,
  snap: CompanySnapshot,
): { trigger: string; steps: string[]; done_means: string } {
  const crm = (snap.gtm?.connections ?? []).find((c) => c.kind === "crm")?.provider || "your CRM";
  const payLink = snap.gtm?.inputs?.payment_link;
  const pilot = snap.gtm?.pricing?.pilot;
  const founder = snap.founders?.[0]?.name || "you";
  const second = snap.founders?.[1]?.name || "";

  switch (title) {
    case "Lead handling & follow-up":
      return {
        trigger: "A reply, form submission, or intro lands in your inbox.",
        steps: [
          "Reply within 24 hours — speed is the only advantage you have over bigger vendors.",
          `Log the contact in ${crm} and move the account's stage in W7 (contacted → replied).`,
          "Propose two concrete time slots for a 15-minute call — never \"let me know when works\".",
          "No reply after 3 days → send touch 2 from the W7 sequence (it's already written).",
          "After the call: write 3 lines — their problem in their words, the objection, the agreed next step.",
        ],
        done_means: "The account's stage in W7 matches reality and the next step has a date on it.",
      };
    case "Customer onboarding":
      return {
        trigger: "Someone says yes — a pilot starts or a payment lands.",
        steps: [
          payLink
            ? "Send the closing email with your payment link + order form (both live in W7 → CRM & Pipeline)."
            : "Send the order form from W7 (paste your payment link there first — W7 → How they pay).",
          "Book the kickoff call for within 5 days — momentum dies in week one.",
          "On the kickoff: agree ONE success metric with them and write it down where both sides see it.",
          pilot ? `Confirm the pilot terms in writing: ${pilot}.` : "Confirm the pilot terms and end-date in writing.",
          "Day 7 and day 14: check-in against the success metric — 10 minutes, not a meeting.",
          "Day 14: they've hit first value, or you know exactly why not (log it in W7 → Discovery).",
        ],
        done_means: "The customer reached first value inside 14 days, or the blocker is written down.",
      };
    case "Support & escalation":
      return {
        trigger: "A customer reports something broken or confusing.",
        steps: [
          "Acknowledge within 4 working hours — even just \"seen it, on it\".",
          "Classify: S1 = they cannot work (drop everything) · S2 = painful workaround exists (fix this week) · S3 = cosmetic (backlog).",
          `S1 → ${second ? `${founder} fixes, ${second} talks to the customer` : "fix first, update the customer every 2 hours"} — never the same person doing both at once.`,
          "Ship the fix or the honest ETA. Guessed ETAs burn more trust than slow ones.",
          "If the same issue appears twice, it becomes a product task, not a support pattern.",
        ],
        done_means: "The customer confirmed it's resolved — not you assuming it is.",
      };
    case "Invoicing & collections":
      return {
        trigger: "A deal closes, a pilot converts, or a renewal date arrives.",
        steps: [
          payLink
            ? "Invoice on signature day — send your payment link, not a PDF they have to process."
            : "Invoice on signature day (set up a payment link in W7 so paying takes 2 minutes).",
          "Record the expected payment + date in your bookkeeping (see Weekly bookkeeping SOP).",
          "Day 7 unpaid → friendly nudge, same thread: \"bumping this — anything blocking it?\"",
          "Day 14 unpaid → call them. Awkward beats unpaid.",
          "Day 30 unpaid → pause the service, kindly and in writing. You're a startup, not a bank.",
        ],
        done_means: "Money in the account — an invoice sent is not revenue collected.",
      };
    case "Deploy & rollback":
      return {
        trigger: "Anything is about to ship to production.",
        steps: [
          "Never deploy after 4pm Friday unless the company is on fire.",
          "Run the tests. All of them. A skipped test suite is a rollback rehearsal.",
          "Know the rollback BEFORE you deploy: the one command / revert that undoes this.",
          "Deploy, then actually use the changed feature in production yourself — don't just watch logs.",
          "Broken? Roll back FIRST, diagnose after. Users don't care why it's broken.",
        ],
        done_means: "The change is live, you've used it in prod, and the rollback path is still true.",
      };
    case "New-hire onboarding":
      return {
        trigger: "An offer is signed (roles live in W6).",
        steps: [
          "Before day 1: create accounts for every tool in the W8 vendor registry they'll need — the registry IS the checklist.",
          "Day 1: walk them through the Operating Model (Phase 1) — cadence, decision rights, who owns what.",
          "Day 1: hand them ONE owned area from the ownership map, even a small one.",
          "Week 1: they read the 3 adopted SOPs and run one of them with you watching.",
          "Week 2: they ship something real, however small. Momentum beats orientation.",
          "Day 30: written two-way review — what surprised them is your best ops feedback.",
        ],
        done_means: "They own an area, have run an SOP alone, and have shipped once.",
      };
    case "Weekly bookkeeping":
      return {
        trigger: "Same day every week, 30 minutes, calendar-blocked (add it in Phase 1).",
        steps: [
          "Categorize every transaction from the last 7 days — uncategorized spend is invisible spend.",
          "Reconcile the bank balance against your books; investigate any gap immediately.",
          "Check each invoice's status against the Invoicing SOP timeline (day 7/14/30).",
          "Update the runway number: cash ÷ average monthly burn. Write it down.",
          "New recurring charge you don't recognise? It goes in the W8 vendor registry or it gets cancelled.",
        ],
        done_means: "You can say the runway number out loud without opening a spreadsheet.",
      };
    case "Incident response":
      return {
        trigger: "Anything is down, breached, or publicly wrong. Anyone can declare — declaring is free.",
        steps: [
          `One person runs the incident${second ? ` (${founder})` : ""}, one talks to customers${second ? ` (${second})` : " (switch hats explicitly if you're solo)"} — never both at once.`,
          "Status update to affected customers within 2 hours, even if it's just \"we know, we're on it\".",
          "Fix the bleeding first, the root cause after.",
          "Within 48h: postmortem — what broke, what we changed, which SOP or test gets updated.",
          "Update the DR plan (Phase 4) if the incident exposed a hole in it.",
        ],
        done_means: "Service restored, customers told, postmortem written, one SOP improved.",
      };
    default:
      return {
        trigger: "Describe the event that starts this process.",
        steps: ["First step…", "Second step…", "What happens last…"],
        done_means: "The observable end state — if you can't observe it, it isn't done.",
      };
  }
}

function proposeSops(snap: CompanySnapshot): Sop[] {
  const motion = snap.gtm?.strategy?.motion || "";
  const hasCustomers = (snap.gtm?.accounts ?? []).some((a) => a.stage === "won");
  const hiring = (snap.people?.roles ?? []).length > 0;
  const name = snap.name || "the company";

  const rows: [string, string, boolean][] = [
    ["Lead handling & follow-up", "Your W7 motion is " + (motion || "not set") + " — every reply must get the same next step, or reply rates lie to you.", motion !== "plg"],
    ["Customer onboarding", "The first 14 days decide whether a pilot converts. Write the path once, run it every time.", true],
    ["Support & escalation", "At your size support IS the founders — a written severity ladder stops a bug report from eating a fundraise week.", hasCustomers],
    ["Invoicing & collections", "Revenue you haven't collected is a donation. When to invoice, when to chase, when to stop.", hasCustomers || motion === "outbound"],
    ["Deploy & rollback", "One checklist between you and breaking production on a Friday.", Boolean(snap.website)],
    ["New-hire onboarding", "W6 has open roles — day-one access, tools, and the first-week plan, written before they sign.", hiring],
    ["Weekly bookkeeping", "30 minutes, same day each week: categorize, reconcile, check runway. Prevents the year-end archaeology.", true],
    ["Incident response", `Something will go down. Who declares it, who talks to customers, where ${name} writes the postmortem.`, Boolean(snap.website)],
  ];
  return rows
    .filter(([, , inc]) => inc)
    .map(([title, why], i) => ({
      id: `sop-${i}`,
      title,
      why,
      status: "proposed",
      owner: snap.founders?.[0]?.name || "",
      runs: 0,
      last_run: "",
      ...sopContent(title, snap),
    }));
}

function sopDoc(s: Sop, snap: CompanySnapshot): string {
  return [
    `# SOP — ${s.title}`,
    "",
    `**Company:** ${snap.name} · **Owner:** ${s.owner || "unassigned"} · **Review:** quarterly` +
      (s.runs ? ` · **Runs:** ${s.runs} (last ${s.last_run})` : ""),
    "",
    "## When this runs",
    s.trigger,
    "",
    "## Steps",
    ...s.steps.map((st, i) => `${i + 1}. ${st}`),
    "",
    "## Done means",
    s.done_means,
    "",
    "_Drafted by StartupKit W8 from the Company Object — edited and run by the founder._",
  ].join("\n");
}

const VENDOR_CATEGORY: Record<string, string> = {
  crm: "Sales", analytics: "Data", email: "Comms", payments: "Finance",
  banking: "Finance", code: "Engineering", accounting: "Finance", captable: "Legal",
};

function seedVendors(snap: CompanySnapshot): Vendor[] {
  const seen = new Set<string>();
  const out: Vendor[] = [];
  const owner = snap.founders?.[0]?.name || "";
  for (const c of snap.gtm?.connections ?? []) {
    if (!c.provider || seen.has(c.provider.toLowerCase())) continue;
    seen.add(c.provider.toLowerCase());
    out.push({
      id: `v-${out.length}`, name: c.provider,
      category: VENDOR_CATEGORY[c.kind] ?? "Ops",
      cost: "", renewal: "", owner, access: owner,
      critical: c.kind === "payments" || c.kind === "crm",
      source: "W7 connection",
    });
  }
  for (const i of snap.integrations ?? []) {
    if (!i.provider || seen.has(i.provider.toLowerCase())) continue;
    seen.add(i.provider.toLowerCase());
    out.push({
      id: `v-${out.length}`, name: i.provider,
      category: VENDOR_CATEGORY[i.capability] ?? "Ops",
      cost: "", renewal: "", owner, access: owner,
      critical: i.capability === "banking",
      source: "integration",
    });
  }
  return out;
}

function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime() - Date.now();
  return Math.ceil(d / 864e5);
}

// The registry as the tools expect it — and as the offboarding checklist needs it.
function vendorsCsv(o: OpsState): string {
  const esc = (c: string) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);
  const rows = [
    ["vendor", "category", "cost_usd_per_month", "renewal_date", "owner", "access", "critical", "source"],
    ...o.vendors.map((v) => [v.name, v.category, v.cost, v.renewal, v.owner, v.access, v.critical ? "yes" : "no", v.source]),
  ];
  return rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
}

// Generated from the registry — when someone leaves, this is the same-day checklist the
// access-control policy promises. Every row traces to a vendor and its owner.
function offboardingDoc(snap: CompanySnapshot, o: OpsState): string {
  const people = [...new Set(o.vendors.flatMap((v) => v.access.split(",").map((x) => x.trim()).filter(Boolean)))];
  return [
    `# Offboarding Checklist — ${snap.name}`,
    "",
    "> Generated from the W8 vendor registry. Run it the same day someone leaves — the",
    "> access-control policy (Phase 5) says all access is revoked day-of, owner confirms in writing.",
    "",
    "## Per person: revoke everything below",
    ...(o.vendors.length
      ? o.vendors.map((v) =>
          `- [ ] **${v.name}** (${v.category}${v.critical ? " · CRITICAL" : ""}) — access today: ${v.access || "unknown — fix the registry"} · revoked by: ${v.owner || "unassigned"}`)
      : ["_The registry is empty — nothing to revoke, or nothing recorded. One of those is a problem._"]),
    "",
    "## Also",
    "- [ ] Email: revoke sessions, forward the mailbox, remove from groups",
    "- [ ] Payroll & contracts: end in W6 / W2 as applicable",
    "- [ ] Reassign their area in the Phase-1 ownership map",
    "- [ ] Reassign any SOPs they owned (Phase 2)",
    "",
    `_People with access recorded today: ${people.join(", ") || "none recorded"}._`,
    "",
    "_Generated by StartupKit W8._",
  ].join("\n");
}

function deriveRisks(snap: CompanySnapshot): Risk[] {
  const risks: Risk[] = [];
  const add = (
    r: Omit<Risk, "id" | "status" | "mitigation" | "severity"> & { mitigation?: string },
  ) =>
    risks.push({
      id: r.key, status: "open", mitigation: r.mitigation ?? "",
      severity: sevOf(r.likelihood, r.impact), ...r,
    });

  const founders = snap.founders ?? [];
  if (founders.length <= 1) {
    add({
      key: "key-person",
      title: "Key-person risk — everything runs through one head",
      category: "key-person", likelihood: 3, impact: 3,
      evidence: `${snap.name} has ${founders.length || 1} founder on record and a team of ${snap.team_size ?? 1}.`,
      mitigation: "Adopt 3 SOPs in Phase 2 so the company survives a two-week absence. W6 plans the first hire.",
      workflow: "W6",
    });
  }
  if (snap.formation_status !== "formed") {
    add({
      key: "not-formed",
      title: "Operating before the entity exists",
      category: "legal", likelihood: 2, impact: 3,
      evidence: `Formation status is '${snap.formation_status}'. Contracts and IP signed now may not belong to the company.`,
      mitigation: "Finish W1 before signing anything as the company.",
      workflow: "W1",
    });
  }
  const gtm = snap.gtm;
  if (gtm && gtm.accounts.length > 0 && !gtm.pricing.locked) {
    add({
      key: "pricing-unlocked",
      title: "Selling without a locked price",
      category: "revenue", likelihood: 2, impact: 2,
      evidence: `${gtm.accounts.length} accounts in the W7 pipeline, pricing still a draft.`,
      mitigation: "Lock it in W7's Pricing Lab — every negotiation from an unlocked price starts from zero.",
      workflow: "W7",
    });
  }
  const analyticsVerified = (gtm?.connections ?? []).some(
    (c) => c.kind === "analytics" && c.status === "verified",
  );
  if (snap.website && !analyticsVerified) {
    add({
      key: "no-analytics",
      title: "Flying blind — no verified tracking",
      category: "operational", likelihood: 2, impact: 2,
      evidence: "A site exists but analytics was never verified in W7 — decisions are being made on feelings.",
      mitigation: "Verify the install in W7 → Analytics & UTM.",
      workflow: "W7",
    });
  }
  const hasAccounting = (snap.integrations ?? []).some((i) => i.capability === "accounting");
  if (!hasAccounting) {
    add({
      key: "no-accounting",
      title: "No accounting system connected",
      category: "financial", likelihood: 2, impact: 2,
      evidence: "No accounting integration on record — runway is a guess until the books say otherwise.",
      mitigation: "Connect QuickBooks/Xero in W3 and run the weekly bookkeeping SOP.",
      workflow: "W3",
    });
  }
  if (snap.website) {
    add({
      key: "no-dr",
      title: "No disaster-recovery plan for the product",
      category: "technical", likelihood: 1, impact: 3,
      evidence: `${snap.website} is live. If the database is lost tonight, recovery time is currently 'unknown'.`,
      mitigation: "Adopt the DR plan in Phase 4 — it cross-checks W4's backup configuration.",
      workflow: "W4",
    });
  }
  add({
    key: "credentials",
    title: "Single point of failure in credentials",
    category: "operational", likelihood: 2, impact: 1,
    evidence: "Default assumption at this stage — most founders hold every password personally.",
    mitigation: "Adopt the access-control policy in Phase 5 and move shared secrets to a password manager.",
    workflow: "",
  });
  return risks;
}

// The register watches reality. Re-derive from live state and reconcile with the founder's edits:
//  - a derived risk whose cause is GONE from the state → status "resolved" (verified, not clicked)
//  - a resolved risk whose cause CAME BACK → reopened
//  - the founder's statuses, mitigations and L×I edits survive the re-scan
//  - custom risks (key "custom-…") are never touched by the scanner
function reconcileRisks(saved: Risk[], snap: CompanySnapshot): Risk[] {
  const fresh = deriveRisks(snap);
  const savedByKey = new Map(saved.map((r) => [r.key, r]));
  const out: Risk[] = fresh.map((f) => {
    const s = savedByKey.get(f.key);
    if (!s) return f; // newly detected
    return {
      ...f,
      status: s.status === "resolved" ? "open" : s.status, // cause is back → reopen
      mitigation: s.mitigation || f.mitigation,
      likelihood: s.likelihood, impact: s.impact, severity: sevOf(s.likelihood, s.impact),
    };
  });
  for (const s of saved) {
    if (s.key.startsWith("custom-")) out.push(s);
    else if (!fresh.some((f) => f.key === s.key)) {
      out.push(
        s.status === "resolved"
          ? s
          : { ...s, status: "resolved", evidence: `${s.evidence} — no longer detected in your current state.` },
      );
    }
  }
  return out;
}

function proposePolicies(snap: CompanySnapshot): Policy[] {
  void snap;
  const mk = (id: string, pname: string, summary: string, rules: string[]): Policy => ({
    id, name: pname, summary, rules, adopted: false, adopted_on: "", agreed_by: "",
  });
  return [
    mk("pol-sec", "Security basics", "Passwords, 2FA, devices — the floor every hire agrees to.", [
      "Password manager required; no shared passwords in chat or docs.",
      "2FA on email, banking, code, and the CRM — no exceptions.",
      "Device disk encryption on; auto-lock at 5 minutes.",
      "Lost device = report within 24 h, revoke sessions first, mourn later.",
    ]),
    mk("pol-access", "Access control", "Who can touch what, and what happens when someone leaves.", [
      "Least privilege: access granted per role, reviewed quarterly (the vendor registry is the checklist).",
      "Every tool has exactly one owner (see registry) who grants and revokes.",
      "Offboarding: all access revoked the same day, owner confirms in writing.",
    ]),
    mk("pol-data", "Data handling", "Customer data is a liability you hold, not an asset you own.", [
      "Collect only what the product needs; the W7 landing form fields are the whitelist.",
      "Customer data never leaves approved tools (the vendor registry is the list).",
      "Deletion requests honoured within 30 days, confirmed by email.",
    ]),
    mk("pol-spend", "Spending", "Nobody discovers a $400/mo subscription at year-end.", [
      "New recurring spend goes in the vendor registry BEFORE the card is charged.",
      "Over $500/mo needs the owner named in decision rights to sign off.",
      "Every vendor has a renewal date and an owner, or it gets cancelled at renewal.",
    ]),
    mk("pol-incident", "Incident response", "Who declares, who communicates, where it's written down.", [
      "Anyone can declare an incident. Declaring is free; hiding one is not.",
      "One person runs the incident, one person talks to customers — never the same person.",
      "Postmortem within 48 h: what broke, what we changed, which SOP gets updated.",
    ]),
    mk("pol-ops", "Ways of working", "The operating cadence, written down so it survives growth.", [
      "The meeting cadence in Phase 1 is the calendar; decline everything else by default.",
      "Decisions get one owner (decision-rights table) and a written record.",
      "If it happened twice, it becomes an SOP; if the SOP failed, fix the SOP not the person.",
    ]),
  ];
}

function policyDoc(p: Policy, snap: CompanySnapshot): string {
  return [
    `# ${p.name} — ${snap.name}`,
    "",
    p.adopted ? `**Adopted:** ${p.adopted_on} · **Agreed by:** ${p.agreed_by}` : "**Status:** draft — not yet adopted",
    "",
    ...p.rules.map((r) => `- ${r}`),
    "",
    "_Generated by StartupKit W8. Review yearly; version every change._",
  ].join("\n");
}

// The Phase-4 trick applied to governance: each policy is CHECKED against live state where the
// state can actually answer. Where it can't (2FA, disk encryption), we say so instead of faking a
// green tick — an unverifiable check shown as passing is how compliance theatre starts.
function policyCheck(
  p: Policy,
  o: OpsState,
  snap: CompanySnapshot,
): { state: "ok" | "warn" | "unknown"; note: string } {
  switch (p.id) {
    case "pol-access": {
      if (!o.vendors.length) return { state: "unknown", note: "The vendor registry is empty — nothing to check against yet." };
      const unowned = o.vendors.filter((v) => !v.owner).length;
      return unowned
        ? { state: "warn", note: `${unowned} tool${unowned === 1 ? "" : "s"} in the registry ha${unowned === 1 ? "s" : "ve"} no owner — the policy says every tool has exactly one.` }
        : { state: "ok", note: "Every tool in the registry has an owner — reality matches the policy." };
    }
    case "pol-spend": {
      if (!o.vendors.length) return { state: "unknown", note: "The vendor registry is empty — nothing to check against yet." };
      const incomplete = o.vendors.filter((v) => !v.cost || !v.renewal).length;
      return incomplete
        ? { state: "warn", note: `${incomplete} vendor${incomplete === 1 ? "" : "s"} missing a cost or renewal date — spend can't be governed if it isn't recorded.` }
        : { state: "ok", note: "Every vendor has a cost and renewal date on record." };
    }
    case "pol-data": {
      const fields = snap.gtm?.inputs?.capture_fields ?? [];
      if (!fields.length) return { state: "unknown", note: "No capture form recorded in W7 yet — the whitelist starts when the form does." };
      return fields.length > 3
        ? { state: "warn", note: `Your W7 landing form collects ${fields.length} fields — the policy says only what the product needs.` }
        : { state: "ok", note: `Landing form collects ${fields.length} field${fields.length === 1 ? "" : "s"} — matches the whitelist rule.` };
    }
    case "pol-incident": {
      const sop = o.sops.find((s) => s.title.toLowerCase().includes("incident"));
      if (!sop) return { state: "unknown", note: "No Incident-response SOP in Phase 2 — this policy has nothing to lean on yet." };
      return sop.status === "adopted"
        ? { state: "ok", note: `The Incident-response SOP is adopted (run ${sop.runs}×) — the policy has muscle behind it.` }
        : { state: "warn", note: "The Incident-response SOP isn't adopted yet (Phase 2) — a policy without its SOP is a wish." };
    }
    case "pol-ops": {
      const booked = o.cadences.length > 0 && o.cadences.every((c) => c.booked);
      const owned = o.decisions.length > 0;
      if (booked && owned) return { state: "ok", note: "The cadence is on the calendar and every decision has an owner (Phase 1)." };
      return { state: "warn", note: `${booked ? "" : "The cadence isn't fully booked (Phase 1)"}${!booked && !owned ? " and " : ""}${owned ? "" : "decision rights aren't set"} — the policy points at structure that doesn't exist yet.` };
    }
    default:
      return { state: "unknown", note: "We can't see your 2FA or disk encryption from here — this one is on your honour. We don't fake green ticks." };
  }
}

// ---------------- a real popup dialog — collect everything, then one Add ----------------
// Escape + backdrop-click close it; background scroll locks while it's open. Same contract as
// the document modal elsewhere in the app.
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-[#111827]">{title}</p>
          <button onClick={onClose} className="text-[#9AA3B0] hover:text-[#111827]" aria-label="Close">✕</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

// ---------------- docs (generated client-side, downloaded as .md) ----------------

function download(filename: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function opsManual(snap: CompanySnapshot, ops: OpsState): string {
  return [
    `# Operations Manual — ${snap.name}`,
    "",
    `**Stage:** ${snap.stage} · **Team:** ${snap.team_size} · **Generated:** ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Mission",
    ops.mission || snap.one_liner || "—",
    "",
    "## The stakes",
    ops.stakes || "—",
    "",
    "## This quarter's goals",
    ...(ops.goals.length
      ? ops.goals.map((g, i) => `${i + 1}. **${g.text}** — measured by: ${g.metric} (${g.code})`)
      : ["_none set_"]),
    "",
    "## Operating cadence",
    ...ops.cadences.map((c) => `- **${c.name}** — ${c.freq} at ${c.time}, ${c.mins} min, ${c.attendees}${c.booked ? " · ✓ on the calendar" : " · NOT booked yet"}. ${c.purpose}`),
    "",
    "## Ownership map",
    ...(ops.owners.length ? ops.owners.map((x) => `- **${x.area}** → ${x.owner || "unassigned"}`) : ["_not set_"]),
    "",
    "## Decision rights",
    ...ops.decisions.map((d) => `- **${d.decision}** → ${d.owner}. ${d.note}`),
    "",
    "## SOP library",
    ...(ops.sops.length
      ? ops.sops.map((s) => `- [${s.status}] ${s.title} — owner ${s.owner || "unassigned"}${s.runs ? ` · run ${s.runs}×` : ""}`)
      : ["_none yet_"]),
    "",
    "## Vendor registry",
    ...(ops.vendors.length
      ? ops.vendors.map((v) =>
          `- ${v.name} (${v.category}) — ${v.cost ? `$${v.cost}/mo` : "cost tbd"} — owner ${v.owner || "unassigned"}` +
          `${v.renewal ? ` — renews ${v.renewal}` : ""} — access: ${v.access || "—"}${v.critical ? " — CRITICAL" : ""}`)
      : ["_none yet_"]),
    "",
    "_Generated by StartupKit W8 from the Company Object._",
  ].join("\n");
}

function continuityPlan(snap: CompanySnapshot, ops: OpsState): string {
  const high = ops.risks.filter((r) => r.severity === "high");
  return [
    `# Business Continuity Plan — ${snap.name}`,
    "",
    "> Built from the risk register — it addresses the risks this company actually has, not a generic list.",
    "",
    "## Top risks and their playbooks",
    ...(ops.risks.length
      ? ops.risks.map((r) =>
          `### ${r.title} (${r.severity} · L${r.likelihood}×I${r.impact})\n- Evidence: ${r.evidence}\n- Response: ${r.mitigation || "_write the first step here_"}\n- Status: ${r.status}${r.status === "resolved" ? " (verified by re-scan)" : ""}`)
      : ["_Run ✦ Generate first — the register seeds this plan._"]),
    "",
    "## Emergency contacts",
    ...(snap.founders ?? []).map((f) => `- ${f.name} (${f.role}) — ${f.email}`),
    "- Registered agent — see W1 documents",
    "- Bank — see W3 · Counsel — see W2",
    "",
    high.length ? `**${high.length} high risk${high.length === 1 ? "" : "s"} open — this plan is not theoretical.**` : "",
    "",
    "_Generated by StartupKit W8._",
  ].join("\n");
}

function drPlan(snap: CompanySnapshot): string {
  return [
    `# Disaster Recovery Plan — ${snap.name}`,
    "",
    "## Objectives",
    "- **RPO (max data loss):** 24 hours — daily backups make this real; W4's backup configuration is the other half of this promise.",
    "- **RTO (max downtime):** 1 business day.",
    "",
    "## Recovery strategy",
    "1. Declare the incident (see Incident-response policy) — one runner, one communicator.",
    "2. Restore from the most recent backup (verified in W4).",
    "3. Status page / email to affected customers within 2 hours.",
    "4. Postmortem within 48 hours; update this plan and the SOPs it exposed.",
    "",
    "## Test it",
    "- Quarterly: restore one backup to staging and time it. An untested backup is a hope, not a plan.",
    "",
    "_Cross-validated with W4 Backup Configuration (PRD ripple W8-007 ↔ W4-011)._",
  ].join("\n");
}

// The ops state lives client-side for now — so the Operator's chat carries a compact, real
// summary of it in the message. The engine answers from BOTH the pipeline it already knows
// and the ops state we hand it. No invented numbers on either side.
function operatorContext(o: OpsState, snap: CompanySnapshot): string {
  const openRisks = o.risks.filter((r) => r.status === "open");
  const spend = o.vendors.reduce((s, v) => s + (Number(v.cost) || 0), 0);
  const renewals = o.vendors.filter((v) => (daysUntil(v.renewal) ?? 99) <= 30 && (daysUntil(v.renewal) ?? -1) >= 0);
  return [
    `Team: ${snap.team_size} (${(snap.founders ?? []).length} founders) · stage ${snap.stage}.`,
    `Cadence: ${o.cadences.filter((c) => c.booked).length}/${o.cadences.length} meetings on the calendar.`,
    `Quarter goals: ${o.goals.map((g) => `${g.text} (${g.metric})`).join("; ") || "none"}.`,
    `SOPs: ${o.sops.filter((s) => s.status === "adopted").length} adopted of ${o.sops.length}.`,
    `Vendors: ${o.vendors.length}, known spend $${spend}/mo${renewals.length ? `, renewing ≤30d: ${renewals.map((v) => v.name).join(", ")}` : ""}.`,
    `Risks open: ${openRisks.map((r) => `${r.title} (${r.severity})`).join("; ") || "none"}.`,
    `Policies adopted: ${o.policies.filter((p) => p.adopted).length}/${o.policies.length}.`,
    o.reviews.length ? `Last weekly review ${o.reviews[0].date}; priority: ${o.reviews[0].priority}.` : "No weekly review run yet.",
  ].join("\n");
}

// The investor-ready ops report — every number in it traces to a workflow or a registry.
function execReport(snap: CompanySnapshot, o: OpsState): string {
  const gtm = snap.gtm;
  const accounts = gtm?.accounts ?? [];
  const won = accounts.filter((a) => a.stage === "won").length;
  const tier = gtm?.pricing?.tiers?.[0];
  const mrr = won && tier ? won * (Number(String(tier.price).replace(/[^0-9.]/g, "")) || 0) : 0;
  const spend = o.vendors.reduce((s, v) => s + (Number(v.cost) || 0), 0);
  const openRisks = o.risks.filter((r) => r.status === "open");
  return [
    `# Operations Report — ${snap.name}`,
    "",
    `**Date:** ${new Date().toISOString().slice(0, 10)} · **Stage:** ${snap.stage} · **Team:** ${snap.team_size}`,
    "",
    "> Every number below traces to a workflow or a registry — nothing is estimated.",
    "",
    "## Revenue & pipeline (W7)",
    `- Accounts: ${accounts.length} · in demo/pilot: ${accounts.filter((a) => ["demo", "pilot"].includes(a.stage)).length} · won: ${won}`,
    `- MRR: ${mrr ? `$${mrr.toLocaleString()} (${won} won × $${tier?.price}/${tier?.unit || "mo"})` : "$0"}`,
    `- Pricing: ${gtm?.pricing?.locked ? "locked" : "draft"}`,
    "",
    "## This quarter's goals",
    ...(o.goals.length ? o.goals.map((g, i) => `${i + 1}. ${g.text} — measured by: ${g.metric} (${g.code})`) : ["_none set_"]),
    "",
    "## Operations",
    `- SOPs: ${o.sops.filter((s) => s.status === "adopted").length} adopted / ${o.sops.length} (adoption = actually run, not written)`,
    `- Policies: ${o.policies.filter((p) => p.adopted).length}/${o.policies.length} adopted with named agreement`,
    `- Cadence: ${o.cadences.filter((c) => c.booked).length}/${o.cadences.length} meetings on the calendar`,
    `- Tool spend (recorded): ${spend ? `$${spend.toLocaleString()}/mo ≈ $${(spend * 12).toLocaleString()}/yr` : "not yet recorded"} across ${o.vendors.length} vendors`,
    "",
    "## Risk register",
    ...(o.risks.length
      ? o.risks.map((r) => `- [${r.status}] ${r.title} (${r.severity} · L${r.likelihood}×I${r.impact})`)
      : ["_not generated yet_"]),
    openRisks.some((r) => r.severity === "high") ? "\n**Attention: HIGH risk(s) open — see mitigations in W8 Phase 4.**" : "",
    "",
    "## Weekly reviews (last 4)",
    ...(o.reviews.length
      ? o.reviews.slice(0, 4).map((r) => `- **${r.date}** — moved: ${r.wins || "—"} · next priority: ${r.priority || "—"}`)
      : ["_none run yet — the operator is only as alive as its cadence_"]),
    "",
    "_Generated by StartupKit W8 · AI Company Operator._",
  ].join("\n");
}

// ---------------- context ----------------

type W8Actions = {
  companyId: string;
  snap: CompanySnapshot;
  ops: OpsState;
  patch: (partial: Partial<OpsState>, note?: string) => void;
  generate: () => void;
  notify: (msg: string) => void;
  goWorkflow: (code: string) => void;
  busy: boolean;
};
const W8Context = createContext<W8Actions | null>(null);
function useW8(): W8Actions {
  const ctx = useContext(W8Context);
  if (!ctx) throw new Error("useW8 must be used within W8Workflow");
  return ctx;
}

// ---------------- task accounting (real, for the donut + phase strips) ----------------

type TaskCounts = { done: number; doing: number; todo: number };

function phaseTasks(n: number, o: OpsState): TaskCounts {
  const c: TaskCounts = { done: 0, doing: 0, todo: 0 };
  const bump = (state: "done" | "doing" | "todo") => c[state]++;
  if (n === 1) {
    bump(o.mission ? "done" : "todo");
    // A cadence isn't real until it's on the founder's calendar — generated text is "in progress".
    bump(!o.cadences.length ? "todo" : o.cadences.every((c) => c.booked) ? "done" : "doing");
    bump(o.decisions.length ? "done" : "todo");
    bump(o.owners.length && o.owners.every((x) => x.owner) ? "done" : "todo");
    bump(o.goals.length ? "done" : "todo");
  } else if (n === 2) {
    for (const s of o.sops) bump(s.status === "adopted" ? "done" : s.status === "drafted" ? "doing" : "todo");
    if (!o.sops.length) c.todo = 1;
  } else if (n === 3) {
    for (const v of o.vendors) bump(v.owner && v.cost ? "done" : v.owner || v.cost ? "doing" : "todo");
    if (!o.vendors.length) c.todo = 1;
  } else if (n === 4) {
    for (const r of o.risks) bump(r.status !== "open" ? "done" : r.mitigation ? "doing" : "todo");
    if (!o.risks.length) c.todo = 1;
  } else if (n === 5) {
    for (const p of o.policies) bump(p.adopted ? "done" : "todo");
    if (!o.policies.length) c.todo = 1;
  }
  return c;
}

function phaseDone(n: number, o: OpsState): boolean {
  // Phase 1 is done when the rhythm actually exists in the founder's calendar — not when text
  // was generated. This is the anti-"completes itself" gate.
  if (n === 1)
    return Boolean(o.mission) && o.cadences.length > 0 && o.cadences.every((c) => c.booked) &&
      o.decisions.length > 0 && o.goals.length > 0;
  if (n === 2) return o.sops.length > 0 && o.sops.filter((s) => s.status === "adopted").length >= 3;
  if (n === 3) return o.vendors.length > 0 && o.vendors.every((v) => v.owner);
  if (n === 4) return o.risks.length > 0 && o.risks.filter((r) => r.severity === "high").every((r) => r.status !== "open");
  if (n === 5) return o.policies.length > 0 && o.policies.filter((p) => p.adopted).length >= 3;
  return o.reviews.length > 0; // the Operator is "live" once the first weekly review has run
}

const PHASES: { n: number; name: string; sub: string; about: string; why: string }[] = [
  { n: 1, name: "Foundation Setup", sub: "Mission, cadence on the calendar, decision rights, ownership, quarter goals, initiatives.", about: "Define the operating model — then install it: the cadence isn't done until it's on your real calendar, and the quarter's goals are derived from your actual W3/W7/W8 state. Initiatives track the handful of company-level projects that matter — not a sprint board.", why: "Companies with a written operating cadence make decisions ~2x faster. A cadence that isn't booked is a paragraph — that's why this phase completes on the calendar click, not the text." },
  { n: 2, name: "SOPs & Processes", sub: "The processes that must survive you being away — drafted, edited, then RUN — plus a knowledge index.", about: "W8 drafts the actual steps from your company's shape (your CRM, your payment link, your severity ladder). You edit them until they're true, then run the SOP as a checklist — the first completed run is what adopts it. The Knowledge Index tracks what documentation exists and where — Notion/Confluence hold the content, this flags what's gone stale.", why: "Well-documented processes cut onboarding time by ~60% — and a run counter beats a promise. Scribe documents what you already do; W8 drafts what you're missing." },
  { n: 3, name: "Vendors, Tools & Assets", sub: "Every tool: cost, owner, renewal countdown, who has access — plus owned assets and automations.", about: "The vendor registry seeds itself from W3/W7. You fill cost + renewal + access — and the access column generates the offboarding checklist your access-control policy promises. Assets track discrete owned/licensed items (laptops, per-seat licenses); the Automation Layer registers what automations exist and who owns them, without executing anything itself.", why: "Unowned tools are how spend and access leak. Vendr sells this discipline for $36k/yr; yours fits on one screen — and it knows who to lock out on someone's last day." },
  { n: 4, name: "Risk & Continuity", sub: "Derived from your state — and re-verified against it.", about: "Each risk is derived from your actual company state, plotted on likelihood × impact. Fix the cause in its workflow and the re-scan resolves it for you — 'resolved' is never a click. The continuity plan writes itself from this register.", why: "A risk register you act on is the difference between a bad week and a dead company — and one that watches reality never goes stale." },
  { n: 5, name: "Policies & Governance", sub: "Editable rules, a recorded adoption, and live checks against your state.", about: "Edit each policy's rules until your team can live by them, adopt with names and a date, and watch the live check — every policy is verified against your actual registries where the state can answer, and says 'on your honour' where it can't.", why: "An adoption record with names and dates is what a SOC 2 auditor asks for first — and a policy reality violates is flagged, not framed." },
  { n: 6, name: "AI Company Operator", sub: "Your command center — live tiles, the weekly review, the exec report.", about: "Live numbers from W1–W8, a weekly review generated from this week's actual state (run it here, it's remembered here), an ask box grounded in your pipeline AND your ops registries, and an investor-ready report on one click.", why: "No competitor can build this screen — they don't have eight workflows writing to one Company Object. The Operator goes ✓ when the first weekly review runs, because a cockpit nobody sits in is a poster." },
];

// ============================================================================================
export function W8Workflow({
  companyId,
  snapshot,
  view,
}: {
  companyId: string;
  snapshot: CompanySnapshot;
  view: WorkflowView;
}) {
  const [ops, setOps] = useState<OpsState>(() => ({ ...EMPTY_OPS, ...(snapshot.ops ?? {}) }));
  const [phase, setPhase] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [catPhases, setCatPhases] = useState<Set<number>>(new Set(view.completed_phases ?? []));

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  // UI phases → the 3 catalog phases (1: foundation · 2: SOPs · 3: vendors+risks+policies).
  const syncCatalog = useCallback(
    (o: OpsState) => {
      const gates: [number, boolean][] = [
        [1, phaseDone(1, o)],
        [2, phaseDone(2, o)],
        [3, phaseDone(3, o) && phaseDone(4, o) && phaseDone(5, o)],
      ];
      for (const [n, ok] of gates) {
        if (ok && !catPhases.has(n)) {
          completePhase(companyId, "W8", n)
            .then(() => setCatPhases((p) => new Set([...p, n])))
            .catch(() => {});
        }
      }
    },
    [companyId, catPhases],
  );

  const persist = useCallback(
    async (next: OpsState, note?: string) => {
      setOps(next);
      setBusy(true);
      try {
        const snap = await saveOps(companyId, next);
        const saved = snap.ops ? { ...EMPTY_OPS, ...snap.ops } : next;
        setOps(saved);
        syncCatalog(saved);
        if (note) notify(note);
      } catch {
        notify("Couldn't save — check your connection.");
      } finally {
        setBusy(false);
      }
    },
    [companyId, notify, syncCatalog],
  );

  const patch = useCallback(
    (partial: Partial<OpsState>, note?: string) => {
      persist({ ...ops, ...partial }, note);
    },
    [ops, persist],
  );

  // The register watches reality: once per visit, re-scan the derived risks against live state.
  // Fixed causes resolve themselves; returned causes reopen. Founder edits survive.
  const didRescan = useRef(false);
  useEffect(() => {
    if (!ops.generated || !ops.risks.length || didRescan.current) return;
    didRescan.current = true;
    const next = reconcileRisks(ops.risks, snapshot);
    if (JSON.stringify(next) !== JSON.stringify(ops.risks)) {
      persist({ ...ops, risks: next }, "Risk register re-scanned against your live state ✓");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ops.generated, ops.risks, snapshot]);

  // ✦ Derive the whole operating system from the Company Object. Fills what's empty; never
  // overwrites what the founder edited.
  const generate = useCallback(() => {
    patch(
      {
        mission: ops.mission || snapshot.one_liner || "",
        stakes: ops.stakes || deriveStakes(snapshot),
        cadences: ops.cadences.length ? ops.cadences : deriveCadences(snapshot),
        decisions: ops.decisions.length ? ops.decisions : deriveDecisions(snapshot),
        owners: ops.owners.length ? ops.owners : deriveOwners(snapshot),
        goals: ops.goals.length ? ops.goals : deriveGoals(snapshot),
        sops: ops.sops.length ? ops.sops : proposeSops(snapshot),
        vendors: ops.vendors.length ? ops.vendors : seedVendors(snapshot),
        risks: ops.risks.length ? reconcileRisks(ops.risks, snapshot) : deriveRisks(snapshot),
        policies: ops.policies.length ? ops.policies : proposePolicies(snapshot),
        generated: true,
      },
      "Operating system drafted from your Company Object ✓",
    );
  }, [ops, snapshot, patch]);

  const goWorkflow = useCallback(
    (code: string) => {
      window.location.href = `/company/${companyId}/workflows/${code}`;
    },
    [companyId],
  );

  const actions: W8Actions = { companyId, snap: snapshot, ops, patch, generate, notify, goWorkflow, busy };

  return (
    <W8Context.Provider value={actions}>
      <div style={{ fontFamily: "Inter, sans-serif" }}>
        <HeaderCard />
        <PhaseStrip phase={phase} setPhase={setPhase} />
        <div className="mt-5">
          {phase === 6 ? <OperatorPhase /> : <TaskPhase n={phase} goOperator={() => setPhase(6)} />}
        </div>
        <details className="mt-8 border-t border-[#EEF0F3] pt-4">
          <summary className="cursor-pointer text-xs text-[#9AA3B0]">How W8 works, and what it deliberately doesn&apos;t do</summary>
          <div className="mt-2 grid gap-4 text-xs leading-relaxed text-[#6B7280] sm:grid-cols-2">
            <p>
              <b className="text-[#111827]">Every number on this screen traces to real company state.</b>{" "}
              The vendor registry seeds from your connections; risks are derived with evidence; the Operator&apos;s
              tiles read W3/W6/W7/W8 directly. Where a source isn&apos;t connected, the tile says so.
            </p>
            <p>
              <b className="text-[#111827]">Deliberately not built:</b> a kanban board (ClickUp&apos;s job) · automation
              *execution* or time-saved counters (Zapier&apos;s numbers, not ours — the Automation Layer here tracks
              what exists, it doesn&apos;t run it) · a wiki (Knowledge Index points at Notion/Confluence, it doesn&apos;t
              host content) · SSO/endpoint management (enterprise IT).
            </p>
          </div>
        </details>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-[#2A2F3C] bg-[#111827] px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[13px]" style={{ background: R }}>✓</span>
          {toast}
        </div>
      )}
    </W8Context.Provider>
  );
}

// ---------------- header card (mock: tile + meta chips + progress donut) ----------------

function HeaderCard() {
  const A = useW8();
  const o = A.ops;
  const totals = useMemo(() => {
    const t: TaskCounts = { done: 0, doing: 0, todo: 0 };
    for (let n = 1; n <= 5; n++) {
      const c = phaseTasks(n, o);
      t.done += c.done; t.doing += c.doing; t.todo += c.todo;
    }
    return t;
  }, [o]);
  const total = totals.done + totals.doing + totals.todo;
  const pct = total ? Math.round((totals.done / total) * 100) : 0;
  const deg = (x: number) => (total ? (x / total) * 360 : 0);

  return (
    <div className={`${card} p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white" style={{ background: R }}>
            W8
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">Operations &amp; Tooling</h1>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "#EAF7EF", color: "#1E7A3D" }}>
                {pct >= 100 ? "Complete" : o.generated ? "In Progress" : "Not Started"}
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm text-[#6B7280]">
              Run the company on systems, not memory — SOPs, vendors, risks, policies, and your AI Company Operator.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["🏁", `Stage: ${A.snap.stage}`],
                ["⏱", "Duration: Ongoing"],
                ["🔗", "Depends on: W1"],
                ["👥", `Team: ${A.snap.team_size}`],
              ].map(([icon, text]) => (
                <span key={text} className="rounded-lg border border-[#EBECE9] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#3A414D]">
                  {icon} {text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* progress donut — computed from real task states, never typed */}
        <div className="flex items-center gap-4">
          <div>
            <p className={label}>Overall Progress</p>
            <p className="mt-1 text-4xl font-extrabold leading-none" style={{ color: R }}>{pct}%</p>
            <p className="mt-1 font-mono text-[11px] text-[#9AA3B0]">{totals.done} / {total} tasks completed</p>
            <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-[#EEF0F3]">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: R }} />
            </div>
          </div>
          <div className="relative h-24 w-24 shrink-0">
            <div className="h-24 w-24 rounded-full"
              style={{ background: `conic-gradient(${GREEN} 0deg ${deg(totals.done)}deg, #F59E0B ${deg(totals.done)}deg ${deg(totals.done + totals.doing)}deg, #E5E9EF ${deg(totals.done + totals.doing)}deg 360deg)` }} />
            <div className="absolute inset-[10px] rounded-full bg-white" />
          </div>
          <div className="space-y-1.5 text-[11px]">
            {([["Completed", totals.done, GREEN], ["In Progress", totals.doing, "#F59E0B"], ["Not Started", totals.todo, "#C4CCD6"]] as [string, number, string][]).map(([l, v, c]) => (
              <p key={l} className="flex items-center gap-1.5 text-[#6B7280]">
                <span className="h-2 w-2 rounded-full" style={{ background: c }} /> {l} <b className="text-[#111827]">{v}</b>
              </p>
            ))}
          </div>
        </div>
      </div>

      {!o.generated && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4" style={{ borderColor: R, background: "#FEF7F2" }}>
          <p className="min-w-0 max-w-2xl text-xs leading-relaxed text-[#6B7280]">
            <b className="text-[#111827]">Start from a drafted operating system, not a blank template.</b>{" "}
            W8 reads your stage, team, motion, and connected tools — and drafts every phase for this company.
            A fractional COO charges $5–15k/mo for the same first month.
          </p>
          <button className={btnBlue} style={{ background: R }} onClick={A.generate}>
            ✦ Generate my operating system
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------- phase strip ----------------

function PhaseStrip({ phase, setPhase }: { phase: number; setPhase: (n: number) => void }) {
  const A = useW8();
  return (
    <div className={`${card} mt-4 flex items-stretch gap-1 overflow-x-auto p-2`}>
      {PHASES.map((p) => {
        const done = phaseDone(p.n, A.ops);
        const active = phase === p.n;
        return (
          <button key={p.n} onClick={() => setPhase(p.n)}
            className="flex min-w-[150px] flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left"
            style={active ? { background: "#FEF7F2", boxShadow: `inset 0 -2px 0 ${R}` } : undefined}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={done ? { background: "#EAF7EF", color: "#1E7A3D" } : active ? { background: R, color: "#fff" } : { background: "#F1F3F6", color: "#9AA3B0" }}>
              {done ? "✓" : p.n}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold" style={{ color: active ? R : done ? "#1E7A3D" : "#3A414D" }}>
                Phase {p.n}
              </span>
              <span className="block truncate text-[11px] text-[#6B7280]">{p.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- status chip + task row ----------------

function StatusChip({ state }: { state: "done" | "doing" | "todo" }) {
  const map = {
    done: { t: "✓ Completed", bg: "#EAF7EF", fg: "#1E7A3D" },
    doing: { t: "◌ In Progress", bg: "#EAF1FE", fg: BLUE },
    todo: { t: "○ Not Started", bg: "#F1F3F6", fg: "#6B7280" },
  }[state];
  return (
    <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: map.bg, color: map.fg }}>
      {map.t}
    </span>
  );
}

// ---------------- phases 1–5: the task table + right rail ----------------

function TaskPhase({ n, goOperator }: { n: number; goOperator: () => void }) {
  const A = useW8();
  const o = A.ops;
  const p = PHASES[n - 1];
  const counts = phaseTasks(n, o);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className={`${card} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#111827]">Phase {n}: {p.name}</h2>
              <p className="mt-0.5 text-sm text-[#6B7280]">{p.sub}</p>
            </div>
            {n === 3 && (
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => download(`${slugOf(A.snap)}-vendors.csv`, vendorsCsv(o))}>⇩ Registry .csv</button>
                <button className={btnGhost} onClick={() => download(`${slugOf(A.snap)}-offboarding-checklist.md`, offboardingDoc(A.snap, o))}>⇩ Offboarding checklist</button>
              </div>
            )}
            {n === 4 && (
              <div className="flex gap-2">
                <button className={btnBlue} style={{ background: BLUE }}
                  onClick={() => A.patch({ risks: reconcileRisks(o.risks, A.snap) }, "Re-scanned against your live state ✓")}>
                  ↻ Re-scan risks
                </button>
                <button className={btnGhost} onClick={() => download(`${slugOf(A.snap)}-business-continuity-plan.md`, continuityPlan(A.snap, o))}>⇩ Continuity plan</button>
                <button className={btnGhost} onClick={() => download(`${slugOf(A.snap)}-disaster-recovery-plan.md`, drPlan(A.snap))}>⇩ DR plan</button>
              </div>
            )}
          </div>

          {!o.generated ? (
            <div className="mt-5 rounded-xl border border-dashed border-[#EBECE9] p-8 text-center">
              <p className="text-sm font-bold text-[#111827]">Nothing here yet — and you don&apos;t have to write it</p>
              <p className="mx-auto mt-1 max-w-md text-xs text-[#6B7280]">W8 drafts this phase from your Company Object. You correct it, you never author it.</p>
              <button className={`${btnBlue} mt-4`} style={{ background: R }} onClick={A.generate}>✦ Generate my operating system</button>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-[#EBECE9]">
              <div className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-3 border-b border-[#EBECE9] bg-[#FAFBFA] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[#9AA3B0]">
                <span>Step</span><span>Task</span><span>Status</span><span className="pr-1">Action</span>
              </div>
              {n === 1 && <FoundationRows open={open} setOpen={setOpen} />}
              {n === 2 && <SopRows open={open} setOpen={setOpen} />}
              {n === 3 && <VendorRows open={open} setOpen={setOpen} />}
              {n === 4 && <RiskRows open={open} setOpen={setOpen} />}
              {n === 5 && <PolicyRows open={open} setOpen={setOpen} />}
            </div>
          )}

          {/* bottom counts strip, like the mock */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {([["Completed", counts.done, GREEN, "#EAF7EF"], ["In Progress", counts.doing, "#B45309", "#FEF3C7"], ["Not Started", counts.todo, "#6B7280", "#F1F3F6"]] as [string, number, string, string][]).map(([l, v, fg, bg]) => (
              <div key={l} className="flex items-center gap-2.5 rounded-xl border border-[#EBECE9] px-3 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: bg, color: fg }}>{v}</span>
                <span className="text-xs text-[#6B7280]">{l}</span>
              </div>
            ))}
          </div>
        </div>
        {o.generated && n === 1 && <InitiativesCard />}
        {o.generated && n === 2 && <KnowledgeCard />}
        {o.generated && n === 3 && (
          <>
            <AssetsCard />
            <AutomationsCard />
          </>
        )}
      </div>

      {/* right rail — about / why / deliverables / related, like the mock */}
      <aside className="space-y-4">
        <div className={`${card} p-5`}>
          <p className="text-sm font-bold text-[#111827]">About Phase {n}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#6B7280]">{p.about}</p>
          <div className="mt-3 rounded-xl p-3" style={{ background: "#F5F3FF" }}>
            <p className="text-[11px] font-bold" style={{ color: "#6D28D9" }}>✦ Why this matters</p>
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "#5B4B8A" }}>{p.why}</p>
          </div>
        </div>
        <Deliverables n={n} />
        <GuardrailsCard />
        <RelatedWorkflows goOperator={goOperator} />
      </aside>
    </div>
  );
}

function daysSince(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((Date.now() - d.getTime()) / 86400000);
}

// ---------------- Initiatives (Phase 1 addition) — company-level projects, not a sprint board ----
const INIT_STATUS: [string, string][] = [["planned", "Planned"], ["active", "Active"], ["done", "Done"], ["blocked", "Blocked"]];
function InitiativesCard() {
  const A = useW8();
  const items = A.ops.initiatives;
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", owner: "" });
  const update = (id: string, part: Partial<Initiative>, note?: string) =>
    A.patch({ initiatives: items.map((i) => (i.id === id ? { ...i, ...part } : i)) }, note);
  const add = () => {
    if (!draft.title.trim()) return A.notify("Name the initiative first");
    const id = `init-${Date.now()}`;
    A.patch(
      { initiatives: [...items, { id, title: draft.title.trim(), owner: draft.owner, target: "", status: "planned", note: "" }] },
      `${draft.title.trim()} added`,
    );
    setDraft({ title: "", owner: "" });
    setAdding(false);
  };
  const remove = (id: string) => A.patch({ initiatives: items.filter((i) => i.id !== id) }, "Removed");

  return (
    <div className={`${card} p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#111827]">Initiatives</h3>
          <p className="mt-0.5 text-xs text-[#6B7280]">The company-level projects that matter this quarter — not a sprint board. Deliberately no tickets, no swimlanes.</p>
        </div>
        <button className={btnGhost} onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ Add initiative"}</button>
      </div>
      {adding && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input className={`${input} flex-1`} placeholder="Initiative" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className={`${input} flex-1`} placeholder="Owner" value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
          <button className={btnBlue} style={{ background: BLUE }} onClick={add}>Add</button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#FAFBFA] p-4 text-center text-xs text-[#9AA3B0]">No initiatives tracked yet — add the handful of company-level bets that matter this quarter.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#EBECE9]">
          {items.map((it, i) => (
            <Row key={it.id} step={`I.${i + 1}`} title={it.title} desc={`${it.owner || "unassigned"}${it.target ? ` · due ${it.target}` : ""}`}
              state={it.status === "done" ? "done" : it.status === "active" ? "doing" : "todo"}
              open={open === it.id} onToggle={() => setOpen(open === it.id ? null : it.id)}
              action={
                <>
                  <select value={it.status} onChange={(e) => update(it.id, { status: e.target.value })} className="rounded-lg border border-[#EBECE9] px-2 py-1 text-[11px]">
                    {INIT_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <button className={btnGhost} onClick={() => setOpen(open === it.id ? null : it.id)}>{open === it.id ? "Close" : "Edit"}</button>
                </>
              }>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><p className={label}>Owner</p><input className={`${input} mt-1`} value={it.owner} onChange={(e) => update(it.id, { owner: e.target.value })} /></div>
                <div><p className={label}>Target date</p><input type="date" className={`${input} mt-1`} value={it.target} onChange={(e) => update(it.id, { target: e.target.value })} /></div>
              </div>
              <div className="mt-2"><p className={label}>Note</p><textarea className={`${input} mt-1`} rows={2} value={it.note} onChange={(e) => update(it.id, { note: e.target.value })} /></div>
              <button onClick={() => remove(it.id)} className="mt-2 text-[11px] text-[#9AA3B0] hover:text-[#DC2626]">Remove</button>
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Knowledge Index (Phase 2 addition) — a pointer registry, not a wiki -------------
function KnowledgeCard() {
  const A = useW8();
  const items = A.ops.knowledge;
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", category: "", location: "" });
  const update = (id: string, part: Partial<KnowledgeItem>, note?: string) =>
    A.patch({ knowledge: items.map((k) => (k.id === id ? { ...k, ...part } : k)) }, note);
  const add = () => {
    if (!draft.title.trim()) return A.notify("Title it first");
    const id = `kb-${Date.now()}`;
    A.patch(
      { knowledge: [...items, { id, title: draft.title.trim(), category: draft.category, owner: "", location: draft.location, last_reviewed: "" }] },
      `${draft.title.trim()} added`,
    );
    setDraft({ title: "", category: "", location: "" });
    setAdding(false);
  };
  const remove = (id: string) => A.patch({ knowledge: items.filter((k) => k.id !== id) }, "Removed");
  // seed one Knowledge Index entry per adopted SOP — the SOP library IS company knowledge
  const seedFromSops = () => {
    const known = new Set(items.map((k) => k.title));
    const fresh = A.ops.sops.filter((s) => s.status === "adopted" && !known.has(s.title))
      .map((s) => ({ id: `kb-sop-${s.id}`, title: s.title, category: "SOP", owner: s.owner, location: "W8 · SOPs & Processes", last_reviewed: s.last_run }));
    if (!fresh.length) return A.notify("No new adopted SOPs to add");
    A.patch({ knowledge: [...items, ...fresh] }, `${fresh.length} SOP${fresh.length === 1 ? "" : "s"} added from your library`);
  };

  return (
    <div className={`${card} p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#111827]">Knowledge Index</h3>
          <p className="mt-0.5 text-xs text-[#6B7280]">What documentation exists and where — not a wiki. Notion/Confluence hold the content; this tracks whether it&apos;s current.</p>
        </div>
        <div className="flex gap-2">
          <button className={btnGhost} onClick={seedFromSops}>↻ Add adopted SOPs</button>
          <button className={btnGhost} onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ Add doc"}</button>
        </div>
      </div>
      {adding && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input className={`${input} flex-1`} placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className={`${input} flex-1`} placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <input className={`${input} flex-1`} placeholder="Location — a link, or Notion/Confluence/..." value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          <button className={btnBlue} style={{ background: BLUE }} onClick={add}>Add</button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#FAFBFA] p-4 text-center text-xs text-[#9AA3B0]">Nothing indexed yet. Start with your adopted SOPs, then add anything a new hire would need to find.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#EBECE9]">
          {items.map((k, i) => {
            const stale = daysSince(k.last_reviewed);
            const isStale = stale !== null && stale >= 90;
            return (
              <Row key={k.id} step={`K.${i + 1}`} title={k.title} desc={`${k.category || "uncategorized"}${k.location ? ` · ${k.location}` : ""}`}
                state={k.last_reviewed ? (isStale ? "doing" : "done") : "todo"}
                open={open === k.id} onToggle={() => setOpen(open === k.id ? null : k.id)}
                action={
                  <>
                    {isStale && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#FEF3C7", color: "#92600E" }}>stale ({stale}d)</span>}
                    <button className={btnGhost} onClick={() => setOpen(open === k.id ? null : k.id)}>{open === k.id ? "Close" : "Edit"}</button>
                  </>
                }>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><p className={label}>Owner</p><input className={`${input} mt-1`} value={k.owner} onChange={(e) => update(k.id, { owner: e.target.value })} /></div>
                  <div><p className={label}>Location</p><input className={`${input} mt-1`} value={k.location} onChange={(e) => update(k.id, { location: e.target.value })} /></div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1"><p className={label}>Last reviewed</p><input type="date" className={`${input} mt-1`} value={k.last_reviewed} onChange={(e) => update(k.id, { last_reviewed: e.target.value })} /></div>
                  <button className={`${btnGhost} mt-4`} onClick={() => update(k.id, { last_reviewed: new Date().toISOString().slice(0, 10) })}>Mark reviewed today</button>
                </div>
                <button onClick={() => remove(k.id)} className="mt-2 text-[11px] text-[#9AA3B0] hover:text-[#DC2626]">Remove</button>
              </Row>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- Asset Management (Phase 3 addition) — owned/licensed items, not vendors --------
function AssetsCard() {
  const A = useW8();
  const items = A.ops.assets;
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", category: "", assignee: "" });
  const update = (id: string, part: Partial<Asset>, note?: string) =>
    A.patch({ assets: items.map((a) => (a.id === id ? { ...a, ...part } : a)) }, note);
  const add = () => {
    if (!draft.name.trim()) return A.notify("Name the asset first");
    const id = `asset-${Date.now()}`;
    A.patch(
      { assets: [...items, { id, name: draft.name.trim(), category: draft.category, assignee: draft.assignee, cost: "", purchased: "", status: "active" }] },
      `${draft.name.trim()} added`,
    );
    setDraft({ name: "", category: "", assignee: "" });
    setAdding(false);
  };
  const remove = (id: string) => A.patch({ assets: items.filter((a) => a.id !== id) }, "Removed");
  const activeValue = items.filter((a) => a.status === "active").reduce((s, a) => s + (Number(a.cost) || 0), 0);

  return (
    <div className={`${card} mt-4 p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#111827]">Assets <span className="font-normal text-[#9AA3B0]">— {items.length ? `$${activeValue.toLocaleString()} tracked` : "none yet"}</span></h3>
          <p className="mt-0.5 text-xs text-[#6B7280]">Discrete owned or licensed items assigned to a person — laptops, per-seat licenses, domains. Distinct from Vendors, which are recurring tool spend.</p>
        </div>
        <button className={btnGhost} onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ Add asset"}</button>
      </div>
      {adding && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input className={`${input} flex-1`} placeholder="Asset" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className={`${input} flex-1`} placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <input className={`${input} flex-1`} placeholder="Assigned to" value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} />
          <button className={btnBlue} style={{ background: BLUE }} onClick={add}>Add</button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#FAFBFA] p-4 text-center text-xs text-[#9AA3B0]">No assets tracked yet — start with laptops and per-seat software licenses.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#EBECE9]">
          {items.map((a, i) => (
            <Row key={a.id} step={`A.${i + 1}`} title={a.name} desc={`${a.category || "uncategorized"} · ${a.assignee || "unassigned"}${a.cost ? ` · $${a.cost}` : ""}${a.status === "retired" ? " · retired" : ""}`}
              state={a.status === "retired" ? "done" : a.assignee ? "done" : "todo"}
              open={open === a.id} onToggle={() => setOpen(open === a.id ? null : a.id)}
              action={<button className={btnGhost} onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? "Close" : "Edit"}</button>}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div><p className={label}>Assigned to</p><input className={`${input} mt-1`} value={a.assignee} onChange={(e) => update(a.id, { assignee: e.target.value })} /></div>
                <div><p className={label}>Cost</p><input className={`${input} mt-1`} placeholder="We never guess a price" value={a.cost} onChange={(e) => update(a.id, { cost: e.target.value.replace(/[^0-9.]/g, "") })} /></div>
                <div><p className={label}>Purchased</p><input type="date" className={`${input} mt-1`} value={a.purchased} onChange={(e) => update(a.id, { purchased: e.target.value })} /></div>
                <div>
                  <p className={label}>Status</p>
                  <select value={a.status} onChange={(e) => update(a.id, { status: e.target.value })} className={`${input} mt-1`}>
                    <option value="active">Active</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              <button onClick={() => remove(a.id)} className="mt-2 text-[11px] text-[#9AA3B0] hover:text-[#DC2626]">Remove</button>
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Automation Layer (Phase 3 addition) — a registry, not an execution engine ------
function AutomationsCard() {
  const A = useW8();
  const items = A.ops.automations;
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", trigger: "", action: "", tool: "" });
  const update = (id: string, part: Partial<Automation>, note?: string) =>
    A.patch({ automations: items.map((x) => (x.id === id ? { ...x, ...part } : x)) }, note);
  const add = () => {
    if (!draft.name.trim()) return A.notify("Name the automation first");
    const id = `auto-${Date.now()}`;
    A.patch(
      { automations: [...items, { id, name: draft.name.trim(), trigger: draft.trigger, action: draft.action, tool: draft.tool, owner: "", status: "active" }] },
      `${draft.name.trim()} added`,
    );
    setDraft({ name: "", trigger: "", action: "", tool: "" });
    setAdding(false);
  };
  const remove = (id: string) => A.patch({ automations: items.filter((x) => x.id !== id) }, "Removed");
  const broken = items.filter((x) => x.status === "broken").length;

  return (
    <div className={`${card} mt-4 p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#111827]">Automation Layer{broken > 0 && <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#FCF6F5", color: "#B4231F" }}>{broken} broken</span>}</h3>
          <p className="mt-0.5 text-xs text-[#6B7280]">What automations exist and who owns them — a registry, not an execution engine. We never run these or claim a &quot;time saved&quot; number.</p>
        </div>
        <button className={btnGhost} onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ Add automation"}</button>
      </div>
      {adding && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input className={input} placeholder="Name — e.g. New payment → Slack" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className={input} placeholder="Tool — e.g. Zapier" value={draft.tool} onChange={(e) => setDraft({ ...draft, tool: e.target.value })} />
          <input className={input} placeholder="Trigger" value={draft.trigger} onChange={(e) => setDraft({ ...draft, trigger: e.target.value })} />
          <input className={input} placeholder="Action" value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} />
          <button className={`${btnBlue} sm:col-span-2`} style={{ background: BLUE }} onClick={add}>Add</button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#FAFBFA] p-4 text-center text-xs text-[#9AA3B0]">No automations tracked yet — add the ones that would go unnoticed if they broke.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#EBECE9]">
          {items.map((x, i) => (
            <Row key={x.id} step={`M.${i + 1}`} title={x.name} desc={`${x.trigger || "trigger tbd"} → ${x.action || "action tbd"} · ${x.tool || "tool tbd"}`}
              state={x.status === "broken" ? "todo" : x.owner ? "done" : "doing"}
              open={open === x.id} onToggle={() => setOpen(open === x.id ? null : x.id)}
              action={<button className={btnGhost} onClick={() => setOpen(open === x.id ? null : x.id)}>{open === x.id ? "Close" : "Edit"}</button>}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div><p className={label}>Trigger</p><input className={`${input} mt-1`} value={x.trigger} onChange={(e) => update(x.id, { trigger: e.target.value })} /></div>
                <div><p className={label}>Action</p><input className={`${input} mt-1`} value={x.action} onChange={(e) => update(x.id, { action: e.target.value })} /></div>
                <div><p className={label}>Owner</p><input className={`${input} mt-1`} value={x.owner} onChange={(e) => update(x.id, { owner: e.target.value })} /></div>
                <div>
                  <p className={label}>Status</p>
                  <select value={x.status} onChange={(e) => update(x.id, { status: e.target.value })} className={`${input} mt-1`}>
                    <option value="active">Active</option>
                    <option value="broken">Broken</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              <button onClick={() => remove(x.id)} className="mt-2 text-[11px] text-[#9AA3B0] hover:text-[#DC2626]">Remove</button>
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}

function slugOf(snap: CompanySnapshot): string {
  return snap.name.toLowerCase().replace(/ /g, "-") || "company";
}

// ---------------- rows per phase ----------------

function Row({
  step, title, desc, state, action, open, onToggle, children,
}: {
  step: string; title: string; desc: string; state: "done" | "doing" | "todo";
  action: React.ReactNode; open: boolean; onToggle: () => void; children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#EEF0F3] last:border-b-0">
      <div className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="text-left font-mono text-xs font-bold text-[#9AA3B0]">{step}</button>
        <button onClick={onToggle} className="min-w-0 text-left">
          <p className="text-sm font-semibold text-[#111827]">{title}</p>
          <p className="truncate text-[11px] text-[#9AA3B0]">{desc}</p>
        </button>
        <StatusChip state={state} />
        <div className="flex justify-end gap-1.5 pr-1">{action}</div>
      </div>
      {open && children && <div className="border-t border-dashed border-[#EEF0F3] bg-[#FAFBFA] px-5 py-4">{children}</div>}
    </div>
  );
}

function FoundationRows({ open, setOpen }: { open: string | null; setOpen: (s: string | null) => void }) {
  const A = useW8();
  const o = A.ops;
  const setCadence = (i: number, part: Partial<Cadence>, note?: string) =>
    A.patch({ cadences: o.cadences.map((c, x) => (x === i ? { ...c, ...part } : c)) }, note);
  const setDecision = (i: number, part: Partial<DecisionRight>) =>
    A.patch({ decisions: o.decisions.map((d, x) => (x === i ? { ...d, ...part } : d)) });
  const setOwner = (i: number, owner: string) =>
    A.patch({ owners: o.owners.map((x, xi) => (xi === i ? { ...x, owner } : x)) });
  const setGoal = (i: number, part: Partial<QuarterGoal>) =>
    A.patch({ goals: o.goals.map((g, gi) => (gi === i ? { ...g, ...part } : g)) });

  const btn = (id: string, done: boolean) => (
    <button className={done ? btnGhost : btnBlue} style={done ? undefined : { background: BLUE }} onClick={() => setOpen(open === id ? null : id)}>
      {open === id ? "Close" : done ? "View" : "Start"}
    </button>
  );

  const booked = o.cadences.filter((c) => c.booked).length;
  const soloOwner = o.owners.length > 0 && new Set(o.owners.map((x) => x.owner)).size === 1;

  return (
    <>
      <Row step="1.1" title="Mission & stakes" desc={o.stakes || "Why this company exists — and who loses if it dies"}
        state={o.mission ? "done" : "todo"}
        action={btn("mission", Boolean(o.mission))} open={open === "mission"} onToggle={() => setOpen(open === "mission" ? null : "mission")}>
        <p className={label}>Mission — why this company exists</p>
        <textarea className={`${input} mt-1 min-h-[56px]`} value={o.mission} onChange={(e) => A.patch({ mission: e.target.value })}
          placeholder="Why this company exists, in one honest sentence." />
        <p className={`${label} mt-3`}>The stakes — if you die, who loses what?</p>
        <textarea className={`${input} mt-1 min-h-[56px]`} value={o.stakes} onChange={(e) => A.patch({ stakes: e.target.value })}
          placeholder="If we disappear tomorrow, who keeps living with which problem?" />
        <p className="mt-1.5 text-[11px] text-[#9AA3B0]">Seeded from your validated idea — the sharpest version of this line belongs in your W5 pitch too.</p>
      </Row>

      <Row step="1.2" title="Meeting cadence"
        desc={o.cadences.length ? `${booked}/${o.cadences.length} on your calendar — a cadence that isn't booked is a paragraph` : "The rhythms for your team size"}
        state={!o.cadences.length ? "todo" : o.cadences.every((c) => c.booked) ? "done" : "doing"}
        action={btn("cad", o.cadences.length > 0 && o.cadences.every((c) => c.booked))}
        open={open === "cad"} onToggle={() => setOpen(open === "cad" ? null : "cad")}>
        {/* ④ the week strip — one glance = the shape of your week */}
        <WeekStrip cadences={o.cadences} />
        <div className="mt-3 space-y-2">
          {o.cadences.map((c, i) => (
            <div key={i} className="rounded-lg border bg-white p-3" style={{ borderColor: c.booked ? "#BBE9CD" : "#EBECE9" }}>
              <div className="flex flex-wrap items-center gap-2">
                <input className={`${input} max-w-[170px] font-semibold`} value={c.name} onChange={(e) => setCadence(i, { name: e.target.value })} />
                {c.kind === "weekly" ? (
                  <select className={`${input} max-w-[90px]`} value={c.day} onChange={(e) => setCadence(i, { day: e.target.value, freq: `Weekly · ${e.target.value}` })}>
                    {(["MO", "TU", "WE", "TH", "FR"] as const).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <span className="rounded-lg bg-[#F1F3F6] px-2.5 py-2 text-xs text-[#6B7280]">{c.kind === "monthly" ? "1st of month" : "Quarterly"}</span>
                )}
                <input className={`${input} max-w-[80px]`} value={c.time} onChange={(e) => setCadence(i, { time: e.target.value })} />
                <input className={`${input} max-w-[70px]`} value={String(c.mins)} onChange={(e) => setCadence(i, { mins: Number(e.target.value.replace(/\D/g, "")) || 30 })} />
                <span className="text-[10px] text-[#9AA3B0]">min</span>
                <input className={`${input} max-w-[130px]`} value={c.attendees} onChange={(e) => setCadence(i, { attendees: e.target.value })} />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#6B7280]">{c.purpose}</p>
              {/* ① the 99/1 calendar handoff — we write the event, the founder clicks once */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button className={btnBlue} style={{ background: BLUE }}
                  onClick={() => window.open(gcalUrl(c, A.snap.name), "_blank", "noopener")}>
                  ⊕ Add to Google Calendar
                </button>
                <button className={btnGhost}
                  onClick={() => download(`${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`, icsFile(c, A.snap.name))}>
                  ⇩ .ics
                </button>
                {c.booked ? (
                  <span className="text-xs font-semibold" style={{ color: GREEN }}>✓ On your calendar</span>
                ) : (
                  <button className={btnGhost} onClick={() => setCadence(i, { booked: true }, "On the calendar — now it's real ✓")}>
                    It&apos;s on my calendar ✓
                  </button>
                )}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-[#9AA3B0]">
            It opens in <b>your</b> calendar, pre-written with the recurrence and agenda. You press Save — we never touch your calendar.
          </p>
        </div>
      </Row>

      <Row step="1.3" title="Decision rights" desc="One owner per decision — committees ship late"
        state={o.decisions.length ? "done" : "todo"} action={btn("dec", o.decisions.length > 0)}
        open={open === "dec"} onToggle={() => setOpen(open === "dec" ? null : "dec")}>
        <div className="space-y-2">
          {o.decisions.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#EBECE9] bg-white p-2.5">
              <p className="min-w-[170px] flex-1 text-xs font-semibold text-[#111827]">{d.decision}</p>
              <input className={`${input} max-w-[180px]`} value={d.owner} onChange={(e) => setDecision(i, { owner: e.target.value })} />
              <p className="w-full text-[11px] text-[#9AA3B0]">{d.note}</p>
            </div>
          ))}
        </div>
      </Row>

      {/* ② the ownership map — the PRD's Department Registry, and the key-person risk made visible */}
      <Row step="1.4" title="Ownership map"
        desc={soloOwner ? `All ${o.owners.length} areas run through one person — that's the key-person risk in Phase 4` : "Who owns each area of the company"}
        state={o.owners.length && o.owners.every((x) => x.owner) ? "done" : "todo"}
        action={btn("own", o.owners.length > 0 && o.owners.every((x) => x.owner))}
        open={open === "own"} onToggle={() => setOpen(open === "own" ? null : "own")}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {o.owners.map((x, i) => (
            <div key={x.area} className="rounded-lg border border-[#EBECE9] bg-white p-3">
              <p className={label}>{x.area}</p>
              <input className={`${input} mt-1`} value={x.owner} onChange={(e) => setOwner(i, e.target.value)} placeholder="Who owns this?" />
            </div>
          ))}
        </div>
        {soloOwner && (
          <p className="mt-2 rounded-lg p-3 text-[11px] leading-relaxed" style={{ background: "#FCF6F5", color: "#7A2E27" }}>
            <b>Every area runs through one head.</b> Normal at your stage — but it&apos;s why Phase 4 flags key-person risk
            as HIGH, and it&apos;s the first-hire signal W6 reads. When someone joins, hand them an area here.
          </p>
        )}
      </Row>

      {/* ③ this quarter's goals — derived from real cross-workflow state, never asked */}
      <Row step="1.5" title="This quarter's goals"
        desc={o.goals.length ? o.goals.map((g) => g.text).join(" · ") : "3 max, derived from your real state"}
        state={o.goals.length ? "done" : "todo"}
        action={btn("goals", o.goals.length > 0)}
        open={open === "goals"} onToggle={() => setOpen(open === "goals" ? null : "goals")}>
        <div className="space-y-2">
          {o.goals.map((g, i) => (
            <div key={i} className="rounded-lg border border-[#EBECE9] bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: R }}>{i + 1}</span>
                <input className={`${input} min-w-[200px] flex-1 font-semibold`} value={g.text} onChange={(e) => setGoal(i, { text: e.target.value })} />
                <button className="rounded-full border border-[#EBECE9] px-2.5 py-1 font-mono text-[10px] text-[#6B7280] hover:border-[#c9cfda]"
                  onClick={() => A.goWorkflow(g.code)}>
                  {g.code} →
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={label}>Measured by</span>
                <input className={`${input} max-w-[260px]`} value={g.metric} onChange={(e) => setGoal(i, { metric: e.target.value })} />
              </div>
            </div>
          ))}
          <p className="text-[11px] text-[#9AA3B0]">
            Three max — if everything is a priority, nothing is. Each goal was derived from your actual state
            (your W7 pipeline, your risk register, your missing connections), and each links to the workflow where it happens.
          </p>
        </div>
      </Row>
    </>
  );
}

// ④ the week strip — the cadence as the shape of a week, not a table. Monthly/quarterly ride below.
function WeekStrip({ cadences }: { cadences: Cadence[] }) {
  const days: [string, string][] = [["MO", "Mon"], ["TU", "Tue"], ["WE", "Wed"], ["TH", "Thu"], ["FR", "Fri"]];
  const slower = cadences.filter((c) => c.kind !== "weekly");
  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {days.map(([code, lbl]) => {
          const here = cadences.filter((c) => c.kind === "weekly" && c.day === code);
          return (
            <div key={code} className="min-h-[76px] rounded-lg border border-[#EBECE9] bg-white p-1.5">
              <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-[#9AA3B0]">{lbl}</p>
              <div className="mt-1 space-y-1">
                {here.map((c) => (
                  <div key={c.name} className="rounded-md px-1.5 py-1" style={{ background: c.booked ? "#EAF7EF" : "#FEF7F2" }}>
                    <p className="truncate text-[10px] font-bold" style={{ color: c.booked ? "#1E7A3D" : R }}>{c.name}</p>
                    <p className="text-[9px] text-[#9AA3B0]">{c.time} · {c.mins}m</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {slower.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {slower.map((c) => (
            <span key={c.name} className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: c.booked ? "#EAF7EF" : "#FEF7F2", color: c.booked ? "#1E7A3D" : R }}>
              {c.name} · {c.kind === "monthly" ? "1st of month" : "quarterly"} · {c.mins}m
            </span>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-[10px] text-[#9AA3B0]">Everything not on this strip gets declined by default — that&apos;s the point of it.</p>
    </div>
  );
}

function SopRows({ open, setOpen }: { open: string | null; setOpen: (s: string | null) => void }) {
  const A = useW8();
  const o = A.ops;
  const [newTitle, setNewTitle] = useState("");
  const update = (id: string, part: Partial<Sop>, note?: string) =>
    A.patch({ sops: o.sops.map((s) => (s.id === id ? { ...s, ...part } : s)) }, note);

  const addSop = () => {
    if (!newTitle.trim()) return;
    A.patch({
      sops: [...o.sops, {
        id: `sop-${Date.now()}`, title: newTitle.trim(),
        why: "Added by you — if it happened twice, it deserves an SOP.",
        status: "proposed", owner: A.snap.founders?.[0]?.name || "",
        runs: 0, last_run: "", ...sopContent(newTitle.trim(), A.snap),
      }],
    }, "SOP added ✓");
    setNewTitle("");
  };

  return (
    <>
      {o.sops.map((s, i) => {
        const state = s.status === "adopted" ? "done" : s.status === "drafted" ? "doing" : "todo";
        return (
          <Row key={s.id} step={`2.${i + 1}`} title={s.title}
            desc={s.runs ? `Run ${s.runs}× · last ${s.last_run} — ${s.why}` : s.why} state={state}
            open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)}
            action={
              s.status === "proposed" ? (
                <button className={btnBlue} style={{ background: BLUE }} onClick={() => setOpen(open === s.id ? null : s.id)}>
                  {open === s.id ? "Close" : "Review draft"}
                </button>
              ) : s.status === "drafted" ? (
                <button className={btnBlue} style={{ background: R }} onClick={() => setOpen(s.id)}>▶ Run it</button>
              ) : (
                <span className="self-center text-xs font-semibold" style={{ color: GREEN }}>In use · {s.runs}×</span>
              )
            }>
            <SopEditor sop={s} update={update} />
          </Row>
        );
      })}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <input className={`${input} min-w-[220px] flex-1`} placeholder='Add your own — "Refund handling", "Demo prep"…'
          value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSop()} />
        <button className={btnBlue} style={{ background: newTitle.trim() ? R : "#C4CCD6" }} disabled={!newTitle.trim()} onClick={addSop}>
          Add SOP
        </button>
        <p className="w-full text-[11px] text-[#9AA3B0]">
          Rule of thumb: if it happened twice, it becomes an SOP. W8 drafted the ones above from your company&apos;s shape.
        </p>
      </div>
    </>
  );
}

// The working core of Phase 2: W8 drafted the real steps; the founder edits them in place,
// then RUNS the SOP as a checklist. The first completed run is what marks it adopted —
// "adopted means it ran at least once", made literal.
function SopEditor({ sop, update }: { sop: Sop; update: (id: string, part: Partial<Sop>, note?: string) => void }) {
  const A = useW8();
  const [running, setRunning] = useState(false);
  const [ticked, setTicked] = useState<boolean[]>([]);

  const startRun = () => {
    setTicked(sop.steps.map(() => false));
    setRunning(true);
  };
  const finishRun = () => {
    const first = sop.runs === 0;
    update(sop.id, {
      runs: sop.runs + 1,
      last_run: new Date().toISOString().slice(0, 10),
      status: "adopted",
    }, first ? "First run complete — adopted ✓" : `Run ${sop.runs + 1} complete ✓`);
    setRunning(false);
  };
  const setStep = (i: number, text: string) =>
    update(sop.id, { steps: sop.steps.map((s, x) => (x === i ? text : s)) });

  const allTicked = ticked.length > 0 && ticked.every(Boolean);

  if (running) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[#111827]">▶ Running: {sop.title}</p>
          <button className="text-[11px] text-[#9AA3B0] hover:text-[#111827]" onClick={() => setRunning(false)}>abandon run</button>
        </div>
        <p className="mt-1 text-[11px] text-[#6B7280]">{sop.trigger}</p>
        <div className="mt-2 space-y-1.5">
          {sop.steps.map((st, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-white p-2.5"
              style={{ borderColor: ticked[i] ? "#BBE9CD" : "#EBECE9" }}>
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#16A34A]" checked={ticked[i] ?? false}
                onChange={() => setTicked((t) => t.map((v, x) => (x === i ? !v : v)))} />
              <span className="text-xs leading-relaxed" style={{ color: ticked[i] ? "#1E7A3D" : "#3A414D", textDecoration: ticked[i] ? "line-through" : "none" }}>
                {st}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className={btnBlue} style={{ background: allTicked ? GREEN : "#C4CCD6" }} disabled={!allTicked} onClick={finishRun}>
            ✓ Run complete{sop.runs === 0 ? " — adopt this SOP" : ""}
          </button>
          <span className="text-[11px] text-[#9AA3B0]">Done means: {sop.done_means}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={label}>When this runs</span>
        <input className={`${input} min-w-[260px] flex-1`} value={sop.trigger} onChange={(e) => update(sop.id, { trigger: e.target.value })} />
      </div>
      <p className={`${label} mt-3`}>Steps — drafted from your company; edit until they&apos;re true</p>
      <div className="mt-1.5 space-y-1.5">
        {sop.steps.map((st, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2 font-mono text-[10px] font-bold text-[#9AA3B0]">{i + 1}</span>
            <textarea className={`${input} min-h-[38px] flex-1 !py-1.5 text-xs`} value={st} onChange={(e) => setStep(i, e.target.value)} rows={1} />
            <button className="mt-1.5 text-[#C4CCD6] hover:text-[#B4231F]"
              onClick={() => update(sop.id, { steps: sop.steps.filter((_, x) => x !== i) })}>✕</button>
          </div>
        ))}
        <button className="text-[11px] font-semibold" style={{ color: BLUE }}
          onClick={() => update(sop.id, { steps: [...sop.steps, ""] })}>+ add step</button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={label}>Done means</span>
        <input className={`${input} min-w-[260px] flex-1`} value={sop.done_means} onChange={(e) => update(sop.id, { done_means: e.target.value })} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {sop.status === "proposed" && (
          <button className={btnBlue} style={{ background: BLUE }}
            onClick={() => update(sop.id, { status: "drafted" }, "Draft saved — now run it once ✓")}>
            These steps are true — save draft
          </button>
        )}
        <button className={btnBlue} style={{ background: R }} onClick={startRun}>▶ Run this SOP</button>
        <button className={btnGhost} onClick={() => download(`${slugOf(A.snap)}-sop-${sop.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`, sopDoc(sop, A.snap))}>
          ⇩ .md
        </button>
        <input className={`${input} max-w-[170px]`} placeholder="Owner" value={sop.owner} onChange={(e) => update(sop.id, { owner: e.target.value })} />
        {sop.runs > 0 && <span className="text-[11px] text-[#9AA3B0]">run {sop.runs}× · last {sop.last_run}</span>}
      </div>
      <p className="mt-2 text-[11px] text-[#9AA3B0]">
        Adoption isn&apos;t a button here — it&apos;s the first completed run. Tick every step once for real and it adopts itself.
      </p>
    </div>
  );
}

const CATEGORIES = ["Sales", "Finance", "Engineering", "Data", "Comms", "Legal", "Design", "Ops"];

function VendorRows({ open, setOpen }: { open: string | null; setOpen: (s: string | null) => void }) {
  const A = useW8();
  const o = A.ops;
  const [adding, setAdding] = useState(false);
  const update = (id: string, part: Partial<Vendor>, note?: string) =>
    A.patch({ vendors: o.vendors.map((v) => (v.id === id ? { ...v, ...part } : v)) }, note);

  // Spend, computed only from costs the founder typed — never inferred.
  const spend = o.vendors.reduce((s, v) => s + (Number(v.cost) || 0), 0);
  const priced = o.vendors.filter((v) => v.cost).length;
  const byCat = new Map<string, number>();
  for (const v of o.vendors) if (Number(v.cost)) byCat.set(v.category, (byCat.get(v.category) || 0) + Number(v.cost));
  const maxCat = Math.max(1, ...byCat.values());

  // Renewals, soonest first — the founder's negotiation calendar.
  const withRenewal = o.vendors.filter((v) => daysUntil(v.renewal) !== null).sort((a, b) => (daysUntil(a.renewal) ?? 0) - (daysUntil(b.renewal) ?? 0));

  const renewChip = (v: Vendor) => {
    const d = daysUntil(v.renewal);
    if (d === null) return null;
    const late = d < 0;
    const c = late || d <= 7 ? { bg: "#FCF6F5", fg: "#B4231F" } : d <= 30 ? { bg: "#FEF3C7", fg: "#92600E" } : { bg: "#F1F3F6", fg: "#6B7280" };
    return (
      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: c.bg, color: c.fg }}>
        {late ? `renewed ${-d}d ago?` : d === 0 ? "renews TODAY" : `renews in ${d}d`}
      </span>
    );
  };

  return (
    <>
      {/* the registry summary — spend + renewal calendar, all from typed data */}
      <div className="grid gap-3 border-b border-[#EEF0F3] bg-[#FAFBFA] px-4 py-3 sm:grid-cols-[auto_1fr_1fr]">
        <div>
          <p className={label}>Known spend</p>
          <p className="text-xl font-extrabold text-[#111827]">{spend ? `$${spend.toLocaleString()}` : "$—"}<span className="text-xs font-medium text-[#9AA3B0]">/mo</span></p>
          <p className="text-[10px] text-[#9AA3B0]">{spend ? `≈ $${(spend * 12).toLocaleString()}/yr · ` : ""}{priced}/{o.vendors.length} costs filled</p>
        </div>
        <div>
          <p className={label}>By category</p>
          <div className="mt-1 space-y-1">
            {byCat.size === 0 ? (
              <p className="text-[11px] text-[#9AA3B0]">Fill the costs and this draws itself.</p>
            ) : (
              [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="w-20 truncate text-[10px] text-[#6B7280]">{cat}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded bg-[#EEF0F3]">
                    <div className="h-full rounded" style={{ width: `${(amt / maxCat) * 100}%`, background: R, opacity: 0.8 }} />
                  </div>
                  <span className="w-14 text-right font-mono text-[10px] text-[#3A414D]">${amt.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <p className={label}>Next renewals</p>
          <div className="mt-1 space-y-1">
            {withRenewal.length === 0 ? (
              <p className="text-[11px] text-[#9AA3B0]">No renewal dates yet — the date is what stops auto-renew surprises.</p>
            ) : (
              withRenewal.slice(0, 3).map((v) => (
                <p key={v.id} className="flex items-center justify-between gap-2 text-[11px] text-[#3A414D]">
                  <span className="truncate">{v.name}</span>{renewChip(v)}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {o.vendors.map((v, i) => {
        const state = v.owner && v.cost ? "done" : v.owner || v.cost ? "doing" : "todo";
        return (
          <Row key={v.id} step={`3.${i + 1}`} title={v.name}
            desc={`${v.category} · ${v.source}${v.critical ? " · CRITICAL" : ""} · ${v.cost ? `$${v.cost}/mo` : "cost tbd"} · access: ${v.access || "—"}`}
            state={state} open={open === v.id} onToggle={() => setOpen(open === v.id ? null : v.id)}
            action={
              <>
                {renewChip(v)}
                <button className={state === "done" ? btnGhost : btnBlue} style={state === "done" ? undefined : { background: BLUE }}
                  onClick={() => setOpen(open === v.id ? null : v.id)}>
                  {open === v.id ? "Close" : state === "done" ? "Edit" : "Fill in details →"}
                </button>
              </>
            }>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className={label}>Cost $/mo</p>
                <input className={`${input} mt-1`} placeholder="We never guess a price" value={v.cost}
                  onChange={(e) => update(v.id, { cost: e.target.value.replace(/[^0-9.]/g, "") })} />
              </div>
              <div>
                <p className={label}>Renewal date</p>
                <input type="date" className={`${input} mt-1`} value={v.renewal} onChange={(e) => update(v.id, { renewal: e.target.value })} />
              </div>
              <div>
                <p className={label}>Owner — grants &amp; revokes</p>
                <input className={`${input} mt-1`} value={v.owner} onChange={(e) => update(v.id, { owner: e.target.value })} />
              </div>
              <div>
                <p className={label}>Category</p>
                <select className={`${input} mt-1`} value={v.category} onChange={(e) => update(v.id, { category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-2">
              <p className={label}>Who has access — comma-separated; this writes the offboarding checklist</p>
              <input className={`${input} mt-1`} placeholder="Zara, Sam…" value={v.access}
                onChange={(e) => update(v.id, { access: e.target.value })} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-[#3A414D]">
                <input type="checkbox" className="h-3.5 w-3.5 accent-[#B4231F]" checked={v.critical}
                  onChange={() => update(v.id, { critical: !v.critical }, v.critical ? "Un-marked critical" : "Marked critical — the company stops without it")} />
                Critical — the company stops without it
              </label>
              {v.critical && !v.renewal && (
                <span className="text-[11px] font-semibold" style={{ color: "#B4231F" }}>
                  Critical with no renewal date — that&apos;s a surprise waiting to bill you.
                </span>
              )}
              <button className="ml-auto text-[11px] text-[#9AA3B0] hover:text-[#B4231F]"
                onClick={() => A.patch({ vendors: o.vendors.filter((x) => x.id !== v.id) }, "Removed")}>
                remove vendor
              </button>
            </div>
          </Row>
        );
      })}

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button className={btnBlue} style={{ background: R }} onClick={() => setAdding(true)}>
          + Add a tool
        </button>
        <p className="text-[11px] text-[#9AA3B0]">
          Seeded from W3/W7 connections — Vendr sells this registry for $36k/yr at enterprise scale. The access column is
          what makes the offboarding checklist real.
        </p>
      </div>

      {adding && (
        <AddVendorModal
          founder={A.snap.founders?.[0]?.name || ""}
          onClose={() => setAdding(false)}
          onAdd={(v) => {
            A.patch({ vendors: [...o.vendors, v] }, "Vendor added ✓");
            setAdding(false);
          }}
        />
      )}
    </>
  );
}

// Everything up front, one confirm. Only the name is truly required — cost stays optional
// everywhere in this app because we never ask a founder to guess a price they don't know.
function AddVendorModal({
  founder,
  onClose,
  onAdd,
}: {
  founder: string;
  onClose: () => void;
  onAdd: (v: Vendor) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Ops");
  const [cost, setCost] = useState("");
  const [renewal, setRenewal] = useState("");
  const [owner, setOwner] = useState(founder);
  const [access, setAccess] = useState(founder);
  const [critical, setCritical] = useState(false);

  const canAdd = name.trim().length > 0;
  const submit = () => {
    if (!canAdd) return;
    onAdd({
      id: `v-${Date.now()}`, name: name.trim(), category,
      cost: cost.replace(/[^0-9.]/g, ""), renewal, owner: owner.trim(), access: access.trim(),
      critical, source: "you added it",
    });
  };

  return (
    <Modal title="Add a tool" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <p className={label}>Tool name *</p>
          <input className={`${input} mt-1`} autoFocus placeholder="Figma, AWS, Notion…" value={name}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={label}>Cost $/mo</p>
            <input className={`${input} mt-1`} placeholder="Leave blank if unsure" value={cost}
              onChange={(e) => setCost(e.target.value.replace(/[^0-9.]/g, ""))} />
          </div>
          <div>
            <p className={label}>Category</p>
            <select className={`${input} mt-1`} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={label}>Renewal date</p>
            <input type="date" className={`${input} mt-1`} value={renewal} onChange={(e) => setRenewal(e.target.value)} />
          </div>
          <div>
            <p className={label}>Owner — grants &amp; revokes</p>
            <input className={`${input} mt-1`} value={owner} onChange={(e) => setOwner(e.target.value)} />
          </div>
        </div>
        <div>
          <p className={label}>Who has access — comma-separated; writes the offboarding checklist</p>
          <input className={`${input} mt-1`} placeholder="Zara, Sam…" value={access} onChange={(e) => setAccess(e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-[#3A414D]">
          <input type="checkbox" className="h-3.5 w-3.5 accent-[#B4231F]" checked={critical} onChange={() => setCritical((c) => !c)} />
          Critical — the company stops without it
        </label>
        <div className="flex items-center justify-end gap-2 border-t border-[#EEF0F3] pt-3">
          <button className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnBlue} style={{ background: canAdd ? R : "#C4CCD6" }} disabled={!canAdd} onClick={submit}>
            Add vendor
          </button>
        </div>
        <p className="text-[11px] text-[#9AA3B0]">* Only the name is required — we never ask you to guess a price or a date you don&apos;t know.</p>
      </div>
    </Modal>
  );
}

const SEV_STYLE: Record<string, { c: string; b: string }> = {
  high: { c: "#B4231F", b: "#FCF6F5" }, medium: { c: "#92600E", b: "#FEF3C7" }, low: { c: "#6B7280", b: "#F1F3F6" },
};

// The heat map — open risks plotted on likelihood × impact. The classic 3×3, drawn from the
// register instead of a workshop whiteboard.
function RiskMatrix({ risks }: { risks: Risk[] }) {
  const openRisks = risks.filter((r) => r.status === "open");
  const cellBg = (l: number, i: number) => {
    const s = sevOf(l, i);
    return s === "high" ? "#FCECEA" : s === "medium" ? "#FDF6E3" : "#EFF6F0";
  };
  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between py-4 text-[9px] font-semibold uppercase tracking-wide text-[#9AA3B0]">
        <span>High</span><span className="-rotate-90 whitespace-nowrap">Likelihood</span><span>Low</span>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-3 gap-1">
          {[3, 2, 1].map((l) =>
            [1, 2, 3].map((i) => {
              const here = openRisks.filter((r) => r.likelihood === l && r.impact === i);
              return (
                <div key={`${l}${i}`} className="min-h-[46px] rounded-lg p-1.5" style={{ background: cellBg(l, i) }}>
                  {here.slice(0, 2).map((r) => (
                    <p key={r.key} className="truncate text-[9px] font-semibold" style={{ color: SEV_STYLE[sevOf(l, i)].c }}>
                      • {r.title.split(" — ")[0]}
                    </p>
                  ))}
                  {here.length > 2 && <p className="text-[9px] text-[#9AA3B0]">+{here.length - 2} more</p>}
                </div>
              );
            }),
          )}
        </div>
        <p className="mt-1 text-center text-[9px] font-semibold uppercase tracking-wide text-[#9AA3B0]">Impact →</p>
      </div>
    </div>
  );
}

function RiskRows({ open, setOpen }: { open: string | null; setOpen: (s: string | null) => void }) {
  const A = useW8();
  const o = A.ops;
  const [newTitle, setNewTitle] = useState("");
  const update = (id: string, part: Partial<Risk>, note?: string) =>
    A.patch({ risks: o.risks.map((r) => (r.id === id ? { ...r, ...part } : r)) }, note);
  const setLI = (r: Risk, l: number, i: number) =>
    update(r.id, { likelihood: l, impact: i, severity: sevOf(l, i) });

  const addRisk = () => {
    if (!newTitle.trim()) return;
    A.patch({
      risks: [...o.risks, {
        id: `custom-${Date.now()}`, key: `custom-${Date.now()}`, title: newTitle.trim(),
        category: "operational", likelihood: 2, impact: 2, severity: sevOf(2, 2),
        evidence: "Added by you — you know something the data doesn't show yet.",
        mitigation: "", status: "open", workflow: "",
      }],
    }, "Risk added ✓");
    setNewTitle("");
  };

  const adoptedSops = o.sops.filter((s) => s.status === "adopted").length;
  const openCount = o.risks.filter((r) => r.status === "open").length;

  return (
    <>
      {/* summary: the heat map + the honest counts */}
      <div className="grid gap-4 border-b border-[#EEF0F3] bg-[#FAFBFA] px-4 py-3 sm:grid-cols-[1fr_auto]">
        <RiskMatrix risks={o.risks} />
        <div className="flex flex-col justify-center gap-1 text-[11px] text-[#6B7280]">
          <p><b className="text-lg text-[#111827]">{openCount}</b> open</p>
          <p><b className="text-[#111827]">{o.risks.filter((r) => r.status === "mitigated").length}</b> mitigated · <b className="text-[#111827]">{o.risks.filter((r) => r.status === "accepted").length}</b> accepted</p>
          <p><b style={{ color: GREEN }}>{o.risks.filter((r) => r.status === "resolved").length}</b> resolved by your state</p>
          <p className="mt-1 max-w-[180px] text-[10px] text-[#9AA3B0]">Resolved is never a click — the re-scan verified the cause is gone.</p>
        </div>
      </div>

      {o.risks.map((r, i) => (
        <Row key={r.key} step={`4.${i + 1}`}
          title={r.title}
          desc={`${r.severity.toUpperCase()} · L${r.likelihood}×I${r.impact} · ${r.category} — ${r.evidence}`}
          state={r.status !== "open" ? "done" : r.mitigation ? "doing" : "todo"}
          open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)}
          action={
            r.status === "open" ? (
              <button className={btnBlue} style={{ background: BLUE }} onClick={() => setOpen(open === r.id ? null : r.id)}>Handle</button>
            ) : r.status === "resolved" ? (
              <span className="self-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "#EAF7EF", color: "#1E7A3D" }}>
                ✓ resolved by your state
              </span>
            ) : (
              <span className="self-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize" style={{ background: "#EAF7EF", color: "#1E7A3D" }}>{r.status}</span>
            )
          }>
          <div className="space-y-2">
            <p className="text-xs text-[#6B7280]">
              <span className="mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ background: SEV_STYLE[r.severity]?.b, color: SEV_STYLE[r.severity]?.c }}>{r.severity}</span>
              <b className="text-[#3A414D]">Why we flagged it:</b> {r.evidence}
            </p>

            {/* L×I pickers — severity is computed, never typed */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={label}>Likelihood</span>
              {[1, 2, 3].map((l) => (
                <button key={l} className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={r.likelihood === l ? { background: INK, color: "#fff" } : { background: "#F1F3F6", color: "#6B7280" }}
                  onClick={() => setLI(r, l, r.impact)}>{["Low", "Med", "High"][l - 1]}</button>
              ))}
              <span className={label}>Impact</span>
              {[1, 2, 3].map((im) => (
                <button key={im} className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={r.impact === im ? { background: INK, color: "#fff" } : { background: "#F1F3F6", color: "#6B7280" }}
                  onClick={() => setLI(r, r.likelihood, im)}>{["Low", "Med", "High"][im - 1]}</button>
              ))}
              <span className="text-[11px] text-[#9AA3B0]">→ severity: <b style={{ color: SEV_STYLE[r.severity]?.c }}>{r.severity}</b></span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={label}>Mitigation</span>
              <input className={`${input} min-w-[260px] flex-1`} value={r.mitigation}
                onChange={(e) => update(r.id, { mitigation: e.target.value })} placeholder="The first concrete step" />
            </div>

            {/* evidence-backed mitigation for the key-person risk — a meter, not a promise */}
            {r.key === "key-person" && (
              <p className="rounded-lg p-2.5 text-[11px]" style={{ background: adoptedSops >= 3 ? "#EAF7EF" : "#FDFAF1", color: adoptedSops >= 3 ? "#1E7A3D" : "#92600E" }}>
                Mitigation progress from Phase 2: <b>{adoptedSops}/3 SOPs adopted</b>
                {adoptedSops >= 3
                  ? " — the evidence supports marking this mitigated."
                  : " — the company can't survive your absence until the processes exist outside your head."}
              </p>
            )}

            {r.status !== "resolved" && (
              <div className="flex flex-wrap items-center gap-2">
                {(["open", "mitigated", "accepted"] as const).map((st) => (
                  <button key={st} className="rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize"
                    style={r.status === st
                      ? { background: st === "open" ? "#B4231F" : st === "mitigated" ? GREEN : INK, color: "#fff" }
                      : { background: "#F1F3F6", color: "#6B7280" }}
                    onClick={() => update(r.id, { status: st }, st === "mitigated" ? "Mitigated ✓" : st === "accepted" ? "Accepted — a decision, recorded" : undefined)}>
                    {st}
                  </button>
                ))}
                {r.workflow && (
                  <button className="text-[11px] font-semibold" style={{ color: R }} onClick={() => A.goWorkflow(r.workflow)}>
                    Fix in {r.workflow} →
                  </button>
                )}
                <span className="text-[11px] text-[#9AA3B0]">— fix the cause in {r.workflow || "W8"} and the re-scan resolves this for you.</span>
              </div>
            )}
            {r.key.startsWith("custom-") && (
              <button className="text-[11px] text-[#9AA3B0] hover:text-[#B4231F]"
                onClick={() => A.patch({ risks: o.risks.filter((x) => x.id !== r.id) }, "Removed")}>
                remove risk
              </button>
            )}
          </div>
        </Row>
      ))}

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <input className={`${input} min-w-[220px] flex-1`} placeholder='Add a risk we can&apos;t see — "Cofounder visa expires in March"…'
          value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRisk()} />
        <button className={btnBlue} style={{ background: newTitle.trim() ? R : "#C4CCD6" }} disabled={!newTitle.trim()} onClick={addRisk}>
          Add risk
        </button>
        <p className="w-full text-[11px] text-[#9AA3B0]">
          Derived risks re-verify themselves against your live state — your added ones only close when you close them.
        </p>
      </div>
    </>
  );
}

const CHECK_STYLE = {
  ok: { bg: "#EAF7EF", fg: "#1E7A3D", icon: "✓" },
  warn: { bg: "#FDFAF1", fg: "#92600E", icon: "⚠" },
  unknown: { bg: "#F1F3F6", fg: "#6B7280", icon: "·" },
} as const;

function PolicyRows({ open, setOpen }: { open: string | null; setOpen: (s: string | null) => void }) {
  const A = useW8();
  const o = A.ops;
  const update = (id: string, part: Partial<Policy>, note?: string) =>
    A.patch({ policies: o.policies.map((p) => (p.id === id ? { ...p, ...part } : p)) }, note);

  return (
    <>
      {o.policies.map((p, i) => {
        const check = policyCheck(p, o, A.snap);
        const cs = CHECK_STYLE[check.state];
        return (
          <Row key={p.id} step={`5.${i + 1}`} title={p.name}
            desc={p.adopted ? `Adopted ${p.adopted_on} · agreed by ${p.agreed_by} — ${p.summary}` : p.summary}
            state={p.adopted ? "done" : "todo"}
            open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)}
            action={
              <>
                <span className="self-center rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: cs.bg, color: cs.fg }}>
                  {cs.icon} {check.state === "ok" ? "reality matches" : check.state === "warn" ? "violated now" : "can't verify"}
                </span>
                <button className={p.adopted ? btnGhost : btnBlue} style={p.adopted ? undefined : { background: BLUE }}
                  onClick={() => setOpen(open === p.id ? null : p.id)}>
                  {open === p.id ? "Close" : p.adopted ? "View" : "Review & adopt"}
                </button>
              </>
            }>
            <PolicyEditor policy={p} check={check} update={update} />
          </Row>
        );
      })}
    </>
  );
}

// Adoption is a team act, recorded: edit the rules until they're livable, see whether reality
// currently matches, then adopt with names and a date. Un-adopting is allowed — silence isn't.
function PolicyEditor({
  policy: p, check, update,
}: {
  policy: Policy;
  check: { state: "ok" | "warn" | "unknown"; note: string };
  update: (id: string, part: Partial<Policy>, note?: string) => void;
}) {
  const A = useW8();
  const [agreedBy, setAgreedBy] = useState(p.agreed_by || (A.snap.founders ?? []).map((f) => f.name).join(", "));
  const cs = CHECK_STYLE[check.state];

  return (
    <div>
      {/* the live check — the policy measured against the company, not against hope */}
      <p className="rounded-lg p-2.5 text-[11px] leading-relaxed" style={{ background: cs.bg, color: cs.fg }}>
        <b>{cs.icon} Live check:</b> {check.note}
      </p>

      <p className={`${label} mt-3`}>The rules — edit until your team can actually live by them</p>
      <div className="mt-1.5 space-y-1.5">
        {p.rules.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2 font-mono text-[10px] font-bold text-[#9AA3B0]">{i + 1}</span>
            <textarea className={`${input} min-h-[38px] flex-1 !py-1.5 text-xs`} value={r} rows={1}
              onChange={(e) => update(p.id, { rules: p.rules.map((x, xi) => (xi === i ? e.target.value : x)) })} />
            <button className="mt-1.5 text-[#C4CCD6] hover:text-[#B4231F]"
              onClick={() => update(p.id, { rules: p.rules.filter((_, xi) => xi !== i) })}>✕</button>
          </div>
        ))}
        <button className="text-[11px] font-semibold" style={{ color: BLUE }}
          onClick={() => update(p.id, { rules: [...p.rules, ""] })}>+ add rule</button>
      </div>

      <div className="mt-3 border-t border-dashed border-[#EBECE9] pt-3">
        {p.adopted ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "#EAF7EF", color: "#1E7A3D" }}>
              ✓ Adopted {p.adopted_on} · agreed by {p.agreed_by}
            </span>
            <button className={btnGhost} onClick={() => download(`${slugOf(A.snap)}-policy-${p.id.replace("pol-", "")}.md`, policyDoc(p, A.snap))}>⇩ .md</button>
            <button className="text-[11px] text-[#9AA3B0] hover:text-[#B4231F]"
              onClick={() => update(p.id, { adopted: false, adopted_on: "", agreed_by: "" }, "Un-adopted — honest beats stale")}>
              un-adopt
            </button>
            {check.state === "warn" && (
              <span className="w-full text-[11px]" style={{ color: "#92600E" }}>
                Adopted but currently violated — fix the state or change the rule; a policy nobody follows is worse than none.
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className={label}>Agreed by — say it in the weekly tactical, then put the names here</span>
            <div className="flex w-full flex-wrap gap-2">
              <input className={`${input} min-w-[220px] flex-1`} placeholder="Zara, Sam…" value={agreedBy}
                onChange={(e) => setAgreedBy(e.target.value)} />
              <button className={btnBlue} style={{ background: agreedBy.trim() ? R : "#C4CCD6" }} disabled={!agreedBy.trim()}
                onClick={() => update(p.id, {
                  adopted: true,
                  adopted_on: new Date().toISOString().slice(0, 10),
                  agreed_by: agreedBy.trim(),
                }, "Policy adopted — dated and named ✓")}>
                We agreed — adopt
              </button>
              <button className={btnGhost} onClick={() => download(`${slugOf(A.snap)}-policy-${p.id.replace("pol-", "")}.md`, policyDoc(p, A.snap))}>⇩ .md</button>
            </div>
            <p className="text-[11px] text-[#9AA3B0]">
              Adoption is recorded with names and a date — that record is exactly what a SOC 2 auditor asks for first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- deliverables rail ----------------

function Deliverables({ n }: { n: number }) {
  const A = useW8();
  const o = A.ops;
  const slug = slugOf(A.snap);
  const items: [string, boolean, (() => void) | null][] =
    n === 1
      ? [["Operating Model", phaseDone(1, o), () => download(`${slug}-operations-manual.md`, opsManual(A.snap, o))],
         ["Cadence on the calendar", o.cadences.length > 0 && o.cadences.every((c) => c.booked), null],
         ["Decision-rights matrix", o.decisions.length > 0, null],
         ["Ownership map", o.owners.length > 0 && o.owners.every((x) => x.owner), null],
         ["Quarter goals (3 max)", o.goals.length > 0, null],
         ["Initiatives tracked", o.initiatives.length > 0, null]]
      : n === 2
        ? [["SOP Library", o.sops.some((s) => s.status !== "proposed"), null],
           [`${o.sops.filter((s) => s.status === "adopted").length} adopted SOPs`, o.sops.some((s) => s.status === "adopted"), null],
           ["Knowledge Index", o.knowledge.length > 0, null]]
        : n === 3
          ? [["Vendor database (.csv)", o.vendors.length > 0, () => download(`${slug}-vendors.csv`, vendorsCsv(o))],
             ["Every tool owned", o.vendors.length > 0 && o.vendors.every((v) => v.owner), null],
             ["Known monthly spend", o.vendors.some((v) => v.cost), null],
             ["Renewal dates set", o.vendors.length > 0 && o.vendors.every((v) => v.renewal), null],
             ["Offboarding checklist", o.vendors.some((v) => v.access), () => download(`${slug}-offboarding-checklist.md`, offboardingDoc(A.snap, o))],
             ["Asset inventory", o.assets.length > 0, null],
             ["Automation registry", o.automations.length > 0, null]]
          : n === 4
            ? [["Risk register", o.risks.length > 0, null],
               ["Business Continuity Plan", o.risks.length > 0, () => download(`${slug}-business-continuity-plan.md`, continuityPlan(A.snap, o))],
               ["Disaster Recovery Plan", true, () => download(`${slug}-disaster-recovery-plan.md`, drPlan(A.snap))]]
            : [["Governance library", o.policies.filter((p) => p.adopted).length >= 3, null],
               ["SOC 2 evidence base", o.policies.length > 0 && o.policies.every((p) => p.adopted), null]];
  return (
    <div className={`${card} p-5`}>
      <p className="text-sm font-bold text-[#111827]">Key Deliverables</p>
      <div className="mt-2.5 space-y-1.5">
        {items.map(([name, ok, dl]) => (
          <div key={name} className="flex items-center gap-2 text-xs">
            <span style={{ color: ok ? GREEN : "#C4CCD6" }}>{ok ? "✓" : "○"}</span>
            <span className={ok ? "text-[#111827]" : "text-[#9AA3B0]"}>{name}</span>
            {dl && ok && (
              <button className="ml-auto text-[11px] font-semibold" style={{ color: R }} onClick={dl}>⇩ download</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- guardrails rail ----------------

function GuardrailsCard() {
  const A = useW8();
  const o = A.ops;
  const rails: { severity: string; text: string }[] = [];
  const highOpen = o.risks.filter((r) => r.severity === "high" && r.status === "open");
  if (highOpen.length)
    rails.push({ severity: "stop", text: `${highOpen.length} HIGH risk${highOpen.length === 1 ? "" : "s"} open — "${highOpen[0].title}". A register you don't act on is a diary.` });
  const unowned = o.vendors.filter((v) => !v.owner);
  if (unowned.length)
    rails.push({ severity: "warn", text: `${unowned.length} vendor${unowned.length === 1 ? " has" : "s have"} no owner — unowned tools are how spend and access leak.` });
  const soon = o.vendors.filter((v) => v.renewal && new Date(v.renewal).getTime() - Date.now() < 30 * 864e5 && new Date(v.renewal).getTime() > Date.now());
  if (soon.length)
    rails.push({ severity: "warn", text: `${soon.map((v) => v.name).join(", ")} renew${soon.length === 1 ? "s" : ""} within 30 days — renegotiate before it auto-renews.` });
  const critNoDate = o.vendors.filter((v) => v.critical && !v.renewal);
  if (critNoDate.length)
    rails.push({ severity: "warn", text: `${critNoDate.map((v) => v.name).join(", ")} ${critNoDate.length === 1 ? "is" : "are"} marked critical with no renewal date — a surprise waiting to bill you.` });
  if (o.sops.length > 0 && !o.sops.some((s) => s.status === "adopted"))
    rails.push({ severity: "warn", text: "SOPs drafted but none adopted — a document nobody follows is decoration." });
  // An adopted policy that reality currently violates is worse than no policy — it's theatre.
  const violated = o.policies.filter((p) => p.adopted && policyCheck(p, o, A.snap).state === "warn");
  if (violated.length)
    rails.push({
      severity: "warn",
      text: `${violated.map((p) => p.name).join(", ")} ${violated.length === 1 ? "is" : "are"} adopted but currently violated — fix the state or change the rule.`,
    });
  if (!rails.length) return null;
  return (
    <div className={`${card} p-4`} style={{ borderColor: rails.some((r) => r.severity === "stop") ? "#E2A6A0" : "#EAD9A8" }}>
      <p className="text-sm font-bold text-[#111827]">Your ops are telling you something</p>
      <div className="mt-2 space-y-2">
        {rails.map((r) => (
          <div key={r.text} className="rounded-lg border p-3"
            style={r.severity === "stop" ? { borderColor: "#E2A6A0", background: "#FCF6F5" } : { borderColor: "#EAD9A8", background: "#FDFAF1" }}>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
              style={{ background: r.severity === "stop" ? "#B4231F" : "#B98A0E" }}>
              {r.severity}
            </span>
            <p className="mt-1.5 text-xs leading-relaxed text-[#3A414D]">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- related workflows rail ----------------

function RelatedWorkflows({ goOperator }: { goOperator: () => void }) {
  const A = useW8();
  const s = A.snap;
  const rows: [string, string, boolean][] = [
    ["W3", "Financial Infrastructure", (s.integrations ?? []).some((i) => ["banking", "accounting", "payments"].includes(i.capability))],
    ["W4", "Technical Infrastructure", Boolean(s.website)],
    ["W6", "People & HR", (s.people?.roles ?? []).length > 0 || (s.people?.employees ?? []).length > 0],
    ["W7", "Go-To-Market", Boolean(s.gtm?.strategy?.motion)],
  ];
  return (
    <div className={`${card} p-5`}>
      <p className="text-sm font-bold text-[#111827]">Related Workflows</p>
      <div className="mt-2.5 space-y-1.5">
        {rows.map(([code, name, on]) => (
          <button key={code} onClick={() => A.goWorkflow(code)}
            className="flex w-full items-center gap-2 rounded-lg border border-[#EBECE9] px-3 py-2 text-left text-xs hover:border-[#c9cfda]">
            <span className="font-mono font-bold text-[#6B7280]">{code}</span>
            <span className="min-w-0 flex-1 truncate text-[#3A414D]">{name}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={on ? { background: "#EAF7EF", color: "#1E7A3D" } : { background: "#F1F3F6", color: "#9AA3B0" }}>
              {on ? "Connected" : "—"}
            </span>
          </button>
        ))}
        <button onClick={goOperator} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-white" style={{ background: INK }}>
          ✳ Open the AI Company Operator →
        </button>
      </div>
    </div>
  );
}

// ============================================================================================
// Phase 6 · AI Company Operator — the mock's best screen, with every tile traced to a workflow.
// ============================================================================================

function OperatorPhase() {
  const A = useW8();
  const o = A.ops;
  const s = A.snap;
  const [health, setHealth] = useState<HealthScore>();
  const [ask, setAsk] = useState("");
  const [reply, setReply] = useState("");
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    getHealth(A.companyId).then(setHealth).catch(() => {});
  }, [A.companyId]);

  // Every tile below traces to a workflow. No invented numbers, anywhere.
  const gtm = s.gtm;
  const won = (gtm?.accounts ?? []).filter((a) => a.stage === "won").length;
  const inPipe = (gtm?.accounts ?? []).filter((a) => ["demo", "pilot"].includes(a.stage)).length;
  const tier = gtm?.pricing?.tiers?.[0];
  const mrr = won && tier ? won * (Number(String(tier.price).replace(/[^0-9.]/g, "")) || 0) : 0;
  const openRisks = o.risks.filter((r) => r.status === "open");
  const highRisks = openRisks.filter((r) => r.severity === "high").length;
  const roles = (s.people?.roles ?? []).length;
  const hasAccounting = (s.integrations ?? []).some((i) => i.capability === "accounting");
  const renewals = o.vendors
    .filter((v) => v.renewal && new Date(v.renewal).getTime() > Date.now())
    .sort((a, b) => a.renewal.localeCompare(b.renewal));

  // Top priorities — derived, ranked, each traced to its source.
  const priorities: { text: string; sev: string; code: string }[] = [];
  for (const r of openRisks.filter((x) => x.severity === "high"))
    priorities.push({ text: r.title, sev: "High", code: r.workflow || "W8" });
  for (const v of renewals.filter((x) => new Date(x.renewal).getTime() - Date.now() < 30 * 864e5))
    priorities.push({ text: `${v.name} renews ${v.renewal} — renegotiate before it auto-renews`, sev: "High", code: "W3" });
  if (gtm && gtm.accounts.length && !gtm.pricing.locked)
    priorities.push({ text: "Pricing still unlocked while selling — lock it in the Pricing Lab", sev: "Medium", code: "W7" });
  const sopTodo = o.sops.filter((x) => x.status === "proposed").length;
  if (sopTodo) priorities.push({ text: `${sopTodo} proposed SOPs not yet written`, sev: "Medium", code: "W8" });
  const violatedPols = o.policies.filter((p) => p.adopted && policyCheck(p, o, s).state === "warn");
  for (const p of violatedPols)
    priorities.push({ text: `${p.name} is adopted but currently violated — fix the state or the rule`, sev: "Medium", code: "W8" });
  for (const r of openRisks.filter((x) => x.severity === "medium").slice(0, 2))
    priorities.push({ text: r.title, sev: "Medium", code: r.workflow || "W8" });
  if (!priorities.length) priorities.push({ text: "Nothing urgent — run the cadence and send the next 20 (W7)", sev: "Low", code: "W7" });

  // The daily brief — composed from real state, regenerated on every visit.
  const brief = [
    `${s.name} · ${new Date().toDateString()}.`,
    gtm?.accounts?.length
      ? `Pipeline: ${gtm.accounts.length} accounts — ${inPipe} in demo/pilot, ${won} won${mrr ? ` (≈$${mrr.toLocaleString()}/mo)` : ""}.`
      : "Pipeline: empty — W7 is where revenue starts.",
    openRisks.length
      ? `Risks: ${openRisks.length} open${highRisks ? `, ${highRisks} HIGH — handle those first` : ""}.`
      : "Risks: all handled or accepted.",
    sopTodo
      ? `Ops: ${sopTodo} SOPs waiting to be written; ${o.policies.filter((p) => p.adopted).length}/${o.policies.length || 6} policies adopted.`
      : "Ops: SOP library live.",
    o.goals.length ? `Q goal: ${o.goals[0].text} — ${o.goals[0].metric}.` : "",
    o.reviews.length ? `This week's priority (from your last review): ${o.reviews[0].priority}.` : "",
    (() => {
      const next = o.cadences.filter((c) => c.booked).map((c) => ({ c, d: nextOccurrence(c) }))
        .sort((a, b) => a.d.getTime() - b.d.getTime())[0];
      return next ? `Next on the calendar: ${next.c.name}, ${next.d.toDateString()} ${next.c.time}.` : "";
    })(),
    renewals.length ? `Next renewal: ${renewals[0].name} on ${renewals[0].renewal}.` : "",
  ].filter(Boolean).join(" ");

  const doAsk = async () => {
    const q = ask.trim();
    if (!q || thinking) return;
    setThinking(true);
    setReply("");
    try {
      // The engine already knows the pipeline; we hand it the ops state too, so "is my ops in
      // shape for a raise?" gets answered from BOTH — and still never from invented numbers.
      const r = await gtmChat(
        A.companyId,
        `[Asked from the W8 Company Operator]\n${q}\n\n[Live ops state — real, from the W8 registries]\n${operatorContext(o, s)}`,
        [],
      );
      setReply(r.reply);
    } catch {
      setReply("Couldn't reach the engine — is the API running?");
    } finally {
      setThinking(false);
    }
  };

  const tile = (label_: string, value: string, note: string, ok: boolean, code: string) => (
    <button key={label_} onClick={() => A.goWorkflow(code)} className={`${card} p-4 text-left hover:border-[#c9cfda]`}>
      <p className={label}>{label_}</p>
      <p className="mt-1 text-2xl font-extrabold" style={{ color: ok ? INK : "#9AA3B0" }}>{value}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-[#9AA3B0]">{note}</p>
    </button>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className={`${card} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-[#111827]">
                Phase 6: AI Company Operator <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: "#7C3AED" }}>Live data</span>
              </h2>
              <p className="mt-0.5 text-sm text-[#6B7280]">Every number below traces to a workflow — click a tile to open its source.</p>
            </div>
          </div>

          {/* command tiles — real sources only */}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {tile("MRR", mrr ? `$${mrr.toLocaleString()}` : won ? "set a price" : "$0",
              won ? `${won} won × ${tier ? `$${tier.price}/${tier.unit || "mo"}` : "no locked tier"} — from W7` : "no customers won yet — from W7", mrr > 0, "W7")}
            {tile("Pipeline", String(inPipe), "accounts in demo or pilot — from W7", inPipe > 0, "W7")}
            {tile("Runway", hasAccounting ? "see W3" : "—",
              hasAccounting ? "accounting connected — open W3 for the number" : "connect accounting in W3; we don't guess money", hasAccounting, "W3")}
            {tile("Health Score", health ? `${health.overall}` : "…", health ? `${health.status} — platform health, all 10 domains` : "loading from the Company Object", Boolean(health), "W8")}
            {tile("Open Risks", String(openRisks.length), highRisks ? `${highRisks} HIGH — from the register in Phase 4` : "from the W8 risk register", openRisks.length === 0, "W8")}
            {tile("Open Roles", String(roles), roles ? "planned in W6" : "no roles planned — from W6", roles > 0, "W6")}
          </div>

          {/* daily brief */}
          <div className="mt-4 rounded-xl p-4" style={{ background: "#171A21" }}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">Daily executive brief · composed from live state</p>
            <p className="mt-1.5 text-sm leading-relaxed text-white">{brief}</p>
          </div>

          {/* the operator's own act: the weekly review, run here, remembered here */}
          <WeeklyReview />

          {/* ask */}
          <div className="mt-4">
            <p className={label}>Ask your Company Operator</p>
            <div className="mt-1.5 flex gap-2">
              <input className={`${input} flex-1`} placeholder='"what should I fix first?" · "is my ops in shape for a raise?"'
                value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doAsk()} />
              <button className={btnBlue} style={{ background: ask.trim() && !thinking ? R : "#C4CCD6" }} disabled={!ask.trim() || thinking} onClick={doAsk}>
                {thinking ? "…" : "→"}
              </button>
            </div>
            {reply && (
              <p className="mt-2 rounded-lg bg-[#FAFBFA] p-3 text-xs leading-relaxed text-[#3A414D]">{reply}</p>
            )}
            <p className="mt-1.5 text-[10px] text-[#9AA3B0]">Grounded in your real pipeline and state — it will say &ldquo;the data doesn&apos;t show that&rdquo; rather than invent.</p>
          </div>
        </div>

        {/* integrations health — real connections, deep-link out */}
        <div className={`${card} p-5`}>
          <p className="text-sm font-bold text-[#111827]">
            Integrations health <span className="font-normal text-[#9AA3B0]">— the numbers we don&apos;t rebuild live in these tools</span>
          </p>
          <IntegrationsStrip />
        </div>
      </div>

      {/* rail: priorities + reviews + quick actions */}
      <aside className="space-y-4">
        <div className={`${card} p-5`}>
          <p className="text-sm font-bold text-[#111827]">Top priorities <span className="font-normal text-[#9AA3B0]">— derived, not opinions</span></p>
          <div className="mt-2.5 space-y-1.5">
            {priorities.slice(0, 6).map((p) => (
              <button key={p.text} onClick={() => A.goWorkflow(p.code)}
                className="flex w-full items-start gap-2 rounded-lg border border-[#EBECE9] px-3 py-2 text-left hover:border-[#c9cfda]">
                <span className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold"
                  style={p.sev === "High" ? { background: "#FCF6F5", color: "#B4231F" } : p.sev === "Medium" ? { background: "#FEF3C7", color: "#92600E" } : { background: "#F1F3F6", color: "#6B7280" }}>
                  {p.sev}
                </span>
                <span className="min-w-0 flex-1 text-xs leading-snug text-[#3A414D]">{p.text}</span>
                <span className="font-mono text-[10px] text-[#9AA3B0]">{p.code}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={`${card} p-5`}>
          <p className="text-sm font-bold text-[#111827]">Upcoming reviews</p>
          <div className="mt-2.5 space-y-1.5 text-xs text-[#3A414D]">
            {renewals.slice(0, 3).map((v) => (
              <p key={v.id} className="flex justify-between gap-2 rounded-lg border border-[#EBECE9] px-3 py-2">
                <span className="truncate">{v.name} renewal</span>
                <span className="shrink-0 font-mono text-[11px] text-[#9AA3B0]">{v.renewal}</span>
              </p>
            ))}
            <p className="flex justify-between gap-2 rounded-lg border border-[#EBECE9] px-3 py-2">
              <span>Quarterly SOP review</span><span className="shrink-0 font-mono text-[11px] text-[#9AA3B0]">next quarter</span>
            </p>
            <p className="flex justify-between gap-2 rounded-lg border border-[#EBECE9] px-3 py-2">
              <span>Policy pack review</span>
              <span className="shrink-0 font-mono text-[11px] text-[#9AA3B0]">
                {(() => {
                  const dates = o.policies.filter((p) => p.adopted_on).map((p) => p.adopted_on).sort();
                  if (!dates.length) return "after adoption";
                  const d = new Date(dates[0]);
                  d.setFullYear(d.getFullYear() + 1);
                  return d.toISOString().slice(0, 10);
                })()}
              </span>
            </p>
          </div>
        </div>

        <div className={`${card} p-5`}>
          <p className="text-sm font-bold text-[#111827]">Quick actions</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {([["⇩ Exec report", () => download(`${slugOf(s)}-ops-report-${new Date().toISOString().slice(0, 10)}.md`, execReport(s, o))],
               ["⇩ Ops Manual", () => download(`${slugOf(s)}-operations-manual.md`, opsManual(s, o))],
               ["⇩ Continuity", () => download(`${slugOf(s)}-business-continuity-plan.md`, continuityPlan(s, o))],
               ["⇩ DR Plan", () => download(`${slugOf(s)}-disaster-recovery-plan.md`, drPlan(s))],
               ["✦ Regenerate", A.generate]] as [string, () => void][]).map(([t, fn]) => (
              <button key={t} className={`${btnGhost} !px-2 text-xs`} onClick={fn}>{t}</button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-[#9AA3B0]">The exec report is the investor-update skeleton — every number traced, nothing estimated.</p>
        </div>
      </aside>
    </div>
  );
}

// The weekly review — the cadence's flagship meeting, runnable right here. The checklist is
// GENERATED from live state each time (this week's renewals, this week's open risks, the actual
// goal metrics), and completing it writes a dated review the brief and exec report read back.
function WeeklyReview() {
  const A = useW8();
  const o = A.ops;
  const s = A.snap;
  const [running, setRunning] = useState(false);
  const [ticked, setTicked] = useState<boolean[]>([]);
  const [wins, setWins] = useState("");
  const [priority, setPriority] = useState("");

  const accounts = s.gtm?.accounts ?? [];
  const renewals = o.vendors.filter((v) => (daysUntil(v.renewal) ?? 99) <= 30 && (daysUntil(v.renewal) ?? -1) >= 0);
  const highOpen = o.risks.filter((r) => r.severity === "high" && r.status === "open");
  const steps: string[] = [
    "Runway: say the number out loud. If you can't, run the Weekly-bookkeeping SOP first.",
    accounts.length
      ? `Pipeline: do the ${accounts.length} account stages in W7 match reality? Move the ones that lie.`
      : "Pipeline: it's empty — this review's only real question is what you'll send in W7 this week.",
    renewals.length
      ? `Renewals ≤30d: ${renewals.map((v) => v.name).join(", ")} — renegotiate or confirm, don't let them auto-renew.`
      : "Renewals: nothing due in 30 days — confirmed, not assumed.",
    highOpen.length
      ? `HIGH risks still open: ${highOpen.map((r) => r.title.split(" — ")[0]).join(", ")} — did anything change this week?`
      : "Risks: no HIGH open. Skim the register anyway — 30 seconds.",
    ...o.goals.map((g) => `Goal check — ${g.text}: where is "${g.metric}" right now?`),
  ];

  const start = () => {
    setTicked(steps.map(() => false));
    setWins("");
    setPriority("");
    setRunning(true);
  };
  const allTicked = ticked.length > 0 && ticked.every(Boolean);
  const finish = () => {
    A.patch({
      reviews: [{ date: new Date().toISOString().slice(0, 10), wins: wins.trim(), priority: priority.trim() }, ...o.reviews],
    }, o.reviews.length ? "Weekly review done ✓" : "First weekly review done — the Operator is live ✓");
    setRunning(false);
  };

  if (!running) {
    return (
      <div className="mt-4 rounded-xl border border-[#EBECE9] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-[#111827]">Weekly review</p>
            <p className="text-[11px] text-[#9AA3B0]">
              {o.reviews.length
                ? `${o.reviews.length} on record · last ${o.reviews[0].date} · priority: ${o.reviews[0].priority || "—"}`
                : "Never run — the Operator is only as alive as its cadence. ~10 minutes."}
            </p>
          </div>
          <button className={btnBlue} style={{ background: R }} onClick={start}>▶ Run this week&apos;s review</button>
        </div>
        {o.reviews.length > 1 && (
          <div className="mt-2 space-y-1">
            {o.reviews.slice(1, 4).map((r) => (
              <p key={r.date} className="text-[11px] text-[#6B7280]">
                <span className="font-mono text-[#9AA3B0]">{r.date}</span> — {r.wins || "—"} → <b>{r.priority || "—"}</b>
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border p-4" style={{ borderColor: R }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#111827]">▶ Weekly review · {new Date().toDateString()}</p>
        <button className="text-[11px] text-[#9AA3B0] hover:text-[#111827]" onClick={() => setRunning(false)}>abandon</button>
      </div>
      <p className="mt-0.5 text-[11px] text-[#9AA3B0]">Generated from your live state — this week&apos;s renewals, this week&apos;s risks, your actual goals.</p>
      <div className="mt-2 space-y-1.5">
        {steps.map((st, i) => (
          <label key={i} className="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-white p-2.5"
            style={{ borderColor: ticked[i] ? "#BBE9CD" : "#EBECE9" }}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#16A34A]" checked={ticked[i] ?? false}
              onChange={() => setTicked((t) => t.map((v, x) => (x === i ? !v : v)))} />
            <span className="text-xs leading-relaxed" style={{ color: ticked[i] ? "#1E7A3D" : "#3A414D" }}>{st}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <p className={label}>What moved this week</p>
          <input className={`${input} mt-1`} value={wins} onChange={(e) => setWins(e.target.value)} placeholder="Shipped X · Northline replied · locked pricing" />
        </div>
        <div>
          <p className={label}>ONE priority for next week</p>
          <input className={`${input} mt-1`} value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="One. Not three." />
        </div>
      </div>
      <button className={`${btnBlue} mt-3`} style={{ background: allTicked && priority.trim() ? GREEN : "#C4CCD6" }}
        disabled={!allTicked || !priority.trim()} onClick={finish}>
        ✓ Review complete — record it
      </button>
    </div>
  );
}

function IntegrationsStrip() {
  const A = useW8();
  const s = A.snap;
  const tools = [
    ...(s.gtm?.connections ?? []).map((c) => ({
      name: c.provider, ok: c.status === "verified" || c.status === "connected", kind: c.kind,
    })),
    ...(s.integrations ?? []).map((i) => ({ name: i.provider, ok: true, kind: i.capability })),
  ];
  if (!tools.length) {
    return (
      <p className="mt-2.5 rounded-lg bg-[#FAFBFA] p-3 text-[11px] text-[#9AA3B0]">
        Nothing connected yet — W3 and W7 are where tools get wired in.
      </p>
    );
  }
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {tools.map((t) => (
        <span key={t.name + t.kind} className="flex items-center gap-1.5 rounded-full border border-[#EBECE9] px-3 py-1.5 text-xs text-[#3A414D]">
          <span className="h-2 w-2 rounded-full" style={{ background: t.ok ? GREEN : "#C4CCD6" }} />
          {t.name} <span className="text-[10px] text-[#9AA3B0]">{t.kind}</span>
        </span>
      ))}
    </div>
  );
}
