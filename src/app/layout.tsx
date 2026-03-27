import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorsHub - 映像クリエイターマッチングプラットフォーム",
  description:
    "映像編集者・クリエイターと企業をつなぐマッチングプラットフォーム。ポートフォリオを見て、あなたのプロジェクトに最適なクリエイターを見つけましょう。",
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
