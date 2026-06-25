import Link from "next/link";
import { CompanyRecord } from "@/components/company-record";

const WORKFLOWS: [string, string][] = [
  ["W1", "Business Formation"],
  ["W2", "IP & Legal"],
  ["W3", "Financial Infra"],
  ["W4", "Technical Infra"],
  ["W5", "Brand & Product"],
  ["W6", "People & HR"],
  ["W7", "Go-To-Market"],
  ["W8", "Operations"],
];

const COMPETITORS: [string, string, string][] = [
  ["Stripe Atlas", "Formation", "Stops once you're incorporated."],
  ["Clerky", "Legal paperwork", "Documents, but no guidance or order."],
  ["Carta", "Cap table", "One ledger, after the fact."],
  ["Mercury", "Banking", "An account, nothing more."],
];

const STEPS: [string, string, string][] = [
  ["01", "Validate the idea", "Answer a short brief. We detect your stage, score readiness 0–100, and flag the risks that kill startups early."],
  ["02", "Open the record", "A 3-minute intake mints your Company Object — one versioned source of truth across ten domains."],
  ["03", "Execute, in order", "W1 unlocks W2–W8 as you go. We file it for you through an integration, or you do it and confirm."],
];

export default function Home() {
  return (
    <div className="space-y-24">
      {/* HERO — signature: the living company record */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="animate-fade-up">
          <p className="eyebrow">Startup Operating System</p>
          <h1 className="mt-4 font-disp text-5xl font-extrabold leading-[1.02] text-ink sm:text-6xl">
            Incorporate, protect, fund, and hire&nbsp;—{" "}
            <span className="text-teal">in exactly the right order.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            StartupKit keeps your whole company in one living, versioned record — and tells you the
            next right move, from your first customer interview to your Series&nbsp;A.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/validate" className="btn-primary">
              Validate my idea →
            </Link>
            <span className="font-mono text-xs text-muted">≈ 3 min · no account needed</span>
          </div>
          <p className="mt-8 rule">Born in a day · kept current for life</p>
        </div>
        <div className="lg:pl-4">
          <CompanyRecord />
        </div>
      </section>

      {/* COMPETITOR LEDGER — each tool owns one row; StartupKit owns the column */}
      <section>
        <p className="eyebrow">The fragmented stack</p>
        <h2 className="mt-3 max-w-2xl font-disp text-3xl font-bold text-ink">
          Every other tool does one slice. You&apos;re left guessing the order.
        </h2>
        <div className="mt-8 overflow-hidden rounded-2xl border border-line">
          {COMPETITORS.map(([name, slice, note], i) => (
            <div
              key={name}
              className={`grid grid-cols-[1fr,1fr,2fr] items-center gap-4 px-5 py-4 ${
                i % 2 ? "bg-panel" : "bg-paper"
              }`}
            >
              <span className="font-disp text-lg font-semibold text-ink">{name}</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-seal-ink">
                {slice}
              </span>
              <span className="text-sm text-muted">{note}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr,1fr,2fr] items-center gap-4 bg-forest px-5 py-4">
            <span className="font-disp text-lg font-bold text-paper">StartupKit</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-seal-soft">
              The whole record
            </span>
            <span className="text-sm text-paper/80">
              Guidance, state, and sequencing — the layer above all of them.
            </span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — a real ordered process, so numbered markers earn their place */}
      <section>
        <p className="eyebrow">How it works</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map(([n, title, body]) => (
            <div key={n} className="card card-hover p-6">
              <span className="font-mono text-sm font-bold text-seal">{n}</span>
              <div className="mt-3 h-px w-10 bg-seal/40" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE SEQUENCE — eight workflows as a true dependency order */}
      <section>
        <p className="eyebrow">The sequence</p>
        <h2 className="mt-3 font-disp text-3xl font-bold text-ink">
          Eight workflows. Formation unlocks the rest.
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {WORKFLOWS.map(([code, name], i) => (
            <div key={code} className="card p-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-seal-ink">{code}</span>
                {i === 0 && (
                  <span className="badge bg-seal-soft text-seal-ink">start</span>
                )}
              </div>
              <p className="mt-2 font-disp text-base font-semibold text-ink">{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-forest px-8 py-14 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-seal-soft">
          Open your record
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl font-disp text-4xl font-bold text-paper">
          Born in a day. Kept current for life.
        </h2>
        <Link href="/validate" className="btn-seal mt-7">
          Validate my idea — free →
        </Link>
      </section>
    </div>
  );
}
