"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { completePhase, generatePhase } from "@/lib/api";
import { DocumentTemplate, type DocCompany } from "@/components/document-template";
import type {
  DocumentRecord,
  GeneratedDocument,
  Phase,
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
