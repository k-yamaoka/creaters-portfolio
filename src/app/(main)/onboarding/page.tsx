import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

/**
 * /onboarding
 *
 * サインアップ直後 (creator, ポートフォリオ 0 点, 未完了) に表示される
 * 2 ステップの Welcome ウィザード。
 *
 * リダイレクト方針:
 *   - 未ログイン → /login
 *   - 完了済み (onboarding_completed_at != NULL) → /dashboard
 *   - client ロールは対象外 → /dashboard
 *   - creator だが creator_profile が無い異常状態 → /dashboard/profile
 *
 * client ロールは初回投稿の必要が無いためスキップし、
 * ダッシュボードのオンボーディング アラート (00067) に委ねる。
 */
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "creator") redirect("/dashboard");
  if (!user.creator_profile) redirect("/dashboard/profile");

  // onboarding_completed_at を取得 (getCurrentUser は返さないので直接)
  const supabase = await createClient();
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profileRow?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard
      initialDisplayName={user.display_name}
      email={user.email}
      initialUserType={user.creator_profile.user_type}
      initialBio={user.creator_profile.bio}
    />
  );
}
