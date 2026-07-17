import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/orders/:id/dispute
 *
 * 「運営に相談する」ウィザードから発火。dispute を open し、
 * order.active_dispute_id を紐付ける。同時に dispute_actions に
 * 'dispute_opened' の履歴 (is_public=true) を残す。
 *
 * category は仕様と同期:
 *   no_response / unfair_revision / payment_delay / quality_issue
 *   / termination_dispute / other
 *
 * ステータス表示: 受付済 (received) → 確認中 (reviewing) → 対応完了 (resolved)。
 * 内部メモ (internal_note) は UI に返さない (RLS で隠蔽)。
 */

const VALID_CATEGORIES = new Set([
  "no_response",
  "unfair_revision",
  "payment_delay",
  "quality_issue",
  "termination_dispute",
  "other",
]);

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
    category?: string;
    reason?: string;
  };
  const category = body?.category ?? "";
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: "カテゴリが不正です" },
      { status: 400 }
    );
  }
  // 00072: 申請理由は必須化 (仕様 #4)
  const rawReason =
    typeof body.reason === "string" ? body.reason.trim() : "";
  if (rawReason.length === 0) {
    return NextResponse.json(
      {
        error:
          "申請理由の記入は必須です。運営が状況を把握できるよう詳細をお書きください。",
      },
      { status: 400 }
    );
  }
  const reason = rawReason.slice(0, 2000);

  // 認可 + 既存 dispute チェック
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, active_dispute_id, status,
       client:client_profiles!orders_client_id_fkey ( user_id ),
       creator:creator_profiles!orders_creator_id_fkey ( user_id )`
    )
    .eq("id", orderId)
    .single();
  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }
  const clientUserId = (order.client as unknown as { user_id: string } | null)
    ?.user_id;
  const creatorUserId = (order.creator as unknown as { user_id: string } | null)
    ?.user_id;
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
        error:
          "既に運営に申請中の紛争があります。対応をお待ちください。",
        dispute_id: order.active_dispute_id,
      },
      { status: 409 }
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
    console.error("[orders/dispute] create failed", createErr);
    return NextResponse.json(
      { error: "運営への申請に失敗しました" },
      { status: 500 }
    );
  }

  // 履歴ログ
  await supabase.from("dispute_actions").insert({
    dispute_id: created.id,
    actor_user_id: user.id,
    actor_role: isCreator ? "creator" : "client",
    action_type: "dispute_opened",
    is_public: true,
    note: `カテゴリ: ${category}`,
  });

  // orders.active_dispute_id を紐付け
  await supabase
    .from("orders")
    .update({ active_dispute_id: created.id })
    .eq("id", orderId);

  revalidatePath(`/dashboard/orders/${orderId}`);
  return NextResponse.json({ ok: true, dispute_id: created.id });
}
