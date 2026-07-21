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
    // 楽観ロックで二重発火を防ぐ (WHERE 条件で filter しつつ UPDATE)
    const { error: updErr, data: updated } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        escrow_status: "refunded",
        cancel_stage: "pre_start",
        cancel_refund_rate: 1.0,
        cancel_refund_amount: o.base_price ?? 0,
        cancel_creator_payout: 0,
        cancel_reason: "催促後 7 日以内に納品されなかったため、システムが自動キャンセルしました",
        cancelled_at: nowIso,
      })
      .eq("id", o.id)
      .in("status", ["data_sharing", "production", "revision"])
      .is("terminated_at", null)
      .is("active_dispute_id", null)
      .select("id");
    if (updErr) {
      errors.push(`${o.id}: ${updErr.message}`);
      continue;
    }
    if (!updated || updated.length === 0) continue;

    // 未納品ペナルティ 加算
    if (o.creator_id) {
      await supabase.from("creator_penalties").insert({
        creator_profile_id: o.creator_id,
        order_id: o.id,
        penalty_type: "nondelivery",
        weight: NONDELIVERY_WEIGHT,
        reason: "催促後 7 日以内に納品されなかった",
      });
    }
    processed += 1;
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates?.length ?? 0,
    cancelled: processed,
    errors,
  });
}
