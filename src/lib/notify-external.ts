import { createClient } from "@/lib/supabase/server";

/**
 * 外部チャネル（メール / LINE）への通知配信。
 *
 * 現状はスタブで、コンソールログのみ。実プロバイダ接続時にはここを差し替える。
 *  - メール: Resend / SendGrid / Amazon SES など
 *  - LINE:  Messaging API (LINE Notify は2025年で終了予定)
 *
 * 呼び出し側はキー(userId)だけ渡せばよく、メールアドレスや LINE 連携は
 * このモジュール内で profiles テーブルから解決する。
 */

type ExternalChannel = "email" | "line";

export type ExternalNotificationKind =
  | "job_application"
  | "job_accepted"
  | "job_rejected"
  | "scout"
  | "message"
  | "order_status";

type Payload = {
  userId: string;
  kind: ExternalNotificationKind;
  subject: string;
  body: string;
  /** 通知に含めたい遷移先パス (例: /dashboard/orders/xxx) */
  link?: string;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://creaters-portfolio.vercel.app";

/**
 * Best-effort で外部チャネルへ配信する。失敗しても呼び出し元の処理は止めない。
 */
export async function sendExternalNotification(p: Payload): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, display_name, line_user_id, notify_email, notify_line")
      .eq("id", p.userId)
      .maybeSingle();

    if (!profile) {
      console.warn(`[notify-external] profile not found for ${p.userId}`);
      return;
    }

    const channels: ExternalChannel[] = [];
    // 設定カラムが無い時(default)はメールのみ送る
    if (profile.notify_email !== false && profile.email) channels.push("email");
    if (profile.notify_line && profile.line_user_id) channels.push("line");

    const fullLink = p.link ? `${APP_URL}${p.link}` : APP_URL;

    for (const ch of channels) {
      await dispatch(ch, {
        ...p,
        to: ch === "email" ? profile.email : profile.line_user_id,
        displayName: profile.display_name,
        fullLink,
      });
    }
  } catch (err) {
    console.error("[notify-external] failed", err);
  }
}

async function dispatch(
  channel: ExternalChannel,
  data: Payload & { to: string; displayName: string; fullLink: string }
): Promise<void> {
  // TODO: 実プロバイダへの送信ロジックに差し替え
  if (channel === "email") {
    console.info(
      `[notify-external/email] to=${data.to} (${data.displayName}) kind=${data.kind} subject="${data.subject}" link=${data.fullLink}`
    );
    // 例: await resend.emails.send({ to: data.to, subject: data.subject, html: ... })
    return;
  }

  if (channel === "line") {
    console.info(
      `[notify-external/line] to=${data.to} (${data.displayName}) kind=${data.kind} body="${data.body.slice(0, 80)}…"`
    );
    // 例: await fetch('https://api.line.me/v2/bot/message/push', { ... })
    return;
  }
}
