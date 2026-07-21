import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * 未納品自動キャンセル cron (00073 + 00075, 毎時)。
 *
 * 対象:
 *   - status IN ('data_sharing', 'production', 'revision')
 *   - nondelivery_deadline_at <= now()
 *   - terminated_at IS NULL AND active_dispute_id IS NULL
 *
 * 挙動:
 *   1. orders を cancelled + escrow refunded + cancel_stage='pre_start' に。
 *      クライアント返金 100% / クリエイター補償 0 (未納品ペナルティのため)
 *   2. creator_penalties に 'nondelivery' 行を weight=3 で INSERT
 *   3. 双方に通知
 *
 * 認可: Vercel Cron の Bearer <CRON_SECRET>
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NONDELIVERY_WEIGHT = 3;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not set" },
      { status: 401 }
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: candidates, error: selectErr } = await supabase
    .from("orders")
    .select("id, base_price, creator_id, client_id, title")
    .in("status", ["data_sharing", "production", "revision"])
    .not("nondelivery_deadline_at", "is", null)
    .lte("nondelivery_deadline_at", nowIso)
    .is("terminated_at", null)
    .is("active_dispute_id", null)
    .limit(100);
  if (selectErr) {
    return NextResponse.json({ ok: false, error: "select failed" }, { status: 500 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const o of candidates ?? []) {
    // 00076 RPC で atomic に (orders 更新 + creator_penalties INSERT を
    //   単一トランザクション内で実行)。冪等性は関数内で担保。
    const { data: rpcResult, error: rpcErr } = await supabase.rpc(
      "auto_cancel_nondelivery",
      { p_order_id: o.id, p_weight: NONDELIVERY_WEIGHT }
    );
    if (rpcErr) {
      errors.push(`${o.id}: ${rpcErr.message}`);
      continue;
    }
    const result = rpcResult as { ok?: boolean } | null;
    if (result?.ok) processed += 1;
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates?.length ?? 0,
    cancelled: processed,
    errors,
  });
}
