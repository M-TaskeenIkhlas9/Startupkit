"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName =
  | "journey"
  | "dashboard"
  | "graph"
  | "workflows"
  | "assessment"
  | "cofounder"
  | "inputs";

function Icon({ name }: { name: IconName }) {
  const p: Record<IconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    journey: (
      <>
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <path d="M8 16.5C13 13 11 9 16 7.5" />
      </>
    ),
    graph: (
      <>
        <circle cx="12" cy="5" r="2.5" />
        <circle cx="5" cy="18" r="2.5" />
        <circle cx="19" cy="18" r="2.5" />
        <path d="M11 7 6.5 16M13 7l4.5 9M7 18h10" />
      </>
    ),
    workflows: (
      <>
        <rect x="3" y="4" width="18" height="4" rx="1.5" />
        <rect x="3" y="10" width="18" height="4" rx="1.5" />
        <rect x="3" y="16" width="12" height="4" rx="1.5" />
      </>
    ),
    assessment: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    cofounder: (
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
    ),
    inputs: (
      <>
        <path d="M4 13v5a2 2 0 002 2h12a2 2 0 002-2v-5" />
        <path d="M12 3v10m0 0l-3.5-3.5M12 13l3.5-3.5" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {p[name]}
    </svg>
  );
}

type NavItem = { label: string; href: string; icon: IconName; exact?: boolean };

export function AppSidebar({
  companyId,
  name,
  health,
}: {
  companyId: string;
  name: string;
  health: { overall: number; status: string };
}) {
  const pathname = usePathname();
  const base = `/company/${companyId}`;
  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: "Overview",
      items: [
        { label: "Journey", href: `${base}/journey`, icon: "journey" },
        { label: "Dashboard", href: base, icon: "dashboard", exact: true },
        { label: "Knowledge graph", href: `${base}/graph`, icon: "graph" },
      ],
    },
    {
      title: "Build",
      items: [
        { label: "Workflows", href: `${base}/workflows`, icon: "workflows" },
        { label: "Assessment", href: `${base}/assessment`, icon: "assessment" },
      ],
    },
    {
      title: "Intelligence",
      items: [{ label: "AI Co-Founder", href: `${base}/cofounder`, icon: "cofounder" }],
    },
    {
      title: "Inputs",
      items: [{ label: "Input layer", href: `${base}/inputs`, icon: "inputs" }],
    },
  ];

  const isActive = (it: NavItem) =>
    it.exact ? pathname === it.href : pathname.startsWith(it.href);

  const statusColor =
    health.overall >= 65 ? "#3ECF8E" : health.overall >= 40 ? "#D9842A" : "#E5675B";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-ink text-paper md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-seal font-mono text-sm font-bold text-white">
          S
        </span>
        <span className="font-disp text-base font-bold tracking-tight">StartupKit</span>
      </div>

      <Link
        href={`${base}/journey`}
        className="mx-3 mb-2 rounded-xl bg-white/[0.04] px-3 py-2.5 transition hover:bg-white/[0.07]"
      >
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#7a828f]">{companyId}</p>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {groups.map((g) => (
          <div key={g.title} className="mb-1.5">
            <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#5b6472]">
              {g.title}
            </p>
            {g.items.map((it) => {
              const active = isActive(it);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-teal/[0.18] font-medium text-white"
                      : "text-[#9aa3b2] hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-teal" />
                  )}
                  <Icon name={it.icon} />
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#7a828f]">
            Health
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <span className="h-2 w-2 rounded-full" style={{ background: statusColor }} />
            {health.overall}
          </span>
        </div>
        <p className="mt-1 font-mono text-[10px] capitalize text-[#5b6472]">
          {health.status.replace("-", " ")}
        </p>
      </div>
    </aside>
  );
}
