"use client";

import { useMemo, useState } from "react";
import { saveAssessment } from "@/lib/api";
import type { AModule } from "@/lib/assessment-catalog";

export function PhaseAssessment({
  companyId,
  phase,
  name,
  modules,
  initial,
}: {
  companyId: string;
  phase: number;
  name: string;
  modules: AModule[];
  initial: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = useMemo(
    () => modules.reduce((n, m) => n + m.questions.length, 0),
    [modules],
  );
  const done = Object.values(answers).filter((v) => v && v.trim()).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const set = (id: string, v: string) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setSaved(false);
  };

  async function save() {
    setBusy(true);
    try {
      await saveAssessment(companyId, phase, answers);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      {modules.map((m, mi) => (
        <section key={m.title} className="grid gap-6 md:grid-cols-[180px,1fr]">
          {/* module rail */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                Module {String(mi + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-disp text-lg font-bold text-ink">{m.title}</h3>
              <p className="mt-1 text-xs text-ink-soft">{m.obj}</p>
              {m.output && (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-teal">
                  → {m.output}
                </p>
              )}
            </div>
          </div>

          {/* questions */}
          <ol className="space-y-3">
            {m.questions.map((q) => (
              <li key={q.id} className="card p-4">
                <div className="flex gap-3">
                  <span className="font-mono text-xs font-bold text-teal">{q.n}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{q.q}</p>
                    {q.opts.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {q.opts.map((o) => {
                          const active = answers[q.id] === o;
                          return (
                            <button
                              key={o}
                              type="button"
                              onClick={() => set(q.id, active ? "" : o)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                active
                                  ? "border-teal bg-teal-50 text-teal-900"
                                  : "border-line bg-white text-ink-soft hover:border-teal/50"
                              }`}
                            >
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        className="field-input mt-2"
                        value={answers[q.id] ?? ""}
                        onChange={(e) => set(q.id, e.target.value)}
                        placeholder="Your answer…"
                      />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {/* sticky save bar */}
      <div className="sticky bottom-4 z-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-line bg-panel/95 px-5 py-3 shadow-lift backdrop-blur">
          <div className="flex-1">
            <div className="flex justify-between font-mono text-[11px] text-muted">
              <span>
                Phase {phase} · {name}
              </span>
              <span>
                {done}/{total} · {pct}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded bg-line">
              <div className="h-1.5 rounded bg-teal transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button onClick={save} disabled={busy} className="btn-primary shrink-0">
            {busy ? "Saving…" : saved ? "Saved ✓" : "Save answers"}
          </button>
        </div>
      </div>
    </div>
  );
}
