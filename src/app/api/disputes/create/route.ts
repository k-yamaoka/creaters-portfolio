import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/disputes/create
 *
 * Phase 2 要件 (2026-07-21):
 *   - 【必須】申告者から相手へのメッセージ送信記録が最低 1 件必要。
 *     messages テーブル (sender_id = actor, order_id = order) が 0 件なら 400。
 *     催促 API (/api/orders/:id/remind) が first_reminder_sent_at をセット
 *     した場合も OK として扱う (二段構えの証跡)。
 *
 * body: { order_id, category, reason }
 *
 * 既存 /api/orders/:id/dispute とは別の canonical エンドポイント (仕様どおり)。
 * 内部ロジックは共通のため、実装は同 module のヘルパーに集約したいが、
 * ここでは重複排除のため直接 /api/orders/:id/dispute を fetch で呼び出す。
 */

const VALID_CATEGORIES = new Set([
  "no_response",
  "unfair_revision",
  "payment_delay",
  "quality_issue",
  "termination_dispute",
  "other",
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    order_id?: string;
    category?: string;
    reason?: string;
  };
  const orderId = body?.order_id;
  const category = body?.category;
  if (!orderId) {
    return NextResponse.json(
      { error: "order_id が必要です" },
      { status: 400 }
    );
  }
  if (!category || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: "カテゴリが不正です" },
      { status: 400 }
    );
  }

  const rawReason =
    typeof body.reason === "string" ? body.reason.trim() : "";
  if (rawReason.length === 0) {
    return NextResponse.json(
      { error: "申請理由の記入は必須です" },
      { status: 400 }
    );
  }
  const reason = rawReason.slice(0, 2000);

  // 認可 + 既存 dispute チェック + first_reminder フラグ取得
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, active_dispute_id, status, first_reminder_sent_at,
       client:client_profiles!orders_client_id_fkey ( user_id, id ),
       creator:creator_profiles!orders_creator_id_fkey ( user_id, id )`
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }
  const clientUserId = (
    order.client as unknown as { user_id: string } | null
  )?.user_id;
  const creatorUserId = (
    order.creator as unknown as { user_id: string } | null
  )?.user_id;
  const isClient = clientUserId === user.id;
  const isCreator = creatorUserId === user.id;
  if (!isClient && !isCreator) {
    return NextResponse.json(
      { error: "この注文について申請する権限がありません" },
      { status: 403 }
    );
  }

  if (order.active_dispute_id) {
    return NextResponse.json(
      {
        error: "既に運営裁定を申請中です",
        error_code: "DISPUTE_ALREADY_OPEN",
        dispute_id: order.active_dispute_id,
      },
      { status: 409 }
    );
  }

  // 【必須】メッセージ送信記録チェック
  //   (a) 催促 API 経由の first_reminder_sent_at がセット済み、または
  //   (b) messages テーブルに actor → 相手 の 1 件以上 の 送信履歴
  //   のいずれかを満たせば OK
  const counterpartyUserId = isCreator ? clientUserId : creatorUserId;
  const { count: msgCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("sender_id", user.id)
    .eq("receiver_id", counterpartyUserId ?? "00000000-0000-0000-0000-000000000000");

  const hasReminder = !!order.first_reminder_sent_at;
  const hasMessage = (msgCount ?? 0) > 0;
  if (!hasReminder && !hasMessage) {
    return NextResponse.json(
      {
        error:
          "運営裁定の前に、相手に少なくとも 1 回はメッセージ (または催促通知) を送ってください。連絡の証跡がない状態での申告は受け付けられません。",
        error_code: "REMINDER_REQUIRED",
        require_step: "message_or_reminder",
      },
      { status: 400 }
    );
  }

  // dispute 作成
  const { data: created, error: createErr } = await supabase
    .from("disputes")
    .insert({
      order_id: orderId,
      opened_by_user_id: user.id,
      opened_by_role: isCreator ? "creator" : "client",
      category,
      reason,
      admin_status: "received",
    })
    .select("id")
    .single();
  if (createErr || !created) {
    console.error("[disputes/create] failed", createErr);
    return NextResponse.json(
      { error: "運営への申請に失敗しました" },
      { status: 500 }
    );
  }

  // 履歴 + 紐付け
  await supabase.from("dispute_actions").insert({
    dispute_id: created.id,
    actor_user_id: user.id,
    actor_role: isCreator ? "creator" : "client",
    action_type: "dispute_opened",
    is_public: true,
    note: `カテゴリ: ${category}`,
  });

  await supabase
    .from("orders")
    .update({ active_dispute_id: created.id })
    .eq("id", orderId);

  revalidatePath(`/dashboard/orders/${orderId}`);
  return NextResponse.json({
    ok: true,
    dispute_id: created.id,
    admin_status: "received",
  });
}
