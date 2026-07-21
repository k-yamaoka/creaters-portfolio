import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * 2 年データ保持 cron (00073, 週次)。
 *
 * 実行内容:
 *   1. messages.retention_until < now() の行を物理 DELETE
 *      (2 年経過した取引の付随メッセージが対象)
 *   2. orders.data_retention_until < now() かつ soft_deleted_at IS NULL の行を
 *      soft_deleted_at=now() でマーク (UI 非表示化)
 *      物理削除はしない (監査目的で行は残す)
 *
 * 上限: 各 500 行ずつ (次週に持ち越し)。急な大量削除を避け DB 負荷を平準化。
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_MESSAGES = 500;
const BATCH_ORDERS = 500;

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

  // 1. messages 物理削除
  const { data: msgTargets } = await supabase
    .from("messages")
    .select("id")
    .not("retention_until", "is", null)
    .lt("retention_until", nowIso)
    .limit(BATCH_MESSAGES);
  const msgIds = (msgTargets ?? []).map((m) => m.id as string);
  let deletedMessages = 0;
  if (msgIds.length > 0) {
    const { error } = await supabase.from("messages").delete().in("id", msgIds);
    if (!error) deletedMessages = msgIds.length;
    else console.error("[cron/data-retention] messages delete failed", error);
  }

  // 2. orders soft-delete マーキング
  const { data: ordersToArchive } = await supabase
    .from("orders")
    .select("id")
    .not("data_retention_until", "is", null)
    .lt("data_retention_until", nowIso)
    .is("soft_deleted_at", null)
    .limit(BATCH_ORDERS);
  const orderIds = (ordersToArchive ?? []).map((o) => o.id as string);
  let softDeletedOrders = 0;
  if (orderIds.length > 0) {
    const { error } = await supabase
      .from("orders")
      .update({ soft_deleted_at: nowIso })
      .in("id", orderIds);
    if (!error) softDeletedOrders = orderIds.length;
    else console.error("[cron/data-retention] orders archive failed", error);
  }

  return NextResponse.json({
    ok: true,
    deleted_messages: deletedMessages,
    soft_deleted_orders: softDeletedOrders,
  });
}
