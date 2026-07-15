/**
 * 簡易 rate-limit ユーティリティ (プレースホルダー実装)。
 *
 * Vercel Functions は stateless + ephemeral (CLAUDE.md 参照) なので
 * メモリ上のカウンタは 1 リクエスト間しか保持されない。ここは
 * 開発中の "枠だけ用意" 実装で、本番運用時には Marketplace Redis
 * (Upstash 等) をバックに差し替える想定。
 *
 * 現状の挙動:
 *   - 同じキーに対する連続要求を軽く抑制するのみ
 *   - IP 単位で 60 秒に N 回まで、を宣言的に受け付ける
 *   - inMemory は best-effort。分散環境では機能しない
 *
 * 差し替え時の TODO:
 *   1. Upstash Redis を Marketplace で provision
 *   2. `@upstash/ratelimit` の Ratelimit.slidingWindow を使う
 *   3. checkRateLimit() の実装を Upstash 版に差し替える (interface はそのまま)
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

/**
 * key に対して windowSec 秒あたり limit 回まで許可する。
 *
 * @param key 識別キー (例: `register:ip:1.2.3.4`)
 * @param limit ウィンドウ内で許可する最大リクエスト数
 * @param windowSec ウィンドウ秒数
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowSec * 1000;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: limit - bucket.count,
    retryAfterSec: 0,
  };
}

/**
 * リクエストヘッダから IP アドレスを取り出す (Vercel/Next.js 想定)。
 * 取れない場合は "unknown" (共有バケツにフォールバック)。
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
