import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Nordic / soft tone — Zen Kaku Gothic New + Lato (reference site)
        sans: ['"Zen Kaku Gothic New"', '"Lato"', '"Noto Sans JP"', "sans-serif"],
        serif: ['"Zen Kaku Gothic New"', '"Noto Sans JP"', "sans-serif"],
        display: ['"Zen Kaku Gothic New"', '"Lato"', '"Noto Sans JP"', "sans-serif"],
        latin: ['"Lato"', "sans-serif"],
      },
      colors: {
        // Primary = soft blue (ref: #2e6ca0)
        primary: {
          50: "#ecf3f9",
          100: "#d3e1ed",
          200: "#a8c4db",
          300: "#7da7c9",
          400: "#528ab7",
          500: "#2e6ca0",
          600: "#245680",
          700: "#1b4060",
          800: "#122b40",
          900: "#091520",
        },
        // Accent = warm yellow (ref: #f7cd47)
        accent: {
          50: "#fef8e0",
          100: "#fdeeb3",
          200: "#fbe282",
          300: "#f9d655",
          400: "#f8cf4f",
          500: "#f7cd47",
          600: "#d9b13e",
          700: "#a6873b",
          800: "#7d6634",
          900: "#54442c",
        },
        // Cream paper background — warm, well-being feel
        paper: "#fdf9ee",
        "paper-deep": "#f6eed9",
        "paper-card": "#ffffff",
        ink: "#2a2a32",
        "ink-muted": "#6b6877",
        "ink-soft": "#a09da9",
        rule: "#e8e1cf",
        // Soft accent backgrounds
        sky: "#dceaf4",
        leaf: "#cfe3ce",
        peach: "#f7d9c4",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        md: "16px",
        lg: "20px",
        xl: "28px",
        "2xl": "36px",
        pill: "999px",
        blob: "48% 52% 70% 30% / 40% 50% 50% 60%",
      },
      maxWidth: {
        container: "1300px",
      },
      boxShadow: {
        card: "0 4px 16px rgba(46,108,160,0.08)",
        "card-hover": "0 8px 28px rgba(46,108,160,0.14)",
        "btn-hover": "0 6px 0 rgba(46,108,160,0.18)",
        soft: "0 2px 10px rgba(0,0,0,0.04)",
        pop: "6px 6px 0 0 rgba(42,42,50,1)",
        "pop-blue": "6px 6px 0 0 rgba(46,108,160,1)",
        "pop-yellow": "6px 6px 0 0 rgba(247,205,71,1)",
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
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        scroll: "scroll 30s linear infinite",
        marquee: "marquee 40s linear infinite",
        "toast-in": "toast-in 220ms ease-out",
        wiggle: "wiggle 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        sway: "sway 5s ease-in-out infinite",
      },
      letterSpacing: {
        "tightest-x": "-0.02em",
        normal: "0.02em",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
