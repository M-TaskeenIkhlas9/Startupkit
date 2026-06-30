"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { completePhase, generatePhase } from "@/lib/api";
import { DocumentTemplate, type DocCompany } from "@/components/document-template";
import type {
  Actor,
  DocumentRecord,
  GeneratedDocument,
  Phase,
  SubmittedDoc,
  WorkflowView,
} from "@/lib/types";

function docKey(code: string, name: string): string {
  return `${code}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

const ACTOR_BADGE: Record<Actor, { label: string; icon: string; bg: string; fg: string }> = {
  startupkit: { label: "StartupKit drafts this", icon: "⚡", bg: "#E4F1EB", fg: "#0A3326" },
  provider: { label: "Via integration", icon: "🔌", bg: "#E6F1FB", fg: "#0A3F6E" },
  founder: { label: "You do this", icon: "✍️", bg: "#F2E6C8", fg: "#5E3F0E" },
};

const MODE_HINT: Record<string, string> = {
  automated: "One click — we generate and file the paperwork.",
  assisted: "We draft the documents; you review and approve.",
  manual: "You complete this, then confirm it's done.",
};

export function WorkflowPhases({
  companyId,
  view,
  documents,
  company,
  submitted,
}: {
  companyId: string;
  view: WorkflowView;
  documents: DocumentRecord[];
  company: DocCompany;
  submitted: Record<string, SubmittedDoc>;
}) {
  const router = useRouter();
  const [done, setDone] = useState<number[]>(view.completed_phases);
  const [busy, setBusy] = useState<number | null>(null);
  const [docs, setDocs] = useState<Record<number, GeneratedDocument[]>>(() => {
    const m: Record<number, GeneratedDocument[]> = {};
    for (const d of documents) (m[d.phase_n] ??= []).push(d);
    return m;
  });
  const locked = view.status === "locked";

  const isDone = (n: number) => done.includes(n);
  const isCurrent = (n: number) =>
    !isDone(n) && view.definition.phases.filter((p) => p.n < n).every((p) => isDone(p.n));

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

  return (
    <div className="relative space-y-4 border-l-2 border-line pl-8">
      {view.definition.phases.map((p) => {
        const complete = isDone(p.n);
        const current = isCurrent(p.n) && !locked;
        const color = view.definition.color;
        return (
          <div key={p.n} className="relative">
            <span
              className="absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: complete ? "#0F6E56" : current ? color : "#cdd4cd" }}
            >
              {complete ? "✓" : p.n}
            </span>
            <div className={`card p-5 ${current ? "ring-2 ring-seal/30" : ""} ${complete ? "opacity-95" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-ink">{p.name}</h3>
                <ActorBadge actor={p.actor} />
              </div>
              <p className="mt-1 text-sm text-ink-soft">{p.summary}</p>
              <p className="mt-1 text-xs text-muted">{MODE_HINT[p.mode]}</p>

              <div className="mt-3 space-y-2">
                {p.documents.map((doc) => (
                  <DocumentTemplate
                    key={doc.name}
                    companyId={companyId}
                    workflowCode={view.definition.code}
                    phaseN={p.n}
                    color={color}
                    doc={doc}
                    company={company}
                    submitted={submitted[docKey(view.definition.code, doc.name)]}
                    generated={(docs[p.n] ?? []).find((g) => g.doc_type === doc.name)}
                    phaseComplete={complete}
                    onSubmitted={(r) => setDone(r.workflow.completed_phases)}
                  />
                ))}
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
          </div>
        );
      })}
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
  if (complete) {
    return <div className="mt-4 text-sm font-semibold text-teal">✓ Completed</div>;
  }
  if (locked) {
    return <p className="mt-4 text-xs text-muted">🔒 Locked until prerequisites are met.</p>;
  }
  if (!current) {
    return (
      <button disabled className="btn-ghost mt-4 cursor-not-allowed opacity-50">
        Complete the previous phase first
      </button>
    );
  }
  const generates = phase.actor !== "founder";
  return (
    <button onClick={onAct} disabled={busy} className={generates ? "btn-primary mt-4" : "btn-ghost mt-4"}>
      {busy ? (generates ? "Generating…" : "Saving…") : generates ? `⚡ ${phase.cta}` : `${phase.cta} ✓`}
    </button>
  );
}

function ActorBadge({ actor }: { actor: Actor }) {
  const b = ACTOR_BADGE[actor];
  return (
    <span className="badge" style={{ background: b.bg, color: b.fg }}>
      {b.icon} {b.label}
    </span>
  );
}

