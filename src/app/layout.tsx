import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://creaters-portfolio.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CreatorsHub - 映像クリエイターマッチングプラットフォーム",
    template: "%s | CreatorsHub",
  },
  description:
    "映像編集者・クリエイターと企業をつなぐマッチングプラットフォーム。ポートフォリオを見て、あなたのプロジェクトに最適なクリエイターを見つけましょう。",
  keywords: [
    "映像制作",
    "動画編集",
    "クリエイター",
    "マッチング",
    "フリーランス",
    "企業VP",
    "YouTube",
    "SNS動画",
    "映像クリエイター",
  ],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "CreatorsHub",
    title: "CreatorsHub - 映像クリエイターマッチングプラットフォーム",
    description:
      "映像編集者・クリエイターと企業をつなぐマッチングプラットフォーム。ポートフォリオを見て、最適なクリエイターを見つけましょう。",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreatorsHub - 映像クリエイターマッチングプラットフォーム",
    description:
      "映像クリエイターと企業をつなぐマッチングプラットフォーム",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
