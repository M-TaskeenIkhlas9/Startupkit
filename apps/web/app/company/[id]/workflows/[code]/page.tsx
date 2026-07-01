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

  // Auto-generate the Cap Table + ledger (+ Operating Agreement members) rows from the founders +
  // share/unit structure, entity-aware, so those documents pre-fill instead of being retyped.
  const isLLC = snap.entity_type === "llc";
  const num = (s: string | undefined) => Number(String(s ?? "").replace(/[^0-9.]/g, "")) || 0;
  const issued = num(isLLC ? snap.facts.units_issued : snap.facts.shares_issued) || num(snap.facts.authorized_shares);
  const pricePer = (isLLC ? snap.facts.capital_contribution : snap.facts.price_per_share) || snap.facts.par_value || "";
  const unitWord = isLLC ? "units" : "common";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const amt = (pct: number) => Math.round((pct / 100) * issued);
  const capTableRows = snap.founders
    .map((f) => `${f.name} — ${amt(f.equity_pct).toLocaleString()} ${unitWord} — ${f.equity_pct}%`)
    .join("\n");
  const memberRows = snap.founders
    .map((f) => `${f.name} — ${amt(f.equity_pct).toLocaleString()} units`)
    .join("\n");
  const ledgerRows = snap.founders
    .map(
      (f, i) =>
        `${f.name} — ${amt(f.equity_pct).toLocaleString()} ${unitWord} — ` +
        (isLLC ? "" : `Cert C-${i + 1} — `) +
        `issued ${today} — ${pricePer}${isLLC ? "/unit" : "/share"}`,
    )
    .join("\n");
  // Auto-generate the compliance calendar from entity type + operating state.
  const state =
    snap.facts.state_of_operation && snap.facts.state_of_operation !== "Not sure"
      ? snap.facts.state_of_operation
      : "";
  const complianceRows = [
    isLLC
      ? "Delaware LLC franchise tax ($300 flat) — due June 1 (annual)"
      : "Delaware Annual Report + Franchise Tax — due March 1 (annual)",
    isLLC
      ? "Federal — pass-through: Schedule K-1 to members with your personal return"
      : "Federal income tax (Form 1120) — due April 15 (annual)",
    "Registered agent — renew annually",
    ...(state && state !== "Delaware"
      ? [`Foreign qualification + ${state} state tax — register and file in ${state}`]
      : []),
    "83(b) election — within 30 days of any restricted-stock grant (one-time, per person)",
  ]
    .map((l) => `• ${l}`)
    .join("\n");

  const docFacts: Record<string, string> = {
    ...snap.facts,
    ...(capTableRows ? { cap_table: capTableRows } : {}),
    ...(ledgerRows ? (isLLC ? { membership_ledger: ledgerRows } : { stock_ledger: ledgerRows }) : {}),
    ...(isLLC && memberRows ? { members: memberRows } : {}),
    compliance_calendar: complianceRows,
    reminder_lead: snap.facts.reminder_lead || "3 weeks before each due date",
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/company/${params.id}/workflows`}
          className="font-mono text-xs text-muted hover:text-ink"
        >
          ← All workflows · {snap.name}
        </Link>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
          <div className="flex items-start gap-5 border-l-4 p-7" style={{ borderLeftColor: d.color }}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-bold tracking-widest" style={{ color: d.color }}>
                  {d.code}
                </span>
                <StatusBadge status={view.status} />
              </div>
              <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink">{d.name}</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{d.goal}</p>
              {view.blocked_reason && (
                <p className="mt-3 inline-block rounded-md bg-paper px-3 py-1.5 text-sm text-muted">
                  🔒 {view.blocked_reason}
                </p>
              )}
              {(d.depends_on.length > 0 || d.unlocks.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] text-muted">
                  {d.depends_on.length > 0 && <Chip>needs {d.depends_on.join(", ")}</Chip>}
                  {d.unlocks.length > 0 && <Chip>unlocks {d.unlocks.join(", ")}</Chip>}
                </div>
              )}
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-4xl font-extrabold leading-none" style={{ color: d.color }}>
                {view.progress_pct}%
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                {phasesDone}/{d.phases.length} phases
              </p>
            </div>
          </div>
          {/* segmented phase tracker — the phases are a real ordered sequence */}
          <div className="flex gap-1.5 border-t border-line bg-paper/60 px-7 py-4">
            {d.phases.map((p) => {
              const complete = view.completed_phases.includes(p.n);
              const current =
                !complete &&
                d.phases.filter((x) => x.n < p.n).every((x) => view.completed_phases.includes(x.n));
              return (
                <div key={p.n} className="min-w-0 flex-1">
                  <div
                    className="h-1.5 rounded-full transition-colors"
                    style={{
                      background: complete ? d.color : current ? `${d.color}55` : "#e3e7e2",
                    }}
                  />
                  <p
                    className={`mt-1.5 truncate text-[10.5px] font-medium ${
                      complete || current ? "text-ink-soft" : "text-muted"
                    }`}
                  >
                    {p.n}. {p.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <WorkflowPhases
        companyId={params.id}
        view={view}
        documents={snap.documents.filter((d) => d.workflow_code === view.definition.code)}
        company={{
          name: snap.name,
          entity_type: snap.entity_type,
          jurisdiction: snap.jurisdiction,
          founderName: snap.founders[0]?.name ?? snap.founder_profile.name ?? "",
          ein: snap.ein ?? "",
        }}
        facts={docFacts}
        submitted={snap.submitted_documents}
      />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-panel px-2.5 py-0.5">{children}</span>
  );
}
