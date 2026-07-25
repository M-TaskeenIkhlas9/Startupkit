/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal, self-contained build output — what apps/web/Dockerfile copies into the runtime stage.
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};

export default nextConfig;
