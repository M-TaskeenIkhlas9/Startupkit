// Signature element: StartupKit's actual output rendered as a living legal-style record —
// a filing header, a wax-seal Health score, and the W1→W8 sequence stamping in on load.

const SEQ: { code: string; state: "done" | "current" | "locked" }[] = [
  { code: "W1", state: "done" },
  { code: "W2", state: "done" },
  { code: "W3", state: "done" },
  { code: "W4", state: "current" },
  { code: "W5", state: "locked" },
  { code: "W6", state: "locked" },
  { code: "W7", state: "locked" },
  { code: "W8", state: "locked" },
];

export function CompanyRecord() {
  return (
    <div className="card animate-fade-up overflow-hidden p-0">
      {/* filing header */}
      <div className="flex items-center justify-between bg-forest px-5 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-seal-soft">
          Company Record
        </span>
        <span className="font-mono text-[11px] tracking-wider text-paper/70">
          CO-20260621-NW01
        </span>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-disp text-2xl font-bold text-ink">Northwind Labs</h3>
            <p className="mt-1 text-sm text-ink-soft">AI pick-path optimizer for 3PL warehouses</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="chip">Delaware C-Corp</span>
              <span className="chip">first revenue</span>
            </div>
          </div>

          {/* wax-seal Health score */}
          <div className="shrink-0 text-center">
            <div
              className="seal-ring mx-auto h-20 w-20 animate-stamp"
              style={{
                background: "conic-gradient(#B6802A 266deg, #E2E1D5 266deg)",
              }}
            >
              <div className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full bg-panel">
                <span className="font-disp text-xl font-bold text-ink">74</span>
              </div>
            </div>
            <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-widest text-seal-ink">
              Health
            </span>
          </div>
        </div>

        <div className="my-5 border-t border-dashed border-line" />

        {/* the dependency sequence — a real order, stamped in */}
        <p className="rule mb-3">Workflow sequence</p>
        <div className="flex items-center justify-between">
          {SEQ.map((s, i) => (
            <div key={s.code} className="flex flex-1 items-center">
              <div
                className="animate-draw-in font-mono text-xs font-bold"
                style={{ animationDelay: `${0.5 + i * 0.07}s` }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    s.state === "done"
                      ? "bg-teal text-paper"
                      : s.state === "current"
                        ? "bg-seal text-white shadow-seal"
                        : "border border-line bg-paper text-muted"
                  }`}
                >
                  {s.state === "done" ? "✓" : s.code}
                </span>
              </div>
              {i < SEQ.length - 1 && (
                <div
                  className={`h-px flex-1 ${s.state === "done" ? "bg-teal/40" : "bg-line"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between font-mono text-[11px] text-muted">
          <span>v12 · updated 2m ago</span>
          <span>10 domains in sync</span>
        </div>
      </div>
    </div>
  );
}
