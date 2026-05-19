import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 退会済みユーザーの表示名を archived_profiles から復元する。
 *
 * - orders.client_id / orders.creator_id は SET NULL されるが、
 *   orders.archived_client_user_id / archived_creator_user_id に元の auth.users.id が残る。
 * - この id を archived_profiles と突き合わせて display_name を取り出し、
 *   UI 側で「(退会済み: 山田太郎)」のように表示する。
 *
 * RLS の関係で archived_profiles は一般ユーザーから直接読めない。
 * このため呼び出し側で service_role 経由 (admin client) で取得するか、
 * 表示の安全側として「(退会済みユーザー)」だけを返すフォールバックを用意する。
 */
export async function resolveArchivedDisplayName(
  adminClient: SupabaseClient,
  originalUserId: string | null | undefined
): Promise<string> {
  if (!originalUserId) return "(退会済みユーザー)";
  const { data } = await adminClient
    .from("archived_profiles")
    .select("display_name")
    .eq("original_user_id", originalUserId)
    .maybeSingle();
  if (!data?.display_name) return "(退会済みユーザー)";
  return `(退会済み: ${data.display_name})`;
}

/**
 * order の client/creator が null かを判定し、表示用の name を返すヘルパー。
 *
 * - profile が生きていれば profile.display_name を返す
 * - 死んでいて archived_*_user_id があれば archived_profiles を引く (要 admin client)
 * - 何も無ければ役割に応じたフォールバック文字列
 */
export function fallbackPartnerLabel(role: "client" | "creator"): string {
  return role === "client" ? "(退会済みのクライアント)" : "(退会済みのクリエイター)";
}
