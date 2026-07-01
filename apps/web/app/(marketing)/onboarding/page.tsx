"use client";

// W0 Assessment — the four routing questions asked right after idea validation (per the W1
// Formation Journey spec). Answers are stashed for the intake step, which persists them onto the
// Company Object so later phases can route build-vs-import, compliance rule-pack, and co-founder flow.
import { useRouter } from "next/navigation";
import { useState } from "react";

const INDUSTRIES = [
  "SaaS / Software",
  "Fintech",
  "Healthtech",
  "AI / ML",
  "Marketplace",
  "Consumer",
  "Hardware",
  "Biotech",
  "Other / Not sure",
];

const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

type W0 = {
  team: "solo" | "cofounders" | "";
  formation_mode: "build" | "import" | "";
  industry: string;
  state_of_operation: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [a, setA] = useState<W0>({ team: "", formation_mode: "", industry: "", state_of_operation: "" });

  const canContinue = a.team && a.formation_mode; // industry/state have safe defaults ("not sure")

  function proceed() {
    sessionStorage.setItem(
      "sk_w0",
      JSON.stringify({
        is_solo_founder: a.team === "solo",
        formation_mode: a.formation_mode || "build",
        industry: a.industry || "Other / Not sure",
        state_of_operation: a.state_of_operation || "Not sure",
      }),
    );
    router.push("/intake");
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <p className="eyebrow text-center">Step 2 · Quick setup</p>
      <h1 className="mt-2 text-center text-4xl font-extrabold tracking-tight">
        A few quick questions.
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-ink-soft">
        These four answers tailor everything that follows — so you&apos;re only ever asked what
        actually applies to you. You can change them later.
      </p>

      <div className="mt-8 space-y-5">
        <Choice
          label="Are you building this solo or with co-founders?"
          why="If you have co-founders, we'll set up the equity split and get everyone to sign; solo founders skip all of that."
          value={a.team}
          onChange={(v) => setA({ ...a, team: v as W0["team"] })}
          options={[
            { value: "solo", label: "Solo", sub: "Just me for now" },
            { value: "cofounders", label: "With co-founders", sub: "Two or more founders" },
          ]}
        />

        <Choice
          label="Have you already incorporated?"
          why="Not yet → we generate your formation documents from scratch. Already done → you upload what you have and we fill the gaps."
          value={a.formation_mode}
          onChange={(v) => setA({ ...a, formation_mode: v as W0["formation_mode"] })}
          options={[
            { value: "build", label: "Not yet", sub: "Help me incorporate" },
            { value: "import", label: "Already incorporated", sub: "I'll upload my docs" },
          ]}
        />

        <Field
          label="What industry are you in?"
          why="Loads the right compliance rules — fintech and healthtech have extra requirements SaaS doesn't."
        >
          <select
            className="field-input"
            value={a.industry}
            onChange={(e) => setA({ ...a, industry: e.target.value })}
          >
            <option value="">Select…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="What state do you mainly operate in?"
          why="If you incorporate in Delaware but operate elsewhere, we'll flag the 'foreign qualification' you'll need in your home state."
        >
          <select
            className="field-input"
            value={a.state_of_operation}
            onChange={(e) => setA({ ...a, state_of_operation: e.target.value })}
          >
            <option value="">Select…</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button onClick={proceed} disabled={!canContinue} className="btn-primary mt-7 w-full">
        Continue →
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Not sure on industry or state? Leave them — we default sensibly and you can change them anytime.
      </p>
    </div>
  );
}

function Choice({
  label,
  why,
  value,
  onChange,
  options,
}: {
  label: string;
  why: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; sub: string }[];
}) {
  return (
    <div className="card p-5">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-1 text-xs text-muted">{why}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? "border-seal bg-seal-soft/50 ring-1 ring-seal"
                  : "border-line bg-paper hover:border-seal/50"
              }`}
            >
              <span className="block text-sm font-semibold text-ink">{o.label}</span>
              <span className="block text-xs text-muted">{o.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  why,
  children,
}: {
  label: string;
  why: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-1 mb-3 text-xs text-muted">{why}</p>
      {children}
    </div>
  );
}
