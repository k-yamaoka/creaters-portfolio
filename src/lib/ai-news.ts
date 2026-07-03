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

/**
 * Google News RSS の中継 URL (news.google.com/rss/articles/CBMi...) から
 * 元記事 URL を復元する。
 *
 * 経緯:
 *  - 旧実装は news.google.com 中継 URL を open-graph-scraper に渡していたが、
 *    Google News 自身の og:image (Google News ロゴ) が全記事で返って
 *    「全部同じサムネ」問題を起こしていた
 *  - 解決 URL に対して OGP を取得することで、各配信元の実サムネを得る
 *
 * 復元手順:
 *  1. パスの CBMi... 部分を base64 デコード (URL 内埋め込みの URL を抽出)
 *  2. 失敗時は Google News HTML を fetch → HTML 内の canonical / data-n-au 属性
 *     から URL を抽出
 *  3. どちらも失敗したら null
 */
async function resolveGoogleNewsUrl(rawUrl: string): Promise<string | null> {
  if (!rawUrl.includes("news.google.com")) return rawUrl;

  // Step 1: URL 内 base64 デコード
  const m = rawUrl.match(/\/rss\/articles\/([^?/]+)/);
  if (m) {
    const encoded = m[1];
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    try {
      const buf = Buffer.from(padded, "base64");
      // protobuf 構造の中にプレーンな URL 文字列が含まれる
      const decoded = buf.toString("latin1");
      const urlMatch = decoded.match(/https?:\/\/[\w.\-~%!$&'()*+,;=:@/?#[\]]+/);
      if (urlMatch) {
        const cand = urlMatch[0].replace(/[^\w.\-~%!$&'()*+,;=:@/?#[\]]+$/, "");
        if (!cand.includes("news.google.com") && !cand.includes("gstatic.com")) {
          return cand;
        }
      }
    } catch {
      /* fall through */
    }
  }

  // Step 2: Google News ページを fetch して HTML 内から抽出
  try {
    const res = await fetch(rawUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (res.url && !res.url.includes("news.google.com")) {
      return res.url; // 302 追跡で最終記事に着地したケース
    }
    const html = await res.text();
    // c-wiz 要素の data-n-au or canonical タグから URL を抽出
    const candidates = [
      html.match(/data-n-au="([^"]+)"/)?.[1],
      html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1],
      html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i)?.[1],
    ];
    for (const c of candidates) {
      if (c && !c.includes("google.com") && /^https?:\/\//.test(c)) {
        return c;
      }
    }
  } catch {
    /* fall through */
  }

  return null;
}

/**
 * OGP 抽出。og:title と og:image のみを使用 (本文・descriptions は破棄)。
 * Google News の中継 URL は先に resolveGoogleNewsUrl で最終記事 URL に変換
 * してから OGP パースする。
 */
async function enrichSingle(
  link: string,
  fallbackTitle: string,
  publishedAt: string | null,
  source: string | null
): Promise<AiNewsItem | null> {
  const resolvedUrl = await resolveGoogleNewsUrl(link);
  if (!resolvedUrl) return null;

  try {
    const { result } = await ogs({
      url: resolvedUrl,
      timeout: OGP_TIMEOUT_MS,
      fetchOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept-Language": "ja,en;q=0.8",
        },
      },
    });
    if (!result.success) return null;

    const title = (result.ogTitle ?? fallbackTitle ?? "").trim();
    const imageUrl = extractOgImage(result);

    if (!title || !imageUrl) return null;

    // Google News のデフォルトロゴ画像 (news.google.com / gstatic.com/news
    // ホスト) は各記事共通のため除外し、真の記事画像だけを残す
    if (
      /news\.google\.com|gstatic\.com\/news|lh3\.googleusercontent\.com\/news/i.test(
        imageUrl
      )
    ) {
      return null;
    }

    // 出典名: Google News が返した source があればそれ、無ければホスト名
    let sourceName = source;
    if (!sourceName) {
      try {
        sourceName = new URL(resolvedUrl).hostname.replace(/^www\./, "");
      } catch {
        /* keep null */
      }
    }

    const id = await sha1Hex(resolvedUrl);
    return {
      id,
      url: resolvedUrl,
      title,
      imageUrl,
      publishedAt,
      sourceName,
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
