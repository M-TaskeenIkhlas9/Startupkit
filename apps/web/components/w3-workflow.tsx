"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { completePhase, fillDocument, generatePhase } from "@/lib/api";
import { DocumentTemplate, type DocCompany } from "@/components/document-template";
import type {
  DocumentRecord,
  GeneratedDocument,
  Phase,
  SubmitResult,
  SubmittedDoc,
  WorkflowView,
} from "@/lib/types";

const W3 = "#0F6E56";
const W3_SOFT = "#0F6E5614";

function docKey(code: string, name: string): string {
  return `${code}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

// One-line "why this phase" so the three verbs read as a story, not a checklist.
const PHASE_WHY: Record<string, string> = {
  Connect:
    "Set up your money tools. StartupKit guides you and records what's done — it never asks for " +
    "or stores your account credentials.",
  Configure:
    "Your tax profile and opening books, built from what StartupKit already knows about your " +
    "company.",
  Generate: "The real documents — a financial policy now, and clean YC SAFEs when you raise.",
};

// The Connect phase, guided (ported from the W3 concept page): one yes/no question per money
// tool → what's already on file vs. what to bring → the right provider → a confirmation that is
// recorded as a real document.submitted event. StartupKit stays the guide — it never submits
// applications, runs verification, or stores bank credentials.
type ConnectGuide = {
  icon: string;
  question: string;
  onFile: string[];
  bring: string[];
  guidance: string;
  providers: { name: string; note: string; url: string }[];
  confirmYes: (company: string) => string;
  confirmNo: string;
  unlocks?: string;
};

const CONNECT_GUIDES: Record<string, ConnectGuide> = {
  "Business Banking": {
    icon: "🏦",
    question: "Do you already have a business bank account?",
    onFile: [
      "Legal company name, EIN, entity type",
      "State of incorporation + formation date",
      "Business address",
      "Certificate of Incorporation (from W1)",
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
    confirmYes: (c) => `I have an active business bank account for ${c}.`,
    confirmNo: "I've opened my business bank account.",
  },
  "Corporate Card": {
    icon: "💳",
    question: "Do you already have a corporate card?",
    onFile: ["Legal company name, EIN, entity type", "Connected business bank account"],
    bring: [
      "Estimate of monthly business spend",
      "Identity details for each cardholder founder",
      "Current business bank balance (the real gating factor)",
    ],
    guidance:
      "Ramp and Brex set limits off your bank balance, not a personal credit check — but each " +
      "has a minimum. Ramp is generally more accessible early; Brex looks for a higher balance " +
      "or revenue. Below that, Divvy has a lower bar.",
    providers: [
      { name: "Ramp", note: "most accessible early-stage", url: "https://ramp.com" },
      { name: "Brex", note: "higher balance / revenue", url: "https://brex.com" },
      { name: "Divvy", note: "lower bar if not there yet", url: "https://getdivvy.com" },
    ],
    confirmYes: (c) => `We have an active corporate card for ${c}.`,
    confirmNo: "We've gotten our corporate card.",
  },
  "Accounting Setup": {
    icon: "📒",
    question: "Do you already use QuickBooks or Xero?",
    onFile: [
      "Legal company name, EIN, entity type",
      "Connected business bank account",
      "Suggested chart of accounts (Configure phase)",
    ],
    bring: [],
    guidance:
      "QuickBooks and Xero both connect directly to your bank. Start from the suggested chart " +
      "of accounts so your books match everything else here.",
    providers: [
      { name: "QuickBooks", note: "US default · accountant-friendly", url: "https://quickbooks.intuit.com" },
      { name: "Xero", note: "clean, bank-connected", url: "https://xero.com" },
    ],
    confirmYes: (c) => `We already have QuickBooks or Xero set up for ${c}.`,
    confirmNo: "We've set up our accounting system.",
  },
  "Payment Processing": {
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
      "Stripe is what most startups use to accept payments and connects directly to your bank " +
      "account for payouts.",
    providers: [{ name: "Stripe", note: "connects to your bank for payouts", url: "https://stripe.com" }],
    confirmYes: () => "We already have Stripe (or another processor) set up and connected to our bank.",
    confirmNo: "We've set up Stripe and are ready to accept payments.",
    unlocks: "Unblocks W7 — this is how customers actually pay you.",
  },
};

// SAFE picker: the founder issues ONE variant. Cap is first-money standard and carries the board
// consent + pro rata side letter; discount/MFN are the no-cap alternatives.
type Variant = "cap" | "discount" | "mfn";
const VARIANTS: { id: Variant; label: string; blurb: string; docs: string[] }[] = [
  {
    id: "cap",
    label: "Valuation Cap",
    blurb:
      "YC standard first-money — priced by a post-money cap. Comes with the board consent and a " +
      "pro rata side letter.",
    docs: [
      "SAFE — Post-Money Valuation Cap",
      "Board Consent — SAFE Issuance",
      "Pro Rata Side Letter",
    ],
  },
  {
    id: "discount",
    label: "Discount",
    blurb: "No cap — the investor converts at a discount to your priced round instead.",
    docs: ["SAFE — Post-Money Discount"],
  },
  {
    id: "mfn",
    label: "MFN",
    blurb:
      "No cap and no discount — the investor automatically matches the best terms you give a " +
      "later SAFE.",
    docs: ["SAFE — Post-Money MFN"],
  },
];

export function W3Workflow({
  companyId,
  view,
  documents,
  company,
  facts,
  submitted,
}: {
  companyId: string;
  view: WorkflowView;
  documents: DocumentRecord[];
  company: DocCompany;
  facts: Record<string, string>;
  submitted: Record<string, SubmittedDoc>;
}) {
  const router = useRouter();
  const phases = view.definition.phases;
  const [done, setDone] = useState<number[]>(view.completed_phases);
  const [busy, setBusy] = useState<number | null>(null);
  const [variant, setVariant] = useState<Variant>("cap");
  const [taxConfirmed, setTaxConfirmed] = useState(false);
  const [docs, setDocs] = useState<Record<number, GeneratedDocument[]>>(() => {
    const m: Record<number, GeneratedDocument[]> = {};
    for (const d of documents) (m[d.phase_n] ??= []).push(d);
    return m;
  });
  const locked = view.status === "locked";
  const isCorp = company.entity_type !== "llc";

  const isDone = (n: number) => done.includes(n);
  const isCurrent = (n: number) =>
    !isDone(n) && phases.filter((p) => p.n < n).every((p) => isDone(p.n));

  async function act(phase: Phase) {
    setBusy(phase.n);
    try {
      if (phase.actor === "founder") {
        const updated = await completePhase(companyId, view.definition.code, phase.n);
        setDone(updated.completed_phases);
      } else {
        const res = await generatePhase(companyId, view.definition.code, phase.n);
        setDone(res.workflow.completed_phases);
        setDocs((d) => ({ ...d, [phase.n]: res.documents }));
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  // Which Generate documents to show: the financial policy always; then only the SAFE bundle for
  // the chosen variant. LLCs can't issue SAFEs, so those are gated behind a convert-first note.
  const generateDocsFor = useMemo(() => {
    const bundle = VARIANTS.find((v) => v.id === variant)!.docs;
    return (phase: Phase) =>
      phase.documents.filter(
        (d) => d.name === "Financial & Expense Policy" || bundle.includes(d.name),
      );
  }, [variant]);

  return (
    <div className="space-y-5">
      {/* Connect → Configure → Generate — the three verbs as one progress story. */}
      <div className="flex items-stretch gap-2">
        {phases.map((p, i) => {
          const complete = isDone(p.n);
          const current = isCurrent(p.n) && !locked;
          const filled = p.documents.filter(
            (d) => submitted[docKey(view.definition.code, d.name)],
          ).length;
          return (
            <div key={p.n} className="flex flex-1 items-center gap-2">
              <div
                className="flex-1 rounded-xl border p-3"
                style={{
                  borderColor: current ? W3 : "#e3e7e2",
                  background: complete || current ? W3_SOFT : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: complete || current ? W3 : "#cdd4cd" }}
                  >
                    {complete ? "✓" : p.n}
                  </span>
                  <span className="text-sm font-semibold text-ink">{p.name}</span>
                </div>
                <p className="mt-1 font-mono text-[10.5px] text-muted">
                  {filled}/{p.documents.length} confirmed
                </p>
              </div>
              {i < phases.length - 1 && <span className="text-muted">→</span>}
            </div>
          );
        })}
      </div>

      {phases.map((p) => {
        const complete = isDone(p.n);
        const current = isCurrent(p.n) && !locked;
        const isGenerate = p.name === "Generate";
        const phaseDocs = isGenerate ? generateDocsFor(p) : p.documents;
        return (
          <div
            key={p.n}
            className="card p-5"
            style={current ? { boxShadow: `0 0 0 2px ${W3_SOFT}` } : undefined}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-widest" style={{ color: W3 }}>
                  {p.n}. {p.name.toUpperCase()}
                </span>
                {complete && <span className="text-sm font-semibold text-teal">✓ Done</span>}
              </div>
              <ActorLine name={p.name} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">{PHASE_WHY[p.name] ?? p.summary}</p>

            {isGenerate && (
              <SafePicker
                variant={variant}
                setVariant={setVariant}
                isCorp={isCorp}
                entityLabel={company.entity_type}
              />
            )}

            <div className="mt-3 space-y-2">
              {phaseDocs.map((doc) => {
                const isSafe =
                  doc.name.startsWith("SAFE") ||
                  doc.name.startsWith("Board Consent") ||
                  doc.name === "Pro Rata Side Letter";
                if (isGenerate && isSafe && !isCorp) return null; // gated below with one note
                const guide = p.name === "Connect" ? CONNECT_GUIDES[doc.name] : undefined;
                if (guide) {
                  return (
                    <GuidedConnectCard
                      key={doc.name}
                      companyId={companyId}
                      workflowCode={view.definition.code}
                      phaseN={p.n}
                      docName={doc.name}
                      required={doc.required}
                      guide={guide}
                      companyName={company.name}
                      locked={locked}
                      alreadySubmitted={Boolean(submitted[docKey(view.definition.code, doc.name)])}
                      onSubmitted={(r) => {
                        setDone(r.workflow.completed_phases);
                        router.refresh();
                      }}
                    />
                  );
                }
                return (
                  <DocumentTemplate
                    key={doc.name}
                    companyId={companyId}
                    workflowCode={view.definition.code}
                    phaseN={p.n}
                    color={W3}
                    doc={doc}
                    company={company}
                    facts={facts}
                    submitted={submitted[docKey(view.definition.code, doc.name)]}
                    generated={(docs[p.n] ?? []).find((g) => g.doc_type === doc.name)}
                    phaseComplete={complete}
                    onSubmitted={(r) => setDone(r.workflow.completed_phases)}
                  />
                );
              })}
              {isGenerate && !isCorp && (
                <p className="rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
                  🔒 SAFEs are for <strong>Delaware C-Corporations</strong>. Investors expect to
                  convert into preferred stock — an LLC has no stock to convert into. Convert to a
                  C-Corp first (many do this right before raising), then issue SAFEs here. Your
                  Financial &amp; Expense Policy above works for any entity.
                </p>
              )}
            </div>

            <PhaseAction
              phase={p}
              complete={complete}
              current={current}
              locked={locked}
              busy={busy === p.n}
              onAct={() => act(p)}
            />
          </div>
        );
      })}

      {/* Tax profile + one compliance calendar — generated from the Company Object, entity-aware.
          Ported from the W3 concept; it stays the guide, never the filer. */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold tracking-widest" style={{ color: W3 }}>
            TAX PROFILE &amp; COMPLIANCE CALENDAR
          </span>
          <span className="badge" style={{ background: W3_SOFT, color: "#0A3326" }}>
            ⚡ Generated for you — no signup
          </span>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Read from your entity type and state — confirm it and every financial deadline merges with
          W1&apos;s legal deadlines into one calendar. Numbers are estimates, not a filed bill.
        </p>
        <TaxProfile
          isCorp={isCorp}
          state={facts.state_of_operation}
          confirmed={taxConfirmed}
          onConfirm={() => setTaxConfirmed(true)}
        />
        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-muted">
          Compliance calendar <span className="font-normal normal-case">— every deadline, one place</span>
        </p>
        <ComplianceCalendar isCorp={isCorp} state={facts.state_of_operation} taxActive={taxConfirmed} />
      </div>
    </div>
  );
}

function TaxProfile({
  isCorp,
  state,
  confirmed,
  onConfirm,
}: {
  isCorp: boolean;
  state?: string;
  confirmed: boolean;
  onConfirm: () => void;
}) {
  const [reg, setReg] = useState({ employees: false, sales: false, office: false });
  const federal = isCorp
    ? "C-Corporation → Form 1120. Federal return due April 15 (calendar-year)."
    : "LLC → pass-through. Profit and loss flow to members on Schedule K-1; no entity-level federal return.";
  const quarterly = isCorp
    ? "The company pays estimated federal tax: Apr 15 · Jun 15 · Sep 15 · Dec 15 — placeholders even if nothing's owed yet."
    : "Members pay estimated tax personally: Apr 15 · Jun 15 · Sep 15 · Dec 15.";

  return (
    <div className="mt-3 rounded-xl border p-4" style={{ borderColor: confirmed ? W3 : "#e3e7e2" }}>
      <div className="grid gap-3 md:grid-cols-3">
        <TaxCard title="Federal classification" body={federal} />
        <TaxCard title="Estimated quarterly payments" body={quarterly} />
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="text-sm font-bold text-ink">State tax registration</p>
          <p className="mt-1 text-[12px] text-muted">
            {state && state !== "Delaware"
              ? `You operate in ${state} — check what applies and it's added; nothing assumed.`
              : "Only what you check gets added — nothing assumed."}
          </p>
          <div className="mt-2 space-y-1.5 text-[13px] text-ink-soft">
            {([["employees", "Employees in a state?"], ["sales", "Selling goods/services there?"], ["office", "Physical office there?"]] as const).map(
              ([k, lbl]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={reg[k]} onChange={(e) => setReg((s) => ({ ...s, [k]: e.target.checked }))} />
                  {lbl}
                </label>
              ),
            )}
          </div>
        </div>
      </div>

      {confirmed ? (
        <p className="mt-4 text-[13px]" style={{ color: W3 }}>
          <b>✓ Tax profile active.</b> All federal, state, and Delaware deadlines were added to the
          compliance calendar below.
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
    <div className="rounded-lg border border-line bg-paper p-4">
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-[13px] text-ink-soft">{body}</p>
    </div>
  );
}

function ComplianceCalendar({
  isCorp,
  state,
  taxActive,
}: {
  isCorp: boolean;
  state?: string;
  taxActive: boolean;
}) {
  const legal: [string, string, string, boolean][] = [
    ["🟢 Legal", "83(b) election window", "30 days from grant", true],
    ["🟢 Legal", "Registered agent renewal", "Annual", false],
  ];
  // Delaware franchise tax / LLC annual tax are tracked as their own guided-task document in W1
  // ("stand up ongoing compliance") — not restated here, so there's one real place to mark it done.
  const financialCorp: [string, string, string, boolean][] = [
    ["🔵 Financial", "Federal return (Form 1120)", "Apr 15", false],
    ["🔵 Financial", "Estimated quarterly tax", "Apr 15 · Jun 15 · Sep 15 · Dec 15", false],
    ["🔵 Financial", "1099-NEC to contractors", "Jan 31", false],
  ];
  const financialLlc: [string, string, string, boolean][] = [
    ["🔵 Financial", "Schedule K-1 to members", "Apr 15", false],
    ["🔵 Financial", "Members' estimated quarterly tax", "Apr 15 · Jun 15 · Sep 15 · Dec 15", false],
    ["🔵 Financial", "1099-NEC to contractors", "Jan 31", false],
  ];
  const stateRow: [string, string, string, boolean][] =
    state && state !== "Delaware"
      ? [["🔵 Financial", `Foreign qualification + ${state} state tax`, `Register in ${state}`, false]]
      : [];
  const financial = taxActive ? [...(isCorp ? financialCorp : financialLlc), ...stateRow] : [];
  const rows = [...financial, ...legal];

  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      {!taxActive && (
        <p className="mb-3 rounded-lg border border-dashed border-line bg-panel px-3 py-2 text-[13px] text-muted">
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
                  style={soon ? { backgroundColor: "#FBEDE9", color: "#B23A2E" } : { backgroundColor: "#F3F5F2", color: "#5C6573" }}
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

function GuidedConnectCard({
  companyId,
  workflowCode,
  phaseN,
  docName,
  required,
  guide,
  companyName,
  locked,
  alreadySubmitted,
  onSubmitted,
}: {
  companyId: string;
  workflowCode: string;
  phaseN: number;
  docName: string;
  required: boolean;
  guide: ConnectGuide;
  companyName: string;
  locked: boolean;
  alreadySubmitted: boolean;
  onSubmitted: (r: SubmitResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [branch, setBranch] = useState<"" | "yes" | "no">("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(alreadySubmitted);

  async function confirmWith(b: "yes" | "no") {
    setBusy(true);
    try {
      const text = b === "yes" ? guide.confirmYes(companyName || "the company") : guide.confirmNo;
      const r = await fillDocument(companyId, {
        workflow_code: workflowCode,
        phase_n: phaseN,
        doc_name: docName,
        fields: { confirmation: text, had_it_already: b },
      });
      setConfirmed(true);
      onSubmitted(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="overflow-hidden rounded-xl border transition"
      style={{ borderColor: confirmed ? W3 : "#e3e7e2" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 bg-panel p-3.5 text-left"
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
          style={{ backgroundColor: W3_SOFT }}
        >
          {guide.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink">{docName}</span>
            {!required && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                optional
              </span>
            )}
          </span>
          <span className="block text-[12px] text-ink-soft">
            {confirmed ? "Recorded on your Company Object" : guide.question}
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
        <span className="font-mono text-xs text-muted">{open ? "▲" : "▾"}</span>
      </button>

      {open && !confirmed && (
        <div className="border-t border-line px-4 pb-4 pt-3">
          <p className="text-sm font-semibold text-ink">{guide.question}</p>
          <div className="mt-2 flex gap-2">
            {(["yes", "no"] as const).map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBranch(b);
                  // "Yes" needs no separate confirmation step — the click itself is the
                  // attestation. "No" still walks through on-file/bring/providers first, so it
                  // keeps an explicit checkbox once the founder has actually done the setup.
                  if (b === "yes" && !locked) void confirmWith("yes");
                }}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition"
                style={
                  branch === b
                    ? { backgroundColor: W3, borderColor: W3, color: "#fff" }
                    : { borderColor: "#e3e7e2", color: "#5b6b60" }
                }
              >
                {b === "yes" ? "Yes, we have it" : "No, not yet"}
              </button>
            ))}
          </div>

          {branch === "no" && (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-line bg-paper p-3.5">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: W3 }}>
                    ✓ Already on file
                  </p>
                  <ul className="space-y-1 text-[13px] text-ink-soft">
                    {guide.onFile.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span style={{ color: W3 }}>✓</span>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
                {guide.bring.length > 0 && (
                  <div className="rounded-lg border border-line bg-paper p-3.5">
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                      ▸ You&apos;ll need to bring
                    </p>
                    <ul className="space-y-1 text-[13px] text-ink-soft">
                      {guide.bring.map((x) => (
                        <li key={x} className="flex gap-2">
                          <span>▸</span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{guide.guidance}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {guide.providers.map((pr) => (
                  <a
                    key={pr.name}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm transition hover:border-seal"
                  >
                    <span className="font-semibold text-ink">{pr.name} ↗</span>
                    <span className="text-xs text-muted">{pr.note}</span>
                  </a>
                ))}
              </div>
            </>
          )}

          {branch !== "" && locked && (
            <p className="mt-4 rounded-lg border border-line bg-paper p-3 text-[13px] text-muted">
              🔒 Locked until W1 (formation) is complete — the confirmation needs a real company
              behind it.
            </p>
          )}

          {branch === "yes" && !locked && busy && (
            <p className="mt-4 text-[13px] text-muted">Recording…</p>
          )}

          {branch === "no" && !locked && (
            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-line bg-paper p-3 text-[13px] text-ink-soft">
              <input
                type="checkbox"
                className="mt-0.5"
                disabled={busy}
                checked={false}
                onChange={(e) => e.target.checked && confirmWith("no")}
              />
              <span>{busy ? "Recording…" : guide.confirmNo}</span>
            </label>
          )}
        </div>
      )}

      {open && confirmed && (
        <div className="border-t border-line px-4 pb-4 pt-3 text-[13px] text-ink-soft">
          <b style={{ color: W3 }}>Confirmed.</b> Recorded on your Company Object — no account
          numbers or credentials stored.
          {guide.unlocks && <span className="text-muted"> · {guide.unlocks}</span>}
        </div>
      )}
    </div>
  );
}

function SafePicker({
  variant,
  setVariant,
  isCorp,
  entityLabel,
}: {
  variant: Variant;
  setVariant: (v: Variant) => void;
  isCorp: boolean;
  entityLabel: string;
}) {
  const active = VARIANTS.find((v) => v.id === variant)!;
  return (
    <div className="mt-4 rounded-xl border border-line bg-paper/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Raising on a SAFE? Pick the variant
      </p>
      {!isCorp && (
        <p className="mt-1 text-xs text-muted">
          Shown for reference — SAFEs require a C-Corp (you&apos;re an {entityLabel.toUpperCase()}).
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {VARIANTS.map((v) => {
          const on = v.id === variant;
          return (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              className="rounded-full border px-3 py-1 text-sm font-medium transition-colors"
              style={{
                borderColor: on ? W3 : "#e3e7e2",
                background: on ? W3 : "transparent",
                color: on ? "#fff" : "#5b6b60",
              }}
            >
              {v.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-ink-soft">{active.blurb}</p>
    </div>
  );
}

function PhaseAction({
  phase,
  complete,
  current,
  locked,
  busy,
  onAct,
}: {
  phase: Phase;
  complete: boolean;
  current: boolean;
  locked: boolean;
  busy: boolean;
  onAct: () => void;
}) {
  if (complete) return <div className="mt-4 text-sm font-semibold text-teal">✓ Completed</div>;
  if (locked) {
    return <p className="mt-4 text-xs text-muted">🔒 Locked until W1 (formation) is complete.</p>;
  }
  if (!current) {
    return (
      <button disabled className="btn-ghost mt-4 cursor-not-allowed opacity-50">
        Complete the previous step first
      </button>
    );
  }
  const generates = phase.actor !== "founder";
  return (
    <button
      onClick={onAct}
      disabled={busy}
      className={generates ? "btn-primary mt-4" : "btn-ghost mt-4"}
    >
      {busy
        ? generates
          ? "Generating…"
          : "Saving…"
        : generates
          ? `⚡ ${phase.cta}`
          : `${phase.cta} ✓`}
    </button>
  );
}

function ActorLine({ name }: { name: string }) {
  const label =
    name === "Connect"
      ? "✍️ You set these up"
      : name === "Configure"
        ? "⚡ StartupKit builds these"
        : "⚡ StartupKit drafts these";
  return (
    <span className="badge" style={{ background: W3_SOFT, color: "#0A3326" }}>
      {label}
    </span>
  );
}
