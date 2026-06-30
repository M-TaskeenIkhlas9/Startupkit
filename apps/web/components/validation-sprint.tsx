"use client";

import { useState } from "react";

const VERDICT_COLOR: Record<string, string> = {
  "strong-go": "#1F9D57",
  promising: "#2536E8",
  "needs-work": "#D9842A",
  pivot: "#B23A2E",
};

export type SprintReport = {
  reply: string;
  verdict: string;
  nextSteps: string[];
  riskiest: string;
};

export function ValidationSprint({
  idea,
  verdict,
  nextSteps,
  riskiest,
  onReport,
  onBuild,
}: {
  idea: { problem: string; customer: string; solution: string };
  verdict: string;
  nextSteps: string[];
  riskiest: string;
  onReport: (results: string) => Promise<SprintReport>;
  onBuild: () => void;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => nextSteps.map(() => false));
  const [risk, setRisk] = useState(riskiest);
  const [v, setV] = useState(verdict);
  const [report, setReport] = useState("");
  const [busy, setBusy] = useState(false);
  const [evidence, setEvidence] = useState<{ reply: string; verdict: string } | null>(null);

  const done = checked.filter(Boolean).length;
  const pct = nextSteps.length ? Math.round((done / nextSteps.length) * 100) : 0;
  const color = VERDICT_COLOR[v] ?? "#2536E8";
  const hasSignal = done >= Math.ceil(nextSteps.length / 2) || evidence !== null;

  async function submit() {
    if (!report.trim() || busy) return;
    setBusy(true);
    try {
      const r = await onReport(report);
      setEvidence({ reply: r.reply, verdict: r.verdict || v });
      if (r.verdict) setV(r.verdict);
      if (r.riskiest) setRisk(r.riskiest);
      setReport("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up space-y-5">
      <div className="text-center">
        <p className="eyebrow">Step 2 · Validation Sprint</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Prove it before you build.</h1>
        <p className="mx-auto mt-3 max-w-lg text-ink-soft">
          Your co-founder has heard enough. Now go get real evidence — then report back and we&apos;ll
          re-score the idea on what actually happened, not on hope.
        </p>
      </div>

      {/* verdict + idea */}
      <div className="card flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Working idea</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">{idea.solution}</p>
          <p className="truncate text-xs text-muted">for {idea.customer}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
          style={{ background: `${color}1a`, color }}
        >
          {v.replace("-", " ")}
        </span>
      </div>

      {/* the one thing to prove */}
      <div className="card border-l-4 p-5" style={{ borderLeftColor: color }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          🎯 The one thing to prove
        </p>
        <p className="mt-2 text-lg font-semibold leading-snug text-ink">
          {risk || "That your target customer feels this pain strongly enough to pay for a fix."}
        </p>
      </div>

      {/* this week's moves — tracked checklist */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">This week&apos;s moves</h2>
          <span className="font-mono text-xs text-muted">
            {done}/{nextSteps.length} done
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <ul className="mt-4 space-y-2">
          {nextSteps.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => setChecked((c) => c.map((x, j) => (j === i ? !x : x)))}
                className="flex w-full items-start gap-3 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-left transition hover:border-teal/50"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                    checked[i]
                      ? "border-teal bg-teal text-white"
                      : "border-line text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span
                  className={`text-sm ${checked[i] ? "text-muted line-through" : "text-ink"}`}
                >
                  {s}
                </span>
              </button>
            </li>
          ))}
          {nextSteps.length === 0 && (
            <li className="text-sm text-ink-soft">
              Talk to 10 target customers and get 3 to commit to paying.
            </li>
          )}
        </ul>
      </div>

      {/* report what you learned -> re-score */}
      <div className="card p-5">
        <h2 className="font-semibold text-ink">Report what you learned</h2>
        <p className="mt-1 text-xs text-muted">
          Tell your co-founder what happened — who you talked to, what they said, who&apos;d pay. It
          re-scores the verdict on real evidence.
        </p>
        <textarea
          className="field-input mt-3 min-h-[84px] resize-none"
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="e.g. Talked to 12 founders. 5 said they'd pay $50/mo. 2 asked for early access…"
        />
        <button onClick={submit} disabled={busy || !report.trim()} className="btn-primary mt-3 w-full">
          {busy ? "Re-scoring on your evidence…" : "Update my verdict →"}
        </button>

        {evidence && (
          <div className="mt-4 rounded-xl border border-line bg-paper p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Co-founder&apos;s read on your evidence
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  background: `${VERDICT_COLOR[evidence.verdict] ?? color}1a`,
                  color: VERDICT_COLOR[evidence.verdict] ?? color,
                }}
              >
                {evidence.verdict.replace("-", " ")}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink">{evidence.reply}</p>
          </div>
        )}
      </div>

      {/* gated build */}
      <div className="card p-5">
        <button onClick={onBuild} className="btn-seal w-full">
          Build my Company Object →
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          {hasSignal
            ? "You've got signal — time to set up the company so legal, equity & fundraising are ready."
            : "Tip: legal & ops (incorporation, 83(b), cap table) unlock here, but only run them once you have real signal or a co-founder to split equity with — don't rush paperwork."}
        </p>
      </div>
    </div>
  );
}
