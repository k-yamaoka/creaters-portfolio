/**
 * Content Security Policy builder (nonce 対応版)。
 *
 * next.config.ts の 静的 CSP は per-request nonce を発行できないため、
 * middleware で リクエスト毎に nonce を発行してこのビルダで CSP 文字列を組む。
 *
 * 方針:
 *   - script-src: 'unsafe-inline' / 'unsafe-eval' を排除。nonce + strict-dynamic
 *     で Next.js hydration + 静的 <script> をカバー。互換のため
 *     https://js.stripe.com https://va.vercel-scripts.com を allowlist。
 *   - style-src: Tailwind の inline style attribute が大量にあるため
 *     'unsafe-inline' を残さざるを得ない (styled-jsx / next/font も同様)。
 *     nonce 化は追跡すべき技術債。
 *   - その他 (frame-src / connect-src / img-src 等) は既存維持。
 */

export function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  // dev では React Fast Refresh が eval を要求。prod では 'unsafe-eval' 除去。
  const scriptSrcParts = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // fallback allowlist (strict-dynamic 未対応の古い browser 用)
    "https://js.stripe.com",
    "https://va.vercel-scripts.com",
  ];
  if (isDev) scriptSrcParts.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    // script-src:
    //   - 'nonce-...' → Next.js hydration script が自動的に nonce を継承
    //   - 'strict-dynamic' → nonce 付きスクリプトが動的読込した子スクリプトも許可
    //     (Next.js の chunk 遅延読込 + Vercel Analytics 動的注入をカバー)
    //   - Stripe / Vercel Analytics ドメインは strict-dynamic 未対応 browser 向け fallback
    `script-src ${scriptSrcParts.join(" ")}`,
    // style-src: 'unsafe-inline' 残置 (Tailwind / next/font 由来)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://ai-gateway.vercel.sh https://vitals.vercel-insights.com",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://js.stripe.com https://hooks.stripe.com",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "frame-ancestors 'self'",
    // 違反を静かに集める (report-only では無く enforce だがログは残す)
    // report-to endpoint は将来。まずは brower console に出るだけで OK
    // "upgrade-insecure-requests" → HTTP 混入自動昇格 (本番 HTTPS 前提)
    "upgrade-insecure-requests",
  ].join("; ");
}
