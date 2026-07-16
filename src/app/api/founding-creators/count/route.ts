import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFoundingStats } from "@/lib/founding-creator";

/**
 * GET /api/founding-creators/count
 *
 * ファウンディング クリエイター (先着 50 名) の残り枠を返す公開 API。
 * 匿名クライアントからも呼べる (founding_creator_stats view は
 * anon SELECT 権限あり)。
 */
export async function GET() {
  const supabase = await createClient();
  const stats = await getFoundingStats(supabase);
  return NextResponse.json(
    {
      slot_limit: stats.slotLimit,
      filled: stats.filled,
      remaining: stats.remaining,
      is_full: stats.isFull,
    },
    {
      headers: {
        // 1 分キャッシュ (CDN + ブラウザ)
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
