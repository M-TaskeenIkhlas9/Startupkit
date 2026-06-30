import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getJourney } from "@/lib/api";
import { JourneyGraph } from "@/components/journey-graph";

export default async function JourneyPage({ params }: { params: { id: string } }) {
  let snap, journey;
  try {
    [snap, journey] = await Promise.all([getCompany(params.id), getJourney(params.id)]);
  } catch {
    notFound();
  }

  const done = journey.nodes.filter((n) => n.status === "done").length;
  const pct = Math.round((done / journey.nodes.length) * 100);
  const current = journey.nodes[journey.current_index];
  const link = current.workflow
    ? `/company/${params.id}/workflows/${current.workflow}`
    : `/company/${params.id}/assessment`;

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {snap.company_id} · {snap.name}
        </p>
        <h1 className="mt-1 font-disp text-4xl font-bold text-ink">Your journey</h1>
      </div>

      {/* Single clear next step — the antidote to a complicated home */}
      <div className="rounded-3xl bg-forest p-7 text-paper">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-seal-soft">
              {journey.headline} · {pct}% of the journey
            </p>
            <h2 className="mt-2 max-w-2xl font-disp text-2xl font-bold">{journey.next_action}</h2>
            <p className="mt-2 text-sm text-paper/70">{current.winner_move}</p>
          </div>
          <Link
            href={link}
            className="rounded-xl bg-seal px-6 py-3 font-semibold text-white shadow-seal transition hover:bg-seal-ink"
          >
            Do this next →
          </Link>
        </div>
        <div className="mt-5 h-1.5 w-full rounded bg-white/15">
          <div className="h-1.5 rounded bg-seal" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <JourneyGraph journey={journey} companyId={params.id} />
    </div>
  );
}
