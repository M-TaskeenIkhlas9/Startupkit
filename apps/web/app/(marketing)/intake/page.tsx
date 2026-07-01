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

const STEPS = ["Profile", "Company", "Formation", "Founders", "Ownership"];
const emptyFounder = (): FounderIntake => ({ name: "", email: "", role: "Founder", equity_pct: 0 });

// Phase 0 (per W1 spec): share structure, vesting, registered agent — captured before any document.
type Phase0 = {
  // C-Corp — stock
  authorized_shares: string;
  par_value: string;
  option_pool_pct: string;
  shares_issued: string;
  price_per_share: string;
  pool_shares_reserved: string;
  fmv_409a: string;
  // LLC — membership units
  total_units: string;
  units_issued: string;
  capital_contribution: string;
  management_structure: string;
  profits_interest_pct: string;
  units_reserved: string;
  tax_election: string;
  profit_loss_allocation: string;
  // shared
  vesting_years: string;
  cliff_months: string;
  acceleration: string;
  registered_agent: string;
  agent_address: string;
};
const parseNum = (s: string) => Number(String(s).replace(/[^0-9.]/g, "")) || 0;

// Delaware requires a corporate signifier in the legal name (Inc., Corp., LLC, Ltd., …).
const SIGNIFIERS = new Set([
  "inc", "corp", "corporation", "incorporated", "company", "co", "ltd", "limited", "llc", "llp",
  "lp", "pbc", "association", "foundation", "fund", "institute", "society", "syndicate", "union",
]);
const hasSignifier = (name: string): boolean =>
  name
    .toLowerCase()
    .replace(/\./g, "")
    .split(/\s+/)
    .some((w) => SIGNIFIERS.has(w));

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

  const [phase0, setPhase0] = useState<Phase0>({
    authorized_shares: "10,000,000",
    par_value: "$0.00001",
    option_pool_pct: "15",
    shares_issued: "8,500,000",
    price_per_share: "$0.00001",
    pool_shares_reserved: "1,500,000",
    fmv_409a: "$0.10",
    total_units: "10,000,000",
    units_issued: "8,500,000",
    capital_contribution: "$0.0001",
    management_structure: "member-managed",
    profits_interest_pct: "15",
    units_reserved: "1,500,000",
    tax_election: "pass-through",
    profit_loss_allocation: "pro-rata",
    vesting_years: "4",
    cliff_months: "12",
    acceleration: "double-trigger",
    registered_agent: "",
    agent_address: "",
  });
  const setP0 = (patch: Partial<Phase0>) => setPhase0((p) => ({ ...p, ...patch }));

  // Name availability — a preliminary check right here in onboarding (Delaware / trademark / domain).
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  async function checkNameAvailability() {
    const n = form.company_name
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\b(inc|llc|corp|co|the)\b/g, "")
      .trim();
    if (!n) return;
    setNameStatus("checking");
    await new Promise((r) => setTimeout(r, 700));
    const taken = "google apple stripe meta amazon microsoft openai uber airbnb tesla netflix spotify slack notion figma".split(
      " ",
    );
    setNameStatus(taken.some((t) => n.includes(t)) ? "taken" : "available");
  }

  useEffect(() => {
    const raw = sessionStorage.getItem("sk_validation");
    if (!raw) return;
    try {
      const { answers, assessment, reasoning, facts } = JSON.parse(raw) as {
        answers: IdeaValidationAnswers;
        assessment: IdeaAssessment;
        reasoning?: { verdict: string };
        facts?: Record<string, string>;
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
        cofounder_verdict: reasoning?.verdict ?? null,
        facts: facts ?? {},
      }));
    } catch {
      /* ignore malformed */
    }
  }, []);

  // W0 Assessment answers (the onboarding step after idea validation) — prefill + persist to facts.
  useEffect(() => {
    const raw = sessionStorage.getItem("sk_w0");
    if (!raw) return;
    try {
      const w0 = JSON.parse(raw) as {
        is_solo_founder: boolean;
        formation_mode: string;
        industry: string;
        state_of_operation: string;
      };
      setForm((f) => ({
        ...f,
        industry: w0.industry && w0.industry !== "Other / Not sure" ? w0.industry : f.industry,
        formation_status: w0.formation_mode === "import" ? "formed" : f.formation_status,
        facts: {
          ...f.facts,
          formation_mode: w0.formation_mode,
          state_of_operation: w0.state_of_operation,
          solo_founder: w0.is_solo_founder ? "yes" : "no",
        },
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
        // Phase 0 inputs persist onto the Company Object so W1 documents can be pre-filled.
        // The full entity-appropriate set (C-Corp stock or LLC units) is stored.
        facts: { ...(form.facts ?? {}), ...phase0, acceleration_clause: phase0.acceleration },
      };
      const { company_id } = await createCompany(payload);
      sessionStorage.removeItem("sk_validation");
      sessionStorage.removeItem("sk_w0");
      router.push(`/company/${company_id}/journey`);
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
          <Section title="Profile">
            <Field label="Your name">
              <input
                className="field-input"
                value={form.founder_name ?? ""}
                onChange={(e) => set({ founder_name: e.target.value })}
                placeholder="Marcus Lee"
              />
            </Field>
            <Field label="Your email">
              <input
                className="field-input"
                value={form.owner_email}
                onChange={(e) => set({ owner_email: e.target.value })}
                placeholder="you@company.com"
              />
            </Field>
            <Field label="Your goal for this company">
              <textarea
                className="field-input min-h-[64px] resize-none"
                value={form.founder_goals ?? ""}
                onChange={(e) => set({ founder_goals: e.target.value })}
                placeholder="Build a category-defining logistics AI company and raise a seed round."
              />
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
          </Section>
        )}

        {step === 1 && (
          <Section title="Tell us about the company">
            <div>
              <span className="field-label">Company name</span>
              <div className="flex gap-2">
                <input
                  className="field-input"
                  value={form.company_name}
                  onChange={(e) => {
                    set({ company_name: e.target.value });
                    setNameStatus("idle");
                  }}
                  placeholder="Acme AI, Inc."
                />
                <button
                  type="button"
                  onClick={checkNameAvailability}
                  disabled={!form.company_name.trim() || nameStatus === "checking"}
                  className="shrink-0 rounded-lg border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-seal hover:text-seal-ink disabled:opacity-40"
                >
                  {nameStatus === "checking" ? "Checking…" : "Check availability"}
                </button>
              </div>
              {nameStatus === "available" && (
                <p className="mt-1.5 text-xs text-teal">
                  ✓ Looks available — Delaware, trademark, and domain all clear (preliminary check).
                </p>
              )}
              {nameStatus === "taken" && (
                <p className="mt-1.5 text-xs text-amber">
                  ⚠ A well-known company uses a similar name — pick a more distinct one to avoid
                  trademark conflicts.
                </p>
              )}
              {form.company_name.trim() !== "" && !hasSignifier(form.company_name) && (
                <p className="mt-1.5 text-xs text-amber">
                  Delaware requires a corporate ending in the legal name — add one like{" "}
                  <strong>Inc.</strong>, <strong>Corp.</strong>, or <strong>LLC</strong>.
                </p>
              )}
            </div>
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
            {Math.abs(equityTotal - 100) >= 0.01 && (
              <p className="rounded-lg bg-[#F2E6C8] px-3 py-2 text-xs text-[#5E3F0E]">
                Equity across all founders must add up to exactly 100% before you continue — you&apos;re
                {equityTotal > 100 ? " over by " : " short by "}
                {Math.abs(100 - equityTotal)}%.
              </p>
            )}
          </Section>
        )}

        {step === 4 &&
          (() => {
            const isLLC = form.entity_type === "llc";
            const juris = form.jurisdiction === "US" ? "Delaware" : form.jurisdiction;
            const issued = parseNum(isLLC ? phase0.units_issued : phase0.shares_issued);
            const named = form.founders.filter((f) => f.name);
            const foundersBox = (
              <div className="rounded-xl border border-line bg-paper p-3">
                <p className="field-label">
                  {isLLC
                    ? "Founding member interest (after profits pool)"
                    : "Founder shares (from equity % after the option pool)"}
                </p>
                <div className="mt-1 space-y-1">
                  {named.length === 0 && (
                    <p className="text-xs text-muted">
                      Add founders on the previous step to see their {isLLC ? "units" : "shares"}.
                    </p>
                  )}
                  {named.map((f, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-ink">
                        {f.name} <span className="text-muted">· {f.equity_pct}%</span>
                      </span>
                      <span className="font-mono text-ink-soft">
                        {Math.round(((Number(f.equity_pct) || 0) / 100) * issued).toLocaleString()}{" "}
                        {isLLC ? "units" : "shares"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );

            return (
              <Section title="Ownership & vesting">
                <span
                  className="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                  style={
                    isLLC
                      ? { background: "#E4F1EB", color: "#0A3326" }
                      : { background: "#E6ECFB", color: "#1E3A8A" }
                  }
                >
                  {isLLC ? "LLC" : "C-Corp"} ({juris})
                </span>
                <p className="text-sm text-ink-soft">
                  {isLLC
                    ? "An LLC divides ownership into membership units and profit shares, not stock. These are the numbers your operating agreement is built from. We've pre-filled sensible defaults."
                    : "These are the numbers every formation document is built from — shares, price, and how founders earn their equity over time. We've pre-filled the startup standards."}
                </p>

                {isLLC ? (
                  <>
                    <p className="field-label pt-1">Membership structure</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Total membership units" hint="Total units authorized in the operating agreement.">
                        <input className="field-input" value={phase0.total_units} onChange={(e) => setP0({ total_units: e.target.value })} />
                      </Field>
                      <Field label="Units issued at formation" hint="Units granted to founding members now.">
                        <input className="field-input" value={phase0.units_issued} onChange={(e) => setP0({ units_issued: e.target.value })} />
                      </Field>
                      <Field label="Capital contribution / unit" hint="What each member pays in per unit.">
                        <input className="field-input" value={phase0.capital_contribution} onChange={(e) => setP0({ capital_contribution: e.target.value })} />
                      </Field>
                      <Field label="Management structure">
                        <select className="field-input" value={phase0.management_structure} onChange={(e) => setP0({ management_structure: e.target.value })}>
                          <option value="member-managed">Member-managed</option>
                          <option value="manager-managed">Manager-managed</option>
                        </select>
                      </Field>
                    </div>
                    {foundersBox}
                    <p className="field-label pt-1">Profits interest pool</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Profits interest %" hint="Reserved for employees / key contributors.">
                        <input className="field-input" type="number" value={phase0.profits_interest_pct} onChange={(e) => setP0({ profits_interest_pct: e.target.value })} />
                      </Field>
                      <Field label="Units reserved" hint="Profits-interest units, not capital units.">
                        <input className="field-input" value={phase0.units_reserved} onChange={(e) => setP0({ units_reserved: e.target.value })} />
                      </Field>
                      <Field label="Tax election" hint="How the LLC is taxed by the IRS.">
                        <select className="field-input" value={phase0.tax_election} onChange={(e) => setP0({ tax_election: e.target.value })}>
                          <option value="pass-through">Pass-through (default)</option>
                          <option value="c-corp-election">Taxed as C-Corp</option>
                          <option value="s-corp-election">Taxed as S-Corp</option>
                        </select>
                      </Field>
                      <Field label="Profit / loss allocation" hint="How profits and losses split among members.">
                        <select className="field-input" value={phase0.profit_loss_allocation} onChange={(e) => setP0({ profit_loss_allocation: e.target.value })}>
                          <option value="pro-rata">Pro-rata by units</option>
                          <option value="special">Special allocation</option>
                        </select>
                      </Field>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="field-label pt-1">Share structure</p>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Authorized shares">
                        <input className="field-input" value={phase0.authorized_shares} onChange={(e) => setP0({ authorized_shares: e.target.value })} />
                      </Field>
                      <Field label="Par value / share">
                        <input className="field-input" value={phase0.par_value} onChange={(e) => setP0({ par_value: e.target.value })} />
                      </Field>
                      <Field label="Option pool %">
                        <input className="field-input" type="number" value={phase0.option_pool_pct} onChange={(e) => setP0({ option_pool_pct: e.target.value })} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Shares issued at formation" hint="Founder common shares issued now.">
                        <input className="field-input" value={phase0.shares_issued} onChange={(e) => setP0({ shares_issued: e.target.value })} />
                      </Field>
                      <Field label="Price per share" hint="Purchase price founders pay, usually at par.">
                        <input className="field-input" value={phase0.price_per_share} onChange={(e) => setP0({ price_per_share: e.target.value })} />
                      </Field>
                    </div>
                    {foundersBox}
                    <p className="field-label pt-1">Option pool detail</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Pool shares reserved" hint="Set aside for future employees.">
                        <input className="field-input" value={phase0.pool_shares_reserved} onChange={(e) => setP0({ pool_shares_reserved: e.target.value })} />
                      </Field>
                      <Field label="409A / fair market value" hint="Sets option strike prices.">
                        <input className="field-input" value={phase0.fmv_409a} onChange={(e) => setP0({ fmv_409a: e.target.value })} />
                      </Field>
                    </div>
                  </>
                )}

                <p className="field-label pt-1">Vesting</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Vesting (years)">
                    <input className="field-input" type="number" value={phase0.vesting_years} onChange={(e) => setP0({ vesting_years: e.target.value })} />
                  </Field>
                  <Field label="Cliff (months)">
                    <input className="field-input" type="number" value={phase0.cliff_months} onChange={(e) => setP0({ cliff_months: e.target.value })} />
                  </Field>
                  <Field label="Acceleration">
                    <select className="field-input" value={phase0.acceleration} onChange={(e) => setP0({ acceleration: e.target.value })}>
                      <option value="double-trigger">Double-trigger (VC standard)</option>
                      <option value="single-trigger">Single-trigger</option>
                      <option value="none">None</option>
                    </select>
                  </Field>
                </div>

              </Section>
            );
          })()}

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-7 flex justify-between">
          <button className="btn-ghost disabled:opacity-40" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="btn-primary disabled:opacity-40"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 3 && Math.abs(equityTotal - 100) >= 0.01}
            >
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
