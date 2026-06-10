"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 応募済み案件 (job_applications) を自分 (クリエイター) の一覧から非表示にする。
 *
 * - 完全削除ではなく archived_by_creator_at にタイムスタンプを入れる soft hide
 * - 相手 (クライアント) の応募者一覧では引き続き見える
 * - 認可: 自分が応募したエントリ (creator_id が自分の creator_profile.id) のみ
 */
export async function hideApplication(applicationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: cp } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!cp) return { error: "権限がありません" };

  const { error } = await supabase
    .from("job_applications")
    .update({ archived_by_creator_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("creator_id", cp.id);

  if (error) return { error: "削除に失敗しました" };

  revalidatePath("/dashboard/applications");
  return { ok: true as const };
}

/**
 * 取引 (orders) を自分の一覧から非表示にする。
 *
 * - クリエイターの場合は archived_by_creator_at、クライアントは archived_by_client_at
 * - 相手側からは引き続き見える soft hide
 * - 認可: 自分が当事者である取引のみ操作可
 */
export async function hideOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // ロール判定 (creator か client か) + 当事者チェックを 1 クエリで
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id,
       creator:creator_profiles!orders_creator_id_fkey ( user_id ),
       client:client_profiles!orders_client_id_fkey ( user_id )`
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "取引が見つかりません" };

  const creatorUserId =
    (order.creator as unknown as { user_id: string } | null)?.user_id ?? null;
  const clientUserId =
    (order.client as unknown as { user_id: string } | null)?.user_id ?? null;

  const isCreator = creatorUserId === user.id;
  const isClient = clientUserId === user.id;
  if (!isCreator && !isClient) return { error: "権限がありません" };

  const updates: Record<string, string> = {};
  const now = new Date().toISOString();
  if (isCreator) updates.archived_by_creator_at = now;
  if (isClient) updates.archived_by_client_at = now;

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);
  if (error) return { error: "削除に失敗しました" };

  revalidatePath("/dashboard/orders");
  return { ok: true as const };
}
