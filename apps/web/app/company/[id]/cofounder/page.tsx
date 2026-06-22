import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getRisks } from "@/lib/api";
import { CoFounder } from "@/components/cofounder";

const SEV: Record<string, { bg: string; fg: string }> = {
  critical: { bg: "#F8EAE8", fg: "#A32D2D" },
  high: { bg: "#FAF0DC", fg: "#5E3F0E" },
  medium: { bg: "#E6F1FB", fg: "#0A3F6E" },
  info: { bg: "#E4F1EB", fg: "#0A3326" },
};

export default async function CoFounderPage({ params }: { params: { id: string } }) {
  let snap, risks;
  try {
    [snap, risks] = await Promise.all([getCompany(params.id), getRisks(params.id)]);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/company/${params.id}`} className="font-mono text-xs text-muted hover:text-seal">
          ← {snap.name}
        </Link>
        <h1 className="mt-2 font-disp text-3xl font-bold text-ink">Your AI Co-Founder</h1>
        <p className="mt-1 text-ink-soft">
          More than documents — a guide that reads your company state, prevents mistakes, and tells
          you the next right move.
        </p>
      </div>

      <CoFounder companyId={params.id} />

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">
          Risk register{" "}
          <span className="font-mono text-sm text-muted">{risks.length}</span>
        </h2>
        {risks.length === 0 ? (
          <p className="text-sm text-ink-soft">No open risks. You&apos;re running clean. ✅</p>
        ) : (
          <div className="space-y-2">
            {risks.map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-paper p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{r.title}</span>
                  <span
                    className="badge uppercase"
                    style={{ background: SEV[r.severity].bg, color: SEV[r.severity].fg }}
                  >
                    {r.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{r.detail}</p>
                <p className="mt-2 flex items-center gap-2 text-sm">
                  {r.workflow && (
                    <span className="font-mono text-xs font-bold text-teal-900">{r.workflow}</span>
                  )}
                  <span className="text-teal">→ {r.mitigation}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
