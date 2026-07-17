import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * 納品期限リマインド cron (Vercel Cron 1 日 1 回)。
 *
 * 対象:
 *   - status IN ('production','revision') (制作中)
 *   - delivery_days が設定されている (created_at + delivery_days が期限)
 *   - 期限 24h 以内 or 期限超過
 *   - 過去 24 時間で同一 order の期限催促通知が無い (重複防止)
 *   - terminated_at IS NULL AND active_dispute_id IS NULL
 *
 * 通知先: 制作担当 (creator)
 * type: 'order_deadline_reminder'
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
  const now = new Date();

  // production / revision の active order 取得 (100 件上限)
  const { data: orders, error: selectErr } = await supabase
    .from("orders")
    .select(
      "id, title, created_at, delivery_days, status, creator_id, creator:creator_profiles!orders_creator_id_fkey ( user_id )"
    )
    .in("status", ["production", "revision"])
    .not("delivery_days", "is", null)
    .is("terminated_at", null)
    .is("active_dispute_id", null)
    .limit(100);
  if (selectErr) {
    return NextResponse.json({ ok: false, error: "select failed" }, { status: 500 });
  }

  let sent = 0;
  for (const o of orders ?? []) {
    const created = new Date(o.created_at);
    const deadline = new Date(created.getTime());
    deadline.setDate(deadline.getDate() + (o.delivery_days as number));
    const hoursUntilDeadline =
      (deadline.getTime() - now.getTime()) / (1000 * 3600);

    // 24h 前 〜 期限超過 が対象
    if (hoursUntilDeadline > 24) continue;

    const creatorUserId = (
      o.creator as unknown as { user_id?: string } | null
    )?.user_id;
    if (!creatorUserId) continue;

    // 過去 24h の重複通知を弾く
    const since = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", creatorUserId)
      .eq("type", "order_deadline_reminder")
      .eq("link", `/dashboard/orders/${o.id}`)
      .gte("created_at", since);
    if ((count ?? 0) > 0) continue;

    const isOverdue = hoursUntilDeadline < 0;
    await supabase.from("notifications").insert({
      user_id: creatorUserId,
      type: "order_deadline_reminder",
      title: isOverdue
        ? "納品期限を超過しています"
        : "納品期限が 24 時間以内に迫っています",
      body: `「${o.title ?? "案件"}」の納品期限が ${
        isOverdue
          ? `${Math.round(Math.abs(hoursUntilDeadline))} 時間経過`
          : `残り ${Math.round(hoursUntilDeadline)} 時間`
      } です。進捗をご確認ください。`,
      link: `/dashboard/orders/${o.id}`,
      is_read: false,
    });
    sent += 1;
  }

  return NextResponse.json({
    ok: true,
    scanned: orders?.length ?? 0,
    sent,
  });
}
