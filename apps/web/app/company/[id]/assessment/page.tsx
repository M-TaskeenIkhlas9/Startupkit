import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany } from "@/lib/api";
import { ASSESSMENT } from "@/lib/assessment-catalog";

export default async function AssessmentHub({ params }: { params: { id: string } }) {
  let snap;
  try {
    snap = await getCompany(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/company/${params.id}`} className="font-mono text-xs text-muted hover:text-teal">
          ← {snap.name}
        </Link>
        <p className="eyebrow mt-3">The early journey</p>
        <h1 className="mt-2 font-disp text-4xl font-bold text-ink">Founder Assessment</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          A deep, structured discovery across five stages — from raw idea to first revenue. Your
          answers feed your Company Object and sharpen every recommendation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ASSESSMENT.map((p) => {
          const total = p.modules.reduce((n, m) => n + m.questions.length, 0);
          const ans = snap.assessments[String(p.phase)] ?? {};
          const done = Object.values(ans).filter((v) => v && v.trim()).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <Link
              key={p.phase}
              href={`/company/${params.id}/assessment/${p.phase}`}
              className="card card-hover block p-5"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-teal-50 px-2 py-0.5 font-mono text-xs font-bold text-teal-900">
                  Phase {p.phase}
                </span>
                <span className="font-mono text-xs text-muted">{pct}%</span>
              </div>
              <h3 className="mt-3 font-disp text-lg font-bold text-ink">{p.name}</h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                {p.modules.length} modules · {total} questions
              </p>
              <div className="mt-4 h-1.5 w-full rounded bg-line">
                <div className="h-1.5 rounded bg-teal" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
