"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { completePhase, generatePhase } from "@/lib/api";
import type { Actor, DocumentDef, DocumentRecord, GeneratedDocument, Phase, WorkflowView } from "@/lib/types";

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
}: {
  companyId: string;
  view: WorkflowView;
  documents: DocumentRecord[];
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
                  <DocumentRow key={doc.name} doc={doc} done={complete} />
                ))}
              </div>

              {docs[p.n]?.length ? <GeneratedList docs={docs[p.n]} /> : null}

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

function GeneratedList({ docs }: { docs: GeneratedDocument[] }) {
  return (
    <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
      <p className="rule mb-2 text-teal-900">Generated documents · {docs.length}</p>
      <div className="space-y-2">
        {docs.map((d) => (
          <details key={d.doc_id} className="group rounded-lg border border-line bg-panel">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <span>📄</span>
                {d.doc_type}
              </span>
              <span className="flex items-center gap-2">
                {d.status === "pending-review" ? (
                  <span className="badge bg-seal-soft text-seal-ink">pending review</span>
                ) : (
                  <span className="badge bg-teal-50 text-teal-900">draft</span>
                )}
                <span className="font-mono text-xs text-muted group-open:rotate-180">▾</span>
              </span>
            </summary>
            <div className="border-t border-line px-3 py-3">
              {d.issues.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {d.issues.map((i) => (
                    <li key={i} className="text-xs text-amber">
                      ⚠ {i}
                    </li>
                  ))}
                </ul>
              )}
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-paper p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                {d.body}
              </pre>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
                {d.doc_id} · v{d.version}
              </p>
            </div>
          </details>
        ))}
      </div>
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

function DocumentRow({ doc, done }: { doc: DocumentDef; done: boolean }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${
        doc.critical ? "border-fuse/40 bg-[#F8EAE8]" : "border-line bg-paper"
      }`}
    >
      <span className="mt-0.5 text-sm">{done ? "✅" : doc.critical ? "🔴" : "📄"}</span>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">{doc.name}</span>
          {!doc.required && <span className="font-mono text-[10px] uppercase text-muted">optional</span>}
          {doc.critical && (
            <span className="font-mono text-[10px] font-bold uppercase text-fuse">critical fuse</span>
          )}
        </div>
        {doc.note && <p className="mt-0.5 text-xs text-muted">{doc.note}</p>}
      </div>
    </div>
  );
}
