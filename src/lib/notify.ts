import { createClient } from "@/lib/supabase/server";
import {
  sendExternalNotification,
  type ExternalNotificationKind,
} from "@/lib/notify-external";

type NotificationType =
  | "message"
  | "order_status"
  | "job_application"
  | "job_accepted"
  | "job_rejected"
  | "scout";

/**
 * 通知書き込み + システムメッセージ送信のユーティリティ。
 * - notifications テーブルに INSERT (ベルのドロップダウン用)
 * - 同時に messages テーブルにシステムメッセージを INSERT すると、既存の
 *   MessageNotifier が拾って受信者にトーストを表示する。
 *
 * メールやLINEなど外部チャネルへの配信は Stage E で notify-external.ts として
 * 追加し、ここから呼び出せるようにする。
 */
export async function createNotification(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? null,
    link: opts.link ?? null,
  });
  if (error) {
    console.error("createNotification failed", error);
  }

  // 外部チャネル(メール / LINE)へも best-effort で配信
  if (opts.type !== "message") {
    await sendExternalNotification({
      userId: opts.userId,
      kind: opts.type as ExternalNotificationKind,
      subject: opts.title,
      body: opts.body ?? "",
      link: opts.link,
    });
  }
}

export async function sendSystemMessage(opts: {
  senderUserId: string;
  receiverUserId: string;
  content: string;
  orderId?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    sender_id: opts.senderUserId,
    receiver_id: opts.receiverUserId,
    content: opts.content,
    order_id: opts.orderId ?? null,
  });
  if (error) {
    console.error("sendSystemMessage failed", error);
  }
}
