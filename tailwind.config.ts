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
      },
      colors: {
        primary: {
          50: "#ededfe",
          100: "#d5d7fd",
          200: "#b0b4fb",
          300: "#8b91fa",
          400: "#6f75f9",
          500: "#5863f8",
          600: "#4a54e6",
          700: "#3d46c9",
          800: "#3139ab",
          900: "#262d8e",
        },
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
      },
      animation: {
        scroll: "scroll 30s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
