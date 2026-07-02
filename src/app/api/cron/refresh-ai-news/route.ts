import { NextResponse } from "next/server";
import { refreshAiNewsCache } from "@/lib/ai-news";

/**
 * Vercel Cron から日次で叩かれるエンドポイント。
 *
 * 動作:
 *  1. Bearer <CRON_SECRET> ヘッダで認可
 *  2. revalidateTag("ai-news") で Data Cache を無効化
 *  3. 直ちに再取得 (RSS → OGP パース) して次のリクエストを早く返せるように prewarm
 *
 * 認可:
 *  - Vercel は Cron 実行時に自動で Authorization: Bearer <CRON_SECRET> を付ける
 *  - 誤爆・悪用防止のため env 未設定時は必ず 401 を返す (fail-closed)
 */

export const runtime = "nodejs";
// Cron 実行時のレスポンスは キャッシュしない
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/refresh-ai-news] CRON_SECRET is not set");
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 401 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const items = await refreshAiNewsCache();
    return NextResponse.json({
      ok: true,
      count: items.length,
      durationMs: Date.now() - startedAt,
    });
  } catch (e) {
    console.error("[cron/refresh-ai-news] refresh failed", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
