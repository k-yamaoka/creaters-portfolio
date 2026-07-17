import { Resend } from "resend";

/**
 * 運営宛の通知 helper (00072)。
 *
 * 用途: 通報受付 / 自動非公開 / 重要インシデントなど、運営が即応する
 * 必要のあるイベントを Email + Slack に流す。
 *
 * 環境変数:
 *   ADMIN_NOTIFY_EMAIL  : 通知先メール (複数はカンマ区切り)
 *   RESEND_API_KEY      : Resend API キー (未設定なら console にフォールバック)
 *   NOTIFY_FROM_EMAIL   : 送信元 (デフォルト "AILIER <onboarding@resend.dev>")
 *   SLACK_WEBHOOK_URL   : Slack Incoming Webhook (任意)
 *
 * 例外は握りつぶす (呼び出し元の主処理を止めない)。
 */

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://creaters-portfolio.vercel.app";
const FROM_EMAIL =
  process.env.NOTIFY_FROM_EMAIL ?? "AILIER <onboarding@resend.dev>";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function adminEmails(): string[] {
  const raw = process.env.ADMIN_NOTIFY_EMAIL;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export type AdminIncident = {
  /** 通知区分。件名の [ ] に入る */
  kind: "content_report" | "auto_unpublish" | "escalation" | "info";
  subject: string;
  /** 本文 (plain text, 改行 OK) */
  body: string;
  /** 参考リンク (相対パス、絶対 URL 化される) */
  link?: string;
  /** 追加コンテキスト (作品情報 / 通報理由 / 累積通報数 等) */
  fields?: Array<{ label: string; value: string }>;
};

export async function notifyAdmin(incident: AdminIncident): Promise<void> {
  const fullLink = incident.link ? `${APP_URL}${incident.link}` : undefined;
  await Promise.allSettled([
    sendEmailToAdmins(incident, fullLink),
    sendSlackToAdmins(incident, fullLink),
  ]);
}

async function sendEmailToAdmins(
  i: AdminIncident,
  fullLink?: string
): Promise<void> {
  const to = adminEmails();
  if (to.length === 0) {
    console.info(
      `[admin-notify/email/STUB] ADMIN_NOTIFY_EMAIL 未設定: ${i.subject}`
    );
    return;
  }
  const subject = `[AILIER/${labelForKind(i.kind)}] ${i.subject}`;
  const html = renderHtml(i, fullLink);
  if (!resend) {
    console.info(`[admin-notify/email/STUB] to=${to.join(",")} subject="${subject}"`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`[admin-notify/email] failed: ${error.message ?? error}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[admin-notify/email] threw: ${msg}`);
  }
}

async function sendSlackToAdmins(
  i: AdminIncident,
  fullLink?: string
): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.info(`[admin-notify/slack/STUB] SLACK_WEBHOOK_URL 未設定: ${i.subject}`);
    return;
  }
  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `[${labelForKind(i.kind)}] ${i.subject}`.slice(0, 150),
      },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: i.body.slice(0, 2900) },
    },
  ];
  if (i.fields && i.fields.length > 0) {
    blocks.push({
      type: "section",
      fields: i.fields.slice(0, 10).map((f) => ({
        type: "mrkdwn",
        text: `*${f.label}*\n${f.value}`.slice(0, 2000),
      })),
    });
  }
  if (fullLink) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "対応する" },
          url: fullLink,
        },
      ],
    });
  }
  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: i.subject, blocks }),
    });
    if (!r.ok) {
      console.error(`[admin-notify/slack] failed: ${r.status}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[admin-notify/slack] threw: ${msg}`);
  }
}

function labelForKind(k: AdminIncident["kind"]): string {
  switch (k) {
    case "content_report":
      return "通報受付";
    case "auto_unpublish":
      return "自動非公開";
    case "escalation":
      return "エスカレーション";
    case "info":
      return "情報";
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderHtml(i: AdminIncident, fullLink?: string): string {
  const fieldsHtml =
    (i.fields ?? [])
      .map(
        (f) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#666;">${esc(
            f.label
          )}</td><td style="padding:4px 0;">${esc(f.value)}</td></tr>`
      )
      .join("") || "";
  const linkHtml = fullLink
    ? `<p style="margin-top:20px;"><a href="${fullLink}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:9999px;text-decoration:none;">対応する</a></p>`
    : "";
  return `
<div style="font-family:sans-serif;color:#222;max-width:600px;">
  <h2 style="margin:0 0 8px;">${esc(i.subject)}</h2>
  <p style="white-space:pre-wrap;">${esc(i.body)}</p>
  ${fieldsHtml ? `<table style="margin-top:16px;font-size:13px;">${fieldsHtml}</table>` : ""}
  ${linkHtml}
</div>`.trim();
}
