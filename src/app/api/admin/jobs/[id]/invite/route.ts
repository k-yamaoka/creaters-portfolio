import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendExternalNotification } from "@/lib/notify-external";
import { revalidatePath } from "next/cache";

/**
 * POST /api/admin/jobs/:id/invite
 *
 * C-3 手動マッチング (2026-07-21):
 *   管理者が特定案件に対して 1 名 or 複数のクリエイターへ 招待通知を送る。
 *
 * body: {
 *   creator_ids: string[]         (creator_profiles.id の配列、1..50)
 *   message?: string              (テンプレ + 個別調整の一言 <= 500 字)
 * }
 *
 * 挙動:
 *   1. admin 認可
 *   2. job の存在確認 + creator_ids の実在性確認
 *   3. job_invitations に一括 INSERT (ON CONFLICT DO NOTHING で重複排除)
 *   4. 新規招待した creator に notifications (in-app) + Email 通知
 *   5. サマリを返す { invited: n, skipped: n }
 */

const MAX_CREATORS_PER_CALL = 50;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    creator_ids?: unknown;
    message?: unknown;
  };
  const rawIds = Array.isArray(body.creator_ids) ? body.creator_ids : [];
  const creatorIds = rawIds
    .filter((v): v is string => typeof v === "string")
    .filter((v) => /^[0-9a-f-]{36}$/.test(v))
    .slice(0, MAX_CREATORS_PER_CALL);
  if (creatorIds.length === 0) {
    return NextResponse.json(
      { error: "creator_ids が指定されていません" },
      { status: 400 }
    );
  }
  const message =
    typeof body.message === "string" ? body.message.slice(0, 500) : null;

  const admin = getSupabaseAdmin();

  // job 存在確認 + 情報取得 (通知用)
  const { data: job } = await admin
    .from("jobs")
    .select("id, title, description, budget_min, budget_max, deadline")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) {
    return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
  }

  // creator 存在確認 + notify 用の user_id を取得
  const { data: creators } = await admin
    .from("creator_profiles")
    .select(
      `id, user_id, is_searchable,
       profiles!creator_profiles_user_id_fkey ( display_name, is_active )`
    )
    .in("id", creatorIds);

  type CreatorRow = {
    id: string;
    user_id: string;
    is_searchable: boolean;
    profiles?: { display_name?: string; is_active?: boolean };
  };
  const validCreators = (creators ?? []).filter((c) => {
    const r = c as unknown as CreatorRow;
    return r.profiles?.is_active !== false;
  }) as unknown as CreatorRow[];

  if (validCreators.length === 0) {
    return NextResponse.json(
      { error: "有効な招待対象がいません" },
      { status: 400 }
    );
  }

  // 一括 INSERT (ON CONFLICT で重複スキップ)
  const rows = validCreators.map((c) => ({
    job_id: jobId,
    creator_id: c.id,
    invited_by: user.id,
    message,
  }));
  const { data: inserted, error: insertErr } = await admin
    .from("job_invitations")
    .upsert(rows, { onConflict: "job_id,creator_id", ignoreDuplicates: true })
    .select("id, creator_id");

  if (insertErr) {
    console.error("[admin/jobs/invite] insert failed", insertErr);
    return NextResponse.json(
      { error: `招待の登録に失敗しました: ${insertErr.message}` },
      { status: 500 }
    );
  }

  const insertedIds = new Set(
    (inserted ?? []).map((r) => (r as { creator_id: string }).creator_id)
  );
  const newlyInvited = validCreators.filter((c) => insertedIds.has(c.id));
  const skipped = validCreators.length - newlyInvited.length;

  // 新規招待対象に in-app 通知 + Email
  const budgetLabel =
    job.budget_min || job.budget_max
      ? `¥${(job.budget_min ?? 0).toLocaleString()}〜¥${(job.budget_max ?? 0).toLocaleString()}`
      : "予算応相談";

  for (const c of newlyInvited) {
    // notifications (in-app)
    await admin.from("notifications").insert({
      user_id: c.user_id,
      type: "job_invitation",
      title: "💌 運営からのおすすめ案件が届きました",
      body: `「${job.title ?? "案件"}」への招待が届いています。ダッシュボードから内容をご確認ください。`,
      link: `/dashboard/invitations`,
      is_read: false,
    });

    // Email 通知
    try {
      await sendExternalNotification({
        userId: c.user_id,
        kind: "message",
        subject: `【アイムビ】💌 運営からのおすすめ案件: ${job.title ?? "案件"}`,
        body: [
          `${c.profiles?.display_name ?? "クリエイター"} 様`,
          "",
          "アイムビ 運営です。",
          "あなたのスキル・実績にマッチする案件が入りましたので、ご案内いたします。",
          "",
          `【案件タイトル】 ${job.title ?? "-"}`,
          `【予算目安】 ${budgetLabel}`,
          job.deadline ? `【募集締切】 ${job.deadline}` : "",
          "",
          message ? `【運営からの一言】\n${message}\n` : "",
          "詳細は アイムビ ダッシュボードの「💌 運営からのおすすめ案件」からご確認ください。",
          "「詳細を見て応募する」または「今回は見送る」を選択いただけます。",
          "",
          "有効期限: 14 日以内 (それ以降は自動的に見送り扱いになります)",
          "",
          "アイムビ 運営",
        ]
          .filter((s) => s !== "")
          .join("\n"),
        link: `/dashboard/invitations`,
      });
    } catch (e) {
      // 非致命 (DB 登録は成功済)
      console.error("[admin/jobs/invite] email failed for", c.id, e);
    }
  }

  // 監査ログ (moderation_actions) に一括送信の実行を記録。
  // migration 00087 で target_type='job' + action_type='invitation_send' を許可。
  // 失敗しても main 処理 (既に招待 INSERT 済) は影響ないので console.error のみ。
  try {
    const { error: logErr } = await admin
      .from("moderation_actions")
      .insert({
        target_type: "job",
        target_id: jobId,
        actor_user_id: user.id,
        actor_role: "admin",
        action_type: "invitation_send",
        reason:
          `一括スカウト送信: 新規 ${newlyInvited.length} 名 / ` +
          `重複 skip ${skipped} 名` +
          (message ? ` / メッセージ有 (${message.length} 字)` : ""),
      });
    if (logErr) {
      console.error(
        `[admin/jobs/invite] audit log insert failed: ${logErr.message}`
      );
    }
  } catch (e) {
    console.error("[admin/jobs/invite] audit log threw", e);
  }

  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/moderation");

  return NextResponse.json({
    ok: true,
    invited: newlyInvited.length,
    skipped,
    job_id: jobId,
  });
}
