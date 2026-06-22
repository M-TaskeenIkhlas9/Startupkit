import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getCompanyWorkflows } from "@/lib/api";
import { StatusBadge } from "@/components/workflow-ui";
import { WorkflowPhases } from "@/components/workflow-phases";

export default async function WorkflowDetail({
  params,
}: {
  params: { id: string; code: string };
}) {
  let snap, workflows;
  try {
    [snap, workflows] = await Promise.all([
      getCompany(params.id),
      getCompanyWorkflows(params.id),
    ]);
  } catch {
    notFound();
  }

  const view = workflows.find(
    (w) => w.definition.code.toLowerCase() === params.code.toLowerCase(),
  );
  if (!view) notFound();
  const d = view.definition;
  const phasesDone = view.completed_phases.length;

  return (
    <div className="space-y-8">
      <div
        className="rounded-3xl border border-line p-7"
        style={{ background: `linear-gradient(135deg, ${d.color}10, #ffffff 70%)` }}
      >
        <Link
          href={`/company/${params.id}/workflows`}
          className="font-mono text-xs text-muted hover:text-teal"
        >
          ← All workflows · {snap.name}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className="rounded-lg px-3 py-1.5 font-mono text-sm font-bold text-white"
            style={{ background: d.color }}
          >
            {d.code}
          </span>
          <h1 className="text-3xl font-bold text-ink">{d.name}</h1>
          <StatusBadge status={view.status} />
        </div>
        <p className="mt-2 max-w-2xl text-ink-soft">{d.goal}</p>

        <div className="mt-5 max-w-md">
          <div className="flex justify-between font-mono text-xs text-muted">
            <span>
              {phasesDone}/{d.phases.length} phases
            </span>
            <span>{view.progress_pct}%</span>
          </div>
          <div className="mt-1 h-2 w-full rounded bg-line">
            <div
              className="h-2 rounded transition-all"
              style={{ width: `${view.progress_pct}%`, background: d.color }}
            />
          </div>
        </div>

        {view.blocked_reason && (
          <p className="mt-4 inline-block rounded-md bg-paper px-3 py-1.5 text-sm text-muted">
            🔒 {view.blocked_reason}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-muted">
          {d.depends_on.length > 0 && <Chip>needs {d.depends_on.join(", ")}</Chip>}
          {d.unlocks.length > 0 && <Chip>unlocks {d.unlocks.join(", ")}</Chip>}
        </div>
      </div>

      <WorkflowPhases
        companyId={params.id}
        view={view}
        documents={snap.documents.filter((d) => d.workflow_code === view.definition.code)}
      />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-panel px-2.5 py-0.5">{children}</span>
  );
}
