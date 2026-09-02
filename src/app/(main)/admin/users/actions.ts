"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * checkAdmin: admin ロール確認 + 実行者 user.id を返す。
 * 監査ログの actor_user_id に使うため、supabase client と user 両方を返す。
 */
async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");
  return { supabase, actorId: user.id };
}

/**
 * 監査ログ (moderation_actions) に profile 系の action を記録。
 * migration 00086 で target_type='profile' + suspend/restore/verify/unverify を許可。
 * INSERT 失敗しても main 処理は既に完了しているため throw せず console.error のみ。
 */
async function logAccountAction(params: {
  actorId: string;
  targetUserId: string;
  actionType:
    | "account_suspend"
    | "account_restore"
    | "account_verify"
    | "account_unverify";
  reason: string;
}) {
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("moderation_actions").insert({
      target_type: "profile",
      target_id: params.targetUserId,
      actor_user_id: params.actorId,
      actor_role: "admin",
      action_type: params.actionType,
      reason: params.reason,
    });
    if (error) {
      console.error("[admin/users/logAccountAction] insert failed", error);
    }
  } catch (e) {
    console.error("[admin/users/logAccountAction] threw", e);
  }
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const { supabase, actorId } = await checkAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { error: "更新に失敗しました" };

  // 監査ログ (先に main 処理が成功したので、記録失敗しても操作自体は完了扱い)
  await logAccountAction({
    actorId,
    targetUserId: userId,
    actionType: isActive ? "account_restore" : "account_suspend",
    reason: isActive
      ? "管理者により利用再開されました"
      : "管理者により利用停止されました",
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/moderation");
  return { success: true };
}

export async function toggleUserVerified(userId: string, isVerified: boolean) {
  const { supabase, actorId } = await checkAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: isVerified })
    .eq("id", userId);

  if (error) return { error: "更新に失敗しました" };

  await logAccountAction({
    actorId,
    targetUserId: userId,
    actionType: isVerified ? "account_verify" : "account_unverify",
    reason: isVerified
      ? "管理者により認証済にマークされました"
      : "管理者により認証マークが取り消されました",
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/moderation");
  return { success: true };
}
