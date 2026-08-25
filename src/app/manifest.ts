import type { MetadataRoute } from "next";

/**
 * PWA manifest (web app manifest)。
 * Next.js 15 の app/manifest.ts が /manifest.webmanifest として自動配信する。
 *
 * 効果:
 *   - iOS/Android のホーム画面追加時にネイティブ風表示
 *   - Chrome の「アプリとしてインストール」プロンプト
 *   - Splash screen 用のカラー / アイコン提供
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aimovie (アイムビ) — AIクリエイター × 企業のマッチング",
    short_name: "Aimovie",
    description:
      "Sora・Veo・Runway・Seedance を使いこなすAIクリエイターと企業をつなぐ専門プラットフォーム。",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F0", // ivory (light 起動画面)
    theme_color: "#0F1E3D", // navy-900 (Safari status bar / Android theme)
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    lang: "ja",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "creative"],
  };
}
