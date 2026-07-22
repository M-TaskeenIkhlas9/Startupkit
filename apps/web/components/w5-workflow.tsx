"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  brandWordmarkUrl,
  brandFaviconUrl,
  publishedSiteUrl,
  saveBrand,
  getBrandHealth,
  brandChat,
  completePhase,
  getBrandPlays,
  generateBrand,
  checkNamePresence,
} from "@/lib/api";
import type { BrandHealth, BrandState, PlayMatch, PresenceItem, WorkflowView } from "@/lib/types";

// W5 · Brand & Product Foundation — rebuilt to the finalized design (W5 folder mocks).
// Design-first (matches the images); real backend wiring is a follow-up pass. Two screens so far:
// the 10-module hub, and the Brand Strategy detail page — client-side section switching.
const O = "#E8590C"; // W5 orange accent
const GREEN = "#16A34A";

type Step = { id: string; label: string; status: "done" | "active" | "pending" };
type Module = {
  n: number;
  id: string;
  title: string;
  desc: string;
  color: string;
  icon: string; // inner SVG
  steps: Step[];
  opens?: string; // section id this module opens
};

const ICON: Record<string, string> = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2.2 5.3-5.3 2.2 2.2-5.3z"/>',
  chart: '<path d="M12 3a9 9 0 109 9h-9z"/><path d="M12 3v9h9a9 9 0 00-9-9z" opacity="0"/><path d="M12 3v9l7.8 4.5"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  spark: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z"/>',
  brush: '<path d="M14 7l3-3 3 3-3 3zM13 8L5 16c-1 1-1 3 0 4s3 1 4 0l8-8"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  mega: '<path d="M4 11v2l12 5V6z"/><path d="M16 8a4 4 0 010 8"/>',
  shield: '<path d="M12 3l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V6z"/><path d="M9 12l2 2 4-4"/>',
  db: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
};

const MODULES: Module[] = [
  { n: 1, id: "strategy", opens: "strategy", title: "Brand Strategy", desc: "Define your mission, vision, values, and brand personality.", color: "#10B981", icon: ICON.compass, steps: allDone(4) },
  { n: 2, id: "market", opens: "market", title: "Market Research & Competitor Analysis", desc: "Analyze your market, competitors, and unique position.", color: "#2563EB", icon: ICON.chart, steps: allDone(3) },
  {
    n: 3, id: "naming", title: "Naming & Validation",
    desc: "Check your name's domain, social handle, and trademark availability — a heuristic read, not a registration.",
    color: "#EA580C", icon: ICON.spark,
    steps: allPending(3),
  },
  { n: 4, id: "identity", opens: "identity", title: "Brand Identity", desc: "Design your logo, wordmark, and core visual identity.", color: "#EC4899", icon: ICON.brush, steps: allPending(6) },
  { n: 5, id: "design", opens: "design", title: "Design System", desc: "Tokens, UI foundation, and your generated website — all in one place.", color: "#F59E0B", icon: ICON.grid, steps: allPending(8) },
  { n: 6, id: "marketing", opens: "launch", title: "Marketing Assets", desc: "Generate pitch decks, one-pagers, and marketing materials.", color: "#16A34A", icon: ICON.mega, steps: allPending(7) },
  { n: 7, id: "os", title: "Brand Operating System", desc: "Your centralized brand OS that powers everything.", color: "#7C3AED", icon: ICON.db, steps: allPending(4) },
];

// "Why this matters" per module — borrowed from the checklist studio's per-step rationale.
const MODULE_WHY: Record<string, string> = {
  strategy: "Everything downstream — name, logo, copy, deck — is built on this. Get it right once.",
  market: "Know who else solves this before you lock positioning — the map turns research into a picture of where you sit versus the field.",
  naming: "A name you can legally own and register across domain and social handles.",
  identity: "The look people recognize before they read a word.",
  design: "The reusable UI foundation your product and site are built from — and where your generated website lives. Overlaps W4 (Technical); most pre-seed teams can skip the raw tokens until they have a product team, but the website link is worth checking.",
  marketing: "The assets you hand to investors, press, and your first hires.",
  os: "Merged into the Documents & Connections tabs above — that IS your brand operating system: every asset + every connected tool, kept in sync.",
};

function allDone(n: number): Step[] {
  return Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: `Step ${i + 1}`, status: "done" as const }));
}
function allPending(n: number): Step[] {
  return Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: `Step ${i + 1}`, status: "pending" as const }));
}

const PALETTE = ["#111827", "#7C3AED", "#2563EB", "#0D9488", "#16A34A", "#E5E7EB"];

// ============================================================================================
// W5 action layer — makes every screen live: persists progress to the Brand Core (steps_done),
// derives real content from brand.core, streams the AI assistant, and downloads real assets.
// Exposed via context so all 14 sub-screens can use it without prop-drilling.
// ============================================================================================
const EMPTY_BRAND: BrandState = {
  core: {
    play_id: "", play_name: "", play_rationale: "", examples: [], mission: "", vision: "",
    values: [], icp: "", category: "", positioning: "", voice: "", tagline: "", pitch: "",
    pillars: [], sources: [], source: "",
  },
  visual: { palette: [], type_display: "", type_body: "", logo_direction: "" },
  presence: [],
  site_template: "",
  steps_done: [],
  asset_edits: {},
};

// The real, progress-bearing modules (Brand OS folds into Documents).
const PROGRESS_MODULES = ["strategy", "market", "naming", "identity", "design", "marketing"];

// Maps W5 module completion → the 3 workflow phases (Define/Design/Deploy) the catalog tracks.
// Completing these is what marks W5 "complete" on the workflows page and unlocks W7.
const PHASE_GATES: Record<number, string[]> = {
  1: ["strategy", "market", "naming"], // Define
  2: ["identity", "design"], // Design
  3: ["marketing"], // Deploy
};

type ChatMsg = { role: "user" | "cofounder"; text: string };
type W5Actions = {
  companyId: string;
  brandName: string;
  brand: BrandState;
  core: BrandState["core"];
  has: (id: string) => boolean;
  overallPct: number;
  complete: (id: string, opts?: { silent?: boolean }) => Promise<void>;
  toggle: (id: string) => void;
  saveDraft: () => Promise<void>;
  patch: (partial: Partial<BrandState>, note?: string) => Promise<void>;
  finishW5: () => Promise<void>;
  busy: boolean;
  health?: BrandHealth;
  notify: (msg: string) => void;
  download: (filename: string, content: string, mime?: string) => void;
  openUrl: (url: string) => void;
  goWorkflow: (code: string) => void;
  openChat: (seed?: string) => void;
};
const W5Context = createContext<W5Actions | null>(null);
function useW5(): W5Actions {
  const ctx = useContext(W5Context);
  if (!ctx) throw new Error("useW5 must be used within W5Workflow");
  return ctx;
}

// ============================================================================================
export function W5Workflow({
  companyId,
  companyName,
  initialBrand,
  view,
}: {
  companyId: string;
  companyName: string;
  initialBrand?: BrandState;
  view: WorkflowView;
}) {
  const [section, setSection] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(3);
  const brandName = companyName || "Nexora";

  // Live Brand Core state — seeded from the server snapshot, persisted on every change.
  const [brand, setBrand] = useState<BrandState>(() => ({ ...EMPTY_BRAND, ...(initialBrand ?? {}) }));
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<BrandHealth>();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [chat, setChat] = useState<{ open: boolean; seed: string }>({ open: false, seed: "" });

  useEffect(() => {
    getBrandHealth(companyId).then(setHealth).catch(() => {});
  }, [companyId]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Bridge W5's module progress to the workflow catalog: complete the W5 phases whose gate modules
  // are all done. This is what marks W5 complete on the workflows page and unlocks W7.
  const phasesRef = useRef<Set<number>>(new Set(view.completed_phases ?? []));
  const syncPhases = useCallback(
    async (steps: string[]) => {
      for (const [n, gates] of Object.entries(PHASE_GATES)) {
        const num = Number(n);
        if (phasesRef.current.has(num)) continue;
        if (gates.every((g) => steps.includes(`mod:${g}`))) {
          try {
            await completePhase(companyId, "W5", num);
            phasesRef.current.add(num);
          } catch {
            /* keep going; will retry on next change */
          }
        }
      }
    },
    [companyId],
  );

  const persist = useCallback(
    async (next: BrandState, note?: string) => {
      setBrand(next);
      setBusy(true);
      try {
        const snap = await saveBrand(companyId, next);
        const saved = snap.brand ? { ...EMPTY_BRAND, ...snap.brand } : next;
        setBrand(saved);
        getBrandHealth(companyId).then(setHealth).catch(() => {});
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

  // On load, reconcile phases with whatever modules are already complete (fixes an already-100% W5
  // whose workflow phases were never marked — so W7 unlocks immediately).
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    syncPhases(brand.steps_done);
  }, [syncPhases, brand.steps_done]);

  const finishW5 = useCallback(async () => {
    for (const n of [1, 2, 3]) {
      if (phasesRef.current.has(n)) continue;
      try {
        await completePhase(companyId, "W5", n);
        phasesRef.current.add(n);
      } catch {
        /* ignore */
      }
    }
    notify("W5 marked complete — W7 unlocked ✓");
  }, [companyId, notify]);

  const has = useCallback((id: string) => brand.steps_done.includes(id), [brand.steps_done]);

  const complete = useCallback(
    async (id: string, opts?: { silent?: boolean }) => {
      if (brand.steps_done.includes(id)) {
        if (!opts?.silent) notify("Already saved ✓");
        return;
      }
      await persist(
        { ...brand, steps_done: [...brand.steps_done, id] },
        opts?.silent ? undefined : "Saved & marked complete ✓",
      );
    },
    [brand, persist, notify],
  );

  const toggle = useCallback(
    (id: string) => {
      const done = brand.steps_done.includes(id);
      persist(
        { ...brand, steps_done: done ? brand.steps_done.filter((s) => s !== id) : [...brand.steps_done, id] },
        done ? "Marked incomplete" : "Marked complete ✓",
      );
    },
    [brand, persist],
  );

  const saveDraft = useCallback(async () => {
    await persist(brand, "Draft saved ✓");
  }, [brand, persist]);

  const patch = useCallback(
    async (partial: Partial<BrandState>, note?: string) => {
      await persist({ ...brand, ...partial }, note);
    },
    [brand, persist],
  );

  const overallPct = useMemo(() => {
    const done = PROGRESS_MODULES.filter((m) => brand.steps_done.includes(`mod:${m}`)).length;
    return Math.round((done / PROGRESS_MODULES.length) * 100);
  }, [brand.steps_done]);

  const download = useCallback((filename: string, content: string, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`Downloaded ${filename}`);
  }, [notify]);

  const openUrl = useCallback((url: string) => window.open(url, "_blank", "noopener"), []);
  const goWorkflow = useCallback(
    (code: string) => { window.location.href = `/company/${companyId}/workflows/${code}`; },
    [companyId],
  );
  const openChat = useCallback((seed = "") => setChat({ open: true, seed }), []);

  const actions: W5Actions = {
    companyId, brandName, brand, core: brand.core, has, overallPct,
    complete, toggle, saveDraft, patch, finishW5, busy, health, notify, download, openUrl, goWorkflow, openChat,
  };

  let body: React.ReactNode;
  if (section === "strategy") body = <StrategyPage companyName={brandName} onBack={() => setSection(null)} onOpenSection={setSection} />;
  else if (section === "market") body = <CompetitorAnalysis onBack={() => setSection(null)} />;
  else if (section === "identity") body = <BrandIdentity onBack={() => setSection(null)} onOpenSection={setSection} />;
  else if (section === "logo") body = <LogoGenerator companyName={brandName} onBack={() => setSection("identity")} />;
  else if (section === "palette") body = <PaletteEditor onBack={() => setSection("identity")} />;
  else if (section === "typography") body = <TypographyEditor onBack={() => setSection("identity")} />;
  else if (section === "voice") body = <BrandVoiceEditor onBack={() => setSection("identity")} />;
  else if (section === "story") body = <BrandStoryEditor onBack={() => setSection("identity")} />;
  else if (section === "guidelines") body = <BrandGuidelines onBack={() => setSection("identity")} />;
  else if (section === "icons") body = <IconographyEditor onBack={() => setSection("identity")} />;
  else if (section === "assets") body = <AssetsLibrary onBack={() => setSection("identity")} />;
  else if (section === "launch") body = <LaunchAssets companyName={brandName} onBack={() => setSection(null)} />;
  else if (section === "design") body = <DesignSystem onBack={() => setSection(null)} />;
  else body = <Hub open={open} setOpen={setOpen} onOpenSection={setSection} />;

  return (
    <W5Context.Provider value={actions}>
      {body}
      {chat.open && <AiChatModal seed={chat.seed} onClose={() => setChat({ open: false, seed: "" })} />}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-[#2A2F3C] bg-[#111827] px-5 py-3 text-sm font-semibold text-white shadow-2xl" style={{ animation: "w5toast .18s ease-out" }}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[13px]" style={{ background: O }}>✓</span>
          {toast}
        </div>
      )}
      <style>{`@keyframes w5toast{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </W5Context.Provider>
  );
}

// ---- AI assistant chat modal — real brandChat calls, grounded in the Company Object ----
function AiChatModal({ seed, onClose }: { seed: string; onClose: () => void }) {
  const { companyId, brandName } = useW5();
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "cofounder", text: `Hi! I'm your brand co-founder for ${brandName}. Ask me anything about your strategy, voice, naming, or launch assets.` },
  ]);
  const [input, setInput] = useState(seed);
  const [sending, setSending] = useState(false);
  const send = async () => {
    const q = input.trim();
    if (!q || sending) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setSending(true);
    try {
      const res = await brandChat(companyId, q, []);
      setMsgs((m) => [...m, { role: "cofounder", text: res.reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "cofounder", text: "I couldn't reach the model just now — try again in a moment." }]);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 p-4 sm:items-center" onClick={onClose}>
      <div className="flex h-[520px] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#E7E9EE] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex items-center justify-between border-b border-[#EEF0F3] px-4 py-3">
          <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>✦ AI Brand Assistant</p>
          <button onClick={onClose} className="text-[#9AA3B0] hover:text-[#111827]">✕</button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <p className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${m.role === "user" ? "bg-[#4F46E5] text-white" : "bg-[#F1F3F6] text-[#3A414D]"}`}>{m.text}</p>
            </div>
          ))}
          {sending && <p className="text-xs text-[#9AA3B0]">Thinking…</p>}
        </div>
        <div className="flex gap-2 border-t border-[#EEF0F3] p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your brand…" className="flex-1 rounded-lg border border-[#E7E9EE] px-3 py-2 text-xs outline-none focus:border-[#7C3AED]" />
          <button onClick={send} disabled={sending} className="rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ background: "#7C3AED" }}>Send</button>
        </div>
      </div>
    </div>
  );
}

// Resolve real Brand Core content with graceful sample fallbacks (so an ungenerated brand still reads well).
function useBrandFacts() {
  const { core, brandName } = useW5();
  return {
    name: brandName,
    tagline: core.tagline || "We fold intelligence into reality.",
    mission: core.mission || "Build the intelligence layer that powers modern software teams.",
    vision: core.vision || "A world where every team can build intelligent, scalable products effortlessly.",
    positioning: core.positioning || "The all-in-one operating system that guides founders from idea to Series A.",
    voice: core.voice || "Confident, Clear, Intelligent, Forward-thinking",
    category: core.category || "AI Infrastructure",
    icp: core.icp || "Startup Founders · Developers · Technical Teams · Investors",
    pitch: core.pitch || "StartupKit guides founders step-by-step with AI, docs, and integrations.",
    values: core.values.length ? core.values : ["Innovative", "Premium", "Professional", "Trustworthy"],
    pillars: core.pillars,
  };
}

// ---------------- shared bits ----------------
function Ic({ path, color }: { path: string; color: string }) {
  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
      style={{ background: color }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="h-[22px] w-[22px]"
        dangerouslySetInnerHTML={{ __html: path }} />
    </span>
  );
}
function Progress({ pct, color = O }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF0F3]">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
const card = "rounded-2xl border border-[#E7E9EE] bg-white";
const btnO = "rounded-lg px-4 py-2.5 text-sm font-semibold text-white";
const btnGhost = "rounded-lg border border-[#E7E9EE] bg-white px-4 py-2.5 text-sm font-medium text-[#3A414D] hover:border-[#c9cfda]";
const label = "text-xs font-bold uppercase tracking-wide text-[#9AA3B0]";

// A real, clickable back button — every W5 sub-page used to open with a tiny gray breadcrumb
// line that read as plain text, not a control. This is the one shared "leave this page" affordance.
function BackBar({ onBack, to }: { onBack: () => void; to: string }) {
  return (
    <button
      onClick={onBack}
      className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#E7E9EE] bg-white px-3.5 py-2 text-sm font-semibold text-[#3A414D] shadow-sm transition hover:border-[#c9cfda] hover:bg-[#F7F8FA]"
    >
      <span aria-hidden className="text-base leading-none">←</span> Back to {to}
    </button>
  );
}

// ============================ HUB ============================================================
function Hub({
  open,
  setOpen,
  onOpenSection,
}: {
  open: number | null;
  setOpen: (n: number | null) => void;
  onOpenSection: (s: string) => void;
}) {
  const A = useW5();
  const { brandName } = A;
  // Overall progress is computed from persisted module completions (steps_done).
  const pct = A.overallPct;
  const [tab, setTab] = useState<"modules" | "documents" | "connections">("modules");

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-white" style={{ background: O }}>W5</span>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[#111827]">
              Brand &amp; Product Foundation <span className="text-[#9AA3B0]">ⓘ</span>
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[#6B7280]">
              Build a powerful brand and product identity that sets you apart. From strategy to assets,
              we&apos;ll help you create a complete brand system.
            </p>
          </div>
        </div>
        <div className="min-w-[220px] text-right">
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-[#6B7280]">Overall Progress</span>
            <span className="text-2xl font-extrabold" style={{ color: O }}>{pct}%</span>
          </div>
          <div className="mt-2"><Progress pct={pct} /></div>
        </div>
      </div>

      {/* tab bar */}
      <div className="mt-4 flex gap-1 border-b border-[#EEF0F3]">
        {([["modules", "Modules", "7"], ["documents", "Documents", "16"], ["connections", "Connections", "2/4"]] as const).map(([id, label, cnt]) => (
          <button key={id} onClick={() => setTab(id)} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold"
            style={tab === id ? { color: O, borderBottom: `2px solid ${O}` } : { color: "#6B7280", borderBottom: "2px solid transparent" }}>
            {label} <span className="rounded-full bg-[#F1F3F6] px-1.5 py-0.5 text-[10px] text-[#6B7280]">{cnt}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* main content by tab */}
        {tab === "documents" ? (
          <DocumentsView />
        ) : tab === "connections" ? (
          <ConnectionsView brandName={brandName} />
        ) : (
        <div className="space-y-3">
          {MODULES.map((m) => {
            // A module counts as done when its completion step is persisted (Positioning aliases
            // Strategy; Brand OS aliases the Documents tab being reviewed).
            const done = A.has(`mod:${m.id}`);
            // Progress reflects real persisted completion (empty until the module is saved complete).
            const doneCount = done ? m.steps.length : 0;
            const isOpen = open === m.n;
            return (
              <div key={m.n} className={`${card} ${isOpen ? "ring-1" : ""}`} style={isOpen ? { borderColor: O } : undefined}>
                <button className="flex w-full items-center gap-4 p-4 text-left" onClick={() => setOpen(isOpen ? null : m.n)}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: done ? "#DCFCE7" : isOpen ? O : "#F1F3F6", color: done ? GREEN : isOpen ? "#fff" : "#6B7280" }}>
                    {m.n}
                  </span>
                  <Ic path={m.icon} color={m.color} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#111827]">{m.title}</p>
                    <p className="truncate text-xs text-[#6B7280]">{m.desc}</p>
                  </div>
                  {done ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: GREEN }}>✓ Completed</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-[#6B7280]">{doneCount} / {m.steps.length} steps</span>
                      <div className="hidden w-28 sm:block"><Progress pct={(doneCount / m.steps.length) * 100} /></div>
                    </div>
                  )}
                  <span className="text-[#9AA3B0]">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && m.id === "naming" && <NamingDetail onOpenSection={onOpenSection} />}
                {isOpen && m.id !== "naming" && (
                  <div className="border-t border-[#EEF0F3] p-4">
                    <p className="text-sm text-[#3A414D]"><b style={{ color: O }}>Why:</b> {MODULE_WHY[m.id]}</p>
                    {m.id === "os" ? (
                      <button className={`${btnO} mt-3`} style={{ background: O }} onClick={() => setTab("documents")}>
                        Go to Documents &amp; Connections →
                      </button>
                    ) : m.opens ? (
                      <button className={`${btnO} mt-3`} style={{ background: O }} onClick={() => onOpenSection(m.opens!)}>
                        {`Open ${m.title} →`}
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-[#9AA3B0]">Opens when its prerequisites are met.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <p className="flex items-center gap-2 px-1 pt-1 text-xs text-[#9AA3B0]">
            ⓘ Complete each module in order. Some modules unlock when specific prerequisites are met.
          </p>
        </div>
        )}

        {/* right rail */}
        <aside className="space-y-4">
          <BrandPreview />
          <Consistency pct={A.health?.score ?? 82} />
          <RecentAssets />
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">Need Help?</p>
            <p className="mt-1 text-xs text-[#6B7280]">Access guides, templates, and expert support for this workflow.</p>
            <button onClick={() => A.openChat("How do I complete my brand foundation?")} className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#E7E9EE] px-3 py-2 text-sm font-medium" style={{ color: O }}>
              Ask the AI Co-Founder <span>→</span>
            </button>
          </div>
        </aside>
      </div>

      {/* bottom bar */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#EEF0F3] pt-5">
        <button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Draft"}</button>
        <button className={btnGhost} onClick={() => A.openUrl(brandWordmarkUrl(A.companyId))}>◉ Preview Brand Mark</button>
        <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={async () => { await A.saveDraft(); await A.finishW5(); A.goWorkflow("W6"); }}>Complete W5 &amp; Continue →</button>
      </div>
    </div>
  );
}

// ---------------- Documents tab (brand file cabinet) ----------------
const DOCS = [
  { name: "Brand Strategy Document", type: "PDF", size: "1.2 MB", ready: true, c: "#DC2626" },
  { name: "Mission & Vision Statement", type: "PDF", size: "240 KB", ready: true, c: "#DC2626" },
  { name: "Positioning Statement", type: "PDF", size: "180 KB", ready: true, c: "#DC2626" },
  { name: "Competitive Analysis", type: "PDF", size: "820 KB", ready: true, c: "#DC2626" },
  { name: "Logo Primary", type: "SVG", size: "24 KB", ready: true, c: "#2563EB" },
  { name: "Logo Variations", type: "ZIP", size: "1.8 MB", ready: true, c: "#7C3AED" },
  { name: "Color Palette", type: "ASE", size: "12 KB", ready: true, c: "#0D9488" },
  { name: "Typography Spec", type: "PDF", size: "160 KB", ready: true, c: "#DC2626" },
  { name: "Brand Guidelines", type: "PDF", size: "1.2 MB", ready: true, c: "#DC2626" },
  { name: "Brand Voice & Tone", type: "PDF", size: "210 KB", ready: true, c: "#DC2626" },
  { name: "Website Copy Pack", type: "DOC", size: "90 KB", ready: true, c: "#2563EB" },
  { name: "Pitch Deck Template", type: "PPTX", size: "3.1 MB", ready: true, c: "#D97706" },
  { name: "One-Pager", type: "PDF", size: "320 KB", ready: false, c: "#DC2626" },
  { name: "Business Cards", type: "PDF", size: "140 KB", ready: false, c: "#DC2626" },
  { name: "Social Media Kit", type: "ZIP", size: "4.2 MB", ready: false, c: "#7C3AED" },
  { name: "Brand Kit (full ZIP)", type: "ZIP", size: "9.8 MB", ready: false, c: "#F97316" },
];
function brandSummary(A: W5Actions): string {
  const c = A.brand.core;
  return [
    `${A.brandName} — Brand Core`,
    "=".repeat(40),
    `Tagline: ${c.tagline || "—"}`,
    `Category: ${c.category || "—"}`,
    `Positioning: ${c.positioning || "—"}`,
    `Mission: ${c.mission || "—"}`,
    `Vision: ${c.vision || "—"}`,
    `Voice: ${c.voice || "—"}`,
    `ICP: ${c.icp || "—"}`,
    `Values: ${(c.values || []).join(", ") || "—"}`,
    `Pillars: ${(c.pillars || []).join(", ") || "—"}`,
    `Pitch: ${c.pitch || "—"}`,
    "",
    `Generated by StartupKit · ${new Date().toLocaleDateString()}`,
  ].join("\n");
}
function DocumentsView() {
  const A = useW5();
  const dl = (d: (typeof DOCS)[number]) => {
    if (d.name === "Color Palette") {
      A.download("color-palette.json", JSON.stringify(A.brand.visual.palette.length ? A.brand.visual.palette : PALETTE, null, 2), "application/json");
    } else if (d.name === "Logo Primary") {
      A.openUrl(brandWordmarkUrl(A.companyId));
    } else {
      A.download(`${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`, `${d.name}\n\n${brandSummary(A)}`);
    }
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#111827]">Brand Documents <span className="font-normal text-[#9AA3B0]">— every asset W5 generates, in one place</span></p>
        <button className={btnO} style={{ background: O }} onClick={() => A.download(`${A.brandName.toLowerCase().replace(/\s+/g, "-")}-brand-kit.txt`, brandSummary(A))}>⤓ Download Brand Kit</button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {DOCS.map((d) => (
          <div key={d.name} className={`${card} flex items-center gap-3 p-3`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ background: d.c }}>{d.type}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#111827]">{d.name}</p>
              <p className="text-[11px] text-[#9AA3B0]">{d.type} · {d.size}</p>
            </div>
            <span className="text-[11px] font-medium" style={{ color: d.ready ? GREEN : "#9AA3B0" }}>{d.ready ? "Ready" : "Draft"}</span>
            <button onClick={() => dl(d)} className="rounded-md border border-[#E7E9EE] px-2.5 py-1 text-[11px] font-semibold text-[#3A414D] hover:border-[#c9cfda]">⤓</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Connections tab (domain + tools) ----------------
const CONNS = [
  { name: "Domain", detail: "Your brand's home + email base", status: "connected", note: "connected", ic: "🌐", c: "#2563EB" },
  { name: "Google Workspace", detail: "Business email for the team", status: "connected", note: "connected", ic: "✉️", c: "#16A34A" },
  { name: "Figma", detail: "Hand the visual system to a designer", status: "off", note: "connect", ic: "🎨", c: "#EC4899" },
  { name: "Social Handles", detail: "Claim @handle across platforms", status: "partial", note: "4 / 6 claimed", ic: "📣", c: "#7C3AED" },
];
function ConnectionsView({ brandName }: { brandName: string }) {
  const A = useW5();
  const badge = { connected: { t: "Connected", c: GREEN, b: "#EAF7EF" }, partial: { t: "Partial", c: "#D97706", b: "#FEF3C7" }, off: { t: "Not connected", c: "#6B7280", b: "#F1F3F6" } } as const;
  const [conns, setConns] = useState(CONNS.map((c) => ({ ...c })));
  const connectedCount = conns.filter((c) => c.status === "connected").length;
  const act = (name: string) => {
    setConns((prev) => prev.map((c) => c.name === name ? { ...c, status: c.status === "connected" ? "off" : "connected", note: c.status === "connected" ? "connect" : "connected" } : c));
    const cur = conns.find((c) => c.name === name);
    A.notify(cur?.status === "connected" ? `${name} disconnected` : `${name} connected ✓`);
  };
  return (
    <div>
      <p className="text-sm font-bold text-[#111827]">Connections <span className="font-normal text-[#9AA3B0]">— the tools your brand plugs into ({connectedCount} of {conns.length} connected)</span></p>
      <div className="mt-4 space-y-2">
        {conns.map((c) => {
          const bd = badge[c.status as keyof typeof badge];
          return (
            <div key={c.name} className={`${card} flex flex-wrap items-center gap-3 p-4`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: `${c.c}18` }}>{c.ic}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#111827]">{c.name}{c.name === "Domain" && <span className="ml-2 font-mono text-xs text-[#9AA3B0]">{brandName.toLowerCase().replace(/\s+/g, "")}.ai</span>}</p>
                <p className="text-xs text-[#6B7280]">{c.detail}</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: bd.b, color: bd.c }}>{bd.t}</span>
              <button onClick={() => act(c.name)} className="rounded-lg border border-[#E7E9EE] px-3 py-1.5 text-xs font-semibold text-[#3A414D] hover:border-[#c9cfda]">{c.status === "connected" ? "Disconnect" : "Connect"}</button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: "#FFF9F3", color: "#7A4A1E" }}>
        <b>Good to know —</b> StartupKit never stores your credentials. It records that a tool is connected and hands off to it.
      </div>
    </div>
  );
}

const PRESENCE_KIND: Record<string, { label: string; icon: string }> = {
  domain: { label: "Domain", icon: "🌐" },
  handle: { label: "Social Handles", icon: "𝕏" },
  trademark: { label: "Trademark", icon: "™" },
};
const PRESENCE_STATUS_COLOR: Record<string, string> = { available: GREEN, taken: "#DC2626", unknown: "#9AA3B0" };

function NamingDetail({ onOpenSection }: { onOpenSection: (s: string) => void }) {
  const A = useW5();
  const presence = A.brand.presence;
  const hasPresence = presence.length > 0;
  const locked = A.has("mod:naming");
  const [checking, setChecking] = useState(false);
  const runCheck = async () => {
    setChecking(true);
    try {
      const items = await checkNamePresence(A.brandName);
      await A.patch({ presence: items }, "Name availability checked");
    } catch {
      A.notify("Couldn't check — is the API running?");
    } finally {
      setChecking(false);
    }
  };
  return (
    <div className="border-t border-[#EEF0F3] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#111827]">Name Availability <span className="ml-1 text-xs font-normal text-[#9AA3B0]">for {A.brandName}</span></p>
          <p className="mt-1 text-xs text-[#6B7280]">A heuristic web-presence read (domain, social handles, trademark) — not a registration. StartupKit never registers anything on your behalf.</p>
        </div>
        <button onClick={runCheck} disabled={checking} className="rounded-md border border-[#E7E9EE] px-2 py-1 text-[11px] hover:border-[#c9cfda] disabled:opacity-50">{checking ? "Checking…" : hasPresence ? "↻ Run Again" : "Run Check"}</button>
      </div>

      {!hasPresence ? (
        <div className="mt-3 rounded-xl border border-dashed border-[#D7DCDA] p-6 text-center">
          <p className="text-sm text-[#6B7280]">No check has run yet — real data, not invented here.</p>
          <button onClick={runCheck} disabled={checking} className="mt-3 rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-60" style={{ background: O }}>{checking ? "Checking…" : "Run Availability Check"}</button>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#E7E9EE]">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-[#9AA3B0]">
              <th className="px-3 py-1.5 font-medium">Kind</th><th className="font-medium">Handle</th><th className="font-medium">Status</th><th className="px-3 py-1.5 font-medium">What to do</th>
            </tr></thead>
            <tbody>
              {presence.map((p) => {
                const meta = PRESENCE_KIND[p.kind] ?? { label: p.kind, icon: "•" };
                return (
                  <tr key={p.kind} className="border-t border-[#F1F3F6]">
                    <td className="px-3 py-2 font-medium text-[#111827]">{meta.icon} {meta.label}</td>
                    <td className="text-[#6B7280]">{p.handle}</td>
                    <td style={{ color: PRESENCE_STATUS_COLOR[p.status] ?? "#9AA3B0" }}>● {p.status}</td>
                    <td className="px-3 py-2 text-[#6B7280]">{p.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button className={btnGhost} onClick={() => A.openChat("Help me think through my brand name and where it might conflict.")}>✦ Ask AI</button>
        <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={async () => { await A.complete("mod:naming"); onOpenSection("strategy"); }}>{locked ? "Locked ✓" : "Lock Name & Continue →"}</button>
      </div>
    </div>
  );
}

function BrandPreview() {
  const { companyId, brandName, brand, openUrl } = useW5();
  const pal = brand.visual.palette.length ? brand.visual.palette.map((p) => p.hex) : PALETTE;
  const type = brand.visual.type_display || "Inter";
  const hasBrand = Boolean(brand.core.play_id);
  const tagline = brand.core.tagline || "Visionary tools for modern teams.";
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#111827]">Brand Preview</p>
        <button onClick={() => openUrl(brandWordmarkUrl(companyId))} className="text-xs font-medium" style={{ color: "#2563EB" }}>View Wordmark</button>
      </div>
      <div className="mt-3 flex flex-col items-center rounded-xl border border-[#EEF0F3] py-6">
        {hasBrand ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brandWordmarkUrl(companyId)} alt="wordmark" style={{ height: 40 }} />
        ) : (
          <p className="text-2xl font-extrabold text-[#111827]">{brandName}</p>
        )}
        <p className="mt-2 text-xs text-[#6B7280]">{tagline}</p>
      </div>
      <div className="mt-3 flex gap-1.5">
        {pal.slice(0, 6).map((c, i) => <span key={i} className="h-6 flex-1 rounded-md border border-[#EEF0F3]" style={{ background: c }} />)}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-[#9AA3B0]">Primary Typeface</p>
          <p className="text-sm font-semibold text-[#111827]">{type}</p>
        </div>
        <span className="text-2xl font-bold text-[#111827]">Aa</span>
      </div>
    </div>
  );
}

function Consistency({ pct }: { pct: number }) {
  const A = useW5();
  const msg = A.health?.dimensions?.length
    ? A.health.dimensions.map((d) => `${d.name}: ${d.score}/100`).join(" · ")
    : "Great job! Your brand consistency is strong. Keep building!";
  return (
    <div className={`${card} p-4`}>
      <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>Brand Consistency</p>
      <div className="mt-3 flex items-center gap-4">
        <Ring pct={pct} />
        <p className="text-xs text-[#3A414D]">{A.health?.label ? `${A.health.label} — ${msg}` : msg}</p>
      </div>
      <button onClick={() => A.openChat("How can I improve my brand consistency score?")} className="mt-3 w-full rounded-lg border border-[#E7E9EE] py-2 text-xs font-semibold" style={{ color: "#2563EB" }}>Improve Consistency →</button>
    </div>
  );
}
function Ring({ pct }: { pct: number }) {
  return (
    <div className="relative h-16 w-16 shrink-0">
      <div className="h-16 w-16 rounded-full" style={{ background: `conic-gradient(#2563EB ${pct * 3.6}deg, #E5E7EB 0)` }} />
      <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-white text-sm font-bold text-[#111827]">{pct}%</div>
    </div>
  );
}

function RecentAssets() {
  const A = useW5();
  const assets = [
    { name: "Logo Primary", meta: "SVG · 24 KB", ago: "2h ago", c: "#2563EB", url: brandWordmarkUrl(A.companyId) },
    { name: "Favicon", meta: "SVG · 4 KB", ago: "4h ago", c: "#DC2626", url: brandFaviconUrl(A.companyId) },
    { name: "Color Palette", meta: "JSON · 1 KB", ago: "6h ago", c: "#0D9488" },
    { name: "Brand Core", meta: "JSON · 3 KB", ago: "1d ago", c: "#D97706" },
  ];
  const open = (a: (typeof assets)[number]) => {
    if (a.url) A.openUrl(a.url);
    else if (a.name === "Color Palette") A.download("palette.json", JSON.stringify((A.brand.visual.palette.length ? A.brand.visual.palette : PALETTE.map((h) => ({ name: h, hex: h, role: "" }))), null, 2), "application/json");
    else A.download("brand-core.json", JSON.stringify(A.brand.core, null, 2), "application/json");
  };
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#111827]">Recent Assets</p>
        <button onClick={() => A.openUrl(brandWordmarkUrl(A.companyId))} className="text-xs font-medium" style={{ color: "#2563EB" }}>View All</button>
      </div>
      <div className="mt-3 space-y-2.5">
        {assets.map((a) => (
          <button key={a.name} onClick={() => open(a)} className="flex w-full items-center gap-3 text-left hover:opacity-80">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ background: a.c }}>▤</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#111827]">{a.name}</p>
              <p className="text-[11px] text-[#9AA3B0]">{a.meta}</p>
            </div>
            <span className="text-[11px] text-[#9AA3B0]">{a.ago}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================ BRAND STRATEGY PAGE ============================================
const STRAT_SECTIONS = [
  { n: 1, title: "Company Identity", done: true },
  { n: 2, title: "Brand Personality", done: true },
  { n: 3, title: "Target Audience", done: true },
  { n: 4, title: "Value Proposition", done: true },
  { n: 5, title: "Competitive Positioning", done: true },
  { n: 6, title: "Brand Promise", done: true },
  { n: 7, title: "Brand Story", done: false },
  { n: 8, title: "Core Values", done: false },
  { n: 9, title: "Executive Summary", done: false },
];
const STRAT_OUTPUTS = [
  "Brand Strategy Document", "Mission & Vision Statement", "Brand Story", "Value Proposition",
  "Competitive Positioning", "Elevator Pitch", "Brand Strategy Summary",
];
const HEALTH_DIMS: [string, number][] = [
  ["Identity", 100], ["Audience", 90], ["Positioning", 80], ["Differentiation", 80], ["Messaging", 75],
];

// The real entry point into W5 — nothing downstream (logo, palette, typography, voice, story)
// has anything to show until this runs once. Ranks real Brand Plays against the company's
// validated idea (match_plays on the backend), the founder picks one, generate_brand_core writes
// the whole BrandCore + VisualSystem in one call.
function BrandCoreGenerator({ onDone }: { onDone: () => void }) {
  const A = useW5();
  const [plays, setPlays] = useState<PlayMatch[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getBrandPlays(A.companyId).then(setPlays).catch(() => setLoadError(true));
  }, [A.companyId]);

  const generate = async (playId: string) => {
    setPicked(playId);
    setGenerating(true);
    try {
      const draft = await generateBrand(A.companyId, playId);
      await A.patch(draft, "Brand Core generated ✓");
      onDone();
    } catch {
      A.notify("Couldn't generate — is the API running?");
    } finally {
      setGenerating(false);
      setPicked(null);
    }
  };

  return (
    <div className={`${card} p-6`}>
      <p className="text-lg font-extrabold text-[#111827]">Choose your Brand Play</p>
      <p className="mt-1 text-sm text-[#6B7280]">
        Ranked against your validated idea from intake — not generic options. Pick one and StartupKit generates
        your mission, positioning, voice, palette, typography, and logo direction in one pass. You edit everything after.
      </p>

      {loadError && (
        <p className="mt-4 rounded-lg bg-[#FEF3C7] p-3 text-xs" style={{ color: "#92600E" }}>
          Couldn&apos;t reach the API to load plays. Confirm the backend is running and refresh.
        </p>
      )}
      {!plays && !loadError && (
        <p className="mt-4 text-sm text-[#9AA3B0]">Matching Brand Plays to your company…</p>
      )}

      {plays && (
        <div className="mt-5 space-y-3">
          {plays.map((p) => (
            <div key={p.play_id} className={`${card} p-4`} style={picked === p.play_id ? { borderColor: "#4F46E5", borderWidth: 2 } : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#111827]">{p.name}</p>
                    <span className="rounded-full bg-[#EEF0FF] px-2 py-0.5 text-[10px] font-semibold" style={{ color: "#4F46E5" }}>{p.score}% match</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6B7280]">{p.move}</p>
                  <p className="mt-1.5 text-xs italic text-[#9AA3B0]">{p.rationale}</p>
                  {p.examples.length > 0 && (
                    <p className="mt-1.5 text-[11px] text-[#9AA3B0]">e.g. {p.examples.join(", ")}</p>
                  )}
                </div>
                <button className={btnO} style={{ background: "#4F46E5" }} disabled={generating}
                  onClick={() => generate(p.play_id)}>
                  {generating && picked === p.play_id ? "Generating…" : "Generate this →"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StrategyPage({ companyName, onBack, onOpenSection }: { companyName: string; onBack: () => void; onOpenSection: (s: string) => void }) {
  const A = useW5();
  const f = useBrandFacts();
  const hasBrand = Boolean(A.brand.core.play_id);
  const setCoreField = (k: "icp" | "category" | "positioning", val: string) =>
    A.patch({ core: { ...A.brand.core, [k]: val } });
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="W5" />
      {!hasBrand && (
        <>
          <div className="mt-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111827]">Brand Strategy</h1>
            <p className="mt-1 max-w-xl text-sm text-[#6B7280]">Nothing generated yet — this is the one step everything else in W5 depends on.</p>
          </div>
          <div className="mt-6"><BrandCoreGenerator onDone={() => { /* re-renders once brand.core.play_id is set */ }} /></div>
        </>
      )}
      {hasBrand && (<>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111827]">Brand Strategy</h1>
          <p className="mt-1 max-w-xl text-sm text-[#6B7280]">Define your brand foundation. This will guide every decision, message, and asset your company creates.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => A.openChat("Help me sharpen my brand strategy.")} className="rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "#DDD6FE", background: "#F5F3FF", color: "#7C3AED" }}>✦ AI Assistant</button>
          <button className={btnGhost} onClick={() => A.download(`${companyName.toLowerCase().replace(/\s+/g, "-")}-brand-book.txt`, brandSummary(A))}>◉ Preview Brand Book</button>
          <button className={btnO} style={{ background: "#4F46E5" }} disabled={A.busy} onClick={async () => { await A.complete("mod:strategy"); onBack(); }}>{A.has("mod:strategy") ? "Completed ✓" : "Complete Phase →"}</button>
        </div>
      </div>
      <div className="mt-4"><p className="mb-1 text-xs text-[#6B7280]">8 of 9 completed</p><Progress pct={89} color="#4F46E5" /></div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[200px_1fr_300px]">
        {/* progress checklist */}
        <aside className="hidden xl:block">
          <div className={`${card} p-4`}>
            <p className="text-xs font-bold" style={{ color: "#4F46E5" }}>Brand Strategy Progress</p>
            <div className="mt-3 space-y-2.5">
              {STRAT_SECTIONS.map((s) => (
                <div key={s.n} className="flex items-center justify-between text-xs">
                  <span className="text-[#3A414D]">{s.title}</span>
                  <span style={{ color: s.done ? GREEN : "#C4CCD6" }}>{s.done ? "✓" : "○"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`${card} mt-4 p-4`}>
            <p className="text-xs font-bold" style={{ color: "#4F46E5" }}>Need expert help?</p>
            <p className="mt-1 text-[11px] text-[#6B7280]">Book a call with a startup expert and move faster.</p>
            <button onClick={() => A.openChat("I'd like expert help with my brand strategy.")} className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#E7E9EE] px-3 py-2 text-xs font-medium" style={{ color: "#4F46E5" }}>Ask AI Co-Founder <span>→</span></button>
          </div>
        </aside>

        <div className="space-y-4">
          <div className={`${card} p-5`}>
            <CardHead n={1} title="Company Identity" done />
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div><p className="text-xs text-[#9AA3B0]">Company Name</p><p className="text-sm font-medium text-[#111827]">{companyName}</p></div>
                <div><p className="text-xs text-[#9AA3B0]">Tagline</p><p className="text-sm font-medium text-[#111827]">{f.tagline}</p></div>
                <div>
                  <p className={label}>Category / Industry</p>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#E7E9EE] px-2.5 py-1.5 text-sm font-medium text-[#111827] outline-none focus:border-[#4F46E5]"
                    value={A.brand.core.category}
                    onChange={(e) => setCoreField("category", e.target.value)}
                    onBlur={A.saveDraft}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div><p className="text-xs text-[#9AA3B0]">Mission</p><p className="text-sm font-medium text-[#111827]">{f.mission}</p></div>
                <div><p className="text-xs text-[#9AA3B0]">Vision</p><p className="text-sm font-medium text-[#111827]">{f.vision}</p></div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[#9AA3B0]">Tagline, mission &amp; vision are edited in <button onClick={() => onOpenSection("story")} className="font-medium underline hover:text-[#6B7280]">Brand Story</button>.</p>
          </div>
          <div className={`${card} p-5`}>
            <CardHead n={2} title="Brand Personality" done />
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-[#9AA3B0]">Selected Traits</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {f.values.map((t) => (
                    <span key={t} className="rounded-full border border-[#E7E9EE] bg-[#F7F8FA] px-3 py-1 text-xs font-medium text-[#3A414D]">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[#9AA3B0]">Tone of Voice</p>
                <p className="text-sm font-medium text-[#111827]">{f.voice}</p>
              </div>
            </div>
          </div>
          <div className={`${card} p-5`}>
            <CardHead n={3} title="Target Audience" done />
            <p className={`${label} mt-3`}>Ideal Customer Profile</p>
            <textarea
              className="mt-1 w-full rounded-lg border border-[#E7E9EE] p-3 text-sm text-[#111827] outline-none focus:border-[#4F46E5]"
              rows={2}
              value={A.brand.core.icp}
              onChange={(e) => setCoreField("icp", e.target.value)}
              onBlur={A.saveDraft}
              placeholder="Who this is for — generated from your validated idea, editable here."
            />
          </div>
          <div className={`${card} p-5`}>
            <CardHead n={4} title="Value Proposition" done />
            <p className={`${label} mt-3`}>Positioning</p>
            <textarea
              className="mt-1 w-full rounded-lg border border-[#E7E9EE] p-3 text-sm text-[#111827] outline-none focus:border-[#4F46E5]"
              rows={3}
              value={A.brand.core.positioning}
              onChange={(e) => setCoreField("positioning", e.target.value)}
              onBlur={A.saveDraft}
            />
            {A.brand.core.pillars.length > 0 && (
              <>
                <p className={`${label} mt-3`}>Message Pillars</p>
                <ul className="mt-1 space-y-1.5 text-xs text-[#3A414D]">
                  {A.brand.core.pillars.map((p) => (
                    <li key={p} className="flex items-center gap-2"><span style={{ color: GREEN }}>✓</span>{p}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className={`${card} p-5`}>
            <CardHead n={5} title="Competitive Positioning" done />
            <table className="mt-3 w-full text-xs">
              <thead><tr className="text-left text-[#9AA3B0]"><th className="py-1.5 font-medium">Competitor</th><th className="font-medium">What They Do</th><th className="font-medium">Our Advantage</th></tr></thead>
              <tbody>
                {[["Stripe Atlas", "Company formation", "Full end-to-end journey, not just formation"], ["Clerky", "Legal documents", "AI workflows + legal + operations in one platform"], ["Carta", "Cap table & equity", "End-to-end platform with execution layer"], ["YC Startup School", "Education", "Personalized execution and automation"], ["Firstbase", "Formation & compliance", "Broader coverage: brand, HR, GTM, fundraising"]].map(([a, b, c]) => (
                  <tr key={a} className="border-t border-[#F1F3F6]"><td className="py-2 font-medium text-[#111827]">{a}</td><td className="text-[#6B7280]">{b}</td><td className="text-[#3A414D]">{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${card} p-5`}>
            <CardHead n={6} title="Brand Promise" done />
            <div className="mt-3 rounded-xl px-6 py-8 text-center text-lg font-semibold text-white" style={{ background: "linear-gradient(120deg,#4F46E5,#A855F7)" }}>
              “We help founders build the right company at the right time with confidence.”
            </div>
          </div>

          <div className={`${card} p-5`}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF0F3] text-xs font-bold text-[#6B7280]">7</span>
              <p className="text-sm font-bold text-[#111827]">Brand Story</p>
              <button onClick={() => A.openChat("Help me write my brand story.")} className={`${btnGhost} ml-auto !px-3 !py-1 text-xs`} style={{ color: "#4F46E5" }}>Start</button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {[["The Problem", "Starting a company is hard, confusing, and full of expensive mistakes."], ["Our Vision", "A world where founders have a clear path and the right tools to win."], ["Our Solution", "StartupKit guides founders step-by-step with AI, docs, and integrations."], ["The Future", "More successful startups that build the future we all live in."]].map(([t, d], i) => (
                <div key={t} className="rounded-xl border border-[#EEF0F3] p-3">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#EDE9FE", color: "#7C3AED" }}>◆</div>
                  <p className="text-xs font-bold text-[#111827]">{t}</p>
                  <p className="mt-1 text-[11px] text-[#6B7280]">{d}</p>
                  {i < 3 && <span className="hidden">→</span>}
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF0F3] text-xs font-bold text-[#6B7280]">8</span>
              <div><p className="text-sm font-bold text-[#111827]">Core Values</p><p className="text-xs text-[#6B7280]">Define the principles that guide your company culture and decisions.</p></div>
              <button onClick={() => A.openChat("Help me define my company core values.")} className={`${btnGhost} ml-auto !px-3 !py-1 text-xs`} style={{ color: "#4F46E5" }}>Start</button>
            </div>
          </div>

          <div className={`${card} p-5`}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF0F3] text-xs font-bold text-[#6B7280]">9</span>
              <div><p className="text-sm font-bold text-[#111827]">Executive Summary</p><p className="text-xs text-[#6B7280]">Auto-generate your brand strategy summary and download your Brand Strategy Document.</p></div>
              <button onClick={() => A.download(`${companyName.toLowerCase().replace(/\s+/g, "-")}-brand-strategy.txt`, brandSummary(A))} className={`${btnGhost} ml-auto !px-3 !py-1 text-xs`} style={{ color: "#4F46E5" }}>Generate</button>
            </div>
          </div>
        </div>

        {/* right rail */}
        <aside className="space-y-4">
          <div className={`${card} p-5`}>
            <p className="text-sm font-bold text-[#111827]">Brand Health Score</p>
            <div className="my-3 flex justify-center"><Ring pct={A.health?.score ?? 84} /></div>
            <p className="text-center text-sm font-semibold" style={{ color: GREEN }}>{A.health?.label ?? "Strong Foundation"}</p>
            <p className="mt-1 text-center text-xs text-[#6B7280]">You&apos;re building a strong brand strategy. Complete the remaining sections to make it exceptional.</p>
            <div className="mt-4 space-y-2">
              {(A.health?.dimensions?.length ? A.health.dimensions.map((d) => [d.name, d.score] as [string, number]) : HEALTH_DIMS).map(([n, v]) => (
                <div key={n}>
                  <div className="flex justify-between text-xs"><span className="text-[#3A414D]">{n}</span><span className="text-[#9AA3B0]">{v}/100</span></div>
                  <div className="mt-1"><Progress pct={v} color={GREEN} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#111827]">Brand Snapshot</p>
              <button onClick={() => A.openChat("Help me refine my brand snapshot.")} className="text-xs font-medium" style={{ color: "#4F46E5" }}>Edit</button>
            </div>
            <div className="mt-3 space-y-2.5">
              {([["Name", companyName], ["Tagline", f.tagline], ["Industry", f.category], ["Primary Audience", f.icp]] as [string, string][]).map(([k, v]) => (
                <div key={k}><p className="text-[11px] text-[#9AA3B0]">{k}</p><p className="text-sm font-medium text-[#111827]">{v}</p></div>
              ))}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <p className="text-sm font-bold text-[#111827]">Outputs (Auto-Generated)</p>
            <div className="mt-3 space-y-2">
              {STRAT_OUTPUTS.map((o) => (
                <div key={o} className="flex items-center gap-2 text-xs">
                  <span style={{ color: "#DC2626" }}>▤</span><span className="text-[#3A414D]">{o}</span>
                </div>
              ))}
            </div>
            <button onClick={() => A.download(`${companyName.toLowerCase().replace(/\s+/g, "-")}-brand-outputs.txt`, brandSummary(A))} className="mt-3 w-full rounded-lg border border-[#E7E9EE] py-2 text-xs font-semibold" style={{ color: "#4F46E5" }}>Download All</button>
          </div>
        </aside>
      </div>
      </>)}
    </div>
  );
}

// ============================ LAUNCH ASSETS (Phase 4) =======================================
function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function onePagerText(A: W5Actions): string {
  const c = A.brand.core;
  return [
    A.brandName,
    c.tagline || "Add a tagline in Brand Strategy",
    "=".repeat(40),
    "",
    "POSITIONING",
    c.positioning || "Not generated yet — run Brand Strategy first.",
    "",
    "WHO IT'S FOR",
    c.icp || "—",
    "",
    "THE PITCH",
    c.pitch || "—",
    "",
    `CATEGORY: ${c.category || "—"}`,
    "",
    `Generated by StartupKit · ${new Date().toLocaleDateString()}`,
  ].join("\n");
}

function mediaKitText(A: W5Actions): string {
  const c = A.brand.core;
  return [
    `${A.brandName} — Press Kit`,
    "=".repeat(40),
    "",
    "ABOUT",
    c.mission || "Not generated yet — run Brand Strategy first.",
    "",
    "WHAT WE DO",
    c.pitch || "—",
    "",
    `CATEGORY: ${c.category || "—"}`,
    `TAGLINE: ${c.tagline || "—"}`,
    "",
    `Generated by StartupKit · ${new Date().toLocaleDateString()}`,
  ].join("\n");
}

function pitchOutline(A: W5Actions): { title: string; body: string }[] {
  const c = A.brand.core;
  return [
    { title: "1 · Company", body: `${A.brandName} — ${c.tagline || "add your tagline in Brand Strategy"}` },
    { title: "2 · Problem & Positioning", body: c.positioning || "Not generated yet — run Brand Strategy first." },
    { title: "3 · Who it's for", body: c.icp || "Not generated yet." },
    { title: "4 · The pitch", body: c.pitch || "Not generated yet." },
    { title: "5 · Mission", body: c.mission || "Not generated yet." },
    { title: "6 · Traction & Ask", body: "We don't invent numbers here — add your real revenue, users, and ask amount before you send this." },
  ];
}

function investorText(A: W5Actions): string {
  const c = A.brand.core;
  return [
    `${A.brandName} — Investor Snapshot`,
    "=".repeat(40),
    "",
    "POSITIONING", c.positioning || "Not generated yet.",
    "",
    "WHO IT'S FOR", c.icp || "—",
    "",
    "THE PITCH", c.pitch || "—",
    "",
    "TRACTION", "Not connected — connect accounting in W3 to pull real revenue and growth numbers. We never invent these.",
    "",
    `Generated by StartupKit · ${new Date().toLocaleDateString()}`,
  ].join("\n");
}

function businessCardSvg(A: W5Actions, person?: string, role?: string): string {
  const accent = A.brand.visual.palette[0]?.hex || O;
  const name = escapeXml(A.brandName);
  const tagline = escapeXml(A.brand.core.tagline || "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="190" viewBox="0 0 340 190">
    <rect width="340" height="190" fill="#ffffff" stroke="#E7E9EE"/>
    <rect x="24" y="24" width="40" height="6" rx="3" fill="${accent}"/>
    <text x="24" y="100" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="#111827">${name}</text>
    <text x="24" y="122" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">${tagline}</text>
    <text x="24" y="166" font-family="Arial, sans-serif" font-size="11" fill="#9AA3B0">${escapeXml(person || "[Your Name]")} · ${escapeXml(role || "[Title]")}</text>
  </svg>`;
}

function socialPostSvg(A: W5Actions, line?: string): string {
  const accent = A.brand.visual.palette[0]?.hex || O;
  const name = escapeXml(A.brandName);
  const tagline = escapeXml(line || A.brand.core.tagline || "Add a tagline in Brand Strategy");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <rect width="320" height="320" fill="${accent}"/>
    <text x="160" y="150" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#ffffff" text-anchor="middle">${name}</text>
    <text x="160" y="180" font-family="Arial, sans-serif" font-size="13" fill="#ffffff" opacity="0.85" text-anchor="middle">${tagline}</text>
  </svg>`;
}

function emailSignatureText(A: W5Actions, person?: string, role?: string): string {
  const c = A.brand.core;
  return [person || "[Your Name]", `${role || "[Your Title]"}, ${A.brandName}`, c.tagline || ""].join("\n");
}

function EditableTextBlock({ text, onSave, hasOverride, onReset }: { text: string; onSave: (v: string) => void; hasOverride: boolean; onReset: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  if (editing) {
    return (
      <div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-56 w-full rounded-lg border border-[#E7E9EE] p-3 text-xs leading-relaxed text-[#3A414D] outline-none focus:border-[#4F46E5]"
        />
        <div className="mt-2 flex justify-end gap-2">
          <button onClick={() => { setDraft(text); setEditing(false); }} className="rounded-lg border border-[#E7E9EE] px-3 py-1.5 text-xs font-semibold text-[#6B7280] hover:border-[#c9cfda]">Cancel</button>
          <button onClick={() => { onSave(draft); setEditing(false); }} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: O }}>Save</button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <pre className="whitespace-pre-wrap rounded-lg bg-[#F7F8FA] p-3 text-xs leading-relaxed text-[#3A414D]">{text}</pre>
      <div className="mt-2 flex items-center justify-end gap-3">
        {hasOverride && <button onClick={onReset} className="text-[11px] font-medium text-[#9AA3B0] hover:text-[#6B7280]">Reset to generated</button>}
        <button onClick={() => { setDraft(text); setEditing(true); }} className="text-[11px] font-semibold" style={{ color: "#4F46E5" }}>✎ Edit</button>
      </div>
    </div>
  );
}

function AssetPreviewModal({ title, A, onClose }: { title: string; A: W5Actions; onClose: () => void }) {
  const c = A.brand.core;
  const hasBrand = Boolean(c.play_id);
  const edits = A.brand.asset_edits;
  const downloadName = `${A.brandName.toLowerCase().replace(/\s+/g, "-")}-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const setEdit = (key: string, value: string) => A.patch({ asset_edits: { ...A.brand.asset_edits, [key]: value } });
  const clearEdit = (key: string) => { const next = { ...edits }; delete next[key]; A.patch({ asset_edits: next }); };
  // Local state for the short input fields so typing is instant — saved to the server on blur,
  // not on every keystroke (EditableTextBlock's longer bodies save on an explicit Save click).
  const [cardName, setCardName] = useState(edits["Business Cards.name"] || "");
  const [cardRole, setCardRole] = useState(edits["Business Cards.title"] || "");
  const [socialLine, setSocialLine] = useState(edits["Social Media Kit.text"] || "");
  const [sigName, setSigName] = useState(edits["Email Signature.name"] || "");
  const [sigRole, setSigRole] = useState(edits["Email Signature.title"] || "");

  let body: React.ReactNode;
  let downloadFn: (() => void) | null = null;

  if (title === "Pitch Deck") {
    const generated = pitchOutline(A).map((s) => `${s.title}\n${s.body}`).join("\n\n");
    const text = edits[title] ?? generated;
    body = <EditableTextBlock text={text} hasOverride={title in edits} onSave={(v) => setEdit(title, v)} onReset={() => clearEdit(title)} />;
    downloadFn = () => A.download(`${downloadName}.txt`, text);
  } else if (title === "One Pager" || title === "Media Kit" || title === "Investor Assets") {
    const generated = title === "One Pager" ? onePagerText(A) : title === "Media Kit" ? mediaKitText(A) : investorText(A);
    const text = edits[title] ?? generated;
    body = <EditableTextBlock text={text} hasOverride={title in edits} onSave={(v) => setEdit(title, v)} onReset={() => clearEdit(title)} />;
    downloadFn = () => A.download(`${downloadName}.txt`, text);
  } else if (title === "Business Cards") {
    const svg = businessCardSvg(A, cardName, cardRole);
    body = (
      <div className="flex flex-col items-center gap-3">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="grid w-full max-w-[340px] grid-cols-2 gap-2">
          <input value={cardName} onChange={(e) => setCardName(e.target.value)} onBlur={() => setEdit("Business Cards.name", cardName)} placeholder="Your Name" className="rounded-lg border border-[#E7E9EE] px-2.5 py-1.5 text-xs outline-none focus:border-[#4F46E5]" />
          <input value={cardRole} onChange={(e) => setCardRole(e.target.value)} onBlur={() => setEdit("Business Cards.title", cardRole)} placeholder="Title" className="rounded-lg border border-[#E7E9EE] px-2.5 py-1.5 text-xs outline-none focus:border-[#4F46E5]" />
        </div>
        <p className="text-[11px] text-[#9AA3B0]">Type your name &amp; title above — they&apos;re saved and baked into the card.</p>
      </div>
    );
    downloadFn = () => A.download(`${downloadName}.svg`, svg, "image/svg+xml");
  } else if (title === "Social Media Kit") {
    const svg = socialPostSvg(A, socialLine);
    body = (
      <div className="flex flex-col items-center gap-3">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <input
          value={socialLine}
          onChange={(e) => setSocialLine(e.target.value)}
          onBlur={() => setEdit("Social Media Kit.text", socialLine)}
          placeholder={c.tagline || "Headline for this post"}
          className="w-full max-w-[320px] rounded-lg border border-[#E7E9EE] px-2.5 py-1.5 text-xs outline-none focus:border-[#4F46E5]"
        />
        <p className="text-[11px] text-[#9AA3B0]">One square template — resize per platform before posting.</p>
      </div>
    );
    downloadFn = () => A.download(`${downloadName}.svg`, svg, "image/svg+xml");
  } else if (title === "Email Signature") {
    const text = emailSignatureText(A, sigName, sigRole);
    body = (
      <div>
        <div className="rounded-lg border border-[#EEF0F3] p-4 text-xs" style={{ borderLeft: `3px solid ${A.brand.visual.palette[0]?.hex || O}` }}>
          <p className="font-bold text-[#111827]">{sigName || "[Your Name]"}</p>
          <p className="text-[#6B7280]">{sigRole || "[Your Title]"}, {A.brandName}</p>
          {c.tagline && <p className="mt-1 text-[#9AA3B0]">{c.tagline}</p>}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={sigName} onChange={(e) => setSigName(e.target.value)} onBlur={() => setEdit("Email Signature.name", sigName)} placeholder="Your Name" className="rounded-lg border border-[#E7E9EE] px-2.5 py-1.5 text-xs outline-none focus:border-[#4F46E5]" />
          <input value={sigRole} onChange={(e) => setSigRole(e.target.value)} onBlur={() => setEdit("Email Signature.title", sigRole)} placeholder="Your Title" className="rounded-lg border border-[#E7E9EE] px-2.5 py-1.5 text-xs outline-none focus:border-[#4F46E5]" />
        </div>
      </div>
    );
    downloadFn = () => A.download(`${downloadName}.txt`, text);
  } else {
    body = (
      <div className="rounded-xl border border-dashed border-[#D7DCDA] p-6 text-center text-xs text-[#6B7280]">
        There&apos;s no product-screenshot or mockup-generation engine yet — this card is a placeholder. Add your own screens to the Assets Library once you have a product to show.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E7E9EE] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex items-center justify-between border-b border-[#EEF0F3] px-5 py-3.5">
          <p className="text-sm font-bold text-[#111827]">{title}</p>
          <button onClick={onClose} className="text-[#9AA3B0] hover:text-[#111827]">✕</button>
        </div>
        <div className="p-5">
          {!hasBrand && <p className="mb-3 rounded-lg bg-[#FFF9F3] px-3 py-2 text-[11px] text-[#7A4A1E]">Generate your Brand Core in Brand Strategy first — this preview fills in for real as soon as you do.</p>}
          {body}
        </div>
        {downloadFn && (
          <div className="flex justify-end gap-2 border-t border-[#EEF0F3] px-5 py-3">
            <button onClick={downloadFn} className="rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ background: O }}>⤓ Download</button>
          </div>
        )}
      </div>
    </div>
  );
}

const ASSETS = [
  { n: 1, title: "Pitch Deck", desc: "6-slide outline from your Brand Core — problem, positioning, pitch, ask" },
  { n: 2, title: "One Pager", desc: "Positioning, ICP, and pitch as a single-page summary" },
  { n: 3, title: "Business Cards", desc: "A real card template in your brand color — add name & title" },
  { n: 4, title: "Email Signature", desc: "Plain-text signature block with your tagline" },
  { n: 5, title: "Investor Assets", desc: "Positioning + pitch, with an honest note on traction" },
  { n: 6, title: "Product Mockups", desc: "Not built yet — no screenshot engine exists" },
  { n: 7, title: "Social Media Kit", desc: "One square post template in your brand color" },
  { n: 8, title: "Media Kit", desc: "Press-ready company overview" },
];
// Brand Book / Brand Kit ZIP deliberately excluded — already covered by Brand Identity's
// Brand Guidelines and Brand Assets Library modules; keeping one destination per asset type.

function LaunchAssets({ companyName, onBack }: { companyName: string; onBack: () => void }) {
  const A = useW5();
  const [preview, setPreview] = useState<string | null>(null);
  const hasBrand = Boolean(A.brand.core.play_id);
  const accent = A.brand.visual.palette[0]?.hex || O;
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="W5" />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: O }}>🎁</span>
          <div><h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">Phase 3 – Marketing Assets</h1><p className="text-sm text-[#6B7280]">Everything below is generated live from your Brand Core — preview, edit the placeholders, download.</p></div>
        </div>
        <div className="flex gap-2"><button className={btnGhost} onClick={() => A.notify("Launch guide opened")}>▤ Guide</button><button className={btnGhost} onClick={() => A.download(`${companyName.toLowerCase().replace(/\s+/g, "-")}-media-kit.txt`, brandSummary(A))}>▤ Resources</button><button onClick={() => A.openChat("Generate all my launch assets — deck, one-pager, social kit.")} className="rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: O, color: O }}>✦ Ask AI to tailor these →</button></div>
      </div>

      <div className="mt-5"><PhaseBar active={3} /></div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_300px]">
        <div>
          {!hasBrand && (
            <div className="flex items-center justify-between rounded-xl border border-[#FDE7D2] bg-[#FFF9F3] p-3 text-xs">
              <span style={{ color: "#7A4A1E" }}>⚠ No Brand Core yet — previews below will show placeholders until you generate one in <b>Brand Strategy</b>.</span>
              <button onClick={() => A.openChat("How does the marketing assets step work?")} className="rounded-md border border-[#F0D6BC] px-2 py-1" style={{ color: "#7A4A1E" }}>ⓘ How this works</button>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ASSETS.map((a) => (
              <div key={a.n} className={`${card} overflow-hidden p-0 transition hover:border-[#D7DCDA]`}>
                <button
                  onClick={() => setPreview(a.title)}
                  className="flex h-24 w-full items-center justify-center text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}AA)` }}
                >
                  {companyName}
                </button>
                <div className="p-3">
                  <p className="text-xs font-bold text-[#111827]">{a.title}</p>
                  <p className="mt-1 text-[10px] text-[#9AA3B0]">{a.desc}</p>
                  <p className="mt-2 text-[11px] font-medium" style={{ color: Object.keys(A.brand.asset_edits).some((k) => k === a.title || k.startsWith(`${a.title}.`)) ? "#4F46E5" : hasBrand ? GREEN : "#9AA3B0" }}>
                    {Object.keys(A.brand.asset_edits).some((k) => k === a.title || k.startsWith(`${a.title}.`)) ? "✎ Edited by you" : hasBrand ? "● Live from your Brand Core" : "○ Placeholder — generate Brand Core"}
                  </p>
                  <button onClick={() => setPreview(a.title)} className="mt-2 w-full rounded-lg border border-[#E7E9EE] py-1.5 text-[11px] font-semibold text-[#3A414D] hover:border-[#c9cfda]">Preview</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EEF0F3] bg-[#F7F8FA] p-3">
            <span className="text-xs text-[#3A414D]">🎁 Download everything as one text bundle, or open each card above to preview and download it individually.</span>
            <button className={btnO} style={{ background: O }} onClick={() => A.download(`${companyName.toLowerCase().replace(/\s+/g, "-")}-marketing-kit.txt`, brandSummary(A))}>Download Brand Summary ↓</button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Previous: Brand Identity</button>
            <div className="flex gap-2"><button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Draft"}</button><button className={btnO} style={{ background: O }} disabled={A.busy} onClick={async () => { await A.complete("mod:marketing", { silent: true }); await A.finishW5(); onBack(); }}>Complete W5 &amp; Continue →</button></div>
          </div>
        </div>

        {/* right rail */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E7E9EE] bg-[#F7F5FF] p-4">
            <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>Overall W5 Progress</p>
            <div className="mt-2 flex items-center justify-between text-xs"><span className="text-[#6B7280]">Across all phases</span><span className="font-semibold" style={{ color: O }}>{A.overallPct}%</span></div>
            <div className="mt-1"><Progress pct={A.overallPct} /></div>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">What&apos;s real here</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">Tagline, positioning, ICP, and pitch come straight from your Brand Core. Personal fields like <span className="font-medium text-[#3A414D]">[Your Name]</span> and traction numbers are left for you to fill in — we don&apos;t invent those.</p>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">Coming Next</p>
            <div className="mt-2 rounded-lg bg-[#F7F8FA] p-3"><p className="text-xs font-semibold text-[#111827]">W6 · People &amp; HR</p><p className="text-[11px] text-[#6B7280]">Build your team and company culture.</p><button onClick={() => A.goWorkflow("W6")} className="mt-2 rounded-md border border-[#E7E9EE] bg-white px-2 py-1 text-[10px] font-semibold hover:border-[#c9cfda]" style={{ color: "#4F46E5" }}>Preview</button></div>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">Need Help?</p>
            <p className="mt-1 text-xs text-[#6B7280]">Book a call with our founder success team.</p>
            <button onClick={() => A.openChat("I'd like help finishing my launch assets.")} className="mt-2 text-xs font-medium" style={{ color: "#4F46E5" }}>Ask AI Co-Founder →</button>
          </div>
        </aside>
      </div>

      {preview && <AssetPreviewModal title={preview} A={A} onClose={() => setPreview(null)} />}
    </div>
  );
}

// ============================ shared: simple section shell + card grid =======================
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-[#111827]">{children}</h3>
);
function SectionShell({ badge, title, desc, banner, onBack, children }: { badge: string; title: string; desc: string; banner?: React.ReactNode; onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="W5" />
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: O }}>W5</span>
        <div><h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">{title}</h1><p className="text-sm text-[#6B7280]">{desc}</p></div>
      </div>
      {banner && <div className="mt-4">{banner}</div>}
      <div className="mt-5">{children}</div>
    </div>
  );
}
// ---- Design System (module 7) — live tokens + component preview ----
// Grounded in design-system practice (Material/Polaris): tokens → foundations → components.
const DS_TOKENS: [string, string, string][] = [
  ["Primary", "--color-primary", "#4F46E5"], ["Ink", "--color-ink", "#111827"], ["Paper", "--color-paper", "#F7F8FA"],
  ["Success", "--color-success", "#16A34A"], ["Warning", "--color-warning", "#D97706"], ["Danger", "--color-danger", "#DC2626"], ["Muted", "--color-muted", "#9AA3B0"],
];
const DS_TYPE: [string, string, number, number][] = [
  ["Display", "Aa — Nexora", 34, 800], ["Heading", "Aa — Nexora", 24, 800], ["Title", "Aa — Nexora", 18, 700], ["Body", "The quick brown fox", 15, 400], ["Small", "The quick brown fox", 13, 400], ["Caption", "THE QUICK BROWN FOX", 11, 600],
];
function DesignSystem({ onBack }: { onBack: () => void }) {
  const A = useW5();
  const tokensJson = () => JSON.stringify({
    colors: Object.fromEntries(DS_TOKENS.map(([, tok, hex]) => [tok, hex])),
    type: DS_TYPE.map(([label, , size, weight]) => ({ label, size, weight })),
    spacing: [4, 8, 12, 16, 24, 32, 48],
    radius: [6, 10, 14, 999],
  }, null, 2);
  return (
    <SectionShell badge="Design System" title="Design System" desc="Tokens, type, and components — the reusable UI foundation, generated from your Brand Identity — plus your generated website below." onBack={onBack}
      banner={<div className="rounded-xl border border-[#FDE7D2] bg-[#FFF9F3] p-3 text-xs text-[#7A4A1E]"><b>⚠ Tokens are advanced / optional.</b> Overlaps <b>W4 · Technical Infrastructure</b>; most pre-seed teams can skip the raw color/type/spacing tokens until they have a product team. The website section below isn&apos;t optional — that&apos;s your live site.</div>}>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className={`${card} p-5`}>
          <H3>Color tokens <span className="font-normal text-[#9AA3B0]">— from your palette</span></H3>
          <div className="mt-3 space-y-2">
            {DS_TOKENS.map(([name, tok, hex]) => (
              <div key={tok} className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg border border-[#EEF0F3]" style={{ background: hex }} />
                <span className="w-20 text-xs font-semibold text-[#111827]">{name}</span>
                <span className="flex-1 font-mono text-[11px] text-[#6B7280]">{tok}</span>
                <span className="font-mono text-[11px] text-[#9AA3B0]">{hex}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`${card} p-5`}>
          <H3>Type scale</H3>
          <div className="mt-3 space-y-2.5">
            {DS_TYPE.map(([label, sample, size, weight]) => (
              <div key={label} className="flex items-baseline gap-3 border-b border-[#F1F3F6] pb-2">
                <span className="w-16 font-mono text-[10px] uppercase text-[#9AA3B0]">{label}</span>
                <span className="flex-1 truncate text-[#111827]" style={{ fontSize: Math.min(size, 22), fontWeight: weight }}>{sample}</span>
                <span className="font-mono text-[10px] text-[#9AA3B0]">{size}/{weight}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`${card} p-5`}>
          <H3>Spacing &amp; radius</H3>
          <p className="mb-2 mt-1 text-[11px] text-[#9AA3B0]">4-point spacing scale</p>
          <div className="flex items-end gap-2">
            {[4, 8, 12, 16, 24, 32, 48].map((s) => (
              <div key={s} className="text-center"><div className="rounded" style={{ width: 14, height: s, background: "#C7D2FE" }} /><span className="mt-1 block font-mono text-[9px] text-[#9AA3B0]">{s}</span></div>
            ))}
          </div>
          <p className="mb-2 mt-4 text-[11px] text-[#9AA3B0]">Radius</p>
          <div className="flex gap-3">
            {[6, 10, 14, 999].map((r) => (
              <div key={r} className="text-center"><div className="h-10 w-10 border-2 border-[#4F46E5]" style={{ borderRadius: r }} /><span className="mt-1 block font-mono text-[9px] text-[#9AA3B0]">{r === 999 ? "full" : r}</span></div>
            ))}
          </div>
        </div>
        <div className={`${card} p-5`}>
          <H3>Components</H3>
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => A.notify("Primary button · --color-primary")} className="rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ background: "#4F46E5" }}>Primary</button>
              <button onClick={() => A.notify("Secondary button · outline token")} className="rounded-lg border border-[#E7E9EE] px-3 py-2 text-xs font-semibold text-[#3A414D] hover:border-[#c9cfda]">Secondary</button>
              <button onClick={() => A.notify("Danger button · --color-danger")} className="rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ background: "#DC2626" }}>Danger</button>
            </div>
            <input className="w-full rounded-lg border border-[#E7E9EE] px-3 py-2 text-xs" placeholder="Input field (sample)" />
            <div className="flex flex-wrap gap-2">
              {[["Success", "#EAF7EF", "#1E7A3D"], ["Warning", "#FEF3C7", "#92600E"], ["Danger", "#FBECEC", "#B23A2E"], ["Neutral", "#F1F3F6", "#6B7280"]].map(([l, b, c]) => (
                <span key={l} className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: b, color: c }}>{l}</span>
              ))}
            </div>
            <div className="rounded-xl border border-[#E7E9EE] p-3"><p className="text-xs font-bold text-[#111827]">Card</p><p className="text-[11px] text-[#6B7280]">Container with border, radius, and padding tokens.</p></div>
          </div>
        </div>
      </div>

      {/* the whole system applied to a real site — digital presence lives here now, not as a separate phase */}
      <div className={`${card} mt-4 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <H3>Your website <span className="font-normal text-[#9AA3B0]">— tokens, type &amp; logo applied to a live layout</span></H3>
          <div className="flex gap-2">
            <button onClick={() => A.openUrl(publishedSiteUrl(A.companyId))} className={btnGhost}>◉ Open live site ↗</button>
            <button onClick={() => A.notify(A.brand.site_template ? "Publishing your website…" : "Generate a site template first — this preview is a style reference, not a live page yet")} className={btnO} style={{ background: O }}>🚀 Publish</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">{A.brand.site_template ? `Live template: ${A.brand.site_template}. Open live site to see the real generated page.` : "No site template generated yet — the layout below shows your tokens applied to a generic SaaS page as a style reference, not your actual site."}</p>
        <div className="mt-3"><SitePreview companyName={A.brandName} dark={false} /></div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[#EEF0F3] pt-5">
        <button onClick={() => A.download("design-tokens.json", tokensJson(), "application/json")} className={btnGhost}>⤓ Download Tokens (JSON)</button>
        <button onClick={() => A.openChat("Help me extend my design system.")} className={btnGhost}>✦ Ask AI</button>
        <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={async () => { await A.complete("mod:design"); onBack(); }}>{A.has("mod:design") ? "Completed ✓" : "Save & Mark Complete"}</button>
      </div>
    </SectionShell>
  );
}

// ============================ SITE PREVIEW (used inside Design System) ======================
// AI-generated website preview — nav, bold hero with orange CTA, a Revenue Overview dashboard
// card, a trusted-by row, and a Powerful Features section. Illustrative style reference, not
// live traffic/revenue data — see the honest note rendered above it in DesignSystem.
const SITE_STATS: [string, string, string][] = [
  ["Users", "24,329", "+18.2%"],
  ["Conversions", "3.62%", "+12.7%"],
  ["Avg. Revenue", "$128.45", "+15.3%"],
];
const SITE_LOGOS = ["◒ Cloudix", "▨ LayerOps", "◎ Statuply", "△ DataPeak", "▦ Nexora"];
const SITE_FEATURES: [string, string, string][] = [
  ["⚡", "Fast by default", "Ship in minutes with sensible presets."],
  ["🔒", "Secure & compliant", "Enterprise-grade from day one."],
  ["📊", "Insights built in", "Decisions backed by live data."],
];
function SitePreview({ companyName, dark = false }: { companyName: string; dark?: boolean }) {
  const f = useBrandFacts();
  const { brand } = useW5();
  const accent = brand.visual.palette[0]?.hex || O;
  const ink = dark ? "#F3F4F6" : "#111827";
  const sub = dark ? "#9AA3B0" : "#6B7280";
  const line = dark ? "#1C2230" : "#EEF0F3";
  const panel = dark ? "#151A24" : "#FFFFFF";
  const words = f.tagline.replace(/\.$/, "").split(" ");
  const lastWord = words.length > 1 ? words.pop() : "";
  return (
    <div className="overflow-hidden rounded-xl text-left" style={{ background: dark ? "#0E1117" : "#fff", border: "1px solid #E7E9EE" }}>
      {/* nav */}
      <div className="flex items-center justify-between border-b px-6 py-3.5" style={{ borderColor: line, color: ink }}>
        <span className="flex items-center gap-1.5 text-sm font-bold"><span className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-white" style={{ background: accent }}>{companyName[0]}</span>{companyName}</span>
        <div className="hidden items-center gap-5 text-[11px] sm:flex" style={{ color: sub }}><span>Features</span><span>Solutions</span><span>Pricing</span><span>About Us</span><span>Blog</span></div>
        <span className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-white" style={{ background: ink }}>Get Started</span>
      </div>
      {/* hero */}
      <div className="grid gap-6 px-8 py-9 md:grid-cols-2">
        <div>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: `${accent}15`, color: accent }}>{f.category}</span>
          <p className="mt-3 text-[28px] font-extrabold leading-[1.12]" style={{ color: ink }}>
            {words.join(" ")} {lastWord && <span style={{ color: accent }}>{lastWord}</span>}
          </p>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: sub }}>{f.positioning}</p>
          <div className="mt-5 flex gap-2">
            <span className="rounded-lg px-3.5 py-2 text-[11px] font-semibold text-white" style={{ background: O }}>Start Free Trial</span>
            <span className="rounded-lg border px-3.5 py-2 text-[11px] font-semibold" style={{ borderColor: dark ? "#2A2F3C" : "#E7E9EE", color: ink }}>Book a Demo</span>
          </div>
        </div>
        {/* revenue dashboard card */}
        <div className="rounded-xl border p-4 shadow-sm" style={{ background: panel, borderColor: line }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold" style={{ color: ink }}>Revenue Overview</p>
            <span className="rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: line, color: sub }}>This Month ▾</span>
          </div>
          <p className="mt-1 flex items-baseline gap-1.5"><span className="text-xl font-extrabold" style={{ color: ink }}>$247,892</span><span className="text-[10px] font-semibold" style={{ color: GREEN }}>+24.5%</span></p>
          <svg viewBox="0 0 220 70" className="mt-1 w-full">
            <polyline points="0,58 30,50 55,54 85,38 110,44 140,30 170,24 200,14 220,8" fill="none" stroke={accent} strokeWidth="2" />
            <polygon points="0,58 30,50 55,54 85,38 110,44 140,30 170,24 200,14 220,8 220,70 0,70" fill={accent} opacity="0.08" />
          </svg>
          <div className="mt-1 flex justify-between text-[7px]" style={{ color: sub }}>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => <span key={m}>{m}</span>)}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {SITE_STATS.map(([l, v, d]) => (
              <div key={l} className="rounded-lg border p-2" style={{ borderColor: line }}>
                <p className="text-[8px]" style={{ color: sub }}>{l}</p>
                <p className="text-[11px] font-bold" style={{ color: ink }}>{v}</p>
                <p className="text-[8px] font-semibold" style={{ color: GREEN }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* trusted by */}
      <div className="border-t px-6 py-4 text-center" style={{ borderColor: line }}>
        <p className="text-[10px]" style={{ color: sub }}>Trusted by fast-growing companies</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-[11px] font-semibold" style={{ color: dark ? "#6B7280" : "#9AA3B0" }}>
          {SITE_LOGOS.map((l) => <span key={l}>{l}</span>)}
        </div>
      </div>
      {/* powerful features */}
      <div className="border-t px-6 py-6" style={{ borderColor: line, background: dark ? "#0B0E13" : "#FAFBFC" }}>
        <p className="text-center text-base font-extrabold" style={{ color: ink }}>Powerful Features</p>
        <p className="mt-1 text-center text-[11px]" style={{ color: sub }}>Everything you need to build a {f.category.toLowerCase()}.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {SITE_FEATURES.map(([ic, t, d]) => (
            <div key={t} className="rounded-xl border p-3" style={{ borderColor: line, background: panel }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm" style={{ background: `${accent}15` }}>{ic}</span>
              <p className="mt-2 text-xs font-bold" style={{ color: ink }}>{t}</p>
              <p className="mt-0.5 text-[10px]" style={{ color: sub }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================ LOGO GENERATOR ================================================
// Was showing 6 hardcoded generic shapes ("AI Generated") plus fake "Brand Inputs" from
// useBrandFacts' silent placeholder fallback — for every company, whether or not anything was
// actually generated. There is no multi-concept logo generator on the backend: there's one
// deterministic wordmark + favicon, rendered live from the real VisualSystem. This now shows
// exactly that, gated the same honest way as Palette/Typography/Voice/Story.
function LogoGenerator({ companyName, onBack }: { companyName: string; onBack: () => void }) {
  const A = useW5();
  const v = A.brand.visual;
  const has = Boolean(v.logo_direction);
  const [note, setNote] = useState(v.logo_direction);

  const confirm = async () => {
    await A.patch({ visual: { ...v, logo_direction: note } });
    await A.complete("mod:logo", { silent: true });
    A.notify("Logo confirmed ✓");
    onBack();
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="Brand Identity" />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: O }}>◒</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">2.1 Logo Design</h1>
            <p className="text-sm text-[#6B7280]">Your real, generated wordmark and favicon — rendered live from your visual system.</p>
          </div>
        </div>
        <div className="flex gap-2"><button className={btnGhost} onClick={() => A.openUrl(brandWordmarkUrl(A.companyId))}>▤ Open wordmark</button><button className={btnGhost} onClick={() => A.openUrl(brandFaviconUrl(A.companyId))}>▤ Open favicon</button></div>
      </div>

      {!has ? (
        <div className={`${card} mt-6 p-10 text-center`}>
          <p className="text-3xl">◒</p>
          <p className="mt-3 text-sm font-bold text-[#111827]">No logo generated yet</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#6B7280]">
            Your wordmark is rendered from your Brand Play&apos;s visual system — generate your Brand Core in
            <b> 1. Brand Strategy</b> first and it appears here automatically. There&apos;s no separate
            &ldquo;pick from 6 concepts&rdquo; step — one wordmark, generated from real brand data.
          </p>
          <button className={btnO} style={{ background: O, marginTop: 16 }} onClick={onBack}>← Back to Brand Identity</button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className={`${card} flex flex-col items-center justify-center gap-3 p-8`}>
              <p className={label}>Wordmark</p>
              <img src={brandWordmarkUrl(A.companyId)} alt="wordmark" style={{ height: 56 }} />
            </div>
            <div className={`${card} flex flex-col items-center justify-center gap-3 p-8`}>
              <p className={label}>Favicon</p>
              <img src={brandFaviconUrl(A.companyId)} alt="favicon" style={{ height: 40, width: 40 }} />
            </div>
          </div>

          <div className={`${card} mt-4 p-5`}>
            <p className={label}>Logo direction — from your Brand Play</p>
            <textarea className="mt-2 w-full rounded-lg border border-[#E7E9EE] p-3 text-sm leading-relaxed outline-none focus:border-[#4F46E5]" rows={3}
              value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-3 flex gap-2">{["SVG"].map((f) => <span key={f} className="rounded-lg bg-[#F1F3F6] px-2 py-1 text-[10px] font-semibold text-[#6B7280]">{f}</span>)}
              <span className="text-[11px] text-[#9AA3B0]">— PNG/JPG/PDF export isn&apos;t built yet; SVG is the real, live format today.</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Back to Brand Identity</button>
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => A.openChat("Suggest a different logo direction for my brand.")}>✦ Ask AI to refine</button>
              <button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Progress"}</button>
              <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={confirm}>Confirm Logo &amp; Continue →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================ COLOR PALETTE ==================================================
// Reads the real generated palette (VisualSystem.palette, from generate_visual_system — one call
// per Brand Play, made when the founder generated their Brand Core in Strategy). We never invent
// colors here: no palette yet means send the founder to Strategy, not a fake starter set.
const ROLE_HINT: Record<string, string> = {
  primary: "Your main brand color — logo, CTAs, links.",
  ink: "Body text and headlines.",
  paper: "Page and card backgrounds.",
  accent: "Highlights, badges, secondary actions.",
  support: "Borders, dividers, subtle fills.",
};

function PaletteEditor({ onBack }: { onBack: () => void }) {
  const A = useW5();
  const palette = A.brand.visual.palette;
  const [copied, setCopied] = useState("");

  const setSwatch = (i: number, patch: Partial<{ name: string; hex: string; role: string }>) => {
    const next = palette.map((s, x) => (x === i ? { ...s, ...patch } : s));
    A.patch({ visual: { ...A.brand.visual, palette: next } });
  };
  const copyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(""), 1400);
  };
  const confirm = async () => {
    await A.complete("mod:palette", { silent: true });
    A.notify("Palette confirmed ✓");
    onBack();
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="Brand Identity" />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: "#8B5CF6" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6"><circle cx="12" cy="12" r="9" /><circle cx="8" cy="10" r="1.3" /><circle cx="12" cy="8" r="1.3" /><circle cx="16" cy="10" r="1.3" /></svg>
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">2.2 Color Palette</h1>
            <p className="text-sm text-[#6B7280]">Generated from your Brand Play — edit any swatch until it's right.</p>
          </div>
        </div>
        <button className={btnGhost} onClick={() => A.download("color-palette.json", JSON.stringify(palette, null, 2), "application/json")}>⇩ Export JSON</button>
      </div>

      {palette.length === 0 ? (
        <div className={`${card} mt-6 p-10 text-center`}>
          <p className="text-3xl">🎨</p>
          <p className="mt-3 text-sm font-bold text-[#111827]">No palette yet</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#6B7280]">
            Your palette is generated from your Brand Play, not invented here. Generate your Brand Core in
            <b> 1. Brand Strategy</b> first and it appears on this screen automatically.
          </p>
          <button className={btnO} style={{ background: O, marginTop: 16 }} onClick={onBack}>← Back to Brand Identity</button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {palette.map((s, i) => (
              <div key={i} className={`${card} overflow-hidden`}>
                <button className="h-24 w-full" style={{ background: s.hex }} onClick={() => copyHex(s.hex)} title="Click to copy hex" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <input className="w-full border-none bg-transparent text-sm font-bold text-[#111827] outline-none" value={s.name}
                      onChange={(e) => setSwatch(i, { name: e.target.value })} onBlur={A.saveDraft} />
                    <button onClick={() => copyHex(s.hex)} className="shrink-0 font-mono text-xs text-[#6B7280] hover:text-[#111827]">
                      {copied === s.hex ? "Copied ✓" : s.hex}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input type="color" value={/^#[0-9a-f]{6}$/i.test(s.hex) ? s.hex : "#000000"}
                      onChange={(e) => setSwatch(i, { hex: e.target.value })} onBlur={A.saveDraft}
                      className="h-8 w-8 shrink-0 cursor-pointer rounded border border-[#E7E9EE] p-0" />
                    <input className="w-full rounded-lg border border-[#E7E9EE] px-2 py-1 font-mono text-xs uppercase text-[#3A414D] outline-none focus:border-[#8B5CF6]"
                      value={s.hex} onChange={(e) => setSwatch(i, { hex: e.target.value })} onBlur={A.saveDraft} />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[#9AA3B0]">{s.role}</p>
                  <p className="mt-0.5 text-[11px] text-[#9AA3B0]">{ROLE_HINT[s.role] ?? "Supporting brand color."}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`${card} mt-6 p-4`}>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9AA3B0]">Preview</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl p-5" style={{ background: palette.find((p) => p.role === "paper")?.hex || "#fff" }}>
              <span className="rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: palette.find((p) => p.role === "primary")?.hex || "#111827" }}>
                Primary button
              </span>
              <span className="text-sm font-semibold" style={{ color: palette.find((p) => p.role === "ink")?.hex || "#111827" }}>
                Body text in your ink color
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: palette.find((p) => p.role === "accent")?.hex || "#eee", color: "#fff" }}>
                Accent badge
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Back to Brand Identity</button>
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => A.openChat("Suggest a refined color palette for my brand.")}>✦ Ask AI to refine</button>
              <button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Progress"}</button>
              <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={confirm}>Confirm Palette &amp; Continue →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================ TYPOGRAPHY =====================================================
// Reads the real type pairing from VisualSystem (generate_visual_system, same call as the
// palette). Two roles: display (headlines) and body (everything else) — a founder edits the
// font names, sees them live, and confirms.
const FONT_STACKS: Record<string, string> = {
  "Inter": "Inter, ui-sans-serif, system-ui, sans-serif",
  "Sohne": '"Sohne", Inter, ui-sans-serif, sans-serif',
  "General Sans": '"General Sans", Inter, ui-sans-serif, sans-serif',
  "Playfair Display": '"Playfair Display", Georgia, serif',
  "Fraunces": '"Fraunces", Georgia, serif',
  "Space Grotesk": '"Space Grotesk", Inter, ui-sans-serif, sans-serif',
  "IBM Plex Mono": '"IBM Plex Mono", ui-monospace, monospace',
};
function stackFor(name: string): string {
  return FONT_STACKS[name] ?? `"${name}", Inter, ui-sans-serif, sans-serif`;
}

function TypographyEditor({ onBack }: { onBack: () => void }) {
  const A = useW5();
  const v = A.brand.visual;
  const has = Boolean(v.type_display && v.type_body);

  const setField = (k: "type_display" | "type_body", val: string) =>
    A.patch({ visual: { ...v, [k]: val } });
  const confirm = async () => {
    await A.complete("mod:typography", { silent: true });
    A.notify("Typography confirmed ✓");
    onBack();
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="Brand Identity" />
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-extrabold" style={{ background: "#DBEAFE", color: "#3B82F6" }}>Aa</span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">2.3 Typography</h1>
          <p className="text-sm text-[#6B7280]">Generated from your Brand Play — the display/body pairing that carries your voice.</p>
        </div>
      </div>

      {!has ? (
        <div className={`${card} mt-6 p-10 text-center`}>
          <p className="text-3xl">Aa</p>
          <p className="mt-3 text-sm font-bold text-[#111827]">No type pairing yet</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#6B7280]">
            Generate your Brand Core in <b>1. Brand Strategy</b> first — the type pairing comes from your Brand Play, not invented here.
          </p>
          <button className={btnO} style={{ background: O, marginTop: 16 }} onClick={onBack}>← Back to Brand Identity</button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className={`${card} p-5`}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9AA3B0]">Display — headlines</p>
              <input className="mt-2 w-full rounded-lg border border-[#E7E9EE] px-3 py-2 text-sm outline-none focus:border-[#3B82F6]"
                value={v.type_display} onChange={(e) => setField("type_display", e.target.value)} onBlur={A.saveDraft} />
              <p className="mt-4 text-3xl font-bold text-[#111827]" style={{ fontFamily: stackFor(v.type_display) }}>{A.brandName}</p>
              <p className="text-lg text-[#111827]" style={{ fontFamily: stackFor(v.type_display) }}>{A.core.tagline || "Your tagline goes here"}</p>
            </div>
            <div className={`${card} p-5`}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9AA3B0]">Body — everything else</p>
              <input className="mt-2 w-full rounded-lg border border-[#E7E9EE] px-3 py-2 text-sm outline-none focus:border-[#3B82F6]"
                value={v.type_body} onChange={(e) => setField("type_body", e.target.value)} onBlur={A.saveDraft} />
              <p className="mt-4 text-sm leading-relaxed text-[#3A414D]" style={{ fontFamily: stackFor(v.type_body) }}>
                {A.core.positioning || A.core.pitch || "Body text uses this font for paragraphs, UI labels, and everything a customer reads."}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#9AA3B0]">Preview uses your system font stack if the exact face isn&apos;t installed locally — the name is what ships to your brand kit.</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Back to Brand Identity</button>
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => A.openChat("Suggest a different font pairing for my brand.")}>✦ Ask AI to refine</button>
              <button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Progress"}</button>
              <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={confirm}>Confirm Typography &amp; Continue →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================ BRAND VOICE ====================================================
function BrandVoiceEditor({ onBack }: { onBack: () => void }) {
  const A = useW5();
  const c = A.core;
  const [voice, setVoice] = useState(c.voice);
  const has = Boolean(c.voice);

  const confirm = async () => {
    await A.patch({ core: { ...A.brand.core, voice } });
    await A.complete("mod:voice", { silent: true });
    A.notify("Brand voice confirmed ✓");
    onBack();
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="Brand Identity" />
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "#FEF3C7", color: "#F59E0B" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" /></svg>
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">2.5 Brand Voice</h1>
          <p className="text-sm text-[#6B7280]">How your brand sounds, in one paragraph — edit until it&apos;s unmistakably you.</p>
        </div>
      </div>

      {!has && !voice ? (
        <div className={`${card} mt-6 p-6`}>
          <p className="text-sm font-bold text-[#111827]">No voice set yet</p>
          <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
            Generate your Brand Core in Brand Strategy for a starting draft, or write your own below — voice is one thing worth writing in your own words.
          </p>
          <textarea className="mt-3 w-full rounded-lg border border-[#E7E9EE] p-3 text-sm outline-none focus:border-[#F59E0B]" rows={4}
            placeholder="e.g. Direct, a little irreverent, never corporate. We explain like a sharp friend, not a brochure."
            value={voice} onChange={(e) => setVoice(e.target.value)} />
        </div>
      ) : (
        <div className={`${card} mt-6 p-6`}>
          <p className={label}>Voice description</p>
          <textarea className="mt-2 w-full rounded-lg border border-[#E7E9EE] p-3 text-sm leading-relaxed outline-none focus:border-[#F59E0B]" rows={5}
            value={voice} onChange={(e) => setVoice(e.target.value)} />
          <div className="mt-4 rounded-lg bg-[#FFFBEB] p-4">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#92600E" }}>Applied to a sample line</p>
            <p className="mt-1.5 text-sm text-[#3A414D]">&ldquo;{A.core.pitch || A.core.tagline || `${A.brandName} helps you move faster.`}&rdquo;</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
        <button className={btnGhost} onClick={onBack}>← Back to Brand Identity</button>
        <div className="flex gap-2">
          <button className={btnGhost} onClick={() => A.openChat("Help me write my brand voice.")}>✦ Ask AI to draft</button>
          <button className={btnO} style={{ background: O }} disabled={A.busy || !voice.trim()} onClick={confirm}>Confirm Voice &amp; Continue →</button>
        </div>
      </div>
    </div>
  );
}

// ============================ BRAND STORY ====================================================
function BrandStoryEditor({ onBack }: { onBack: () => void }) {
  const A = useW5();
  const core = A.brand.core;
  const has = Boolean(core.mission);

  const setField = (k: "mission" | "vision" | "tagline" | "pitch", val: string) =>
    A.patch({ core: { ...core, [k]: val } });
  const confirm = async () => {
    await A.complete("mod:story", { silent: true });
    A.notify("Brand story confirmed ✓");
    onBack();
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="Brand Identity" />
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "#FCE7F3", color: "#EC4899" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">2.6 Brand Story</h1>
          <p className="text-sm text-[#6B7280]">Mission, vision, and the line you lead with — from your validated idea, not invented here.</p>
        </div>
      </div>

      {!has ? (
        <div className={`${card} mt-6 p-10 text-center`}>
          <p className="text-3xl">📖</p>
          <p className="mt-3 text-sm font-bold text-[#111827]">No story drafted yet</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#6B7280]">
            Generate your Brand Core in <b>1. Brand Strategy</b> and your mission, vision, and pitch draft from your validated idea automatically.
          </p>
          <button className={btnO} style={{ background: O, marginTop: 16 }} onClick={onBack}>← Back to Brand Identity</button>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            <div className={`${card} p-5`}>
              <p className={label}>Mission — why we exist, today</p>
              <textarea className="mt-2 w-full rounded-lg border border-[#E7E9EE] p-3 text-sm outline-none focus:border-[#EC4899]" rows={2}
                value={core.mission} onChange={(e) => setField("mission", e.target.value)} onBlur={A.saveDraft} />
            </div>
            <div className={`${card} p-5`}>
              <p className={label}>Vision — the world if we win</p>
              <textarea className="mt-2 w-full rounded-lg border border-[#E7E9EE] p-3 text-sm outline-none focus:border-[#EC4899]" rows={2}
                value={core.vision} onChange={(e) => setField("vision", e.target.value)} onBlur={A.saveDraft} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`${card} p-5`}>
                <p className={label}>Tagline</p>
                <input className="mt-2 w-full rounded-lg border border-[#E7E9EE] px-3 py-2 text-sm font-semibold outline-none focus:border-[#EC4899]"
                  value={core.tagline} onChange={(e) => setField("tagline", e.target.value)} onBlur={A.saveDraft} />
              </div>
              <div className={`${card} p-5`}>
                <p className={label}>Elevator pitch</p>
                <input className="mt-2 w-full rounded-lg border border-[#E7E9EE] px-3 py-2 text-sm outline-none focus:border-[#EC4899]"
                  value={core.pitch} onChange={(e) => setField("pitch", e.target.value)} onBlur={A.saveDraft} />
              </div>
            </div>
            {core.values.length > 0 && (
              <div className={`${card} p-5`}>
                <p className={label}>Values</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {core.values.map((v) => <span key={v} className="rounded-full border border-[#E7E9EE] px-3 py-1 text-xs font-medium text-[#3A414D]">{v}</span>)}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Back to Brand Identity</button>
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => A.openChat("Sharpen my brand story — mission, vision, tagline.")}>✦ Ask AI to refine</button>
              <button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Progress"}</button>
              <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={confirm}>Confirm Story &amp; Continue →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================ BRAND GUIDELINES ===============================================
// A compiled read of everything decided elsewhere — logo, palette, type, voice, story. Nothing
// new is authored here; this is the "one document" a founder hands to a designer or a hire.
function guidelinesDoc(A: W5Actions): string {
  const c = A.brand.core, v = A.brand.visual;
  return [
    `# Brand Guidelines — ${A.brandName}`,
    "",
    "## Mission", c.mission || "—", "",
    "## Voice", c.voice || "—", "",
    "## Tagline", c.tagline || "—", "",
    "## Palette",
    ...(v.palette.length ? v.palette.map((s) => `- ${s.name} (${s.role}) — ${s.hex}`) : ["_not set_"]), "",
    "## Typography",
    `- Display: ${v.type_display || "—"}`, `- Body: ${v.type_body || "—"}`, "",
    "_Generated by StartupKit W5 from the Brand Core — nothing here was invented independently._",
  ].join("\n");
}

function BrandGuidelines({ onBack }: { onBack: () => void }) {
  const A = useW5();
  const c = A.brand.core, v = A.brand.visual;
  const ready = Boolean(c.mission || c.voice || v.palette.length);

  const confirm = async () => {
    await A.complete("mod:guidelines", { silent: true });
    A.notify("Brand Guidelines confirmed ✓");
    onBack();
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="Brand Identity" />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "#D1FAE5", color: "#10B981" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" /></svg>
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">2.4 Brand Guidelines</h1>
            <p className="text-sm text-[#6B7280]">One document, compiled from everything decided in the other tabs.</p>
          </div>
        </div>
        <button className={btnGhost} onClick={() => A.download(`${A.brandName.toLowerCase().replace(/ /g, "-")}-brand-guidelines.md`, guidelinesDoc(A), "text/markdown")}>⇩ Download .md</button>
      </div>

      {!ready ? (
        <div className={`${card} mt-6 p-10 text-center`}>
          <p className="text-3xl">📋</p>
          <p className="mt-3 text-sm font-bold text-[#111827]">Nothing to compile yet</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#6B7280]">Guidelines pull from Logo, Palette, Typography, Voice, and Story — fill in a few of those first and this page fills itself in.</p>
          <button className={btnO} style={{ background: O, marginTop: 16 }} onClick={onBack}>← Back to Brand Identity</button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className={`${card} p-5`}>
              <p className={label}>Mission</p>
              <p className="mt-1 text-sm text-[#3A414D]">{c.mission || "Not set — open Brand Story"}</p>
            </div>
            <div className={`${card} p-5`}>
              <p className={label}>Voice</p>
              <p className="mt-1 text-sm text-[#3A414D]">{c.voice || "Not set — open Brand Voice"}</p>
            </div>
            <div className={`${card} p-5`}>
              <p className={label}>Palette</p>
              <div className="mt-2 flex gap-2">
                {v.palette.length ? v.palette.map((s) => (
                  <span key={s.hex} className="h-8 w-8 rounded-lg border border-[#E7E9EE]" style={{ background: s.hex }} title={`${s.name} · ${s.hex}`} />
                )) : <p className="text-sm text-[#9AA3B0]">Not set — open Color Palette</p>}
              </div>
            </div>
            <div className={`${card} p-5`}>
              <p className={label}>Typography</p>
              <p className="mt-1 text-sm text-[#3A414D]" style={{ fontFamily: stackFor(v.type_display) }}>{v.type_display || "Not set"} <span className="text-[#9AA3B0]">/ display</span></p>
              <p className="text-sm text-[#3A414D]" style={{ fontFamily: stackFor(v.type_body) }}>{v.type_body || "Not set"} <span className="text-[#9AA3B0]">/ body</span></p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Back to Brand Identity</button>
            <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={confirm}>Confirm Guidelines &amp; Continue →</button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================ ICONOGRAPHY ====================================================
// Honest scope: there is no icon-generation engine behind this yet (unlike logo/palette/type,
// which read from generate_visual_system). This is a founder-curated set — name + a symbol you
// pick — not AI-generated, and it says so rather than pretending otherwise.
type IconEntry = { name: string; glyph: string; use: string };
const GLYPH_CHOICES = ["★", "◆", "●", "▲", "■", "✦", "◉", "◈", "✚", "☰", "⬡", "◍"];

function IconographyEditor({ onBack }: { onBack: () => void }) {
  const A = useW5();
  const [icons, setIcons] = useState<IconEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(`w5:icons:${A.companyId}`) || "[]"); } catch { return []; }
  });
  const [name, setName] = useState("");
  const [use, setUse] = useState("");
  const [glyph, setGlyph] = useState(GLYPH_CHOICES[0]);

  const save = (next: IconEntry[]) => {
    setIcons(next);
    try { localStorage.setItem(`w5:icons:${A.companyId}`, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const add = () => {
    if (!name.trim()) return;
    save([...icons, { name: name.trim(), glyph, use: use.trim() }]);
    setName(""); setUse("");
  };
  const confirm = async () => {
    await A.complete("mod:icons", { silent: true });
    A.notify("Iconography confirmed ✓");
    onBack();
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="Brand Identity" />
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "#EDE9FE", color: "#8B5CF6" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6"><path d="M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17l-5.5 4L7 14.5 3 10l6.5-.5z" /></svg>
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">2.7 Iconography</h1>
          <p className="text-sm text-[#6B7280]">Name the icons your product needs — this list guides whoever designs them next.</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-[#FFFBEB] px-4 py-2.5 text-xs" style={{ color: "#92600E" }}>
        Honest limit: there&apos;s no icon-generation engine here yet, unlike Logo or Palette. This is a founder-curated
        list — a placeholder symbol per icon — not a finished icon set.
      </div>

      <div className={`${card} mt-4 p-5`}>
        <p className={label}>Add an icon</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select className="rounded-lg border border-[#E7E9EE] px-3 py-2 text-lg" value={glyph} onChange={(e) => setGlyph(e.target.value)}>
            {GLYPH_CHOICES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input className="min-w-[160px] flex-1 rounded-lg border border-[#E7E9EE] px-3 py-2 text-sm outline-none focus:border-[#8B5CF6]"
            placeholder="Icon name — e.g. Dashboard" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <input className="min-w-[160px] flex-1 rounded-lg border border-[#E7E9EE] px-3 py-2 text-sm outline-none focus:border-[#8B5CF6]"
            placeholder="Used where — e.g. Sidebar nav" value={use} onChange={(e) => setUse(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button className={btnO} style={{ background: name.trim() ? "#8B5CF6" : "#D1D5DB" }} disabled={!name.trim()} onClick={add}>Add</button>
        </div>
      </div>

      {icons.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {icons.map((ic, i) => (
            <div key={i} className={`${card} flex items-center gap-3 p-3`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: "#EDE9FE", color: "#8B5CF6" }}>{ic.glyph}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111827]">{ic.name}</p>
                <p className="truncate text-xs text-[#9AA3B0]">{ic.use || "—"}</p>
              </div>
              <button className="text-[#C4CCD6] hover:text-[#EF4444]" onClick={() => save(icons.filter((_, x) => x !== i))}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
        <button className={btnGhost} onClick={onBack}>← Back to Brand Identity</button>
        <div className="flex gap-2">
          <button className={btnGhost} onClick={() => A.openChat("What icons does my product actually need?")}>✦ Ask AI what I need</button>
          <button className={btnO} style={{ background: O }} disabled={A.busy || icons.length === 0} onClick={confirm}>Confirm Iconography &amp; Continue →</button>
        </div>
      </div>
    </div>
  );
}

// ============================ BRAND ASSETS LIBRARY ===========================================
// The real download hub — every asset that's actually been generated, not a mockup file list.
function AssetsLibrary({ onBack }: { onBack: () => void }) {
  const A = useW5();
  const v = A.brand.visual;
  const rows: { name: string; ready: boolean; note: string; action: () => void }[] = [
    { name: "Wordmark (SVG)", ready: true, note: "Generated live from your visual system", action: () => A.openUrl(brandWordmarkUrl(A.companyId)) },
    { name: "Favicon (SVG)", ready: true, note: "Generated live from your visual system", action: () => A.openUrl(brandFaviconUrl(A.companyId)) },
    { name: "Color Palette (JSON)", ready: v.palette.length > 0, note: v.palette.length ? `${v.palette.length} swatches` : "Generate your Brand Core first", action: () => A.download("color-palette.json", JSON.stringify(v.palette, null, 2), "application/json") },
    { name: "Brand Guidelines (.md)", ready: Boolean(A.brand.core.mission), note: A.brand.core.mission ? "Compiled from your Brand Core" : "Fill in Brand Story first", action: () => A.download(`${A.brandName.toLowerCase().replace(/ /g, "-")}-brand-guidelines.md`, guidelinesDoc(A), "text/markdown") },
    { name: "Published Website", ready: Boolean(A.brand.site_template), note: A.brand.site_template ? `Template: ${A.brand.site_template}` : "Build it in Digital Presence first", action: () => A.openUrl(publishedSiteUrl(A.companyId)) },
  ];
  const readyCount = rows.filter((r) => r.ready).length;

  const confirm = async () => {
    await A.complete("mod:assets", { silent: true });
    A.notify("Assets library confirmed ✓");
    onBack();
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="Brand Identity" />
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "#FFEDD5", color: "#F97316" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6"><path d="M4 7h6l2 2h8v9a2 2 0 01-2 2H4z" /></svg>
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">2.8 Brand Assets Library</h1>
          <p className="text-sm text-[#6B7280]">{readyCount} of {rows.length} assets ready — everything else says exactly what unlocks it.</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {rows.map((r) => (
          <div key={r.name} className={`${card} flex items-center gap-3 p-4`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={r.ready ? { background: "#D1FAE5", color: GREEN } : { background: "#F1F3F6", color: "#9AA3B0" }}>
              {r.ready ? "✓" : "○"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#111827]">{r.name}</p>
              <p className="text-xs text-[#9AA3B0]">{r.note}</p>
            </div>
            <button className={btnGhost} disabled={!r.ready} onClick={r.action}>{r.ready ? "Open / Download" : "Locked"}</button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
        <button className={btnGhost} onClick={onBack}>← Back to Brand Identity</button>
        <button className={btnO} style={{ background: O }} disabled={A.busy || readyCount === 0} onClick={confirm}>Confirm Library &amp; Continue →</button>
      </div>
    </div>
  );
}

// ============================ shared: 4-phase bar ============================================
const PHASES = ["Brand Strategy", "Brand Identity", "Marketing Assets"];
function PhaseBar({ active }: { active: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-[#E7E9EE] bg-white p-4">
      {PHASES.map((p, i) => {
        const n = i + 1;
        const done = n < active, cur = n === active;
        return (
          <div key={p} className="flex flex-1 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: done ? "#DCFCE7" : cur ? O : "#F1F3F6", color: done ? GREEN : cur ? "#fff" : "#9AA3B0" }}>
              {done ? "✓" : n}
            </span>
            <span className="text-sm font-semibold" style={{ color: cur ? "#111827" : done ? "#3A414D" : "#9AA3B0" }}>{p}</span>
            {i < PHASES.length - 1 && <span className="mx-1 hidden flex-1 border-t border-dashed border-[#E7E9EE] sm:block" />}
          </div>
        );
      })}
      <div className="flex items-center gap-2 pl-2 text-[#9AA3B0]"><span>🏆</span><span className="text-sm font-medium">Complete</span></div>
    </div>
  );
}

// ============================ BRAND IDENTITY ================================================
// Status used to be hardcoded here regardless of what the founder had actually done — the "8/8
// Completed" badge lied by construction. It's now derived from real brand state per card.
type IdCard = { n: number; title: string; desc: string; icon: string; color: string; bg: string; opens?: string; text?: boolean; done: (b: BrandState) => boolean };
const ID_CARDS: IdCard[] = [
  { n: 1, title: "Logo Design", desc: "Create a professional logo that represents your brand.", icon: ICON.brush, color: "#EF4444", bg: "#FEE2E2", opens: "logo", done: (b) => Boolean(b.visual.logo_direction) },
  { n: 2, title: "Color Palette", desc: "Choose colors that define your brand personality.", icon: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.3"/><circle cx="12" cy="8" r="1.3"/><circle cx="16" cy="10" r="1.3"/>', color: "#8B5CF6", bg: "#EDE9FE", opens: "palette", done: (b) => b.visual.palette.length >= 3 },
  { n: 3, title: "Typography", desc: "Select fonts that communicate your brand voice.", icon: "", text: true, color: "#3B82F6", bg: "#DBEAFE", opens: "typography", done: (b) => Boolean(b.visual.type_display && b.visual.type_body) },
  { n: 4, title: "Brand Guidelines", desc: "Create guidelines for consistent brand usage.", icon: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>', color: "#10B981", bg: "#D1FAE5", opens: "guidelines", done: (b) => b.steps_done.includes("mod:guidelines") },
  { n: 5, title: "Brand Voice", desc: "Define your brand voice and tone of communication.", icon: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>', color: "#F59E0B", bg: "#FEF3C7", opens: "voice", done: (b) => Boolean(b.core.voice) },
  { n: 6, title: "Brand Story", desc: "Craft your brand story and mission statement.", icon: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>', color: "#EC4899", bg: "#FCE7F3", opens: "story", done: (b) => Boolean(b.core.mission) },
  { n: 7, title: "Iconography", desc: "Create icon set for your product and platform.", icon: '<path d="M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17l-5.5 4L7 14.5 3 10l6.5-.5z"/>', color: "#8B5CF6", bg: "#EDE9FE", opens: "icons", done: (b) => b.steps_done.includes("mod:icons") },
  { n: 8, title: "Brand Assets Library", desc: "Organize and download all your brand assets.", icon: '<path d="M4 7h6l2 2h8v9a2 2 0 01-2 2H4z"/>', color: "#F97316", bg: "#FFEDD5", opens: "assets", done: (b) => b.steps_done.includes("mod:assets") },
];

function BrandIdentity({ onBack, onOpenSection }: { onBack: () => void; onOpenSection: (s: string) => void }) {
  const A = useW5();
  const cardStatus = (c: IdCard): "done" | "active" | "pending" => {
    if (c.done(A.brand)) return "done";
    const firstNotDone = ID_CARDS.find((x) => !x.done(A.brand));
    return firstNotDone?.n === c.n ? "active" : "pending";
  };
  const doneCount = ID_CARDS.filter((c) => c.done(A.brand)).length;
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="W5" />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: O }}>W5</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">Brand &amp; Presence</h1>
            <p className="text-sm text-[#6B7280]">Build your brand identity and create everything you need to launch, pitch, and grow.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={btnGhost} onClick={() => A.notify("Brand identity guide opened")}>▤ Guide</button>
          <button className={btnGhost} onClick={() => A.openUrl(brandWordmarkUrl(A.companyId))}>▤ Resources</button>
          <button onClick={() => A.openChat("Generate my full brand identity — logo, colors, typography.")} className="rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: O, color: O }}>✦ AI Generate All Assets →</button>
        </div>
      </div>

      <div className="mt-5"><PhaseBar active={2} /></div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#111827]">2. Brand Identity</h2>
              <p className="text-sm text-[#6B7280]">Create your visual identity including logo, colors, typography, and brand guidelines.</p>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={doneCount === 8 ? { background: "#DCFCE7", color: GREEN } : { background: "#F1F3F6", color: "#6B7280" }}>{doneCount}/8 Completed{doneCount === 8 ? " ✓" : ""}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ID_CARDS.map((c) => {
              const status = cardStatus(c);
              const cur = status === "active";
              return (
                <div key={c.n} className={`${card} p-4`} style={cur ? { borderColor: O, borderWidth: 2 } : undefined}>
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F1F3F6] text-xs font-bold text-[#6B7280]">{c.n}</span>
                    {cur && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#FFF4EC", color: O }}>Current Step</span>}
                  </div>
                  <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: c.bg, color: c.color }}>
                    {c.text ? <span className="text-lg font-extrabold">Aa</span> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" dangerouslySetInnerHTML={{ __html: c.icon }} />}
                  </span>
                  <p className="mt-3 text-sm font-bold text-[#111827]">{c.title}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">{c.desc}</p>
                  <div className="mt-3">
                    {status === "done" && <p className="text-xs font-medium" style={{ color: GREEN }}>✓ Completed</p>}
                    {status === "active" && <p className="text-xs font-medium" style={{ color: O }}>○ In Progress</p>}
                    {status === "pending" && <p className="text-xs text-[#9AA3B0]">○ Pending</p>}
                    {!c.opens && <p className="mt-1 text-[10px] text-[#B45309]">Not built yet — opens AI chat for now</p>}
                  </div>
                  <button
                    className={`mt-2 w-full rounded-lg py-2 text-xs font-semibold ${status === "active" ? "text-white" : "border border-[#E7E9EE] text-[#3A414D]"}`}
                    style={status === "active" ? { background: O } : undefined}
                    onClick={() => (c.opens ? onOpenSection(c.opens) : A.openChat(`Help me with: ${c.title}.`))}
                  >
                    {status === "done" ? (c.opens ? "View" : "Ask AI") : status === "active" ? "Continue" : c.opens ? "Start" : "Ask AI"}
                  </button>
                </div>
              );
            })}
          </div>

          {doneCount < 8 && (
            <div className="mt-4 rounded-xl border border-[#FDE7D2] bg-[#FFF9F3] p-3 text-xs text-[#7A4A1E]">
              <b>💡 Next up: {ID_CARDS.find((c) => !c.done(A.brand))?.title}</b> — {ID_CARDS.find((c) => !c.done(A.brand))?.desc}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Previous: Brand Strategy</button>
            <div className="flex gap-2">
              <button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Progress"}</button>
              <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={async () => { await A.complete("mod:identity"); onOpenSection("launch"); }}>Next: Marketing Assets →</button>
            </div>
          </div>
        </div>

        {/* right rail */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E7E9EE] bg-[#F7F5FF] p-4">
            <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>AI Assistant <span className="ml-1 rounded bg-[#EDE9FE] px-1.5 py-0.5 text-[10px]">Beta</span></p>
            <p className="mt-2 text-xs text-[#3A414D]">I can help you create a cohesive brand identity that stands out.</p>
            <div className="mt-3 space-y-2.5 text-xs text-[#3A414D]">
              {["Your logo looks professional! Consider a minimal variation.", "For your industry, blue and purple palettes perform well.", "Sans-serif fonts work best for tech companies."].map((s) => (
                <p key={s} className="flex gap-2"><span style={{ color: GREEN }}>✓</span>{s}</p>
              ))}
            </div>
            <button onClick={() => A.openChat("Give me all your brand identity suggestions.")} className="mt-3 text-xs font-medium" style={{ color: "#7C3AED" }}>View All Suggestions →</button>
          </div>
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-[#111827]">Progress Overview</p><span className="text-sm font-bold" style={{ color: O }}>{A.overallPct}%</span></div>
            <div className="mt-2"><Progress pct={A.overallPct} /></div>
            <p className="mt-1 text-xs text-[#6B7280]">{A.brand.steps_done.filter((s) => s.startsWith("mod:")).length} of {PROGRESS_MODULES.length} modules completed</p>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">Quick Links</p>
            <div className="mt-3 space-y-2 text-xs">
              {([["Brand Inspiration", () => A.openChat("Show me brand inspiration for my industry.")], ["Competitor Analysis", () => onOpenSection("market")], ["Industry Benchmarks", () => A.openChat("What are the brand benchmarks in my industry?")], ["Brand Audit Checklist", () => A.download("brand-audit-checklist.txt", brandSummary(A))]] as [string, () => void][]).map(([l, fn]) => (
                <button key={l} onClick={fn} className="flex items-center gap-2 hover:underline" style={{ color: "#4F46E5" }}>◆ {l}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============================ COMPETITOR ANALYSIS ===========================================
const COMPETITORS = [
  { name: "Stripe Atlas", tag: "Company Formation", year: "2016", geo: "USA", fund: "$600M+ funding", emp: "250+ employees", rating: "4.3", c: "#635BFF" },
  { name: "Clerky", tag: "Legal Documents", year: "2011", geo: "USA", fund: "$10M+ funding", emp: "45+ employees", rating: "4.6", c: "#111827" },
  { name: "Firstbase", tag: "Company Formation", year: "2019", geo: "USA", fund: "$52M+ funding", emp: "120+ employees", rating: "4.2", c: "#F59E0B" },
  { name: "Doola", tag: "Global Formation", year: "2020", geo: "USA", fund: "$24M+ funding", emp: "80+ employees", rating: "4.4", c: "#8B5CF6" },
  { name: "AngelList Stack", tag: "Fundraising Platform", year: "2010", geo: "USA", fund: "$746M+ funding", emp: "200+ employees", rating: "4.1", c: "#111827" },
];
const MATRIX_COLS = ["StartupKit", "Clerky", "Stripe Atlas", "Firstbase", "Doola", "AngelList"];
const MATRIX_ROWS: [string, string[]][] = [
  ["Company Formation", ["full", "full", "full", "full", "full", "full"]],
  ["Legal Documents", ["full", "full", "full", "partial", "partial", "full"]],
  ["Banking & Finance", ["full", "none", "partial", "full", "partial", "none"]],
  ["HR & Hiring", ["full", "none", "none", "full", "none", "none"]],
  ["Brand & Identity", ["full", "none", "none", "partial", "none", "full"]],
  ["Fundraising", ["full", "none", "none", "partial", "none", "full"]],
  ["AI Automation", ["full", "partial", "partial", "partial", "partial", "partial"]],
  ["Workflow Engine", ["full", "partial", "planned", "none", "partial", "partial"]],
  ["Health Score", ["full", "planned", "planned", "none", "none", "planned"]],
  ["Global Support", ["full", "partial", "partial", "partial", "full", "partial"]],
];
const MATRIX_ICON: Record<string, { s: string; c: string }> = {
  full: { s: "●", c: "#16A34A" }, partial: { s: "◐", c: "#D97706" }, none: { s: "✕", c: "#DC2626" }, planned: { s: "○", c: "#9AA3B0" },
};
const SCATTER = [
  { n: "StartupKit", x: 88, y: 90, star: true },
  { n: "Firstbase", x: 70, y: 60 }, { n: "Doola", x: 30, y: 45 }, { n: "Clerky", x: 45, y: 35 },
  { n: "Stripe Atlas", x: 30, y: 25 }, { n: "AngelList Stack", x: 72, y: 28 },
];
const RADAR_AXES = ["Legal", "Finance", "HR & People", "Brand & Marketing", "Workflow Engine", "Health & Insights"];
const RADAR = { need: [95, 88, 90, 92, 99, 95], comp: [70, 60, 45, 40, 35, 30], kit: [92, 88, 90, 92, 98, 95] };
const RECS = [
  "Position as the only AI Operating System for Startups, not just another formation tool.",
  "Focus on AI SaaS and tech startups first. They have the highest workflow overlap.",
  "Lead with the complete workflow and time savings, not individual features.",
  "Build trust through Health Score, compliance, and investor-ready documents.",
  "Expand ecosystem integrations to increase stickiness and competitive moat.",
];

function CompetitorAnalysis({ onBack }: { onBack: () => void }) {
  const A = useW5();
  const report = () => [
    `${A.brandName} — Competitor Analysis`, "=".repeat(30), "",
    "LANDSCAPE", ...COMPETITORS.map((c) => `- ${c.name} (${c.tag}) — ${c.fund}, ${c.emp}, ★${c.rating}`), "",
    "STRATEGIC RECOMMENDATIONS", ...RECS.map((r, i) => `${i + 1}. ${r}`),
  ].join("\n");
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <BackBar onBack={onBack} to="W5" />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]"><span style={{ color: "#4F46E5" }}>01</span> Competitor Analysis</h1>
          <p className="mt-1 text-sm text-[#6B7280]">AI-powered insights about your competition and market positioning.</p>
        </div>
        <div className="flex gap-2">
          <button className={btnGhost} onClick={() => A.download(`${A.brandName.toLowerCase().replace(/\s+/g, "-")}-competitor-analysis.txt`, report())}>⤒ Export Report</button>
          <button className={btnGhost} onClick={() => A.notify("Analysis link copied")}>⇱ Share</button>
          <button className={btnO} style={{ background: O }} onClick={() => A.openChat("Re-analyze my competitors and positioning.")}>✦ AI Re-Analyze</button>
        </div>
      </div>

      {/* top row */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className={`${card} p-4`}>
          <p className="text-sm font-bold text-[#111827]">✦ AI Executive Summary</p>
          <p className="mt-2 text-xs leading-relaxed text-[#3A414D]">We analyzed 18 companies in the startup operating system market. StartupKit has a unique position as the only AI-native, end-to-end operating system for startups.</p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[["18", "Total"], ["6", "Direct"], ["12", "Indirect"], ["93", "Opportunity"]].map(([v, l]) => (
              <div key={l}><p className="text-base font-extrabold text-[#111827]">{v}</p><p className="text-[10px] text-[#9AA3B0]">{l}</p></div>
            ))}
          </div>
          <button onClick={() => A.openChat("Give me the full competitor analysis summary.")} className="mt-3 text-xs font-medium" style={{ color: "#4F46E5" }}>View Full Summary →</button>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-sm font-bold text-[#111827]">✦ Market At A Glance</p>
          <span className="mt-2 inline-block rounded-full bg-[#F1F3F6] px-2.5 py-1 text-[11px] text-[#6B7280]">AI Startup Operating Systems</span>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[["Market Size", "$12.8B", "2024", "#4F46E5"], ["Growth Rate", "24%", "CAGR 2024-29", "#111827"], ["Stage", "Emerging", "High growth", "#111827"], ["Competition", "Medium", "Fragmented", "#111827"]].map(([k, v, s, col]) => (
              <div key={k}><p className="text-[10px] text-[#9AA3B0]">{k}</p><p className="text-sm font-bold" style={{ color: col }}>{v}</p><p className="text-[10px] text-[#9AA3B0]">{s}</p></div>
            ))}
          </div>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-sm font-bold text-[#111827]">◆ Key Takeaway</p>
          <p className="mt-2 text-xs leading-relaxed text-[#3A414D]">Most competitors solve one piece of the puzzle. StartupKit is positioned to own the full operating system category.</p>
        </div>
      </div>

      {/* competitor landscape */}
      <p className="mb-3 mt-6 text-sm font-bold text-[#111827]">Competitor Landscape</p>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {COMPETITORS.map((c) => (
          <div key={c.name} className={`${card} p-3`}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: c.c }}>{c.name[0]}</span>
              <p className="text-xs font-bold text-[#111827]">{c.name}</p>
            </div>
            <span className="mt-2 inline-block rounded-full bg-[#EEF0FF] px-2 py-0.5 text-[10px]" style={{ color: "#4F46E5" }}>{c.tag}</span>
            <p className="mt-2 text-[10px] text-[#9AA3B0]">{c.year} · {c.geo}</p>
            <p className="text-[11px] text-[#3A414D]">{c.fund}</p>
            <p className="text-[11px] text-[#3A414D]">{c.emp}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#D97706]">★ {c.rating}</span>
              <button onClick={() => A.openChat(`Tell me more about ${c.name} as a competitor.`)} className="text-[10px] font-medium" style={{ color: "#4F46E5" }}>View Profile</button>
            </div>
          </div>
        ))}
        <div className={`${card} flex flex-col items-center justify-center p-3 text-center`}>
          <p className="text-sm font-bold text-[#111827]">+13 More</p>
          <p className="text-[10px] text-[#9AA3B0]">View all 18 in full analysis</p>
          <button onClick={() => A.openChat("Show me all 18 competitors in the full analysis.")} className="mt-1 text-[11px] font-medium" style={{ color: "#4F46E5" }}>See All →</button>
        </div>
      </div>

      {/* matrix + charts */}
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
        <div className={`${card} p-4`}>
          <p className="text-sm font-bold text-[#111827]">▤ Feature Comparison Matrix</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr><th className="text-left font-medium text-[#9AA3B0]"></th>{MATRIX_COLS.map((c, i) => <th key={c} className="px-1 pb-1 font-semibold" style={{ color: i === 0 ? "#4F46E5" : "#6B7280" }}>{c === "StartupKit" ? "SK" : c.slice(0, 5)}</th>)}</tr></thead>
              <tbody>
                {MATRIX_ROWS.map(([row, vals]) => (
                  <tr key={row} className="border-t border-[#F1F3F6]"><td className="py-1.5 pr-2 text-[#3A414D]">{row}</td>{vals.map((v, i) => <td key={i} className="text-center" style={{ color: MATRIX_ICON[v].c }}>{MATRIX_ICON[v].s}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[#6B7280]">
            <span style={{ color: "#16A34A" }}>● Full</span><span style={{ color: "#D97706" }}>◐ Partial</span><span style={{ color: "#DC2626" }}>✕ N/A</span><span style={{ color: "#9AA3B0" }}>○ Planned</span>
          </div>
        </div>

        <div className={`${card} p-4`}>
          <p className="text-sm font-bold text-[#111827]">⊹ Positioning Map</p>
          <p className="mb-1 text-[10px] text-[#9AA3B0]">Automation vs. Completeness</p>
          <ScatterChart />
          <p className="mt-2 text-[10px] text-[#6B7280]">◆ AI Insight: StartupKit is the only solution with high automation and high completeness.</p>
        </div>

        <div className={`${card} p-4`}>
          <p className="text-sm font-bold text-[#111827]">⬡ Market Gap Analysis</p>
          <RadarChart />
          <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
            <span style={{ color: "#7C3AED" }}>● Market Need</span><span style={{ color: "#DC2626" }}>● Competitor Avg</span><span style={{ color: "#4F46E5" }}>● StartupKit</span>
          </div>
        </div>
      </div>

      {/* recommendations */}
      <p className="mb-3 mt-6 text-sm font-bold text-[#111827]">✦ AI Strategic Recommendations</p>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {RECS.map((r, i) => (
          <div key={i} className={`${card} p-3`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "#4F46E5" }}>{i + 1}</span>
            <p className="mt-2 text-[11px] text-[#3A414D]">{r}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
        <button className={btnGhost} onClick={onBack}>← Back</button>
        <div className="flex gap-2">
          <button className={btnGhost} onClick={() => A.download(`${A.brandName.toLowerCase().replace(/\s+/g, "-")}-market-report.txt`, report())}>⤓ Export</button>
          <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={async () => { await A.complete("mod:market"); onBack(); }}>{A.has("mod:market") ? "Completed ✓" : "Save & Mark Complete"}</button>
        </div>
      </div>
    </div>
  );
}

function ScatterChart() {
  return (
    <svg viewBox="0 0 200 160" className="w-full">
      <line x1="20" y1="140" x2="190" y2="140" stroke="#E7E9EE" /><line x1="20" y1="10" x2="20" y2="140" stroke="#E7E9EE" />
      <line x1="105" y1="10" x2="105" y2="140" stroke="#F1F3F6" strokeDasharray="3" /><line x1="20" y1="75" x2="190" y2="75" stroke="#F1F3F6" strokeDasharray="3" />
      <text x="105" y="8" fontSize="6" fill="#9AA3B0" textAnchor="middle">High Automation</text>
      <text x="190" y="152" fontSize="6" fill="#9AA3B0" textAnchor="end">High Completeness</text>
      {SCATTER.map((p) => {
        const cx = 20 + (p.x / 100) * 170, cy = 140 - (p.y / 100) * 130;
        return p.star ? (
          <g key={p.n}><circle cx={cx} cy={cy} r="7" fill={O} /><text x={cx} y={cy + 2.5} fontSize="7" fill="#fff" textAnchor="middle">★</text><text x={cx} y={cy - 10} fontSize="6" fill={O} textAnchor="middle" fontWeight="bold">StartupKit</text></g>
        ) : (
          <g key={p.n}><circle cx={cx} cy={cy} r="3" fill="#6B7280" /><text x={cx + 5} y={cy + 2} fontSize="5.5" fill="#6B7280">{p.n}</text></g>
        );
      })}
    </svg>
  );
}

function RadarChart() {
  const cx = 100, cy = 85, r = 62;
  const pt = (vals: number[]) => vals.map((v, i) => {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return `${cx + Math.cos(a) * r * (v / 100)},${cy + Math.sin(a) * r * (v / 100)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 200 175" className="w-full">
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={RADAR_AXES.map((_, i) => { const a = (Math.PI * 2 * i) / 6 - Math.PI / 2; return `${cx + Math.cos(a) * r * f},${cy + Math.sin(a) * r * f}`; }).join(" ")} fill="none" stroke="#EEF0F3" />
      ))}
      <polygon points={pt(RADAR.need)} fill="rgba(124,58,237,.08)" stroke="#7C3AED" strokeWidth="1" />
      <polygon points={pt(RADAR.comp)} fill="none" stroke="#DC2626" strokeWidth="1" strokeDasharray="3" />
      <polygon points={pt(RADAR.kit)} fill="rgba(79,70,229,.12)" stroke="#4F46E5" strokeWidth="1.4" />
      {RADAR_AXES.map((ax, i) => { const a = (Math.PI * 2 * i) / 6 - Math.PI / 2; const x = cx + Math.cos(a) * (r + 12), y = cy + Math.sin(a) * (r + 12); return <text key={ax} x={x} y={y} fontSize="5.5" fill="#9AA3B0" textAnchor="middle">{ax}</text>; })}
    </svg>
  );
}

function CardHead({ n, title, done }: { n: number; title: string; done?: boolean }) {
  const A = useW5();
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF0F3] text-xs font-bold text-[#6B7280]">{n}</span>
      <p className="text-sm font-bold text-[#111827]">{title}</p>
      {done && <span style={{ color: GREEN }}>✓</span>}
      <button onClick={() => A.openChat(`Help me refine my ${title}.`)} className={`${btnGhost} ml-auto !px-3 !py-1 text-xs`}>Edit</button>
    </div>
  );
}
