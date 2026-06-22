import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "StartupKit — The Operating System for Founders",
  description: "Born in a day. Kept current for life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-forest font-mono text-sm font-bold text-seal-soft">
                S
              </span>
              <span className="font-disp text-lg font-bold text-ink">
                StartupKit
              </span>
            </Link>
            <div className="flex items-center gap-5">
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-muted sm:inline">
                Phase 1 · Foundation
              </span>
              <Link
                href="/validate"
                className="rounded-lg bg-seal px-4 py-1.5 text-sm font-semibold text-white shadow-seal transition hover:bg-seal-ink"
              >
                Start
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 font-mono text-[11px] uppercase tracking-wider text-muted">
            <span>StartupKit · TensorFold</span>
            <span>Born in a day · kept current for life</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
