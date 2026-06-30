import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany } from "@/lib/api";
import { ASSESSMENT } from "@/lib/assessment-catalog";
import { PhaseAssessment } from "@/components/assessment";

export default async function PhasePage({
  params,
}: {
  params: { id: string; phase: string };
}) {
  const phaseNum = Number(params.phase);
  const phase = ASSESSMENT.find((p) => p.phase === phaseNum);
  if (!phase) notFound();

  let snap;
  try {
    snap = await getCompany(params.id);
  } catch {
    notFound();
  }

  const initial = snap.assessments[String(phaseNum)] ?? {};

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/company/${params.id}/assessment`}
          className="font-mono text-xs text-muted hover:text-teal"
        >
          ← All phases
        </Link>
        <p className="eyebrow mt-3">Phase {phase.phase}</p>
        <h1 className="mt-2 font-disp text-4xl font-bold text-ink">{phase.name}</h1>
      </div>

      <PhaseAssessment
        companyId={params.id}
        phase={phase.phase}
        name={phase.name}
        modules={phase.modules}
        initial={initial}
      />
    </div>
  );
}
