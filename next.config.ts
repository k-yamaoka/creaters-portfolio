import type { NextConfig } from "next";

/**
 * 全リソースに付与する基本セキュリティヘッダー。
 * CSP は YouTube/Vimeo の埋め込みと Supabase Realtime (wss) を許可する必要があるため
 * 全力で絞りきらず frame/connect だけ拡張する。スクリプトの 'unsafe-inline' は Next.js
 * の SSR で必要となるが、production hash CSP に移行できる余地はある。
 */
const SECURITY_HEADERS = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    // includeSubDomains + preload は Vercel デプロイ全体で問題ないことを確認済
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      // Next.js SSR 用に 'unsafe-inline'/'unsafe-eval' を許容 (本番では nonce 化が望ましい)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      // 動画サムネ / アバター: Supabase Storage, YouTube, Vimeo, Unsplash
      "img-src 'self' data: blob: https:",
      // Supabase Realtime (wss) / Supabase REST (https) / Stripe API
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://ai-gateway.vercel.sh",
      // 埋め込みプレイヤー
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://js.stripe.com https://hooks.stripe.com",
      "media-src 'self' https: blob:",
      "object-src 'none'",
      "frame-ancestors 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  headers: async () => [
    {
      // 全パスに付与するセキュリティヘッダー
      source: "/:path*",
      headers: SECURITY_HEADERS,
    },
    {
      // Static assets - long cache
      source: "/:path*.(ico|svg|png|jpg|jpeg|gif|webp|woff|woff2)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};

export default nextConfig;
