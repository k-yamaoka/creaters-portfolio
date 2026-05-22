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
    "Sora・Veo・Runway・Midjourneyを使いこなすAIクリエイターと、企業をつなぐ専門マッチングプラットフォーム。SNS広告動画・ブランドムービー・採用動画まで、AIで最短2日納品。",
  keywords: [
    "AIクリエイター",
    "AI動画生成",
    "Sora",
    "Veo",
    "Runway",
    "Midjourney",
    "SNS広告動画",
    "Meta広告",
    "TikTok広告",
    "AI動画編集",
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
      "Sora・Veo・Runwayを使いこなすAIクリエイターに、SNS広告動画・ブランドムービーを依頼できる専門プラットフォーム。最短2日納品。",
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
      </head>
      <body className="min-h-screen bg-paper font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
