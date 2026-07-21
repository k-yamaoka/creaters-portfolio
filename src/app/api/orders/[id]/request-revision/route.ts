import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { evaluateRevisionState } from "@/lib/order-flow";

/**
 * POST /api/orders/:id/request-revision
 *
 * Phase 2 要件 (2026-07-21):
 *   - 【必須】max_revisions と revision_count_used を比較
 *     上限到達済みの場合は 402 + error_code='REVISION_LIMIT_EXCEEDED'
 *     + additional_order_required=true を返す
 *   - 上限内でも「これが最後」の場合は 200 + warning='LAST_FREE_REVISION'
 *
 * 認可: 対象 order の client のみ
 * 前提: status='delivered' (納品済み) からのみ 修正依頼可能
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
    typeof body?.reason === "string" ? body.reason.slice(0, 2000) : null;

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, escrow_status, max_revisions, revision_count_used,
       terminated_at, active_dispute_id, soft_deleted_at,
       client:client_profiles!orders_client_id_fkey ( user_id ),
       creator:creator_profiles!orders_creator_id_fkey ( user_id )`
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }
  if (order.soft_deleted_at) {
    return NextResponse.json({ error: "保持期間経過" }, { status: 410 });
  }

  const clientUserId = (order.client as unknown as { user_id: string } | null)
    ?.user_id;
  if (clientUserId !== user.id) {
    return NextResponse.json(
      { error: "修正依頼はクライアントのみが実行できます" },
      { status: 403 }
    );
  }

  if (order.terminated_at || order.active_dispute_id) {
    return NextResponse.json(
      { error: "この注文は途中終了 / 運営裁定中のため操作できません" },
      { status: 403 }
    );
  }
  if (order.status !== "delivered") {
    return NextResponse.json(
      {
        error: "納品済みの案件からのみ修正依頼できます",
        error_code: "NOT_IN_DELIVERED_STATE",
      },
      { status: 403 }
    );
  }

  // 【必須】上限チェック
  const nextUsed = (order.revision_count_used ?? 0) + 1;
  const maxRev = order.max_revisions ?? 1;
  const currentState = evaluateRevisionState(
    order.revision_count_used ?? 0,
    maxRev
  );

  if (nextUsed > maxRev) {
    // 上限超過: 追加発注扱い。UPDATE はしない (revision に遷移させない)
    return NextResponse.json(
      {
        error:
          "合意した修正回数の上限に達しています。これ以降の修正対応は追加発注 (別料金) の対象です。",
        error_code: "REVISION_LIMIT_EXCEEDED",
        additional_order_required: true,
        max_revisions: maxRev,
        revision_count_used: order.revision_count_used ?? 0,
        contact_admin_url: `/dashboard/orders/${orderId}?trouble=1`,
      },
      { status: 402 }
    );
  }

  // 単一 UPDATE で revision に遷移 + counter +1 (楽観ロック)
  const { data: updated, error: updErr } = await supabase
    .from("orders")
    .update({
      status: "revision",
      revision_count_used: nextUsed,
    })
    .eq("id", orderId)
    .eq("status", "delivered")
    .is("terminated_at", null)
    .is("active_dispute_id", null)
    .select("id");
  if (updErr) {
    console.error("[orders/request-revision] update failed", updErr);
    return NextResponse.json(
      { error: "修正依頼に失敗しました" },
      { status: 500 }
    );
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      {
        error: "他のセッションで状態が変更されました",
        error_code: "OPTIMISTIC_LOCK_FAILED",
      },
      { status: 409 }
    );
  }

  // 履歴として messages に "修正依頼" を書き残す (簡易実装)
  // (existing の messages スキーマに合わせる)
  const creatorUserId = (order.creator as unknown as { user_id: string } | null)
    ?.user_id;
  if (creatorUserId && reason) {
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: creatorUserId,
      order_id: orderId,
      content: `【修正依頼 (${nextUsed}/${maxRev})】\n${reason}`,
      is_read: false,
    });
  }

  // 次が最後の無償修正になる場合の警告フラグ
  const willBeLast = nextUsed === maxRev;
  const warning = willBeLast
    ? "これが最後の無償修正です。次回以降は追加発注 (別料金) の対象です。"
    : currentState.warning;

  return NextResponse.json({
    ok: true,
    status: "revision",
    revision_count_used: nextUsed,
    max_revisions: maxRev,
    warning,
    warning_code: willBeLast ? "LAST_FREE_REVISION" : null,
  });
}
