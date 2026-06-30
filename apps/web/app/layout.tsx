import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StartupKit — The Operating System for Founders",
  description: "Born in a day. Kept current for life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper">{children}</body>
    </html>
  );
}
