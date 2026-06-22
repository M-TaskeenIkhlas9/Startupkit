import Link from "next/link";
import type { WorkflowStatus, WorkflowView } from "@/lib/types";

export const STAGE_SEQUENCE = [
  "pre-founder",
  "discovery",
  "problem-solution-fit",
  "mvp-build",
  "first-revenue",
  "pmf",
  "pre-seed",
  "series-a",
];

const STATUS_STYLE: Record<WorkflowStatus, { label: string; bg: string; fg: string }> = {
  complete: { label: "Complete", bg: "#E1F5EE", fg: "#0F6E56" },
  "in-progress": { label: "In progress", bg: "#FAEEDA", fg: "#BA7517" },
  available: { label: "Available", bg: "#E6F1FB", fg: "#185FA5" },
  locked: { label: "Locked", bg: "#eef1ec", fg: "#6c7773" },
};

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

export function JourneyBar({ stage }: { stage: string }) {
  const idx = STAGE_SEQUENCE.indexOf(stage);
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {STAGE_SEQUENCE.map((s, i) => {
        const active = i === idx;
        const past = i < idx;
        return (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                active
                  ? "bg-teal text-white"
                  : past
                    ? "bg-teal-50 text-teal-900"
                    : "bg-panel border border-line text-muted"
              }`}
            >
              {s.replace(/-/g, " ")}
            </div>
            {i < STAGE_SEQUENCE.length - 1 && <span className="text-line">›</span>}
          </div>
        );
      })}
    </div>
  );
}

export function WorkflowCard({ companyId, view }: { companyId: string; view: WorkflowView }) {
  const { definition: d, status, progress_pct, blocked_reason } = view;
  const locked = status === "locked";
  const docCount = d.phases.reduce((n, p) => n + p.documents.length, 0);

  const inner = (
    <div className={`card h-full p-5 ${locked ? "opacity-70" : "card-hover"}`}>
      <div className="flex items-center justify-between">
        <span
          className="rounded-md px-2 py-0.5 font-mono text-xs font-bold text-white"
          style={{ background: d.color }}
        >
          {d.code}
        </span>
        <StatusBadge status={status} />
      </div>
      <h3 className="mt-3 text-base font-semibold text-ink">{d.name}</h3>
      <p className="mt-1 text-sm text-ink-soft line-clamp-2">{d.goal}</p>

      <div className="mt-4 h-1.5 w-full rounded bg-line">
        <div
          className="h-1.5 rounded"
          style={{ width: `${progress_pct}%`, background: d.color }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-xs text-muted">
        <span>
          {d.phases.length} phases · {docCount} docs
        </span>
        <span>{progress_pct}%</span>
      </div>
      {locked && blocked_reason && (
        <p className="mt-3 rounded-md bg-paper px-2 py-1 text-xs text-muted">🔒 {blocked_reason}</p>
      )}
    </div>
  );

  if (locked) return inner;
  return (
    <Link href={`/company/${companyId}/workflows/${d.code}`} className="block h-full">
      {inner}
    </Link>
  );
}
