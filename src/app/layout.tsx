import type { Metadata } from "next";
// 2026-06-22 Section 8 パフォ: Google Fonts CSS (<link>) は render-blocking で
// mobile Lighthouse の Speed Index を ~1.5s 悪化させていた。next/font/google で
// セルフホスト化し、preconnect も不要に。CSS 変数で tailwind に注入する。
import { Fraunces, Noto_Serif_JP, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Fraunces は variable font。axes を指定する場合は weight を "variable" にする
// (next/font の制約)。weight 400-800 の範囲は variable axis でカバー。
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
  variable: "--font-fraunces",
});

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  variable: "--font-noto-serif-jp",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://creaters-portfolio.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AILIER (アイリエ) — AIクリエイター特化型の企業マッチングプラットフォーム",
    template: "%s | AILIER",
  },
  description:
    "Sora・Veo・Runway・Seedance を使いこなすAIクリエイターと、企業をつなぐ専門マッチングプラットフォーム。SNS広告動画・プロダクト紹介・コーポレートVP・採用動画まで、撮影不要・完全リモートで構成から納品まで一貫。",
  keywords: [
    "AIクリエイター",
    "AI動画生成",
    "AI画像生成",
    "Sora",
    "Veo",
    "Runway",
    "Seedance",
    "Kling",
    "Hailuo",
    "SNS広告動画",
    "SNS広告バナー",
    "Meta広告",
    "TikTok広告",
    "AI動画編集",
    "AI静止画",
    "マッチングプラットフォーム",
    "AILIER",
    "アイリエ",
  ],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "AILIER",
    title: "AILIER (アイリエ) — AIクリエイター特化型の企業マッチングプラットフォーム",
    description:
      "Sora・Veo・Runway・Seedance を使いこなすAIクリエイターに、SNS広告動画・プロダクト紹介・コーポレートVP・採用動画を依頼できる専門プラットフォーム。撮影不要・完全リモート。",
  },
  twitter: {
    card: "summary_large_image",
    title: "AILIER (アイリエ) — AIクリエイター特化型マッチング",
    description:
      "AIクリエイターと企業をつなぐ専門マッチングプラットフォーム",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${fraunces.variable} ${notoSerifJp.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
