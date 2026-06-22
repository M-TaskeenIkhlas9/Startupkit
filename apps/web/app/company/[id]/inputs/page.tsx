import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany } from "@/lib/api";
import { InputLayer } from "@/components/input-layer";

export default async function InputsPage({ params }: { params: { id: string } }) {
  let snap;
  try {
    snap = await getCompany(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/company/${params.id}`} className="font-mono text-xs text-muted hover:text-seal">
          ← {snap.name}
        </Link>
        <h1 className="mt-2 font-disp text-3xl font-bold text-ink">Founder Input Layer</h1>
        <p className="mt-1 text-ink-soft">
          Everything you feed StartupKit — your profile, milestones, connected tools, conversations,
          and evidence. It all flows into your Company Object and powers every recommendation.
        </p>
      </div>
      <InputLayer initial={snap} />
    </div>
  );
}
