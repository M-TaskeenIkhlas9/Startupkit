"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { validateIdea } from "@/lib/api";
import type { IdeaAssessment, IdeaValidationAnswers } from "@/lib/types";

type Opt<T extends string> = { value: T; label: string };

const Q = {
  conversations: [
    { value: "none", label: "None yet" },
    { value: "1-5", label: "1–5" },
    { value: "5-20", label: "5–20" },
    { value: "20+", label: "20+" },
  ] as Opt<IdeaValidationAnswers["customer_conversations"]>[],
  evidence: [
    { value: "assumption", label: "Just a hunch" },
    { value: "some-signal", label: "Some signal" },
    { value: "strong-evidence", label: "Strong evidence" },
  ] as Opt<IdeaValidationAnswers["problem_evidence"]>[],
  willingness: [
    { value: "no-signal", label: "No signal" },
    { value: "interest", label: "Some interest" },
    { value: "verbal-commit", label: "Verbal yes" },
    { value: "loi-or-paying", label: "LOI / paying" },
  ] as Opt<IdeaValidationAnswers["willingness_to_pay"]>[],
  market: [
    { value: "niche", label: "Niche" },
    { value: "growing", label: "Growing" },
    { value: "large", label: "Large" },
    { value: "massive", label: "Massive" },
  ] as Opt<IdeaValidationAnswers["market_size"]>[],
  differentiation: [
    { value: "me-too", label: "Similar to others" },
    { value: "some-edge", label: "Some edge" },
    { value: "strong-moat", label: "Strong moat" },
  ] as Opt<IdeaValidationAnswers["differentiation"]>[],
  founderFit: [
    { value: "exploring", label: "New to it" },
    { value: "some-domain", label: "Some experience" },
    { value: "deep-expertise", label: "Deep expertise" },
  ] as Opt<IdeaValidationAnswers["founder_market_fit"]>[],
  mvp: [
    { value: "none", label: "No product" },
    { value: "building", label: "Building it" },
    { value: "shipped", label: "Shipped" },
  ] as Opt<IdeaValidationAnswers["mvp_status"]>[],
  revenue: [
    { value: "none", label: "None" },
    { value: "pilots", label: "Pilots" },
    { value: "paying", label: "Paying" },
  ] as Opt<IdeaValidationAnswers["revenue_status"]>[],
  team: [
    { value: "solo", label: "Solo" },
    { value: "cofounders", label: "Co-founders" },
  ] as Opt<IdeaValidationAnswers["team"]>[],
  goal: [
    { value: "lifestyle", label: "Profitable / lifestyle" },
    { value: "vc-scale", label: "VC-scale" },
  ] as Opt<IdeaValidationAnswers["goal"]>[],
  commitment: [
    { value: "exploring", label: "Exploring" },
    { value: "part-time", label: "Part-time" },
    { value: "full-time", label: "Full-time" },
  ] as Opt<IdeaValidationAnswers["commitment"]>[],
};

export default function ValidatePage() {
  const router = useRouter();
  const [a, setA] = useState<IdeaValidationAnswers>({
    problem: "",
    customer: "",
    solution: "",
    customer_conversations: "none",
    problem_evidence: "assumption",
    willingness_to_pay: "no-signal",
    market_size: "growing",
    differentiation: "some-edge",
    founder_market_fit: "exploring",
    mvp_status: "none",
    revenue_status: "none",
    team: "solo",
    goal: "vc-scale",
    commitment: "exploring",
  });
  const [result, setResult] = useState<IdeaAssessment | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<IdeaValidationAnswers>) => setA((s) => ({ ...s, ...p }));

  async function run() {
    setBusy(true);
    try {
      setResult(await validateIdea(a));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  function proceed() {
    sessionStorage.setItem("sk_validation", JSON.stringify({ answers: a, assessment: result }));
    router.push("/intake");
  }

  if (result) {
    return <Result a={a} r={result} onProceed={proceed} onBack={() => setResult(null)} />;
  }

  const canRun = a.problem.trim() && a.customer.trim() && a.solution.trim();

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <p className="eyebrow text-center">Step 1 · Validate your idea</p>
      <h1 className="mt-2 text-center text-4xl font-bold">Let&apos;s pressure-test the idea.</h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-ink-soft">
        Before you spend a dollar incorporating, StartupKit detects your stage, scores your
        readiness, and flags the risks that kill startups early.
      </p>

      <div className="card mt-8 space-y-6 p-7">
        <Field label="What problem are you solving?">
          <textarea
            className="field-input min-h-[72px] resize-none"
            value={a.problem}
            onChange={(e) => set({ problem: e.target.value })}
            placeholder="Warehouses lose hours every day to manual pick-route planning…"
          />
        </Field>
        <Field label="Who has this problem? (your customer)">
          <input
            className="field-input"
            value={a.customer}
            onChange={(e) => set({ customer: e.target.value })}
            placeholder="Ops managers at mid-size 3PL warehouses"
          />
        </Field>
        <Field label="What's your solution?">
          <textarea
            className="field-input min-h-[72px] resize-none"
            value={a.solution}
            onChange={(e) => set({ solution: e.target.value })}
            placeholder="AI that generates optimal pick paths from the existing WMS…"
          />
        </Field>

        <div className="h-px bg-line" />

        <Segmented label="How many potential customers have you talked to?" opts={Q.conversations} value={a.customer_conversations} onChange={(v) => set({ customer_conversations: v })} />
        <Segmented label="How sure are you the problem is real?" opts={Q.evidence} value={a.problem_evidence} onChange={(v) => set({ problem_evidence: v })} />
        <Segmented label="Have customers signaled they'd pay?" opts={Q.willingness} value={a.willingness_to_pay} onChange={(v) => set({ willingness_to_pay: v })} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Segmented label="How big is the market?" opts={Q.market} value={a.market_size} onChange={(v) => set({ market_size: v })} />
          <Segmented label="How differentiated are you?" opts={Q.differentiation} value={a.differentiation} onChange={(v) => set({ differentiation: v })} />
        </div>
        <Segmented label="What's your edge in this space?" opts={Q.founderFit} value={a.founder_market_fit} onChange={(v) => set({ founder_market_fit: v })} />
        <Segmented label="Do you have a product yet?" opts={Q.mvp} value={a.mvp_status} onChange={(v) => set({ mvp_status: v })} />
        <Segmented label="Any revenue?" opts={Q.revenue} value={a.revenue_status} onChange={(v) => set({ revenue_status: v })} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Segmented label="Team" opts={Q.team} value={a.team} onChange={(v) => set({ team: v })} />
          <Segmented label="Ambition" opts={Q.goal} value={a.goal} onChange={(v) => set({ goal: v })} />
        </div>
        <Segmented label="Your commitment" opts={Q.commitment} value={a.commitment} onChange={(v) => set({ commitment: v })} />
      </div>

      <button onClick={run} disabled={!canRun || busy} className="btn-primary mt-6 w-full">
        {busy ? "Analyzing…" : "Analyze my idea →"}
      </button>
    </div>
  );
}

function Result({
  a,
  r,
  onProceed,
  onBack,
}: {
  a: IdeaValidationAnswers;
  r: IdeaAssessment;
  onProceed: () => void;
  onBack: () => void;
}) {
  const verdictColor =
    r.verdict === "promising" ? "#0F6E56" : r.verdict === "needs-validation" ? "#B5780F" : "#A32D2D";
  const formNow = r.recommendation.action === "form-now";

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-7">
      <button onClick={onBack} className="font-mono text-xs text-muted hover:text-teal">
        ← Edit answers
      </button>

      <div className="card overflow-hidden p-0">
        <div className="grid gap-6 p-7 sm:grid-cols-[auto,1fr] sm:items-center" style={{ background: `linear-gradient(135deg, ${verdictColor}0d, #fff 70%)` }}>
          <Ring score={r.readiness_score} color={verdictColor} />
          <div>
            <p className="eyebrow" style={{ color: verdictColor }}>
              {r.verdict.replace("-", " ")} · readiness {r.readiness_score}/100
            </p>
            <h1 className="mt-1 text-3xl font-bold">{r.recommendation.headline}</h1>
            <p className="mt-2 text-ink-soft">{r.recommendation.detail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">detected stage · {r.detected_stage.replace(/-/g, " ")}</span>
              <span className="chip">{a.team}</span>
              <span className="chip">{a.goal.replace("-", " ")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Validation signals</h2>
          <div className="space-y-3.5">
            {r.signals.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-ink">{s.label}</span>
                  <span className="font-mono text-xs text-muted">{s.score}/100</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded bg-line">
                  <div className="h-1.5 rounded bg-teal transition-all" style={{ width: `${s.score}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted">{s.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Risks & flags</h2>
          {r.risks.length === 0 ? (
            <p className="text-sm text-ink-soft">No major red flags. Strong start. ✅</p>
          ) : (
            <div className="space-y-3">
              {r.risks.map((risk) => (
                <div key={risk.title} className="rounded-xl border border-line bg-paper p-3">
                  <div className="flex items-center gap-2">
                    <RiskDot level={risk.level} />
                    <span className="text-sm font-semibold text-ink">{risk.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{risk.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card flex flex-col items-center gap-4 p-7 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h3 className="text-lg font-semibold">
            {formNow ? "Ready to build your Company Object" : "You can still proceed"}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {formNow
              ? "We'll carry this into your Company Object and open W1 — Business Formation."
              : "We recommend more validation, but you can set up your Company Object now and revisit W1 when ready."}
          </p>
        </div>
        <button onClick={onProceed} className="btn-primary whitespace-nowrap">
          Build Company Object →
        </button>
      </div>
    </div>
  );
}

function Ring({ score, color }: { score: number; color: string }) {
  const angle = (score / 100) * 360;
  return (
    <div
      className="flex h-28 w-28 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${color} ${angle}deg, #EAEFEA ${angle}deg)` }}
    >
      <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-panel">
        <span className="text-3xl font-bold text-ink">{score}</span>
        <span className="font-mono text-[10px] text-muted">readiness</span>
      </div>
    </div>
  );
}

function RiskDot({ level }: { level: "high" | "medium" | "info" }) {
  const c = level === "high" ? "#A32D2D" : level === "medium" ? "#B5780F" : "#185FA5";
  return <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function Segmented<T extends string>({
  label,
  opts,
  value,
  onChange,
}: {
  label: string;
  opts: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "border-teal bg-teal-50 text-teal-900"
                  : "border-line bg-white text-ink-soft hover:border-teal/50"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
