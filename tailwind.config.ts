import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 2026-06-16 Step 1: ハイエンド土台へ刷新。
        // Display (英文・巨大見出し) = Fraunces セリフ (Axis "We" / "Movie" 系)
        // serif (本文/見出し JA) = Noto Serif JP (明朝)
        // sans (英文 UI / Fallback JA) = Inter + Noto Sans JP + 旧 Zen Kaku
        // mono (番号/ラベル) = JetBrains Mono
        // latin は旧 Lato 系の互換キー (削除はせずに残置)
        sans: ['"Inter"', '"Noto Sans JP"', '"Zen Kaku Gothic New"', "sans-serif"],
        serif: ['"Noto Serif JP"', "serif"],
        display: ['"Fraunces"', '"Noto Serif JP"', "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        latin: ['"Inter"', '"Lato"', "sans-serif"],
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
        // 2026-06-16 Step 1: ハイエンド土台 (Axis 風) のコアトークン。
        // 純白 / 純黒に近い深ネイビー / 単一ベージュアクセント。
        // ※ 既存キー (paper / ink / ink-muted / ink-soft / rule) の値だけ
        //    引き締まる方向に上書き。クラス名互換は維持されるため、ページ側で
        //    `bg-paper` `text-ink` 等を使っているコードは無修正で締まる。
        paper: "#ffffff",
        "paper-deep": "#f4ede4", // ベージュサンド (旧 cream の deep をベージュ寄りに)
        "paper-warm": "#f4ede4", // 新規 alias (意図を明示)
        "paper-card": "#ffffff",
        ink: "#0a0d12", // 旧 #2a2a32 → さらに深い純黒寄り
        "ink-deep": "#06080b", // 最深 BG (Hero / Section ヘッダ)
        "ink-muted": "#5e636b", // 控え目テキスト
        "ink-soft": "#9298a1", // 補助 (キャプション)
        rule: "#1a1f27", // 暗背景上の薄い罫線
        // 2026-06-17: サイト全体を白基調に振った際に、薄ベージュ #e8d6cd だと
        // 白背景でほぼ見えなくなるため、深めのセピアに置換。
        // 暗背景 (Hero) では従来通り華やかなアクセントとして機能する。
        sand: {
          DEFAULT: "#b8845f", // セピア (Axis 風 warm brown)
          deep: "#8a5e3f", // 強調用
          soft: "#f4ede4", // ライト背景 (paper-warm) は維持
        },
        // Soft accent backgrounds
        sky: "#dceaf4",
        leaf: "#cfe3ce",
        peach: "#f7d9c4",
        // Modern-flat illustration palette (Coral + Navy)
        coral: {
          50: "#fff1f1",
          100: "#ffd9da",
          200: "#ffb3b5",
          300: "#ff8285",
          400: "#ff6064",
          500: "#ff4d52",
          600: "#e53a3f",
          700: "#b32c30",
          800: "#7d2024",
          900: "#4a1416",
        },
        navy: "#1d2939",
        // Retrowave / city pop / lofi palette
        neon: {
          pink: "#ff4d9d",
          "pink-soft": "#ff8ec0",
          purple: "#9d5cff",
          "purple-deep": "#5b2dd1",
          cyan: "#4dd5f7",
          "cyan-soft": "#a6e8f7",
          sunset: "#ffae3b",
          magenta: "#e83fae",
          midnight: "#1a1340",
          "midnight-deep": "#0f0826",
        },
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
        // 日本語本文 (Noto Serif JP) の可読幅。約 36ch 相当。
        "prose-jp": "36rem",
        // ハイエンドコンテンツ用のゆとり幅 (画像をやや細く見せる)
        "narrow": "920px",
        "wide": "1480px",
      },
      spacing: {
        // ハイエンドの大胆余白。Axis は section 間に 8〜12rem 取る。
        // PC では section-y、SP では section-y-sm を併用する想定。
        "section-y": "12rem",
        "section-y-sm": "6rem",
        "section-y-lg": "16rem",
        // gutter は viewport に応じて 1.5〜6rem を自動調整
        gutter: "clamp(1.5rem, 5vw, 6rem)",
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
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "marquee-vertical": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
        "marquee-vertical-reverse": {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
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
        "glow-pulse": {
          "0%, 100%": { opacity: "0.15", transform: "scale(1)" },
          "50%": { opacity: "0.3", transform: "scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        scroll: "scroll 30s linear infinite",
        marquee: "marquee 40s linear infinite",
        "marquee-slow": "marquee 80s linear infinite",
        // Hero の 3 行マーキー用 (1 周 約 30〜45 秒の中速帯)
        "marquee-h-30": "marquee 30s linear infinite",
        "marquee-h-38": "marquee 38s linear infinite",
        "marquee-h-45": "marquee 45s linear infinite",
        "marquee-reverse": "marquee-reverse 60s linear infinite",
        "marquee-reverse-slow": "marquee-reverse 100s linear infinite",
        "marquee-reverse-h-35": "marquee-reverse 35s linear infinite",
        "marquee-vertical": "marquee-vertical 45s linear infinite",
        "marquee-vertical-slow": "marquee-vertical 80s linear infinite",
        "marquee-vertical-reverse": "marquee-vertical-reverse 55s linear infinite",
        "marquee-vertical-reverse-slow": "marquee-vertical-reverse 90s linear infinite",
        // Hero グリッド 4 列用の中速帯 (1 周 40〜60s で機械的にならない散らし)
        "marquee-v-42": "marquee-vertical 42s linear infinite",
        "marquee-v-rev-50": "marquee-vertical-reverse 50s linear infinite",
        "marquee-v-58": "marquee-vertical 58s linear infinite",
        "marquee-v-rev-46": "marquee-vertical-reverse 46s linear infinite",
        "toast-in": "toast-in 220ms ease-out",
        wiggle: "wiggle 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        sway: "sway 5s ease-in-out infinite",
        "glow-pulse": "glow-pulse 8s ease-in-out infinite",
        "glow-pulse-slow": "glow-pulse 14s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
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
