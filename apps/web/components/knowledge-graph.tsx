"use client";

import { useMemo, useState } from "react";
import { ASSESSMENT } from "@/lib/assessment-catalog";
import type { CompanySnapshot } from "@/lib/types";

type Leaf = { label: string; value: string };
type Cluster = { id: string; label: string; color: string; leaves: Leaf[] };

const DOMAIN_LABELS: Record<string, string> = {
  legal: "Legal & Formation",
  finance: "Finance",
  equity: "Cap Table & Equity",
  technical: "Technical",
  brand: "Brand & Product",
  people: "People & HR",
  gtm: "Go-to-Market",
  operations: "Operations",
  fundraising: "Fundraising",
  compliance: "Compliance",
};

// qid -> question text, from the assessment catalog
const QTEXT: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const p of ASSESSMENT)
    for (const mod of p.modules) for (const q of mod.questions) m[q.id] = q.q;
  return m;
})();

function buildClusters(snap: CompanySnapshot): Cluster[] {
  const c: Cluster[] = [];
  const fp = snap.founder_profile;

  const founderLeaves: Leaf[] = [
    ["Name", fp.name],
    ["Background", fp.background],
    ["Goals", fp.goals],
    ["Risk tolerance", fp.risk_tolerance],
    ["Experience", fp.experience],
    ["Commitment", fp.time_commitment],
  ]
    .filter(([, v]) => v)
    .map(([label, value]) => ({ label, value }));
  if (founderLeaves.length) c.push({ id: "founder", label: "Founder", color: "#2536E8", leaves: founderLeaves });

  const ideaLeaves: Leaf[] = [
    ["Problem", snap.problem],
    ["Customer", snap.customer],
    ["Solution", snap.solution],
    ["Readiness", snap.readiness_score ? `${snap.readiness_score}/100` : ""],
  ]
    .filter(([, v]) => v)
    .map(([label, value]) => ({ label, value }));
  if (ideaLeaves.length) c.push({ id: "idea", label: "Idea", color: "#D9842A", leaves: ideaLeaves });

  if (snap.founders.length)
    c.push({
      id: "founders",
      label: "Founders",
      color: "#2536E8",
      leaves: snap.founders.map((f) => ({ label: f.name, value: `${f.role} · ${f.equity_pct}%` })),
    });

  const domainLeaves = snap.domains
    .filter((d) => d.status !== "empty")
    .map((d) => ({ label: DOMAIN_LABELS[d.domain] ?? d.domain, value: d.status }));
  if (domainLeaves.length)
    c.push({ id: "domains", label: "Domains", color: "#141C8C", leaves: domainLeaves });

  if (snap.documents.length)
    c.push({
      id: "documents",
      label: "Documents",
      color: "#8A4E10",
      leaves: snap.documents.map((d) => ({ label: d.doc_type, value: d.status })),
    });

  // The answers the founder gives — pulled from the assessment, labelled via the catalog.
  const answerLeaves: Leaf[] = [];
  for (const [, answers] of Object.entries(snap.assessments)) {
    for (const [qid, val] of Object.entries(answers)) {
      if (val && val.trim()) answerLeaves.push({ label: QTEXT[qid] ?? qid, value: val });
    }
  }
  if (answerLeaves.length)
    c.push({ id: "answers", label: "Your answers", color: "#D9842A", leaves: answerLeaves });

  const factLeaves = Object.entries(snap.facts ?? {}).map(([k, v]) => ({
    label: k.replace(/_/g, " "),
    value: v,
  }));
  if (factLeaves.length)
    c.push({ id: "facts", label: "Saved facts", color: "#1F9D57", leaves: factLeaves });

  const inputLeaves: Leaf[] = [
    ...snap.milestones.map((m) => ({ label: "Milestone", value: m.title })),
    ...snap.integrations.map((i) => ({ label: "Integration", value: i.provider })),
    ...snap.notes.map((n) => ({ label: n.kind, value: n.text })),
    ...snap.evidence.map((e) => ({ label: "Evidence", value: e.name })),
  ];
  if (inputLeaves.length)
    c.push({ id: "inputs", label: "Inputs", color: "#2536E8", leaves: inputLeaves });

  return c;
}

export function KnowledgeGraph({ snap }: { snap: CompanySnapshot }) {
  const clusters = useMemo(() => buildClusters(snap), [snap]);
  const [sel, setSel] = useState<string>(clusters[0]?.id ?? "");
  const selected = clusters.find((c) => c.id === sel) ?? clusters[0];

  const cx = 300;
  const cy = 300;
  const R = 210;
  const pos = clusters.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / clusters.length;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
      <div className="card p-4">
        <svg viewBox="0 0 600 600" className="h-auto w-full">
          {clusters.map((c, i) => (
            <line
              key={c.id}
              x1={cx}
              y1={cy}
              x2={pos[i].x}
              y2={pos[i].y}
              stroke={sel === c.id ? c.color : "#E3E7E2"}
              strokeWidth={sel === c.id ? 2.5 : 1.5}
            />
          ))}

          {/* cluster nodes */}
          {clusters.map((c, i) => (
            <g
              key={c.id}
              className="cursor-pointer"
              onClick={() => setSel(c.id)}
              transform={`translate(${pos[i].x},${pos[i].y})`}
            >
              <circle
                r={36}
                fill={sel === c.id ? c.color : "#FFFFFF"}
                stroke={c.color}
                strokeWidth={2}
              />
              <text
                textAnchor="middle"
                y={2}
                fontSize="11"
                fontWeight="700"
                fill={sel === c.id ? "#fff" : "#171A21"}
                fontFamily="Hanken Grotesk, sans-serif"
              >
                {c.label.length > 11 ? c.label.slice(0, 10) + "…" : c.label}
              </text>
              <text
                textAnchor="middle"
                y={16}
                fontSize="9"
                fill={sel === c.id ? "#fff" : "#5C6573"}
                fontFamily="JetBrains Mono, monospace"
              >
                {c.leaves.length}
              </text>
            </g>
          ))}

          {/* center: the Company Object */}
          <g transform={`translate(${cx},${cy})`}>
            <circle r={54} fill="#171A21" />
            <text textAnchor="middle" y={-6} fontSize="11" fill="#F7ECDD" fontFamily="JetBrains Mono, monospace">
              COMPANY
            </text>
            <text textAnchor="middle" y={8} fontSize="11" fill="#F7ECDD" fontFamily="JetBrains Mono, monospace">
              OBJECT
            </text>
            <text textAnchor="middle" y={24} fontSize="9" fill="#8E97A6" fontFamily="JetBrains Mono, monospace">
              {snap.company_id}
            </text>
          </g>
        </svg>
        <p className="text-center font-mono text-[11px] text-muted">
          {clusters.reduce((n, c) => n + c.leaves.length, 0)} data nodes · click to inspect
        </p>
      </div>

      {/* inspector */}
      <div className="card flex flex-col p-6">
        {selected ? (
          <>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: selected.color }} />
              <h2 className="font-disp text-xl font-bold text-ink">{selected.label}</h2>
              <span className="font-mono text-xs text-muted">{selected.leaves.length}</span>
            </div>
            <div className="mt-4 max-h-[440px] space-y-2 overflow-y-auto">
              {selected.leaves.map((l, i) => (
                <div key={i} className="rounded-lg border border-line bg-paper px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {l.label}
                  </p>
                  <p className="mt-0.5 text-sm text-ink">{l.value}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-soft">No data yet — complete intake and the assessment.</p>
        )}
      </div>
    </div>
  );
}
