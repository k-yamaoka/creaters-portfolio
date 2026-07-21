import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { canSubmitDelivery, deriveFlowState } from "@/lib/order-flow";

/**
 * POST /api/orders/:id/deliver
 *
 * Phase 2 要件 (2026-07-21):
 *   - 【必須】flow_state が in_progress 以外なら 403
 *   - 【必須】escrow_status=held (仮払い済) 以外は 403
 *   - 途中終了 / 運営裁定中 / soft_deleted は 403
 *
 * 認可: 対象 order の creator のみ (client からの deliver は許可しない)
 *
 * DB 更新は 1 回の UPDATE で status='delivered' + delivered_at + auto_approve_at
 * (trigger set_order_auto_approve_at が +7 日 自動計算)。楽観ロック用に
 * WHERE 節に旧 status を含める。
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 認可 + 現在状態取得
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, escrow_status, terminated_at, active_dispute_id, soft_deleted_at,
       client:client_profiles!orders_client_id_fkey ( user_id ),
       creator:creator_profiles!orders_creator_id_fkey ( user_id )`
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }
  if (order.soft_deleted_at) {
    return NextResponse.json({ error: "この取引は保持期間を経過しています" }, { status: 410 });
  }

  const creatorUserId = (order.creator as unknown as { user_id: string } | null)
    ?.user_id;
  if (creatorUserId !== user.id) {
    return NextResponse.json(
      { error: "納品操作はクリエイターのみが実行できます" },
      { status: 403 }
    );
  }

  // 【必須制約】flow_state=in_progress + escrow=held 以外は 403
  const flow = deriveFlowState({
    status: order.status,
    escrow_status: order.escrow_status,
    terminated_at: order.terminated_at,
    active_dispute_id: order.active_dispute_id,
  });
  if (flow !== "in_progress") {
    return NextResponse.json(
      {
        error:
          "現在の状態では納品できません。仮払い (エスクロー) 完了後にステータスが「制作中」になってから納品してください。",
        error_code: "PRECONDITION_NOT_IN_PROGRESS",
        current_flow_state: flow,
      },
      { status: 403 }
    );
  }
  if (!canSubmitDelivery({
    status: order.status,
    escrow_status: order.escrow_status,
    terminated_at: order.terminated_at,
    active_dispute_id: order.active_dispute_id,
  })) {
    return NextResponse.json(
      {
        error:
          "納品には仮払い完了 (escrow=held) が必要です。仕様上の作業着手前の納品操作をブロックしました。",
        error_code: "ESCROW_NOT_FUNDED",
      },
      { status: 403 }
    );
  }

  // 楽観ロックで単一 UPDATE
  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      delivered_at: now,
      // auto_approve_at は trigger set_order_auto_approve_at が +7 日で自動計算
    })
    .eq("id", orderId)
    .eq("status", order.status)
    .eq("escrow_status", "held")
    .is("terminated_at", null)
    .is("active_dispute_id", null)
    .select("id");
  if (updErr) {
    console.error("[orders/deliver] update failed", updErr);
    return NextResponse.json(
      { error: "納品処理に失敗しました" },
      { status: 500 }
    );
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      {
        error: "他のセッションで状態が変更されました。画面を再読み込みしてください",
        error_code: "OPTIMISTIC_LOCK_FAILED",
      },
      { status: 409 }
    );
  }

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
  return NextResponse.json({
    ok: true,
    status: "delivered",
    delivered_at: now,
  });
}
