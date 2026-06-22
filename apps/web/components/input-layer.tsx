"use client";

import { useState } from "react";
import {
  addEvidence,
  addMilestone,
  addNote,
  connectIntegration,
  setFounderProfile,
} from "@/lib/api";
import type { CompanySnapshot } from "@/lib/types";

const PROVIDERS: { provider: string; capability: string }[] = [
  { provider: "Mercury", capability: "banking" },
  { provider: "Brex", capability: "banking" },
  { provider: "GitHub", capability: "code" },
  { provider: "QuickBooks", capability: "accounting" },
  { provider: "Carta", capability: "captable" },
  { provider: "Stripe", capability: "payments" },
  { provider: "Vanta", capability: "compliance" },
];

export function InputLayer({ initial }: { initial: CompanySnapshot }) {
  const [snap, setSnap] = useState<CompanySnapshot>(initial);
  const id = snap.company_id;

  return (
    <div className="space-y-6">
      <ProfileCard snap={snap} onSave={setSnap} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MilestonesCard snap={snap} onChange={setSnap} />
        <IntegrationsCard snap={snap} onChange={setSnap} id={id} />
        <ConversationsCard snap={snap} onChange={setSnap} />
        <EvidenceCard snap={snap} onChange={setSnap} />
      </div>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mb-4 text-xs text-muted">{hint}</p>
      {children}
    </div>
  );
}

function ProfileCard({
  snap,
  onSave,
}: {
  snap: CompanySnapshot;
  onSave: (s: CompanySnapshot) => void;
}) {
  const p = snap.founder_profile;
  const [f, setF] = useState(p);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  async function save() {
    setBusy(true);
    try {
      onSave(await setFounderProfile(snap.company_id, f));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Founder profile" hint="Who you are — goals, background, and risk tolerance.">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Name</span>
          <input className="field-input" value={f.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="block">
          <span className="field-label">Risk tolerance</span>
          <select className="field-input" value={f.risk_tolerance || "balanced"} onChange={(e) => set({ risk_tolerance: e.target.value })}>
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">Background</span>
          <textarea className="field-input min-h-[60px] resize-none" value={f.background} onChange={(e) => set({ background: e.target.value })} placeholder="Relevant experience…" />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">Goals</span>
          <textarea className="field-input min-h-[60px] resize-none" value={f.goals} onChange={(e) => set({ goals: e.target.value })} placeholder="What you want to achieve…" />
        </label>
        <label className="block">
          <span className="field-label">Experience</span>
          <select className="field-input" value={f.experience || "first-time"} onChange={(e) => set({ experience: e.target.value })}>
            <option value="first-time">First-time</option>
            <option value="some-experience">Some experience</option>
            <option value="serial">Serial founder</option>
          </select>
        </label>
        <label className="block">
          <span className="field-label">Commitment</span>
          <select className="field-input" value={f.time_commitment || "full-time"} onChange={(e) => set({ time_commitment: e.target.value })}>
            <option value="exploring">Exploring</option>
            <option value="part-time">Part-time</option>
            <option value="full-time">Full-time</option>
          </select>
        </label>
      </div>
      <button onClick={save} disabled={busy} className="btn-primary mt-4">
        {busy ? "Saving…" : "Save profile"}
      </button>
    </Card>
  );
}

function MilestonesCard({ snap, onChange }: { snap: CompanySnapshot; onChange: (s: CompanySnapshot) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("product");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const occurred_on = new Date().toISOString().slice(0, 10);
      onChange(await addMilestone(snap.company_id, { title, category, occurred_on }));
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Milestones & progress" hint="Log achievements as you hit them.">
      <div className="space-y-2">
        {snap.milestones.length === 0 && <p className="text-sm text-ink-soft">No milestones yet.</p>}
        {snap.milestones.map((m) => (
          <div key={m.milestone_id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2">
            <span className="text-sm text-ink">{m.title}</span>
            <span className="chip">{m.category} · {m.occurred_on}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. First 10 customer interviews" />
        <select className="field-input max-w-[8rem]" value={category} onChange={(e) => setCategory(e.target.value)}>
          {["product", "customer", "funding", "team", "legal", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={add} disabled={busy} className="btn-ghost shrink-0">Add</button>
      </div>
    </Card>
  );
}

function IntegrationsCard({ snap, onChange, id }: { snap: CompanySnapshot; onChange: (s: CompanySnapshot) => void; id: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const connected = new Set(snap.integrations.map((i) => i.provider));

  async function connect(provider: string, capability: string) {
    setBusy(provider);
    try {
      onChange(await connectIntegration(id, { provider, capability }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card title="Integrations" hint="Connect your tools so StartupKit reads live data.">
      <div className="flex flex-wrap gap-2">
        {PROVIDERS.map((pr) => {
          const on = connected.has(pr.provider);
          return (
            <button
              key={pr.provider}
              onClick={() => !on && connect(pr.provider, pr.capability)}
              disabled={on || busy === pr.provider}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                on ? "border-teal bg-teal-50 text-teal-900" : "border-line bg-paper text-ink-soft hover:border-seal"
              }`}
            >
              {on ? "✓ " : ""}{pr.provider}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function ConversationsCard({ snap, onChange }: { snap: CompanySnapshot; onChange: (s: CompanySnapshot) => void }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState("question");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      onChange(await addNote(snap.company_id, { kind, text }));
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Questions & conversations" hint="Capture questions, notes, and decisions.">
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {snap.notes.length === 0 && <p className="text-sm text-ink-soft">Nothing recorded yet.</p>}
        {snap.notes.map((n) => (
          <div key={n.note_id} className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="chip mr-2">{n.kind}</span>
            <span className="text-sm text-ink">{n.text}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <select className="field-input max-w-[8rem]" value={kind} onChange={(e) => setKind(e.target.value)}>
          {["question", "note", "decision", "conversation"].map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <input className="field-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a question or note…" />
        <button onClick={add} disabled={busy} className="btn-ghost shrink-0">Add</button>
      </div>
    </Card>
  );
}

function EvidenceCard({ snap, onChange }: { snap: CompanySnapshot; onChange: (s: CompanySnapshot) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("pitch");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      onChange(await addEvidence(snap.company_id, { name, kind }));
      setName("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Documents & evidence" hint="Pitches, agreements, reports, research you bring in.">
      <div className="space-y-2">
        {snap.evidence.length === 0 && <p className="text-sm text-ink-soft">No evidence added yet.</p>}
        {snap.evidence.map((ev) => (
          <div key={ev.evidence_id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2">
            <span className="text-sm text-ink">📎 {ev.name}</span>
            <span className="chip">{ev.kind}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Seed pitch deck v3" />
        <select className="field-input max-w-[8rem]" value={kind} onChange={(e) => setKind(e.target.value)}>
          {["pitch", "agreement", "report", "research", "other"].map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={add} disabled={busy} className="btn-ghost shrink-0">Add</button>
      </div>
    </Card>
  );
}
