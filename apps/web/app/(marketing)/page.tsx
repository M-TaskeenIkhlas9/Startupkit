import Link from "next/link";

const STEPS: [string, string, string][] = [
  [
    "1",
    "Validate your idea",
    "Tell us your idea. Your AI co-founder gives an honest verdict — is it worth building, and what to improve.",
  ],
  [
    "2",
    "Set up your company",
    "A 3-minute setup creates one living record of your startup that stays up to date as you grow.",
  ],
  [
    "3",
    "Get guided, step by step",
    "We tell you exactly what to do next — and handle the paperwork for formation, legal, banking, and hiring.",
  ],
];

export default function Home() {
  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="mx-auto max-w-3xl pt-10 text-center">
        <p className="eyebrow">Your AI Co-Founder</p>
        <h1 className="mt-5 font-disp text-5xl font-extrabold leading-[1.05] text-ink sm:text-6xl">
          From idea to funded,{" "}
          <span className="text-teal">guided every step.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-soft">
          StartupKit is the AI co-founder that checks if your idea works, tells you exactly what to
          do next, and handles the legal and financial paperwork — in the right order.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3">
          <Link href="/validate" className="btn-primary px-7 py-3.5 text-base">
            Validate my idea — free →
          </Link>
          <span className="font-mono text-xs text-muted">≈ 3 minutes · no account needed</span>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <h2 className="text-center font-disp text-3xl font-bold text-ink">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map(([n, title, body]) => (
            <div key={n} className="card p-7">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-sm font-bold text-white">
                {n}
              </span>
              <h3 className="mt-5 font-disp text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="rounded-3xl bg-ink px-8 py-16 text-center">
        <h2 className="mx-auto max-w-xl font-disp text-3xl font-bold text-white sm:text-4xl">
          Born in a day. Kept current for life.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-paper/60">
          Start with your idea — no account, no card, no risk.
        </p>
        <Link href="/validate" className="btn-seal mt-8 px-7 py-3.5 text-base">
          Get started — free →
        </Link>
      </section>
    </div>
  );
}
