import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendExternalNotification } from "@/lib/notify-external";
import { revalidatePath } from "next/cache";

/**
 * POST /api/admin/portfolio/:id/moderation
 *
 * 管理者 (profiles.role='admin') が portfolio_items のモデレーション
 * (unpublish / delete / restore) を実行する。
 *
 * body: { action: 'unpublish' | 'delete' | 'restore', reason: string (required) }
 *
 * 実行内容:
 *   1. 認可: profiles.role='admin' 必須
 *   2. reason 必須検証
 *   3. portfolio_items.moderation_status を更新
 *   4. moderation_actions に監査ログを追加
 *   5. 対応中の content_reports を resolved に一括更新
 *   6. クリエイターへ Email 通知 (理由 + 異議申立て導線)
 */

type Action = "unpublish" | "delete" | "restore";

const ACTION_LABEL: Record<Action, string> = {
  unpublish: "一時非公開",
  delete: "削除",
  restore: "公開に復元",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: portfolioId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 認可: admin ロール確認
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    reason_category?: string;
    reason_detail?: string;
    reason?: string; // legacy 単一 reason フィールド互換
  };
  const action = body?.action;

  if (action !== "unpublish" && action !== "delete" && action !== "restore") {
    return NextResponse.json({ error: "action が不正です" }, { status: 400 });
  }

  // 理由: プルダウン カテゴリ + 自由入力 の 2 段構成 (§2b)。
  //   restore はカテゴリ任意、unpublish/delete はカテゴリ必須。
  const category =
    typeof body.reason_category === "string" ? body.reason_category : "";
  const detail =
    typeof body.reason_detail === "string" ? body.reason_detail.trim() : "";

  const VALID_REASON_CATEGORIES: Record<string, string> = {
    copyright_suspected: "著作権侵害の疑い",
    quality_below: "品質基準",
    prohibited_content: "禁止コンテンツ",
    many_reports: "通報多数",
    other: "その他",
  };
  const categoryLabel = VALID_REASON_CATEGORIES[category] ?? "";

  if (action !== "restore" && !categoryLabel) {
    return NextResponse.json(
      { error: "理由カテゴリの選択は必須です" },
      { status: 400 }
    );
  }

  // 実際に DB に書く reason 文字列 (legacy 互換 + カテゴリ + 補足)
  const legacyReason =
    typeof body.reason === "string" ? body.reason.trim() : "";
  const reason =
    (categoryLabel
      ? `[${categoryLabel}]${detail ? ` ${detail}` : ""}`
      : detail || legacyReason
    ).slice(0, 2000);
  if (reason.length === 0) {
    return NextResponse.json(
      { error: "理由の記入は必須です" },
      { status: 400 }
    );
  }

  // service_role で書き込む (RLS bypass)
  const admin = getSupabaseAdmin();
  const { data: item } = await admin
    .from("portfolio_items")
    .select(
      "id, title, moderation_status, creator:creator_profiles!portfolio_items_creator_id_fkey ( id, user_id, profiles!creator_profiles_user_id_fkey ( display_name ) )"
    )
    .eq("id", portfolioId)
    .maybeSingle();
  if (!item) {
    return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
  }

  // 遷移バリデーション
  //   published/unpublished/deleted → 意図しない状態遷移 (例: deleted → unpublish) は拒否
  if (action === "restore" && item.moderation_status === "published") {
    return NextResponse.json(
      { error: "既に公開状態です" },
      { status: 400 }
    );
  }
  if (action === "delete" && item.moderation_status === "deleted") {
    return NextResponse.json(
      { error: "既に削除済みです" },
      { status: 400 }
    );
  }

  const nextStatus =
    action === "restore"
      ? "published"
      : action === "unpublish"
        ? "unpublished"
        : "deleted";

  // portfolio_items 更新
  const { error: updErr } = await admin
    .from("portfolio_items")
    .update({
      moderation_status: nextStatus,
      moderation_reason: reason,
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", portfolioId);
  if (updErr) {
    console.error("[admin/portfolio/moderation] update failed", updErr);
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }

  // moderation_actions に監査ログ (必ず記録)
  await admin.from("moderation_actions").insert({
    target_type: "portfolio_item",
    target_id: portfolioId,
    actor_user_id: user.id,
    actor_role: "admin",
    action_type: action,
    reason,
  });

  // 未対応の content_reports を resolved にマーク (restore 時は open のまま)
  if (action !== "restore") {
    await admin
      .from("content_reports")
      .update({
        status: "resolved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("target_type", "portfolio_item")
      .eq("target_id", portfolioId)
      .eq("status", "open");
  }

  // クリエイターへ Email 通知 (理由 + 異議申立て導線)
  const creator = (
    item.creator as unknown as {
      id?: string;
      user_id?: string;
      profiles?: { display_name?: string };
    } | null
  ) ?? null;
  // クリエイターへの通知 (§2c サイレント BAN 禁止) を action 別に出し分け
  if (creator?.user_id) {
    const title = item.title ?? "(無題)";
    const displayName = creator?.profiles?.display_name ?? "クリエイター";

    const notifyPayload =
      action === "restore"
        ? {
            subject: `【AILIER】作品「${title}」の公開を再開しました`,
            body: [
              `${displayName} 様`,
              "",
              "運営が内容を確認したところ問題無しと判断し、あなたの作品",
              `「${title}」の 一時非公開措置を解除 いたしました。`,
              "作品は通常公開に戻っています。ご心配をおかけし申し訳ございませんでした。",
              "",
              "【運営からの説明】",
              reason,
              "",
              "AILIER 運営",
            ].join("\n"),
          }
        : action === "unpublish"
          ? {
              subject: `【AILIER】作品「${title}」を一時非公開にしました (異議申立て可)`,
              body: [
                `${displayName} 様`,
                "",
                `あなたの作品「${title}」について、以下の理由により`,
                `<b>一時非公開</b> の措置としました。データは保持しており、削除ではありません。`,
                "",
                "【理由】",
                reason,
                "",
                "【運営の判断】",
                "運営で内容を確認中です。判断次第 復元 または 削除 の措置に進みます。",
                "",
                "【異議申立て】",
                "本措置に異議がある場合は 72 時間以内に support@ailier.app までご連絡ください。",
                "件名に「異議申立て / 作品 ID: XXXX」と記載いただくとスムーズです。",
                "",
                "詳細は利用規約 第 4 条の 2 (AI 生成コンテンツ ガイドライン) をご確認ください。",
                "",
                "AILIER 運営",
              ].join("\n"),
            }
          : {
              subject: `【AILIER】作品「${title}」を削除しました (最終措置)`,
              body: [
                `${displayName} 様`,
                "",
                `あなたの作品「${title}」について、以下の理由により`,
                `<b>削除</b> の最終措置としました。公開一覧からは表示されません。`,
                "データは異議申立てのため一定期間保持しています。",
                "",
                "【最終的な削除理由】",
                reason,
                "",
                "【異議申立て】",
                "本措置に異議がある場合は 72 時間以内に support@ailier.app までご連絡ください。",
                "件名に「削除異議申立て / 作品 ID: XXXX」と記載ください。",
                "運営が再確認のうえ対応いたします。",
                "",
                "AILIER 運営",
              ].join("\n"),
            };

    await sendExternalNotification({
      userId: creator.user_id,
      kind: "message",
      subject: notifyPayload.subject,
      body: notifyPayload.body,
      link: `/dashboard/portfolio`,
    });
  }

  revalidatePath("/creators");
  revalidatePath("/portfolios");
  return NextResponse.json({ ok: true, moderation_status: nextStatus });
}
