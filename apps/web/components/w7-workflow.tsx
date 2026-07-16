"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  saveGtm, generateGtm, completePhase, getGtmHealth, gtmExportUrl, gtmDocUrl, discoverAccounts,
  readMotion, researchPricing, getDeliverability, generateContent, getChannelMatrix,
  getGtmGuardrails, getGtmAttribution, gtmChat,
} from "@/lib/api";
import type {
  Attribution, BrandState, Campaign, ChannelMatrix, ContentIdea, Deliverability, DesignPartner,
  Experiment, GtmGuardrail, GtmHealth, GtmState, MotionRead, PriceComp, PricingTier,
  TargetAccount, Task, WorkflowView,
} from "@/lib/types";

// W7 · Go-To-Market — the revenue engine.
//
// Boundary (the rule this whole workflow is built on):
//   W5 produces the file. W7 produces the reply, the payment, and the evidence.
// W5's ICP, positioning, category and tagline arrive as *inherited context* and are never re-asked.
//
// Quiet by default: white surfaces, hairline borders, ink primary buttons. The accent is spent only
// on the W7 tag, the progress bar, and status dots — the things worth pointing at.
const R = "#A32D2D"; // W7 accent (matches the workflow catalog color)
const GREEN = "#16A34A";
const INK = "#111827";

const card = "rounded-2xl border border-[#EBECE9] bg-white";
const btnInk = "rounded-lg px-4 py-2.5 text-sm font-semibold text-white";
const btnGhost =
  "rounded-lg border border-[#EBECE9] bg-white px-4 py-2.5 text-sm font-medium text-[#3A414D] hover:border-[#c9cfda] disabled:opacity-50";

type Module = {
  n: number; phase: number; id: string; title: string; desc: string; why: string;
  built?: boolean; // has a real tool behind it (vs. mark-complete only)
};

const PHASES = [
  { n: 1, name: "Define the offer", summary: "Who you sell to, how you sell, and what you charge." },
  { n: 2, name: "Build the funnel", summary: "Somewhere to land, capture, and track." },
  { n: 3, name: "Run the motion", summary: "Send, talk, and close the first ten." },
];

const MODULES: Module[] = [
  {
    n: 1, phase: 1, id: "strategy", built: true, title: "GTM Strategy & Motion",
    desc: "Outbound, product-led, or hybrid — plus a 90-day plan.",
    why: "The motion is the first fork: it decides your channels, your pricing band, and everything downstream. We recommend one from your price, product complexity, and buying committee — you confirm it.",
  },
  {
    n: 2, phase: 1, id: "icp", built: true, title: "ICP & Target List",
    desc: "Sharpen W5's ICP into an actual list of accounts to contact.",
    why: "An ICP is a decision guide, not a demographic. Triggers and disqualifiers turn it into a list you can work. If it yields more than ~200 accounts, it's too broad to be useful.",
  },
  {
    n: 3, phase: 1, id: "pricing", built: true, title: "Pricing & Packaging",
    desc: "Model, tiers, and the pilot offer.",
    why: "Nobody helps a founder decide the price — Stripe and Orb only bill it. The decision lives here; the pricing page lives in W5. Locking it regenerates that page.",
  },
  {
    n: 4, phase: 2, id: "crm", built: true, title: "CRM & Pipeline",
    desc: "Connect HubSpot or Attio and set your stages.",
    why: "We connect a CRM, we don't rebuild one. At your stage the relationship model matters more than deal stages.",
  },
  {
    n: 5, phase: 2, id: "landing", built: true, title: "Landing & Lead Capture",
    desc: "Point W5's site at a form that reaches your CRM.",
    why: "Your site already exists from W5. This gives it a job: capture a lead and put it somewhere you'll actually see it.",
  },
  {
    n: 6, phase: 2, id: "analytics", built: true, title: "Analytics & UTM",
    desc: "Install tracking, verify it, and build tagged links.",
    why: "This is the gate for every number in Metrics. Until tracking is verified live, we show you nothing rather than something invented.",
  },
  {
    n: 7, phase: 3, id: "outreach", built: true, title: "Sequences & the First 20",
    desc: "Compose the touches — then send the first 20 by hand.",
    why: "At pre-seed the founder is the SDR. We compose and schedule; you send from your own mailbox. We never send from our IPs, and we don't do autonomous AI SDRs.",
  },
  {
    n: 8, phase: 1, id: "partners", built: true, title: "Design Partners (0→10)",
    desc: "Five to ten partners you walk from intro to paying.",
    why: "At pre-seed you don't run a pipeline of 50 — you run 5-10 design partners. You trade access and attention for feedback, references, and your first revenue. This board walks each one to paid, and it's what feeds the rep-hiring gate honestly.",
  },
  {
    n: 9, phase: 3, id: "content", built: true, title: "Content Engine",
    desc: "Ideas from your Brand Core, scheduled by week.",
    why: "If your motion is product-led or hybrid, content IS your channel — and this is where the Motion tool's recommendation stops being a dead end. Ideas are generated from your positioning and pillars, not a blank page.",
  },
  {
    n: 10, phase: 3, id: "discovery", built: true, title: "Discovery & Objections",
    desc: "Call script, battlecards, and an objection library.",
    why: "The first 8–16 weeks of selling yourself is what produces the objection library a rep would need later. Log it while you learn it.",
  },
];

// Module completion → the 3 phases the catalog tracks. Completing these marks W7 complete.
const PHASE_GATES: Record<number, string[]> = {
  1: ["strategy", "icp", "pricing"],
  2: ["crm", "landing", "analytics"],
  3: ["outreach", "discovery"],
};

const EMPTY_GTM: GtmState = {
  inputs: {
    acv: "", self_serve: "", committee: "", size_band: "", triggers: [], disqualifiers: "",
    tier_counts: [], wtp: [], capture_fields: [], thanks: "", utm_source: "", utm_medium: "",
    utm_campaign: "", crm_model: "", payment_link: "",
  },
  strategy: { motion: "", motion_rationale: "", objective: "", channels: [], summary: "" },
  pricing: { model: "", tiers: [], pilot: "", locked: false },
  accounts: [],
  sequences: [],
  connections: [],
  lost_deals: [],
  campaigns: [],
  tasks: [],
  partners: [],
  content: [],
  experiments: [],
  steps_done: [],
};

type W7Actions = {
  companyId: string;
  companyName: string;
  gtm: GtmState;
  brand?: BrandState;
  has: (id: string) => boolean;
  overallPct: number;
  complete: (id: string) => Promise<void>;
  toggle: (id: string) => void;
  patch: (partial: Partial<GtmState>, note?: string) => Promise<void>;
  generate: () => Promise<void>;
  generating: boolean;
  health?: GtmHealth;
  setConnection: (kind: string, provider: string, status: string, detail: string) => void;
  busy: boolean;
  notify: (msg: string) => void;
  goWorkflow: (code: string) => void;
};
const W7Context = createContext<W7Actions | null>(null);
function useW7(): W7Actions {
  const ctx = useContext(W7Context);
  if (!ctx) throw new Error("useW7 must be used within W7Workflow");
  return ctx;
}

// ============================================================================================
export function W7Workflow({
  companyId,
  companyName,
  initialGtm,
  initialBrand,
  view,
}: {
  companyId: string;
  companyName: string;
  initialGtm?: GtmState;
  initialBrand?: BrandState;
  view: WorkflowView;
}) {
  const [gtm, setGtm] = useState<GtmState>(() => ({ ...EMPTY_GTM, ...(initialGtm ?? {}) }));
  const [section, setSection] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [health, setHealth] = useState<GtmHealth>();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const phasesRef = useRef<Set<number>>(new Set(view.completed_phases ?? []));

  const notify = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const syncPhases = useCallback(
    async (steps: string[]) => {
      for (const [n, gates] of Object.entries(PHASE_GATES)) {
        const num = Number(n);
        if (phasesRef.current.has(num)) continue;
        if (gates.every((g) => steps.includes(`mod:${g}`))) {
          try {
            await completePhase(companyId, "W7", num);
            phasesRef.current.add(num);
          } catch {
            /* retried on the next change */
          }
        }
      }
    },
    [companyId],
  );

  const persist = useCallback(
    async (next: GtmState, note?: string) => {
      setGtm(next);
      setBusy(true);
      try {
        const snap = await saveGtm(companyId, next);
        const saved = snap.gtm ? { ...EMPTY_GTM, ...snap.gtm } : next;
        setGtm(saved);
        getGtmHealth(companyId).then(setHealth).catch(() => {});
        await syncPhases(saved.steps_done);
        if (note) notify(note);
      } catch {
        notify("Couldn't save — check your connection.");
      } finally {
        setBusy(false);
      }
    },
    [companyId, notify, syncPhases],
  );

  // On load, reconcile the catalog phases with whatever modules are already complete — so W7's
  // status on the workflows page is never stale (same bridge W5 uses).
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    syncPhases(gtm.steps_done);
    getGtmHealth(companyId).then(setHealth).catch(() => {});
  }, [syncPhases, gtm.steps_done, companyId]);

  const has = useCallback((id: string) => gtm.steps_done.includes(id), [gtm.steps_done]);

  const complete = useCallback(
    async (id: string) => {
      if (gtm.steps_done.includes(id)) return notify("Already done ✓");
      await persist({ ...gtm, steps_done: [...gtm.steps_done, id] }, "Marked complete ✓");
    },
    [gtm, persist, notify],
  );

  const toggle = useCallback(
    (id: string) => {
      const done = gtm.steps_done.includes(id);
      persist(
        {
          ...gtm,
          steps_done: done ? gtm.steps_done.filter((s) => s !== id) : [...gtm.steps_done, id],
        },
        done ? "Marked incomplete" : "Marked complete ✓",
      );
    },
    [gtm, persist],
  );

  const patch = useCallback(
    async (partial: Partial<GtmState>, note?: string) => {
      await persist({ ...gtm, ...partial }, note);
    },
    [gtm, persist],
  );

  // Draft the whole engine from the Company Object + Brand Core. The founder edits, never authors.
  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const d = await generateGtm(companyId);
      await persist(
        {
          ...gtm,
          strategy: d.strategy,
          sequences: d.sequences.length ? d.sequences : gtm.sequences,
          campaigns: d.campaigns.length ? d.campaigns : gtm.campaigns,
          tasks: d.tasks.length ? d.tasks : gtm.tasks,
        },
        d.source === "ai" ? "Drafted by AI from your Brand Core ✓" : "Drafted from your Company Object ✓",
      );
    } catch {
      notify("Couldn't generate — is the API running?");
    } finally {
      setGenerating(false);
    }
  }, [companyId, gtm, persist, notify]);

  const setConnection = useCallback(
    (kind: string, provider: string, status: string, detail: string) => {
      const rest = gtm.connections.filter((c) => c.kind !== kind);
      const next = status === "off" ? rest : [...rest, { kind, provider, status, detail }];
      persist({ ...gtm, connections: next }, status === "off" ? `${provider} disconnected` : `${provider} connected ✓`);
    },
    [gtm, persist],
  );

  const overallPct = useMemo(() => {
    const done = MODULES.filter((m) => gtm.steps_done.includes(`mod:${m.id}`)).length;
    return Math.round((done / MODULES.length) * 100);
  }, [gtm.steps_done]);

  const goWorkflow = useCallback(
    (code: string) => {
      window.location.href = `/company/${companyId}/workflows/${code}`;
    },
    [companyId],
  );

  const actions: W7Actions = {
    companyId, companyName, gtm, brand: initialBrand, has, overallPct,
    complete, toggle, patch, generate, generating, health, setConnection, busy, notify, goWorkflow,
  };

  let body: React.ReactNode;
  if (section === "strategy") body = <StrategyTool onBack={() => setSection(null)} />;
  else if (section === "icp") body = <IcpTool onBack={() => setSection(null)} />;
  else if (section === "pricing") body = <PricingTool onBack={() => setSection(null)} />;
  else if (section === "crm") body = <CrmTool onBack={() => setSection(null)} />;
  else if (section === "landing") body = <LandingTool onBack={() => setSection(null)} />;
  else if (section === "analytics") body = <AnalyticsTool onBack={() => setSection(null)} />;
  else if (section === "outreach") body = <OutreachTool onBack={() => setSection(null)} />;
  else if (section === "discovery") body = <DiscoveryTool onBack={() => setSection(null)} />;
  else if (section === "partners") body = <PartnersTool onBack={() => setSection(null)} />;
  else if (section === "content") body = <ContentTool onBack={() => setSection(null)} />;
  else body = <Hub onOpenSection={setSection} />;

  return (
    <W7Context.Provider value={actions}>
      {body}
      <GtmChatDock />
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-[#2A2F3C] bg-[#111827] px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[13px]" style={{ background: R }}>✓</span>
          {toast}
        </div>
      )}
    </W7Context.Provider>
  );
}

// ---------------- hub ----------------
function Hub({ onOpenSection }: { onOpenSection: (s: string) => void }) {
  const A = useW7();
  const [tab, setTab] = useState<"modules" | "campaigns" | "metrics" | "exports" | "connections">("modules");
  const [open, setOpen] = useState<number | null>(1);

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-white" style={{ background: R }}>W7</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">Go-To-Market</h1>
            <p className="mt-1 max-w-xl text-sm text-[#6B7280]">
              Turn the brand into revenue. One job: your first ten paying customers.
            </p>
          </div>
        </div>
        <div className="min-w-[220px] text-right">
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-[#6B7280]">Overall Progress</span>
            <span className="text-2xl font-extrabold" style={{ color: R }}>{A.overallPct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EEF0F3]">
            <div className="h-full rounded-full transition-all" style={{ width: `${A.overallPct}%`, background: R }} />
          </div>
          <p className="mt-1 font-mono text-[11px] text-[#9AA3B0]">
            {answeredCount(A.gtm)} of 5 questions answered
          </p>
        </div>
      </div>

      <InheritedContext />
      <GenerateBanner />

      {/* tabs */}
      <div className="mt-4 flex gap-1 border-b border-[#EEF0F3]">
        {([["modules", "Overview", ""], ["campaigns", "Campaigns", String(A.gtm.campaigns.length)], ["metrics", "Metrics", ""], ["exports", "Exports", "10"], ["connections", "Connections", `${A.gtm.connections.length}/4`]] as const).map(([id, label, cnt]) => (
          <button key={id} onClick={() => setTab(id)} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold"
            style={tab === id ? { color: R, borderBottom: `2px solid ${R}` } : { color: "#6B7280", borderBottom: "2px solid transparent" }}>
            {label}
            {cnt && <span className="rounded-full bg-[#F1F3F6] px-1.5 py-0.5 text-[10px] text-[#6B7280]">{cnt}</span>}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_300px]">
        {tab === "campaigns" ? <CampaignsView /> : tab === "exports" ? <ExportsView /> : tab === "metrics" ? <MetricsView onOpenSection={onOpenSection} /> : tab === "connections" ? <ConnectionsView /> : (
          <FiveQuestions onOpenSection={onOpenSection} open={open} setOpen={setOpen} />
        )}

        {/* right rail */}
        <aside className="space-y-4">
          <GuardrailsCard onOpenSection={onOpenSection} />
          <GtmHealthCard />
          <TasksRail onOpenSection={onOpenSection} />
          <LoopSignals />
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">Handoffs</p>
            <p className="mt-1 text-xs text-[#6B7280]">W7 feeds work back into other workflows.</p>
            <div className="mt-3 space-y-1.5">
              {([["needs W5 ✓", "W5"], ["→ W2 first contract", "W2"], ["→ W3 payments", "W3"], ["→ W6 first hire", "W6"]] as [string, string][]).map(([t, code]) => (
                <button key={t} onClick={() => A.goWorkflow(code)} className="block w-full rounded-lg border border-[#EBECE9] px-3 py-1.5 text-left text-xs text-[#3A414D] hover:border-[#c9cfda]">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* the philosophy lives in a footer, not on the founder's screen */}
      <details className="mt-8 border-t border-[#EEF0F3] pt-4">
        <summary className="cursor-pointer text-xs text-[#9AA3B0]">How W7 works, and what it deliberately doesn&apos;t do</summary>
        <div className="mt-2 grid gap-4 text-xs leading-relaxed text-[#6B7280] sm:grid-cols-2">
          <p>
            <b className="text-[#111827]">W5 produces the file. W7 produces the reply, the payment, and the evidence.</b>{" "}
            Your ICP, positioning and deck come from W5 and are never re-asked. W7 does the research, the
            drafting and the tracking — you do the sending, the talking and the signing.
          </p>
          <p>
            <b className="text-[#111827]">Deliberately not built:</b> autonomous AI SDRs (at pre-seed, you are the
            SDR) · sending infrastructure (never our IPs) · a CRM (connect HubSpot or Attio) · billing (Stripe,
            via W3) · anything W5 already ships.
          </p>
        </div>
      </details>
    </div>
  );
}

// ---------------- inherited context (the W5 boundary, made visible) ----------------
function InheritedContext() {
  const { brand, goWorkflow } = useW7();
  const core = brand?.core;
  const chips: [string, string][] = [
    ["ICP", core?.icp || ""],
    ["Positioning", core?.positioning || ""],
    ["Category", core?.category || ""],
    ["Tagline", core?.tagline || ""],
  ].filter(([, v]) => v) as [string, string][];

  if (!chips.length) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-[#E7C9C5] bg-[#FCF6F5] px-4 py-2.5 text-xs" style={{ color: "#7A2E27" }}>
        No Brand Core yet — W7 reads your ICP and positioning from <b>W5</b>. Generate it there first and it appears here automatically.{" "}
        <button onClick={() => goWorkflow("W5")} className="font-semibold underline">Open W5 →</button>
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[#DDE1DC] bg-[#FAFBFA] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA3B0]">Inherited from W5 · never re-asked</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map(([k, v]) => (
          <span key={k} className="max-w-full truncate rounded-full border border-[#EBECE9] bg-white px-3 py-1 text-xs text-[#3A414D]">
            <b className="text-[#111827]">{k}:</b> {v}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------- metrics (gated: nothing invented) ----------------
function MetricsView({ onOpenSection }: { onOpenSection: (s: string) => void }) {
  const A = useW7();
  const analytics = A.gtm.connections.find((c) => c.kind === "analytics");
  const live = analytics?.status === "verified";
  const accounts = A.gtm.accounts;

  // The pipeline funnel is OUR data — it's real whether or not analytics is connected.
  const funnel: [string, number][] = [
    ["Prospects", accounts.length],
    ["Contacted", accounts.filter((a) => ["contacted", "replied", "demo", "pilot", "won"].includes(a.stage)).length],
    ["Replied", accounts.filter((a) => ["replied", "demo", "pilot", "won"].includes(a.stage)).length],
    ["Demo", accounts.filter((a) => ["demo", "pilot", "won"].includes(a.stage)).length],
    ["Pilot", accounts.filter((a) => ["pilot", "won"].includes(a.stage)).length],
    ["Won", accounts.filter((a) => a.stage === "won").length],
  ];
  const top = funnel[0][1] || 1;

  return (
    <div className="space-y-4">
      {/* pipeline — real, from the target list */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-[#111827]">Pipeline <span className="font-normal text-[#9AA3B0]">— from your target list</span></h3>
        {accounts.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[#FAFBFA] p-6 text-center text-xs text-[#9AA3B0]">
            No accounts yet. Build the list in <b>ICP &amp; Target List</b> and the funnel fills itself in.
          </p>
        ) : (
          <div className="mt-3 space-y-1.5">
            {funnel.map(([l, v]) => (
              <div key={l} className="flex items-center gap-3">
                <span className="w-20 text-xs text-[#3A414D]">{l}</span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-[#F1F3F6]">
                  <div className="h-full rounded" style={{ width: `${Math.max((v / top) * 100, v ? 4 : 0)}%`, background: R, opacity: 0.85 }} />
                </div>
                <span className="w-16 text-right font-mono text-xs font-bold text-[#111827]">
                  {v}
                  <span className="ml-1 font-normal text-[#9AA3B0]">{top ? `${Math.round((v / top) * 100)}%` : ""}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AttributionCard />

      {/* site metrics — gated on verified tracking */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-[#111827]">Site &amp; traffic</h3>
        {!live ? (
          <div className="mt-3 rounded-lg bg-[#FAFBFA] p-6 text-center">
            <p className="text-sm font-bold text-[#111827]">No data yet — tracking isn&apos;t live</p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#6B7280]">
              Visitors, signups and conversion appear once analytics is connected <b>and verified</b> on your site.
              We show you nothing rather than something invented.
            </p>
            <button onClick={() => onOpenSection("analytics")} className={`${btnInk} mt-4`} style={{ background: INK }}>
              Connect analytics →
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-xs leading-relaxed text-[#6B7280]">
              Tracking is verified with <b>{analytics?.provider}</b>. StartupKit records that it&apos;s installed but doesn&apos;t read your
              traffic back — open {analytics?.provider} for the numbers. Display-only either way: we never adjust campaigns or budgets on our own.
            </p>
            <p className="mt-3 rounded-lg bg-[#EAF7EF] p-3 text-xs" style={{ color: "#1E7A3D" }}>
              ✓ {analytics?.provider} verified · property <code className="rounded bg-white/60 px-1">{analytics?.detail}</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- attribution — which trigger is actually working ----------------
// Computed from the real stage of the accounts each trigger sourced. Below 3 contacted per
// trigger the backend refuses to call a winner — an early "winner" is just noise with a crown.
function AttributionCard() {
  const A = useW7();
  const [att, setAtt] = useState<Attribution>();
  const stamp = JSON.stringify(A.gtm.accounts.map((a) => [a.trigger, a.stage]));
  useEffect(() => {
    getGtmAttribution(A.companyId).then(setAtt).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [A.companyId, stamp]);

  return (
    <div className={`${card} p-5`}>
      <h3 className="text-sm font-bold text-[#111827]">
        Attribution <span className="font-normal text-[#9AA3B0]">— which trigger is producing conversations</span>
      </h3>
      {!att || !att.rows.length ? (
        <p className="mt-3 rounded-lg bg-[#FAFBFA] p-6 text-center text-xs text-[#9AA3B0]">
          {att?.note || "No accounts yet — attribution starts when the list does."}
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-[#9AA3B0]">
                  <th className="pb-2 font-semibold">Trigger</th>
                  <th className="pb-2 text-right font-semibold">Accounts</th>
                  <th className="pb-2 text-right font-semibold">Contacted</th>
                  <th className="pb-2 text-right font-semibold">Replied</th>
                  <th className="pb-2 text-right font-semibold">Won</th>
                </tr>
              </thead>
              <tbody>
                {att.rows.map((r) => (
                  <tr key={r.trigger} className="border-t border-[#EEF0F3]"
                    style={r.trigger === att.best ? { background: "#FCF6F5" } : undefined}>
                    <td className="max-w-[220px] truncate py-2 pr-2 font-medium text-[#111827]">
                      {r.trigger === att.best && <span className="mr-1" style={{ color: R }}>★</span>}
                      {r.trigger}
                    </td>
                    <td className="py-2 text-right font-mono">{r.accounts}</td>
                    <td className="py-2 text-right font-mono">{r.contacted}</td>
                    <td className="py-2 text-right font-mono" style={{ color: r.replied ? GREEN : undefined }}>{r.replied}</td>
                    <td className="py-2 text-right font-mono font-bold" style={{ color: r.won ? GREEN : undefined }}>{r.won}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 rounded-lg p-3 text-xs leading-relaxed"
            style={att.best ? { background: "#EAF7EF", color: "#1E7A3D" } : { background: "#FAFBFA", color: "#6B7280" }}>
            {att.note}
          </p>
        </>
      )}
    </div>
  );
}

// ---------------- the loop — W7 is not a leaf ----------------
// Signals computed from real GTM state. Each one is a handoff into another workflow.
function LoopSignals() {
  const A = useW7();
  const accounts = A.gtm.accounts;
  const won = accounts.filter((a) => a.stage === "won").length;
  const inConvo = accounts.filter((a) => ["replied", "demo", "pilot", "won"].includes(a.stage)).length;
  const pilots = accounts.filter((a) => ["pilot", "won"].includes(a.stage)).length;
  const priceLosses = A.gtm.lost_deals.filter((l) => l.reason === "price").length;

  const signals: { fired: boolean; event: string; text: string; code: string }[] = [
    { fired: inConvo > 0, event: "first_client_conversation", text: `${inConvo} account${inConvo === 1 ? "" : "s"} in conversation — W2 can draft the MSA before you need it.`, code: "W2" },
    { fired: pilots > 0, event: "stripe_needed", text: "A pilot is live — you'll need to take payment. W3 sets up Stripe.", code: "W3" },
    { fired: A.gtm.pricing.locked, event: "pricing_locked", text: "Pricing is locked — W5 can regenerate your pricing-page copy to match.", code: "W5" },
    { fired: priceLosses >= 3, event: "deal_lost ×3", text: `${priceLosses} deals lost on price — that's positioning, not sales. Re-open it in W5.`, code: "W5" },
    { fired: won >= 10, event: "first_10_customers", text: "Ten closed by you. The process is repeatable — W6 can hire the first rep.", code: "W6" },
  ].filter((s) => s.fired);

  return (
    <div className={`${card} p-4`}>
      <p className="text-sm font-bold text-[#111827]">Ready in other workflows</p>
      <p className="mt-1 text-xs text-[#6B7280]">Things your progress here has unlocked elsewhere.</p>
      {signals.length === 0 ? (
        <p className="mt-3 rounded-lg bg-[#FAFBFA] p-3 text-[11px] leading-relaxed text-[#9AA3B0]">
          Nothing fired yet. As accounts reply, pilots start, or deals are lost, handoffs to W2/W3/W5/W6 appear here automatically.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {signals.map((s) => (
            <button key={s.event} onClick={() => A.goWorkflow(s.code)}
              className="block w-full rounded-lg border border-[#EBECE9] p-3 text-left hover:border-[#c9cfda]">
              <code className="text-[10px] font-semibold" style={{ color: R }}>{s.event}</code>
              <p className="mt-1 text-xs leading-relaxed text-[#3A414D]">{s.text}</p>
              <p className="mt-1 text-[11px] font-semibold" style={{ color: R }}>Open {s.code} →</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- guardrails — the pipeline talks back ----------------
// Computed on the backend from real account stages. Empty list = nothing to say = render nothing.
function GuardrailsCard({ onOpenSection }: { onOpenSection: (s: string) => void }) {
  const A = useW7();
  const [rails, setRails] = useState<GtmGuardrail[]>([]);
  const stamp = JSON.stringify([
    A.gtm.accounts.map((a) => a.stage), A.gtm.lost_deals.length,
    A.gtm.sequences.map((s) => s.approved), A.gtm.pricing.locked,
  ]);
  useEffect(() => {
    getGtmGuardrails(A.companyId).then(setRails).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [A.companyId, stamp]);

  if (!rails.length) return null;
  return (
    <div className={`${card} p-4`} style={{ borderColor: rails.some((r) => r.severity === "stop") ? "#E2A6A0" : "#EAD9A8" }}>
      <p className="text-sm font-bold text-[#111827]">Your pipeline is telling you something</p>
      <div className="mt-2 space-y-2">
        {rails.map((r) => (
          <button key={r.text} onClick={() => onOpenSection(r.link)}
            className="block w-full rounded-lg border p-3 text-left hover:opacity-90"
            style={r.severity === "stop" ? { borderColor: "#E2A6A0", background: "#FCF6F5" } : { borderColor: "#EAD9A8", background: "#FDFAF1" }}>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
              style={{ background: r.severity === "stop" ? "#B4231F" : "#B98A0E" }}>
              {r.severity}
            </span>
            <p className="mt-1.5 text-xs leading-relaxed text-[#3A414D]">{r.text}</p>
            <p className="mt-1 text-[11px] font-semibold" style={{ color: R }}>Open {MODULES.find((m) => m.id === r.link)?.title ?? r.link} →</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- connections ----------------
const CONN_DEFS: { kind: string; label: string; provider: string; detail: string; note: string }[] = [
  { kind: "crm", label: "CRM", provider: "HubSpot", detail: "pipeline + contacts", note: "Where replies become deals." },
  { kind: "analytics", label: "Analytics", provider: "GA4", detail: "site + funnel tracking", note: "Unlocks the Metrics tab." },
  { kind: "email", label: "Email", provider: "Resend", detail: "sequence delivery", note: "You send; we compose." },
  { kind: "payments", label: "Payments", provider: "Stripe", detail: "checkout + first revenue", note: "Set up in W3." },
];
function ConnectionsView() {
  const A = useW7();
  return (
    <div>
      <p className="text-sm font-bold text-[#111827]">
        Connections <span className="font-normal text-[#9AA3B0]">— the tools W7 hands off to</span>
      </p>
      <div className="mt-4 space-y-2">
        {CONN_DEFS.map((d) => {
          const c = A.gtm.connections.find((x) => x.kind === d.kind);
          const status = c?.status ?? "off";
          return (
            <div key={d.kind} className={`${card} flex flex-wrap items-center gap-3 p-4`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#111827]">
                  {d.label} <span className="font-normal text-[#9AA3B0]">· {d.provider}</span>
                </p>
                <p className="text-xs text-[#6B7280]">{d.note}</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={status === "verified" ? { background: "#EAF7EF", color: GREEN } : status === "connected" ? { background: "#FEF3C7", color: "#92600E" } : { background: "#F1F3F6", color: "#6B7280" }}>
                {status === "verified" ? "Verified" : status === "connected" ? "Connected · not verified" : "Not connected"}
              </span>
              {d.kind === "payments" ? (
                <button onClick={() => A.goWorkflow("W3")} className={btnGhost}>Set up in W3 →</button>
              ) : status === "off" ? (
                <button disabled={A.busy} onClick={() => A.setConnection(d.kind, d.provider, "connected", d.detail)} className={btnGhost}>Connect</button>
              ) : (
                <div className="flex gap-2">
                  {status === "connected" && (
                    <button disabled={A.busy} onClick={() => A.setConnection(d.kind, d.provider, "verified", d.detail)} className={btnGhost}>Verify</button>
                  )}
                  <button disabled={A.busy} onClick={() => A.setConnection(d.kind, d.provider, "off", "")} className={btnGhost}>Disconnect</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 rounded-lg border border-[#EBECE9] bg-[#FAFBFA] p-3 text-xs text-[#6B7280]">
        <b className="text-[#111827]">Good to know —</b> StartupKit never stores your credentials. It records that a
        tool is connected and hands off to it. Verifying analytics is what unlocks the Metrics tab.
      </div>
    </div>
  );
}

// ============================================================================================
// shared section chrome
// ============================================================================================
function SectionShell({
  title, desc, onBack, right, children,
}: {
  title: string; desc: string; onBack: () => void; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} className="text-xs text-[#6B7280] hover:text-[#111827]">
        ← Back · <span className="font-medium text-[#111827]">W7 › {title}</span>
      </button>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-white" style={{ background: R }}>W7</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">{title}</h1>
            <p className="mt-0.5 max-w-2xl text-sm text-[#6B7280]">{desc}</p>
          </div>
        </div>
        {right}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

const label = "text-[11px] font-semibold uppercase tracking-wide text-[#9AA3B0]";
const input = "w-full rounded-lg border border-[#EBECE9] px-3 py-2 text-sm outline-none focus:border-[#A32D2D]";
function Pick<T extends string>({ opts, value, onPick }: { opts: [T, string][]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(([v, l]) => (
        <button key={v} onClick={() => onPick(v)} className="rounded-lg border px-3 py-1.5 text-xs font-medium"
          style={v === value ? { borderColor: R, background: "#FCF6F5", color: R } : { borderColor: "#EBECE9", color: "#6B7280" }}>
          {l}
        </button>
      ))}
    </div>
  );
}

// ============================================================================================
// 1 · GTM Strategy & Motion — the motion is computed, not guessed
// ============================================================================================
const MOTION_LABEL: Record<string, string> = { outbound: "Outbound-led", plg: "Product-led", hybrid: "Hybrid" };
const MOTION_HINT: Record<string, string> = {
  outbound: "~70% targeted email · 20% LinkedIn · 10% inbound from the site.",
  plg: "Self-serve signup + trial first; outbound only for expansion or the enterprise band.",
  hybrid: "PLG trial for smaller accounts · outbound for the bigger ones in your ICP.",
};
const MOTION_CHANNELS: Record<string, string[]> = {
  outbound: ["Outbound email", "LinkedIn", "Landing inbound", "Partner referrals"],
  plg: ["Product signup", "SEO content", "In-app nurture", "Selective outbound"],
  hybrid: ["Outbound (mid-market)", "PLG trial (SMB)", "Content", "Partner referrals"],
};
const MOTION_KPIS: Record<string, [string, string][]> = {
  outbound: [["10", "Outbound sent (wk 3)"], ["12", "Demos booked"], ["3", "Pilots started"]],
  plg: [["25", "Free signups (mo 1)"], ["8", "Activated trials"], ["2", "Paid conversions"]],
  hybrid: [["10", "Outbound sent"], ["15", "Signups + demos"], ["4", "Pilots / paid"]],
};
const OBJECTIVES: [string, string][] = [
  ["first_customers", "First paying customers"],
  ["waitlist", "Waitlist signups"],
  ["launch", "Product launch"],
  ["fundraise", "Fundraise buzz"],
];

/** The first fork, decided from real inputs (ACV × complexity × buying committee). */
function recommendMotion(acv: string, selfServe: boolean, committee: string): { motion: string; why: string } {
  if (acv === "high" || committee === "many") {
    return {
      motion: "outbound",
      why: `At ${acv === "high" ? "an ACV above $25k" : "a 5+ person buying committee"}, a product can't close the deal on its own — someone has to handle objections and build the internal champion. Sales-led is the only motion that survives procurement.`,
    };
  }
  if (acv === "low" && selfServe && committee === "one") {
    return {
      motion: "plg",
      why: "Under a $10k ACV with a self-serve product and a single decision-maker, the economics don't support a sales team — the product has to prove itself. Put the budget into self-serve channels.",
    };
  }
  return {
    motion: "hybrid",
    why: "You're between the two clean cases: the product can partly sell itself, but the deal size justifies a human on the bigger accounts. Run PLG for the small end and outbound for the top of your ICP — what most B2B companies actually do.",
  };
}

function ninetyDayPlan(motion: string): { month: number; title: string; goal: string; tasks: [string, string | null][] }[] {
  const common = (m: number) => (m === 1 ? "Foundation" : m === 2 ? "Pipeline" : "Repeatability");
  if (motion === "plg") {
    return [
      { month: 1, title: `Month 1 — ${common(1)}`, goal: "Get signup + tracking live and watch real activation.", tasks: [["Lock pricing and the free tier", "pricing"], ["Point the W5 site at a signup + capture form", "landing"], ["Install analytics and verify it", "analytics"], ["Define your activation event", null]] },
      { month: 2, title: `Month 2 — ${common(2)}`, goal: "Find where trials stall and fix the one biggest drop.", tasks: [["Review the funnel drop-off weekly", "analytics"], ["Talk to 10 activated users", "discovery"], ["Selective outbound to your best-fit signups", "outreach"]] },
      { month: 3, title: `Month 3 — ${common(3)}`, goal: "Convert to paid and prove the loop repeats.", tasks: [["Convert your first paid accounts", null], ["Log why deals were lost", null], ["Decide: keep PLG, or add a sales touch", "strategy"]] },
    ];
  }
  if (motion === "hybrid") {
    return [
      { month: 1, title: `Month 1 — ${common(1)}`, goal: "Stand up both paths: self-serve and a target list.", tasks: [["Lock pricing with a self-serve tier + a sales band", "pricing"], ["Build a ~50 account list for the top band", "icp"], ["Connect the CRM", "crm"], ["Install analytics and verify it", "analytics"]] },
      { month: 2, title: `Month 2 — ${common(2)}`, goal: "Run outbound on the top band while trials run themselves.", tasks: [["Send the first 20 by hand", "outreach"], ["Book and run discovery calls", "discovery"], ["Watch trial activation for the SMB path", "analytics"]] },
      { month: 3, title: `Month 3 — ${common(3)}`, goal: "See which path actually produces revenue — then lean in.", tasks: [["Compare CAC and cycle length across both paths", null], ["Log lost-deal reasons", null], ["Double down on the path that closed", "strategy"]] },
    ];
  }
  return [
    { month: 1, title: `Month 1 — ${common(1)}`, goal: "Funnel + CRM live, list built, first outbound sent.", tasks: [["Lock pricing and the pilot offer", "pricing"], ["Build a ~50 account target list from your ICP", "icp"], ["Connect the CRM and set stages", "crm"], ["Point the W5 site at a lead-capture form", "landing"], ["Send the first 20 by hand", "outreach"]] },
    { month: 2, title: `Month 2 — ${common(2)}`, goal: "Scale outreach, handle objections, book demos.", tasks: [["Expand the sequence to 50 contacts", "outreach"], ["Run discovery calls and log objections", "discovery"], ["Refresh the list from new triggers", "icp"], ["Review reply rates and rewrite subject lines", "outreach"]] },
    { month: 3, title: `Month 3 — ${common(3)}`, goal: "Close pilots and find out if it repeats.", tasks: [["Convert pilots to paid", null], ["Log every lost-deal reason", null], ["Check the rep-hiring gate — 10–20 closed yourself?", null]] },
  ];
}

function StrategyTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const s = A.gtm.strategy;
  const [acv, setAcv] = useState<string>("mid");
  const [selfServe, setSelfServe] = useState(true);
  const [committee, setCommittee] = useState<string>("few");
  // Don't ask what we can infer: read the three signals off the Company Object on open.
  const [read, setRead] = useState<MotionRead>();
  const [reading, setReading] = useState(true);
  const applyRead = useCallback((m: MotionRead) => {
    setRead(m);
    setAcv(m.acv.value);
    setSelfServe(m.self_serve.value === "yes");
    setCommittee(m.committee.value);
  }, []);
  useEffect(() => {
    readMotion(A.companyId).then(applyRead).catch(() => {}).finally(() => setReading(false));
  }, [A.companyId, applyRead]);
  const reread = async () => {
    setReading(true);
    try { applyRead(await readMotion(A.companyId)); } catch { A.notify("Couldn't re-read"); }
    finally { setReading(false); }
  };
  // A correction is a decision — persist it so a later re-read never overwrites the founder.
  const correct = (k: "acv" | "self_serve" | "committee", v: string) => {
    if (k === "acv") setAcv(v);
    if (k === "self_serve") setSelfServe(v === "yes");
    if (k === "committee") setCommittee(v);
    A.patch({ inputs: { ...A.gtm.inputs, [k]: v } }, "Saved your correction ✓");
  };
  const [objective, setObjective] = useState(s.objective || "first_customers");
  const rec = recommendMotion(acv, selfServe, committee);
  const [motion, setMotion] = useState(s.motion || rec.motion);
  const plan = ninetyDayPlan(motion);
  const overridden = motion !== rec.motion;

  // The channel matrix: every channel ranked for the motion currently picked, not just the saved one.
  const [matrix, setMatrix] = useState<ChannelMatrix>();
  useEffect(() => {
    getChannelMatrix(A.companyId, motion).then(setMatrix).catch(() => {});
  }, [A.companyId, motion]);
  const bets = matrix?.motion === motion ? matrix.verdicts.filter((v) => v.verdict === "bet").map((v) => v.channel) : [];

  const save = () =>
    A.patch(
      {
        strategy: {
          motion,
          motion_rationale: overridden ? `Founder override — recommendation was ${MOTION_LABEL[rec.motion]}. ${rec.why}` : rec.why,
          objective,
          channels: bets.length ? bets : MOTION_CHANNELS[motion],
          summary: `${MOTION_LABEL[motion]} motion targeting ${OBJECTIVES.find((o) => o[0] === objective)?.[1].toLowerCase()} over 90 days.`,
        },
        steps_done: A.gtm.steps_done.includes("mod:strategy") ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:strategy"],
      },
      "Strategy saved ✓",
    );

  return (
    <SectionShell title="GTM Strategy & Motion" desc="The first fork — it decides your channels, your pricing band, and the next 90 days." onBack={onBack}
      right={<button className={btnInk} style={{ background: R }} disabled={A.busy} onClick={save}>{A.busy ? "Saving…" : "Save strategy"}</button>}>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* what we read off the Company Object */}
          <div className={`${card} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#111827]">
                What we read from your company{" "}
                <span className="font-normal text-[#9AA3B0]">— correct us if we&apos;re wrong</span>
              </h3>
              <button className={btnGhost} disabled={reading} onClick={reread}>
                {reading ? "Reading…" : "↻ Re-read"}
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <ReadRow
                icon="$" title="Your price"
                value={{ low: "Under $10k a year", mid: "$10k – $25k a year", high: "Over $25k a year" }[acv] ?? ""}
                sig={read?.acv}
                opts={[["low", "Under $10k"], ["mid", "$10k – $25k"], ["high", "Over $25k"]]}
                onPick={(v) => correct("acv", v)} pickedValue={acv} busy={reading}
              />
              <ReadRow
                icon="◐" title="Can they buy without you?"
                value={selfServe ? "Yes — self-serve" : "No — needs a demo"}
                sig={read?.self_serve}
                opts={[["yes", "Yes — self-serve"], ["no", "No — needs a demo"]]}
                onPick={(v) => correct("self_serve", v)} pickedValue={selfServe ? "yes" : "no"} busy={reading}
              />
              <ReadRow
                icon="◎" title="Who signs off?"
                value={{ one: "One person", few: "2 – 4 people", many: "5 or more" }[committee] ?? ""}
                sig={read?.committee}
                opts={[["one", "One"], ["few", "2 – 4"], ["many", "5 or more"]]}
                onPick={(v) => correct("committee", v)} pickedValue={committee} busy={reading}
              />
            </div>
          </div>

          {/* recommendation */}
          <div className={`${card} p-5`} style={{ borderColor: R }}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-[#111827]">Recommended motion</h3>
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: R }}>{MOTION_LABEL[rec.motion]}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#3A414D]">{rec.why}</p>
            <p className="mt-3 rounded-lg bg-[#FAFBFA] p-3 text-xs text-[#6B7280]">{MOTION_HINT[rec.motion]}</p>
            <div className="mt-4">
              <p className={label}>Your choice — override if you disagree</p>
              <div className="mt-1.5"><Pick opts={[["outbound", "Outbound-led"], ["plg", "Product-led"], ["hybrid", "Hybrid"]]} value={motion} onPick={setMotion} /></div>
              {overridden && (
                <p className="mt-2 text-xs" style={{ color: "#92600E" }}>
                  ⚠ You&apos;ve overridden the recommendation. That&apos;s allowed — we&apos;ll record that you chose {MOTION_LABEL[motion]} deliberately.
                </p>
              )}
            </div>
          </div>

          {/* channel matrix — every channel gets a verdict, so ignoring is a decision, not a gap */}
          {matrix && matrix.motion === motion && (
            <div className={`${card} p-5`}>
              <h3 className="text-sm font-bold text-[#111827]">
                Channel matrix <span className="font-normal text-[#9AA3B0]">— for a {MOTION_LABEL[motion].toLowerCase()} motion</span>
              </h3>
              <div className="mt-3 space-y-1.5">
                {matrix.verdicts.map((v) => (
                  <div key={v.channel} className="flex items-start gap-3 rounded-lg border border-[#EBECE9] px-3 py-2">
                    <span className="mt-0.5 w-14 shrink-0 rounded px-1.5 py-0.5 text-center text-[9px] font-bold uppercase tracking-wide"
                      style={v.verdict === "bet" ? { background: "#DCFCE7", color: "#1E7A3D" }
                        : v.verdict === "support" ? { background: "#FEF3C7", color: "#92600E" }
                        : { background: "#F1F3F6", color: "#9AA3B0" }}>
                      {v.verdict}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: v.verdict === "ignore" ? "#9AA3B0" : "#111827" }}>{v.channel}</p>
                      <p className="text-[11px] leading-relaxed text-[#6B7280]">{v.why}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 rounded-lg bg-[#FAFBFA] p-3 text-[11px] leading-relaxed text-[#6B7280]">
                {matrix.note} Saving the strategy commits the two <b>bets</b> as your channels.
              </p>
            </div>
          )}

          {/* 90-day plan */}
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827]">90-day plan <span className="font-normal text-[#9AA3B0]">— rebuilt for a {MOTION_LABEL[motion].toLowerCase()} motion</span></h3>
            </div>
            <div className="mt-3 space-y-3">
              {plan.map((mo) => (
                <div key={mo.month} className="rounded-xl border border-[#EBECE9] p-4">
                  <p className="text-xs font-bold text-[#111827]">{mo.title}</p>
                  <p className="mt-0.5 text-xs text-[#9AA3B0]">{mo.goal}</p>
                  <div className="mt-2 space-y-1">
                    {mo.tasks.map(([t, link]) => (
                      <div key={t} className="flex items-start gap-2 text-xs text-[#3A414D]">
                        <span className="mt-0.5" style={{ color: R }}>·</span>
                        <span>{t}</span>
                        {link && <span className="rounded bg-[#F1F3F6] px-1.5 py-0.5 text-[10px] text-[#6B7280]">{link}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* rail */}
        <aside className="space-y-4">
          <div className={`${card} p-5`}>
            <p className={label}>Primary objective</p>
            <div className="mt-2 space-y-1.5">
              {OBJECTIVES.map(([k, l]) => (
                <button key={k} onClick={() => setObjective(k)} className="block w-full rounded-lg border px-3 py-2 text-left text-xs font-medium"
                  style={k === objective ? { borderColor: R, background: "#FCF6F5", color: R } : { borderColor: "#EBECE9", color: "#6B7280" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className={`${card} p-5`}>
            <p className={label}>90-day targets</p>
            <div className="mt-2 space-y-2">
              {MOTION_KPIS[motion].map(([v, l]) => (
                <div key={l} className="flex items-baseline gap-2">
                  <span className="font-mono text-lg font-bold" style={{ color: R }}>{v}</span>
                  <span className="text-xs text-[#6B7280]">{l}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#9AA3B0]">Pre-seed benchmarks, not vanity goals. Ten real conversations beat a thousand impressions.</p>
          </div>
          <div className={`${card} p-5`}>
            <p className={label}>Your channels{bets.length ? " — the 2 bets" : ""}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(bets.length ? bets : MOTION_CHANNELS[motion]).map((c) => (
                <span key={c} className="rounded-full border border-[#EBECE9] px-2.5 py-1 text-[11px] text-[#3A414D]">{c}</span>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[#9AA3B0]">Two channels done properly. Doing four badly is how pre-seed GTM dies — the matrix says why each of the others waits.</p>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// 2 · ICP & Target List — turn W5's one-liner into accounts you can actually work
// ============================================================================================
const SIZE_BANDS: [string, string, number][] = [
  ["1-10", "1 – 10", 900],
  ["11-50", "11 – 50", 420],
  ["51-200", "51 – 200", 180],
  ["201-1000", "201 – 1,000", 60],
  ["1000+", "1,000+", 25],
];
const TRIGGERS: string[] = [
  "Raised a round in the last 6 months",
  "Hired a new leader for this function",
  "Posting jobs for the team you serve",
  "Announced a product in your category",
  "Uses a competitor you can displace",
  "Hit a compliance or audit deadline",
];
const STAGES: [string, string][] = [
  ["prospect", "Prospect"], ["contacted", "Contacted"], ["replied", "Replied"],
  ["demo", "Demo"], ["pilot", "Pilot"], ["won", "Won"], ["lost", "Lost"],
];

function IcpTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const inheritedIcp = A.brand?.core?.icp || "";
  const inputs = A.gtm.inputs;
  const [band, setBand] = useState(inputs.size_band || "11-50");
  const [picked, setPicked] = useState<string[]>(inputs.triggers.length ? inputs.triggers : [TRIGGERS[0]]);
  const [disq, setDisq] = useState(inputs.disqualifiers || "Agencies · pre-revenue · outside the US");
  const saveInputs = (next: Partial<{ size_band: string; triggers: string[]; disqualifiers: string }>) =>
    A.patch({ inputs: { ...A.gtm.inputs, ...next } });
  const [draft, setDraft] = useState({ name: "", domain: "", trigger: TRIGGERS[0] });

  // Estimated reach: the band's rough universe, narrowed by each trigger you add.
  const base = SIZE_BANDS.find((b) => b[0] === band)?.[2] ?? 200;
  const reach = Math.max(8, Math.round(base * Math.pow(0.55, Math.max(picked.length, 1))));
  const tooBroad = reach > 200;

  const accounts = A.gtm.accounts;
  const addAccount = () => {
    if (!draft.name.trim()) return A.notify("Give the account a name first");
    A.patch(
      {
        accounts: [...accounts, { name: draft.name.trim(), domain: draft.domain.trim(), size: band, trigger: draft.trigger, stage: "prospect", owner: A.companyName, contact: "", email: "" }],
      },
      `${draft.name.trim()} added`,
    );
    setDraft({ name: "", domain: "", trigger: picked[0] ?? TRIGGERS[0] });
  };
  const setStage = (i: number, stage: string) =>
    A.patch({ accounts: accounts.map((a, j) => (j === i ? { ...a, stage } : a)) }, "Stage updated");
  const removeAccount = (i: number) =>
    A.patch({ accounts: accounts.filter((_, j) => j !== i) }, "Account removed");

  const byStage = (s: string) => accounts.filter((a) => a.stage === s).length;

  return (
    <SectionShell title="ICP & Target List" desc="An ICP is a decision guide, not a demographic. Turn it into a list you can work." onBack={onBack}
      right={
        <button className={btnInk} style={{ background: R }} disabled={A.busy}
          onClick={() => A.patch({ steps_done: A.gtm.steps_done.includes("mod:icp") ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:icp"] }, "ICP marked complete ✓")}>
          {A.has("mod:icp") ? "Completed ✓" : "Mark complete"}
        </button>
      }>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {inheritedIcp ? (
            <div className="rounded-xl border border-dashed border-[#DDE1DC] bg-[#FAFBFA] p-4">
              <p className={label}>Inherited from W5 · not re-asked</p>
              <p className="mt-1 text-sm font-medium text-[#111827]">{inheritedIcp}</p>
              <p className="mt-1 text-xs text-[#9AA3B0]">W7 sharpens this into firmographics and triggers — it doesn&apos;t redefine it.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#E7C9C5] bg-[#FCF6F5] p-4 text-xs" style={{ color: "#7A2E27" }}>
              No ICP in your Brand Core yet — define it in <b>W5</b> and it appears here.
            </div>
          )}

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">Narrow it</h3>
            <div className="mt-4">
              <p className={label}>Company size</p>
              <div className="mt-1.5"><Pick opts={SIZE_BANDS.map((b) => [b[0], b[1]] as [string, string])} value={band} onPick={(v) => { setBand(v); saveInputs({ size_band: v }); }} /></div>
            </div>
            <div className="mt-4">
              <p className={label}>Buying triggers — what makes them need you <i>now</i></p>
              <div className="mt-1.5 space-y-1.5">
                {TRIGGERS.map((t) => {
                  const on = picked.includes(t);
                  return (
                    <button key={t} onClick={() => {
                      const next = on ? picked.filter((x) => x !== t) : [...picked, t];
                      setPicked(next); saveInputs({ triggers: next });
                    }}
                      className="flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs"
                      style={on ? { borderColor: R, background: "#FCF6F5" } : { borderColor: "#EBECE9" }}>
                      <span style={{ color: on ? R : "#C4CCD6" }}>{on ? "✓" : "○"}</span>
                      <span style={{ color: on ? "#111827" : "#6B7280" }}>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-4">
              <p className={label}>Disqualifiers — who you will <i>not</i> sell to</p>
              <input className={`${input} mt-1.5`} value={disq} onChange={(e) => setDisq(e.target.value)} onBlur={() => saveInputs({ disqualifiers: disq })} />
              <p className="mt-1 text-[11px] text-[#9AA3B0]">Saying no is what makes the list workable.</p>
            </div>
          </div>

          {/* target accounts */}
          <div className={`${card} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#111827]">Target accounts <span className="font-normal text-[#9AA3B0]">({accounts.length})</span></h3>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map(([k, l]) => byStage(k) > 0 && (
                  <span key={k} className="rounded-full border border-[#EBECE9] px-2 py-0.5 text-[10px] text-[#6B7280]">{l} {byStage(k)}</span>
                ))}
              </div>
            </div>

            <AccountFinder />

            <details className="mt-3">
              <summary className="cursor-pointer text-[11px] text-[#9AA3B0]">or add one by hand</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                <input className={`${input} flex-1`} placeholder="Account name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <input className={`${input} flex-1`} placeholder="domain.com" value={draft.domain} onChange={(e) => setDraft({ ...draft, domain: e.target.value })} />
                <button className={btnInk} style={{ background: INK }} disabled={A.busy} onClick={addAccount}>Add</button>
              </div>
            </details>

            {accounts.length === 0 ? (
              <p className="mt-4 rounded-lg bg-[#FAFBFA] p-4 text-center text-xs text-[#9AA3B0]">
                No accounts yet. Add the first ten by name — at pre-seed the list is built by hand, not bought.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-[#9AA3B0]">
                    <th className="py-1.5 font-medium">Account</th><th className="font-medium">Trigger</th><th className="font-medium">Stage</th><th />
                  </tr></thead>
                  <tbody>
                    {accounts.map((a, i) => (
                      <tr key={`${a.name}-${i}`} className="border-t border-[#F1F3F6]">
                        <td className="py-2">
                          <p className="font-semibold text-[#111827]">{a.name}</p>
                          {a.domain && <p className="text-[10px] text-[#9AA3B0]">{a.domain}</p>}
                        </td>
                        <td className="max-w-[200px] truncate text-[#6B7280]">{a.trigger}</td>
                        <td>
                          <select value={a.stage} onChange={(e) => setStage(i, e.target.value)}
                            className="rounded-md border border-[#EBECE9] px-2 py-1 text-[11px]">
                            {STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                          </select>
                        </td>
                        <td className="text-right">
                          <button onClick={() => removeAccount(i)} className="text-[11px] text-[#9AA3B0] hover:text-[#DC2626]">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* rail */}
        <aside className="space-y-4">
          <div className={`${card} p-5 text-center`} style={tooBroad ? { borderColor: "#E7C9C5" } : undefined}>
            <p className={label}>Estimated reach</p>
            <p className="mt-1 font-mono text-3xl font-extrabold" style={{ color: tooBroad ? "#92600E" : R }}>~{reach}</p>
            <p className="text-xs text-[#9AA3B0]">accounts match</p>
            {tooBroad ? (
              <p className="mt-3 rounded-lg bg-[#FEF3C7] p-3 text-left text-[11px] leading-relaxed" style={{ color: "#92600E" }}>
                <b>Your ICP is too broad.</b> Past ~200 accounts you can&apos;t personalise, so your reply rate collapses. Add a trigger or narrow the size band.
              </p>
            ) : (
              <p className="mt-3 rounded-lg bg-[#FAFBFA] p-3 text-left text-[11px] leading-relaxed text-[#6B7280]">
                A workable list. Every trigger you add cuts the list and lifts your reply rate.
              </p>
            )}
          </div>
          <div className={`${card} p-5`}>
            <p className={label}>Why triggers matter</p>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
              Firmographics tell you who <i>could</i> buy. A trigger tells you who might buy <b className="text-[#111827]">this month</b> — that&apos;s the difference between a 2% and an 8% reply rate.
            </p>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// 3 · Pricing Lab — the decision lives here; the page lives in W5
// ============================================================================================
const PRICE_MODELS: [string, string][] = [
  ["seat", "Per seat"], ["tiered", "Tiered"], ["usage", "Usage-based"], ["flat", "Flat rate"], ["freemium", "Freemium"],
];
const MODEL_NOTE: Record<string, string> = {
  seat: "Simple and predictable. Breaks when the value isn't per-person — you'll cap yourself on small teams.",
  tiered: "The default for early B2B. Three tiers, one obviously correct for your ICP.",
  usage: "Aligns price to value, but nobody can forecast their bill. Pair it with a floor.",
  flat: "Easiest to sell, hardest to expand. Fine for the first ten customers.",
  freemium: "Only works with a self-serve product and cheap marginal cost. Expensive at pre-seed.",
};

function PricingTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const p = A.gtm.pricing;
  const [model, setModel] = useState(p.model || "tiered");
  const [pilot, setPilot] = useState(p.pilot || "14-day pilot · $0 setup · 20% off year one if you convert");
  // Saved tiers may carry a display price ("$49/seat/mo"); the editor keeps the number and the unit
  // apart so the "$" prefix and unit suffix aren't rendered twice.
  const [tiers, setTiers] = useState(
    p.tiers.length ? p.tiers.map((t) => ({
      ...t,
      price: String(Number(String(t.price).replace(/[^0-9.]/g, "")) || 0),
      unit: t.unit || String(t.price).split("/").slice(1).join("/") || "mo",
    })) : [
      { name: "Starter", price: "49", unit: "seat/mo", features: ["Core workflows", "Email support"] },
      { name: "Team", price: "149", unit: "seat/mo", features: ["Everything in Starter", "Integrations", "Priority support"] },
      { name: "Scale", price: "499", unit: "mo", features: ["Everything in Team", "SSO", "Onboarding"] },
    ],
  );
  const [counts, setCounts] = useState<number[]>(() =>
    p.tiers.length && A.gtm.inputs.tier_counts.length
      ? A.gtm.inputs.tier_counts
      : tiers.map((_, i) => [6, 3, 1][i] ?? 1),
  );

  const num = (s: string) => Number(String(s).replace(/[^0-9.]/g, "")) || 0;
  const arr = tiers.reduce((sum, t, i) => sum + num(t.price) * (counts[i] ?? 0) * 12, 0);
  // Only count customers for tiers that actually exist — a stale longer counts[] would inflate ACV.
  const customers = tiers.reduce((sum, _t, i) => sum + (counts[i] ?? 0), 0);
  const acv = tiers.length ? Math.round(arr / Math.max(customers, 1)) : 0;
  const band = acv >= 25000 ? "high" : acv < 10000 ? "low" : "mid";
  const bandNote =
    band === "high" ? "Above $25k — this ACV supports a sales-led motion."
      : band === "low" ? "Under $10k — too thin to fund a sales team; this wants product-led."
        : "$10k–$25k — the hybrid band.";

  const setTier = (i: number, patch: Partial<(typeof tiers)[number]>) =>
    setTiers((t) => t.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const save = (lock: boolean) =>
    A.patch(
      {
        pricing: { model, tiers, pilot, locked: lock },
        steps_done: A.gtm.steps_done.includes("mod:pricing") ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:pricing"],
      },
      lock ? "Pricing locked — W5 will regenerate your pricing page" : "Pricing saved ✓",
    );

  return (
    <SectionShell title="Pricing & Packaging" desc="Nobody helps a founder decide the price — Stripe and Orb only bill it. Decide it here." onBack={onBack}
      right={
        <div className="flex gap-2">
          <button className={btnGhost} disabled={A.busy} onClick={() => save(false)}>Save draft</button>
          <button className={btnInk} style={{ background: R }} disabled={A.busy} onClick={() => save(true)}>
            {p.locked ? "Locked ✓ — re-lock" : "Lock pricing"}
          </button>
        </div>
      }>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <PriceResearch onApply={(t, m) => { setTiers(t); setModel(m || model); setCounts(t.map((_, i) => [6, 3, 1][i] ?? 1)); }} />

          <WtpSurvey />

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">Pricing model</h3>
            <div className="mt-2"><Pick opts={PRICE_MODELS} value={model} onPick={setModel} /></div>
            <p className="mt-3 rounded-lg bg-[#FAFBFA] p-3 text-xs leading-relaxed text-[#6B7280]">{MODEL_NOTE[model]}</p>
          </div>

          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827]">Tiers</h3>
              <button className="text-xs font-semibold" style={{ color: R }}
                onClick={() => setTiers((t) => [...t, { name: `Tier ${t.length + 1}`, price: "0", unit: "mo", features: [] }])}>
                + Add tier
              </button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {tiers.map((t, i) => (
                <div key={i} className="rounded-xl border border-[#EBECE9] p-3">
                  <input className="w-full text-sm font-bold text-[#111827] outline-none" value={t.name} onChange={(e) => setTier(i, { name: e.target.value })} />
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-[#111827]">$</span>
                    <input className="w-16 text-lg font-extrabold text-[#111827] outline-none" value={t.price} onChange={(e) => setTier(i, { price: e.target.value })} />
                    <input className="w-full text-[11px] text-[#9AA3B0] outline-none" value={t.unit} onChange={(e) => setTier(i, { unit: e.target.value })} />
                  </div>
                  <textarea className="mt-2 w-full resize-none rounded-md border border-[#EBECE9] p-2 text-[11px] text-[#3A414D] outline-none"
                    rows={3} value={t.features.join("\n")} onChange={(e) => setTier(i, { features: e.target.value.split("\n") })} />
                  <div className="mt-2 flex items-center justify-between">
                    <label className="text-[10px] text-[#9AA3B0]">Yr-1 customers</label>
                    <input type="number" min={0} className="w-14 rounded border border-[#EBECE9] px-1.5 py-0.5 text-right text-[11px]"
                      value={counts[i] ?? 0}
                      onChange={(e) => setCounts((c) => c.map((x, j) => (j === i ? Number(e.target.value) : x)))}
                      onBlur={() => A.patch({ inputs: { ...A.gtm.inputs, tier_counts: counts } })} />
                  </div>
                  {tiers.length > 1 && (
                    <button onClick={() => { setTiers((t) => t.filter((_, j) => j !== i)); setCounts((c) => c.filter((_, j) => j !== i)); }}
                      className="mt-2 text-[10px] text-[#9AA3B0] hover:text-[#DC2626]">Remove tier</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">Pilot / design-partner offer</h3>
            <input className={`${input} mt-2`} value={pilot} onChange={(e) => setPilot(e.target.value)} />
            <p className="mt-1.5 text-[11px] text-[#9AA3B0]">
              Your first ten customers are buying a relationship, not a licence. A pilot with a real end-date beats a discount.
            </p>
          </div>
        </div>

        {/* rail — the live computation */}
        <aside className="space-y-4">
          <div className={`${card} p-5`}>
            <p className={label}>Price ladder</p>
            <div className="mt-2 space-y-1.5">
              {tiers.map((t, i) => (
                <div key={i} className="flex items-baseline justify-between">
                  <span className="text-xs text-[#3A414D]">{t.name}</span>
                  <span className="font-mono text-xs font-bold text-[#111827]">${num(t.price).toLocaleString()}<span className="font-normal text-[#9AA3B0]">/{t.unit}</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className={`${card} p-5`}>
            <p className={label}>Year-1 ARR (modelled)</p>
            <p className="mt-1 font-mono text-3xl font-extrabold" style={{ color: R }}>${arr.toLocaleString()}</p>
            <p className="text-[11px] text-[#9AA3B0]">from {customers} customer{customers === 1 ? "" : "s"}</p>
            <div className="mt-3 border-t border-[#EEF0F3] pt-3">
              <p className={label}>Blended ACV</p>
              <p className="mt-1 font-mono text-xl font-bold text-[#111827]">${acv.toLocaleString()}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#6B7280]">{bandNote}</p>
            </div>
          </div>
          <div className={`${card} p-5`}>
            <p className={label}>Locking pricing</p>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
              The decision lives in W7. The pricing <i>page</i> lives in W5 — locking fires{" "}
              <code className="rounded bg-[#F1F3F6] px-1 py-0.5 text-[10px]">pricing_locked</code> so W5 regenerates its copy.
            </p>
            {p.locked && (
              <p className="mt-2 rounded-lg bg-[#EAF7EF] p-2 text-[11px]" style={{ color: "#1E7A3D" }}>
                ✓ Locked. <button className="underline" onClick={() => A.goWorkflow("W5")}>Open W5 →</button>
              </p>
            )}
            <p className="mt-2 text-[11px] text-[#9AA3B0]">Revisit every 6–12 months, or when conversion goes weak.</p>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// 4 · CRM & Pipeline — connect one, don't rebuild one
// ============================================================================================
const CRM_PROVIDERS: [string, string][] = [["HubSpot", "Free tier, the default"], ["Attio", "Modern, relationship-first"], ["Folk", "Lightweight, founder-friendly"]];

function CrmTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const conn = A.gtm.connections.find((c) => c.kind === "crm");
  const [objModel, setObjModel] = useState<string>(A.gtm.inputs.crm_model || "relationship");
  const done = A.has("mod:crm");

  return (
    <SectionShell title="CRM & Pipeline" desc="Somewhere replies become deals. We connect a CRM — we don't rebuild one." onBack={onBack}
      right={
        <button className={btnInk} style={{ background: R }} disabled={A.busy}
          onClick={() => A.patch({ steps_done: done ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:crm"] }, "CRM marked complete ✓")}>
          {done ? "Completed ✓" : "Mark complete"}
        </button>
      }>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">Connect a CRM</h3>
            <p className="mt-1 text-xs text-[#6B7280]">StartupKit records that it&apos;s connected and hands off. We never store your credentials.</p>
            <div className="mt-3 space-y-2">
              {CRM_PROVIDERS.map(([name, note]) => {
                const on = conn?.provider === name;
                return (
                  <div key={name} className="flex items-center gap-3 rounded-lg border p-3" style={on ? { borderColor: R, background: "#FCF6F5" } : { borderColor: "#EBECE9" }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#111827]">{name}</p>
                      <p className="text-[11px] text-[#9AA3B0]">{note}</p>
                    </div>
                    {on ? (
                      <button className={btnGhost} disabled={A.busy} onClick={() => A.setConnection("crm", name, "off", "")}>Disconnect</button>
                    ) : (
                      <button className={btnGhost} disabled={A.busy} onClick={() => A.setConnection("crm", name, "connected", "pipeline + contacts")}>Connect</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">Object model</h3>
            <div className="mt-2"><Pick opts={[["relationship", "Relationship-first"], ["deal", "Deal-stage"]]} value={objModel} onPick={(v) => { setObjModel(v); A.patch({ inputs: { ...A.gtm.inputs, crm_model: v } }); }} /></div>
            {objModel === "relationship" ? (
              <p className="mt-3 rounded-lg bg-[#FAFBFA] p-3 text-xs leading-relaxed text-[#6B7280]">
                <b className="text-[#111827]">Recommended at your stage.</b> Track people and conversations, not a forecast. You have no historical
                conversion data, so a deal pipeline would be fiction with extra steps.
              </p>
            ) : (
              <p className="mt-3 rounded-lg bg-[#FEF3C7] p-3 text-xs leading-relaxed" style={{ color: "#92600E" }}>
                <b>Premature at pre-seed.</b> Deal stages need historical conversion rates to mean anything. Fine to switch once you&apos;ve closed 10–20.
              </p>
            )}
          </div>

          <PaymentCard />

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">Import preview</h3>
            {A.gtm.accounts.length === 0 ? (
              <p className="mt-2 rounded-lg bg-[#FAFBFA] p-4 text-center text-xs text-[#9AA3B0]">
                No accounts yet — build the list in <b>ICP &amp; Target List</b> first.
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs text-[#6B7280]">
                  {A.gtm.accounts.length} account{A.gtm.accounts.length === 1 ? "" : "s"} from your target list would sync as contacts.
                </p>
                <div className="mt-2 space-y-1">
                  {A.gtm.accounts.slice(0, 5).map((a) => (
                    <div key={a.name} className="flex justify-between rounded border border-[#EBECE9] px-3 py-1.5 text-xs">
                      <span className="font-medium text-[#111827]">{a.name}</span>
                      <span className="text-[#9AA3B0]">{a.stage}</span>
                    </div>
                  ))}
                </div>
                <button className={`${btnGhost} mt-3`} disabled={!conn}
                  onClick={() => A.notify(conn ? `Imported ${A.gtm.accounts.length} accounts to ${conn.provider}` : "")}>
                  {conn ? `Import to ${conn.provider} →` : "Connect a CRM first"}
                </button>
              </>
            )}
          </div>
        </div>
        <aside className="space-y-4">
          <div className={`${card} p-5`}>
            <p className={label}>Stages we track</p>
            <div className="mt-2 space-y-1">
              {STAGES.map(([k, l], i) => (
                <div key={k} className="flex items-center gap-2 text-xs text-[#3A414D]">
                  <span className="font-mono text-[10px] text-[#9AA3B0]">{i + 1}</span> {l}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[#9AA3B0]">Set on each account in the target list.</p>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// The last mile of "How do they buy" — the moment someone says yes.
// 99/1 model, same as sending: the founder creates their own Stripe Payment Link (5 minutes,
// no code, their money, their account) and pastes it here. W7 builds the order form around it
// and pre-writes the closing email. We never take the money and never hold their keys.
// ============================================================================================
function PaymentCard() {
  const A = useW7();
  const saved = A.gtm.inputs.payment_link;
  const [link, setLink] = useState(saved);
  const valid = /^https:\/\/\S+\.\S+/.test(link.trim());
  const buyers = A.gtm.accounts.filter((a) => ["demo", "pilot", "won"].includes(a.stage));
  const tier = A.gtm.pricing.tiers[0];

  const saveLink = () =>
    A.patch({ inputs: { ...A.gtm.inputs, payment_link: link.trim() } }, "Payment link saved ✓");

  const closeMail = (a: TargetAccount) => {
    const subject = `Getting you set up — ${A.companyName}`;
    const body =
      `Hi ${a.contact || "there"},\n\nGreat speaking with you. Here's everything to get ${a.name} started:\n\n` +
      (tier ? `Plan: ${tier.name} — $${tier.price}/${tier.unit || "mo"}\n` : "") +
      (A.gtm.pricing.pilot ? `Pilot terms: ${A.gtm.pricing.pilot}\n` : "") +
      `\nPay online (takes 2 minutes): ${saved}\n\nThe order form is attached for your records. Any questions, just reply.\n`;
    return { subject, body };
  };

  return (
    <div className={`${card} p-5`} style={{ borderColor: saved ? "#BBE9CD" : undefined }}>
      <h3 className="text-sm font-bold text-[#111827]">
        How they pay <span className="font-normal text-[#9AA3B0]">— the moment someone says yes</span>
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
        Your money goes to <b>your</b> Stripe — we never touch it. Create a Payment Link once
        (Stripe → Payment Links → New, ~5 minutes, no code), paste it here, and W7 writes the
        closing email and the order form around it.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input className={`${input} min-w-[240px] flex-1`} placeholder="https://buy.stripe.com/…"
          value={link} onChange={(e) => setLink(e.target.value)} />
        <button className={btnInk} style={{ background: valid ? R : "#C4CCD6" }} disabled={!valid || A.busy} onClick={saveLink}>
          {saved ? "Update link" : "Save link"}
        </button>
      </div>
      {link && !valid && <p className="mt-1.5 text-[10px]" style={{ color: "#B4231F" }}>That doesn&apos;t look like a URL — it should start with https://</p>}
      {!saved && (
        <p className="mt-1.5 text-[10px] text-[#9AA3B0]">
          No Stripe account yet? <b>W3</b> sets it up — then come back and paste the link.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a className={btnGhost} href={gtmDocUrl(A.companyId, "order-form")} download>
          ⇩ Order form (.md)
        </a>
        <span className="text-[10px] text-[#9AA3B0]">Built from your tiers + pilot offer{saved ? " + payment link" : ""}. Have W2&apos;s counsel look once before first use.</span>
      </div>

      {/* the close, pre-written — same one-click model as outreach */}
      <div className="mt-4 border-t border-[#EEF0F3] pt-3">
        <p className={label}>Send the payment link</p>
        {buyers.length === 0 ? (
          <p className="mt-2 rounded-lg bg-[#FAFBFA] p-3 text-[11px] leading-relaxed text-[#9AA3B0]">
            Accounts at <b>demo, pilot or won</b> appear here with a pre-written closing email.
            Nothing is there yet — that&apos;s honest, not broken.
          </p>
        ) : !saved ? (
          <p className="mt-2 rounded-lg bg-[#FDFAF1] p-3 text-[11px] leading-relaxed" style={{ color: "#92600E" }}>
            {buyers.length} account{buyers.length === 1 ? " is" : "s are"} ready to buy — paste your payment link above and the send buttons light up.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {buyers.map((a) => {
              const m = closeMail(a);
              return (
                <div key={a.name} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#EBECE9] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#111827]">{a.name} <span className="font-normal text-[#9AA3B0]">· {a.stage}</span></p>
                    <p className="truncate text-[10px] text-[#9AA3B0]">{a.email || "no email yet — add it in the target list"}</p>
                  </div>
                  <button className={btnGhost} disabled={!a.email}
                    onClick={() => { window.open(gmailUrl(a.email, m.subject, m.body), "_blank", "noopener"); A.notify("Opened in your mail — you press Send"); }}>
                    ✉ Gmail
                  </button>
                  <button className={btnGhost} onClick={() => { navigator.clipboard?.writeText(`${m.subject}\n\n${m.body}`); A.notify("Copied"); }}>Copy</button>
                </div>
              );
            })}
            <p className="text-[10px] text-[#9AA3B0]">It opens in <b>your</b> mailbox, written. You press Send — we never do.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================================
// 5 · Landing & Lead Capture — give W5's site a job
// ============================================================================================
const CAPTURE_FIELDS: [string, string, boolean][] = [
  ["email", "Work email", true],
  ["company", "Company name", true],
  ["role", "Your role", false],
  ["volume", "Monthly volume", false],
];

function LandingTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const crm = A.gtm.connections.find((c) => c.kind === "crm");
  const [fields, setFields] = useState<string[]>(
    A.gtm.inputs.capture_fields.length ? A.gtm.inputs.capture_fields : ["email", "company"],
  );
  const [thanks, setThanks] = useState(
    A.gtm.inputs.thanks || "Thanks — we'll be in touch within one business day.",
  );
  const done = A.has("mod:landing");
  const site = `${A.companyName.toLowerCase().replace(/\s+/g, "")}.com`;

  return (
    <SectionShell title="Landing & Lead Capture" desc="Your site already exists from W5. This gives it a job." onBack={onBack}
      right={
        <button className={btnInk} style={{ background: R }} disabled={A.busy}
          onClick={() => A.patch({ steps_done: done ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:landing"] }, "Lead capture marked complete ✓")}>
          {done ? "Completed ✓" : "Mark complete"}
        </button>
      }>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-[#DDE1DC] bg-[#FAFBFA] p-4">
            <p className={label}>Inherited from W5 · not rebuilt</p>
            <p className="mt-1 text-sm font-medium text-[#111827]">{site}</p>
            <p className="mt-1 text-xs text-[#9AA3B0]">W5 built the page. W7 only decides what it captures and where that goes.</p>
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">1 · Form fields</h3>
            <p className="mt-1 text-xs text-[#6B7280]">Every extra field costs you conversions. Two is usually right.</p>
            <div className="mt-3 space-y-1.5">
              {CAPTURE_FIELDS.map(([k, l, rec]) => {
                const on = fields.includes(k);
                return (
                  <button key={k} onClick={() => {
                    const next = on ? fields.filter((x) => x !== k) : [...fields, k];
                    setFields(next); A.patch({ inputs: { ...A.gtm.inputs, capture_fields: next } });
                  }}
                    className="flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs"
                    style={on ? { borderColor: R, background: "#FCF6F5" } : { borderColor: "#EBECE9" }}>
                    <span style={{ color: on ? R : "#C4CCD6" }}>{on ? "✓" : "○"}</span>
                    <span style={{ color: on ? "#111827" : "#6B7280" }}>{l}</span>
                    {rec && <span className="ml-auto rounded bg-[#F1F3F6] px-1.5 py-0.5 text-[10px] text-[#6B7280]">recommended</span>}
                  </button>
                );
              })}
            </div>
            {fields.length > 3 && (
              <p className="mt-2 text-[11px]" style={{ color: "#92600E" }}>⚠ {fields.length} fields — expect a noticeable drop in submissions.</p>
            )}
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">2 · On submit</h3>
            {crm ? (
              <p className="mt-2 rounded-lg bg-[#EAF7EF] p-3 text-xs" style={{ color: "#1E7A3D" }}>
                ✓ Leads create a contact in <b>{crm.provider}</b>.
              </p>
            ) : (
              <p className="mt-2 rounded-lg bg-[#FEF3C7] p-3 text-xs" style={{ color: "#92600E" }}>
                ⚠ No CRM connected — leads would go nowhere. Connect one in <b>CRM &amp; Pipeline</b> first.
              </p>
            )}
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">3 · Thank-you page</h3>
            <input className={`${input} mt-2`} value={thanks} onChange={(e) => setThanks(e.target.value)} onBlur={() => A.patch({ inputs: { ...A.gtm.inputs, thanks } })} />
            <p className="mt-1.5 text-[11px] text-[#9AA3B0]">A promise you can keep beats &quot;we&apos;ll get back to you soon&quot;.</p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className={`${card} p-5`}>
            <p className={label}>Path preview</p>
            <div className="mt-3 space-y-2 text-xs">
              {[["Visitor lands", site], ["Fills the form", fields.map((f) => CAPTURE_FIELDS.find((c) => c[0] === f)?.[1]).join(" · ") || "—"], ["Lands in", crm?.provider ?? "nowhere — no CRM"], ["Sees", thanks]].map(([k, v], i) => (
                <div key={k as string} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: i === 2 && !crm ? "#D97706" : R }}>{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111827]">{k}</p>
                    <p className="truncate text-[11px] text-[#9AA3B0]">{v}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// 6 · Analytics & UTM — the gate for every number in Metrics
// ============================================================================================
function AnalyticsTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const conn = A.gtm.connections.find((c) => c.kind === "analytics");
  const [propId] = useState(() => "G-" + Math.random().toString(36).slice(2, 9).toUpperCase());
  const [utm, setUtm] = useState({
    source: A.gtm.inputs.utm_source || "linkedin",
    medium: A.gtm.inputs.utm_medium || "social",
    campaign: A.gtm.inputs.utm_campaign || "launch",
  });
  const saveUtm = () =>
    A.patch({ inputs: { ...A.gtm.inputs, utm_source: utm.source, utm_medium: utm.medium, utm_campaign: utm.campaign } });
  const done = A.has("mod:analytics");
  const site = `https://${A.companyName.toLowerCase().replace(/\s+/g, "")}.com`;
  const id = conn?.detail?.startsWith("G-") ? conn.detail : propId;
  const snippet = `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
</script>`;
  const taggedUrl = `${site}/?utm_source=${utm.source}&utm_medium=${utm.medium}&utm_campaign=${utm.campaign}`;

  return (
    <SectionShell title="Analytics & UTM" desc="Verify tracking here — it's what unlocks every number in Metrics." onBack={onBack}
      right={
        <button className={btnInk} style={{ background: R }} disabled={A.busy}
          onClick={() => A.patch({ steps_done: done ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:analytics"] }, "Analytics marked complete ✓")}>
          {done ? "Completed ✓" : "Mark complete"}
        </button>
      }>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">1 · Connect a provider</h3>
            <div className="mt-3 flex gap-2">
              {["GA4", "PostHog"].map((prov) => {
                const on = conn?.provider === prov;
                return (
                  <button key={prov} disabled={A.busy}
                    onClick={() => A.setConnection("analytics", prov, on ? "off" : "connected", id)}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold"
                    style={on ? { borderColor: R, background: "#FCF6F5", color: R } : { borderColor: "#EBECE9", color: "#6B7280" }}>
                    {on ? `${prov} ✓` : prov}
                  </button>
                );
              })}
            </div>
          </div>

          {conn && (
            <>
              <div className={`${card} p-5`}>
                <h3 className="text-sm font-bold text-[#111827]">2 · Install the snippet</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                  We can&apos;t edit a site we didn&apos;t build. Paste this into your <code className="rounded bg-[#F1F3F6] px-1">&lt;head&gt;</code>,
                  or add it through your builder&apos;s custom-code panel. It&apos;s stamped with your own property ID.
                </p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0E1117] p-3 text-[10px] leading-relaxed text-[#E5E7EB]">{snippet}</pre>
                <button className={`${btnGhost} mt-2`} onClick={() => { navigator.clipboard?.writeText(snippet); A.notify("Snippet copied"); }}>Copy snippet</button>
              </div>

              <div className={`${card} p-5`}>
                <h3 className="text-sm font-bold text-[#111827]">3 · Verify it&apos;s live</h3>
                {conn.status === "verified" ? (
                  <p className="mt-2 rounded-lg bg-[#EAF7EF] p-3 text-xs" style={{ color: "#1E7A3D" }}>
                    ✓ Tracking verified on <b>{site}</b> — the Metrics tab is unlocked.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-[#6B7280]">Until this passes, Metrics stays empty. We&apos;d rather show nothing than invent a number.</p>
                    <button className={`${btnInk} mt-3`} style={{ background: INK }} disabled={A.busy}
                      onClick={() => A.setConnection("analytics", conn.provider, "verified", id)}>
                      Verify install
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">UTM builder</h3>
            <p className="mt-1 text-xs text-[#6B7280]">Tag every link you send, or you&apos;ll never know which channel worked.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(["source", "medium", "campaign"] as const).map((k) => (
                <div key={k}>
                  <p className={label}>{k}</p>
                  <input className={`${input} mt-1`} value={utm[k]} onChange={(e) => setUtm({ ...utm, [k]: e.target.value })} onBlur={saveUtm} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#FAFBFA] p-3">
              <code className="min-w-0 flex-1 truncate text-[11px] text-[#3A414D]">{taggedUrl}</code>
              <button className={btnGhost} onClick={() => { navigator.clipboard?.writeText(taggedUrl); A.notify("Tagged URL copied"); }}>Copy</button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className={`${card} p-5`}>
            <p className={label}>Status</p>
            <p className="mt-2 text-sm font-bold" style={{ color: conn?.status === "verified" ? GREEN : conn ? "#92600E" : "#9AA3B0" }}>
              {conn?.status === "verified" ? "Verified — Metrics unlocked" : conn ? "Connected, not verified" : "Not connected"}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#9AA3B0]">
              Connecting records the account. Verifying proves the snippet is actually on the page — only then do we show numbers.
            </p>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// 7 · Sequences & the First 20 — we compose, you send
// ============================================================================================
function OutreachTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const core = A.brand?.core;
  const saved = A.gtm.sequences[0];
  const value = core?.positioning || "we help teams like yours move faster";
  const [steps, setSteps] = useState<string[]>(
    saved?.steps.length ? saved.steps : [
      `Day 1 — Subject: {{trigger}}?\n\nHi {{first}}, saw {{account}} {{trigger_lower}}. ${value}\n\nWorth a 15-minute look?`,
      `Day 3 — Subject: one number\n\n{{first}} — the teams we work with usually care about one thing: time back. Happy to show you how in 15 minutes.`,
      `Day 7 — Subject: closing the loop\n\nNo reply so I'll assume the timing's wrong, {{first}}. If that changes, I'm here.`,
    ],
  );
  const done = A.has("mod:outreach");
  const accounts = A.gtm.accounts;
  const toContact = accounts.filter((a) => a.stage === "prospect");
  const contacted = accounts.filter((a) => a.stage !== "prospect").length;

  const render = (tpl: string, a: (typeof accounts)[number]) =>
    tpl.replace(/\{\{account\}\}/g, a.name)
      // {{first}} is the person we're writing TO — never the founder (a.owner is our side).
      .replace(/\{\{first\}\}/g, (a.contact || "there").split(" ")[0])
      .replace(/\{\{trigger\}\}/g, a.trigger || "your team")
      .replace(/\{\{trigger_lower\}\}/g, (a.trigger || "your team").toLowerCase());

  const markContacted = (name: string) =>
    A.patch({ accounts: accounts.map((a) => (a.name === name ? { ...a, stage: "contacted" } : a)) }, `${name} marked contacted`);

  const approve = () =>
    A.patch(
      {
        sequences: [{ name: "Cold outbound v1", channel: "email", steps, approved: true }],
        steps_done: done ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:outreach"],
      },
      "Sequence approved ✓",
    );

  return (
    <SectionShell title="Sequences & the First 20" desc="At pre-seed the founder is the SDR. We compose and schedule — you send." onBack={onBack}
      right={<button className={btnInk} style={{ background: R }} disabled={A.busy} onClick={approve}>{done ? "Approved ✓ — re-save" : "Approve sequence"}</button>}>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <DeliverabilityCard />

          <div className="rounded-xl border p-4 text-xs leading-relaxed" style={{ borderColor: "#E7C9C5", background: "#FCF6F5", color: "#7A2E27" }}>
            <b>We never send from our IPs.</b> StartupKit composes the touches and tracks who you&apos;ve contacted. The sending happens
            from your own mailbox — that&apos;s what keeps your domain reputation yours, and it&apos;s why we don&apos;t build autonomous AI SDRs.
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">The sequence <span className="font-normal text-[#9AA3B0]">— 3 touches over 7 days</span></h3>
            <p className="mt-1 text-[11px] text-[#9AA3B0]">
              Tokens: <code className="rounded bg-[#F1F3F6] px-1">{"{{account}}"}</code> <code className="rounded bg-[#F1F3F6] px-1">{"{{first}}"}</code> <code className="rounded bg-[#F1F3F6] px-1">{"{{trigger}}"}</code>
            </p>
            <div className="mt-3 space-y-3">
              {steps.map((s, i) => (
                <div key={i}>
                  <p className={label}>Touch {i + 1}</p>
                  <textarea className="mt-1 w-full resize-y rounded-lg border border-[#EBECE9] p-3 font-mono text-[11px] leading-relaxed outline-none focus:border-[#A32D2D]"
                    rows={5} value={s} onChange={(e) => setSteps((x) => x.map((y, j) => (j === i ? e.target.value : y)))} />
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#111827]">Send the first 20 by hand</h3>
              <span className="font-mono text-[11px] text-[#9AA3B0]">{contacted} sent · {toContact.length} to go</span>
            </div>
            <p className="mt-1 text-xs text-[#6B7280]">Copy each one, send it from your mailbox, then mark it. Personal beats automated at this volume.</p>
            {accounts.length === 0 ? (
              <p className="mt-3 rounded-lg bg-[#FAFBFA] p-4 text-center text-xs text-[#9AA3B0]">
                No accounts yet — build the list in <b>ICP &amp; Target List</b> first.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {accounts.map((a) => (
                  <div key={a.name} className="rounded-lg border border-[#EBECE9] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#111827]">{a.name}</p>
                        <p className="truncate text-[11px] text-[#9AA3B0]">{a.trigger}</p>
                      </div>
                      <span className="rounded-full bg-[#F1F3F6] px-2 py-0.5 text-[10px] text-[#6B7280]">{a.stage}</span>

                    </div>
                    {["prospect", "contacted"].includes(a.stage) && (
                      <TouchSender account={a} steps={steps} render={render} onFirstSent={() => markContacted(a.name)} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className={`${card} p-5`}>
            <p className={label}>What good looks like</p>
            <div className="mt-2 space-y-2 text-xs">
              {[["4–8%", "cold reply rate"], ["30–50%", "reply → call booked"], ["50–70%", "call → demo"], ["25–40%", "proposal → close"]].map(([v, l]) => (
                <div key={l} className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-bold" style={{ color: R }}>{v}</span>
                  <span className="text-[#6B7280]">{l}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#9AA3B0]">Below 4% is a targeting problem, not a copy problem — go back to your triggers.</p>
          </div>
          <div className={`${card} p-5`}>
            <p className={label}>Why by hand</p>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
              The first 8–16 weeks of selling yourself is what produces the ICP clarity, the messaging proof, and the objection
              library a rep would need later. Automate it and you skip the learning.
            </p>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// 8 · Discovery & Objections — log it while you learn it
// ============================================================================================
const SCRIPT_TABS: [string, string, string[]][] = [
  ["disc", "Discovery", [
    "How do you handle this today? (listen for the workaround — that's your real competitor)",
    "What made you take this call now? (confirms the trigger)",
    "What does it cost you when it goes wrong? (this becomes your ROI line)",
    "Who else has to say yes? (sizes the buying committee)",
    "If this worked, what changes for you in 90 days?",
  ]],
  ["demo", "Demo", [
    "Replay their words back first — show you listened.",
    "Show the one workflow they described. Nothing else.",
    "Stop after each step and ask: 'is that how you'd use it?'",
    "End on the price and the pilot, not on features.",
  ]],
  ["close", "Close", [
    "Confirm the problem and the cost, in their numbers.",
    "Propose the pilot with a real end-date.",
    "Name the next step and the owner. Never 'I'll follow up'.",
    "Ask what would stop this from happening.",
  ]],
];
const OBJECTIONS: [string, string, string][] = [
  ["Pricing", "It's too expensive.", "Compared to what? Anchor against the cost of the status quo you heard in discovery — not against a competitor's list price."],
  ["Security", "We need SOC 2 / a security review.", "Don't bluff. Say where you are, offer the pilot in a non-production workspace, and put the timeline in writing."],
  ["Status quo", "We're fine with our spreadsheet.", "The spreadsheet is your real competitor. Ask what it costs when it breaks — that number is your whole pitch."],
  ["Timing", "Ask me again next quarter.", "Usually means the trigger isn't real. Find out what would make it urgent, or disqualify and move on."],
];
const LOSS_REASONS: [string, string][] = [["price", "Price"], ["timing", "Timing"], ["competitor", "Competitor"], ["no_budget", "No budget"], ["no_need", "No need"]];

function DiscoveryTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const [tab, setTab] = useState("disc");
  const [loss, setLoss] = useState({ account: "", reason: "price", note: "" });
  const done = A.has("mod:discovery");
  const lost = A.gtm.lost_deals;
  const priceLosses = lost.filter((l) => l.reason === "price").length;

  const logLoss = () => {
    if (!loss.account.trim()) return A.notify("Which account?");
    A.patch({ lost_deals: [...lost, { ...loss, account: loss.account.trim() }] }, "Lost deal logged");
    setLoss({ account: "", reason: "price", note: "" });
  };

  return (
    <SectionShell title="Discovery & Objections" desc="Selling it yourself is what produces the objection library. Log it while you learn it." onBack={onBack}
      right={
        <button className={btnInk} style={{ background: R }} disabled={A.busy}
          onClick={() => A.patch({ steps_done: done ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:discovery"] }, "Discovery marked complete ✓")}>
          {done ? "Completed ✓" : "Mark complete"}
        </button>
      }>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className={`${card} p-5`}>
            <div className="flex gap-1 border-b border-[#EEF0F3]">
              {SCRIPT_TABS.map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className="px-3 py-2 text-sm font-semibold"
                  style={tab === k ? { color: R, borderBottom: `2px solid ${R}` } : { color: "#6B7280", borderBottom: "2px solid transparent" }}>{l}</button>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {SCRIPT_TABS.find(([k]) => k === tab)?.[2].map((line, i) => (
                <div key={i} className="flex gap-2.5 rounded-lg border border-[#EBECE9] p-3 text-xs text-[#3A414D]">
                  <span className="font-mono text-[10px]" style={{ color: R }}>{i + 1}</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">Objection library</h3>
            <div className="mt-3 space-y-2">
              {OBJECTIONS.map(([tag, obj, ans]) => (
                <div key={tag} className="rounded-lg border border-[#EBECE9] p-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#F1F3F6] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">{tag}</span>
                    <p className="text-xs font-semibold text-[#111827]">&ldquo;{obj}&rdquo;</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#6B7280]">{ans}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#111827]">Log a lost deal</h3>
            <p className="mt-1 text-xs text-[#6B7280]">The reason matters more than the loss. Three lost on price is a positioning problem, not a sales problem.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input className={`${input} flex-1`} placeholder="Account" value={loss.account} onChange={(e) => setLoss({ ...loss, account: e.target.value })} />
              <select className="rounded-lg border border-[#EBECE9] px-3 py-2 text-sm" value={loss.reason} onChange={(e) => setLoss({ ...loss, reason: e.target.value })}>
                {LOSS_REASONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <button className={btnInk} style={{ background: INK }} disabled={A.busy} onClick={logLoss}>Log</button>
            </div>
            {lost.length > 0 && (
              <div className="mt-3 space-y-1">
                {lost.map((l, i) => (
                  <div key={i} className="flex justify-between rounded border border-[#EBECE9] px-3 py-1.5 text-xs">
                    <span className="font-medium text-[#111827]">{l.account}</span>
                    <span className="text-[#9AA3B0]">{LOSS_REASONS.find(([k]) => k === l.reason)?.[1]}</span>
                  </div>
                ))}
              </div>
            )}
            {priceLosses >= 3 && (
              <p className="mt-3 rounded-lg bg-[#FEF3C7] p-3 text-xs leading-relaxed" style={{ color: "#92600E" }}>
                <b>⚠ {priceLosses} deals lost on price.</b> That&apos;s a signal, not a coincidence — your positioning isn&apos;t carrying the value.{" "}
                <button className="font-semibold underline" onClick={() => A.goWorkflow("W5")}>Re-open positioning in W5 →</button>
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className={`${card} p-5`}>
            <p className={label}>The rep-hiring gate</p>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
              Don&apos;t hire a salesperson until <b className="text-[#111827]">you</b> have closed 10–20 deals. Before that there&apos;s no
              repeatable process to hand over — you&apos;d be paying someone to discover your ICP for you.
            </p>
            <div className="mt-3 rounded-lg bg-[#FAFBFA] p-3">
              <p className="font-mono text-lg font-bold" style={{ color: R }}>
                {A.gtm.accounts.filter((a) => a.stage === "won").length} / 10
              </p>
              <p className="text-[11px] text-[#9AA3B0]">closed by you</p>
            </div>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// Generation — the AI drafts the engine from what StartupKit already knows
// ============================================================================================
function GenerateBanner() {
  const A = useW7();
  const hasPlan = Boolean(A.gtm.strategy.motion);
  const hasBrand = Boolean(A.brand?.core?.icp);
  if (!hasBrand) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border p-4"
      style={{ borderColor: hasPlan ? "#EBECE9" : "#E7C9C5", background: hasPlan ? "#FFFFFF" : "#FCF6F5" }}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: R }}>✦</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#111827]">
          {hasPlan ? "Redraft your GTM plan" : "Start from a draft, not a blank form"}
        </p>
        <p className="text-xs text-[#6B7280]">
          {hasPlan
            ? "Regenerate the motion, sequence, campaign and tasks from your current Brand Core and pricing."
            : "We'll draft your motion, outbound sequence, first campaign and 90-day tasks from your Brand Core — then you edit."}
        </p>
      </div>
      <button className={btnInk} style={{ background: R }} disabled={A.generating || A.busy} onClick={A.generate}>
        {A.generating ? "Drafting…" : hasPlan ? "↻ Regenerate" : "✦ Generate my GTM plan"}
      </button>
    </div>
  );
}

// ============================================================================================
// Tasks — the 90-day plan you run, not the plan you read
// ============================================================================================
const PRI_COLOR: Record<string, { c: string; b: string }> = {
  high: { c: "#B23A2E", b: "#FBECEC" },
  medium: { c: "#92600E", b: "#FEF3C7" },
  low: { c: "#6B7280", b: "#F1F3F6" },
};
function TasksRail({ onOpenSection }: { onOpenSection: (s: string) => void }) {
  const A = useW7();
  const tasks = A.gtm.tasks;
  const open = tasks.filter((t) => !t.done);
  const doneN = tasks.length - open.length;

  const toggleTask = (text: string) =>
    A.patch(
      { tasks: tasks.map((t) => (t.text === text ? { ...t, done: !t.done } : t)) },
      "Task updated",
    );

  if (!tasks.length) {
    return (
      <div className={`${card} p-4`}>
        <p className="text-sm font-bold text-[#111827]">Next up</p>
        <p className="mt-2 rounded-lg bg-[#FAFBFA] p-3 text-[11px] leading-relaxed text-[#9AA3B0]">
          No tasks yet. Generate your GTM plan and the 90 days become a list you can tick off.
        </p>
      </div>
    );
  }
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#111827]">Next up</p>
        <span className="font-mono text-[11px] text-[#9AA3B0]">{doneN}/{tasks.length}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {tasks.slice(0, 6).map((t: Task) => {
          const pri = PRI_COLOR[t.priority] ?? PRI_COLOR.low;
          return (
            <div key={t.text} className="flex items-start gap-2 rounded-lg border border-[#EBECE9] p-2.5">
              <button onClick={() => toggleTask(t.text)} disabled={A.busy} className="mt-0.5 text-sm"
                style={{ color: t.done ? GREEN : "#C4CCD6" }}>
                {t.done ? "☑" : "☐"}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-snug" style={{ color: t.done ? "#9AA3B0" : "#3A414D", textDecoration: t.done ? "line-through" : "none" }}>
                  {t.text}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: pri.b, color: pri.c }}>{t.priority}</span>
                  <span className="text-[9px] text-[#9AA3B0]">due {t.due}</span>
                  {t.link && (
                    <button onClick={() => onOpenSection(t.link)} className="text-[9px] font-semibold underline" style={{ color: R }}>open</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================================
// Campaigns — the container everything else hangs on
// ============================================================================================
const CAMP_STATUS: Record<string, { t: string; c: string; b: string }> = {
  draft: { t: "Draft", c: "#6B7280", b: "#F1F3F6" },
  planning: { t: "Planning", c: "#92600E", b: "#FEF3C7" },
  active: { t: "Active", c: "#1E7A3D", b: "#EAF7EF" },
  done: { t: "Done", c: "#6B7280", b: "#F1F3F6" },
};

function CampaignsView() {
  const A = useW7();
  const camps = A.gtm.campaigns;

  // Progress is COMPUTED from the real stage of attributed accounts — never stored, never invented.
  const stats = (c: Campaign) => {
    const mine = c.accounts.length
      ? A.gtm.accounts.filter((a) => c.accounts.includes(a.name))
      : A.gtm.accounts; // unscoped campaign = the whole list
    const contacted = mine.filter((a) => a.stage !== "prospect").length;
    const replied = mine.filter((a) => ["replied", "demo", "pilot", "won"].includes(a.stage)).length;
    const won = mine.filter((a) => a.stage === "won").length;
    const pct = mine.length ? Math.round((contacted / mine.length) * 100) : 0;
    return { total: mine.length, contacted, replied, won, pct };
  };

  const setStatus = (id: string, status: string) =>
    A.patch({ campaigns: camps.map((c) => (c.id === id ? { ...c, status } : c)) }, "Campaign updated");

  const add = () =>
    A.patch(
      {
        campaigns: [...camps, {
          id: `c-${Date.now()}`, name: "New campaign", goal: "", channel: "outbound",
          start: new Date().toISOString().slice(0, 10),
          end: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
          status: "draft", accounts: [], sequence: "",
        }],
      },
      "Campaign added",
    );

  if (!camps.length) {
    return (
      <div className="space-y-4">
        <div className={`${card} p-10 text-center`}>
          <p className="text-3xl">🎯</p>
          <p className="mt-3 text-sm font-bold text-[#111827]">No campaigns yet</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#6B7280]">
            A campaign is the container the rest of W7 hangs on — a sequence, a list of accounts, and a date.
            Generate your GTM plan and your first 90-day campaign appears here.
          </p>
          <button className={`${btnInk} mt-4`} style={{ background: R }} disabled={A.generating} onClick={A.generate}>
            {A.generating ? "Drafting…" : "✦ Generate my GTM plan"}
          </button>
          <button className={`${btnGhost} ml-2 mt-4`} onClick={add}>+ Blank campaign</button>
        </div>
        <ExperimentsLog />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#111827]">
          Campaigns <span className="font-normal text-[#9AA3B0]">— progress is computed from real account stages, never typed in</span>
        </p>
        <button className={btnGhost} onClick={add}>+ New</button>
      </div>
      {camps.map((c) => {
        const s = stats(c);
        const st = CAMP_STATUS[c.status] ?? CAMP_STATUS.draft;
        return (
          <div key={c.id} className={`${card} p-5`}>
            <div className="flex flex-wrap items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: `${R}14` }}>
                {c.channel === "content" ? "✎" : c.channel === "launch" ? "🚀" : c.channel === "referral" ? "↻" : "✉"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[#111827]">{c.name}</p>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: st.b, color: st.c }}>{st.t}</span>
                  <span className="rounded-full border border-[#EBECE9] px-2 py-0.5 text-[10px] text-[#6B7280]">{c.channel}</span>
                </div>
                {c.goal && <p className="mt-0.5 text-xs text-[#6B7280]">{c.goal}</p>}
                <p className="mt-0.5 font-mono text-[10px] text-[#9AA3B0]">{c.start} → {c.end}{c.sequence ? ` · ${c.sequence}` : ""}</p>
              </div>
              <select value={c.status} onChange={(e) => setStatus(c.id, e.target.value)} disabled={A.busy}
                className="rounded-lg border border-[#EBECE9] px-2 py-1 text-[11px]">
                {Object.entries(CAMP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.t}</option>)}
              </select>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1F3F6]">
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: R }} />
              </div>
              <span className="font-mono text-xs font-bold" style={{ color: R }}>{s.pct}%</span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {([["Accounts", s.total], ["Contacted", s.contacted], ["Replied", s.replied], ["Won", s.won]] as [string, number][]).map(([l, v]) => (
                <div key={l} className="rounded-lg border border-[#EBECE9] p-2 text-center">
                  <p className="font-mono text-sm font-bold text-[#111827]">{v}</p>
                  <p className="text-[9px] text-[#9AA3B0]">{l}</p>
                </div>
              ))}
            </div>
            {s.total === 0 && (
              <p className="mt-2 text-[11px] text-[#9AA3B0]">
                No accounts on the list yet — build it in <b>ICP &amp; Target List</b> and this fills in.
              </p>
            )}
          </div>
        );
      })}
      <ExperimentsLog />
    </div>
  );
}

// ============================================================================================
// Experiments — one GTM bet at a time, run to a verdict. Hypothesis in, decision out.
// No zombie experiments: a bet that never gets a verdict is just a habit with a name.
// ============================================================================================
const EXP_STATUS: Record<string, { t: string; c: string; b: string }> = {
  running: { t: "Running", c: "#92600E", b: "#FEF3C7" },
  proved: { t: "Proved", c: "#1E7A3D", b: "#EAF7EF" },
  disproved: { t: "Disproved", c: "#B4231F", b: "#FCF6F5" },
};

function ExperimentsLog() {
  const A = useW7();
  const exps = A.gtm.experiments;
  const [hypothesis, setHypothesis] = useState("");
  const [metric, setMetric] = useState("");

  const update = (id: string, part: Partial<Experiment>, note?: string) =>
    A.patch({ experiments: exps.map((e) => (e.id === id ? { ...e, ...part } : e)) }, note);

  const add = () => {
    if (!hypothesis.trim()) return;
    A.patch(
      {
        experiments: [...exps, {
          id: `e-${Date.now()}`, hypothesis: hypothesis.trim(), metric: metric.trim(),
          result: "", status: "running", decision: "",
        }],
      },
      "Experiment started ✓",
    );
    setHypothesis("");
    setMetric("");
  };

  return (
    <div className={`${card} p-5`}>
      <h3 className="text-sm font-bold text-[#111827]">
        Experiments <span className="font-normal text-[#9AA3B0]">— one bet at a time, run to a verdict</span>
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <input className={`${input} min-w-[220px] flex-[2]`} value={hypothesis} onChange={(e) => setHypothesis(e.target.value)}
          placeholder='Hypothesis — "If we lead with the funding trigger, replies double"' />
        <input className={`${input} min-w-[140px] flex-1`} value={metric} onChange={(e) => setMetric(e.target.value)}
          placeholder="The ONE number that settles it" />
        <button className={btnInk} style={{ background: hypothesis.trim() ? R : "#C4CCD6" }} disabled={!hypothesis.trim() || A.busy} onClick={add}>
          Start
        </button>
      </div>
      {exps.length === 0 ? (
        <p className="mt-3 rounded-lg bg-[#FAFBFA] p-4 text-[11px] leading-relaxed text-[#9AA3B0]">
          Nothing running. A good first one: take the ★ trigger from Metrics → Attribution and bet
          your next 20 sends on it.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {exps.map((e) => {
            const st = EXP_STATUS[e.status] ?? EXP_STATUS.running;
            return (
              <div key={e.id} className="rounded-lg border border-[#EBECE9] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: st.b, color: st.c }}>{st.t}</span>
                  <p className="min-w-0 flex-1 text-xs font-semibold text-[#111827]">{e.hypothesis}</p>
                </div>
                {e.metric && <p className="mt-1 text-[11px] text-[#6B7280]">Settled by: <b>{e.metric}</b></p>}
                {e.status === "running" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input className={`${input} min-w-[180px] flex-1`} value={e.result} placeholder="What actually happened, in that number"
                      onChange={(ev) => A.patch({ experiments: exps.map((x) => (x.id === e.id ? { ...x, result: ev.target.value } : x)) })} />
                    <button className={btnGhost} disabled={A.busy} onClick={() => update(e.id, { status: "proved" }, "Proved ✓")}>Proved</button>
                    <button className={btnGhost} disabled={A.busy} onClick={() => update(e.id, { status: "disproved" }, "Disproved — that's a result too")}>Disproved</button>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {e.result && <p className="text-[11px] text-[#3A414D]">Result: {e.result}</p>}
                    <span className="text-[11px] text-[#9AA3B0]">Decision:</span>
                    {(["scale", "keep", "kill"] as const).map((d) => (
                      <button key={d} onClick={() => update(e.id, { decision: d }, `Decision: ${d} ✓`)}
                        className="rounded-md px-2 py-1 text-[10px] font-semibold capitalize"
                        style={e.decision === d ? { background: INK, color: "#fff" } : { background: "#F1F3F6", color: "#6B7280" }}>
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================================
// GTM Health — scored on what's DONE, never on what's typed in (mirrors W5's brand health)
// ============================================================================================
function GtmHealthCard() {
  const A = useW7();
  const h = A.health;
  if (!h) return null;
  const col = h.score >= 75 ? GREEN : h.score >= 40 ? "#D97706" : "#9AA3B0";
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#111827]">GTM Health</p>
        <span className="text-xs font-bold" style={{ color: col }}>{h.label}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0">
          <div className="h-14 w-14 rounded-full" style={{ background: `conic-gradient(${col} ${h.score * 3.6}deg, #EEF0F3 0)` }} />
          <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-white font-mono text-xs font-bold text-[#111827]">{h.score}</div>
        </div>
        <p className="text-[11px] leading-relaxed text-[#6B7280]">
          Scored on what you&apos;ve actually done — conversations and customers, not fields filled in.
        </p>
      </div>
      <div className="mt-3 space-y-1.5">
        {h.dimensions.map((d) => (
          <div key={d.name} title={d.hint}>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#3A414D]">{d.name}</span>
              <span className="font-mono text-[#9AA3B0]">{d.score}</span>
            </div>
            <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[#F1F3F6]">
              <div className="h-full rounded-full" style={{ width: `${d.score}%`, background: d.score >= 75 ? GREEN : d.score >= 40 ? "#D97706" : "#C4CCD6" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================================
// Exports — the orchestration layer's real job: hand the decision to the tool that executes it
// ============================================================================================
const EXPORTS: { kind: string; title: string; to: string; why: string }[] = [
  { kind: "targets", title: "Target accounts", to: "Clay · Apollo", why: "Your ICP + triggers as a list they can enrich. We decide who; they find the emails." },
  { kind: "crm", title: "Contacts", to: "HubSpot · Attio", why: "Accounts mapped to real lifecycle stages. We decide the pipeline; they store it." },
  { kind: "sequence", title: "Sequence", to: "Instantly · Smartlead", why: "Your touches as a campaign import. We write it; they handle deliverability." },
];
const DOCS: { key: string; name: string }[] = [
  { key: "gtm-strategy", name: "GTM Strategy" },
  { key: "icp-and-buyer-personas", name: "ICP & Buyer Personas" },
  { key: "pricing-and-packaging", name: "Pricing & Packaging" },
  { key: "email-outreach-sequences", name: "Email Outreach Sequences" },
  { key: "sales-scripts", name: "Sales Scripts" },
  { key: "design-partner-agreement", name: "Design Partner Agreement" },
  { key: "order-form", name: "Order Form" },
];

function ExportsView() {
  const A = useW7();
  const hasAccounts = A.gtm.accounts.length > 0;
  const hasSeq = A.gtm.sequences.length > 0;
  const ready = (kind: string) => (kind === "sequence" ? hasSeq : hasAccounts);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 text-xs leading-relaxed" style={{ borderColor: "#EBECE9", background: "#FAFBFA", color: "#3A414D" }}>
        <b className="text-[#111827]">StartupKit is the layer above the stack, not the stack.</b> W7 decides who to
        contact, what to charge, and what to say. Clay enriches, Instantly sends, HubSpot stores — we load them
        instead of rebuilding them. That&apos;s the whole thesis: <i>it guides; the executor executes.</i>
      </div>

      <div>
        <p className="text-sm font-bold text-[#111827]">Hand off to your stack</p>
        <div className="mt-2 space-y-2">
          {EXPORTS.map((e) => (
            <div key={e.kind} className={`${card} flex flex-wrap items-center gap-3 p-4`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl font-mono text-[10px] font-bold" style={{ background: `${R}14`, color: R }}>CSV</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#111827]">{e.title} <span className="font-normal text-[#9AA3B0]">→ {e.to}</span></p>
                <p className="text-xs text-[#6B7280]">{e.why}</p>
              </div>
              {ready(e.kind) ? (
                <button className={btnGhost} onClick={() => { window.open(gtmExportUrl(A.companyId, e.kind), "_blank"); A.notify(`${e.title} exported`); }}>
                  ⤓ Export CSV
                </button>
              ) : (
                <span className="text-[11px] text-[#9AA3B0]">{e.kind === "sequence" ? "Approve a sequence first" : "Build your target list first"}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-[#111827]">Documents <span className="font-normal text-[#9AA3B0]">— generated from your Company Object, never authored</span></p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {DOCS.map((d) => (
            <div key={d.key} className={`${card} flex items-center gap-3 p-3`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ background: INK }}>MD</span>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#111827]">{d.name}</p>
              <button onClick={() => { window.open(gtmDocUrl(A.companyId, d.key), "_blank"); A.notify(`${d.name} downloaded`); }}
                className="rounded-md border border-[#EBECE9] px-2.5 py-1 text-[11px] font-semibold text-[#3A414D] hover:border-[#c9cfda]">⤓</button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-[#DDE1DC] bg-[#FAFBFA] p-4 text-xs leading-relaxed text-[#6B7280]">
        <b className="text-[#111827]">Coming: one-click sync.</b> Real OAuth + bidirectional sync is engine #8 in the
        spec (Integration Hub). It needs app registrations with each vendor, so today we export and you import —
        the decision still travels, it just takes one more click.
      </div>
    </div>
  );
}

// ============================================================================================
// AccountFinder — W7 does the homework. It researches the market from your ICP and proposes
// real, named companies with the trigger that put each one on the list. You approve or cut.
// ============================================================================================
function AccountFinder() {
  const A = useW7();
  // One trigger list, not two: we search for the triggers the founder actually ticked above.
  const picked = A.gtm.inputs.triggers.length ? A.gtm.inputs.triggers : [TRIGGERS[0]];
  const [trigger, setTrigger] = useState(picked[0]);
  useEffect(() => {
    if (!picked.includes(trigger)) setTrigger(picked[0]);
  }, [picked, trigger]);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<TargetAccount[]>([]);
  const [cut, setCut] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const existing = new Set(A.gtm.accounts.map((a) => a.name.toLowerCase()));

  const find = async () => {
    setBusy(true);
    setFound([]);
    setNote("");
    try {
      const d = await discoverAccounts(A.companyId, trigger);
      setFound(d.accounts.filter((a) => !existing.has(a.name.toLowerCase())));
      setNote(d.note);
      setSources(d.sources.slice(0, 4));
      setCut([]);
    } catch {
      setNote("Research failed — is the API running?");
    } finally {
      setBusy(false);
    }
  };

  const keep = found.filter((a) => !cut.includes(a.name));
  const approve = () => {
    A.patch({ accounts: [...A.gtm.accounts, ...keep] }, `${keep.length} accounts added to your list`);
    setFound([]);
    setNote("");
  };

  return (
    <div className="mt-3 rounded-xl border p-4" style={{ borderColor: R, background: "#FCF6F5" }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: R }}>✦</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#111827]">Find my accounts</p>
          <p className="text-xs text-[#6B7280]">
            We research your market from your W5 ICP and bring back real companies — you approve or cut.
          </p>
        </div>
        <button className={btnInk} style={{ background: R }} disabled={busy} onClick={find}>
          {busy ? "Researching…" : "✦ Find companies"}
        </button>
      </div>

      <div className="mt-3">
        <p className={label}>Search for which of your triggers?</p>
        <div className="mt-1.5">
          <Pick opts={picked.map((t) => [t, t] as [string, string])} value={trigger} onPick={setTrigger} />
        </div>
        <p className="mt-1 text-[10px] text-[#9AA3B0]">These are the triggers you ticked above — tick more to widen the search.</p>
      </div>

      {note && !found.length && (
        <p className="mt-3 rounded-lg bg-white p-3 text-xs text-[#6B7280]">
          {note}{" "}
          <span className="text-[#9AA3B0]">We never invent a company — if the research is thin, we say so.</span>
        </p>
      )}

      {found.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#111827]">{note}</p>
            <button className={btnInk} style={{ background: INK }} disabled={A.busy || !keep.length} onClick={approve}>
              Add {keep.length} to my list →
            </button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {found.map((a) => {
              const isCut = cut.includes(a.name);
              return (
                <div key={a.name} className="rounded-lg border bg-white p-3"
                  style={{ borderColor: isCut ? "#EBECE9" : R, opacity: isCut ? 0.45 : 1 }}>
                  <div className="flex items-start gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: isCut ? "#C4CCD6" : R }}>
                      {a.name[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#111827]">{a.name}</p>
                      <p className="truncate font-mono text-[10px] text-[#9AA3B0]">{a.domain} · {a.size}</p>
                    </div>
                    <button onClick={() => setCut((c) => isCut ? c.filter((x) => x !== a.name) : [...c, a.name])}
                      className="text-[10px] font-semibold" style={{ color: isCut ? R : "#9AA3B0" }}>
                      {isCut ? "keep" : "cut"}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-[#3A414D]">{a.trigger}</p>
                </div>
              );
            })}
          </div>
          {sources.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-[#9AA3B0]">
              Researched live:
              {sources.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer"
                  className="rounded-full border border-[#EBECE9] bg-white px-1.5 py-0.5 hover:border-[#c9cfda]">
                  {(() => { try { return new URL(u).hostname.replace("www.", ""); } catch { return u; } })()}
                </a>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================================
// ReadRow — we assert a signal WITH its evidence; the founder corrects us. Never a blank question.
// ============================================================================================
function ReadRow({
  icon, title, value, sig, opts, onPick, pickedValue, busy,
}: {
  icon: string; title: string; value: string;
  sig?: { value: string; evidence: string; known: boolean };
  opts: [string, string][]; onPick: (v: string) => void; pickedValue: string; busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const guessing = sig ? !sig.known : true;
  return (
    <div className="rounded-lg border border-[#EBECE9] p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold"
          style={{ background: `${R}12`, color: R }}>{icon}</span>
        <div className="min-w-0 flex-1">
          <p className={label}>{title}</p>
          <p className="text-sm font-bold text-[#111827]">
            {busy ? "…" : value}
            {guessing && !busy && (
              <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: "#FEF3C7", color: "#92600E" }}>
                GUESS
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setEditing((e) => !e)} className="text-[11px] font-semibold" style={{ color: R }}>
          {editing ? "done" : "change"}
        </button>
      </div>
      {sig?.evidence && !busy && (
        <p className="mt-1.5 pl-11 text-[11px] leading-snug text-[#6B7280]">{sig.evidence}</p>
      )}
      {editing && (
        <div className="mt-2 pl-11"><Pick opts={opts} value={pickedValue} onPick={onPick} /></div>
      )}
    </div>
  );
}

// ============================================================================================
// PriceResearch — the last Phase-1 module that asked. Now it researches what comparable
// companies charge and proposes tiers. If it finds no real comps it says so rather than
// dressing a guess up as evidence — an unevidenced price is how founders underprice.
// ============================================================================================
function PriceResearch({ onApply }: { onApply: (tiers: PricingTier[], model: string) => void }) {
  const A = useW7();
  const [busy, setBusy] = useState(false);
  const [comps, setComps] = useState<PriceComp[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [note, setNote] = useState("");
  const [why, setWhy] = useState("");
  const [grounded, setGrounded] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [model, setModel] = useState("");

  const run = async () => {
    setBusy(true);
    try {
      const p = await researchPricing(A.companyId);
      setComps(p.comps); setTiers(p.tiers); setNote(p.note); setWhy(p.rationale);
      setGrounded(p.source === "ai" && p.comps.length > 0);
      setSources(p.sources.slice(0, 4)); setModel(p.model);
    } catch {
      setNote("Research failed — is the API running?");
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: R, background: "#FCF6F5" }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: R }}>✦</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#111827]">What should you charge?</p>
          <p className="text-xs text-[#6B7280]">
            We research what comparable companies charge and propose your tiers — you adjust.
          </p>
        </div>
        <button className={btnInk} style={{ background: R }} disabled={busy} onClick={run}>
          {busy ? "Researching…" : "✦ Research pricing"}
        </button>
      </div>

      {note && (
        <p className="mt-3 rounded-lg p-3 text-xs leading-relaxed"
          style={grounded ? { background: "#fff", color: "#3A414D" } : { background: "#FEF3C7", color: "#92600E" }}>
          {grounded ? note : `⚠ ${note}`}
        </p>
      )}

      {comps.length > 0 && (
        <div className="mt-3">
          <p className={label}>What comparable companies charge</p>
          <div className="mt-1.5 space-y-1">
            {comps.map((c) => (
              <div key={c.name} className="flex flex-wrap items-baseline gap-2 rounded-lg bg-white px-3 py-2">
                <span className="text-xs font-bold text-[#111827]">{c.name}</span>
                <span className="font-mono text-xs" style={{ color: R }}>{c.price}</span>
                <span className="truncate text-[10px] text-[#9AA3B0]">{c.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tiers.length > 0 && (
        <div className="mt-3">
          <p className={label}>Proposed tiers</p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
            {tiers.map((t) => (
              <div key={t.name} className="rounded-lg bg-white p-2.5">
                <p className="text-xs font-bold text-[#111827]">{t.name}</p>
                <p className="font-mono text-sm font-extrabold" style={{ color: R }}>${t.price}<span className="text-[10px] font-normal text-[#9AA3B0]">/{t.unit}</span></p>
              </div>
            ))}
          </div>
          {why && <p className="mt-2 text-[11px] leading-snug text-[#6B7280]">{why}</p>}
          <button className={`${btnInk} mt-2`} style={{ background: INK }} onClick={() => { onApply(tiers, model); A.notify("Tiers applied — adjust them below"); }}>
            Use these tiers →
          </button>
          {sources.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-[#9AA3B0]">
              Researched live:
              {sources.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#EBECE9] bg-white px-1.5 py-0.5">
                  {(() => { try { return new URL(u).hostname.replace("www.", ""); } catch { return u; } })()}
                </a>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================================
// One-click send — we do 99%, you do the last click.
//
// StartupKit is never in the sending path. This opens YOUR mail client with the subject and body
// already written; you read it and press Send yourself. No OAuth, no credentials, no access to
// your mailbox, and your domain reputation stays entirely yours.
// ============================================================================================
function splitMail(rendered: string): { subject: string; body: string } {
  const [head, ...rest] = rendered.split("\n");
  const subject = head.includes("Subject:") ? head.split("Subject:")[1].trim() : "";
  const body = (subject ? rest.join("\n") : rendered).trim();
  return { subject, body };
}

/** Gmail's compose deep-link. Falls back to the OS mail client if they don't use Gmail. */
function gmailUrl(to: string, subject: string, body: string): string {
  const q = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
  return `https://mail.google.com/mail/?${q.toString()}`;
}
function mailtoUrl(to: string, subject: string, body: string): string {
  const q = new URLSearchParams({ subject, body });
  return `mailto:${to}?${q.toString()}`;
}

function SendRow({
  account, rendered, onSent,
}: {
  account: TargetAccount; rendered: string; onSent: () => void;
}) {
  const A = useW7();
  const { subject, body } = splitMail(rendered);
  const [to, setTo] = useState(account.email);
  const [who, setWho] = useState(account.contact);

  const saveWho = () =>
    A.patch({
      accounts: A.gtm.accounts.map((x) =>
        x.name === account.name ? { ...x, contact: who, email: to } : x,
      ),
    });

  const open = (url: string) => {
    window.open(url, "_blank", "noopener");
    saveWho();
    A.notify(`Opened in your mail — press Send there, then mark it`);
  };

  return (
    <div className="mt-2 rounded-lg border border-[#EBECE9] bg-white p-3">
      <div className="flex flex-wrap gap-2">
        <input className={`${input} flex-1`} placeholder="Their name (for “Hi …”)" value={who}
          onChange={(e) => setWho(e.target.value)} onBlur={saveWho} />
        <input className={`${input} flex-1`} placeholder="their@email.com" value={to}
          onChange={(e) => setTo(e.target.value)} onBlur={saveWho} />
      </div>
      {!to && (
        <p className="mt-1.5 text-[10px] text-[#9AA3B0]">
          We don&apos;t guess emails — paste it, or export this list to Clay/Apollo to find them.
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className={btnInk} style={{ background: R }} onClick={() => open(gmailUrl(to, subject, body))}>
          ✉ Open in Gmail
        </button>
        <button className={btnGhost} onClick={() => open(mailtoUrl(to, subject, body))}>Other mail app</button>
        <button className={btnGhost} onClick={() => { navigator.clipboard?.writeText(rendered); A.notify("Copied"); }}>Copy</button>
        <button className={btnGhost} disabled={A.busy} onClick={onSent}>I sent it ✓</button>
      </div>
      <p className="mt-1.5 text-[10px] text-[#9AA3B0]">
        It opens in <b>your</b> mailbox with this already written. You press Send — we never do.
      </p>
    </div>
  );
}

// ============================================================================================
// TouchSender — every touch gets the one-click send, not just the first. Prospects start on
// touch 1; contacted accounts get the day-3 and day-7 follow-ups.
// ============================================================================================
function TouchSender({
  account, steps, render, onFirstSent,
}: {
  account: TargetAccount;
  steps: string[];
  render: (tpl: string, a: TargetAccount) => string;
  onFirstSent: () => void;
}) {
  const [touch, setTouch] = useState(account.stage === "prospect" ? 0 : 1);
  const labels = ["Touch 1 · day 1", "Touch 2 · day 3", "Touch 3 · day 7"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {steps.slice(0, 3).map((_, i) => (
          <button key={i} onClick={() => setTouch(i)} className="rounded-md px-2 py-1 text-[10px] font-semibold"
            style={touch === i ? { background: R, color: "#fff" } : { background: "#F1F3F6", color: "#6B7280" }}>
            {labels[i] ?? `Touch ${i + 1}`}
          </button>
        ))}
      </div>
      <pre className="mt-2 whitespace-pre-wrap rounded bg-[#FAFBFA] p-2 font-mono text-[10px] leading-relaxed text-[#3A414D]">{render(steps[touch] ?? steps[0], account)}</pre>
      <SendRow account={account} rendered={render(steps[touch] ?? steps[0], account)}
        onSent={() => { if (account.stage === "prospect") onFirstSent(); }} />
    </div>
  );
}

// ============================================================================================
// WTP survey — Van Westendorp. When competitor research finds nothing, this is the credentialed
// fallback: four questions to your own design partners give a defensible price band.
// ============================================================================================
function WtpSurvey() {
  const A = useW7();
  const saved = A.gtm.inputs.wtp;
  const [v, setV] = useState<number[]>(saved.length === 5 ? saved : [29, 99, 199, 349, 0]);
  const [tc, ch, ex, te, n] = v;
  const sane = tc < ch && ch < ex && ex < te;
  const confident = n >= 20;
  const optimal = sane ? Math.round(Math.sqrt(ch * ex)) : 0; // geometric mid of the acceptable band
  const set = (i: number, val: number) => setV((x) => x.map((y, j) => (j === i ? val : y)));
  const save = () => A.patch({ inputs: { ...A.gtm.inputs, wtp: v } }, "Survey results saved ✓");

  const LABELS = [
    "Too cheap — they'd doubt the quality",
    "A bargain — great value",
    "Getting expensive — they'd think twice",
    "Too expensive — they would not buy",
    "How many people you asked",
  ];
  return (
    <div className={`${card} p-5`}>
      <h3 className="text-sm font-bold text-[#111827]">
        Ask your design partners <span className="font-normal text-[#9AA3B0]">— the Van Westendorp survey</span>
      </h3>
      <p className="mt-1 text-xs text-[#6B7280]">
        Four questions, asked verbatim, to the people in your pipeline. Their answers beat any
        competitor research — it&apos;s what <i>your</i> buyers will actually pay.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {LABELS.map((l, i) => (
          <div key={l} className={i === 4 ? "sm:col-span-2" : ""}>
            <p className={label}>{l}</p>
            <div className="mt-1 flex items-center gap-1">
              {i < 4 && <span className="text-xs text-[#9AA3B0]">$</span>}
              <input type="number" className={input} value={v[i]}
                onChange={(e) => set(i, Number(e.target.value))} onBlur={save} />
            </div>
          </div>
        ))}
      </div>
      {!sane ? (
        <p className="mt-3 rounded-lg bg-[#FEF3C7] p-3 text-xs" style={{ color: "#92600E" }}>
          ⚠ The four numbers should rise left to right (too cheap &lt; bargain &lt; expensive &lt; too expensive).
        </p>
      ) : (
        <div className="mt-3 rounded-lg bg-[#FAFBFA] p-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-xs text-[#6B7280]">Acceptable band:</span>
            <span className="font-mono text-sm font-bold text-[#111827]">${ch} – ${ex}</span>
            <span className="text-xs text-[#6B7280]">Suggested point:</span>
            <span className="font-mono text-sm font-bold" style={{ color: R }}>${optimal}</span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
              style={confident ? { background: "#EAF7EF", color: "#1E7A3D" } : { background: "#FEF3C7", color: "#92600E" }}>
              {confident ? `n=${n} · defensible` : `n=${n} · ask ${Math.max(20 - n, 0)} more for confidence`}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] text-[#9AA3B0]">
            Below ${ch} they doubt you; above ${ex} they hesitate. Under 20 respondents this is a hint, not evidence.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================================
// Deliverability — the safety on "send the first 20 by hand". Real DNS checks (SPF/DMARC/MX)
// on the founder's domain, because that domain is also their investor email.
// ============================================================================================
function DeliverabilityCard() {
  const A = useW7();
  const [dom, setDom] = useState("");
  const [res, setRes] = useState<Deliverability>();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { setRes(await getDeliverability(A.companyId, dom)); }
    catch { A.notify("Check failed — is the API running?"); }
    finally { setBusy(false); }
  };
  const C: Record<string, string> = { pass: GREEN, fail: "#DC2626", unknown: "#9AA3B0" };
  return (
    <div className={`${card} p-5`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[#111827]">Is your domain safe to send from?</h3>
          <p className="text-xs text-[#6B7280]">
            Real DNS checks — the same ones a receiving mail server runs. Your sending domain is
            also your investor email; check it before the first 20.
          </p>
        </div>
        <input className={`${input} w-44`} placeholder="yourdomain.com" value={dom} onChange={(e) => setDom(e.target.value)} />
        <button className={btnInk} style={{ background: INK }} disabled={busy} onClick={run}>
          {busy ? "Checking…" : "Check DNS"}
        </button>
      </div>
      {res && (
        <div className="mt-3">
          <p className="rounded-lg p-2.5 text-xs font-semibold"
            style={res.ready ? { background: "#EAF7EF", color: "#1E7A3D" } : { background: "#FBECEC", color: "#B23A2E" }}>
            {res.domain}: {res.note}
          </p>
          <div className="mt-2 space-y-1">
            {res.checks.map((c) => (
              <div key={c.name} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 font-bold" style={{ color: C[c.status] }}>
                  {c.status === "pass" ? "✓" : c.status === "fail" ? "✕" : "?"}
                </span>
                <span className="w-48 shrink-0 font-medium text-[#111827]">{c.name}</span>
                <span className="min-w-0 flex-1 font-mono text-[10px] text-[#6B7280]">{c.detail}</span>
              </div>
            ))}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] text-[#9AA3B0]">Warm-up ramp — if this domain is new to outbound</summary>
            <ul className="mt-1 space-y-0.5 pl-4 text-[11px] text-[#6B7280]">
              {res.warmup.map((w) => <li key={w}>· {w}</li>)}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}

// ============================================================================================
// Design Partners (0→10) — the actual pre-seed motion. Walk each partner from identified to
// paying; the agreement is generated, the count feeds the rep-hiring gate.
// ============================================================================================
const PARTNER_STAGES: [string, string][] = [
  ["identified", "Identified"], ["pitched", "Pitched"], ["agreed", "Agreed"],
  ["onboarded", "Onboarded"], ["feedback", "Giving feedback"], ["reference", "Reference"],
  ["paying", "Paying"],
];

function PartnersTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const partners = A.gtm.partners;
  const [draft, setDraft] = useState({ name: "", contact: "", email: "" });
  const done = A.has("mod:partners");
  const paying = partners.filter((p) => p.stage === "paying").length;
  const stageIdx = (st: string) => PARTNER_STAGES.findIndex(([k]) => k === st);

  const add = () => {
    if (!draft.name.trim()) return A.notify("Name the company first");
    A.patch(
      { partners: [...partners, { ...draft, name: draft.name.trim(), stage: "identified", notes: "" }] },
      `${draft.name.trim()} added as a design partner`,
    );
    setDraft({ name: "", contact: "", email: "" });
  };
  const setStage = (name: string, stage: string) =>
    A.patch({ partners: partners.map((p) => (p.name === name ? { ...p, stage } : p)) },
      stage === "paying" ? "🎉 A paying customer" : "Stage updated");
  const remove = (name: string) =>
    A.patch({ partners: partners.filter((p) => p.name !== name) }, "Removed");

  return (
    <SectionShell title="Design Partners (0→10)" desc="Trade access for feedback, references, and your first revenue — walked to paid, one by one." onBack={onBack}
      right={
        <button className={btnInk} style={{ background: R }} disabled={A.busy}
          onClick={() => A.patch({ steps_done: done ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:partners"] }, "Marked complete ✓")}>
          {done ? "Completed ✓" : "Mark complete"}
        </button>
      }>
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-[#DDE1DC] bg-[#FAFBFA] p-4 text-xs leading-relaxed text-[#3A414D]">
            <b className="text-[#111827]">Why partners, not prospects:</b> your first ten customers rarely come
            from cold email — they come from 5–10 companies who get early access and a direct line to you, in
            exchange for honest feedback and (when it works) a reference and a paid contract. This is the motion
            almost every B2B company you admire actually ran first.
          </div>

          <div className={`${card} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#111827]">The board <span className="font-normal text-[#9AA3B0]">({partners.length} of ~10)</span></h3>
              <button className={btnGhost} onClick={() => { window.open(gtmDocUrl(A.companyId, "design-partner-agreement"), "_blank"); A.notify("Agreement downloaded — have W2's counsel review it"); }}>
                ⤓ Design-partner agreement
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input className={`${input} flex-1`} placeholder="Company" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <input className={`${input} flex-1`} placeholder="Contact person" value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} />
              <input className={`${input} flex-1`} placeholder="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              <button className={btnInk} style={{ background: INK }} disabled={A.busy} onClick={add}>Add</button>
            </div>
            {partners.length === 0 ? (
              <p className="mt-4 rounded-lg bg-[#FAFBFA] p-4 text-center text-xs text-[#9AA3B0]">
                No partners yet. Your warmest target accounts are the best candidates — pick 5 you&apos;d want feedback from even if they never paid.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {partners.map((p) => {
                  const idx = stageIdx(p.stage);
                  return (
                    <div key={p.name} className="rounded-lg border border-[#EBECE9] p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 flex-1 text-sm font-bold text-[#111827]">{p.name}
                          {p.contact && <span className="ml-2 text-xs font-normal text-[#9AA3B0]">{p.contact}</span>}
                        </p>
                        <select value={p.stage} onChange={(e) => setStage(p.name, e.target.value)} disabled={A.busy}
                          className="rounded-lg border border-[#EBECE9] px-2 py-1 text-[11px]">
                          {PARTNER_STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                        <button onClick={() => remove(p.name)} className="text-[11px] text-[#9AA3B0] hover:text-[#DC2626]">✕</button>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {PARTNER_STAGES.map(([k], i) => (
                          <div key={k} className="h-1.5 flex-1 rounded-full" title={PARTNER_STAGES[i][1]}
                            style={{ background: i <= idx ? (k === "paying" && i === idx ? GREEN : R) : "#F1F3F6" }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <aside className="space-y-4">
          <div className={`${card} p-5 text-center`}>
            <p className={label}>Paying partners</p>
            <p className="mt-1 font-mono text-3xl font-extrabold" style={{ color: paying ? GREEN : "#9AA3B0" }}>{paying}<span className="text-base font-normal text-[#9AA3B0]"> / 10</span></p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#6B7280]">
              Ten paying — closed by you — is the rep-hiring gate. Before that there&apos;s no repeatable
              process to hand anyone.
            </p>
          </div>
          <div className={`${card} p-5`}>
            <p className={label}>The trade, said plainly</p>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
              They get: early access, the pilot offer, a direct line to you, real influence on the roadmap.<br /><br />
              You get: a feedback call every two weeks, honest answers about what they&apos;d pay, and — when
              it works — a reference and your first revenue.
            </p>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// Content Engine — the Motion tool recommends content for PLG/hybrid; this is where that stops
// being a dead end. Ideas generated from the Brand Core, scheduled by week, ticked when shipped.
// ============================================================================================
function ContentTool({ onBack }: { onBack: () => void }) {
  const A = useW7();
  const ideas = A.gtm.content;
  const [busy, setBusy] = useState(false);
  const done = A.has("mod:content");
  const shipped = ideas.filter((i) => i.done).length;
  const PLAT: Record<string, string> = { blog: "✍ Blog", linkedin: "in LinkedIn", x: "𝕏 X" };

  const gen = async () => {
    setBusy(true);
    try {
      const d = await generateContent(A.companyId);
      await A.patch({ content: d.ideas }, d.source === "ai" ? "6 ideas, sharpened by AI ✓" : "6 ideas from your Brand Core ✓");
    } catch { A.notify("Couldn't generate — is the API running?"); }
    finally { setBusy(false); }
  };
  const toggleIdea = (title: string) =>
    A.patch({ content: ideas.map((i) => (i.title === title ? { ...i, done: !i.done } : i)) }, "Updated");

  return (
    <SectionShell title="Content Engine" desc="Ideas from your positioning and pillars — a calendar, not a blank page." onBack={onBack}
      right={
        <div className="flex gap-2">
          <button className={btnInk} style={{ background: R }} disabled={busy} onClick={gen}>
            {busy ? "Drafting…" : ideas.length ? "↻ Regenerate ideas" : "✦ Generate 6 ideas"}
          </button>
          <button className={btnGhost} disabled={A.busy}
            onClick={() => A.patch({ steps_done: done ? A.gtm.steps_done : [...A.gtm.steps_done, "mod:content"] }, "Marked complete ✓")}>
            {done ? "Completed ✓" : "Mark complete"}
          </button>
        </div>
      }>
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {ideas.length === 0 ? (
            <div className={`${card} p-10 text-center`}>
              <p className="text-3xl">✍</p>
              <p className="mt-3 text-sm font-bold text-[#111827]">No calendar yet</p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#6B7280]">
                We&apos;ll draft six pieces from your Brand Core — your problem, your ICP, your positioning —
                scheduled over three weeks across blog, LinkedIn and X. You edit, then write.
              </p>
              <button className={`${btnInk} mt-4`} style={{ background: R }} disabled={busy} onClick={gen}>
                {busy ? "Drafting…" : "✦ Generate 6 ideas"}
              </button>
            </div>
          ) : (
            [1, 2, 3].map((wk) => {
              const wkIdeas = ideas.filter((i) => i.week === wk);
              if (!wkIdeas.length) return null;
              return (
                <div key={wk} className={`${card} p-5`}>
                  <h3 className="text-sm font-bold text-[#111827]">Week {wk}</h3>
                  <div className="mt-2 space-y-2">
                    {wkIdeas.map((i) => (
                      <div key={i.title} className="flex items-start gap-2.5 rounded-lg border border-[#EBECE9] p-3">
                        <button onClick={() => toggleIdea(i.title)} disabled={A.busy} className="mt-0.5"
                          style={{ color: i.done ? GREEN : "#C4CCD6" }}>{i.done ? "☑" : "☐"}</button>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug" style={{ color: i.done ? "#9AA3B0" : "#111827", textDecoration: i.done ? "line-through" : "none" }}>{i.title}</p>
                          <span className="mt-1 inline-block rounded-full bg-[#F1F3F6] px-2 py-0.5 text-[10px] text-[#6B7280]">{PLAT[i.platform] ?? i.platform}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <aside className="space-y-4">
          <div className={`${card} p-5 text-center`}>
            <p className={label}>Shipped</p>
            <p className="mt-1 font-mono text-3xl font-extrabold" style={{ color: shipped ? GREEN : "#9AA3B0" }}>{shipped}<span className="text-base font-normal text-[#9AA3B0]"> / {ideas.length || 6}</span></p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#6B7280]">Content compounds — expect 6–12 months before it drives real pipeline. Start now, judge later.</p>
          </div>
          <div className={`${card} p-5`}>
            <p className={label}>The rule</p>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
              One pillar, one idea, one platform at a time. Six shipped pieces beat sixty drafts —
              and every one should be specific enough that only {A.companyName} could have written it.
            </p>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

// ============================================================================================
// THE DOOR — the hub organised around the five questions a founder actually has, not our
// module taxonomy. Progress = questions answered. One next move, front and centre.
// ============================================================================================
type Question = {
  n: number;
  q: string;
  modules: string[]; // module ids under this question
  answered: (g: GtmState) => boolean;
  answer: (g: GtmState) => string;
  cta: string;
  section: string;
};

const QUESTIONS: Question[] = [
  {
    n: 1, q: "Who do I sell to?", modules: ["icp", "partners"],
    answered: (g) => g.accounts.length > 0 || g.partners.length > 0,
    answer: (g) => {
      const bits = [];
      if (g.accounts.length) bits.push(`${g.accounts.length} target account${g.accounts.length === 1 ? "" : "s"}`);
      if (g.partners.length) bits.push(`${g.partners.length} design partner${g.partners.length === 1 ? "" : "s"}`);
      return bits.join(" · ");
    },
    cta: "Find my accounts", section: "icp",
  },
  {
    n: 2, q: "What do I charge?", modules: ["pricing"],
    answered: (g) => g.pricing.tiers.length > 0,
    answer: (g) => {
      const t = g.pricing.tiers[0];
      return t ? `${g.pricing.model || "tiered"} · from $${t.price}/${t.unit}${g.pricing.locked ? " · locked" : ""}` : "";
    },
    cta: "Research my price", section: "pricing",
  },
  {
    n: 3, q: "How do they find me?", modules: ["strategy", "landing", "analytics", "content"],
    answered: (g) => Boolean(g.strategy.motion),
    answer: (g) => `${g.strategy.motion} · ${g.strategy.channels.slice(0, 2).join(" + ") || "channels tbd"}`,
    cta: "Read my motion", section: "strategy",
  },
  {
    n: 4, q: "What do I say?", modules: ["outreach", "discovery"],
    answered: (g) => g.sequences.some((x) => x.approved),
    answer: (g) => `${g.sequences[0]?.steps.length ?? 3}-touch sequence approved`,
    cta: "Write my emails", section: "outreach",
  },
  {
    n: 5, q: "How do they buy?", modules: ["crm"],
    answered: (g) => g.connections.some((c) => c.kind === "crm" && c.status !== "off"),
    answer: (g) =>
      `${g.connections.find((c) => c.kind === "crm")?.provider ?? "CRM"} connected` +
      (g.inputs.payment_link ? " · payment link live" : ""),
    cta: "Connect a CRM", section: "crm",
  },
];

function answeredCount(g: GtmState): number {
  return QUESTIONS.filter((q) => q.answered(g)).length;
}

function FiveQuestions({
  onOpenSection, open, setOpen,
}: {
  onOpenSection: (s: string) => void;
  open: number | null;
  setOpen: (n: number | null) => void;
}) {
  const A = useW7();
  const g = A.gtm;
  const firstOpen = QUESTIONS.find((q) => !q.answered(g));
  const nextTask = g.tasks.find((t) => !t.done);

  return (
    <div className="space-y-4">
      {/* one next move, front and centre */}
      <div className="rounded-2xl p-5 text-white" style={{ background: "#171A21" }}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">Your next move</p>
        {firstOpen ? (
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-lg font-extrabold">{firstOpen.q}</p>
            <button className="rounded-lg px-4 py-2.5 text-sm font-bold" style={{ background: R, color: "#fff" }}
              onClick={() => onOpenSection(firstOpen.section)}>
              {firstOpen.cta} →
            </button>
          </div>
        ) : nextTask ? (
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-lg font-extrabold">{nextTask.text}</p>
            <button className="rounded-lg px-4 py-2.5 text-sm font-bold" style={{ background: R, color: "#fff" }}
              onClick={() => nextTask.link && onOpenSection(nextTask.link)}>
              Do it →
            </button>
          </div>
        ) : (
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-lg font-extrabold">All five answered. Now it&apos;s reps: send, talk, close.</p>
            <button className="rounded-lg px-4 py-2.5 text-sm font-bold" style={{ background: R, color: "#fff" }}
              onClick={() => onOpenSection("outreach")}>
              Send the next 20 →
            </button>
          </div>
        )}
      </div>

      {/* the five questions */}
      {QUESTIONS.map((q) => {
        const ok = q.answered(g);
        const isOpen = open === q.n;
        return (
          <div key={q.n} className={card} style={isOpen ? { borderColor: R } : undefined}>
            <button className="flex w-full items-center gap-4 p-4 text-left" onClick={() => setOpen(isOpen ? null : q.n)}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: ok ? "#DCFCE7" : "#F1F3F6", color: ok ? GREEN : "#6B7280" }}>
                {ok ? "✓" : q.n}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[#111827]">{q.q}</p>
                <p className="truncate text-xs" style={{ color: ok ? GREEN : "#9AA3B0" }}>
                  {ok ? q.answer(g) : "Not answered yet"}
                </p>
              </div>
              {!ok && (
                <span className="hidden rounded-lg border px-3 py-1.5 text-xs font-semibold sm:block" style={{ borderColor: R, color: R }}
                  onClick={(e) => { e.stopPropagation(); onOpenSection(q.section); }}>
                  {q.cta} →
                </span>
              )}
              <span className="text-[#9AA3B0]">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div className="border-t border-[#EEF0F3] p-4">
                <div className="flex flex-wrap gap-2">
                  {q.modules.map((id) => {
                    const m = MODULES.find((x) => x.id === id);
                    if (!m) return null;
                    const mdone = A.has(`mod:${id}`);
                    return (
                      <button key={id} onClick={() => onOpenSection(id)}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:border-[#c9cfda]"
                        style={{ borderColor: mdone ? "#BBE9CD" : "#EBECE9", color: mdone ? "#1E7A3D" : "#3A414D" }}>
                        {mdone ? "✓" : "·"} {m.title} →
                      </button>
                    );
                  })}
                </div>
                {q.n === 5 && (
                  <p className="mt-2 text-[11px] text-[#9AA3B0]">
                    {g.inputs.payment_link
                      ? "Payment link is live — the closing email + order form are in CRM & Pipeline."
                      : "Paste your Stripe Payment Link in CRM & Pipeline and W7 writes the closing email + order form around it."}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================================
// Ask W7 — the same seam as W5's brand chat: a question box grounded in THEIR pipeline numbers,
// not generic sales advice. Floating dock so it's reachable from every tool.
// ============================================================================================
function GtmChatDock() {
  const A = useW7();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ who: "you" | "w7"; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [msgs, thinking]);

  const send = async () => {
    const text = draft.trim();
    if (!text || thinking) return;
    setDraft("");
    const history = msgs.map((m) => `${m.who === "you" ? "Founder" : "W7"}: ${m.text}`);
    setMsgs((m) => [...m, { who: "you", text }]);
    setThinking(true);
    try {
      const r = await gtmChat(A.companyId, text, history);
      setMsgs((m) => [...m, { who: "w7", text: r.reply }]);
    } catch {
      setMsgs((m) => [...m, { who: "w7", text: "Couldn't reach the engine — is the API running?" }]);
    } finally {
      setThinking(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-xl"
        style={{ background: INK }}>
        ✳ Ask W7
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex max-h-[70vh] w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-[#EBECE9] bg-white shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: INK }}>
        <div>
          <p className="text-sm font-bold text-white">Ask W7</p>
          <p className="text-[10px] text-white/60">Answers use your real pipeline — never invented numbers.</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded px-2 py-1 text-white/70 hover:text-white">✕</button>
      </div>
      <div ref={bodyRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {msgs.length === 0 && (
          <div className="rounded-lg bg-[#FAFBFA] p-3 text-[11px] leading-relaxed text-[#6B7280]">
            Ask anything about selling this company — &ldquo;is my price too low?&rdquo;, &ldquo;why is
            nobody replying?&rdquo;, &ldquo;what do I do this week?&rdquo;. I answer from your motion,
            pricing and account stages.
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.who === "you" ? "ml-auto text-white" : "bg-[#F1F3F6] text-[#111827]"}`}
            style={m.who === "you" ? { background: R } : undefined}>
            {m.text}
          </div>
        ))}
        {thinking && <div className="max-w-[85%] rounded-xl bg-[#F1F3F6] px-3 py-2 text-xs text-[#9AA3B0]">Thinking…</div>}
      </div>
      <div className="flex gap-2 border-t border-[#EEF0F3] p-3">
        <input className={`${input} flex-1`} placeholder="Ask about your GTM…" value={draft}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className={btnInk} style={{ background: draft.trim() && !thinking ? R : "#C4CCD6" }} disabled={!draft.trim() || thinking} onClick={send}>
          →
        </button>
      </div>
    </div>
  );
}
