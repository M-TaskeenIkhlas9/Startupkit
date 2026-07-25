/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" is for the Docker path only (apps/web/Dockerfile copies .next/standalone into
  // the runtime stage) — Vercel has its own build/output handling and this actively breaks it
  // ("No Output Directory named 'public'"), so skip it when VERCEL is set (Vercel sets this
  // automatically on every build).
  output: process.env.VERCEL ? undefined : "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};

export default nextConfig;
