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
  /** 主参考リンク (相対パス、絶対 URL 化される)。actions が無いときは
   *  Slack で「対応する」ボタンとして表示。 */
  link?: string;
  /** 追加コンテキスト (作品情報 / 通報理由 / 累積通報数 等) */
  fields?: Array<{ label: string; value: string }>;
  /** 複数のアクション ボタン (「作品を確認する」「非公開にする」等)。
   *  指定時は link より優先。Slack は actions ブロック、Email は横並びボタンで表示。 */
  actions?: Array<{ label: string; path: string; style?: "primary" | "danger" }>;
  /** 件名の緊急度プレフィックス (例: "【通報】著作権侵害の申告") */
  subjectPrefix?: string;
};

type ResolvedAction = { label: string; url: string; style?: "primary" | "danger" };

function resolveActions(
  actions: AdminIncident["actions"],
  link: string | undefined
): ResolvedAction[] {
  if (actions && actions.length > 0) {
    return actions.map((a) => ({
      label: a.label,
      url: a.path.startsWith("http") ? a.path : `${APP_URL}${a.path}`,
      style: a.style,
    }));
  }
  if (link) {
    return [
      {
        label: "対応する",
        url: link.startsWith("http") ? link : `${APP_URL}${link}`,
      },
    ];
  }
  return [];
}

export async function notifyAdmin(incident: AdminIncident): Promise<void> {
  const fullLink = incident.link ? `${APP_URL}${incident.link}` : undefined;
  const resolvedActions = resolveActions(incident.actions, incident.link);
  await Promise.allSettled([
    sendEmailToAdmins(incident, fullLink, resolvedActions),
    sendSlackToAdmins(incident, resolvedActions),
  ]);
}

async function sendEmailToAdmins(
  i: AdminIncident,
  fullLink: string | undefined,
  actions: ResolvedAction[]
): Promise<void> {
  const to = adminEmails();
  if (to.length === 0) {
    console.info(
      `[admin-notify/email/STUB] ADMIN_NOTIFY_EMAIL 未設定: ${i.subject}`
    );
    return;
  }
  // 件名: subjectPrefix が指定されていればそれを頭に、既定は [AILIER/区分]
  const prefix = i.subjectPrefix ?? `[AILIER/${labelForKind(i.kind)}]`;
  const subject = `${prefix} ${i.subject}`;
  const html = renderHtml(i, fullLink, actions);
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
  actions: ResolvedAction[]
): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.info(`[admin-notify/slack/STUB] SLACK_WEBHOOK_URL 未設定: ${i.subject}`);
    return;
  }
  const headerLabel = i.subjectPrefix ?? `[${labelForKind(i.kind)}]`;
  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${headerLabel} ${i.subject}`.slice(0, 150),
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
  if (actions.length > 0) {
    blocks.push({
      type: "actions",
      elements: actions.slice(0, 5).map((a) => ({
        type: "button",
        text: { type: "plain_text", text: a.label.slice(0, 75) },
        url: a.url,
        style: a.style === "danger" ? "danger" : a.style === "primary" ? "primary" : undefined,
      })),
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

function renderHtml(
  i: AdminIncident,
  fullLink: string | undefined,
  actions: ResolvedAction[]
): string {
  const fieldsHtml =
    (i.fields ?? [])
      .map(
        (f) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#666;">${esc(
            f.label
          )}</td><td style="padding:4px 0;">${esc(f.value)}</td></tr>`
      )
      .join("") || "";
  // 複数ボタン: 横並び ("作品を確認する" / "非公開にする" 等)
  const actionsHtml =
    actions.length > 0
      ? `<p style="margin-top:20px;">${actions
          .map((a) => {
            const bg =
              a.style === "danger"
                ? "#dc2626"
                : a.style === "primary"
                  ? "#4f46e5"
                  : "#6b7280";
            return `<a href="${a.url}" style="display:inline-block;background:${bg};color:#fff;padding:10px 20px;margin-right:8px;border-radius:9999px;text-decoration:none;">${esc(
              a.label
            )}</a>`;
          })
          .join("")}</p>`
      : fullLink
        ? `<p style="margin-top:20px;"><a href="${fullLink}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:9999px;text-decoration:none;">対応する</a></p>`
        : "";
  return `
<div style="font-family:sans-serif;color:#222;max-width:600px;">
  <h2 style="margin:0 0 8px;">${esc(i.subject)}</h2>
  <p style="white-space:pre-wrap;">${esc(i.body)}</p>
  ${fieldsHtml ? `<table style="margin-top:16px;font-size:13px;">${fieldsHtml}</table>` : ""}
  ${actionsHtml}
</div>`.trim();
}
