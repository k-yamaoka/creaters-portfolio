"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendExternalNotification } from "@/lib/notify-external";

export type SentMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

export async function sendMessage(
  formData: FormData
): Promise<{ message: SentMessage } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const receiver_id = formData.get("receiver_id") as string;
  const content = (formData.get("content") as string).trim();

  if (!content) return { error: "メッセージを入力してください" };
  if (!receiver_id || receiver_id === user.id) {
    return { error: "送信先が正しくありません" };
  }

  // ロール制限: creator ↔ client のみ許可 (admin は全方向許可)
  const { data: roles } = await supabase
    .from("profiles")
    .select("id, role")
    .in("id", [user.id, receiver_id]);

  const senderRole = roles?.find((r) => r.id === user.id)?.role;
  const receiverRole = roles?.find((r) => r.id === receiver_id)?.role;

  if (!senderRole || !receiverRole) {
    return { error: "送信先が正しくありません" };
  }
  const isAllowedPair =
    senderRole === "admin" ||
    receiverRole === "admin" ||
    (senderRole === "creator" && receiverRole === "client") ||
    (senderRole === "client" && receiverRole === "creator");
  if (!isAllowedPair) {
    return { error: "この相手にはメッセージを送信できません" };
  }

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id,
      content,
    })
    .select("id, sender_id, receiver_id, content, created_at, is_read")
    .single();

  if (error || !inserted) {
    return { error: "メッセージの送信に失敗しました" };
  }

  // メール通知 (best-effort、失敗しても返却は成功扱い)
  if (receiver_id !== user.id) {
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    const senderName = senderProfile?.display_name ?? "ユーザー";
    const snippet = content.length > 280 ? `${content.slice(0, 280)}…` : content;

    await sendExternalNotification({
      userId: receiver_id,
      kind: "message",
      subject: `${senderName} さんから新着メッセージ`,
      body: snippet,
      link: `/dashboard/messages/${user.id}`,
    });
  }

  return { message: inserted as SentMessage };
}

export async function markAsRead(senderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: updated } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("sender_id", senderId)
    .eq("receiver_id", user.id)
    .eq("is_read", false)
    .select("id");

  // (main) レイアウトで計算している未読バッジを再計算させる
  if (updated && updated.length > 0) {
    revalidatePath("/", "layout");
  }
}
