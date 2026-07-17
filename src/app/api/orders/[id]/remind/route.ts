import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/orders/:id/remind
 *
 * 「連絡が来ない」ときに相手 (creator ↔ client) に催促通知を送る。
 * トラブル報告ウィザードの「催促」経路の実装エントリ。
 *
 * 現在は notifications テーブルへ 1 行 INSERT する軽量実装。
 * 将来的にメール / LINE 連携も追加予定。同一 order 宛の催促は
 * 24 時間に 1 回まで (application 側で軽く rate-limit)。
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

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, title,
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
      { error: "この注文で催促する権限がありません" },
      { status: 403 }
    );
  }

  const targetUserId = isCreator ? clientUserId : creatorUserId;
  if (!targetUserId) {
    return NextResponse.json(
      { error: "催促の相手が見つかりません (退会済み等)" },
      { status: 400 }
    );
  }

  // rate-limit: 同 order で 24h 以内の催促が既にあれば拒否
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", targetUserId)
    .eq("type", "order_reminder")
    .gte("created_at", since);
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "この案件では 24 時間以内に既に催促を送っています。少し時間をおいてから再度お試しください。",
      },
      { status: 429 }
    );
  }

  const { error: notifyErr } = await supabase.from("notifications").insert({
    user_id: targetUserId,
    title: "取引について連絡の催促があります",
    body: `「${order.title ?? "案件"}」について、相手から返信 / 対応の催促が送られました。ダッシュボードで確認してください。`,
    link: `/dashboard/orders/${orderId}`,
    type: "order_reminder",
    is_read: false,
  });
  if (notifyErr) {
    console.error("[orders/remind] notify failed", notifyErr);
    return NextResponse.json(
      { error: "催促通知の送信に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
