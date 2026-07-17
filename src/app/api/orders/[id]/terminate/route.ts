import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/orders/:id/terminate
 *
 * 「合意による途中終了」を確定する。仕様:
 *   - 双方 (client / creator) が同意して初めて確定
 *   - 途中終了時のクリエイター報酬は 0 円 (仕様上の "自爆" 経路)
 *   - フロントは <TerminationConfirmDialog> で全画面警告 + チェックボックス
 *     + 「運営に相談する」導線 を挟んだ上で叩く
 *
 * 挙動: 現在は 「叩いた側が同意した」時点で即確定 (相手の同意記録は
 * body.acknowledgeMutualConsent フラグでフロント側の合意を担保)。
 * 将来的には 2 段階の同意フロー (相手の承認待ちで pending 状態を挟む) に
 * 拡張予定。今回は最重要「自爆防止」を優先し、明示同意を担保する。
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
    acknowledgeMutualConsent?: boolean;
  };

  // 自爆防止: フロントでチェックボックスを ON にした証跡が必須
  if (body?.acknowledgeMutualConsent !== true) {
    return NextResponse.json(
      { error: "同意チェックが確認できません。UI から実行してください。" },
      { status: 400 }
    );
  }

  const reason =
    typeof body.reason === "string" ? body.reason.slice(0, 500) : null;

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, escrow_status, terminated_at, base_price,
       client:client_profiles!orders_client_id_fkey ( user_id ),
       creator:creator_profiles!orders_creator_id_fkey ( user_id )`
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }
  if (order.terminated_at) {
    return NextResponse.json(
      { error: "この注文は既に途中終了済みです" },
      { status: 400 }
    );
  }
  if (order.status === "cancelled" || order.status === "delivered") {
    return NextResponse.json(
      { error: "現在の状態では途中終了できません" },
      { status: 400 }
    );
  }

  const clientUserId = (order.client as unknown as { user_id: string } | null)
    ?.user_id;
  const creatorUserId = (order.creator as unknown as { user_id: string } | null)
    ?.user_id;
  const isClient = clientUserId === user.id;
  const isCreator = creatorUserId === user.id;
  if (!isClient && !isCreator) {
    return NextResponse.json(
      { error: "この注文を操作する権限がありません" },
      { status: 403 }
    );
  }

  // WHERE 句で二重終了を弾く
  const now = new Date().toISOString();
  const { error, data: updated } = await supabase
    .from("orders")
    .update({
      terminated_at: now,
      terminated_by: isCreator ? "creator" : "client",
      terminated_reason: reason,
      // 途中終了 = クライアント返金 100% + クリエイター報酬 0
      status: "cancelled",
      escrow_status: "refunded",
      cancel_stage: "pre_start",
      cancel_refund_rate: 1.0,
      cancel_refund_amount: order.base_price ?? 0,
      cancel_creator_payout: 0,
      cancel_reason: reason ?? "合意による途中終了",
      cancelled_at: now,
    })
    .eq("id", orderId)
    .is("terminated_at", null)
    .neq("status", "cancelled")
    .select("id");

  if (error) {
    console.error("[orders/terminate] update failed", error);
    return NextResponse.json(
      { error: "途中終了処理に失敗しました" },
      { status: 500 }
    );
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "他のセッションで状態が変更されました" },
      { status: 409 }
    );
  }

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
  return NextResponse.json({ ok: true });
}
