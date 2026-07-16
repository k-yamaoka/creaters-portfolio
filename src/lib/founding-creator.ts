/**
 * ファウンディング クリエイター (先着 50 名) 管理ユーティリティ。
 * (D-1 実装 2026-07-15)
 *
 * ビジネス要件:
 *   - 先着 50 名を「創設メンバー」として優遇
 *   - 特典:
 *     ① クリエイター永久手数料 0% ([[creator-fee]] resolveCreatorFeeRate)
 *     ② 検索・一覧での上位表示優先枠 (getCreators sort key に採用)
 *     ③ 運営からの案件優先紹介 (UI バッジ + 管理画面フィルタ)
 *   - 50 名到達で新規特典付与を終了 (DB trigger 00069 で auto-flag は打ち止め)
 *
 * SLOT_LIMIT を変更する際は supabase/migrations/00069 の CHECK / VIEW も
 * 同時に更新すること。
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const FOUNDING_SLOT_LIMIT = 50;

export type FoundingStats = {
  slotLimit: number;
  filled: number;
  remaining: number;
  isFull: boolean;
};

/**
 * 現在のファウンディング枠の充填状況を取得する。
 * founding_creator_stats view (00069) を優先し、失敗時は直接カウントに
 * フォールバックする。
 */
export async function getFoundingStats(
  supabase: SupabaseClient
): Promise<FoundingStats> {
  const { data, error } = await supabase
    .from("founding_creator_stats")
    .select("slot_limit, filled, remaining, is_full")
    .maybeSingle();

  if (!error && data) {
    return {
      slotLimit: data.slot_limit ?? FOUNDING_SLOT_LIMIT,
      filled: data.filled ?? 0,
      remaining: data.remaining ?? FOUNDING_SLOT_LIMIT,
      isFull: !!data.is_full,
    };
  }

  // Fallback: view が無い / 権限エラー等
  const { count } = await supabase
    .from("creator_profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_early_member", true);
  const filled = count ?? 0;
  return {
    slotLimit: FOUNDING_SLOT_LIMIT,
    filled,
    remaining: Math.max(0, FOUNDING_SLOT_LIMIT - filled),
    isFull: filled >= FOUNDING_SLOT_LIMIT,
  };
}
