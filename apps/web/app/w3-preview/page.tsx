"use client";

import { useState } from "react";

// W3 · Financial Infrastructure — visual concept, built from W3/w3-system-steps.md.
// Model per spec: StartupKit GUIDES the founder to the right providers and records a
// self-reported confirmation. It never submits applications, runs verification, or stores
// account credentials. Banking / Card / Accounting / Payments share one pattern (ask → branch →
// checklist + guidance → confirm). Tax Setup is system-generated. Everything feeds one calendar.

const W3 = "#0F6E56";
const W3_SOFT = "#0F6E5614";
const COMPANY = "TensorFold Inc.";

type Branch = "" | "yes" | "no";
type CardState = { status: "todo" | "confirmed"; open: boolean; branch: Branch };

type Provider = { name: string; note: string; url: string };
type Step = {
  id: string;
  name: string;
  role: string;
  icon: string;
  question: string;
  onFile: string[];
  bring: string[];
  guidance: string;
  providers: Provider[];
  confirmYes: string;
  confirmNo: string;
  event: string;
  unlocks?: string;
};

const STEPS: Step[] = [
  {
    id: "banking",
    name: "Business Banking",
    role: "Bank account",
    icon: "🏦",
    question: "Do you already have a business bank account?",
    onFile: [
      "Legal company name, EIN, entity type",
      "State of incorporation + formation date",
      "Business address",
      "Certificate of Incorporation (downloadable)",
    ],
    bring: [
      "Government ID for each founder owning > 25%",
      "Home address + date of birth for each",
    ],
    guidance: "Mercury and Relay are both built for startups and typically approve same-day.",
    providers: [
      { name: "Mercury", note: "startup-focused · same-day", url: "https://mercury.com" },
      { name: "Relay", note: "startup-focused · same-day", url: "https://relayfi.com" },
    ],
    confirmYes: `I have an active business bank account for ${COMPANY}.`,
    confirmNo: "I've opened my business bank account.",
    event: "bank_account.confirmed",
  },
  {
    id: "card",
    name: "Corporate Card",
    role: "Spend + cards",
    icon: "💳",
    question: "Do you already have a corporate card?",
    onFile: ["Legal company name, EIN, entity type", "Connected business bank account"],
    bring: [
      "Estimate of monthly business spend",
      "Identity details for each cardholder founder",
      "Current business bank balance (the real gating factor)",
    ],
    guidance:
      "Ramp and Brex set limits off your bank balance, not a personal credit check — but each has a minimum balance. Ramp is generally more accessible early; Brex (now Capital One) looks for a higher balance or revenue. Below that, Divvy has a lower bar.",
    providers: [
      { name: "Ramp", note: "most accessible early-stage", url: "https://ramp.com" },
      { name: "Brex", note: "higher balance / revenue", url: "https://brex.com" },
      { name: "Divvy", note: "lower bar if not there yet", url: "https://getdivvy.com" },
    ],
    confirmYes: `We have an active corporate card for ${COMPANY}.`,
    confirmNo: "We've gotten our corporate card.",
    event: "card.confirmed",
  },
  {
    id: "accounting",
    name: "Accounting Setup",
    role: "Bookkeeping",
    icon: "📒",
    question: "Do you already use QuickBooks or Xero?",
    onFile: [
      "Legal company name, EIN, entity type",
      "Connected business bank account",
      "Suggested chart of accounts (downloadable)",
    ],
    bring: [],
    guidance:
      "QuickBooks and Xero are both built for small businesses and connect directly to your bank. Start from the suggested chart of accounts so your books match everything else here.",
    providers: [
      { name: "QuickBooks", note: "US default · accountant-friendly", url: "https://quickbooks.intuit.com" },
      { name: "Xero", note: "clean, bank-connected", url: "https://xero.com" },
    ],
    confirmYes: `We already have QuickBooks or Xero set up for ${COMPANY}.`,
    confirmNo: "We've set up our accounting system.",
    event: "accounting.confirmed",
  },
  {
    id: "payments",
    name: "Payment Processing",
    role: "Accept revenue",
    icon: "🟣",
    question: "Do you already have Stripe (or another processor) set up?",
    onFile: [
      "Legal company name, EIN, entity type",
      "Business address",
      "Connected business bank account",
    ],
    bring: [
      "Website URL + short description of what you sell",
      "Government ID for the submitter and any 25%+ owner (Stripe verifies beneficial owners)",
    ],
    guidance:
      "Stripe is what most startups use to accept payments and connects directly to your bank account for payouts.",
    providers: [{ name: "Stripe", note: "connects to your bank for payouts", url: "https://stripe.com" }],
    confirmYes: "We already have Stripe (or another processor) set up and connected to our bank.",
    confirmNo: "We've set up Stripe and are ready to accept payments.",
    event: "stripe.confirmed",
    unlocks: "Unblocks W7 (first payment)",
  },
];

export default function W3Preview() {
  const [cards, setCards] = useState<Record<string, CardState>>(
    Object.fromEntries(STEPS.map((s) => [s.id, { status: "todo", open: false, branch: "" }])),
  );
  const [taxDone, setTaxDone] = useState(false);

  const set = (id: string, patch: Partial<CardState>) =>
    setCards((c) => ({ ...c, [id]: { ...c[id], ...patch } }));

  const doneCount =
    STEPS.filter((s) => cards[s.id].status === "confirmed").length + (taxDone ? 1 : 0);
  const pct = Math.round((doneCount / (STEPS.length + 1)) * 100);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {/* header */}
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
          <div
            className="flex flex-col gap-5 border-l-4 p-7 sm:flex-row sm:items-center"
            style={{ borderLeftColor: W3 }}
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-bold tracking-widest" style={{ color: W3 }}>
                W3 · FINANCIAL INFRASTRUCTURE
              </p>
              <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink">
                Set up your money stack, guided
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                For each piece, StartupKit tells you what you already have, what to bring, and the
                best provider — then you set it up and confirm. It <b>never</b> submits applications,
                runs verification, or stores your bank credentials.
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-line bg-paper px-5 py-4 text-center">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Progress</p>
              <p className="text-4xl font-extrabold leading-none" style={{ color: W3 }}>
                {pct}%
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {doneCount}/{STEPS.length + 1} steps
              </p>
            </div>
          </div>
        </div>

        {/* the guided provider steps */}
        <p className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
          Your financial stack
        </p>
        <div className="space-y-3">
          {STEPS.map((s) => (
            <GuidedStep key={s.id} step={s} state={cards[s.id]} set={(p) => set(s.id, p)} />
          ))}
        </div>

        {/* tax setup (system-generated) */}
        <p className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
          Tax setup <span className="font-normal normal-case">— generated for you, no signup</span>
        </p>
        <TaxSetup done={taxDone} onConfirm={() => setTaxDone(true)} />

        {/* compliance calendar (the output) */}
        <p className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
          Compliance calendar{" "}
          <span className="font-normal normal-case">— every deadline, one place</span>
        </p>
        <ComplianceCalendar taxActive={taxDone} />

        <div className="mt-8 rounded-2xl border border-line bg-panel p-5 text-sm text-ink-soft shadow-card">
          <p className="font-semibold text-ink">How to read this</p>
          <p className="mt-1">
            Each step: one yes/no question → if you don&apos;t have it, a checklist of what&apos;s
            already on file vs. what to bring, plus the right provider → you set it up with them and
            confirm. StartupKit records the confirmation and fires an event (e.g.{" "}
            <code className="rounded bg-paper px-1 text-xs">bank_account.confirmed</code>) that
            updates your Company Object, calendar, and Health Score — it stays the guide, never the
            bank.
          </p>
        </div>
      </div>
    </div>
  );
}

function GuidedStep({
  step,
  state,
  set,
}: {
  step: Step;
  state: CardState;
  set: (p: Partial<CardState>) => void;
}) {
  const confirmed = state.status === "confirmed";
  return (
    <div
      className="overflow-hidden rounded-2xl border bg-panel shadow-card transition"
      style={{ borderColor: confirmed ? W3 : "#E3E7E2" }}
    >
      <button
        onClick={() => set({ open: !state.open })}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
          style={{ backgroundColor: W3_SOFT }}
        >
          {step.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-ink">{step.name}</span>
          <span className="block font-mono text-[11px] uppercase tracking-wide text-muted">
            {step.role}
          </span>
        </span>
        {confirmed ? (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ color: "#0F7A57", backgroundColor: "#E5F3EC" }}
          >
            ✓ Confirmed
          </span>
        ) : (
          <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-muted">
            To do
          </span>
        )}
        <span className="font-mono text-xs text-muted">{state.open ? "▲" : "▾"}</span>
      </button>

      {state.open && (
        <div className="border-t border-line px-4 pb-5 pt-4">
          {!confirmed && (
            <>
              <p className="text-sm font-semibold text-ink">{step.question}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => set({ branch: "yes" })}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    state.branch === "yes"
                      ? "text-white"
                      : "border-line text-ink-soft hover:border-seal"
                  }`}
                  style={state.branch === "yes" ? { backgroundColor: W3, borderColor: W3 } : undefined}
                >
                  Yes, we have it
                </button>
                <button
                  onClick={() => set({ branch: "no" })}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    state.branch === "no"
                      ? "text-white"
                      : "border-line text-ink-soft hover:border-seal"
                  }`}
                  style={state.branch === "no" ? { backgroundColor: W3, borderColor: W3 } : undefined}
                >
                  No, not yet
                </button>
              </div>
            </>
          )}

          {!confirmed && state.branch === "no" && (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-line bg-paper p-4">
                  <p
                    className="mb-2 text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: W3 }}
                  >
                    ✓ Already on file
                  </p>
                  <ul className="space-y-1 text-[13px] text-ink-soft">
                    {step.onFile.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span style={{ color: W3 }}>✓</span>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
                {step.bring.length > 0 && (
                  <div className="rounded-xl border border-line bg-paper p-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-seal-ink">
                      ▸ You&apos;ll need to bring
                    </p>
                    <ul className="space-y-1 text-[13px] text-ink-soft">
                      {step.bring.map((x) => (
                        <li key={x} className="flex gap-2">
                          <span className="text-seal-ink">▸</span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-[13px] leading-relaxed text-ink-soft">{step.guidance}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {step.providers.map((p) => (
                    <a
                      key={p.name}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm transition hover:border-seal"
                    >
                      <span className="font-semibold text-ink">{p.name} ↗</span>
                      <span className="text-xs text-muted">{p.note}</span>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {!confirmed && (state.branch === "yes" || state.branch === "no") && (
            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-line bg-paper p-3 text-[13px] text-ink-soft">
              <input
                type="checkbox"
                className="mt-0.5"
                onChange={(e) => e.target.checked && set({ status: "confirmed" })}
              />
              <span>{state.branch === "yes" ? step.confirmYes : step.confirmNo}</span>
            </label>
          )}

          {confirmed && (
            <div className="rounded-lg border border-line bg-paper p-3 text-[13px] text-ink-soft">
              <p>
                <b style={{ color: W3 }}>Confirmed.</b> StartupKit recorded this as{" "}
                <code className="rounded bg-panel px-1 text-xs">{step.event}</code> on your Company
                Object — no account numbers or credentials stored.
                {step.unlocks && <span className="text-muted"> · {step.unlocks}</span>}
              </p>
              <button
                onClick={() => set({ status: "todo", branch: "" })}
                className="mt-2 text-xs font-medium text-muted underline"
              >
                undo (demo)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaxSetup({ done, onConfirm }: { done: boolean; onConfirm: () => void }) {
  const [states, setStates] = useState({ employees: false, sales: false, office: false });
  return (
    <div
      className="rounded-2xl border bg-panel p-5 shadow-card"
      style={{ borderColor: done ? W3 : "#E3E7E2" }}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <TaxCard
          title="Federal Tax Classification"
          body="C-Corporation → Form 1120. Annual return due April 15 (calendar-year)."
        />
        <TaxCard
          title="Estimated Quarterly Payments"
          body="Federal deadlines: Apr 15 · Jun 15 · Sep 15 · Dec 15 — added as placeholders even if nothing's owed yet."
        />
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="text-sm font-bold text-ink">State Tax Registration</p>
          <p className="mt-1 text-[12px] text-muted">
            Only what you check gets added — nothing assumed.
          </p>
          <div className="mt-2 space-y-1.5 text-[13px] text-ink-soft">
            {[
              ["employees", "Employees in a state?"],
              ["sales", "Selling goods/services there?"],
              ["office", "Physical office there?"],
            ].map(([k, label]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={states[k as keyof typeof states]}
                  onChange={(e) => setStates((s) => ({ ...s, [k]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-line bg-paper p-4">
        <p className="text-sm font-bold text-ink">Delaware Franchise Tax &amp; Annual Report</p>
        <p className="mt-1 text-[13px] text-ink-soft">
          Due every year by <b>March 1</b>, regardless of revenue. Both calculation methods shown;
          <b> $175 minimum + $50 report fee</b> as reference. Your registered agent (from W1)
          typically files it.
        </p>
      </div>

      {done ? (
        <p className="mt-4 text-[13px]" style={{ color: W3 }}>
          <b>✓ Tax profile active.</b> All federal, state, and Delaware deadlines were added to your
          compliance calendar below (fired{" "}
          <code className="rounded bg-paper px-1 text-xs">tax_setup.active</code>).
        </p>
      ) : (
        <button
          onClick={onConfirm}
          className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: W3 }}
        >
          Looks right — confirm my tax profile
        </button>
      )}
    </div>
  );
}

function TaxCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-[13px] text-ink-soft">{body}</p>
    </div>
  );
}

function ComplianceCalendar({ taxActive }: { taxActive: boolean }) {
  const legal: [string, string, string, boolean][] = [
    ["🟢 Legal", "83(b) election window", "30 days from grant", true],
    ["🟢 Legal", "Registered agent renewal", "Annual", false],
  ];
  const financial: [string, string, string, boolean][] = taxActive
    ? [
        ["🔵 Financial", "Delaware Franchise Tax + Annual Report", "Mar 1", true],
        ["🔵 Financial", "Federal return (Form 1120)", "Apr 15", false],
        ["🔵 Financial", "Estimated quarterly tax", "Apr 15 · Jun 15 · Sep 15 · Dec 15", false],
        ["🔵 Financial", "1099-NEC to contractors", "Jan 31", false],
      ]
    : [];
  const rows = [...financial, ...legal];
  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
      {!taxActive && (
        <p className="mb-3 rounded-lg border border-dashed border-line bg-paper px-3 py-2 text-[13px] text-muted">
          Confirm your tax profile above to add the financial deadlines here — they merge with
          W1&apos;s legal deadlines into one calendar.
        </p>
      )}
      <table className="w-full text-[13px]">
        <tbody>
          {rows.map(([tag, name, when, soon], i) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="py-2 pr-3 text-muted">{tag}</td>
              <td className="py-2 pr-3 font-medium text-ink">{name}</td>
              <td className="py-2 text-right">
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold"
                  style={
                    soon
                      ? { backgroundColor: "#FBEDE9", color: "#B23A2E" }
                      : { backgroundColor: "#F3F5F2", color: "#5C6573" }
                  }
                >
                  {when}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[12px] text-muted">
        Escalating reminders at ~60 / ~30 / final week. Every number is an estimate, not a filed tax
        bill — precision items route to a CPA partner.
      </p>
    </div>
  );
}
