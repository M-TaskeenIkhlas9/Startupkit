"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { savePeople } from "@/lib/api";
import type { Employee, HiringRole, PeopleState, WorkflowView } from "@/lib/types";

// W6 · People & HR — a faithful, production build of the finalized "Build your team" flow.
// The prototype's typography (Fraunces + IBM Plex, scoped via .w6-root in globals.css) and design,
// rebuilt as typed React. The hiring plan, roster, and step progress persist to the Company Object
// (people.state.set) via savePeople; ephemeral drafts (job posts, poster, offer text) stay local.
const W6 = "#0E7C6B";
const W6_SOFT = "#0E7C6B14";

type Bottleneck = {
  key: string; label: string; role?: string; reason?: string;
  urgency?: number; impact?: number; founders?: number;
  timing?: string; salary?: string; equity?: string; dept?: string; reportsTo?: string; goal?: string;
  other?: boolean;
};
const BOTTLENECKS: Bottleneck[] = [
  { key: "build", label: "We can't build fast enough", role: "Founding Engineer", dept: "Engineering", reportsTo: "CTO (Founder)", goal: "Ship the product roadmap on schedule", reason: "Product delivery is the constraint right now — until you can ship faster, sales and marketing hires won't have anything new to sell.", urgency: 9, impact: 9, founders: 3, timing: "Within the next 2–4 weeks", salary: "$130k–$170k", equity: "0.5–1.5%" },
  { key: "customers", label: "We have a product but can't get customers", role: "Growth Marketer", dept: "Marketing", reportsTo: "CEO (Founder)", goal: "Acquire first 1,000 users", reason: "You have something to sell but no reliable acquisition engine — this is a distribution problem, not a product problem.", urgency: 8, impact: 8, founders: 4, timing: "Within the next 30 days", salary: "$90k–$120k", equity: "0.25–0.75%" },
  { key: "churn", label: "Customers are leaving", role: "Customer Success Manager", dept: "Customer Success", reportsTo: "CEO (Founder)", goal: "Reduce monthly churn", reason: "Retention problems compound — every dollar spent acquiring customers now leaks back out. Fix the leak before pouring in more.", urgency: 9, impact: 8, founders: 5, timing: "Within the next 2–3 weeks", salary: "$75k–$100k", equity: "0.1–0.4%" },
  { key: "overwhelmed", label: "Founders are overwhelmed", role: "Operations Manager / Chief of Staff", dept: "Operations", reportsTo: "CEO (Founder)", goal: "Absorb day-to-day operational load", reason: "When founders are buried in execution, high-leverage work like fundraising and strategy stalls. You need someone absorbing operational load.", urgency: 7, impact: 7, founders: 2, timing: "Within the next 4–6 weeks", salary: "$85k–$115k", equity: "0.2–0.6%" },
  { key: "support", label: "Too much support work", role: "Support Specialist", dept: "Customer Success", reportsTo: "Head of Product", goal: "Keep response times under 24 hours", reason: "Support volume is a signal of real adoption — good news — but it's pulling engineering or founder time away from building.", urgency: 6, impact: 6, founders: 6, timing: "Within the next 4–8 weeks", salary: "$45k–$65k", equity: "0–0.15%" },
  { key: "raising", label: "We're raising money", role: "Fractional CFO (contractor)", dept: "Finance", reportsTo: "CEO (Founder)", goal: "Build the financial model and data room", reason: "Fundraising is a founder-led motion — a full-time hire can wait. A fractional finance hire can build the model and data room so you're not doing it solo.", urgency: 5, impact: 6, founders: 7, timing: "Consider a contractor now; delay full-time hiring until after the round closes", salary: "$150–$250/hr (contract)", equity: "None (contractor)" },
  { key: "other", label: "Something else", other: true },
];
const ROADMAP = ["Founder", "Engineering", "Product", "Sales", "Marketing", "Operations", "HR"];
const ROLE_DRAFTS: Record<string, { li: string; wf: string; sf: string }> = {
  "Founding Engineer": { li: "We're building the operating system for early-stage logistics teams. As one of our first engineering hires, you'll shape the core product alongside our two co-founders — no layers, no legacy code, real ownership from day one. You'll ship things customers use within your first week. 0.5–1.5% equity, competitive salary, remote-friendly.", wf: "🚀 Pre-seed, 2 co-founders, real customers already using v1. Looking for someone who wants meaningful equity and real influence over what gets built. Equity: 0.5–1.5% · Remote-friendly · Fast-moving", sf: "We're a 2-person team building something real. Looking for engineer #1 — meaningful equity, real ownership. DM if curious." },
  "Product Designer": { li: "We're building the operating system for early-stage logistics teams, and our product doesn't have a dedicated design voice yet — that's you. You'll shape the brand, the UI, and how the whole thing feels, working directly with our two co-founders. 0.5–1% equity, competitive salary, remote-friendly.", wf: "🎨 Pre-seed, 2 co-founders, real customers already using v1. First design hire — you'll define the visual language and product experience. Equity: 0.5–1% · Remote-friendly", sf: "We're a 2-person team building something real. Looking for our first designer — real creative ownership. DM if curious." },
  "Growth Marketer": { li: "We're building the operating system for early-stage logistics teams and just getting our GTM engine started. You'll own acquisition experiments end to end, working directly with our two co-founders. 0.25–0.75% equity, competitive salary, remote-friendly.", wf: "📈 Pre-seed, 2 co-founders, real customers already using v1. Looking for someone who wants to build the growth playbook from scratch. Equity: 0.25–0.75% · Remote-friendly", sf: "We're a 2-person team building something real. Looking for our first growth hire — real ownership over acquisition. DM if curious." },
};
const EQUITY_BY_ROLE: Record<string, string> = { "Founding Engineer": "1.00%", "Product Designer": "0.75%", "Growth Marketer": "0.50%" };
const POSTER_THEMES: Record<string, { bg: string; accent: string; label: string }> = {
  teal: { bg: "#17222B", accent: "#0E7C6B", label: "Teal" },
  amber: { bg: "#2A2318", accent: "#B8802A", label: "Amber" },
  blue: { bg: "#17222B", accent: "#2C6E9E", label: "Blue" },
};
function equityRange(role: string) {
  if (role === "Founding Engineer") return "0.5-1.5% equity";
  if (role === "Product Designer") return "0.5-1% equity";
  if (role === "Growth Marketer") return "0.25-0.75% equity";
  return "Meaningful equity";
}
const DOC_TYPES = [
  { key: "piia", abbr: "PIIA" }, { key: "nda", abbr: "NDA" }, { key: "ipa", abbr: "IPA" },
  { key: "atwill", abbr: "At-Will" }, { key: "handbook", abbr: "Handbook" }, { key: "arbitration", abbr: "Arbitration" },
];
const PROVIDERS = [
  { name: "Gusto", note: "US-only team, simplest setup" },
  { name: "Rippling", note: "Want HR & IT tools bundled in later" },
  { name: "Deel", note: "Any international contractors or employees" },
];
const POST_TARGETS = [
  { name: "LinkedIn", note: "Broad reach, any role", cta: "Open ↗" },
  { name: "Wellfound", note: "Startup-native candidates, comfortable with equity", cta: "Open ↗" },
  { name: "Braintrust", note: "Vetted contractor & freelance talent", cta: "Open ↗" },
  { name: "Want a human to run this?", note: "Connect with a recruiter from our partner network", cta: "Connect ↗" },
];
const TIERS = [
  { name: "Full Access", desc: "Sees and edits everything — cap table, legal docs, financials, every module. For a co-founder or CTO/CFO-level hire." },
  { name: "Module Access", desc: "Sees and edits only assigned modules — e.g. an engineer gets W4 only. Everything else stays hidden, not just read-only." },
  { name: "View Only", desc: "Sees high-level status and progress, but can't open underlying documents or financials. A safe early default." },
  { name: "No Access", desc: "Not on the platform. Fine for most early hourly or contract hires." },
];
const STEPS = [
  { n: 1, name: "Plan your hiring", ev: "plan.mapped" },
  { n: 2, name: "Find candidates", ev: "sourcing.started" },
  { n: 3, name: "Make an offer", ev: "offer.sent" },
  { n: 4, name: "Employee onboarding", ev: "onboarding.received" },
  { n: 5, name: "Set up payroll", ev: "payroll.configured" },
  { n: 6, name: "Employee access", ev: "access.assigned" },
];

function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}
function newRole(p: Partial<HiringRole> = {}): HiringRole {
  return {
    id: String(Date.now() + Math.random()), title: p.title ?? "", dept: p.dept ?? "",
    reports_to: p.reports_to ?? "", priority: p.priority ?? "High", goal: p.goal ?? "",
    why_not_founders: "", hours_lost: "", revenue_unlocked: "", hire_type: "Employee",
    full_time: "Yes", remote: "Remote", budget: p.budget ?? "", start_date: "",
  };
}

// ============================ shared UI ========================================================
const ghost = "rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition hover:border-ink/30";
const input = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--w6c)]";
const hint = "mb-3 text-xs text-muted";
function Card({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 rounded-xl border border-line bg-white p-5">{children}</div>;
}
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="w6-mono mb-1 text-xs font-semibold uppercase tracking-wide text-ink">{children}</h3>
);
function Head({ title, badges, desc }: { title: string; badges: [string, string][]; desc: string }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="w6-display text-2xl font-semibold text-ink">{title}</h2>
        <div className="flex gap-2">
          {badges.map(([k, t]) => (
            <span key={t} className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={k === "ai" ? { background: "#F4E9DD", color: "#8A5A24" } : { background: W6_SOFT, color: W6 }}>{t}</span>
          ))}
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">{desc}</p>
    </div>
  );
}
function Attest({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4"
      style={{ borderColor: checked ? W6 : "#d7dcda", background: checked ? W6_SOFT : "transparent" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm font-semibold text-ink">{label}</span>
    </label>
  );
}

// ============================ root =============================================================
export function W6Workflow({
  companyId, companyName, initialPeople, view,
}: {
  companyId: string; companyName: string; initialPeople?: PeopleState; view: WorkflowView;
}) {
  void view;
  const [step, setStep] = useState(1);
  const [roles, setRoles] = useState<HiringRole[]>(initialPeople?.roles ?? []);
  const [employees, setEmployees] = useState<Employee[]>(initialPeople?.employees ?? []);
  const [done, setDone] = useState<number[]>(initialPeople?.done_steps ?? []);
  const [saved, setSaved] = useState(true);

  // debounced auto-save of the persistent state (roles, roster, step progress)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaved(false);
    const t = setTimeout(() => {
      savePeople(companyId, { roles, employees, done_steps: done })
        .then(() => setSaved(true))
        .catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [companyId, roles, employees, done]);

  const setStepDone = (n: number, v: boolean) =>
    setDone((d) => (v ? Array.from(new Set([...d, n])) : d.filter((x) => x !== n)));

  return (
    <div className="w6-root" style={{ ["--w6c" as string]: W6 }}>
      <div className="mb-5 rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w6-mono text-[11px] font-semibold uppercase tracking-widest" style={{ color: W6 }}>W6 · People &amp; HR</span>
          <div className="flex items-center gap-3">
            <span className="w6-mono text-xs text-muted">{saved ? "All changes saved" : "Saving…"}</span>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-paper">
              <div className="h-full rounded-full transition-all" style={{ width: `${(done.length / 6) * 100}%`, background: W6 }} />
            </div>
            <span className="w6-mono text-xs text-muted">{done.length} / 6</span>
          </div>
        </div>
        <h1 className="w6-display mt-2 text-3xl font-semibold text-ink">Build your team</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          {"From here, we'll guide you through planning who to hire, finding your first hire, getting their paperwork and payroll sorted, and deciding what they can see inside StartupKit — you stay in control, we just make sure nothing gets missed."}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          {STEPS.map((s) => {
            const on = step === s.n, ok = done.includes(s.n);
            return (
              <button key={s.n} onClick={() => setStep(s.n)} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition"
                style={{ background: on ? W6_SOFT : "transparent" }}>
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: ok || on ? W6 : "#d7dcda", color: ok || on ? "#fff" : "#5b6b60" }}>{ok ? "✓" : s.n}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold" style={{ color: on ? W6 : "#243530" }}>{s.name}</span>
                  <span className="w6-mono block text-[10px] text-muted">{s.ev}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          {step === 1 && <StepPlan roles={roles} setRoles={setRoles} done={done.includes(1)} setDone={(v) => setStepDone(1, v)} onNext={() => setStep(2)} />}
          {step === 2 && <StepFind companyName={companyName} done={done.includes(2)} setDone={(v) => setStepDone(2, v)} />}
          {step === 3 && <StepOffer companyName={companyName} />}
          {step === 4 && <StepOnboard companyName={companyName} employees={employees} setEmployees={setEmployees} />}
          {step === 5 && <StepPayroll employees={employees} done={done.includes(5)} setDone={(v) => setStepDone(5, v)} />}
          {step === 6 && <StepAccess employees={employees} setEmployees={setEmployees} />}
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted">
        {"Sourcing and payroll are guide-only with AI-drafted content and partner recommendations; employee legal docs run through the same e-signature system as W1/W2, and access tiers are a permission layer on top of the existing RBAC model. Founder-level docs and vesting review live in W1/W2."}
      </p>
    </div>
  );
}

// ============================ Step 1: Plan =====================================================
function StepPlan({ roles, setRoles, done, setDone, onNext }: {
  roles: HiringRole[]; setRoles: React.Dispatch<React.SetStateAction<HiringRole[]>>;
  done: boolean; setDone: (v: boolean) => void; onNext: () => void;
}) {
  const [bn, setBn] = useState("");
  const [other, setOther] = useState("");
  const rec = BOTTLENECKS.find((b) => b.key === bn && !b.other);

  const hiredNodes = useMemo(() => {
    const set = new Set<string>();
    roles.forEach((r) => {
      const t = `${r.title} ${r.dept}`.toLowerCase();
      if (/engineer|developer|cto|technical/.test(t)) set.add("Engineering");
      if (/product|design/.test(t)) set.add("Product");
      if (/sales|account|bdr/.test(t)) set.add("Sales");
      if (/market|growth/.test(t)) set.add("Marketing");
      if (/operation|chief of staff|ops|finance|cfo/.test(t)) set.add("Operations");
      if (/hr|people|recruit/.test(t)) set.add("HR");
    });
    return set;
  }, [roles]);
  const recNode = ROADMAP.find((n, i) => i > 0 && !hiredNodes.has(n)) ?? null;

  const midpoint = (b: string) => {
    const nums = (b.match(/[\d.]+/g) || []).map(Number);
    if (!nums.length || /hr|hour/i.test(b)) return null;
    const mid = nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0];
    return mid < 1000 ? mid * 1000 : mid;
  };
  const titled = roles.filter((r) => r.title.trim());
  const cost = titled.reduce((s, r) => s + (midpoint(r.budget) ?? 0), 0);
  const PRIO: Record<string, number> = { High: 0, Med: 1, Low: 2 };
  const sequence = titled.slice().sort((a, b) => (PRIO[a.priority] ?? 1) - (PRIO[b.priority] ?? 1));

  return (
    <section>
      <Head title="Plan your hiring" badges={[["ai", "AI-drafted"], ["confirm", "You confirm"]]}
        desc="Before you post a single job, figure out exactly who you need and why. This takes 10 minutes and saves you from hiring the wrong role — or the right role too early." />

      <Card>
        <H3>1. What&apos;s slowing you down the most?</H3>
        <p className={hint}>{"Pick the one that's closest — we'll use it to point you toward the role that actually fixes it."}</p>
        <div className="space-y-2">
          {BOTTLENECKS.map((b) => {
            const on = bn === b.key;
            return (
              <button key={b.key} onClick={() => setBn(b.key)} className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm"
                style={{ borderColor: on ? W6 : "#e3e7e2", background: on ? W6_SOFT : "transparent" }}>
                <span className="h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: on ? W6 : "#c4ccc8", background: on ? W6 : "transparent" }} />
                <span className="text-ink">{b.label}</span>
              </button>
            );
          })}
        </div>
        {bn === "other" && <textarea className={`${input} mt-3`} rows={3} value={other} onChange={(e) => setOther(e.target.value)} placeholder="e.g. our onboarding flow confuses new users and we don't know why..." />}
        {rec && (
          <div className="mt-4 rounded-xl border p-4" style={{ borderColor: W6, background: W6_SOFT }}>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "#F4E9DD", color: "#8A5A24" }}>AI recommendation</span>
            <p className="mt-2 flex items-center gap-2 text-base font-bold text-ink"><span style={{ color: W6 }}>✓</span> {rec.role}</p>
            <p className="mt-1 text-sm text-ink-soft">{rec.reason}</p>
            <div className="mt-3 space-y-2">
              {([["Urgency", rec.urgency!], ["Business impact", rec.impact!], ["Founders could do it", rec.founders!]] as [string, number][]).map(([l, v]) => (
                <div key={l} className="flex items-center gap-3">
                  <span className="w-40 text-xs text-muted">{l}</span>
                  <div className="h-2 flex-1 rounded-full bg-white"><div className="h-2 rounded-full" style={{ width: `${v * 10}%`, background: W6 }} /></div>
                  <span className="w6-mono w-8 text-right text-xs text-muted">{v}/10</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
              <div><p className="text-muted">Recommended timing</p><p className="font-medium text-ink">{rec.timing}</p></div>
              <div><p className="text-muted">Est. market salary</p><p className="font-medium text-ink">{rec.salary}</p></div>
              <div><p className="text-muted">Suggested equity</p><p className="font-medium text-ink">{rec.equity}</p></div>
            </div>
            <button className={`${ghost} mt-3`} onClick={() => setRoles((rs) => [...rs, newRole({ title: rec.role, dept: rec.dept, reports_to: rec.reportsTo, goal: rec.goal, budget: rec.salary })])}>Add to hiring plan ↓</button>
          </div>
        )}
      </Card>

      <Card>
        <H3>2. Typical startup hiring order</H3>
        <p className={hint}>{"Founders don't need org theory — just a sense of what usually comes next. Hiring out of order is one of the most common early mistakes."}</p>
        <div className="space-y-1.5">
          {ROADMAP.map((n) => {
            const isFounder = n === "Founder", isRec = n === recNode, isHired = hiredNodes.has(n);
            return (
              <div key={n} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: isRec ? W6_SOFT : "transparent", border: isRec ? `1px solid ${W6}` : "1px solid transparent" }}>
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: isFounder || isHired ? "#243530" : isRec ? W6 : "#d0d6d3" }} />
                  <span style={{ color: isFounder || isRec || isHired ? "#243530" : "#8a938d", fontWeight: isFounder || isRec ? 600 : 400 }}>{n}</span>
                </span>
                {isFounder && <span className="w6-mono text-[10.5px] text-muted">You are here</span>}
                {isRec && <span className="w6-mono text-[10.5px] font-semibold" style={{ color: W6 }}>Recommended next</span>}
                {isHired && !isFounder && <span className="w6-mono text-[10.5px] text-muted">planned</span>}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-1 flex items-center justify-between">
          <H3>3. Map out each role</H3>
          <button className={ghost} onClick={() => setRoles((rs) => [...rs, newRole()])}>Add role</button>
        </div>
        <p className={hint}>The questions founders actually struggle with — not just title and budget.</p>
        {roles.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Add a role above, or pull one in from the AI recommendation.</p>
        ) : (
          <div className="space-y-3">{roles.map((r) => <RoleCard key={r.id} r={r} setRoles={setRoles} />)}</div>
        )}
        {sequence.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button className={ghost} onClick={onNext}>Confirm roles &amp; send to Find candidates →</button>
            <span className="text-xs text-muted">Your mapped roles flow into the job-post drafts in the next step.</span>
          </div>
        )}
      </Card>

      {sequence.length > 0 && (
        <Card>
          <H3>Recommended hiring sequence</H3>
          <p className={hint}>Ordered by the priority you set — hire top-down, not all at once.</p>
          <div className="space-y-2">
            {sequence.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: W6 }}>{i + 1}</span>
                <span className="flex-1 text-sm font-semibold text-ink">{r.title}</span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: W6_SOFT, color: W6 }}>{r.priority} priority</span>
                {r.start_date && <span className="text-xs text-muted">start {r.start_date}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {cost > 0 && (
        <Card>
          <H3>Estimated hiring cost</H3>
          <div className="space-y-1.5">
            {titled.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{r.title}</span>
                <span className="w6-mono text-ink">{midpoint(r.budget) ? `$${Math.round(midpoint(r.budget)!).toLocaleString()}` : "contract / TBD"}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="text-sm font-bold text-ink">Total base / year</span>
            <span className="text-xl font-extrabold" style={{ color: W6 }}>${Math.round(cost).toLocaleString()}</span>
          </div>
          <p className="mt-1 text-xs text-muted">≈ ${Math.round(cost / 12).toLocaleString()}/mo added burn before benefits, tools, and payroll taxes (add ~20–25%).</p>
        </Card>
      )}

      <Attest label="I've mapped my hiring plan" checked={done} onChange={setDone} />
      {done && <div className="mt-3"><button className={ghost} onClick={onNext}>Continue to Find candidates →</button></div>}
    </section>
  );
}

function RoleCard({ r, setRoles }: { r: HiringRole; setRoles: React.Dispatch<React.SetStateAction<HiringRole[]>> }) {
  const upd = (k: keyof HiringRole, v: string) => setRoles((rs) => rs.map((x) => (x.id === r.id ? { ...x, [k]: v } : x)));
  const Lbl = ({ t }: { t: string }) => <span className="w6-mono mb-1 block text-[10.5px] font-medium uppercase tracking-wide text-muted">{t}</span>;
  const Txt = (k: keyof HiringRole, t: string, ph: string, full = false) => (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}><Lbl t={t} /><input className={input} value={r[k] as string} placeholder={ph} onChange={(e) => upd(k, e.target.value)} /></label>
  );
  const Sel = (k: keyof HiringRole, t: string, opts: string[]) => (
    <label className="block"><Lbl t={t} /><select className={input} value={r[k] as string} onChange={(e) => upd(k, e.target.value)}>{opts.map((o) => <option key={o}>{o}</option>)}</select></label>
  );
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="w6-mono text-sm font-bold uppercase tracking-wide text-ink">{r.title || "Untitled role"}</p>
        <button className="text-xs hover:underline" style={{ color: W6 }} onClick={() => setRoles((rs) => rs.filter((x) => x.id !== r.id))}>Remove</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Txt("title", "Job title", "e.g. Growth Marketer")}
        {Txt("dept", "Department", "Marketing")}
        {Txt("reports_to", "Reports to", "CEO (Founder)")}
        {Sel("priority", "Priority", ["High", "Med", "Low"])}
        {Txt("goal", "Business goal", "Acquire first 1,000 users", true)}
        <label className="block sm:col-span-2"><Lbl t="Why can't founders keep doing this?" /><textarea className={input} rows={2} value={r.why_not_founders} onChange={(e) => upd("why_not_founders", e.target.value)} /></label>
        {Txt("hours_lost", "Hours/week lost to this", "e.g. 15")}
        {Txt("revenue_unlocked", "Revenue this unlocks", "e.g. $10k/mo")}
        {Sel("hire_type", "Hire type", ["Employee", "Contractor"])}
        {Sel("full_time", "Full-time?", ["Yes", "No"])}
        {Sel("remote", "Remote?", ["Remote", "Hybrid", "Onsite"])}
        {Txt("budget", "Budget range", "$70k - $80k")}
        {Txt("start_date", "Target start date", "e.g. Sep 2026")}
      </div>
    </div>
  );
}

// ============================ Step 2: Find =====================================================
function StepFind({ companyName, done, setDone }: { companyName: string; done: boolean; setDone: (v: boolean) => void }) {
  const [role, setRole] = useState("Founding Engineer");
  const [custom, setCustom] = useState("");
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState<"li" | "wf" | "sf">("li");
  const realRole = role === "custom" ? custom.trim() || "this role" : role;
  const drafts = ROLE_DRAFTS[realRole] ?? {
    li: "We're building something early and real. As an early hire, you'll work directly with the founders and have real ownership. Equity available, competitive salary, remote-friendly.",
    wf: "🚀 Pre-seed, real customers already. Looking for someone who wants meaningful equity and real influence. Remote-friendly · Fast-moving",
    sf: `Hiring: ${realRole}. We're a small team building something real. Real ownership, real equity. DM if curious.`,
  };
  const draft = drafts[tab] + (notes ? `\n\nWhat we need from you: ${notes}` : "");

  return (
    <section>
      <Head title="Find candidates" badges={[["ai", "AI-drafted"], ["confirm", "You confirm"]]}
        desc="We'll draft your job post in the format each platform actually expects, then point you to where to post it. StartupKit doesn't run the search for you — you stay in control of who you talk to." />
      <Card>
        <H3>Which role are you hiring for?</H3>
        <select className={input} value={role} onChange={(e) => setRole(e.target.value)}>
          {["Founding Engineer", "Product Designer", "Growth Marketer"].map((r) => <option key={r}>{r}</option>)}
          <option value="custom">Custom role…</option>
        </select>
        {role === "custom" && <input className={`${input} mt-2`} placeholder="Enter role title" value={custom} onChange={(e) => setCustom(e.target.value)} />}
        <p className="mb-1 mt-4 text-sm font-semibold text-ink">Anything specific about this role? <span className="text-xs font-normal text-muted">optional</span></p>
        <textarea className={input} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. must have shipped a production app before, prior startup experience preferred, onsite 2 days/week in SF..." />
      </Card>
      <Card>
        <H3>Job post drafts — {realRole}</H3>
        <div className="mb-3 flex gap-2">
          {(["li", "wf", "sf"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: tab === t ? W6 : "transparent", color: tab === t ? "#fff" : "#5b6b60", border: `1px solid ${tab === t ? W6 : "#e3e7e2"}` }}>
              {t === "li" ? "LinkedIn" : t === "wf" ? "Wellfound" : "Short-form"}
            </button>
          ))}
        </div>
        <div className="whitespace-pre-wrap rounded-lg border border-line bg-paper/50 p-4 text-sm leading-relaxed text-ink"><b>{realRole} — {companyName} (example)</b>{"\n\n"}{draft}</div>
      </Card>

      <PosterCard role={realRole} companyName={companyName} />

      <Card>
        <H3>Where to post</H3>
        <div className="overflow-hidden rounded-lg border border-line">
          {POST_TARGETS.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm" style={{ borderTop: i ? "1px solid #eef0ed" : "none" }}>
              <span className="font-semibold text-ink">{p.name}</span>
              <span className="flex-1 text-xs text-muted">{p.note}</span>
              <a className="w6-mono text-xs" style={{ color: W6 }} href="#">{p.cta}</a>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg p-3 text-xs text-ink-soft" style={{ background: W6_SOFT }}><b>Good to know —</b> Wellfound candidates already expect early-stage comp structures, so it&apos;s a strong fit if equity is a meaningful part of the offer.</div>
      </Card>
      <Attest label="I've started sourcing candidates" checked={done} onChange={setDone} />
    </section>
  );
}

function PosterCard({ role, companyName }: { role: string; companyName: string }) {
  const [theme, setTheme] = useState("teal");
  const [prompt, setPrompt] = useState("");
  const [toast, setToast] = useState("");
  const [f, setF] = useState({
    brand: `${companyName} is hiring`, role, tagline: "Join us early and shape the product with the founding team.",
    equity: equityRange(role), location: "Remote-friendly", stage: "Pre-seed", cta: "DM us or apply — link in bio",
  });
  useEffect(() => { setF((p) => ({ ...p, role, equity: equityRange(role) })); }, [role]);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const t = POSTER_THEMES[theme];
  const applyPrompt = () => {
    const p = prompt.toLowerCase();
    setF((cur) => {
      let tagline = cur.tagline, location = cur.location;
      if (/short|instagram|snappy|tighter/.test(p)) tagline = tagline.split(/[.!?]/)[0].slice(0, 80);
      if (/equity/.test(p)) tagline = `${cur.equity} — ${tagline}`;
      if (/founder/.test(p)) tagline = `From the founders: ${tagline}`;
      if (/remote/.test(p)) location = "Remote-first";
      return { ...cur, tagline, location };
    });
    setToast("AI edit applied."); setTimeout(() => setToast(""), 1600);
  };
  const posterSvg = () => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const chips = [f.equity, f.location, f.stage].filter(Boolean).map((c, i) => `<text x="90" y="${1250 + i * 60}" fill="#fff" font-size="34" font-family="sans-serif" opacity="0.85">• ${esc(c)}</text>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500"><rect width="1200" height="1500" fill="${t.bg}"/><rect x="0" y="0" width="16" height="1500" fill="${t.accent}"/><text x="90" y="220" fill="${t.accent}" font-size="40" font-weight="700" font-family="sans-serif" letter-spacing="4">${esc(f.brand.toUpperCase())}</text><text x="90" y="420" fill="#fff" font-size="130" font-weight="800" font-family="sans-serif">${esc(f.role)}</text><foreignObject x="90" y="480" width="1020" height="400"><div xmlns="http://www.w3.org/1999/xhtml" style="color:#fff;font-size:52px;font-family:sans-serif;line-height:1.3;opacity:.92">${esc(f.tagline)}</div></foreignObject>${chips}<text x="90" y="1440" fill="${t.accent}" font-size="36" font-weight="600" font-family="sans-serif">${esc(f.cta)}</text></svg>`;
  };
  return (
    <Card>
      <H3>Social hiring poster</H3>
      <p className={hint}>Generate a shareable hiring poster for LinkedIn, X, Instagram, or your founder socials. Use AI edits for quick changes, or tune the copy yourself.</p>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="flex aspect-[4/5] flex-col justify-between rounded-xl p-6" style={{ background: t.bg, borderLeft: `6px solid ${t.accent}` }}>
            <div>
              <p className="w6-mono text-xs font-bold uppercase tracking-widest" style={{ color: t.accent }}>{f.brand}</p>
              <p className="mt-4 text-3xl font-extrabold leading-tight text-white">{f.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{f.tagline}</p>
            </div>
            <div>
              <div className="flex flex-wrap gap-2">{[f.equity, f.location, f.stage].filter(Boolean).map((c) => <span key={c} className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ background: `${t.accent}44` }}>{c}</span>)}</div>
              <p className="mt-4 text-sm font-semibold" style={{ color: t.accent }}>{f.cta}</p>
            </div>
          </div>
          <div className="mt-3"><button className={ghost} onClick={() => download("hiring-poster.svg", posterSvg())}>Download poster (SVG)</button></div>
          {toast && <p className="mt-2 text-sm" style={{ color: W6 }}>✓ {toast}</p>}
        </div>
        <div>
          <p className="w6-mono mb-1 text-xs font-semibold uppercase tracking-wide text-muted">AI edit</p>
          <div className="flex gap-2">
            <textarea className={input} rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. make it more founder-led, shorter for Instagram, emphasize equity, mention remote..." />
            <button className={ghost} onClick={applyPrompt}>Apply</button>
          </div>
          <p className="w6-mono mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Theme</p>
          <div className="flex gap-2">{Object.entries(POSTER_THEMES).map(([k, v]) => <button key={k} onClick={() => setTheme(k)} title={v.label} className="h-8 w-8 rounded-full" style={{ background: v.accent, outline: theme === k ? `2px solid ${v.accent}` : "none", outlineOffset: 2 }} />)}</div>
          <p className="w6-mono mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Manual edit</p>
          <div className="grid gap-2">
            {([["brand", "Poster eyebrow"], ["role", "Role title"], ["equity", "Equity / comp"], ["location", "Location"], ["stage", "Stage"], ["cta", "Call to action"]] as [keyof typeof f, string][]).map(([k, ph]) => <input key={k} className={input} placeholder={ph} value={f[k]} onChange={(e) => set(k, e.target.value)} />)}
            <textarea className={input} rows={2} placeholder="Short poster message" value={f.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================ Step 3: Offer ====================================================
function StepOffer({ companyName }: { companyName: string }) {
  const [role, setRole] = useState("Founding Engineer");
  const [name, setName] = useState("Dana Kim");
  const [text, setText] = useState("");
  const [reminder, setReminder] = useState(48);
  const [sent, setSent] = useState(false);
  const equity = EQUITY_BY_ROLE[role] ?? "meaningful equity";
  const letter = () =>
    `OFFER OF EMPLOYMENT\n\n${companyName} (the "Company")\n\nDear ${name},\n\nWe are pleased to offer you the position of ${role}, reporting to the founding team.\n\nCompensation: [Add base salary before sending]\nEquity: ${equity} of the Company's common stock, subject to the Company's standard 4-year vesting schedule with a 1-year cliff and double-trigger acceleration, as reflected on the Company's capitalization table.\nStart date: [Add start date]\n\nThis offer is contingent upon your signing the Company's standard Proprietary Information and Inventions Agreement.\n\nPlease sign below to accept this offer.\n\n_________________________\n${name}                          Date`;
  return (
    <section>
      <Head title="Make an offer" badges={[["ai", "AI-drafted"]]}
        desc="Once you've got someone in mind, we generate the offer letter — role and equity pulled straight from your cap table — for you to review, edit, and send." />
      <div className="mb-4 rounded-lg p-3 text-xs text-ink-soft" style={{ background: W6_SOFT }}><b>Vesting —</b> new hires inherit your company&apos;s standard 4yr vesting / 1yr cliff / double-trigger acceleration terms, already set on your cap table.</div>
      <Card>
        <H3>Offer letter</H3>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block"><span className="w6-mono text-[10.5px] uppercase text-muted">Candidate</span><input className={input} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block"><span className="w6-mono text-[10.5px] uppercase text-muted">Role</span><select className={input} value={role} onChange={(e) => setRole(e.target.value)}>{Object.keys(EQUITY_BY_ROLE).map((r) => <option key={r}>{r}</option>)}</select></label>
        </div>
        {!text ? (
          <button className={`${ghost} mt-3`} onClick={() => setText(letter())}>Generate offer letter for {role}</button>
        ) : (
          <>
            <p className="mb-1 mt-3 text-xs text-muted">Review &amp; edit — this is a draft; click to edit.</p>
            <textarea className={`${input} w6-mono`} rows={16} value={text} onChange={(e) => setText(e.target.value)} />
            <button className={`${ghost} mt-3`} onClick={() => download("offer-letter.txt", text)}>Download offer letter</button>
          </>
        )}
      </Card>
      {text && (
        <Card>
          <H3>Set a signature reminder</H3>
          <p className={hint}>{"If your candidate hasn't signed by then, we'll nudge them automatically."}</p>
          <div className="mb-3 flex gap-2">
            {[["24 hours", 24], ["48 hours", 48], ["Don't remind me", 0]].map(([l, h]) => (
              <button key={l as string} onClick={() => setReminder(h as number)} className="rounded-lg px-3 py-2 text-sm" style={{ border: `1px solid ${reminder === h ? W6 : "#e3e7e2"}`, background: reminder === h ? W6_SOFT : "transparent", color: reminder === h ? W6 : "#243530" }}>{l}</button>
            ))}
          </div>
          <button className={ghost} onClick={() => setSent(true)}>Send to candidate</button>
          {sent && <p className="mt-2 text-sm" style={{ color: W6 }}>✓ Offer sent for e-signature{reminder ? ` — reminder set for ${reminder}h` : ""}.</p>}
        </Card>
      )}
    </section>
  );
}

// ============================ Step 4: Onboard ==================================================
function StepOnboard({ companyName, employees, setEmployees }: {
  companyName: string; employees: Employee[]; setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Founding Engineer");
  const upd = (id: string, patch: Partial<Employee>) => setEmployees((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const add = () => {
    if (!name.trim()) return;
    setEmployees((es) => [...es, { id: String(Date.now()), name: name.trim(), role, email: email.trim(), start_date: "TBD", docs_generated: false, onboarding_sent: false, onboarding_complete: false, tier: "Module Access", access_granted: false }]);
    setName(""); setEmail("");
  };
  return (
    <section>
      <Head title="Employee onboarding" badges={[["ai", "Auto-generated"]]}
        desc="Add each employee once their offer is signed. We'll generate their legal docs and a personalized self-onboarding link so they enter W-4 elections, I-9 basics, and direct deposit details themselves." />
      <Card>
        <H3>Add an employee</H3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={input} placeholder="Employee full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={input} placeholder="Employee email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <select className={`${input} mt-2`} value={role} onChange={(e) => setRole(e.target.value)}>{["Founding Engineer", "Product Designer", "Growth Marketer"].map((r) => <option key={r}>{r}</option>)}</select>
        <button className={`${ghost} mt-3`} onClick={add}>Add employee</button>
      </Card>
      {employees.length === 0 && <p className="py-6 text-center text-sm text-muted">No employees yet — add your first hire above once their offer is signed.</p>}
      {employees.map((emp) => (
        <div key={emp.id} className="mb-4 rounded-xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-ink">{emp.name}</p>
              <p className="text-xs text-muted">{emp.role} · {emp.email || "no email"} · start {emp.start_date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={emp.onboarding_complete ? { background: W6_SOFT, color: W6 } : { background: "#F4E9DD", color: "#8A5A24" }}>{emp.onboarding_complete ? "Onboarding complete" : emp.onboarding_sent ? "Link sent — pending" : "Not started"}</span>
              <button className="text-xs text-muted hover:text-ink" onClick={() => setEmployees((es) => es.filter((e) => e.id !== emp.id))}>Remove</button>
            </div>
          </div>
          <p className="w6-mono mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Legal docs (e-signature, same as W1/W2)</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{DOC_TYPES.map((d) => <span key={d.key} className="rounded-md border border-line px-2 py-1 text-[11px]" style={emp.docs_generated ? { borderColor: W6, color: W6 } : { color: "#8a938d" }}>{emp.docs_generated ? "✓ " : ""}{d.abbr}</span>)}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {!emp.docs_generated && <button className={ghost} onClick={() => upd(emp.id, { docs_generated: true })}>Generate &amp; send docs</button>}
            {!emp.onboarding_sent ? (
              <button className={ghost} onClick={() => upd(emp.id, { onboarding_sent: true })}>Send onboarding link</button>
            ) : (
              <span className="w6-mono text-xs" style={{ color: W6 }}>{`startupkit.app/onboard/${emp.name.toLowerCase().replace(/\s+/g, "-")}`}</span>
            )}
            {emp.onboarding_sent && !emp.onboarding_complete && <button className={ghost} onClick={() => upd(emp.id, { onboarding_complete: true })}>Mark packet received</button>}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted">Legal docs reference {companyName}&apos;s standard templates and route through the same e-signature system as W1/W2.</p>
    </section>
  );
}

// ============================ Step 5: Payroll ==================================================
function StepPayroll({ employees, done, setDone }: { employees: Employee[]; done: boolean; setDone: (v: boolean) => void }) {
  const ready = employees.filter((e) => e.onboarding_complete);
  return (
    <section>
      <Head title="Set up payroll" badges={[["confirm", "You confirm"]]}
        desc="Payroll providers handle the actual state tax registration and withholding — that's their job, not ours. Here's what you'll need and who we'd suggest." />
      <Card>
        <H3>What you&apos;ll need</H3>
        <ul className="space-y-2 text-sm">
          {[["Legal business name", "already on file", true], ["EIN", "already on file", true], ["Entity type & state", "C-Corp, Delaware", true], ["Bank account for direct deposit", "confirmed in W3", true], ["State(s) where employees actually work", "collected from onboarding links", false], ["Each employee's I-9/W-4 info + bank details", `${ready.length}/${employees.length} received`, employees.length > 0 && ready.length === employees.length], ["Employee type", "W-2 employee from signed offer", true]].map(([l, v, ok]) => (
            <li key={l as string} className="flex items-center gap-2"><span style={{ color: ok ? W6 : "#c4ccc8" }}>{ok ? "✓" : "○"}</span><span className="text-ink">{l}</span><span className="text-muted">— {v}</span></li>
          ))}
        </ul>
      </Card>
      <Card>
        <H3>Employee payroll packets</H3>
        {ready.length === 0 ? <p className="py-4 text-center text-sm text-muted">No packets received yet — send onboarding links in the previous step.</p> : (
          <div className="space-y-2">{ready.map((e) => <div key={e.id} className="rounded-lg border border-line p-3 text-sm"><p className="font-semibold text-ink">{e.name} <span className="font-normal text-muted">· {e.role}</span></p><p className="mt-1 text-xs text-muted">Work state on file · W-4 complete · I-9 basics complete · direct deposit authorized</p></div>)}</div>
        )}
      </Card>
      <Card>
        <H3>Recommended providers</H3>
        <div className="overflow-hidden rounded-lg border border-line">{PROVIDERS.map((p, i) => <div key={p.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm" style={{ borderTop: i ? "1px solid #eef0ed" : "none" }}><span className="font-semibold text-ink">{p.name}</span><span className="flex-1 text-xs text-muted">{p.note}</span><a className="w6-mono text-xs" style={{ color: W6 }} href="#">Open ↗</a></div>)}</div>
        <div className="mt-3 rounded-lg p-3 text-xs text-ink-soft" style={{ background: W6_SOFT }}><b>Good to know —</b> if everyone&apos;s US-based, Gusto is usually fastest. Hiring anyone outside the US — even one contractor — Deel handles compliance the others don&apos;t.</div>
      </Card>
      <Attest label="I've set up payroll" checked={done} onChange={setDone} />
    </section>
  );
}

// ============================ Step 6: Access ===================================================
function StepAccess({ employees, setEmployees }: { employees: Employee[]; setEmployees: React.Dispatch<React.SetStateAction<Employee[]>> }) {
  const [tier, setTier] = useState("Module Access");
  const upd = (id: string, patch: Partial<Employee>) => setEmployees((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  return (
    <section>
      <Head title="Employee access" badges={[["confirm", "You confirm"]]}
        desc="Decide what each new hire can see inside StartupKit. Start narrower than feels necessary — it's easy to grant more access later, harder to walk back after someone's already seen the cap table." />
      <Card>
        <H3>Access tiers</H3>
        <div className="grid gap-2 sm:grid-cols-2">
          {TIERS.map((t) => {
            const on = tier === t.name;
            return (
              <button key={t.name} onClick={() => setTier(t.name)} className="rounded-xl border p-3 text-left" style={{ borderColor: on ? W6 : "#e3e7e2", background: on ? W6_SOFT : "transparent", borderWidth: on ? 2 : 1 }}>
                <p className="text-sm font-bold text-ink">{t.name} {on && <span style={{ color: W6 }}>✓</span>}</p>
                <p className="mt-1 text-xs text-ink-soft">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>
      <Card>
        <H3>Assign access</H3>
        {employees.length === 0 ? <p className="py-4 text-center text-sm text-muted">Add employees in the Onboarding step to assign their access.</p> : (
          <div className="space-y-2">
            {employees.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3">
                <div><p className="text-sm font-semibold text-ink">{e.name}</p><p className="text-xs text-muted">{e.role}</p></div>
                <div className="flex items-center gap-2">
                  <select className={`${input} !w-auto py-1 text-sm`} value={e.tier} onChange={(ev) => upd(e.id, { tier: ev.target.value })}>{TIERS.map((t) => <option key={t.name}>{t.name}</option>)}</select>
                  {e.access_granted ? <span className="text-sm" style={{ color: W6 }}>✓ Granted</span> : <button className={ghost} onClick={() => upd(e.id, { access_granted: true })}>Grant</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
