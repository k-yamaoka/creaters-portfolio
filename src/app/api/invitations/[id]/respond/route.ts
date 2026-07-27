import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/invitations/:id/respond
 *
 * C-3 手動マッチング (2026-07-21):
 *   招待されたクリエイターが「応募する」or「見送る」を選択する。
 *
 * body: {
 *   action: 'accept' | 'decline'
 *   reason?: string  (decline のとき任意)
 * }
 *
 * 挙動 (accept):
 *   1. status を 'accepted' に更新
 *   2. 案件詳細ページへのリンクを返し、フロントが遷移 (実応募は既存
 *      /api/jobs/apply フロー)
 *
 * 挙動 (decline):
 *   1. status を 'declined' + decline_reason を記録
 *
 * 認可: RLS で本人のみ UPDATE 可 (00079 policy)
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invitationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    reason?: string;
  };
  const action = body.action;
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "action が不正です" }, { status: 400 });
  }
  const reason =
    typeof body.reason === "string" ? body.reason.slice(0, 500) : null;

  // 招待の状態確認 (RLS で本人のみ SELECT 可)
  const { data: invitation } = await supabase
    .from("job_invitations")
    .select("id, status, job_id, expires_at")
    .eq("id", invitationId)
    .maybeSingle();
  if (!invitation) {
    return NextResponse.json({ error: "招待が見つかりません" }, { status: 404 });
  }
  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: `この招待は既に ${invitation.status} 状態です` },
      { status: 409 }
    );
  }
  if (
    invitation.expires_at &&
    new Date(invitation.expires_at).getTime() < Date.now()
  ) {
    // 期限切れは decline 相当だが application 側で expired にマーク
    await supabase
      .from("job_invitations")
      .update({ status: "expired", responded_at: new Date().toISOString() })
      .eq("id", invitationId);
    return NextResponse.json(
      { error: "この招待は有効期限切れです" },
      { status: 410 }
    );
  }

  const nextStatus = action === "accept" ? "accepted" : "declined";
  const { error: updErr } = await supabase
    .from("job_invitations")
    .update({
      status: nextStatus,
      responded_at: new Date().toISOString(),
      decline_reason: action === "decline" ? reason : null,
    })
    .eq("id", invitationId)
    .eq("status", "pending");
  if (updErr) {
    console.error("[invitations/respond] failed", updErr);
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }

  revalidatePath("/dashboard/invitations");
  revalidatePath("/dashboard");

  return NextResponse.json({
    ok: true,
    action,
    job_id: invitation.job_id,
    redirect_to:
      action === "accept" ? `/jobs/${invitation.job_id}` : "/dashboard/invitations",
  });
}
