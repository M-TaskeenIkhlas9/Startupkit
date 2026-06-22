import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15170F",
        "ink-soft": "#4C4F40",
        muted: "#757765",
        paper: "#F2F2EA",
        panel: "#FBFAF4",
        line: "#E2E1D5",
        // brand green scale (primary action) — kept as `teal` token for continuity
        teal: { DEFAULT: "#0F6E56", 50: "#E4F1EB", 100: "#C9E5D9", 600: "#0B5642", 900: "#0A3326" },
        forest: "#0C3A2C",
        seal: { DEFAULT: "#B6802A", soft: "#F2E6C8", ink: "#5E3F0E" },
        fuse: "#B23A2E",
        // workflow accents (data-driven elsewhere, kept for chips)
        blue: { DEFAULT: "#185FA5", 50: "#E6F1FB" },
        amber: { DEFAULT: "#B5780F", 50: "#FAF0DC" },
        coral: "#D85A30",
        danger: "#A32D2D",
      },
      fontFamily: {
        disp: ['"Bricolage Grotesque"', "sans-serif"],
        body: ['"Hanken Grotesk"', "sans-serif"],
        mono: ['"Space Mono"', "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,23,15,0.04), 0 12px 30px -16px rgba(21,23,15,0.16)",
        lift: "0 24px 60px -24px rgba(12,58,44,0.34)",
        seal: "0 6px 18px -6px rgba(182,128,42,0.5)",
      },
      borderRadius: { "2xl": "1.05rem", "3xl": "1.5rem" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        stamp: {
          "0%": { opacity: "0", transform: "scale(1.4) rotate(-8deg)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-4deg)" },
        },
        "draw-in": {
          "0%": { opacity: "0", transform: "translateX(-6px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        stamp: "stamp 0.6s cubic-bezier(0.2,0.8,0.2,1) 0.35s both",
        "draw-in": "draw-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
