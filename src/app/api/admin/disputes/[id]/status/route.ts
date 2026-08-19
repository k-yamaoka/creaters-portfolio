import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * POST /api/admin/disputes/:id/status
 *
 * dispute の admin_status を received → reviewing に手動遷移する (裁定確定は
 * /ruling で resolved にする)。
 *
 * body: { admin_status: "reviewing", note?: string }
 * 遷移可能: received → reviewing のみ。他は 400。
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: disputeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    admin_status?: string;
    note?: string;
  };
  if (body.admin_status !== "reviewing") {
    return NextResponse.json(
      { error: "admin_status は 'reviewing' のみ指定可能 (resolved は /ruling)" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  // 楽観ロック: 現在 received のもののみ reviewing に。
  const { data: updated, error } = await admin
    .from("disputes")
    .update({ admin_status: "reviewing" })
    .eq("id", disputeId)
    .eq("admin_status", "received")
    .select("id");
  if (error) {
    console.error("[admin/dispute/status] update failed", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "既に reviewing / resolved に遷移済みです" },
      { status: 409 }
    );
  }

  // 履歴に internal メモとして残す (公開しない)
  await admin.from("dispute_actions").insert({
    dispute_id: disputeId,
    actor_user_id: user.id,
    actor_role: "admin",
    action_type: "admin_status_update",
    is_public: false,
    note:
      (body.note?.slice(0, 500) ?? "") ||
      "reviewing に遷移 (運営 手動)",
  });

  revalidatePath(`/admin/disputes/${disputeId}`);
  revalidatePath("/admin/disputes");
  return NextResponse.json({ ok: true, admin_status: "reviewing" });
}
