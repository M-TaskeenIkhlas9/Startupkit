"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createCompany } from "@/lib/api";
import type { FounderIntake, IdeaAssessment, IdeaValidationAnswers, IntakeRequest, Stage } from "@/lib/types";

const STAGES: { value: Stage; label: string }[] = [
  { value: "pre-founder", label: "Pre-founder (just an idea)" },
  { value: "discovery", label: "Discovery / customer research" },
  { value: "problem-solution-fit", label: "Problem–solution fit" },
  { value: "mvp-build", label: "Building the MVP" },
  { value: "first-revenue", label: "First revenue" },
  { value: "pmf", label: "Product–market fit" },
  { value: "pre-seed", label: "Raising pre-seed" },
  { value: "series-a", label: "Series A" },
];

const STEPS = ["About you", "Company", "Formation", "Founders", "Fundraising"];
const emptyFounder = (): FounderIntake => ({ name: "", email: "", role: "Founder", equity_pct: 0 });

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<{ a: IdeaValidationAnswers; r: IdeaAssessment } | null>(null);

  const [form, setForm] = useState<IntakeRequest>({
    company_name: "",
    owner_email: "",
    one_liner: "",
    industry: "",
    stage: "mvp-build",
    jurisdiction: "US",
    entity_type: "c-corp",
    formation_status: "idea",
    website: "",
    ein: "",
    target_round: "pre-seed",
    target_amount_usd: 500000,
    founders: [emptyFounder()],
    founder_name: "",
    founder_background: "",
    founder_goals: "",
    risk_tolerance: "balanced",
    founder_experience: "first-time",
    time_commitment: "full-time",
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("sk_validation");
    if (!raw) return;
    try {
      const { answers, assessment } = JSON.parse(raw) as {
        answers: IdeaValidationAnswers;
        assessment: IdeaAssessment;
      };
      setValidated({ a: answers, r: assessment });
      setForm((f) => ({
        ...f,
        one_liner: answers.solution || f.one_liner,
        stage: (assessment.detected_stage as Stage) || f.stage,
        problem: answers.problem,
        customer: answers.customer,
        solution: answers.solution,
        readiness_score: assessment.readiness_score,
      }));
    } catch {
      /* ignore malformed */
    }
  }, []);

  const set = (patch: Partial<IntakeRequest>) => setForm((f) => ({ ...f, ...patch }));
  const setFounder = (i: number, patch: Partial<FounderIntake>) =>
    setForm((f) => ({
      ...f,
      founders: f.founders.map((fd, idx) => (idx === i ? { ...fd, ...patch } : fd)),
    }));

  const equityTotal = form.founders.reduce((s, f) => s + (Number(f.equity_pct) || 0), 0);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload: IntakeRequest = {
        ...form,
        website: form.website || null,
        ein: form.ein || null,
        founders: form.founders.map((f) => ({ ...f, equity_pct: Number(f.equity_pct) || 0 })),
      };
      const { company_id } = await createCompany(payload);
      sessionStorage.removeItem("sk_validation");
      router.push(`/company/${company_id}`);
    } catch (e) {
      setError(String(e));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <p className="eyebrow text-center">Step 2 · Build your Company Object</p>
      <h1 className="mb-6 mt-2 text-center text-3xl font-bold">A few details and you&apos;re live.</h1>

      {validated && (
        <div className="card mb-6 flex items-center gap-3 border-teal/30 bg-teal-50/60 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-white">✓</span>
          <p className="text-sm text-teal-900">
            Idea validated · detected stage{" "}
            <strong>{validated.r.detected_stage.replace(/-/g, " ")}</strong> · readiness{" "}
            <strong>{validated.r.readiness_score}/100</strong>. We&apos;ll carry this into your
            Company Object.
          </p>
        </div>
      )}

      <Steps step={step} />

      <div className="card mt-6 p-7">
        {step === 0 && (
          <Section title="About you">
            <Field label="Your name">
              <input
                className="field-input"
                value={form.founder_name ?? ""}
                onChange={(e) => set({ founder_name: e.target.value })}
                placeholder="Marcus Lee"
              />
            </Field>
            <Field label="Your background — relevant experience">
              <textarea
                className="field-input min-h-[64px] resize-none"
                value={form.founder_background ?? ""}
                onChange={(e) => set({ founder_background: e.target.value })}
                placeholder="10 years in warehouse robotics; previously led ops at…"
              />
            </Field>
            <Field label="Your goal with this company">
              <textarea
                className="field-input min-h-[64px] resize-none"
                value={form.founder_goals ?? ""}
                onChange={(e) => set({ founder_goals: e.target.value })}
                placeholder="Build a category-defining logistics AI company and raise a seed round."
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Risk tolerance">
                <select
                  className="field-input"
                  value={form.risk_tolerance ?? "balanced"}
                  onChange={(e) =>
                    set({
                      risk_tolerance: e.target.value as IntakeRequest["risk_tolerance"],
                    })
                  }
                >
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </Field>
              <Field label="Founder experience">
                <select
                  className="field-input"
                  value={form.founder_experience ?? "first-time"}
                  onChange={(e) =>
                    set({
                      founder_experience: e.target.value as IntakeRequest["founder_experience"],
                    })
                  }
                >
                  <option value="first-time">First-time founder</option>
                  <option value="some-experience">Some experience</option>
                  <option value="serial">Serial founder</option>
                </select>
              </Field>
            </div>
          </Section>
        )}

        {step === 1 && (
          <Section title="Tell us about the company">
            <Field label="Company name">
              <input className="field-input" value={form.company_name} onChange={(e) => set({ company_name: e.target.value })} placeholder="Acme AI, Inc." />
            </Field>
            <Field label="Your email">
              <input className="field-input" value={form.owner_email} onChange={(e) => set({ owner_email: e.target.value })} placeholder="you@company.com" />
            </Field>
            <Field label="One-liner — what do you do?">
              <input className="field-input" value={form.one_liner} onChange={(e) => set({ one_liner: e.target.value })} placeholder="AI co-pilot for warehouse logistics" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Industry">
                <input className="field-input" value={form.industry} onChange={(e) => set({ industry: e.target.value })} placeholder="logistics" />
              </Field>
              <Field label="Website (optional)">
                <input className="field-input" value={form.website ?? ""} onChange={(e) => set({ website: e.target.value })} placeholder="acme.ai" />
              </Field>
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="Where are you in formation?">
            <Field label="Current stage">
              <select className="field-input" value={form.stage} onChange={(e) => set({ stage: e.target.value as Stage })}>
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jurisdiction">
                <select className="field-input" value={form.jurisdiction} onChange={(e) => set({ jurisdiction: e.target.value as "US" | "PK" })}>
                  <option value="US">United States</option>
                  <option value="PK">Pakistan</option>
                </select>
              </Field>
              <Field label="Entity type">
                <select className="field-input" value={form.entity_type} onChange={(e) => set({ entity_type: e.target.value as "c-corp" | "llc" })}>
                  <option value="c-corp">Delaware C-Corp</option>
                  <option value="llc">LLC</option>
                </select>
              </Field>
            </div>
            <Field label="Formation status">
              <select className="field-input" value={form.formation_status} onChange={(e) => set({ formation_status: e.target.value as "idea" | "forming" | "formed" })}>
                <option value="idea">Not yet formed (just an idea)</option>
                <option value="forming">In progress</option>
                <option value="formed">Already incorporated</option>
              </select>
            </Field>
            {form.formation_status === "formed" && (
              <Field label="EIN (optional)">
                <input className="field-input" value={form.ein ?? ""} onChange={(e) => set({ ein: e.target.value })} placeholder="88-1234567" />
              </Field>
            )}
          </Section>
        )}

        {step === 3 && (
          <Section title="Who are the founders?">
            {form.founders.map((fd, i) => (
              <div key={i} className="rounded-xl border border-line p-4">
                <div className="grid grid-cols-2 gap-3">
                  <input className="field-input" value={fd.name} onChange={(e) => setFounder(i, { name: e.target.value })} placeholder="Name" />
                  <input className="field-input" value={fd.email} onChange={(e) => setFounder(i, { email: e.target.value })} placeholder="Email" />
                  <input className="field-input" value={fd.role} onChange={(e) => setFounder(i, { role: e.target.value })} placeholder="Role (CEO)" />
                  <input className="field-input" type="number" value={fd.equity_pct} onChange={(e) => setFounder(i, { equity_pct: Number(e.target.value) })} placeholder="Equity %" />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button className="text-sm font-semibold text-teal" onClick={() => set({ founders: [...form.founders, emptyFounder()] })}>
                + Add founder
              </button>
              <span className={`font-mono text-sm ${Math.abs(equityTotal - 100) < 0.01 ? "text-teal" : "text-amber"}`}>
                Equity total: {equityTotal}%
              </span>
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="Fundraising plans">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Target round">
                <select className="field-input" value={form.target_round ?? ""} onChange={(e) => set({ target_round: e.target.value })}>
                  <option value="">Not raising yet</option>
                  <option value="pre-seed">Pre-seed</option>
                  <option value="seed">Seed</option>
                  <option value="series-a">Series A</option>
                </select>
              </Field>
              <Field label="Target amount (USD)">
                <input className="field-input" type="number" value={form.target_amount_usd ?? 0} onChange={(e) => set({ target_amount_usd: Number(e.target.value) })} />
              </Field>
            </div>
            <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-900">
              On submit, StartupKit mints your <strong>Company Object</strong> (event-sourced &
              versioned), computes a baseline <strong>Health Score</strong>, and opens your
              workflows in the right order.
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
          </Section>
        )}

        <div className="mt-7 flex justify-between">
          <button className="btn-ghost disabled:opacity-40" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>
              Continue →
            </button>
          ) : (
            <button className="btn-primary" onClick={submit} disabled={submitting || !form.company_name}>
              {submitting ? "Creating…" : "Create Company Object →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Steps({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${i <= step ? "bg-teal text-white" : "bg-line text-muted"}`}>
            {i + 1}
          </div>
          <span className={`text-sm ${i <= step ? "text-ink" : "text-muted"}`}>{label}</span>
          {i < STEPS.length - 1 && <div className="h-px flex-1 bg-line" />}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
