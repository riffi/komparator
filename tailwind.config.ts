import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        code: "rgb(var(--code) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        dim: "rgb(var(--dim) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-soft": "rgb(var(--primary-soft) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"]
      },
      boxShadow: {
        panel: "0 10px 30px rgba(0, 0, 0, 0.28)"
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px"
      }
    }
  },
  plugins: []
} satisfies Config;
