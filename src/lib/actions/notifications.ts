"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * ヘッダのベルを開いた瞬間に呼び、自分宛の未読通知をまとめて既読化する。
 */
export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  // ヘッダはルートレイアウトで取得するためレイアウト全体を再評価
  revalidatePath("/", "layout");
}

/**
 * 特定の1件だけ既読化する用 (リンクをクリックした際の保険)。
 */
export async function markNotificationAsRead(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/", "layout");
}
