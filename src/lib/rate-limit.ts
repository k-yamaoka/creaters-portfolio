/**
 * Rate-limit ユーティリティ。
 *
 * ## 挙動
 * - env に `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` があれば
 *   Upstash Redis を使った sliding window rate limit を実行 (Vercel Serverless で
 *   分散状態が保てる — 本番運用向け)。
 * - 無ければメモリバケット (best-effort、リクエスト内でしか保たない)
 *   にフォールバック — 開発中 / 本番未設定時の暫定挙動。
 *
 * ## 本番セットアップ
 *   1. `vercel integration add upstash` (Vercel Marketplace 経由が最速)
 *   2. 自動的に UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN が env に注入される
 *   3. 再デプロイで有効化 — このファイルの コードは変更不要
 *
 * ## Import 遅延
 * `@upstash/*` は Node の外部モジュール。env 無しだと使わないので、
 * ファイル top level では import しない (dynamic import で 環境ある時だけ読む)。
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

// --------------------- Upstash 実装 (本番) ---------------------

let _upstashClient: Redis | null | undefined;
function getUpstash(): Redis | null {
  if (_upstashClient !== undefined) return _upstashClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _upstashClient = null;
    return null;
  }
  _upstashClient = new Redis({ url, token });
  return _upstashClient;
}

// 同一パラメータの Ratelimit インスタンスを再利用 (毎回 new するのを避ける)。
const rlCache = new Map<string, Ratelimit>();
function getRatelimit(limit: number, windowSec: number): Ratelimit | null {
  const redis = getUpstash();
  if (!redis) return null;
  const key = `${limit}:${windowSec}`;
  const existing = rlCache.get(key);
  if (existing) return existing;
  const rl = new Ratelimit({
    redis,
    // sliding window は fixed window より公平で spike に強い
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    analytics: false,
    prefix: "rl",
  });
  rlCache.set(key, rl);
  return rl;
}

// --------------------- メモリ実装 (フォールバック) ---------------------

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function checkRateLimitMemory(
  key: string,
  limit: number,
  windowSec: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
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
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

// --------------------- 公開 API ---------------------

/**
 * key に対して windowSec 秒あたり limit 回まで許可する。
 * Upstash 未設定なら メモリ版 (best-effort) にフォールバック。
 *
 * @param key 識別キー (例: `register:ip:1.2.3.4`)
 * @param limit ウィンドウ内で許可する最大リクエスト数
 * @param windowSec ウィンドウ秒数
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const rl = getRatelimit(limit, windowSec);
  if (rl) {
    try {
      const res = await rl.limit(key);
      const retryAfterSec = res.success
        ? 0
        : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
      return {
        ok: res.success,
        remaining: res.remaining,
        retryAfterSec,
      };
    } catch (e) {
      // Upstash 側の障害時はメモリ版に落ちる (best-effort でリクエストは通す)
      console.error("[rate-limit] upstash failed, fallback to memory", e);
    }
  }
  return checkRateLimitMemory(key, limit, windowSec);
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
