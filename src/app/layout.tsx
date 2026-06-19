import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* 2026-06-16: ハイエンド土台への移行 (Step 1)。
            Display = Fraunces (英文セリフ), 本文 JA = Noto Serif JP (明朝),
            英文 UI = Inter, 番号/ラベル = JetBrains Mono に統一。
            旧 Zen Kaku Gothic New / Lato は globals.css に互換用 fallback
            として残置するが、新規 UI では使わない。 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Noto+Serif+JP:wght@300;400;500;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
