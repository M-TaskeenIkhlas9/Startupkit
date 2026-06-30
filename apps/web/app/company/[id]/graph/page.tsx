import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany } from "@/lib/api";
import { KnowledgeGraph } from "@/components/knowledge-graph";

export default async function GraphPage({ params }: { params: { id: string } }) {
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
        <p className="eyebrow mt-3">Company Object</p>
        <h1 className="mt-2 font-disp text-4xl font-bold text-ink">Knowledge graph</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Everything StartupKit knows about your company — your founder profile, idea, domains,
          documents, and every answer you&apos;ve given — connected as one living graph. Click any
          node to inspect it.
        </p>
      </div>

      <KnowledgeGraph snap={snap} />
    </div>
  );
}
