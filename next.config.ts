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
    // 1 年 max-age + includeSubDomains + preload。
    // https://hstspreload.org/ に本番ドメインを登録すると、初回アクセス前から
    // 全ブラウザで HTTPS 強制になる (要ドメイン確定後 申請)。
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Content-Security-Policy は middleware で per-request nonce 付きで設定する
  // (src/lib/security/csp.ts + src/lib/supabase/middleware.ts)。
  // 静的 CSP は middleware をスキップする経路 (静的アセット等) には効かないが、
  // 静的アセット自体には script が無いのでリスクなし。
];

const nextConfig: NextConfig = {
  // 動画アップロード用に Server Actions の body 上限を引き上げ
  // (Next.js 15: 既定 1MB → 100MB)
  // 動画は /api/upload/video の Route Handler 経由なので Server Actions
  // とは別だが、formData 経由の他用途のためにも引き上げておく。
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage (ポートフォリオ画像・サムネイル)
      { protocol: "https", hostname: "quxwvikiszvobxadyday.supabase.co" },
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
