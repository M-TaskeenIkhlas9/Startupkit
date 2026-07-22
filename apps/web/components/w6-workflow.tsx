"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { savePeople } from "@/lib/api";
import type { DocRecord, Employee, HiringRole, PeopleState, TeamMember, WorkflowView } from "@/lib/types";

// W6 · People & HR — a faithful, production build of the finalized "Build your team" flow.
// The prototype's typography (Fraunces + IBM Plex, scoped via .w6-root in globals.css) and design,
// rebuilt as typed React. The hiring plan, existing team, roster, document text, and step progress
// all persist to the Company Object (people.state.set) via savePeople; only the offer-letter draft
// stays local — it's a draft until sent, same as W7's sequence composer.
const W6 = "#0E7C6B";
const W6_SOFT = "#0E7C6B14";

type Bottleneck = {
  key: string; label: string; role?: string; reason?: string;
  urgency?: number; impact?: number; founders?: number;
  timing?: string; salary?: string; equity?: string; dept?: string; reportsTo?: string; goal?: string;
  roadmapNode?: string; other?: boolean;
};
const BOTTLENECKS: Bottleneck[] = [
  { key: "build", label: "We can't build fast enough", role: "Founding Engineer", dept: "Engineering", reportsTo: "CTO (Founder)", goal: "Ship the product roadmap on schedule", reason: "Product delivery is the constraint right now — until you can ship faster, sales and marketing hires won't have anything new to sell.", urgency: 9, impact: 9, founders: 3, timing: "Within the next 2–4 weeks", salary: "$130k–$170k", equity: "0.5–1.5%", roadmapNode: "Engineering" },
  { key: "customers", label: "We have a product but can't get customers", role: "Growth Marketer", dept: "Marketing", reportsTo: "CEO (Founder)", goal: "Acquire first 1,000 users", reason: "You have something to sell but no reliable acquisition engine — this is a distribution problem, not a product problem.", urgency: 8, impact: 8, founders: 4, timing: "Within the next 30 days", salary: "$90k–$120k", equity: "0.25–0.75%", roadmapNode: "Marketing" },
  { key: "churn", label: "Customers are leaving", role: "Customer Success Manager", dept: "Customer Success", reportsTo: "CEO (Founder)", goal: "Reduce monthly churn", reason: "Retention problems compound — every dollar spent acquiring customers now leaks back out. Fix the leak before pouring in more.", urgency: 9, impact: 8, founders: 5, timing: "Within the next 2–3 weeks", salary: "$75k–$100k", equity: "0.1–0.4%", roadmapNode: "Product" },
  { key: "overwhelmed", label: "Founders are overwhelmed", role: "Operations Manager / Chief of Staff", dept: "Operations", reportsTo: "CEO (Founder)", goal: "Absorb day-to-day operational load", reason: "When founders are buried in execution, high-leverage work like fundraising and strategy stalls. You need someone absorbing operational load.", urgency: 7, impact: 7, founders: 2, timing: "Within the next 4–6 weeks", salary: "$85k–$115k", equity: "0.2–0.6%", roadmapNode: "Operations" },
  { key: "support", label: "Too much support work", role: "Support Specialist", dept: "Customer Success", reportsTo: "Head of Product", goal: "Keep response times under 24 hours", reason: "Support volume is a signal of real adoption — good news — but it's pulling engineering or founder time away from building.", urgency: 6, impact: 6, founders: 6, timing: "Within the next 4–8 weeks", salary: "$45k–$65k", equity: "0–0.15%", roadmapNode: "Product" },
  { key: "raising", label: "We're raising money", role: "Fractional CFO (contractor)", dept: "Finance", reportsTo: "CEO (Founder)", goal: "Build the financial model and data room", reason: "Fundraising is a founder-led motion — a full-time hire can wait. A fractional finance hire can build the model and data room so you're not doing it solo.", urgency: 5, impact: 6, founders: 7, timing: "Consider a contractor now; delay full-time hiring until after the round closes", salary: "$150–$250/hr (contract)", equity: "None (contractor)", roadmapNode: "Operations" },
  { key: "other", label: "Something else", other: true },
];
const ROADMAP = ["Founder", "Engineering", "Product", "Sales", "Marketing", "Operations", "HR"];
const NODE_KEYWORDS: Record<string, string[]> = {
  Engineering: ["engineer", "developer", "cto", "technical"],
  Product: ["product", "design"],
  Sales: ["sales", "account", "bdr", "business development"],
  Marketing: ["marketing", "growth"],
  Operations: ["operation", "chief of staff", "ops", "finance", "cfo"],
  HR: ["hr", "people", "recruit", "human resources"],
};
function classifyTitle(title: string): string | null {
  const t = (title || "").toLowerCase();
  if (!t.trim()) return null;
  return Object.keys(NODE_KEYWORDS).find((node) => NODE_KEYWORDS[node].some((kw) => t.includes(kw))) ?? null;
}
const NODE_ROLE_DEFAULTS: Record<string, { title: string; dept: string; reportsTo: string; goal: string; budget: string }> = {
  Engineering: { title: "Founding Engineer", dept: "Engineering", reportsTo: "CTO (Founder)", goal: "Ship the product roadmap on schedule", budget: "$130k – $170k" },
  Product: { title: "Product Manager", dept: "Product", reportsTo: "CEO (Founder)", goal: "Own the product roadmap and prioritization", budget: "$110k – $150k" },
  Sales: { title: "Account Executive", dept: "Sales", reportsTo: "CEO (Founder)", goal: "Close new customer deals", budget: "$70k – $100k + commission" },
  Marketing: { title: "Growth Marketer", dept: "Marketing", reportsTo: "CEO (Founder)", goal: "Acquire first 1,000 users", budget: "$90k – $120k" },
  Operations: { title: "Operations Manager / Chief of Staff", dept: "Operations", reportsTo: "CEO (Founder)", goal: "Absorb day-to-day operational load", budget: "$85k – $115k" },
  HR: { title: "People Ops / HR Manager", dept: "People", reportsTo: "CEO (Founder)", goal: "Build hiring, onboarding, and compliance processes", budget: "$75k – $100k" },
};
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
const DOC_TYPES: { key: string; abbr: string; label: string; gen: (name: string, role: string, company: string) => string }[] = [
  { key: "piia", abbr: "PIIA", label: "Proprietary Information & Inventions Agreement", gen: piiaText },
  { key: "nda", abbr: "NDA", label: "Non-Disclosure Agreement", gen: ndaText },
  { key: "ipa", abbr: "IPA", label: "Intellectual Property Assignment Agreement", gen: ipaText },
  { key: "atwill", abbr: "At-Will", label: "At-Will Employment Agreement", gen: atWillText },
  { key: "handbook", abbr: "Handbook", label: "Employee Handbook Acknowledgment", gen: handbookText },
  { key: "arbitration", abbr: "Arbitration", label: "Mutual Arbitration Agreement", gen: arbitrationText },
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
function newEmployeeRecord(p: { name: string; role: string; email: string }): Employee {
  const docs: Record<string, DocRecord> = {};
  DOC_TYPES.forEach((t) => {
    docs[t.key] = { generated: false, text: "", status: "unsigned", delivery_mode: "", reminder_hours: 48, sent_confirm: "", uploaded_file: "" };
  });
  return {
    id: String(Date.now() + Math.random()), name: p.name, role: p.role, email: p.email, start_date: "TBD",
    docs, onboarding_link: "", onboarding_send_mode: "email", onboarding_sent: false, onboarding_complete: false,
    onboarding_confirm: "", payroll_packet: null, tier: "Module Access", access_granted: false, access_confirm: "",
  };
}
function onboardingUrl(companySlug: string, emp: Employee): string {
  const slug = emp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "employee";
  return `https://startupkit.app/onboard/${companySlug}/${slug}-${emp.id.slice(-3)}`;
}
function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================ legal document text (real, not boilerplate badges) ==================
function piiaText(name: string, role: string, company: string): string {
  return `PROPRIETARY INFORMATION AND INVENTIONS AGREEMENT\n\n${company} (the "Company")\n\nThis Agreement is entered into by and between the Company and ${name} ("Employee"), in connection with Employee's role as ${role}.\n\n1. Confidentiality. Employee agrees to hold in strict confidence, and not use or disclose except to perform this role, all Company confidential and proprietary information, including business plans, product roadmaps, source code, customer data, and financials ("Confidential Information"), both during and after employment.\n\n2. Assignment of Inventions. Employee hereby assigns to the Company all right, title, and interest in any inventions, discoveries, original works of authorship, and other work product Employee conceives, develops, or reduces to practice during employment that relate to the Company's actual or anticipated business, or that result from work performed for the Company ("Company Inventions").\n\n3. Carve-Out for Personal Inventions. This Agreement does not require assignment of an invention Employee develops entirely on their own time, without using the Company's equipment, supplies, facilities, or trade secret information, unless that invention relates to the Company's business or anticipated research, or results from work Employee performed for the Company. Some states, including California (Labor Code § 2870), protect employee inventions on this basis by statute, and nothing here requires assignment beyond what applicable law allows.\n\n4. At-Will Employment. This Agreement does not alter the at-will nature of Employee's employment and remains in effect after employment ends.\n\nPlease sign below to accept this agreement.\n\n_________________________\n${name}                          Date`;
}
function ndaText(name: string, role: string, company: string): string {
  return `NON-DISCLOSURE AGREEMENT\n\n${company} (the "Company")\n\nThis Agreement is entered into between the Company and ${name}, in connection with ${name}'s role as ${role}.\n\n1. Confidential Information. ${name} may have access to the Company's non-public information, including business plans, customer data, financials, source code, and product roadmaps ("Confidential Information"). Confidential Information does not include information that becomes publicly available through no fault of ${name}, was already known to ${name} before disclosure, or is independently developed without reference to the Company's information.\n\n2. Obligations. ${name} agrees to hold Confidential Information in strict confidence, use it only to perform this role, and not disclose it to any third party, both during and after employment.\n\n3. Return of Materials. Upon request or at the end of employment, ${name} will return or destroy all materials containing Confidential Information.\n\n4. Survival. These obligations continue after employment ends, for as long as the information remains Confidential Information under this Agreement.\n\nPlease sign below to accept this agreement.\n\n_________________________\n${name}                          Date`;
}
function ipaText(name: string, role: string, company: string): string {
  return `INTELLECTUAL PROPERTY ASSIGNMENT AGREEMENT\n\n${company} (the "Company")\n\nIn connection with ${name}'s role as ${role}, ${name} hereby assigns to the Company all right, title, and interest — including all patent, copyright, trade secret, and other intellectual property rights — in any inventions, works of authorship, and other work product ${name} creates during employment that relate to the Company's business or are created using Company resources ("Company IP").\n\n${name} agrees to promptly disclose Company IP to the Company, and to sign any documents and take any actions the Company reasonably requests to perfect its ownership, including applying for patents or copyright registrations.\n\nThis assignment does not extend to inventions ${name} develops entirely on their own time, without Company resources, and unrelated to the Company's business or anticipated research — consistent with state invention-assignment laws such as California Labor Code § 2870 — except as required by applicable law.\n\nPlease sign below to accept this agreement.\n\n_________________________\n${name}                          Date`;
}
function atWillText(name: string, role: string, company: string): string {
  return `AT-WILL EMPLOYMENT AGREEMENT\n\n${company} (the "Company")\n\nThis confirms that ${name}'s employment with the Company as ${role} is at-will, meaning either ${name} or the Company may terminate the employment relationship at any time, for any reason or no reason, with or without cause or advance notice.\n\nNothing in this Agreement, any Company policy or handbook, or any oral statement by a manager or representative of the Company alters this at-will relationship or creates a contract of employment for any specific term. Any change to ${name}'s at-will status must be in a written agreement signed by an authorized officer of the Company.\n\nThis Agreement does not limit any rights ${name} has under applicable federal, state, or local law.\n\nPlease sign below to acknowledge.\n\n_________________________\n${name}                          Date`;
}
function handbookText(name: string, role: string, company: string): string {
  return `EMPLOYEE HANDBOOK ACKNOWLEDGMENT\n\n${company} (the "Company")\n\nI, ${name}, acknowledge that I have received and reviewed the Company's Employee Handbook, and understand it sets out the Company's policies and expectations that I am responsible for following in my role as ${role}.\n\nI understand the Handbook is not a contract of employment, does not alter my at-will employment status, and that the Company may add, change, or remove any policy at any time, with or without notice, except where the law requires otherwise.\n\nIf any policy in the Handbook conflicts with applicable law, the law controls, and the Company will apply the policy consistent with that law.\n\nPlease sign below to acknowledge.\n\n_________________________\n${name}                          Date`;
}
function arbitrationText(name: string, role: string, company: string): string {
  return `MUTUAL ARBITRATION AGREEMENT\n\n${company} (the "Company")\n\n${name} and the Company mutually agree that any dispute arising out of or relating to ${name}'s employment as ${role}, including its termination, will be resolved through final and binding individual arbitration under the American Arbitration Association's Employment Arbitration Rules, rather than in court, except as described below.\n\n1. Class and Collective Waiver. Both parties waive the right to a jury trial and to bring or participate in a class, collective, or representative action, to the extent permitted by law.\n\n2. What This Does Not Cover. This Agreement does not require arbitration of: claims that cannot be arbitrated under applicable law; charges filed with a government agency such as the EEOC, NLRB, or a state labor agency; workers' compensation or unemployment insurance claims; or, at ${name}'s election, claims of sexual harassment or sexual assault, which ${name} may instead pursue in court under the federal Ending Forced Arbitration of Sexual Assault and Sexual Harassment Act.\n\n3. Costs. The Company will pay all arbitration administration and arbitrator fees beyond what ${name} would have paid to file the same claim in court.\n\n4. Right to Review. ${name} is encouraged to read this Agreement carefully and may consult an attorney before signing.\n\nPlease sign below to accept this agreement.\n\n_________________________\n${name}                          Date`;
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
function ReminderPicker({ hours, onPick }: { hours: number; onPick: (h: number) => void }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {([["24 hours", 24], ["48 hours", 48], ["Don't remind me", 0]] as [string, number][]).map(([l, h]) => (
        <button key={l} onClick={() => onPick(h)} className="rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ border: `1px solid ${hours === h ? W6 : "#e3e7e2"}`, background: hours === h ? W6_SOFT : "transparent", color: hours === h ? W6 : "#243530" }}>{l}</button>
      ))}
    </div>
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
  const [existingTeam, setExistingTeam] = useState<TeamMember[]>(initialPeople?.existing_team ?? []);
  const [roles, setRoles] = useState<HiringRole[]>(initialPeople?.roles ?? []);
  const [employees, setEmployees] = useState<Employee[]>(initialPeople?.employees ?? []);
  const [done, setDone] = useState<number[]>(initialPeople?.done_steps ?? []);
  const [saved, setSaved] = useState(true);

  // debounced auto-save of the persistent state (existing team, roles, roster, step progress)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaved(false);
    const t = setTimeout(() => {
      savePeople(companyId, { existing_team: existingTeam, roles, employees, done_steps: done })
        .then(() => setSaved(true))
        .catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [companyId, existingTeam, roles, employees, done]);

  const setStepDone = (n: number, v: boolean) =>
    setDone((d) => (v ? Array.from(new Set([...d, n])) : d.filter((x) => x !== n)));
  const companySlug = companyName.toLowerCase().replace(/\s+/g, "-");

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
          {step === 1 && (
            <StepPlan
              existingTeam={existingTeam} setExistingTeam={setExistingTeam}
              roles={roles} setRoles={setRoles}
              done={done.includes(1)} setDone={(v) => setStepDone(1, v)} onNext={() => setStep(2)}
            />
          )}
          {step === 2 && <StepFind companyName={companyName} done={done.includes(2)} setDone={(v) => setStepDone(2, v)} />}
          {step === 3 && <StepOffer companyName={companyName} />}
          {step === 4 && <StepOnboard companySlug={companySlug} employees={employees} setEmployees={setEmployees} />}
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
function StepPlan({
  existingTeam, setExistingTeam, roles, setRoles, done, setDone, onNext,
}: {
  existingTeam: TeamMember[]; setExistingTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  roles: HiringRole[]; setRoles: React.Dispatch<React.SetStateAction<HiringRole[]>>;
  done: boolean; setDone: (v: boolean) => void; onNext: () => void;
}) {
  const [bn, setBn] = useState("");
  const [other, setOther] = useState("");
  const [recRole, setRecRole] = useState("");
  const rec = BOTTLENECKS.find((b) => b.key === bn && !b.other);

  const hiredFromTeam = useMemo(() => {
    const set = new Set<string>();
    existingTeam.forEach((m) => { const n = classifyTitle(m.title); if (n) set.add(n); });
    return set;
  }, [existingTeam]);

  const hiredNodes = useMemo(() => {
    const set = new Set(hiredFromTeam);
    roles.forEach((r) => { const n = classifyTitle(`${r.title} ${r.dept}`); if (n) set.add(n); });
    return set;
  }, [hiredFromTeam, roles]);
  const recNode = ROADMAP.find((n, i) => i > 0 && !hiredNodes.has(n)) ?? null;

  const addTeamMember = () => setExistingTeam((t) => [...t, { id: String(Date.now() + Math.random()), name: "", title: "" }]);
  const updateTeamMember = (id: string, patch: Partial<TeamMember>) =>
    setExistingTeam((t) => t.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeTeamMember = (id: string) => setExistingTeam((t) => t.filter((m) => m.id !== id));

  const teamContextSentence = (opt: Bottleneck): string => {
    if (!opt.roadmapNode) return "";
    if (hiredFromTeam.has(opt.roadmapNode)) {
      return ` That said, your team already has someone covering ${opt.roadmapNode.toLowerCase()} — worth double-checking this is really a missing role, and not just a capacity problem with who you've got.`;
    }
    if (recNode === opt.roadmapNode) {
      return ` This also lines up with your team — you don't have anyone in ${opt.roadmapNode.toLowerCase()} yet, so the gap and the bottleneck agree.`;
    }
    return "";
  };

  const selectBottleneck = (key: string) => {
    setBn(key);
    const opt = BOTTLENECKS.find((o) => o.key === key);
    setRecRole(opt && !opt.other ? opt.role ?? "" : "");
  };

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
        <H3>1. Who&apos;s already on the team?</H3>
        <p className={hint}>{"Besides you and your cofounder(s) — who's already been hired? We'll use this to narrow down the actual gap instead of guessing blind."}</p>
        {existingTeam.length === 0 ? (
          <p className="mb-3 rounded-lg bg-paper/60 p-3 text-center text-sm text-muted">No team members added yet — add one, or move on if it&apos;s just founders so far.</p>
        ) : (
          <div className="mb-3 space-y-2">
            {existingTeam.map((m) => {
              const node = classifyTitle(m.title);
              return (
                <div key={m.id} className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input className={input} placeholder="Name (optional)" value={m.name} onChange={(e) => updateTeamMember(m.id, { name: e.target.value })} />
                  <div>
                    <input className={input} placeholder="e.g. Backend Engineer" value={m.title} onChange={(e) => updateTeamMember(m.id, { title: e.target.value })} />
                    {m.title.trim() && (
                      <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px]" style={node ? { background: W6_SOFT, color: W6 } : { background: "#F1F3F0", color: "#8a938d" }}>
                        {node || "Not sure where this fits — that's fine"}
                      </span>
                    )}
                  </div>
                  <button className="mt-2 text-xs text-muted hover:text-ink" onClick={() => removeTeamMember(m.id)}>Remove</button>
                </div>
              );
            })}
          </div>
        )}
        <button className={ghost} onClick={addTeamMember}>Add team member</button>
        {existingTeam.length > 0 && (
          <div className="mt-3 rounded-lg p-3 text-xs text-ink-soft" style={{ background: W6_SOFT }}>
            <b className="text-ink">Already covered on your team —</b> {ROADMAP.filter((n) => hiredFromTeam.has(n)).join(", ") || "nothing classified yet"}.
            {recNode ? <> Based on that, <b>{recNode}</b> looks like the open gap — the question below will help confirm it.</> : " Looks like you have most core functions covered already."}
          </div>
        )}
      </Card>

      <Card>
        <H3>2. What&apos;s slowing you down the most?</H3>
        <p className={hint}>{"Pick the one that's closest — we'll use it to point you toward the role that actually fixes it."}</p>
        <div className="space-y-2">
          {BOTTLENECKS.map((b) => {
            const on = bn === b.key;
            const covered = !b.other && b.roadmapNode && hiredFromTeam.has(b.roadmapNode);
            return (
              <button key={b.key} onClick={() => selectBottleneck(b.key)} className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm"
                style={{ borderColor: on ? W6 : "#e3e7e2", background: on ? W6_SOFT : "transparent" }}>
                <span className="h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: on ? W6 : "#c4ccc8", background: on ? W6 : "transparent" }} />
                <span className="flex-1 text-ink">{b.label}</span>
                {covered && <span className="w6-mono rounded-full bg-paper px-2 py-0.5 text-[10px] text-muted">Already covered on your team</span>}
              </button>
            );
          })}
        </div>
        {bn === "other" && <textarea className={`${input} mt-3`} rows={3} value={other} onChange={(e) => setOther(e.target.value)} placeholder="e.g. our onboarding flow confuses new users and we don't know why..." />}
        {rec && (
          <div className="mt-4 rounded-xl border p-4" style={{ borderColor: W6, background: W6_SOFT }}>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "#F4E9DD", color: "#8A5A24" }}>AI recommendation</span>
            <div className="mt-2 flex items-center gap-2">
              <span style={{ color: W6 }}>✓</span>
              <input className="w6-display flex-1 border-0 border-b-2 border-dashed bg-transparent text-base font-semibold text-ink outline-none focus:border-solid"
                style={{ borderColor: W6 }} value={recRole} onChange={(e) => setRecRole(e.target.value)} />
            </div>
            <p className="mt-1 text-sm text-ink-soft">{rec.reason}{teamContextSentence(rec)}</p>
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
            <button className={`${ghost} mt-3`} onClick={() => setRoles((rs) => [...rs, newRole({ title: recRole || rec.role, dept: rec.dept, reports_to: rec.reportsTo, goal: rec.goal, budget: rec.salary })])}>Add to hiring plan ↓</button>
          </div>
        )}
      </Card>

      <Card>
        <H3>3. Typical startup hiring order</H3>
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
                <span className="flex items-center gap-2">
                  {isFounder && <span className="w6-mono text-[10.5px] text-muted">You are here</span>}
                  {isHired && !isFounder && <span className="w6-mono text-[10.5px] text-muted">covered</span>}
                  {isRec && (
                    <>
                      <span className="w6-mono text-[10.5px] font-semibold" style={{ color: W6 }}>Recommended next</span>
                      <button className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold text-white" style={{ background: W6 }}
                        onClick={() => setRoles((rs) => [...rs, newRole({ ...NODE_ROLE_DEFAULTS[n], priority: "High" })])}>+ Add to hiring plan</button>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-1 flex items-center justify-between">
          <H3>4. Map out each role</H3>
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
  const prefix = tab === "li" ? "What we need from you: " : tab === "wf" ? "Must-have: " : "Needs: ";
  const draft = drafts[tab] + (notes ? `\n\n${prefix}${notes}` : "");

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const drawWrapped = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) => {
    const words = text.split(/\s+/);
    let line = "", lines = 0, cy = y;
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, cy);
        cy += lineHeight; lines++;
        line = words[i];
        if (lines >= maxLines - 1) break;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, cy);
  };
  const downloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grd.addColorStop(0, t.bg);
    grd.addColorStop(1, t.accent);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(960, 1240, 330, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 38px IBM Plex Mono, monospace";
    ctx.fillText(f.brand.toUpperCase(), 90, 120);
    ctx.font = "600 108px Fraunces, serif";
    drawWrapped(ctx, f.role, 90, 320, 1020, 112, 3);
    ctx.font = "400 44px IBM Plex Sans, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.86)";
    drawWrapped(ctx, f.tagline, 90, 700, 1020, 60, 4);
    const chips = [f.equity, f.location, f.stage].filter(Boolean);
    let cx = 90;
    ctx.font = "500 28px IBM Plex Mono, monospace";
    chips.forEach((chip) => {
      const w = ctx.measureText(chip).width + 44;
      ctx.strokeStyle = "rgba(255,255,255,.36)";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, 1120, w, 56);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(chip, cx + 22, 1156);
      cx += w + 18;
    });
    ctx.font = "500 34px IBM Plex Mono, monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(f.cta, 90, 1360);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${f.role.replace(/\s+/g, "-").toLowerCase()}-hiring-poster.png`;
    a.click();
    setToast("Poster downloaded as a PNG.");
    setTimeout(() => setToast(""), 2000);
  };
  return (
    <Card>
      <H3>Social hiring poster</H3>
      <p className={hint}>Generate a shareable hiring poster for LinkedIn, X, Instagram, or your founder socials. Use AI edits for quick changes, or tune the copy yourself.</p>
      <canvas ref={canvasRef} width={1200} height={1500} style={{ display: "none" }} />
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
          <div className="mt-3"><button className={ghost} onClick={downloadPoster}>Download poster (PNG)</button></div>
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
  const [delivery, setDelivery] = useState<"" | "auto" | "manual">("");
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [reminder, setReminder] = useState(48);
  const [confirm, setConfirm] = useState("");
  const equity = EQUITY_BY_ROLE[role] ?? "meaningful equity";
  const letter = () =>
    `OFFER OF EMPLOYMENT\n\n${companyName}, Inc. (the "Company")\n\nDear ${name},\n\nOn behalf of the Company, we are pleased to offer you the position of ${role}, reporting to [Add manager name and title]. This is a full-time, [exempt / non-exempt — confirm before sending] position.\n\nCompensation: [Add base salary], paid on the Company's regular payroll schedule.\nEquity: Subject to Board approval, you will be granted an option to purchase [Add number of shares] shares of the Company's common stock (representing approximately ${equity} of the Company on a fully-diluted basis as of the date of this offer), at an exercise price set at fair market value on your grant date. Your grant vests over 4 years with a 1-year cliff and double-trigger acceleration, as reflected on the Company's capitalization table.\nBenefits: [Add benefits summary — health coverage, PTO policy, etc. — once finalized]\nStart date: [Add start date], contingent on your continued eligibility to work in the United States and satisfactory completion of any background check the Company requires.\n\nYour employment with the Company is at-will: either you or the Company may end the employment relationship at any time, for any reason or no reason, with or without notice. No manager or representative other than [Add authorized signer, e.g. CEO] has authority to change this at-will status, and any such change must be in a signed writing.\n\nThis offer is contingent upon your signing the Company's standard Proprietary Information and Inventions Agreement and Mutual Arbitration Agreement, provided separately as part of your onboarding packet.\n\nThis letter, once signed by both parties, together with the agreements referenced above, is the entire agreement between you and the Company regarding your employment. It is governed by the laws of [Add state], without regard to conflict-of-laws principles. This offer remains open until [Add offer expiration date]; after that date we may need to revisit these terms.\n\nWe're excited about the possibility of you joining the team — please sign below to accept.\n\n_________________________                    _________________________\n${name}                Date                    [Add authorized signer], ${companyName}, Inc.                Date`;
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
            <button className={`${ghost} mt-3`} onClick={() => download(`${role.replace(/\s+/g, "-").toLowerCase()}-offer-letter.txt`, text)}>Download offer letter</button>
          </>
        )}
      </Card>
      {text && (
        <Card>
          <H3>Send the offer</H3>
          <p className={hint}>We can email it to your candidate for you, or you can send it yourself once it&apos;s downloaded.</p>
          {delivery === "" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="rounded-xl border border-line bg-white p-4 text-left hover:border-ink/30" onClick={() => setDelivery("auto")}>
                <p className="text-sm font-semibold text-ink">We&apos;ll send it</p>
                <p className="mt-1 text-xs text-ink-soft">Give us the candidate&apos;s email and we&apos;ll send the offer letter, with an optional signature reminder.</p>
              </button>
              <button className="rounded-xl border border-line bg-white p-4 text-left hover:border-ink/30" onClick={() => setDelivery("manual")}>
                <p className="text-sm font-semibold text-ink">I&apos;ll send it myself</p>
                <p className="mt-1 text-xs text-ink-soft">Download it above and send it however you normally would — we won&apos;t email anyone.</p>
              </button>
            </div>
          )}
          {delivery === "auto" && (
            <div>
              <div className="flex items-center justify-between"><span className="w6-mono text-xs font-semibold uppercase text-muted">We&apos;ll send it</span><button className="text-xs underline" style={{ color: W6 }} onClick={() => setDelivery("")}>Change</button></div>
              <p className="mb-1 mt-2 text-xs text-muted">{emailErr || "Where should the offer letter go?"}</p>
              <input type="email" className={input} placeholder="Candidate email, e.g. dana@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }} />
              <p className="w6-mono mb-1 mt-4 text-xs font-semibold uppercase text-muted">Signature reminder</p>
              <p className={hint}>If your candidate hasn&apos;t signed by then, we&apos;ll nudge them automatically.</p>
              <ReminderPicker hours={reminder} onPick={setReminder} />
              <button className={ghost} onClick={() => {
                if (!email.trim()) { setEmailErr("Add the candidate's email before we can send it."); return; }
                setConfirm(reminder === 0 ? `Sent to ${email} — no automatic reminder set.` : `Sent to ${email} — we'll remind them automatically if unsigned after ${reminder} hours.`);
              }}>Send to candidate</button>
            </div>
          )}
          {delivery === "manual" && (
            <div>
              <div className="flex items-center justify-between"><span className="w6-mono text-xs font-semibold uppercase text-muted">Sending it yourself</span><button className="text-xs underline" style={{ color: W6 }} onClick={() => setDelivery("")}>Change</button></div>
              <p className="mb-3 mt-2 text-xs text-muted">Download the offer letter above and send it to your candidate directly — we won&apos;t email them automatically.</p>
              <p className="w6-mono mb-1 text-xs font-semibold uppercase text-muted">Remind me to check in</p>
              <ReminderPicker hours={reminder} onPick={setReminder} />
              <button className={ghost} onClick={() => setConfirm(reminder === 0 ? "Got it — marked as sent, no check-in reminder set." : `Got it — we'll remind you to check in after ${reminder} hours if it's still unsigned.`)}>I&apos;ve sent this myself</button>
            </div>
          )}
          {confirm && <p className="mt-2 text-sm" style={{ color: W6 }}>✓ {confirm}</p>}
        </Card>
      )}
    </section>
  );
}

// ============================ Step 4: Onboard ==================================================
function StepOnboard({ companySlug, employees, setEmployees }: {
  companySlug: string; employees: Employee[]; setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Founding Engineer");
  const [addErr, setAddErr] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(employees[0]?.id ?? null);
  const [view, setView] = useState<"founder" | "employee">("founder");

  const upd = (id: string, patch: Partial<Employee>) => setEmployees((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const updDoc = (id: string, key: string, patch: Partial<DocRecord>) =>
    setEmployees((es) => es.map((e) => (e.id === id ? { ...e, docs: { ...e.docs, [key]: { ...e.docs[key], ...patch } } } : e)));

  const add = () => {
    if (!name.trim()) { setAddErr("Add the employee's name before continuing."); return; }
    const emp = newEmployeeRecord({ name: name.trim(), role, email: email.trim() });
    setEmployees((es) => [...es, emp]);
    setSelectedId(emp.id);
    setView("founder");
    setName(""); setEmail("");
    setAddErr(`${emp.name} added — generate their legal documents below.`);
  };

  const selected = employees.find((e) => e.id === selectedId) ?? employees[0] ?? null;

  const generateLink = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;
    upd(id, { onboarding_link: onboardingUrl(companySlug, emp), onboarding_sent: false, onboarding_confirm: `Personalized onboarding link generated for ${emp.name}.` });
  };
  const sendLink = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;
    const link = emp.onboarding_link || onboardingUrl(companySlug, emp);
    if (emp.onboarding_send_mode === "email") {
      if (!emp.email) { upd(id, { onboarding_link: link, onboarding_confirm: "Add an employee email before sending the onboarding link." }); return; }
      upd(id, { onboarding_link: link, onboarding_sent: true, onboarding_confirm: `Sent onboarding link to ${emp.email}. They enter tax elections and bank details directly.` });
    } else {
      if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
      upd(id, { onboarding_link: link, onboarding_confirm: "Copied onboarding link. Send it however you like." });
    }
  };
  const submitOnboarding = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;
    upd(id, {
      onboarding_complete: true,
      onboarding_confirm: `${emp.name} submitted their onboarding packet. Payroll setup now has their W-4, I-9 basics, work state, and direct deposit details.`,
      payroll_packet: { work_state: "California", tax_form: "W-4 complete", i9: "I-9 basics complete", bank: "Chase checking ending 4821", deposit: "Direct deposit authorized" },
    });
  };

  if (employees.length === 0) {
    return (
      <section>
        <Head title="Employee onboarding" badges={[["ai", "Auto-generated"]]}
          desc="Add each employee once their offer is signed. We'll generate their legal docs and a personalized self-onboarding link so they enter W-4 elections, I-9 basics, and direct deposit details themselves." />
        <Card>
          <H3>Add an employee</H3>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="Employee full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={input} placeholder="Employee email (needed to send automatically)" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <select className={`${input} mt-2`} value={role} onChange={(e) => setRole(e.target.value)}>{["Founding Engineer", "Product Designer", "Growth Marketer"].map((r) => <option key={r}>{r}</option>)}</select>
          <button className={`${ghost} mt-3`} onClick={add}>Add employee</button>
          {addErr && <p className="mt-2 text-xs text-muted">{addErr}</p>}
        </Card>
        <p className="py-6 text-center text-sm text-muted">No employees yet — add your first hire above once their offer is signed.</p>
      </section>
    );
  }

  return (
    <section>
      <Head title="Employee onboarding" badges={[["ai", "Auto-generated"]]}
        desc="Add each employee once their offer is signed. We'll generate their legal docs and a personalized self-onboarding link so they enter W-4 elections, I-9 basics, and direct deposit details themselves." />

      <Card>
        <H3>Add an employee</H3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={input} placeholder="Employee full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={input} placeholder="Employee email (needed to send automatically)" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <select className={`${input} mt-2`} value={role} onChange={(e) => setRole(e.target.value)}>{["Founding Engineer", "Product Designer", "Growth Marketer"].map((r) => <option key={r}>{r}</option>)}</select>
        <button className={`${ghost} mt-3`} onClick={add}>Add employee</button>
        {addErr && <p className="mt-2 text-xs text-muted">{addErr}</p>}
      </Card>

      <div className="mb-3 flex gap-2">
        <button onClick={() => setView("founder")} className="rounded-lg px-3.5 py-2 text-sm font-semibold" style={view === "founder" ? { background: W6_SOFT, color: W6, border: `1.5px solid ${W6}` } : { border: "1.5px solid #e3e7e2", color: "#5b6b60" }}>Founder view</button>
        <button onClick={() => setView("employee")} className="rounded-lg px-3.5 py-2 text-sm font-semibold" style={view === "employee" ? { background: W6_SOFT, color: W6, border: `1.5px solid ${W6}` } : { border: "1.5px solid #e3e7e2", color: "#5b6b60" }}>Employee view</button>
      </div>

      {view === "founder" ? (
        <>
          <Card>
            <H3>Pending onboarding</H3>
            <div className="divide-y divide-line">
              {employees.map((emp) => {
                const statusLabel = emp.onboarding_complete ? "Complete" : emp.onboarding_sent ? "Link sent" : "Not sent";
                return (
                  <button key={emp.id} onClick={() => setSelectedId(emp.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left" style={selected?.id === emp.id ? { background: "#FAFBFA" } : undefined}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "#243530" }}>{avatarInitials(emp.name)}</span>
                      <div><p className="text-sm font-semibold text-ink">{emp.name}</p><p className="w6-mono text-[11px] text-muted">{emp.role} · start {emp.start_date}</p></div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={emp.onboarding_complete ? { background: W6_SOFT, color: W6 } : { background: "#F1F3F0", color: "#8a938d" }}>{statusLabel}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {selected && (
            <>
              <Card>
                <H3>Send onboarding link — {selected.name}</H3>
                <p className={hint}>{selected.name} fills in their own information — address, bank details, W-4 elections, and emergency contact. You do not relay anything manually.</p>
                {selected.onboarding_link && (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-paper/60 p-3">
                    <span className="w6-mono break-all text-xs" style={{ color: W6 }}>{selected.onboarding_link}</span>
                  </div>
                )}
                <p className="w6-mono mb-1 text-xs font-semibold uppercase text-muted">Send via</p>
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <button className="rounded-lg border p-3 text-left text-sm" style={selected.onboarding_send_mode === "email" ? { borderColor: W6, background: W6_SOFT } : { borderColor: "#e3e7e2" }} onClick={() => upd(selected.id, { onboarding_send_mode: "email" })}>
                    <p className="font-semibold text-ink">Email automatically</p><p className="text-xs text-ink-soft">We send it to {selected.email || "their email"}.</p>
                  </button>
                  <button className="rounded-lg border p-3 text-left text-sm" style={selected.onboarding_send_mode === "copy" ? { borderColor: W6, background: W6_SOFT } : { borderColor: "#e3e7e2" }} onClick={() => upd(selected.id, { onboarding_send_mode: "copy" })}>
                    <p className="font-semibold text-ink">Copy link myself</p><p className="text-xs text-ink-soft">Send it however you like — Slack, text, email.</p>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={ghost} onClick={() => (selected.onboarding_link ? sendLink(selected.id) : generateLink(selected.id))}>{selected.onboarding_link ? "Send onboarding link" : "Generate onboarding link"}</button>
                  {selected.onboarding_link && <button className={ghost} onClick={() => sendLink(selected.id)}>{selected.onboarding_send_mode === "copy" ? "Copy link" : "Resend link"}</button>}
                  <button className={ghost} onClick={() => setView("employee")}>Preview what {selected.name} sees</button>
                </div>
                {selected.onboarding_confirm && <p className="mt-2 text-sm" style={{ color: W6 }}>✓ {selected.onboarding_confirm}</p>}
              </Card>

              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Legal documents — {selected.name}</div>
              {DOC_TYPES.map((t) => {
                const doc = selected.docs[t.key];
                return (
                  <Card key={t.key}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">{t.label}</p>
                      <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={doc.status === "signed" ? { background: W6_SOFT, color: W6 } : { background: "#F1F3F0", color: "#8a938d" }}>{doc.status === "signed" ? "Signed" : "Awaiting signature"}</span>
                    </div>
                    {!doc.generated ? (
                      <button className={ghost} onClick={() => updDoc(selected.id, t.key, { generated: true, text: t.gen(selected.name, selected.role, companySlug) })}>Generate {t.abbr}</button>
                    ) : (
                      <>
                        <textarea className={`${input} w6-mono`} rows={8} value={doc.text} onChange={(e) => updDoc(selected.id, t.key, { text: e.target.value })} />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button className={ghost} onClick={() => download(`${selected.name.replace(/\s+/g, "-").toLowerCase()}-${t.key}.txt`, doc.text)}>Download {t.abbr}</button>
                          {doc.status !== "signed" && <button className={ghost} onClick={() => updDoc(selected.id, t.key, { status: "signed" })}>Simulate signature received</button>}
                        </div>

                        {doc.delivery_mode === "" && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <button className="rounded-lg border border-line p-3 text-left text-sm hover:border-ink/30" onClick={() => updDoc(selected.id, t.key, { delivery_mode: "manual" })}>
                              <p className="font-semibold text-ink">Download &amp; I&apos;ll send it</p><p className="text-xs text-ink-soft">Send this to {selected.name} yourself.</p>
                            </button>
                            <button className="rounded-lg border border-line p-3 text-left text-sm hover:border-ink/30" onClick={() => updDoc(selected.id, t.key, { delivery_mode: "auto" })}>
                              <p className="font-semibold text-ink">Set a reminder</p><p className="text-xs text-ink-soft">Track this after the onboarding link goes out.</p>
                            </button>
                          </div>
                        )}
                        {doc.delivery_mode === "manual" && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between"><span className="w6-mono text-[11px] font-semibold uppercase text-muted">Sending it yourself</span><button className="text-xs underline" style={{ color: W6 }} onClick={() => updDoc(selected.id, t.key, { delivery_mode: "" })}>Change</button></div>
                            <ReminderPicker hours={doc.reminder_hours} onPick={(h) => updDoc(selected.id, t.key, { reminder_hours: h })} />
                            <button className={ghost} onClick={() => updDoc(selected.id, t.key, { sent_confirm: doc.reminder_hours === 0 ? "Marked as sent." : `We'll remind you after ${doc.reminder_hours} hours if it's still unsigned.` })}>I&apos;ve sent this myself</button>
                          </div>
                        )}
                        {doc.delivery_mode === "auto" && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between"><span className="w6-mono text-[11px] font-semibold uppercase text-muted">Reminder only</span><button className="text-xs underline" style={{ color: W6 }} onClick={() => updDoc(selected.id, t.key, { delivery_mode: "" })}>Change</button></div>
                            <ReminderPicker hours={doc.reminder_hours} onPick={(h) => updDoc(selected.id, t.key, { reminder_hours: h })} />
                            <button className={`${ghost} mt-1`} onClick={() => updDoc(selected.id, t.key, { sent_confirm: doc.reminder_hours === 0 ? "No reminder set." : `Reminder set for ${doc.reminder_hours} hours.` })}>Set reminder</button>
                          </div>
                        )}
                        {doc.sent_confirm && <p className="mt-2 text-sm" style={{ color: W6 }}>✓ {doc.sent_confirm}</p>}
                      </>
                    )}
                  </Card>
                );
              })}
            </>
          )}
        </>
      ) : selected && (
        <Card>
          <H3>Employee preview</H3>
          <div className="rounded-lg bg-paper/60 p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "#243530" }}>{avatarInitials(selected.name)}</span>
              <div><p className="font-semibold text-ink">Welcome, {selected.name}</p><p className="text-xs text-ink-soft">{selected.role} · onboarding</p></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[["Home address", "Required"], ["W-4 elections", "Federal withholding"], ["Bank details", "Direct deposit"], ["Emergency contact", "Required"]].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-line bg-white p-2.5"><p className="w6-mono text-[10px] uppercase text-muted">{l}</p><p className="text-sm text-ink">{v}</p></div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button className={ghost} onClick={() => submitOnboarding(selected.id)}>Submit onboarding packet</button>
              <button className={ghost} onClick={() => setView("founder")}>Back to founder view</button>
            </div>
          </div>
        </Card>
      )}
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
          <div className="space-y-2">
            {ready.map((e) => (
              <div key={e.id} className="rounded-lg border border-line p-3 text-sm">
                <p className="font-semibold text-ink">{e.name} <span className="font-normal text-muted">· {e.role}</span></p>
                <p className="mt-1 text-xs text-muted">
                  {e.payroll_packet ? `${e.payroll_packet.work_state} · ${e.payroll_packet.tax_form} · ${e.payroll_packet.i9} · ${e.payroll_packet.deposit}` : "Submitted — details pending sync"}
                </p>
              </div>
            ))}
          </div>
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
  const upd = (id: string, patch: Partial<Employee>) => setEmployees((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  return (
    <section>
      <Head title="Employee access" badges={[["confirm", "You confirm"]]}
        desc="Decide what each new hire can see inside StartupKit. Start narrower than feels necessary — it's easy to grant more access later, harder to walk back after someone's already seen the cap table." />
      <Card>
        <H3>Access tiers</H3>
        <div className="grid gap-2 sm:grid-cols-2">
          {TIERS.map((t) => <div key={t.name} className="rounded-xl border border-line p-3"><p className="text-sm font-bold text-ink">{t.name}</p><p className="mt-1 text-xs text-ink-soft">{t.desc}</p></div>)}
        </div>
      </Card>
      <Card>
        <H3>Assign access</H3>
        {employees.length === 0 ? <p className="py-4 text-center text-sm text-muted">Add employees in the Onboarding step to assign their access.</p> : (
          <div className="space-y-3">
            {employees.map((e) => (
              <div key={e.id} className="rounded-lg border border-line p-3">
                <p className="text-sm font-semibold text-ink">{e.name} <span className="font-normal text-muted">· {e.role}</span></p>
                {!e.email ? (
                  <div className="mt-2">
                    <p className="mb-1 text-xs text-muted">We need an email on file before we can grant {e.name} access.</p>
                    <div className="flex gap-2">
                      <input className={input} placeholder="Employee email" id={`acc-email-${e.id}`} />
                      <button className={ghost} onClick={() => {
                        const el = document.getElementById(`acc-email-${e.id}`) as HTMLInputElement | null;
                        const val = el?.value.trim();
                        if (!val) return;
                        upd(e.id, { email: val });
                      }}>Save email</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">{e.email}</span>
                    <select className={`${input} !w-auto py-1 text-sm`} value={e.tier} onChange={(ev) => upd(e.id, { tier: ev.target.value })}>{TIERS.map((t) => <option key={t.name}>{t.name}</option>)}</select>
                    {e.access_granted ? <span className="text-sm" style={{ color: W6 }}>✓ Granted</span> : (
                      <button className={ghost} onClick={() => upd(e.id, { access_granted: true, access_confirm: `${e.name} has been granted ${e.tier}.` })}>Grant</button>
                    )}
                  </div>
                )}
                {e.access_confirm && <p className="mt-1 text-xs" style={{ color: W6 }}>✓ {e.access_confirm}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
