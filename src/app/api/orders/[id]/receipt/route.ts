import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/orders/:id/receipt
 *
 * 納品物の受領イベントを記録する。
 * フロント (ダウンロードリンクを踏んだタイミング / 使用開始ボタン押下)
 * から fire-and-forget で叩く。
 *
 * body: {
 *   action_type: 'download' | 'view_preview' | 'use_confirm',
 *   file_key?: string
 * }
 *
 * 記録されると /api/orders/:id/cancel が 100% 返金を弾く根拠になる
 * (00074 order_receipt_summary view)。
 */

const VALID_ACTIONS = new Set(["download", "view_preview", "use_confirm"]);

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
    action_type?: string;
    file_key?: string | null;
  };
  const actionType = body?.action_type ?? "";
  if (!VALID_ACTIONS.has(actionType)) {
    return NextResponse.json(
      { error: "action_type が不正です" },
      { status: 400 }
    );
  }

  // 認可 + actor_role 判定
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id,
       client:client_profiles!orders_client_id_fkey ( user_id ),
       creator:creator_profiles!orders_creator_id_fkey ( user_id )`
    )
    .eq("id", orderId)
    .maybeSingle();
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
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { error } = await supabase.from("order_deliverable_receipts").insert({
    order_id: orderId,
    actor_user_id: user.id,
    actor_role: isCreator ? "creator" : "client",
    action_type: actionType,
    file_key: typeof body.file_key === "string" ? body.file_key : null,
    ip: getClientIp(request.headers),
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });
  if (error) {
    console.error("[orders/receipt] insert failed", error);
    return NextResponse.json({ error: "記録に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
