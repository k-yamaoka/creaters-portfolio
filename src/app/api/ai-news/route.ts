import { NextResponse } from "next/server";
import { getCachedAiNews } from "@/lib/ai-news";

/**
 * 公開エンドポイント: 最新の「生成AI 動画」ニュース (8 件、キャッシュ済)。
 *
 * キャッシュ:
 *  - unstable_cache で 24 時間ラップ (getCachedAiNews 内で完結)
 *  - このハンドラ自体も Response の Cache-Control で Edge / CDN 短期キャッシュ
 */

// Node.js runtime (rss-parser / open-graph-scraper に必要)
export const runtime = "nodejs";

// レスポンス自体を 24 時間 Edge Cache
export const revalidate = 86400;

export async function GET() {
  try {
    const items = await getCachedAiNews();
    return NextResponse.json(
      { items },
      {
        headers: {
          "cache-control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (e) {
    console.error("[/api/ai-news] failed", e);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
