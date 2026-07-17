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
    reason?: string;
  };
  const action = body?.action;
  const reason =
    typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : "";

  if (action !== "unpublish" && action !== "delete" && action !== "restore") {
    return NextResponse.json({ error: "action が不正です" }, { status: 400 });
  }
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
  if (creator?.user_id) {
    const title = item.title ?? "(無題)";
    const subject = `【AILIER】あなたの作品「${title}」が${ACTION_LABEL[action]}になりました`;
    const bodyLines = [
      `${creator?.profiles?.display_name ?? "クリエイター"} 様`,
      "",
      `運営がお預かりしている あなたの作品「${title}」を、` +
        `以下の理由により「${ACTION_LABEL[action]}」の措置としました。`,
      "",
      `【理由】`,
      reason,
      "",
      action === "restore"
        ? `措置は解除され、通常公開に戻っています。ご心配をおかけしました。`
        : action === "unpublish"
          ? `一時非公開の状態です。運営で内容を確認中で、判断次第 復元 または 削除 の措置に進みます。`
          : `削除措置となり、公開一覧からは表示されません。データは異議申立てのため保持しています。`,
      "",
      `【異議申立て】`,
      `この措置に異議がある場合は 24 時間以内に support@ailier.app までご連絡ください。運営が再確認いたします。`,
    ];
    await sendExternalNotification({
      userId: creator.user_id,
      kind: "message",
      subject,
      body: bodyLines.join("\n"),
      link: `/dashboard/portfolio`,
    });
  }

  revalidatePath("/creators");
  revalidatePath("/portfolios");
  return NextResponse.json({ ok: true, moderation_status: nextStatus });
}
