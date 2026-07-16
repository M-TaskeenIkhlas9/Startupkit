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
} from "@/lib/api";
import type { BrandHealth, BrandState, WorkflowView } from "@/lib/types";

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
    desc: "Generate name ideas and validate across trademark, domain, and social handles.",
    color: "#EA580C", icon: ICON.spark,
    steps: [
      { id: "n1", label: "Generate Name Ideas", status: "done" },
      { id: "n2", label: "Trademark Search", status: "done" },
      { id: "n3", label: "Domain Availability", status: "done" },
      { id: "n4", label: "Social Handle Search", status: "active" },
      { id: "n5", label: "Shortlist & Review", status: "pending" },
      { id: "n6", label: "Final Selection", status: "pending" },
      { id: "n7", label: "Lock Name", status: "pending" },
    ],
  },
  { n: 4, id: "identity", opens: "identity", title: "Brand Identity", desc: "Design your logo, wordmark, and core visual identity.", color: "#EC4899", icon: ICON.brush, steps: allPending(6) },
  { n: 5, id: "design", opens: "design", title: "Design System", desc: "Create your design system, components, and UI foundation.", color: "#F59E0B", icon: ICON.grid, steps: allPending(8) },
  { n: 6, id: "marketing", opens: "launch", title: "Marketing Assets", desc: "Generate pitch decks, one-pagers, and marketing materials.", color: "#16A34A", icon: ICON.mega, steps: allPending(7) },
  { n: 7, id: "os", title: "Brand Operating System", desc: "Your centralized brand OS that powers everything.", color: "#7C3AED", icon: ICON.db, steps: allPending(4) },
];

// "Why this matters" per module — borrowed from the checklist studio's per-step rationale.
const MODULE_WHY: Record<string, string> = {
  strategy: "Everything downstream — name, logo, copy, deck — is built on this. Get it right once.",
  market: "Know who else solves this before you lock positioning — the map turns research into a picture of where you sit versus the field.",
  naming: "A name you can legally own and register across domain and social handles.",
  identity: "The look people recognize before they read a word.",
  design: "Advanced / optional — the reusable UI foundation your product and site are built from. Overlaps W4 (Technical); most pre-seed teams can skip until they have a product team.",
  marketing: "The assets you hand to investors, press, and your first hires.",
  os: "Merged into the Documents & Connections tabs above — that IS your brand operating system: every asset + every connected tool, kept in sync.",
};

function allDone(n: number): Step[] {
  return Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: `Step ${i + 1}`, status: "done" as const }));
}
function allPending(n: number): Step[] {
  return Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: `Step ${i + 1}`, status: "pending" as const }));
}

const HANDLES = [
  { plat: "Twitter/X", handle: "@nexora", status: "Available", c: "#111827", ic: "𝕏" },
  { plat: "LinkedIn", handle: "nexora", status: "Available", c: "#0A66C2", ic: "in" },
  { plat: "Instagram", handle: "@nexora", status: "Taken", c: "#E4405F", ic: "◉" },
  { plat: "YouTube", handle: "@nexora", status: "Available", c: "#FF0000", ic: "▶" },
  { plat: "TikTok", handle: "@nexora", status: "Taken", c: "#111827", ic: "♪" },
  { plat: "Facebook", handle: "nexora", status: "Available", c: "#1877F2", ic: "f" },
];

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
    complete, toggle, saveDraft, finishW5, busy, health, notify, download, openUrl, goWorkflow, openChat,
  };

  let body: React.ReactNode;
  if (section === "strategy") body = <StrategyPage companyName={brandName} onBack={() => setSection(null)} />;
  else if (section === "market") body = <CompetitorAnalysis onBack={() => setSection(null)} />;
  else if (section === "identity") body = <BrandIdentity onBack={() => setSection(null)} onOpenSection={setSection} />;
  else if (section === "logo") body = <LogoGenerator companyName={brandName} onBack={() => setSection("identity")} />;
  else if (section === "digital") body = <DigitalPresence companyName={brandName} onBack={() => setSection("identity")} onOpenSection={setSection} />;
  else if (section === "website") body = <WebsiteBuilder companyName={brandName} onBack={() => setSection("digital")} />;
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
  const [entity, setEntity] = useState<"C-Corp" | "LLC">("C-Corp");

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

      {/* entity note + cross-workflow handoffs (from the checklist studio) */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-[#FDE7D2] bg-[#FFF9F3] px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-[#7A4A1E]">🏛 Delaware {entity}</span>
          <span className="text-[#7A4A1E]">
            Entity barely matters here — only the <b>trade-name filing</b> in Identity differs
            {entity === "LLC" ? " (an LLC may market under a DBA)" : ""}. Positioning, logo, site, and deck are identical.
          </span>
        </span>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-[#F0D6BC] text-xs">
          {(["C-Corp", "LLC"] as const).map((e) => (
            <button key={e} onClick={() => setEntity(e)} className="px-3 py-1 font-semibold"
              style={e === entity ? { background: O, color: "#fff" } : { background: "#fff", color: "#7A4A1E" }}>{e}</button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {([["needs W1 ✓", true, "W1"], ["🔗 → W2 trademark", false, "W2"], ["🔗 ↔ W3 pitch deck", false, "W3"], ["🔗 → W7 go-to-market", false, "W7"]] as [string, boolean, string][]).map(([t, done, code]) => (
          <button key={t} onClick={() => A.goWorkflow(code)} className="rounded-full border px-2.5 py-1 text-[11px] hover:opacity-80"
            style={done ? { borderColor: "#BBE9CD", background: "#EAF7EF", color: "#1E7A3D" } : { borderColor: "#E7E9EE", background: "#fff", color: "#6B7280" }}>{t}</button>
        ))}
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

function NamingDetail({ onOpenSection }: { onOpenSection: (s: string) => void }) {
  const A = useW5();
  const naming = MODULES.find((m) => m.id === "naming")!;
  const [reserved, setReserved] = useState<string[]>([]);
  return (
    <div className="grid gap-5 border-t border-[#EEF0F3] p-4 lg:grid-cols-[220px_1fr]">
      {/* substeps */}
      <div className="space-y-1">
        {naming.steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2"
            style={s.status === "active" ? { background: "#FFF4EC", border: `1px solid ${O}` } : undefined}>
            <span className="text-sm">
              {s.status === "done" ? <span style={{ color: GREEN }}>✓</span> : s.status === "active" ? <span style={{ color: O }}>◉</span> : <span className="text-[#C4CCD6]">○</span>}
            </span>
            <span className="text-xs font-medium text-[#6B7280]">4.{i + 1}</span>
            <span className="text-sm" style={{ color: s.status === "active" ? O : s.status === "done" ? "#111827" : "#9AA3B0", fontWeight: s.status === "active" ? 600 : 400 }}>
              {s.label}
            </span>
            {s.status === "active" && <span className="ml-auto text-[11px] font-medium" style={{ color: O }}>In Progress</span>}
          </div>
        ))}
      </div>

      {/* detail: social handle search */}
      <div>
        <p className="text-sm font-bold text-[#111827]">4.4 Social Handle Search <span className="ml-2 text-xs font-medium" style={{ color: O }}>In Progress</span></p>
        <p className="mt-1 text-xs text-[#6B7280]">We&apos;ll check availability of your name across major social platforms and show you the results.</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="rounded-xl border border-[#E7E9EE]">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold" style={{ color: "#7C3AED" }}>AI Generated Results ✦</span>
              <button onClick={() => A.notify("Re-checking handle availability…")} className="rounded-md border border-[#E7E9EE] px-2 py-1 text-[11px] hover:border-[#c9cfda]">↻ Run Again</button>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[#9AA3B0]">
                <th className="px-3 py-1.5 font-medium">Platform</th><th className="font-medium">Handle</th><th className="font-medium">Status</th><th className="px-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {HANDLES.map((h) => {
                  const isReserved = reserved.includes(h.plat);
                  const status = isReserved ? "Reserved" : h.status;
                  const sColor = isReserved ? "#4F46E5" : h.status === "Available" ? GREEN : "#D97706";
                  return (
                    <tr key={h.plat} className="border-t border-[#F1F3F6]">
                      <td className="px-3 py-2 font-medium text-[#111827]">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white" style={{ background: h.c }}>{h.ic}</span>
                        {h.plat}
                      </td>
                      <td className="text-[#6B7280]">{h.handle}</td>
                      <td style={{ color: sColor }}>● {status}</td>
                      <td className="px-3">
                        <button
                          onClick={() => {
                            if (h.status === "Available") {
                              setReserved((r) => isReserved ? r.filter((p) => p !== h.plat) : [...r, h.plat]);
                              A.notify(isReserved ? `Released ${h.handle} on ${h.plat}` : `Reserved ${h.handle} on ${h.plat} ✓`);
                            } else {
                              A.notify(`Showing alternatives for ${h.plat}`);
                            }
                          }}
                          className="rounded-md border px-2 py-1 text-[11px] hover:border-[#c9cfda]"
                          style={isReserved ? { borderColor: "#4F46E5", color: "#4F46E5", background: "#EEF0FF" } : { borderColor: "#E7E9EE", color: "#3A414D" }}
                        >
                          {isReserved ? "Reserved ✓" : h.status === "Available" ? "Reserve" : "View Alternatives"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-[#E7E9EE] bg-[#F7F5FF] p-3">
            <p className="text-xs font-semibold" style={{ color: "#7C3AED" }}>✦ AI Suggestion</p>
            <p className="mt-2 text-xs text-[#3A414D]">Great news! Your name is available on most key platforms.</p>
            <p className="mt-2 text-xs text-[#6B7280]">Consider these alternatives for taken handles:</p>
            <p className="mt-1 text-xs font-medium" style={{ color: "#7C3AED" }}>@nexora_official<br />@nexora_hq</p>
            <button onClick={() => A.notify("Applied suggested handle alternatives")} className="mt-3 w-full rounded-lg py-2 text-xs font-semibold" style={{ background: "#EDE9FE", color: "#7C3AED" }}>Apply All Alternatives</button>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => A.openChat("Help me shortlist a brand name.")}>✦ Ask AI</button>
          <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={async () => { await A.complete("mod:naming"); onOpenSection("strategy"); }}>Save &amp; Continue →</button>
        </div>
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

function StrategyPage({ companyName, onBack }: { companyName: string; onBack: () => void }) {
  const A = useW5();
  const f = useBrandFacts();
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} className="text-xs text-[#6B7280] hover:text-[#111827]">
        W5 Brand &amp; Product Foundation › <span className="font-medium text-[#111827]">Phase 1: Brand Strategy</span>
      </button>
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
          <StratCard n={1} title="Company Identity" done cols={[
            [["Company Name", companyName], ["Tagline", f.tagline], ["Industry", f.category]],
            [["Mission", f.mission], ["Vision", f.vision]],
          ]} />
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
                <p className="text-xs text-[#9AA3B0]">Brand Archetype</p>
                <p className="text-sm font-semibold text-[#111827]">The Creator</p>
                <p className="mt-2 text-xs text-[#9AA3B0]">Tone of Voice</p>
                <p className="text-sm font-medium text-[#111827]">{f.voice}</p>
              </div>
            </div>
          </div>
          <StratCard n={3} title="Target Audience" done cols={[
            [["Primary Audience", f.icp]],
            [["Market", "United States"], ["Startup Stage", "Pre-seed to Series A"]],
          ]} />
          <div className={`${card} p-5`}>
            <CardHead n={4} title="Value Proposition" done />
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <p className="text-sm text-[#3A414D]">{f.positioning}</p>
              <ul className="space-y-1.5 text-xs text-[#3A414D]">
                {["AI-guided, step-by-step workflows", "Attorney-signed legal documents", "Integrated tools and automations", "Built for startups, by startup operators", "Save months of time and thousands of dollars"].map((p) => (
                  <li key={p} className="flex items-center gap-2"><span style={{ color: GREEN }}>✓</span>{p}</li>
                ))}
              </ul>
            </div>
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
              {([["Name", companyName], ["Tagline", f.tagline], ["Industry", f.category], ["Archetype", "The Creator"], ["Primary Audience", f.icp]] as [string, string][]).map(([k, v]) => (
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
    </div>
  );
}

// ============================ LAUNCH ASSETS (Phase 4) =======================================
const ASSETS = [
  { n: 1, title: "Pitch Deck", desc: "Investor-ready pitch deck 15–20 slides", g: "linear-gradient(135deg,#1a1a2e,#3a2a1a)", action: "Preview" },
  { n: 2, title: "One Pager", desc: "Concise one-pager for investors & partners", g: "linear-gradient(135deg,#f3f4f6,#e5e7eb)", action: "Preview", light: true },
  { n: 3, title: "Brand Book", desc: "Brand guidelines, voice, and visual system", g: "linear-gradient(135deg,#0f172a,#7c2d12)", action: "Preview" },
  { n: 4, title: "Business Cards", desc: "Professional business card designs", g: "linear-gradient(135deg,#111827,#1f2937)", action: "Preview" },
  { n: 5, title: "Email Signature", desc: "Beautiful email signature for your team", g: "linear-gradient(135deg,#f8fafc,#eef2ff)", action: "Preview", light: true },
  { n: 6, title: "Investor Assets", desc: "Investor FAQ, traction and financial summary", g: "linear-gradient(135deg,#f0fdf4,#dcfce7)", action: "Preview", light: true },
  { n: 7, title: "Product Mockups", desc: "High-quality product screens & mockups", g: "linear-gradient(135deg,#0f172a,#1e293b)", action: "Preview" },
  { n: 8, title: "Social Media Kit", desc: "Branded templates for all social platforms", g: "linear-gradient(135deg,#111827,#374151)", action: "Preview" },
  { n: 9, title: "Brand Kit (ZIP)", desc: "Logos, colors, fonts, icons & assets", g: "linear-gradient(135deg,#f8fafc,#f1f5f9)", action: "Download ZIP", light: true },
  { n: 10, title: "Media Kit", desc: "Company overview for press & media", g: "linear-gradient(135deg,#1a1a2e,#3a2a1a)", action: "Preview" },
];

function LaunchAssets({ companyName, onBack }: { companyName: string; onBack: () => void }) {
  const A = useW5();
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} className="text-xs text-[#6B7280] hover:text-[#111827]">W5 / <span className="font-medium text-[#111827]">Launch Assets &amp; Marketing Kit</span></button>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: O }}>🎁</span>
          <div><h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">Phase 4 – Launch Assets &amp; Marketing Kit</h1><p className="text-sm text-[#6B7280]">Create everything you need to launch, pitch, and grow your brand.</p></div>
        </div>
        <div className="flex gap-2"><button className={btnGhost} onClick={() => A.notify("Launch guide opened")}>▤ Guide</button><button className={btnGhost} onClick={() => A.download(`${companyName.toLowerCase().replace(/\s+/g, "-")}-media-kit.txt`, brandSummary(A))}>▤ Resources</button><button onClick={() => A.openChat("Generate all my launch assets — deck, one-pager, social kit.")} className="rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: O, color: O }}>AI Generate All Assets →</button></div>
      </div>

      <div className="mt-5"><PhaseBar active={4} /></div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_300px]">
        <div>
          <div className="flex items-center justify-between rounded-xl border border-[#FDE7D2] bg-[#FFF9F3] p-3 text-xs">
            <span style={{ color: "#7A4A1E" }}>✦ <b>You&apos;re in the final step!</b> Generate all your launch assets and download your complete marketing kit.</span>
            <button onClick={() => A.openChat("How does the launch assets step work?")} className="rounded-md border border-[#F0D6BC] px-2 py-1" style={{ color: "#7A4A1E" }}>ⓘ How this works</button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {ASSETS.map((a) => (
              <div key={a.n} className={`${card} p-3`}>
                <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F1F3F6] text-xs font-bold text-[#6B7280]">{a.n}</span><p className="text-xs font-bold text-[#111827]">{a.title}</p></div>
                <p className="mt-1 text-[10px] text-[#9AA3B0]">{a.desc}</p>
                <div className="mt-2 flex h-20 items-center justify-center rounded-lg text-[10px] font-semibold" style={{ background: a.g, color: a.light ? "#6B7280" : "rgba(255,255,255,.85)" }}>
                  {a.title === "Investor Assets" ? "$125K MRR · 120% ↑" : companyName}
                </div>
                <p className="mt-2 text-[11px] font-medium" style={{ color: GREEN }}>✓ Completed</p>
                <button onClick={() => a.action.startsWith("Download") ? A.download(`${a.title.toLowerCase().replace(/\s+/g, "-")}.txt`, `${a.title}\n\n${brandSummary(A)}`) : A.notify(`Previewing ${a.title}`)} className="mt-1 w-full rounded-lg border border-[#E7E9EE] py-1.5 text-[11px] font-semibold text-[#3A414D] hover:border-[#c9cfda]">{a.action}</button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FDE7D2] bg-[#FFF9F3] p-3">
            <span className="text-xs" style={{ color: "#7A4A1E" }}>🎁 <b>All assets are ready!</b> Download your complete marketing kit or go back to edit any asset.</span>
            <button className={btnO} style={{ background: O }} onClick={() => A.download(`${companyName.toLowerCase().replace(/\s+/g, "-")}-marketing-kit.txt`, brandSummary(A))}>Download All Assets ↓</button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Previous: Phase 3</button>
            <div className="flex gap-2"><button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Draft"}</button><button className={btnGhost} onClick={() => A.download(`${companyName.toLowerCase().replace(/\s+/g, "-")}-assets.txt`, brandSummary(A))}>◉ Preview All Assets</button><button className={btnO} style={{ background: O }} disabled={A.busy} onClick={async () => { await A.complete("mod:marketing", { silent: true }); await A.finishW5(); onBack(); }}>Complete W5 &amp; Continue →</button></div>
          </div>
        </div>

        {/* right rail */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E7E9EE] bg-[#F7F5FF] p-4">
            <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>AI Assistant <span className="ml-1 rounded bg-[#EDE9FE] px-1.5 py-0.5 text-[10px]">Beta</span></p>
            <div className="mt-2 flex items-center justify-between text-xs"><span className="text-[#6B7280]">Overall Progress</span><span className="font-semibold" style={{ color: O }}>83%</span></div>
            <div className="mt-1"><Progress pct={83} /></div>
            <p className="mt-2 text-xs text-[#6B7280]">You&apos;re almost ready to launch!</p>
            <p className="mt-3 text-xs font-bold text-[#111827]">AI Suggestions</p>
            <div className="mt-2 space-y-2 text-xs text-[#3A414D]">
              {[["Customize your pitch deck for AI investors", "We can tailor it for you"], ["Add more testimonials to your one pager", "Build more social proof"], ["Optimize your LinkedIn description", "Improve your discoverability"]].map(([t, d]) => (
                <div key={t}><p className="font-medium text-[#111827]">{t}</p><p className="text-[11px] text-[#9AA3B0]">{d}</p></div>
              ))}
            </div>
          </div>
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-[#111827]">Asset Quality Score</p><span className="text-sm font-bold" style={{ color: GREEN }}>94/100</span></div>
            <div className="mt-2"><Progress pct={94} color={GREEN} /></div>
            <p className="mt-1 text-xs text-[#6B7280]">Excellent! Your assets are top-notch.</p>
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
      <button onClick={onBack} className="text-xs text-[#6B7280] hover:text-[#111827]">← Back · <span className="font-medium text-[#111827]">W5 › {badge}</span></button>
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
    <SectionShell badge="Design System" title="Design System" desc="Tokens, type, and components — the reusable UI foundation, generated from your Brand Identity." onBack={onBack}
      banner={<div className="rounded-xl border border-[#FDE7D2] bg-[#FFF9F3] p-3 text-xs text-[#7A4A1E]"><b>⚠ Advanced / optional.</b> Overlaps <b>W4 · Technical Infrastructure</b>. Tokens = reusable design decisions (color, spacing, type); most pre-seed teams start here and expand later.</div>}>
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

      {/* the whole system applied to a real site — the "website builder" preview */}
      <div className={`${card} mt-4 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <H3>Applied to your website <span className="font-normal text-[#9AA3B0]">— tokens, type &amp; logo in a live layout</span></H3>
          <div className="flex gap-2">
            <button onClick={() => A.openUrl(publishedSiteUrl(A.companyId))} className={btnGhost}>◉ Open live site ↗</button>
            <button onClick={() => onBack()} className={btnGhost}>Open Website Builder →</button>
          </div>
        </div>
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

// ============================ DIGITAL PRESENCE (Phase 3) ====================================
// AI-generated website preview — faithful to the Website Builder mock: nav, bold hero with orange
// CTA, a Revenue Overview dashboard card, a trusted-by row, and a Powerful Features section.
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

const DP_PAGES = [
  ["Homepage", true], ["About Us", true], ["Features", true], ["Pricing", true], ["Contact", true], ["Blog", true], ["Terms of Service", true], ["Privacy Policy", true],
] as [string, boolean][];
const DP_CHECK = [
  ["Domain Connected", true], ["SSL Certificate Active", true], ["Website Built", true], ["Terms of Service Added", true], ["Privacy Policy Added", true], ["Analytics Connected", true], ["Contact Form Tested", true], ["Cookie Policy Added", false], ["Social Profiles Created", false], ["Professional Email Setup", true], ["SEO Optimization", true],
] as [string, boolean][];

function DigitalPresence({ companyName, onBack, onOpenSection }: { companyName: string; onBack: () => void; onOpenSection: (s: string) => void }) {
  const A = useW5();
  const [vp, setVp] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} className="text-xs text-[#6B7280] hover:text-[#111827]">W5 / <span className="font-medium text-[#111827]">Digital Presence &amp; Brand Infrastructure</span></button>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: "#2563EB" }}>▧</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">Phase 3 – Digital Presence &amp; Brand Infrastructure</h1>
            <p className="text-sm text-[#6B7280]">Build your online presence and launch your brand to the world.</p>
          </div>
        </div>
        <div className="flex gap-2"><button className={btnGhost} onClick={() => A.notify("Digital presence guide opened")}>▤ Guide</button><button className={btnGhost} onClick={() => A.openUrl(publishedSiteUrl(A.companyId))}>▤ Resources</button><button onClick={() => A.openChat("Build my full digital presence — website, SEO, and social.")} className="rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: O, color: O }}>✦ AI Build Everything →</button></div>
      </div>

      {/* stat tiles */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[["🌐", "Domain", `${companyName.toLowerCase().replace(/\s+/g, "")}.ai`, "✓ Connected", GREEN, "#DCFCE7"], ["🖥", "Website", "92%", "Ready", "#6D5BF6", "#EDE9FE"], ["📈", "SEO Score", "81/100", "Good", "#D97706", "#FEF3C7"], ["🚀", "Launch Score", "88/100", "Great", GREEN, "#DCFCE7"]].map(([ic, label, val, sub, col, bg]) => (
          <div key={label as string} className={`${card} p-4`}>
            <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: bg as string }}>{ic}</span><span className="text-sm font-semibold text-[#3A414D]">{label}</span></div>
            <p className="mt-2 text-lg font-extrabold text-[#111827]">{val}</p>
            <p className="text-xs font-medium" style={{ color: col as string }}>{sub}</p>
            {label === "Website" && <div className="mt-1"><Progress pct={92} color="#6D5BF6" /></div>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className={`${card} p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#111827]">🔵 3.3 Website Builder <span className="ml-1 text-xs font-normal text-[#9AA3B0]">AI generates your website pages with your brand and messaging.</span></p>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-[#E7E9EE] p-0.5 text-[11px]">
                {(["Desktop", "Tablet", "Mobile"] as const).map((v) => (
                  <button key={v} onClick={() => setVp(v)} className="rounded-md px-2 py-1" style={vp === v ? { background: "#EEF0FF", color: "#4F46E5" } : { color: "#9AA3B0" }}>{v}</button>
                ))}
              </div>
              <button className={btnGhost} onClick={() => A.openUrl(publishedSiteUrl(A.companyId))}>◉ Preview</button><button className={btnO} style={{ background: O }} onClick={() => A.notify("Publishing your website…")}>🚀 Publish</button>
            </div>
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-[170px_1fr]">
            <div>
              <p className="mb-1 text-xs font-semibold text-[#6B7280]">Pages <span className="float-right text-[#9AA3B0]">8/8</span></p>
              <div className="space-y-1">
                {DP_PAGES.map(([p, done], i) => (
                  <div key={p} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs" style={i === 0 ? { background: "#FFF4EC" } : undefined}>
                    <span className="text-[#3A414D]">{p}</span><span style={{ color: done ? GREEN : "#C4CCD6" }}>✓</span>
                  </div>
                ))}
                <button onClick={() => A.notify("New page added to your site")} className="mt-1 w-full rounded-lg border border-dashed border-[#D7DCDA] py-1.5 text-xs text-[#6B7280] hover:border-[#c9cfda]">+ Add Page</button>
              </div>
            </div>
            <SitePreview companyName={companyName} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["↻ Regenerate Page", "✎ Rewrite Copy", "⇄ Change Style", "◎ Optimize SEO", "▤ Add Section"].map((a) => (
              <button key={a} className={btnGhost} onClick={() => onOpenSection("website")}>{a}</button>
            ))}
          </div>
        </div>

        {/* right rail */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E7E9EE] bg-[#F7F5FF] p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-bold" style={{ color: "#7C3AED" }}>◈ StartupKit AI</p></div>
            <div className="mt-2 flex items-center justify-between text-xs"><span className="text-[#6B7280]">Progress</span><span className="font-semibold" style={{ color: "#7C3AED" }}>83% Complete</span></div>
            <div className="mt-1"><Progress pct={83} color="#7C3AED" /></div>
            <p className="mt-2 text-xs text-[#6B7280]">You&apos;re doing great! 2 steps left to launch.</p>
            <p className="mt-3 text-xs font-bold text-[#111827]">AI Suggestions</p>
            <div className="mt-2 space-y-2 text-xs text-[#3A414D]">
              {[["Connect Google Analytics", "Track your website visitors"], ["Create careers email", "Add jobs@" + companyName.toLowerCase().replace(/\s+/g, "") + ".ai"], ["Improve SEO title", "Your title can rank higher"], ["Publish your website", "Go live and get discovered"]].map(([t, d]) => (
                <div key={t}><p className="font-medium text-[#111827]">{t}</p><p className="text-[11px] text-[#9AA3B0]">{d}</p></div>
              ))}
            </div>
            <button onClick={() => A.openChat("Show me all suggestions to improve my website.")} className="mt-3 w-full rounded-lg border border-[#E7E9EE] bg-white py-2 text-xs font-semibold" style={{ color: "#7C3AED" }}>View All Suggestions</button>
          </div>
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-[#111827]">Publishing Checklist</p><span className="text-xs text-[#9AA3B0]">9 / 11 Completed</span></div>
            <div className="mt-3 space-y-1.5 text-xs">
              {DP_CHECK.map(([l, done]) => (
                <div key={l} className="flex items-center gap-2"><span style={{ color: done ? GREEN : "#C4CCD6" }}>{done ? "✓" : "○"}</span><span className="text-[#3A414D]">{l}</span></div>
              ))}
            </div>
            <button onClick={() => A.openUrl(publishedSiteUrl(A.companyId))} className="mt-3 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: O }}>🚀 Publish Website<br /><span className="text-[10px] font-normal opacity-80">Go live in one click</span></button>
          </div>
        </aside>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
        <button className={btnGhost} onClick={onBack}>← Previous</button>
        <div className="flex gap-2"><button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Draft"}</button><button className={btnGhost} onClick={() => A.openUrl(publishedSiteUrl(A.companyId))}>◉ Preview Website</button><button className={btnO} style={{ background: O }} onClick={() => onOpenSection("launch")}>Continue to Phase 4 →</button></div>
      </div>
    </div>
  );
}

// ============================ WEBSITE BUILDER (full, W5.3) ===================================
const WB_STEPS = ["Domain & Hosting", "Website Builder", "Pages & Content", "Design & Style", "SEO & Settings", "Review & Publish"];
const WB_BUILD = ["Business Information", "ICP & Messaging", "Key Features", "Social Proof", "FAQ", "Call To Action", "AI Generate Website"] as string[];
const WB_STRUCT = [["Homepage", "7 sections"], ["Features", "6 sections"], ["About Us", "5 sections"], ["Pricing", "4 sections"], ["Contact", "4 sections"], ["Privacy Policy", "1 section"], ["Terms of Service", "1 section"]] as [string, string][];

function WebsiteBuilder({ companyName, onBack }: { companyName: string; onBack: () => void }) {
  const A = useW5();
  const [vp, setVp] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} className="text-xs text-[#6B7280] hover:text-[#111827]">W5 / Digital Presence / <span className="font-medium text-[#111827]">Website Builder</span></button>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: O }}>▤</span>
          <div><h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">W5.3 Website Builder</h1><p className="text-sm text-[#6B7280]">Create a professional, high-converting website for your startup in minutes.</p></div>
        </div>
        <div className="flex gap-2"><button className={btnGhost} onClick={() => A.notify("Website builder guide opened")}>▤ Guide</button><button className={btnGhost} onClick={() => A.openUrl(publishedSiteUrl(A.companyId))}>▤ Resources</button><button className={btnGhost} onClick={() => A.openUrl(publishedSiteUrl(A.companyId))}>◉ Preview Site ↗</button><button className={btnO} style={{ background: O }} onClick={() => A.notify("Publishing your website…")}>Publish Website</button></div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1 rounded-2xl border border-[#E7E9EE] bg-white p-4">
        {WB_STEPS.map((s, i) => { const n = i + 1, done = n === 1, cur = n === 2; return (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: done ? "#DCFCE7" : cur ? O : "#F1F3F6", color: done ? GREEN : cur ? "#fff" : "#9AA3B0" }}>{done ? "✓" : n}</span>
            <span className="text-xs font-medium" style={{ color: cur ? "#111827" : done ? "#3A414D" : "#9AA3B0" }}>{s}</span>
            {i < WB_STEPS.length - 1 && <span className="mx-1 hidden flex-1 border-t border-dashed border-[#E7E9EE] lg:block" />}
          </div>
        ); })}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[230px_1fr_260px]">
        {/* left build + structure */}
        <aside className="space-y-4">
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">1. Build Your Website</p>
            <p className="mt-1 text-xs text-[#6B7280]">We&apos;ll generate a website for you based on your brand and inputs.</p>
            <div className="mt-3 space-y-2">
              {WB_BUILD.map((b, i) => (
                <div key={b} className="flex items-center justify-between text-xs"><span className="text-[#3A414D]">{b}</span><span style={{ color: i < 7 - 1 ? GREEN : O }}>{i < 7 - 1 ? "✓ Completed" : "○ In Progress"}</span></div>
              ))}
            </div>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">Website Structure</p>
            <div className="mt-3 space-y-1">
              {WB_STRUCT.map(([p, s], i) => (
                <div key={p} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs" style={i === 0 ? { background: "#FFF4EC", color: O } : { color: "#3A414D" }}><span>{p}</span><span className="text-[#9AA3B0]">{s}</span></div>
              ))}
              <button onClick={() => A.notify("New page added to your site")} className="mt-1 w-full rounded-lg border border-dashed border-[#D7DCDA] py-1.5 text-xs text-[#6B7280] hover:border-[#c9cfda]">+ Add New Page</button>
            </div>
          </div>
        </aside>

        {/* center preview */}
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#111827]">AI Generated Website <span className="text-xs font-normal text-[#9AA3B0]">(You can edit everything)</span></p>
            <div className="flex rounded-lg border border-[#E7E9EE] p-0.5 text-[11px]">
              {(["Desktop", "Tablet", "Mobile"] as const).map((v) => (
                <button key={v} onClick={() => setVp(v)} className="rounded-md px-2 py-1" style={vp === v ? { background: "#FFF4EC", color: O } : { color: "#9AA3B0" }}>{v}</button>
              ))}
            </div>
          </div>
          <div className="mt-3"><SitePreview companyName={companyName} dark={false} /></div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F7F8FA] p-2 text-[11px] text-[#6B7280]"><span>This is an AI-generated draft. You can edit any text, image, layout, or style.</span><button className={btnGhost} onClick={() => A.notify("Regenerating your website…")}>↻ Regenerate Website</button></div>
        </div>

        {/* right rail */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E7E9EE] bg-[#F7F5FF] p-4">
            <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>AI Assistant <span className="ml-1 rounded bg-[#EDE9FE] px-1.5 py-0.5 text-[10px]">Beta</span></p>
            <p className="mt-2 text-xs text-[#3A414D]">I&apos;ve built your website based on your brand and inputs. Here are some suggestions to improve it.</p>
            <div className="mt-3 space-y-2 text-xs">
              {[["Add a customer testimonial section to increase trust.", "Add Section"], ["Your headline is strong! Consider A/B testing this variation.", "Try Variation"], ["Add integration logos to boost credibility.", "Add Integrations"]].map(([t, b]) => (
                <div key={t}><p className="text-[#3A414D]">{t}</p><button onClick={() => A.notify(`${b} — applied`)} className="mt-1 rounded-md border border-[#E7E9EE] bg-white px-2 py-0.5 text-[10px] hover:border-[#c9cfda]" style={{ color: "#7C3AED" }}>{b}</button></div>
              ))}
            </div>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">Design &amp; Style</p>
            <p className="mt-2 text-xs text-[#9AA3B0]">Current Theme</p><p className="text-sm font-medium text-[#111827]">Modern Clean</p>
            <p className="mt-2 text-xs text-[#9AA3B0]">Primary Color</p>
            <div className="mt-1 flex gap-1.5">{[O, "#111827", "#2563EB", "#16A34A", "#7C3AED", "#9AA3B0"].map((c) => <span key={c} className="h-6 w-6 rounded-md" style={{ background: c }} />)}</div>
            <button onClick={() => A.openChat("Help me customize my website design.")} className="mt-3 w-full rounded-lg border border-[#E7E9EE] py-2 text-xs font-semibold text-[#3A414D] hover:border-[#c9cfda]">Customize Design</button>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">Integrations</p>
            <div className="mt-2 space-y-2 text-xs">
              {[["Google Analytics", true], ["Google Search Console", true], ["Hotjar", false]].map(([n, on]) => (
                <div key={n as string} className="flex items-center justify-between"><span className="text-[#3A414D]">{n}</span><span style={{ color: on ? GREEN : "#9AA3B0" }}>{on ? "Connected" : "Not Connected"}</span></div>
              ))}
            </div>
            <button onClick={() => A.notify("Manage integrations — opening settings")} className="mt-3 w-full rounded-lg border border-[#E7E9EE] py-2 text-xs font-semibold text-[#3A414D] hover:border-[#c9cfda]">Manage Integrations</button>
          </div>
        </aside>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
        <button className={btnGhost} onClick={onBack}>← Previous: Domain &amp; Hosting</button>
        <div className="flex gap-2"><button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Progress"}</button><button className={btnO} style={{ background: O }} onClick={() => A.notify("Moving to Pages & Content")}>Next: Pages &amp; Content →</button></div>
      </div>
    </div>
  );
}

// ============================ LOGO GENERATOR ================================================
const LOGO_STEPS = ["Brand Name", "Logo Generation", "Mockup Preview", "Colors & Typography", "Brand Guidelines", "Trademark Review"];
const LOGO_MARKS = [
  '<path d="M12 3l9 18H3z" fill="url(#g)"/>', // A triangle
  '<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" fill="url(#g)"/>', // hexagon
  '<rect x="4" y="13" width="3.5" height="7" rx="1" fill="url(#g)"/><rect x="10" y="9" width="3.5" height="11" rx="1" fill="url(#g)"/><rect x="16" y="5" width="3.5" height="15" rx="1" fill="url(#g)"/>', // bars
  '<path d="M12 3l8 8-8 10L4 11z" fill="url(#g)"/>', // diamond/A
  '<circle cx="7" cy="8" r="2.5" fill="url(#g)"/><circle cx="17" cy="8" r="2.5" fill="url(#g)"/><circle cx="12" cy="16" r="2.5" fill="url(#g)"/><path d="M7 8l5 8 5-8" stroke="url(#g)" stroke-width="1.5" fill="none"/>', // nodes
  '<path d="M5 19L12 5l7 14" stroke="url(#g)" stroke-width="3" fill="none" stroke-linecap="round"/>', // A stroke
];
function LogoGenerator({ companyName, onBack }: { companyName: string; onBack: () => void }) {
  const A = useW5();
  const f = useBrandFacts();
  const [selected, setSelected] = useState(1);
  const [liked, setLiked] = useState<number[]>([]);
  const grad = (
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4F46E5" /><stop offset="1" stopColor="#06B6D4" /></linearGradient></defs>
  );
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} className="text-xs text-[#6B7280] hover:text-[#111827]">W5 › Identity › <span className="font-medium text-[#111827]">Logo Generation</span></button>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: O }}>◒</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">2.2 Logo Generation</h1>
            <p className="text-sm text-[#6B7280]">Generate multiple logo concepts for your brand. Choose the one that best represents your vision.</p>
          </div>
        </div>
        <div className="flex gap-2"><button className={btnGhost} onClick={() => A.notify("Logo guide opened")}>▤ Guide</button><button className={btnGhost} onClick={() => A.openUrl(brandWordmarkUrl(A.companyId))}>▤ Resources</button><button className={btnGhost} onClick={() => A.openUrl(brandWordmarkUrl(A.companyId))}>⇱ Share</button></div>
      </div>

      {/* step bar */}
      <div className="mt-5 flex flex-wrap items-center gap-1 rounded-2xl border border-[#E7E9EE] bg-white p-4">
        {LOGO_STEPS.map((s, i) => {
          const n = i + 1, done = n === 1, cur = n === 2;
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: done ? "#DCFCE7" : cur ? O : "#F1F3F6", color: done ? GREEN : cur ? "#fff" : "#9AA3B0" }}>{done ? "✓" : n}</span>
              <span className="text-xs font-medium" style={{ color: cur ? "#111827" : done ? "#3A414D" : "#9AA3B0" }}>{s}</span>
              {i < LOGO_STEPS.length - 1 && <span className="mx-1 hidden flex-1 border-t border-dashed border-[#E7E9EE] lg:block" />}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[280px_1fr]">
        {/* left: inputs + prefs */}
        <aside className="space-y-4">
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-[#111827]">Brand Inputs</p><button onClick={() => A.openChat("Help me refine the inputs for my logo.")} className="text-xs" style={{ color: "#4F46E5" }}>✎ Edit</button></div>
            <div className="mt-3 space-y-3 text-xs">
              {([["Brand Name", companyName], ["Industry", f.category], ["Positioning", f.positioning], ["Brand Personality", f.values.join(", ")], ["Color Preference", "Blue, Purple, Teal"], ["Style Preference", "Minimal, Clean, Geometric"]] as [string, string][]).map(([k, v]) => (
                <div key={k}><p className="text-[#9AA3B0]">{k}</p><p className="font-medium text-[#111827]">{v}</p></div>
              ))}
            </div>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-sm font-bold text-[#111827]">Design Preferences</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Minimal", "Modern", "Bold", "Techy", "Playful", "Classic"].map((d, i) => (
                <span key={d} className="rounded-lg border px-2.5 py-1 text-xs" style={i === 0 ? { borderColor: "#4F46E5", color: "#4F46E5", background: "#EEF0FF" } : { borderColor: "#E7E9EE", color: "#6B7280" }}>{d} {i === 0 ? "✓" : ""}</span>
              ))}
            </div>
            <p className="mt-3 text-sm font-bold text-[#111827]">Layout Preference</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
              {["Icon + Text", "Icon Above", "Icon Only"].map((l, i) => (
                <div key={l} className="rounded-lg border p-2" style={i === 0 ? { borderColor: "#4F46E5", background: "#EEF0FF", color: "#4F46E5" } : { borderColor: "#E7E9EE", color: "#6B7280" }}>▦<br />{l}</div>
              ))}
            </div>
            <p className="mt-3 text-sm font-bold text-[#111827]">Icon Style</p>
            <div className="mt-2 flex gap-2">
              {["Geometric", "Abstract", "Symbolic"].map((s, i) => (
                <span key={s} className="flex-1 rounded-lg border px-2 py-1 text-center text-[11px]" style={i === 0 ? { borderColor: "#4F46E5", color: "#4F46E5", background: "#EEF0FF" } : { borderColor: "#E7E9EE", color: "#6B7280" }}>{s} {i === 0 ? "✓" : ""}</span>
              ))}
            </div>
          </div>
        </aside>

        {/* center: concepts */}
        <div>
          <div className="flex items-center justify-between">
            <div><p className="text-lg font-extrabold text-[#111827]">Logo Concepts <span className="ml-1 rounded bg-[#EDE9FE] px-1.5 py-0.5 text-[10px]" style={{ color: "#7C3AED" }}>AI Generated</span></p><p className="text-xs text-[#6B7280]">Choose your favorite logo or regenerate more options.</p></div>
            <div className="flex gap-2"><button className={btnGhost} onClick={() => A.notify("Regenerating logo concepts…")}>↻ Regenerate</button><button className={btnGhost} onClick={() => A.openChat("Refine my logo prompt.")}>⇄ Refine Prompt</button></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {LOGO_MARKS.map((m, i) => (
              <button key={i} onClick={() => setSelected(i)} className={`${card} flex flex-col items-center justify-center p-6 text-center`} style={i === selected ? { borderColor: "#4F46E5", borderWidth: 2 } : undefined}>
                <div className="mb-2 flex w-full items-center justify-between">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EEF0FF] text-xs font-bold" style={{ color: "#4F46E5" }}>{String.fromCharCode(65 + i)}</span>
                  <span onClick={(e) => { e.stopPropagation(); setLiked((l) => l.includes(i) ? l.filter((x) => x !== i) : [...l, i]); }} style={{ color: liked.includes(i) ? "#EC4899" : "#C4CCD6" }}>{liked.includes(i) ? "♥" : "♡"}</span>
                </div>
                <svg viewBox="0 0 24 24" className="h-10 w-10">{grad}<g dangerouslySetInnerHTML={{ __html: m }} /></svg>
                <p className="mt-2 text-sm font-bold text-[#111827]">{companyName}</p>
              </button>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-[#F5F3FF] p-3 text-xs" style={{ color: "#6D5BD0" }}>✦ These logos are AI-generated based on your brand inputs. You can refine the prompt and regenerate for more options.</p>

          <div className={`${card} mt-4 p-4`}>
            <p className="text-sm font-bold text-[#111827]">Selected Logo Preview</p>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#EEF0F3] py-4">
                <svg viewBox="0 0 24 24" className="h-9 w-9">{grad}<g dangerouslySetInnerHTML={{ __html: LOGO_MARKS[selected] }} /></svg>
                <p className="mt-1 text-sm font-bold text-[#111827]">{companyName}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Selected: <b className="text-[#111827]">Option {String.fromCharCode(65 + selected)}</b> <span className="rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[10px]" style={{ color: GREEN }}>Recommended</span></p>
                <ul className="mt-2 space-y-1 text-xs text-[#3A414D]">
                  {["Clean and professional", "Great scalability", "Works well across digital platforms"].map((x) => <li key={x} className="flex gap-1.5"><span style={{ color: GREEN }}>✓</span>{x}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">File Formats You&apos;ll Get</p>
                <div className="mt-2 flex gap-2">{["SVG", "PNG", "JPG", "PDF"].map((f) => <span key={f} className="rounded-lg bg-[#F1F3F6] px-2 py-1 text-[10px] font-semibold text-[#6B7280]">{f}</span>)}</div>
                <p className="mt-2 text-[11px]" style={{ color: "#4F46E5" }}>+ Favicon (ICO)</p><p className="text-[11px]" style={{ color: "#4F46E5" }}>+ Monochrome Version</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Previous: Brand Name</button>
            <div className="flex gap-2"><button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Progress"}</button><button className={btnO} style={{ background: O }} onClick={() => { A.notify(`Logo Option ${String.fromCharCode(65 + selected)} selected`); onBack(); }}>Select This Logo &amp; Continue →</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================ shared: 4-phase bar ============================================
const PHASES = ["Brand Strategy", "Brand Identity", "Digital Presence", "Launch Assets"];
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
type IdCard = { n: number; title: string; desc: string; icon: string; color: string; bg: string; status: "done" | "active" | "pending"; opens?: string; text?: boolean };
const ID_CARDS: IdCard[] = [
  { n: 1, title: "Logo Design", desc: "Create a professional logo that represents your brand.", icon: ICON.brush, color: "#EF4444", bg: "#FEE2E2", status: "done", opens: "logo" },
  { n: 2, title: "Color Palette", desc: "Choose colors that define your brand personality.", icon: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.3"/><circle cx="12" cy="8" r="1.3"/><circle cx="16" cy="10" r="1.3"/>', color: "#8B5CF6", bg: "#EDE9FE", status: "active" },
  { n: 3, title: "Typography", desc: "Select fonts that communicate your brand voice.", icon: "", text: true, color: "#3B82F6", bg: "#DBEAFE", status: "pending" },
  { n: 4, title: "Brand Guidelines", desc: "Create guidelines for consistent brand usage.", icon: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>', color: "#10B981", bg: "#D1FAE5", status: "pending" },
  { n: 5, title: "Brand Voice", desc: "Define your brand voice and tone of communication.", icon: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>', color: "#F59E0B", bg: "#FEF3C7", status: "done" },
  { n: 6, title: "Brand Story", desc: "Craft your brand story and mission statement.", icon: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>', color: "#EC4899", bg: "#FCE7F3", status: "done" },
  { n: 7, title: "Iconography", desc: "Create icon set for your product and platform.", icon: '<path d="M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17l-5.5 4L7 14.5 3 10l6.5-.5z"/>', color: "#8B5CF6", bg: "#EDE9FE", status: "pending" },
  { n: 8, title: "Brand Assets Library", desc: "Organize and download all your brand assets.", icon: '<path d="M4 7h6l2 2h8v9a2 2 0 01-2 2H4z"/>', color: "#F97316", bg: "#FFEDD5", status: "pending" },
];

function BrandIdentity({ onBack, onOpenSection }: { onBack: () => void; onOpenSection: (s: string) => void }) {
  const A = useW5();
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} className="text-xs text-[#6B7280] hover:text-[#111827]">← Back · <span className="font-medium text-[#111827]">W5 › Brand &amp; Presence</span></button>
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
            <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold" style={{ color: GREEN }}>8/8 Completed ✓</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ID_CARDS.map((c) => {
              const cur = c.status === "active";
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
                    {c.status === "done" && <p className="text-xs font-medium" style={{ color: GREEN }}>✓ Completed</p>}
                    {c.status === "active" && <p className="text-xs font-medium" style={{ color: O }}>○ In Progress</p>}
                    {c.status === "pending" && <p className="text-xs text-[#9AA3B0]">○ Pending</p>}
                  </div>
                  <button
                    className={`mt-2 w-full rounded-lg py-2 text-xs font-semibold ${c.status === "active" ? "text-white" : "border border-[#E7E9EE] text-[#3A414D]"}`}
                    style={c.status === "active" ? { background: O } : undefined}
                    onClick={() => (c.opens ? onOpenSection(c.opens) : A.openChat(`Help me with: ${c.title}.`))}
                  >
                    {c.status === "done" ? (c.opens ? "View Logo" : "View") : c.status === "active" ? "Continue" : "Start"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-[#FDE7D2] bg-[#FFF9F3] p-3 text-xs text-[#7A4A1E]">
            <b>💡 Next up: Typography</b> — Choose fonts that perfectly match your brand personality and improve readability.
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-5">
            <button className={btnGhost} onClick={onBack}>← Previous: Brand Strategy</button>
            <div className="flex gap-2">
              <button className={btnGhost} disabled={A.busy} onClick={A.saveDraft}>⤓ {A.busy ? "Saving…" : "Save Progress"}</button>
              <button className={btnO} style={{ background: O }} disabled={A.busy} onClick={async () => { await A.complete("mod:identity"); onOpenSection("digital"); }}>Next: Digital Presence →</button>
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
      <button onClick={onBack} className="text-xs text-[#6B7280] hover:text-[#111827]">← Back to Market Research</button>
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
function StratCard({ n, title, done, cols }: { n: number; title: string; done?: boolean; cols: [string, string][][] }) {
  return (
    <div className={`${card} p-5`}>
      <CardHead n={n} title={title} done={done} />
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {cols.map((col, i) => (
          <div key={i} className="space-y-3">
            {col.map(([k, v]) => (
              <div key={k}><p className="text-xs text-[#9AA3B0]">{k}</p><p className="text-sm font-medium text-[#111827]">{v}</p></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
