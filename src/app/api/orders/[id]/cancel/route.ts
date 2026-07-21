import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  computeCancelBreakdown,
  stageFromOrderStatus,
} from "@/lib/cancel-policy";
import type { OrderStatus } from "@/lib/order-status";

/**
 * POST /api/orders/:id/cancel
 *
 * キャンセルポリシー (A-4) を適用して order をキャンセル状態に遷移する。
 * 冪等性: 既に cancelled の order を再度叩いても 400 で拒否 (現状の
 * キャンセル記録を上書きしない)。
 *
 * 実行内容:
 *   1. 認可: 当該 order の client / creator のみ
 *   2. 現在ステータスから cancel_stage を判定 (pre_start/in_progress/delivered)
 *   3. cancel_refund_amount / cancel_creator_payout を算出
 *   4. orders テーブルに snapshot + status='cancelled' + escrow_status='refunded'
 *   5. 実際の Stripe 部分返金は別 PR (webhook + refund API で対応予定)
 *
 * リクエスト body:
 *   { reason?: string }
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

  const body = (await request.json().catch(() => ({}))) as {
    reason?: string;
  };
  const reason =
    typeof body.reason === "string" ? body.reason.slice(0, 500) : null;

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, base_price,
       client:client_profiles!orders_client_id_fkey ( user_id ),
       creator:creator_profiles!orders_creator_id_fkey ( user_id )`
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json(
      { error: "注文が見つかりません" },
      { status: 404 }
    );
  }

  const clientUserId = (
    order.client as unknown as { user_id: string } | null
  )?.user_id;
  const creatorUserId = (
    order.creator as unknown as { user_id: string } | null
  )?.user_id;
  if (clientUserId !== user.id && creatorUserId !== user.id) {
    return NextResponse.json(
      { error: "この注文をキャンセルする権限がありません" },
      { status: 403 }
    );
  }

  if (order.status === "cancelled") {
    return NextResponse.json(
      { error: "この注文は既にキャンセル済みです" },
      { status: 400 }
    );
  }

  const stage = stageFromOrderStatus(order.status as OrderStatus);
  if (!stage) {
    return NextResponse.json(
      { error: "現在の状態はキャンセル対象外です" },
      { status: 400 }
    );
  }

  // 00074 実質的受領 ガード: delivered 後にダウンロード / 使用宣言があった場合、
  //   仕様上「100% 返金要求」は弾く。cancel_stage='delivered' はもともと 100%
  //   クリエイター補償 (返金 0%) なので実害は少ないが、明示的にログを残す。
  //   pre_start / in_progress でダウンロードは発生しない前提だが念のためチェック。
  const { data: receiptSummary } = await supabase
    .from("order_receipt_summary")
    .select("effective_count, last_effective_at")
    .eq("order_id", orderId)
    .maybeSingle();
  const hasEffectiveReceipt = (receiptSummary?.effective_count ?? 0) > 0;
  if (hasEffectiveReceipt && stage !== "delivered") {
    return NextResponse.json(
      {
        error:
          "納品物のダウンロード / 使用が確認されているため、この段階からの全額返金は受け付けられません。運営裁定を申請してください。",
      },
      { status: 409 }
    );
  }

  const basePrice = order.base_price ?? 0;
  const breakdown = computeCancelBreakdown(
    order.status as OrderStatus,
    basePrice,
    stage
  );
  if (!breakdown) {
    return NextResponse.json(
      { error: "キャンセル料金の計算に失敗しました" },
      { status: 500 }
    );
  }

  // 00076 RPC で atomic に (単一トランザクション内で status 遷移 + snapshot 記録)。
  //   楽観ロック: p_expected_status ミスマッチで例外。
  //   冪等: 既に cancelled なら { ok: true, noop: true }。
  const { data: rpcResult, error: rpcErr } = await supabase.rpc(
    "cancel_order_with_refund",
    {
      p_order_id: orderId,
      p_actor_role: clientUserId === user.id ? "client" : "creator",
      p_reason: reason,
      p_stage: breakdown.stage,
      p_refund_rate: breakdown.refundRate,
      p_expected_status: order.status,
    }
  );
  if (rpcErr) {
    console.error("[orders/cancel] rpc error", rpcErr);
    // status mismatch は 409 で返す
    if (rpcErr.message?.includes("status mismatch")) {
      return NextResponse.json(
        {
          error:
            "他のセッションで状態が変更されました。画面を再読み込みしてください",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "キャンセル処理に失敗しました" },
      { status: 500 }
    );
  }
  const result = rpcResult as { ok?: boolean } | null;
  if (!result?.ok) {
    return NextResponse.json(
      { error: "キャンセル処理に失敗しました" },
      { status: 500 }
    );
  }

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");

  return NextResponse.json({
    ok: true,
    breakdown,
  });
}
