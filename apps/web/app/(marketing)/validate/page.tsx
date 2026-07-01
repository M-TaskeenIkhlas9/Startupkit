"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ideaChat } from "@/lib/api";
import { ValidationSprint, type SprintReport } from "@/components/validation-sprint";
import type { ChatExample, ChatSource } from "@/lib/types";

type ChatMsg = {
  role: "user" | "cofounder";
  content: string;
  question?: string;
  steps?: string[];
  examples?: ChatExample[];
  sources?: ChatSource[];
};

const VERDICT_COLOR: Record<string, string> = {
  "strong-go": "#1F9D57",
  promising: "#2536E8",
  "needs-work": "#D9842A",
  pivot: "#B23A2E",
};
const VERDICT_SCORE: Record<string, number> = {
  "strong-go": 75,
  promising: 60,
  "needs-work": 40,
  pivot: 20,
};

function humanize(k: string): string {
  return k.replace(/_/g, " ");
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function ValidatePage() {
  const router = useRouter();
  const [idea, setIdea] = useState({ problem: "", customer: "", solution: "" });
  const [notes, setNotes] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [facts, setFacts] = useState<Record<string, string>>({});
  const [verdict, setVerdict] = useState("");
  const [ready, setReady] = useState(false);
  const [concluded, setConcluded] = useState(false);
  const [sprintSteps, setSprintSteps] = useState<string[]>([]);
  const [riskiest, setRiskiest] = useState("");
  const [showSprint, setShowSprint] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const history = messages;
    setMessages([...history, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const r = await ideaChat({ ...idea, facts, messages: history, user_message: text });
      setMessages((m) => [
        ...m,
        {
          role: "cofounder",
          content: r.reply,
          question: r.question,
          steps: r.next_steps,
          examples: r.examples,
          sources: r.sources,
        },
      ]);
      setFacts(r.facts);
      setVerdict(r.verdict || verdict);
      setReady(r.ready);
      if (r.concluded) setConcluded(true);
      if (r.next_steps.length) setSprintSteps(r.next_steps);
      if (r.riskiest_assumption) setRiskiest(r.riskiest_assumption);
      if (r.refined_problem) setIdea((i) => ({ ...i, problem: r.refined_problem }));
      if (r.refined_solution) setIdea((i) => ({ ...i, solution: r.refined_solution }));
    } finally {
      setBusy(false);
    }
  }

  // Founder reports real-world results from the sprint -> co-founder re-scores on evidence.
  async function reportResults(results: string): Promise<SprintReport> {
    const r = await ideaChat({
      ...idea,
      facts,
      messages,
      user_message: `Here's what I learned talking to customers: ${results}`,
    });
    setFacts(r.facts);
    if (r.verdict) setVerdict(r.verdict);
    setMessages((m) => [
      ...m,
      { role: "user", content: `What I learned: ${results}` },
      { role: "cofounder", content: r.reply, steps: r.next_steps, sources: r.sources },
    ]);
    return {
      reply: r.reply,
      verdict: r.verdict,
      nextSteps: r.next_steps,
      riskiest: r.riskiest_assumption,
    };
  }

  function start() {
    setStarted(true);
    const extra = notes.trim() ? ` Other context: ${notes.trim()}.` : "";
    void send(
      `Here's my idea. Problem: ${idea.problem}. Customer: ${idea.customer}. Solution: ${idea.solution}.${extra}`,
    );
  }

  // Hand off to the Company Object build. Works from the intro (skip), mid-chat (skip), or after
  // the sprint. The "anything else" note rides along in facts so it lands on the Company Object.
  function proceed() {
    const allFacts = notes.trim() ? { ...facts, about_your_idea: notes.trim() } : facts;
    sessionStorage.setItem(
      "sk_validation",
      JSON.stringify({
        answers: { problem: idea.problem, customer: idea.customer, solution: idea.solution },
        assessment: {
          detected_stage: "problem-solution-fit",
          readiness_score: VERDICT_SCORE[verdict] ?? 45,
        },
        reasoning: { verdict: verdict || "promising" },
        facts: allFacts,
      }),
    );
    router.push("/onboarding");
  }

  const canStart = idea.problem.trim() && idea.customer.trim() && idea.solution.trim();

  // --- intro: capture the idea ---
  if (!started) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up">
        <p className="eyebrow text-center">Step 1 · Meet your AI Co-Founder</p>
        <h1 className="mt-2 text-center text-4xl font-bold">Let&apos;s shape your idea together.</h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-ink-soft">
          Tell your co-founder the basics. Then you&apos;ll talk it through — refining the idea and
          answering a few questions. Everything you say is remembered, so you never repeat yourself.
        </p>
        <div className="card mt-8 space-y-5 p-7">
          <Field label="What problem are you solving?">
            <textarea
              className="field-input min-h-[72px] resize-none"
              value={idea.problem}
              onChange={(e) => setIdea({ ...idea, problem: e.target.value })}
              placeholder="Small law firms waste hours drafting routine client letters…"
            />
          </Field>
          <Field label="Who has this problem?">
            <input
              className="field-input"
              value={idea.customer}
              onChange={(e) => setIdea({ ...idea, customer: e.target.value })}
              placeholder="Solo and small-firm attorneys"
            />
          </Field>
          <Field label="What's your solution?">
            <textarea
              className="field-input min-h-[72px] resize-none"
              value={idea.solution}
              onChange={(e) => setIdea({ ...idea, solution: e.target.value })}
              placeholder="AI that drafts standard legal client documents from a short intake form…"
            />
          </Field>
          <Field label="Anything else about your idea? (optional)">
            <textarea
              className="field-input min-h-[64px] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Traction, your background, what makes it different, pricing thoughts…"
            />
          </Field>
        </div>
        <button onClick={start} disabled={!canStart} className="btn-primary mt-6 w-full">
          Talk to my co-founder →
        </button>
        <button
          onClick={proceed}
          disabled={!canStart}
          className="mt-3 w-full text-sm font-medium text-muted underline-offset-2 transition hover:text-ink hover:underline disabled:opacity-50 disabled:hover:no-underline"
        >
          Skip the chat — build my Company Object →
        </button>
      </div>
    );
  }

  // --- validation sprint (after the co-founder concludes) ---
  if (showSprint) {
    return (
      <ValidationSprint
        idea={idea}
        verdict={verdict || "promising"}
        nextSteps={sprintSteps}
        riskiest={riskiest}
        onReport={reportResults}
        onBuild={proceed}
      />
    );
  }

  // --- conversation ---
  return (
    <div className="mx-auto grid max-w-5xl animate-fade-up gap-6 lg:grid-cols-[1.55fr,1fr]">
      <div className="card flex h-[70vh] flex-col p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-xs text-seal-soft">
              ◆
            </span>
            <span className="font-semibold text-ink">Your AI Co-Founder</span>
          </div>
          <button
            onClick={proceed}
            className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted transition hover:border-ink/30 hover:text-ink"
          >
            Skip chat — build company →
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto py-5">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-teal px-4 py-2.5 text-sm text-white">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={i} className="flex max-w-[88%] flex-col gap-2">
                <p className="rounded-2xl rounded-bl-sm border border-line bg-paper px-4 py-2.5 text-sm text-ink">
                  {m.content}
                </p>
                {m.steps && m.steps.length > 0 && (
                  <div className="rounded-xl border border-seal/40 bg-seal-soft/40 px-3.5 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-seal-ink">
                      Your next moves
                    </p>
                    <ol className="mt-1.5 space-y-1.5">
                      {m.steps.map((s, j) => (
                        <li key={j} className="flex gap-2 text-xs text-ink">
                          <span className="font-mono font-bold text-seal-ink">{j + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {m.examples && m.examples.length > 0 && (
                  <div className="space-y-1.5 pl-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                      Who&apos;s done this
                    </p>
                    {m.examples.map((ex, j) => (
                      <div
                        key={j}
                        className="rounded-xl border border-line bg-teal-50/60 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-teal-900">{ex.company}</span>
                        <span className="text-ink-soft"> — {ex.takeaway}</span>
                      </div>
                    ))}
                  </div>
                )}
                {m.sources && m.sources.length > 0 && (
                  <div className="pl-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                      Researched live
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {m.sources.map((s, j) => (
                        <a
                          key={j}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-[220px] truncate rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] text-ink-soft transition hover:border-seal hover:text-seal-ink"
                          title={s.title}
                        >
                          ↗ {hostOf(s.url)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {m.question && (
                  <div className="rounded-xl border-l-2 border-teal bg-teal-50/40 px-3.5 py-2 text-sm font-medium text-ink">
                    {m.question}
                  </div>
                )}
              </div>
            ),
          )}
          {busy && <p className="text-xs text-muted">Co-founder is thinking…</p>}
          <div ref={endRef} />
        </div>
        {concluded ? (
          <div className="border-t border-line pt-3">
            <button onClick={() => setShowSprint(true)} className="btn-primary w-full">
              See your validation sprint →
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Validation complete — or keep chatting to dig deeper.
            </p>
          </div>
        ) : (
          messages.length >= 2 &&
          !busy && (
            <div className="flex justify-center border-t border-line pt-3">
              <button
                onClick={() => send("I'm ready — give me your final verdict and a build plan.")}
                className="text-xs font-medium text-seal-ink underline-offset-2 hover:underline"
              >
                I&apos;m ready — wrap up &amp; get the verdict →
              </button>
            </div>
          )
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex gap-2"
        >
          <input
            className="field-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Answer, or ask anything…"
          />
          <button type="submit" disabled={busy} className="btn-primary shrink-0">
            Send
          </button>
        </form>
      </div>

      {/* what the co-founder knows */}
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Your idea</h2>
            {verdict && (
              <span
                className="badge uppercase"
                style={{ background: `${VERDICT_COLOR[verdict]}1a`, color: VERDICT_COLOR[verdict] }}
              >
                {verdict.replace("-", " ")}
              </span>
            )}
          </div>
          <p className="mt-3 text-xs font-medium text-muted">PROBLEM</p>
          <p className="text-sm text-ink">{idea.problem}</p>
          <p className="mt-2 text-xs font-medium text-muted">SOLUTION</p>
          <p className="text-sm text-ink">{idea.solution}</p>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink">
            What we&apos;ve saved{" "}
            <span className="font-mono text-xs text-muted">{Object.keys(facts).length}</span>
          </h2>
          <p className="mt-1 text-xs text-muted">
            Captured from your answers — we won&apos;t ask these again.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.keys(facts).length === 0 ? (
              <span className="text-sm text-ink-soft">Nothing yet — keep chatting.</span>
            ) : (
              Object.entries(facts).map(([k, v]) => (
                <span key={k} className="chip normal-case">
                  ✓ {humanize(k)}: {v}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <button onClick={proceed} disabled={!verdict} className="btn-seal w-full">
            {ready ? "Idea is ready — build it →" : "Build Company Object →"}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            {ready
              ? "Your co-founder thinks this is solid."
              : "Keep refining, or proceed whenever you're ready."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
