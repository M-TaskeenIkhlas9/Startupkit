import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCaseStudies,
  getCompany,
  getCompanyWorkflows,
  getCompliance,
  getHealth,
  getRecommendations,
} from "@/lib/api";
import { JourneyBar, StatusBadge } from "@/components/workflow-ui";
import type {
  CaseStudy,
  ComplianceItem,
  DimensionScore,
  HealthScore,
  Recommendation,
  WorkflowView,
} from "@/lib/types";

const STATUS_COLOR: Record<HealthScore["status"], string> = {
  strong: "#0F6E56",
  healthy: "#3B6D11",
  moderate: "#BA7517",
  "at-risk": "#D85A30",
  critical: "#A32D2D",
};

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

export default async function CompanyPage({ params }: { params: { id: string } }) {
  let snap, health, recommendations, workflows, compliance, caseStudies;
  try {
    [snap, health, recommendations, workflows, compliance, caseStudies] = await Promise.all([
      getCompany(params.id),
      getHealth(params.id),
      getRecommendations(params.id),
      getCompanyWorkflows(params.id),
      getCompliance(params.id),
      getCaseStudies(params.id),
    ]);
  } catch {
    notFound();
  }

  const overdue = compliance.filter((c) => c.status === "overdue");

  return (
    <div className="space-y-8">
      {overdue.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-fuse/30 bg-[#F8EAE8] px-5 py-3">
          <span className="text-lg">🔴</span>
          <p className="text-sm text-fuse">
            <strong>
              {overdue.length} overdue filing{overdue.length > 1 ? "s" : ""}:
            </strong>{" "}
            {overdue.map((c) => c.title).join(" · ")}
          </p>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {snap.company_id} · v{snap.version}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-ink">{snap.name}</h1>
          <p className="mt-1 text-ink-soft">{snap.one_liner}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag>{snap.stage}</Tag>
            <Tag>{snap.entity_type}</Tag>
            <Tag>{snap.jurisdiction}</Tag>
            <Tag>{snap.formation_status}</Tag>
            {snap.ein && <Tag>EIN {snap.ein}</Tag>}
          </div>
        </div>
        <Gauge health={health} />
      </div>

      <Link
        href={`/company/${snap.company_id}/cofounder`}
        className="flex items-center justify-between gap-4 rounded-2xl bg-forest px-6 py-4 transition hover:shadow-lift"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-seal text-white">
            ◆
          </span>
          <div>
            <p className="font-semibold text-paper">Ask your AI Co-Founder</p>
            <p className="text-sm text-paper/70">
              What should I do next? · What are my risks? · Can I hire yet?
            </p>
          </div>
        </div>
        <span className="font-mono text-sm text-seal-soft">Open →</span>
      </Link>

      <div className="card p-5">
        <p className="eyebrow mb-3">Your stage</p>
        <JourneyBar stage={snap.stage} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-5 py-3 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-seal-soft font-disp font-bold text-seal-ink">
            {(snap.founder_profile.name || snap.name || "F").slice(0, 1)}
          </span>
          <div>
            <p className="font-semibold text-ink">
              {snap.founder_profile.name || "Founder"}
              {snap.founder_profile.risk_tolerance && (
                <span className="ml-2 font-mono text-xs text-muted">
                  {snap.founder_profile.risk_tolerance} · {snap.founder_profile.experience}
                </span>
              )}
            </p>
            <p className="text-xs text-muted">
              {snap.founder_profile.completed
                ? snap.founder_profile.goals || "Founder profile complete"
                : "Complete your founder profile to sharpen guidance"}
            </p>
          </div>
        </div>
        <Link href={`/company/${snap.company_id}/inputs`} className="font-mono text-sm font-semibold text-seal-ink">
          Input layer →
        </Link>
      </div>

      {snap.problem && (
        <div className="card grid gap-4 p-6 sm:grid-cols-3">
          <IdeaCell label="Problem" value={snap.problem} />
          <IdeaCell label="Customer" value={snap.customer} />
          <IdeaCell
            label="Solution"
            value={snap.solution}
            badge={snap.readiness_score ? `readiness ${snap.readiness_score}/100` : undefined}
          />
        </div>
      )}

      <WorkflowStrip companyId={snap.company_id} workflows={workflows} />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <Panel title="Company Object — 10 domains">
            <div className="grid gap-3 sm:grid-cols-2">
              {snap.domains.map((d) => (
                <div
                  key={d.domain}
                  className="flex items-center justify-between rounded-lg border border-line px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {DOMAIN_LABELS[d.domain] ?? d.domain}
                    </p>
                    <p className="text-xs text-muted">
                      {Object.keys(d.fields).length
                        ? Object.entries(d.fields)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")
                        : "no data yet"}
                    </p>
                  </div>
                  <FillDot status={d.status} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Cap table">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-mono text-xs uppercase text-muted">
                  <th className="pb-2">Founder</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Equity</th>
                  <th className="pb-2">Vesting</th>
                </tr>
              </thead>
              <tbody>
                {snap.founders.map((f) => (
                  <tr key={f.founder_id} className="border-t border-line">
                    <td className="py-2 font-medium text-ink">{f.name}</td>
                    <td className="py-2 text-ink-soft">{f.role}</td>
                    <td className="py-2 text-ink-soft">{f.equity_pct}%</td>
                    <td className="py-2 font-mono text-xs text-muted">{f.vesting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Lessons from founders like you">
            <div className="grid gap-3 sm:grid-cols-2">
              {caseStudies.slice(0, 4).map((c) => (
                <CaseStudyCard key={c.id} c={c} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="space-y-6">
          <Panel title="Recommendations">
            {recommendations.length === 0 ? (
              <p className="text-sm text-ink-soft">You&apos;re all caught up. ✅</p>
            ) : (
              <div className="space-y-3">
                <TopRecommendation rec={recommendations[0]} />
                {recommendations.slice(1, 4).map((r) => (
                  <div key={r.id} className="rounded-lg border-l-4 border-line bg-paper p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-teal-900">
                        {r.workflow || "—"}
                      </span>
                      <span className="font-mono text-xs text-muted">P{r.priority}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-ink">{r.title}</p>
                    <p className="mt-1 text-xs text-ink-soft">{r.why_it_matters}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Health Score breakdown">
            <div className="space-y-2.5">
              {health.dimensions.map((d) => (
                <DimensionBar key={d.dimension} d={d} />
              ))}
            </div>
          </Panel>

          <Panel title="Compliance calendar">
            {compliance.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Compliance obligations begin once your entity is formed (W1).
              </p>
            ) : (
              <div className="space-y-2">
                {compliance.map((c) => (
                  <ComplianceRow key={c.id} c={c} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title={`Document vault · ${snap.documents.length}`}>
            {snap.documents.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No documents yet. Open a workflow and let StartupKit draft them for you.
              </p>
            ) : (
              <div className="space-y-2">
                {snap.documents.map((d) => (
                  <div
                    key={d.doc_id}
                    className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{d.doc_type}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                        {d.workflow_code} · {d.doc_id}
                      </p>
                    </div>
                    {d.status === "pending-review" ? (
                      <span className="badge bg-seal-soft text-seal-ink">pending review</span>
                    ) : (
                      <span className="badge bg-teal-50 text-teal-900">draft</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </section>
      </div>

      <div className="text-center">
        <Link href="/intake" className="font-mono text-sm text-teal">
          ← Create another Company Object
        </Link>
      </div>
    </div>
  );
}

function Gauge({ health }: { health: HealthScore }) {
  const color = STATUS_COLOR[health.status];
  const angle = (health.overall / 100) * 360;
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex h-28 w-28 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${color} ${angle}deg, #eef1ec ${angle}deg)` }}
      >
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-panel">
          <span className="text-2xl font-bold text-ink">{health.overall}</span>
          <span className="font-mono text-[10px] text-muted">/ 100</span>
        </div>
      </div>
      <span
        className="mt-2 rounded-full px-3 py-0.5 text-xs font-semibold uppercase"
        style={{ background: color + "22", color }}
      >
        {health.status.replace("-", " ")}
      </span>
    </div>
  );
}

function DimensionBar({ d }: { d: DimensionScore }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="capitalize text-ink-soft">{d.dimension}</span>
        <span className="font-mono text-muted">
          {d.score} · w{d.weight}%
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded bg-line">
        <div className="h-1.5 rounded bg-teal" style={{ width: `${d.score}%` }} />
      </div>
    </div>
  );
}

function WorkflowStrip({
  companyId,
  workflows,
}: {
  companyId: string;
  workflows: WorkflowView[];
}) {
  const done = workflows.filter((w) => w.status === "complete").length;
  return (
    <div className="rounded-2xl border border-line bg-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">
          Workflows{" "}
          <span className="font-mono text-sm text-muted">
            {done}/{workflows.length}
          </span>
        </h2>
        <Link
          href={`/company/${companyId}/workflows`}
          className="font-mono text-sm font-semibold text-teal"
        >
          Open workflow hub →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {workflows.map((w) => {
          const locked = w.status === "locked";
          const card = (
            <div
              className={`rounded-lg border p-3 text-center ${
                locked ? "border-line opacity-60" : "border-line hover:border-teal"
              }`}
            >
              <span
                className="mx-auto block w-fit rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white"
                style={{ background: w.definition.color }}
              >
                {w.definition.code}
              </span>
              <p className="mt-2 text-[11px] font-medium leading-tight text-ink">
                {w.definition.name}
              </p>
              <div className="mt-2 flex justify-center">
                <StatusBadge status={w.status} />
              </div>
            </div>
          );
          return locked ? (
            <div key={w.definition.code}>{card}</div>
          ) : (
            <Link key={w.definition.code} href={`/company/${companyId}/workflows/${w.definition.code}`}>
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function TopRecommendation({ rec }: { rec: Recommendation }) {
  return (
    <div className="rounded-xl border-l-4 border-seal bg-seal-soft/40 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-seal-ink">
          {rec.workflow || "—"} · do first
        </span>
        {rec.deadline && (
          <span className="badge bg-[#F8EAE8] text-fuse">due {rec.deadline}</span>
        )}
      </div>
      <p className="mt-1 font-semibold text-ink">{rec.title}</p>
      <p className="mt-1 text-sm text-ink-soft">{rec.why_it_matters}</p>
      <ol className="mt-3 space-y-1">
        {rec.steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-xs text-ink-soft">
            <span className="font-mono font-bold text-seal-ink">{i + 1}.</span>
            {s}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs">
        <span className="font-semibold text-teal-900">Outcome: </span>
        <span className="text-ink-soft">{rec.expected_outcome}</span>
      </p>
      {rec.resources.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rec.resources.map((r) => (
            <span key={r} className="chip normal-case">
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CaseStudyCard({ c }: { c: CaseStudy }) {
  const fail = c.outcome === "failure";
  return (
    <div
      className="rounded-xl border bg-paper p-4"
      style={{ borderColor: fail ? "rgba(178,58,46,0.3)" : "rgba(15,110,86,0.3)" }}
    >
      <div className="flex items-center gap-2">
        <span>{fail ? "⚠️" : "✅"}</span>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{ color: fail ? "#B23A2E" : "#0F6E56" }}
        >
          {c.outcome} · {c.category}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-ink">{c.title}</p>
      <p className="mt-1 text-xs text-muted line-clamp-3">{c.story}</p>
      <p className="mt-2 text-xs text-ink-soft">
        <span className="font-semibold">Lesson: </span>
        {c.lesson}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-xs">
        {c.workflow && <span className="font-mono font-bold text-teal-900">{c.workflow}</span>}
        <span className="text-teal">→ {c.action}</span>
      </p>
    </div>
  );
}

const COMPLIANCE_STATUS: Record<ComplianceItem["status"], { label: string; bg: string; fg: string }> = {
  overdue: { label: "overdue", bg: "#F8EAE8", fg: "#A32D2D" },
  "due-soon": { label: "due soon", bg: "#F2E6C8", fg: "#5E3F0E" },
  upcoming: { label: "upcoming", bg: "#E6F1FB", fg: "#0A3F6E" },
  done: { label: "done", bg: "#E4F1EB", fg: "#0A3326" },
};

function ComplianceRow({ c }: { c: ComplianceItem }) {
  const s = COMPLIANCE_STATUS[c.status];
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-line bg-paper px-3 py-2">
      <div>
        <div className="flex items-center gap-2">
          {c.severity === "critical" && <span className="text-xs">🔴</span>}
          <span className="text-sm font-medium text-ink">{c.title}</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {c.authority} · {c.frequency} · due {c.due_date}
        </p>
      </div>
      <span className="badge shrink-0" style={{ background: s.bg, color: s.fg }}>
        {s.label}
      </span>
    </div>
  );
}

function IdeaCell({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        {badge && <span className="badge bg-teal-50 text-teal-900">{badge}</span>}
      </div>
      <p className="mt-1.5 text-sm text-ink-soft">{value}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="chip capitalize">{children}</span>;
}

function FillDot({ status }: { status: string }) {
  const color =
    status === "complete" ? "#0F6E56" : status === "partial" ? "#BA7517" : "#dde2db";
  return <span className="h-3 w-3 rounded-full" style={{ background: color }} />;
}
