import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

/**
 * 外部チャネル（メール / LINE）への通知配信。
 *  - メール: Resend (RESEND_API_KEY が未設定なら console.log にフォールバック)
 *  - LINE:  Messaging API スタブ (LINE_CHANNEL_ACCESS_TOKEN が無ければ console.log)
 *
 * 呼び出し側は userId だけ渡せばよく、宛先メール / LINE ID / 通知設定は
 * profiles テーブルから解決する。
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

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://creaters-portfolio.vercel.app";
const FROM_EMAIL =
  process.env.NOTIFY_FROM_EMAIL ?? "AILIER <onboarding@resend.dev>";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Best-effort で外部チャネルへ配信する。失敗しても呼び出し元の処理は止めない。
 */
export async function sendExternalNotification(p: Payload): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, email, display_name, line_user_id, notify_email, notify_line"
      )
      .eq("id", p.userId)
      .maybeSingle();

    if (!profile) {
      // userId はログに残さない (PII / 内部ID 露出を回避)
      console.warn(`[notify-external] target profile not found`);
      return;
    }

    const channels: ExternalChannel[] = [];
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
    // err 全体を出さない: スタックトレースや内部状態に PII が混入する余地を残さない
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[notify-external] failed: ${msg}`);
  }
}

async function dispatch(
  channel: ExternalChannel,
  data: Payload & { to: string; displayName: string; fullLink: string }
): Promise<void> {
  if (channel === "email") {
    if (!resend) {
      // STUB ログには宛先メール / link を出さない (PII 漏えい対策)
      console.info(`[notify-external/email/STUB] subject="${data.subject}"`);
      return;
    }
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [data.to],
        subject: data.subject,
        html: renderEmailHtml({
          displayName: data.displayName,
          subject: data.subject,
          body: data.body,
          link: data.fullLink,
        }),
      });
      if (error) {
        // error オブジェクト全体を出すと API 応答内に宛先が含まれる場合があるため
        // message のみ取り出す
        const msg =
          (error as { message?: string } | undefined)?.message ?? "unknown";
        console.error(`[notify-external/email] resend error: ${msg}`);
      }
    } catch {
      console.error(`[notify-external/email] exception during send`);
    }
    return;
  }

  if (channel === "line") {
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      // STUB ログには LINE userId / body を出さない (PII)
      console.info(`[notify-external/line/STUB] subject="${data.subject}"`);
      return;
    }
    try {
      const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: data.to,
          messages: [
            {
              type: "text",
              text: `${data.subject}\n\n${data.body}\n\n${data.fullLink}`.slice(
                0,
                4900
              ),
            },
          ],
        }),
      });
      if (!res.ok) {
        // 応答本文には userId が含まれる可能性があるため status のみログする
        console.error(`[notify-external/line] http ${res.status}`);
      }
    } catch {
      console.error(`[notify-external/line] exception during send`);
    }
    return;
  }
}

function renderEmailHtml(opts: {
  displayName: string;
  subject: string;
  body: string;
  link: string;
}): string {
  const safeBody = escapeHtml(opts.body).replace(/\n/g, "<br>");
  return `<!doctype html>
<html lang="ja">
<body style="margin:0;padding:0;background:#f0ede5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ede5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #1a1a1a;">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #e6e1d3;">
          <span style="font-size:13px;letter-spacing:0.25em;color:#6b6657;text-transform:uppercase;">AILIER</span>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <p style="margin:0 0 16px;font-size:14px;color:#6b6657;">${escapeHtml(opts.displayName)} さん</p>
          <h1 style="margin:0 0 20px;font-size:22px;line-height:1.4;font-weight:700;color:#1a1a1a;">${escapeHtml(opts.subject)}</h1>
          <div style="font-size:14px;line-height:1.85;color:#1a1a1a;white-space:pre-wrap;">${safeBody}</div>
          <div style="margin-top:32px;">
            <a href="${escapeAttr(opts.link)}" style="display:inline-block;background:#1a1a1a;color:#f0ede5;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:2px;">
              アプリで開く →
            </a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #e6e1d3;font-size:11px;color:#9a9384;">
          このメールは AILIER からの通知です。配信停止は アプリ内 設定 から変更できます。<br>
          <a href="${escapeAttr(APP_URL)}" style="color:#9a9384;">${escapeAttr(APP_URL)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
