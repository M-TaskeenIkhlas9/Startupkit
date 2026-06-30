"use client";

import Link from "next/link";
import { useState } from "react";
import type { Journey, JourneyNode } from "@/lib/types";

const PHASES: { kind: JourneyNode["kind"]; label: string }[] = [
  { kind: "validate", label: "Validate" },
  { kind: "build", label: "Build" },
  { kind: "formalize", label: "Formalize" },
  { kind: "scale", label: "Scale" },
];

function nodeLink(companyId: string, n: JourneyNode): string | null {
  if (n.workflow) return `/company/${companyId}/workflows/${n.workflow}`;
  const phase: Record<string, number> = {
    validation: 1,
    discovery: 2,
    psf: 3,
    mvp: 4,
    revenue: 5,
  };
  if (phase[n.id]) return `/company/${companyId}/assessment/${phase[n.id]}`;
  return null;
}

function dot(status: JourneyNode["status"]): { bg: string; ring: string; text: string } {
  switch (status) {
    case "done":
      return { bg: "#2536E8", ring: "#2536E8", text: "#fff" };
    case "current":
      return { bg: "#fff", ring: "#2536E8", text: "#2536E8" };
    case "next":
      return { bg: "#F7ECDD", ring: "#D9842A", text: "#8A4E10" };
    default:
      return { bg: "#fff", ring: "#E3E7E2", text: "#5C6573" };
  }
}

export function JourneyGraph({ journey, companyId }: { journey: Journey; companyId: string }) {
  const [selected, setSelected] = useState(journey.current_index);
  const node = journey.nodes[selected];
  const link = nodeLink(companyId, node);

  return (
    <div className="space-y-7">
      {/* the path / knowledge graph */}
      <div className="card overflow-x-auto p-6">
        <div className="flex min-w-[820px] items-start">
          {PHASES.map((ph) => {
            const group = journey.nodes
              .map((n, i) => ({ n, i }))
              .filter(({ n }) => n.kind === ph.kind);
            return (
              <div key={ph.kind} className="flex-1">
                <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  {ph.label}
                </p>
                <div className="flex items-start justify-center">
                  {group.map(({ n, i }, gi) => {
                    const d = dot(n.status);
                    return (
                      <div key={n.id} className="flex flex-1 flex-col items-center">
                        <div className="flex w-full items-center">
                          {gi > 0 && <Connector done={journey.nodes[i - 1].status === "done"} />}
                          <button
                            onClick={() => setSelected(i)}
                            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition"
                            style={{
                              background: d.bg,
                              color: d.text,
                              boxShadow: `0 0 0 2px ${d.ring}${
                                selected === i ? ", 0 0 0 5px rgba(37,54,232,0.15)" : ""
                              }`,
                            }}
                          >
                            {n.status === "done" ? "✓" : i + 1}
                            {n.status === "current" && (
                              <span className="absolute -top-7 whitespace-nowrap rounded-full bg-teal px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">
                                You are here
                              </span>
                            )}
                          </button>
                          {gi < group.length - 1 && (
                            <Connector done={n.status === "done"} />
                          )}
                        </div>
                        <button
                          onClick={() => setSelected(i)}
                          className={`mt-2 max-w-[88px] text-center text-[11px] leading-tight transition ${
                            selected === i ? "font-semibold text-ink" : "text-muted"
                          }`}
                        >
                          {n.label}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* selected node detail */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr,1fr]">
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <StatusPill status={node.status} />
            {node.workflow && <span className="chip">{node.workflow}</span>}
          </div>
          <h2 className="mt-2 font-disp text-2xl font-bold text-ink">{node.label}</h2>
          <p className="mt-1 text-ink-soft">{node.summary}</p>
          {node.your_status && (
            <p className="mt-3 inline-block rounded-lg bg-teal-50 px-3 py-1.5 text-sm text-teal-900">
              ✓ {node.your_status}
            </p>
          )}
          {node.status !== "done" && node.next_action && (
            <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4">
              <p className="eyebrow text-seal">Your next step</p>
              <p className="mt-1.5 text-sm font-medium text-ink">{node.next_action}</p>
              {link && (
                <Link href={link} className="btn-primary mt-3">
                  Start this step →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="card p-6">
          <p className="eyebrow text-seal">How founders who made it did it</p>
          <p className="mt-3 text-sm leading-relaxed text-ink">{node.winner_move}</p>
          <div className="mt-4 border-t border-line pt-4">
            <p className="rule mb-2">The winning path ahead</p>
            <ul className="space-y-1.5">
              {journey.nodes
                .filter((n) => n.status === "next" || n.status === "future")
                .slice(0, 3)
                .map((n) => (
                  <li key={n.id} className="flex gap-2 text-xs text-ink-soft">
                    <span className="text-seal">→</span>
                    <span>
                      <span className="font-semibold text-ink">{n.label}:</span> {n.winner_move}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Connector({ done }: { done: boolean }) {
  return <div className="h-0.5 flex-1" style={{ background: done ? "#2536E8" : "#E3E7E2" }} />;
}

function StatusPill({ status }: { status: JourneyNode["status"] }) {
  const map = {
    done: { label: "Done", bg: "#E7E9FC", fg: "#141C8C" },
    current: { label: "You are here", bg: "#E7E9FC", fg: "#2536E8" },
    next: { label: "Up next", bg: "#F7ECDD", fg: "#8A4E10" },
    future: { label: "Later", bg: "#F3F5F2", fg: "#5C6573" },
  }[status];
  return (
    <span className="badge" style={{ background: map.bg, color: map.fg }}>
      {map.label}
    </span>
  );
}
