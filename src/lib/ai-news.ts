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

/**
 * ソース一覧。
 *
 * Google News は幅広いが URL が中継 (news.google.com/rss/articles/CBMi...) で、
 * 元記事 URL の復元が不安定 → 失敗時はスキップ。
 * ITmedia AI+ / AINOW / ascii.jp は直接 URL を返す RSS のため、確実に OGP を
 * 取得できる主力ソース。
 */
type RssSource = {
  name: string;
  url: string;
  /** true のとき item.link が Google News 中継 URL なので resolveGoogleNewsUrl を通す */
  isGoogleNews: boolean;
  /**
   * 2026-07-03: 動画特化 (option B) に切替えたため、全ソースに AI_VIDEO_KEYWORDS を
   * 一律適用。個別に切替える運用はもう不要だが、将来ソース追加時に「絞り込まず
   * 全件通したい」ソースを混ぜたくなる場面向けに保持。現状は全て true 相当。
   */
  requireKeywordFilter: boolean;
};

/**
 * 2026-07-03: Google News RSS は撤去。中継 URL の解決は Google 側で
 * 明示的にブロックされており (article page 400 / batch execute 429 →
 * google.com/sorry 誘導)、サーバサイドから復号する手段がない。
 * 代わりに 6 つの直接 RSS ソースで多様性を確保する。
 */
const RSS_SOURCES: RssSource[] = [
  // 2026-07-03: 全ソース requireKeywordFilter: true に統一 (動画特化フィルタ)。
  // AI 全般ではなく動画関連のみを通す運用に切替。
  {
    name: "ITmedia AI+",
    url: "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml",
    isGoogleNews: false,
    requireKeywordFilter: true,
  },
  {
    name: "AINOW",
    url: "https://ainow.ai/feed/",
    isGoogleNews: false,
    requireKeywordFilter: true,
  },
  {
    name: "Zenn AI",
    url: "https://zenn.dev/topics/ai/feed",
    isGoogleNews: false,
    requireKeywordFilter: true,
  },
  {
    name: "WIRED",
    url: "https://wired.jp/feed/rss",
    isGoogleNews: false,
    requireKeywordFilter: true,
  },
  {
    name: "ascii.jp",
    url: "https://ascii.jp/rss.xml",
    isGoogleNews: false,
    requireKeywordFilter: true,
  },
  {
    name: "GIGAZINE",
    url: "https://gigazine.net/news/rss_2.0/",
    isGoogleNews: false,
    requireKeywordFilter: true,
  },
];

/**
 * 動画特化キーワード。全ソースに一律適用され、これらのいずれかにマッチする
 * 記事のみ通す。
 *
 * 誤検出防止のため以下に配慮:
 *  - "Sora" 単独はマッチさせない (ASUS Zenbook SORA 等の製品名衝突)
 *    → "Sora 2" / "OpenAI Sora" 等の video-AI 文脈に限定
 *  - "Veo" 単独はマッチさせない (自動車 Vueo 等との衝突可能性)
 *    → "Veo 3" / "Veo 2" / "Google Veo" に限定
 *  - "Runway" 単独はマッチさせない (Adobe Runway 等)
 *    → "Runway Gen" / "Runway ML" / "Runway Aleph" に限定
 *  - "Pika" は Pika Labs 特定
 *
 * 大文字小文字を無視する比較 (titleMatchesKeywords 内で toLowerCase 済)。
 */
const AI_VIDEO_KEYWORDS = [
  // === 汎用 動画/映像 関連語 (中核) ===
  "動画",
  "映像",
  "映画",
  "ムービー",
  "AI動画",
  "AI映像",
  "AIビデオ",
  "動画生成",
  "映像生成",
  "動画編集",
  "映像編集",
  "動画制作",
  "映像制作",
  "テキスト・トゥ・ビデオ",
  "text-to-video",
  "text to video",
  "text2video",
  "video generation",
  "video-generation",
  "VFX",
  "アニメーション",
  "モーショングラフィックス",
  "モーショングラフィック",
  // === 動画系プラットフォーム / 尺 (動画コンテンツを扱う記事のマーカー) ===
  "ショート動画",
  "縦型動画",
  "ショートムービー",
  "リール",
  "YouTube",
  "TikTok",
  "Instagram Reels",
  "YouTube Shorts",
  "MV",
  "PV",
  "Vlog",
  "VTuber",
  // === 動画クリエイター / 制作 現場 関連 (動画コンテンツ制作者の周辺記事) ===
  // 2026-07-03: 動画特化フィルタで 0 件になる日を回避するため、
  // 動画制作/配信/クリエイター文脈のマーカーを追加。
  "クリエイター",
  "クリエイティブ",
  "コンテンツ制作",
  "コンテンツ配信",
  "コンテンツクリエイター",
  "ライブ配信",
  "ライブストリーミング",
  "ライブ配信",
  "ストリーミング",
  "配信者",
  "サムネイル",
  "スタジオ",
  "アニメスタジオ",
  "映像スタジオ",
  "MVプロダクション",
  // === 動画編集ツール ===
  "Adobe Premiere",
  "Premiere Pro",
  "After Effects",
  "CapCut",
  "DaVinci Resolve",
  "Final Cut",
  // === 動画特化 AI プロダクト (誤検出防止のため文脈込みで指定) ===
  "Sora 2",
  "Sora2",
  "OpenAI Sora",
  "Veo 3",
  "Veo 2",
  "Veo3",
  "Veo2",
  "Google Veo",
  "Runway Gen",
  "Runway ML",
  "Runway Aleph",
  "Kling 2",
  "Kling 1",
  "Kling AI",
  "Hailuo",
  "Pika Labs",
  "Pika 2",
  "Luma AI",
  "Dream Machine",
  "Stable Video",
  "Higgsfield",
  "MiniMax video",
  "Lightricks",
] as const;

const TARGET_COUNT = 8; // トップページ表示件数 (4 列 × 2 行)
// 各ソースから top-N を取り、6 ソース × 4 = 24 件を OGP 展開して 8 件確保。
// 特定ソースに偏らないよう round-robin で優先度を分散。
const PER_SOURCE_LIMIT = 30; // 各ソース RSS から取り込む上限 (フィルタ前)
const PER_SOURCE_CANDIDATE = 4; // 各ソースから enrichment に回す件数 (フィルタ後)
const OGP_TIMEOUT_MS = 8000;
const OGP_PARALLEL = 8;

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

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

/**
 * Step 1: URL 内 base64 デコード (legacy URL の高速パス)。
 * 2023 年以前の Google News 中継 URL は CBMi... の base64 内に元 URL を
 * 直接埋め込んでいたので、これだけで復元できるものが今も一部残っている。
 */
function tryBase64Decode(articleId: string): string | null {
  const b64 = articleId.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  try {
    const buf = Buffer.from(padded, "base64");
    const decoded = buf.toString("latin1");
    const m = decoded.match(/https?:\/\/[\w.\-~%!$&'()*+,;=:@/?#[\]]+/);
    if (!m) return null;
    const cand = m[0].replace(/[^\w.\-~%!$&'()*+,;=:@/?#[\]]+$/, "");
    if (cand.includes("news.google.com") || cand.includes("gstatic.com")) {
      return null;
    }
    return cand;
  } catch {
    return null;
  }
}

/**
 * Step 2: Google News batch execute API で URL 復号 (2024+ 形式対応)。
 *
 * 手順:
 *   a. https://news.google.com/articles/{id} を fetch し、HTML から
 *      data-n-a-sg (signature) と data-n-a-ts (timestamp) を抽出
 *   b. https://news.google.com/_/DotsSplashUi/data/batchexecute に POST
 *      Payload:
 *        f.req = [[[
 *          "Fbv4je",
 *          '["garturlreq",[[<defaults>]],"<id>","<ts>","<sig>"]',
 *          null,
 *          "generic"
 *        ]]]
 *   c. レスポンスは ")]}'" プレフィックス + チャンク JSON。
 *      wrb.fr "Fbv4je" 行の 3 列目に ["garturl","<最終URL>",...] が入る。
 *
 * 参考: 現代の Google News URL 復号は公開仕様がなく、コミュニティで解析
 *      されたエンドポイント (googlenewsdecoder 系ライブラリ) を使う。
 *      Google 側変更で稀に破損するため、tryBase64Decode を先に試している。
 */
async function tryBatchExecute(articleId: string): Promise<string | null> {
  let signature: string;
  let timestamp: string;

  // a. Get signature + timestamp from article page
  try {
    const pageRes = await fetch(
      `https://news.google.com/articles/${articleId}`,
      {
        headers: {
          "User-Agent": CHROME_UA,
          "Accept-Language": "ja,en;q=0.8",
        },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!pageRes.ok) return null;
    const html = await pageRes.text();
    const sig = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
    if (!sig || !ts) return null;
    signature = sig;
    timestamp = ts;
  } catch {
    return null;
  }

  // b. POST batch execute
  const innerJson =
    `["garturlreq",` +
    `[["X","X","X",null,null,null,null,"US",null,[],"X",false,true,null,null,null,null,null,["X"]]],` +
    `"${articleId}",` +
    `"${timestamp}",` +
    `"${signature}"]`;
  const outer = JSON.stringify([[["Fbv4je", innerJson, null, "generic"]]]);
  const body = new URLSearchParams({ "f.req": outer }).toString();

  try {
    const batchRes = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": CHROME_UA,
          "Accept-Language": "ja,en;q=0.8",
        },
        body,
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!batchRes.ok) return null;
    const text = await batchRes.text();

    // Response format: ")]}'\n\n<len>\n<json>\n\n<len>\n<json>\n..."
    // 目的: wrb.fr の 3 列目 (inner JSON) から garturl の URL を抽出。
    // 単純化: response 全体から "garturl" を含む JSON 文字列を検索し、
    //         その中の最初の https URL を採用する (google.com は除外)。
    const garturlIdx = text.indexOf('"garturl"');
    if (garturlIdx < 0) return null;
    const searchFrom = text.slice(garturlIdx);
    // 直後の URL リテラルを抽出 (\" は \\\" にエスケープされている点に注意)
    const urlMatch = searchFrom.match(/https?:\\?\/\\?\/[^"\\]+/);
    if (!urlMatch) return null;
    const raw = urlMatch[0].replace(/\\\//g, "/");
    if (raw.includes("google.com") || raw.includes("gstatic.com")) return null;
    return raw;
  } catch {
    return null;
  }
}

/**
 * Google News RSS の中継 URL (news.google.com/rss/articles/CBMi...) から
 * 元記事 URL を復元する。
 *
 * 経緯:
 *  - 単純 base64 デコードは 2023 年以前形式のみ対応 → 現代の URL は非対応
 *  - Google News の内部 batch execute API を叩いて復号する必要がある
 *
 * フロー:
 *  1. news.google.com 以外の URL はそのまま通す
 *  2. tryBase64Decode で legacy URL を高速復号 (成功率 30-40%)
 *  3. tryBatchExecute で 2024+ 形式を復号 (成功率 60-80%)
 *  4. すべて失敗したら null
 */
async function resolveGoogleNewsUrl(rawUrl: string): Promise<string | null> {
  if (!rawUrl.includes("news.google.com")) return rawUrl;
  const idMatch = rawUrl.match(/\/(?:rss\/)?articles\/([^?/]+)/);
  if (!idMatch) return null;
  const articleId = idMatch[1];

  // 高速パス: legacy URL の base64 デコード
  const fromBase64 = tryBase64Decode(articleId);
  if (fromBase64) return fromBase64;

  // 現代の URL は batch execute API 経由
  const fromBatch = await tryBatchExecute(articleId);
  if (fromBatch) return fromBatch;

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

type Candidate = {
  link: string;
  title: string;
  isoDate: string | null;
  sourceName: string;
  isGoogleNews: boolean;
};

function titleMatchesKeywords(title: string): boolean {
  return AI_VIDEO_KEYWORDS.some((k) =>
    title.toLowerCase().includes(k.toLowerCase())
  );
}

async function fetchOneSource(
  parser: Parser,
  src: RssSource
): Promise<Candidate[]> {
  try {
    const feed = await parser.parseURL(src.url);
    const items = (feed.items ?? [])
      .filter((it) => !!it.link && !!it.title)
      .slice(0, PER_SOURCE_LIMIT);
    const out: Candidate[] = [];
    for (const it of items) {
      const title = (it.title as string) ?? "";
      if (src.requireKeywordFilter && !titleMatchesKeywords(title)) continue;
      out.push({
        link: it.link as string,
        title,
        isoDate: (it.isoDate as string) ?? null,
        sourceName: src.name,
        isGoogleNews: src.isGoogleNews,
      });
    }
    return out;
  } catch (e) {
    console.warn(`[ai-news] RSS fetch failed for ${src.name}`, e);
    return [];
  }
}

/**
 * 各ソースから top-N を取って round-robin で並べる。
 * 単純な date desc だと最新記事の多いソース (ITmedia AI+ など) に偏るため、
 * ソース多様性を確保する。
 */
function interleavePerSource(perSource: Candidate[][]): Candidate[] {
  // 各ソース内では date desc、既にソート済
  const out: Candidate[] = [];
  const maxLen = Math.max(...perSource.map((s) => s.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const source of perSource) {
      if (source[i]) out.push(source[i]);
    }
  }
  return out;
}

/**
 * 全ソースから RSS を並列取得 → キーワード絞込 + 日付降順 → 各ソース top-N →
 * round-robin でインターリーブ → OGP 展開 → デデュープして TARGET_COUNT 確保。
 *
 * ユーザー制約に従い og:title と og:image のみ抽出、本文 / description は破棄。
 */
async function fetchAndEnrichAiNews(): Promise<AiNewsItem[]> {
  const parser: Parser = new Parser({
    timeout: 8000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AILIER-NewsBot/1.0; +https://creaters-portfolio.vercel.app)",
    },
  });

  // 各ソースを並列に fetch
  const perSourceRaw = await Promise.all(
    RSS_SOURCES.map((src) => fetchOneSource(parser, src))
  );

  // ソース内で date desc ソート → top PER_SOURCE_CANDIDATE 抽出
  const perSourceTop = perSourceRaw.map((items) => {
    const sorted = [...items].sort((a, b) => {
      const ta = a.isoDate ? new Date(a.isoDate).getTime() : 0;
      const tb = b.isoDate ? new Date(b.isoDate).getTime() : 0;
      return tb - ta;
    });
    return sorted.slice(0, PER_SOURCE_CANDIDATE);
  });

  // Round-robin で混ぜる (source1[0], source2[0], ..., source1[1], source2[1], ...)
  const toEnrich = interleavePerSource(perSourceTop);

  if (toEnrich.length === 0) {
    console.warn("[ai-news] all RSS sources returned no items");
    return [];
  }

  const enriched = await inBatches(toEnrich, OGP_PARALLEL, (c) =>
    enrichSingle(c.link, c.title, c.isoDate, c.sourceName)
  );

  const clean = enriched.filter((x): x is AiNewsItem => x !== null);

  // URL の重複を除去 (複数ソースから同記事が来ることがある)
  const seen = new Set<string>();
  const dedup: AiNewsItem[] = [];
  for (const item of clean) {
    // 正規化: querystring と trailing slash を除外して比較キーに
    const key = item.url.replace(/[?#].*$/, "").replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
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
