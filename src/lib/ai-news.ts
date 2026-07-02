import Parser from "rss-parser";
import ogs from "open-graph-scraper";
import { unstable_cache, revalidateTag } from "next/cache";

/**
 * 生成 AI 動画 関連ニュース アグリゲータ。
 *
 * 著作権配慮 (ユーザー明示):
 *  - サムネ画像は自社 DB / Storage に保存しない
 *  - 記事本文 / リード文は取得しない (og:title と og:image のみ)
 *  - 表示は <img src="{og:image URL}"> のインラインリンク方式
 *  - リンクは別タブで開き rel="noopener noreferrer"
 *
 * データフロー:
 *  Vercel Cron (日次)
 *   → /api/cron/refresh-ai-news
 *   → revalidateTag("ai-news") で unstable_cache を無効化
 *   → 次回リクエスト時に fetchAndEnrichAiNews() が再実行される
 *  トップページ (Server Component)
 *   → getCachedAiNews() で 24 時間キャッシュ済結果を取得
 */

export type AiNewsItem = {
  /** 記事 URL を SHA1 hash 化した stable ID */
  id: string;
  /** 記事の最終 URL (Google News のリダイレクトを解決したもの) */
  url: string;
  /** og:title (無ければ RSS item.title) */
  title: string;
  /** og:image URL — DB には保存せず、<img src> にそのまま渡す */
  imageUrl: string;
  /** ISO 8601 の掲載日時 */
  publishedAt: string | null;
  /** メディア名 (Google News 側の source ラベル) */
  sourceName: string | null;
};

const GOOGLE_NEWS_QUERY = "生成AI 動画";
const GOOGLE_NEWS_URL =
  `https://news.google.com/rss/search?q=${encodeURIComponent(GOOGLE_NEWS_QUERY)}` +
  `&hl=ja&gl=JP&ceid=JP:ja`;

const TARGET_COUNT = 8; // トップページ表示件数 (4 列 × 2 行)
const RSS_FETCH_LIMIT = 24; // OGP パース失敗 / 画像無し に備えて多めに取得
const OGP_TIMEOUT_MS = 8000;
const OGP_PARALLEL = 6; // 同時に OGP 取得する並列度

// SHA1 は Node.js の crypto を使用 (edge runtime でも動作)
async function sha1Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// open-graph-scraper の結果から image URL を抽出。ogImage は配列 or 単一 or undefined。
function extractOgImage(result: {
  ogImage?: Array<{ url?: string }> | { url?: string };
}): string | null {
  const raw = result.ogImage;
  if (!raw) return null;
  const first = Array.isArray(raw) ? raw[0] : raw;
  const url = first?.url;
  if (typeof url !== "string" || !url.startsWith("http")) return null;
  return url;
}

// Google News RSS の item.link は news.google.com の中継 URL。
// open-graph-scraper がリダイレクトを追跡するのでそのまま渡す。
// 場合により最終 URL が response.url に入るので、それを採用する。
async function enrichSingle(link: string, fallbackTitle: string, publishedAt: string | null, source: string | null): Promise<AiNewsItem | null> {
  try {
    const { result, response } = await ogs({
      url: link,
      timeout: OGP_TIMEOUT_MS,
      fetchOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; AILIER-NewsBot/1.0; +https://creaters-portfolio.vercel.app)",
          "Accept-Language": "ja,en;q=0.8",
        },
      },
    });
    if (!result.success) return null;

    const finalUrl =
      (response as { requestUrl?: string } | undefined)?.requestUrl ??
      link;

    const title = (result.ogTitle ?? fallbackTitle ?? "").trim();
    const imageUrl = extractOgImage(result);

    if (!title || !imageUrl) return null; // ユーザー要件: 画像なし記事は除外

    const id = await sha1Hex(finalUrl);
    return {
      id,
      url: finalUrl,
      title,
      imageUrl,
      publishedAt,
      sourceName: source,
    };
  } catch {
    return null;
  }
}

// 並列度を制限したバッチ処理 (単純な chunked Promise.all)
async function inBatches<T, R>(
  items: T[],
  size: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const results = await Promise.all(batch.map(worker));
    out.push(...results);
  }
  return out;
}

/**
 * RSS 取得 + OGP 抽出。ユーザー制約に従い og:title と og:image のみ抽出、
 * 本文 / description は完全に破棄する。
 */
async function fetchAndEnrichAiNews(): Promise<AiNewsItem[]> {
  const parser: Parser = new Parser({
    timeout: 8000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AILIER-NewsBot/1.0; +https://creaters-portfolio.vercel.app)",
    },
  });

  let feed: Parser.Output<{ [key: string]: unknown }>;
  try {
    feed = await parser.parseURL(GOOGLE_NEWS_URL);
  } catch (e) {
    console.error("[ai-news] RSS fetch failed", e);
    return [];
  }

  // Google News の <source> はカスタムフィールド。rss-parser には拾わせない
  // 場合もあるので、summary / creator から source 名を推測する。
  const candidates = (feed.items ?? [])
    .filter((it) => !!it.link && !!it.title)
    .slice(0, RSS_FETCH_LIMIT);

  const enriched = await inBatches(candidates, OGP_PARALLEL, (item) =>
    enrichSingle(
      item.link as string,
      (item.title as string) ?? "",
      (item.isoDate as string) ?? null,
      (item.creator as string) ?? (item.source as string) ?? null
    )
  );

  const clean = enriched.filter((x): x is AiNewsItem => x !== null);

  // URL の重複を除去 (Google News は同記事を複数枠で流すことがある)
  const seen = new Set<string>();
  const dedup: AiNewsItem[] = [];
  for (const item of clean) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    dedup.push(item);
    if (dedup.length >= TARGET_COUNT) break;
  }

  return dedup;
}

/**
 * Next.js Data Cache (unstable_cache) で 24 時間ラップ。
 * Vercel Cron が revalidateTag("ai-news") で強制無効化する。
 */
const CACHE_TAG = "ai-news";

export const getCachedAiNews = unstable_cache(
  fetchAndEnrichAiNews,
  ["ai-news:v1"],
  { revalidate: 86400, tags: [CACHE_TAG] }
);

/** Cron からの呼び出し用: キャッシュを強制無効化 + 即座に再構築 */
export async function refreshAiNewsCache(): Promise<AiNewsItem[]> {
  revalidateTag(CACHE_TAG);
  // タグ無効化直後に呼ぶと最新版が返る (次のリクエスト前に prewarm)
  return getCachedAiNews();
}
