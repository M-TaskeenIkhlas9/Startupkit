import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getCompanyWorkflows } from "@/lib/api";
import { JourneyBar, WorkflowCard } from "@/components/workflow-ui";

export default async function WorkflowsPage({ params }: { params: { id: string } }) {
  let snap, workflows;
  try {
    [snap, workflows] = await Promise.all([
      getCompany(params.id),
      getCompanyWorkflows(params.id),
    ]);
  } catch {
    notFound();
  }

  const done = workflows.filter((w) => w.status === "complete").length;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/company/${params.id}`}
          className="font-mono text-xs text-muted hover:text-teal"
        >
          ← {snap.name}
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-ink">Workflows</h1>
        <p className="mt-1 text-ink-soft">
          Eight gated workflows from idea to investor-ready. StartupKit unlocks each one in the
          right order — {done} of {workflows.length} complete.
        </p>
      </div>

      <div className="card p-5">
        <p className="eyebrow mb-3">Your stage</p>
        <JourneyBar stage={snap.stage} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((w) => (
          <WorkflowCard key={w.definition.code} companyId={params.id} view={w} />
        ))}
      </div>

      <div className="card p-6">
        <h2 className="mb-3 text-lg font-semibold text-ink">Dependency map</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Formation gates everything. After W1 completes, Wave 1 (W2 · W3 · W4 · W5 · W8) unlocks;
          People (W6) waits on IP & Legal, and GTM (W7) waits on Brand.
        </p>
        <div className="space-y-1.5 font-mono text-xs text-ink-soft">
          {workflows.map((w) =>
            w.definition.unlocks.length ? (
              <div key={w.definition.code}>
                <span className="font-semibold text-teal-900">{w.definition.code}</span>
                {" → "}
                {w.definition.unlocks.join(" · ")}
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
