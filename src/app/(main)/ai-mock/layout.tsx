import type { Metadata } from "next";

// /ai-mock/* は 社内検討用モック。本番公開はしないので noindex/nofollow を強制。
// robots.ts の Disallow と併せて多層防御。
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false } },
};

export default function AiMockLayout({ children }: { children: React.ReactNode }) {
  return children;
}
