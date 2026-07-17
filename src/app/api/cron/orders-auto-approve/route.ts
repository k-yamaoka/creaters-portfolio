import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { computePayoutScheduleDate } from "@/lib/payout";

/**
 * みなし検収 cron (Vercel Cron 1 時間おき)。
 *
 * 対象:
 *   - status='delivered' かつ escrow_status IN ('held','pending')
 *   - auto_approve_at <= now()
 *   - terminated_at IS NULL AND active_dispute_id IS NULL
 *     (紛争中や合意終了済みは自動承認しない)
 *
 * 挙動: escrow_status を released に、payout_status を scheduled に、
 * payout_scheduled_date を +7 営業日 (computePayoutScheduleDate) にセット。
 * dispute_actions ではなく orders 側の状態遷移のみ (dispute は関与しない)。
 *
 * 認可: Vercel Cron が Authorization: Bearer <CRON_SECRET> を付与。
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  // 対象を取得 (100 件上限、次の実行で残りを処理)
  const { data: candidates, error: selectErr } = await supabase
    .from("orders")
    .select("id, delivered_at, auto_approve_at, client_id, creator_id")
    .eq("status", "delivered")
    .in("escrow_status", ["held", "pending"])
    .lte("auto_approve_at", nowIso)
    .is("terminated_at", null)
    .is("active_dispute_id", null)
    .is("auto_approved_at", null)
    .limit(100);

  if (selectErr) {
    console.error("[cron/orders-auto-approve] select failed", selectErr);
    return NextResponse.json({ ok: false, error: "select failed" }, { status: 500 });
  }

  let approved = 0;
  const errors: string[] = [];

  for (const o of candidates ?? []) {
    const inspectedAt = new Date();
    const { error: updErr } = await supabase
      .from("orders")
      .update({
        escrow_status: "released",
        inspected_at: inspectedAt.toISOString(),
        completed_at: inspectedAt.toISOString(),
        payout_scheduled_date: computePayoutScheduleDate(inspectedAt),
        payout_status: "scheduled",
        auto_approved_at: nowIso,
      })
      .eq("id", o.id)
      .eq("status", "delivered")
      .in("escrow_status", ["held", "pending"]);
    if (updErr) {
      errors.push(`${o.id}: ${updErr.message}`);
      continue;
    }
    approved += 1;
    // 双方向 notification は別 PR で追加予定 (creator_id / client_id 経由で
    //   相手の user_id を引く必要があるため。auto_approved_at を見て後段で
    //   まとめてダイジェスト通知するのが望ましい)
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates?.length ?? 0,
    approved,
    errors,
  });
}
