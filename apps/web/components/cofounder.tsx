"use client";

import { useState } from "react";
import { askCofounder, checkGuardrail } from "@/lib/api";
import type { Answer, GuardrailAction, GuardrailResult } from "@/lib/types";

const QUICK = [
  "What should I do next?",
  "What are my biggest risks?",
  "How healthy is my company?",
  "What's due soon?",
  "Do I need an 83(b) election?",
];

const ACTIONS: { key: GuardrailAction; label: string }[] = [
  { key: "hire-employee", label: "Hire an employee" },
  { key: "raise-round", label: "Raise a round" },
  { key: "issue-equity", label: "Issue equity" },
  { key: "open-banking", label: "Open banking" },
  { key: "sign-customer", label: "Sign a customer" },
];

type Msg = { role: "user"; text: string } | { role: "assistant"; answer: Answer };

export function CoFounder({ companyId }: { companyId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(question: string) {
    if (!question.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const { answer } = await askCofounder(companyId, question);
      setMsgs((m) => [...m, { role: "assistant", answer }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      {/* Chat */}
      <div className="card flex min-h-[460px] flex-col p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-seal-soft">
            ◆
          </span>
          <div>
            <h2 className="font-semibold text-ink">AI Co-Founder</h2>
            <p className="text-xs text-muted">Grounded in your live Company Object.</p>
          </div>
        </div>

        <div className="mt-5 flex-1 space-y-4 overflow-y-auto">
          {msgs.length === 0 && (
            <div className="rounded-xl border border-dashed border-line p-5 text-sm text-ink-soft">
              Ask me anything about your company — what to do next, your risks, your health, or
              whether you&apos;re ready for a big move.
            </div>
          )}
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-forest px-4 py-2 text-sm text-paper">
                  {m.text}
                </p>
              </div>
            ) : (
              <AnswerBubble key={i} answer={m.answer} />
            ),
          )}
          {busy && <p className="text-xs text-muted">Thinking…</p>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink-soft transition hover:border-seal hover:text-seal-ink"
            >
              {q}
            </button>
          ))}
        </div>
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
            placeholder="Ask your co-founder…"
          />
          <button type="submit" disabled={busy} className="btn-primary shrink-0">
            Ask
          </button>
        </form>
      </div>

      {/* Guardrails — "Can I…?" */}
      <GuardrailChecker companyId={companyId} />
    </div>
  );
}

function AnswerBubble({ answer }: { answer: Answer }) {
  return (
    <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-line bg-paper p-4">
      <p className="font-semibold text-ink">{answer.headline}</p>
      <p className="mt-1 text-sm text-ink-soft">{answer.detail}</p>
      {answer.facts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {answer.facts.map((f) => (
            <span key={f} className="chip normal-case">
              {f}
            </span>
          ))}
        </div>
      )}
      {answer.actions.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {answer.actions.map((a, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm">
              {a.workflow && (
                <span className="font-mono text-xs font-bold text-teal-900">{a.workflow}</span>
              )}
              <span className="text-ink">{a.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const VERDICT_STYLE: Record<GuardrailResult["verdict"], { bg: string; fg: string; icon: string }> = {
  safe: { bg: "#E4F1EB", fg: "#0A3326", icon: "✓" },
  caution: { bg: "#F2E6C8", fg: "#5E3F0E", icon: "!" },
  blocked: { bg: "#F8EAE8", fg: "#A32D2D", icon: "✗" },
};

function GuardrailChecker({ companyId }: { companyId: string }) {
  const [result, setResult] = useState<GuardrailResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: GuardrailAction) {
    setBusy(action);
    try {
      setResult(await checkGuardrail(companyId, action));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-ink">&ldquo;Can I…?&rdquo;</h2>
      <p className="mt-1 text-xs text-muted">
        Check prerequisites before a big move. We prevent mistakes, not just warn.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() => run(a.key)}
            disabled={busy === a.key}
            className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink-soft transition hover:border-seal hover:text-seal-ink"
          >
            {a.label}
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-5">
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{
              background: VERDICT_STYLE[result.verdict].bg,
              color: VERDICT_STYLE[result.verdict].fg,
            }}
          >
            <span className="font-bold">{VERDICT_STYLE[result.verdict].icon}</span>
            <div>
              <p className="text-sm font-semibold">{result.action}</p>
              <p className="text-xs">{result.headline}</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {result.prerequisites.map((p) => (
              <div key={p.label} className="rounded-lg border border-line bg-paper px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className={p.met ? "text-teal" : "text-fuse"}>{p.met ? "✓" : "✗"}</span>
                  <span className="font-medium text-ink">{p.label}</span>
                  {!p.required && (
                    <span className="font-mono text-[10px] uppercase text-muted">recommended</span>
                  )}
                </div>
                {!p.met && p.fix && <p className="mt-1 pl-6 text-xs text-ink-soft">{p.fix}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
