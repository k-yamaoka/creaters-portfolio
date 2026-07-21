import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/orders/:id/download-delivery
 *
 * Phase 2 要件 (2026-07-21):
 *   - 発注者 (client) がこの API を叩いた瞬間:
 *     1. orders.is_downloaded_by_client = true (00076 クイックフラグ)
 *     2. orders.first_downloaded_at = now() (初回のみ)
 *     3. order_deliverable_receipts に 'download' 履歴を記録 (00074 監査)
 *   - 実際のファイル本体は Supabase Storage の署名 URL (302 リダイレクト) で
 *     返却する。file_key はクエリで指定 (?path=...)。指定がなければ 記録だけ
 *     行って 204 を返す (「使用開始マーク」用途)。
 *
 * 認可: 対象 order の client のみ
 *   crazy: creator も納品確認のためにダウンロードすることはあるが、
 *   「実質的受領」の証拠になるのは client のダウンロードのみなので、
 *   creator 呼び出しは 403 とする。
 */

export async function GET(
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

  const filePath = new URL(request.url).searchParams.get("path");

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, escrow_status, terminated_at, active_dispute_id, soft_deleted_at,
       is_downloaded_by_client, first_downloaded_at,
       client:client_profiles!orders_client_id_fkey ( user_id ),
       creator:creator_profiles!orders_creator_id_fkey ( user_id )`
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }
  if (order.soft_deleted_at) {
    return NextResponse.json(
      { error: "この取引は保持期間を経過しています" },
      { status: 410 }
    );
  }
  const clientUserId = (order.client as unknown as { user_id: string } | null)
    ?.user_id;
  if (clientUserId !== user.id) {
    return NextResponse.json(
      {
        error:
          "発注者 (クライアント) のみがダウンロード確認できます。実質的受領の記録用途です。",
      },
      { status: 403 }
    );
  }

  // 納品前は 400 (delivered 以降でのみ意味を持つ)
  if (order.status !== "delivered" && order.escrow_status !== "released") {
    return NextResponse.json(
      { error: "納品前のため、このエンドポイントは利用できません" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  // 1. orders.is_downloaded_by_client を true に (初回のみ first_downloaded_at)
  //    冪等: 2 回目以降は is_downloaded_by_client の再更新のみ
  await supabase
    .from("orders")
    .update({
      is_downloaded_by_client: true,
      ...(order.first_downloaded_at ? {} : { first_downloaded_at: now }),
    })
    .eq("id", orderId);

  // 2. 監査ログ (order_deliverable_receipts)
  //    RLS が actor_user_id=auth.uid() を要求するので、通常 client として INSERT
  await supabase.from("order_deliverable_receipts").insert({
    order_id: orderId,
    actor_user_id: user.id,
    actor_role: "client",
    action_type: "download",
    file_key: filePath ?? null,
    ip: getClientIp(request.headers),
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  // 3. ファイル本体
  //    path が指定されていれば署名 URL を発行して 302 でリダイレクト。
  //    指定がなければ「使用開始マーク」用途と判断して 204 を返す。
  if (!filePath) {
    return new NextResponse(null, { status: 204 });
  }

  // Supabase Storage に対して 60 秒の署名付き URL を発行
  //   Bucket は 'message-attachments' 想定 (既存)。将来別 bucket を使う場合は
  //   クエリ ?bucket=... で切り替えられるよう拡張予定。
  const bucket =
    new URL(request.url).searchParams.get("bucket") ?? "message-attachments";
  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 60);
  if (signErr || !signed?.signedUrl) {
    console.error("[download-delivery] sign failed", signErr);
    return NextResponse.json(
      { error: "ダウンロード URL の発行に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}
