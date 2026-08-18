import type { MetadataRoute } from "next";

/**
 * robots.txt を Next.js ネイティブ形式で配信。
 * - LP / creators / jobs / help / terms / privacy 等は open
 * - dashboard / admin / api / auth callback / ai-mock は Disallow
 *   (ai-mock は 社内検討モックで一般公開しない)
 */

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://creaters-portfolio.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api", "/auth", "/ai-mock", "/settings"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
