import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
  process.env.NEXT_PUBLIC_APP_URL ?? "https://aimovie-works.com";
const FROM_EMAIL =
  process.env.NOTIFY_FROM_EMAIL ?? "Aimovie <onboarding@resend.dev>";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Best-effort で外部チャネルへ配信する。失敗しても呼び出し元の処理は止めない。
 */
export async function sendExternalNotification(p: Payload): Promise<void> {
  try {
    // migration 00082 で email/phone は anon/authenticated から REVOKE 済み。
    // 通知宛先 (自分以外の profile) を lookup するため service_role を使う。
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
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
  // Cinema Ink 化: 深紺ヘッダ + ロゴマーク SVG (inline) + ember CTA + アイボリー背景。
  // Fraunces は Web Fonts CDN 経由で読み込むと Gmail 等で無視されるため、
  // 見出しは Georgia (serif fallback) で 統一感を出す。
  return `<!doctype html>
<html lang="ja">
<body style="margin:0;padding:0;background:#F7F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue','Hiragino Sans','Yu Gothic UI',sans-serif;color:#131217;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(15,30,61,0.08);">
        <!-- ヘッダ: 深紺 solid + ロゴマーク + Aimovie 英字 -->
        <tr><td style="padding:20px 28px;background:#0F1E3D;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;padding-right:10px;">
                <span style="display:inline-block;width:28px;height:28px;background:#0A1428;border-radius:5px;position:relative;">
                  <span style="position:absolute;top:5px;left:4px;width:3px;height:3px;background:#F7F5F0;border-radius:1px;"></span>
                  <span style="position:absolute;top:12px;left:4px;width:3px;height:3px;background:#F7F5F0;border-radius:1px;"></span>
                  <span style="position:absolute;top:19px;left:4px;width:3px;height:3px;background:#F7F5F0;border-radius:1px;"></span>
                  <span style="position:absolute;top:9px;left:15px;width:9px;height:9px;background:#FF6B35;border-radius:50%;"></span>
                </span>
              </td>
              <td style="vertical-align:middle;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">Aimovie<span style="color:#FF6B35;">.</span></span>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- 本文 -->
        <tr><td style="padding:36px 32px 28px;">
          <p style="margin:0 0 12px;font-size:13px;color:#5C5D67;">${escapeHtml(opts.displayName)} さん</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.45;font-weight:700;color:#0F1E3D;">${escapeHtml(opts.subject)}</h1>
          <div style="font-size:14px;line-height:1.85;color:#131217;white-space:pre-wrap;">${safeBody}</div>
          <div style="margin-top:32px;">
            <a href="${escapeAttr(opts.link)}" style="display:inline-block;background:#FF6B35;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:9999px;">
              アプリで開く →
            </a>
          </div>
        </td></tr>
        <!-- フッタ -->
        <tr><td style="padding:20px 32px;border-top:1px solid #EDE9DE;font-size:11px;color:#8A8A93;background:#FBFAF6;">
          このメールは アイムビ からの通知です。配信停止は アプリ内 設定 から変更できます。<br>
          <a href="${escapeAttr(APP_URL)}" style="color:#8A8A93;text-decoration:underline;">${escapeAttr(APP_URL)}</a>
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
