import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 退会後の再登録ブロック期間 (日)。
 * この期間内に同じメールでログイン/再登録しようとすると弾く。
 */
export const BLOCK_DAYS = 30;

/**
 * 指定メールが現在のブロック期間内に削除済みかどうかを返す。
 *
 * RLS policy 側でも同等のフィルタを掛けているが、サーバー側 (admin client / route handler)
 * からの呼び出しでは RLS が効かないため、ここで明示的に deleted_at の閾値を絞る。
 */
export async function isEmailBlocked(
  supabase: SupabaseClient,
  emailLower: string
): Promise<boolean> {
  const cutoff = new Date(Date.now() - BLOCK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("deleted_account_emails")
    .select("email_lower")
    .eq("email_lower", emailLower)
    .gt("deleted_at", cutoff)
    .maybeSingle();
  if (error) return false;
  return !!data;
}
