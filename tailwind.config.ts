import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', "sans-serif"],
        serif: ['"Shippori Mincho B1"', '"Noto Serif JP"', "serif"],
        display: ['"Shippori Mincho B1"', '"Noto Serif JP"', "serif"],
      },
      colors: {
        // Vermilion accent (replaces previous indigo "primary")
        primary: {
          50: "#fff1eb",
          100: "#ffd9c7",
          200: "#ffb89c",
          300: "#ff9270",
          400: "#ff7548",
          500: "#ff5722",
          600: "#e64500",
          700: "#b83700",
          800: "#8c2a00",
          900: "#5c1d00",
        },
        // Editorial palette
        paper: "#f0ede5",
        "paper-deep": "#e6e1d3",
        ink: "#1a1a1a",
        "ink-muted": "#6b6657",
        "ink-soft": "#9a9384",
        "rule": "#d9d2c2",
      },
      borderRadius: {
        pill: "30px",
      },
      maxWidth: {
        container: "1300px",
      },
      boxShadow: {
        card: "0 2px 10px rgba(0,0,0,0.08)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.12)",
        "btn-hover": "0 5px 5px rgba(0,0,0,0.1)",
      },
      keyframes: {
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "toast-in": {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        scroll: "scroll 30s linear infinite",
        marquee: "marquee 40s linear infinite",
        "toast-in": "toast-in 220ms ease-out",
      },
      letterSpacing: {
        "tightest-x": "-0.04em",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
