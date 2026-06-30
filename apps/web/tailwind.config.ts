import type { Config } from "tailwindcss";

// Design tokens adopted from the StartupKit question templates (Questoins/*.html):
// pulse blue primary + ember accent, on cool paper — a clean, modern product look.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171A21",
        "ink-soft": "#2A2F39",
        muted: "#5C6573",
        paper: "#F3F5F2",
        panel: "#FFFFFF",
        "surface-2": "#FAFBF9",
        line: "#E3E7E2",
        "line-strong": "#CDD3CC",
        // primary — "pulse" (kept under the `teal` token name used across the app)
        teal: { DEFAULT: "#2536E8", 50: "#E7E9FC", 100: "#D5D9FA", 600: "#1B2BC0", 900: "#141C8C" },
        // accent — "ember" (kept under the `seal` token name)
        seal: { DEFAULT: "#D9842A", soft: "#F7ECDD", ink: "#8A4E10" },
        forest: "#171A21",
        mint: "#2536E8",
        blue: { DEFAULT: "#2536E8", 50: "#E7E9FC" },
        amber: { DEFAULT: "#B5780F", 50: "#FAF0DC" },
        coral: "#D9842A",
        danger: "#B23A2E",
        fuse: "#B23A2E",
      },
      fontFamily: {
        disp: ['"Inter"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,26,33,0.04), 0 10px 28px -16px rgba(23,26,33,0.12)",
        lift: "0 18px 44px -18px rgba(37,54,232,0.26)",
        seal: "0 6px 18px -6px rgba(217,132,42,0.45)",
      },
      borderRadius: { "2xl": "1.05rem", "3xl": "1.5rem" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fade-up 0.5s ease-out both" },
    },
  },
  plugins: [],
};

export default config;
