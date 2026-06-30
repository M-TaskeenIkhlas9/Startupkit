import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getHealth } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  let snap, health;
  try {
    [snap, health] = await Promise.all([getCompany(params.id), getHealth(params.id)]);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <AppSidebar
        companyId={params.id}
        name={snap.name}
        health={{ overall: health.overall, status: health.status }}
      />

      {/* mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-5 py-3 backdrop-blur md:hidden">
        <span className="font-disp font-bold text-ink">StartupKit</span>
        <Link href={`/company/${params.id}/journey`} className="font-mono text-xs text-teal">
          {snap.name}
        </Link>
      </header>

      <div className="md:pl-[248px]">
        <main className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
