"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendExternalNotification } from "@/lib/notify-external";

export async function sendMessage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const receiver_id = formData.get("receiver_id") as string;
  const content = (formData.get("content") as string).trim();

  if (!content) return { error: "メッセージを入力してください" };

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id,
    content,
  });

  if (error) {
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

  revalidatePath(`/dashboard/messages/${receiver_id}`);
  return { success: true };
}

export async function markAsRead(senderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("sender_id", senderId)
    .eq("receiver_id", user.id)
    .eq("is_read", false);
}
