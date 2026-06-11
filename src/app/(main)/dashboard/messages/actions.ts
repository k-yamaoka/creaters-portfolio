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
  attachment_url: string | null;
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
  const content = ((formData.get("content") as string | null) ?? "").trim();
  const attachmentRaw = (formData.get("attachment_url") as string | null) ?? "";
  // 信頼できる URL のみ受け付ける (XSS / オープンリダイレクト防止):
  // 自前バケットの公開 URL は NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/public/portfolio-videos/...
  // の形になる。サーバー側でこのプレフィックスを検証する。
  const attachment_url = (() => {
    const trimmed = attachmentRaw.trim();
    if (!trimmed) return null;
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const expectedPrefix = supaUrl
      ? `${supaUrl}/storage/v1/object/public/portfolio-videos/messages/`
      : "";
    if (!expectedPrefix || !trimmed.startsWith(expectedPrefix)) {
      return null;
    }
    return trimmed;
  })();

  // 本文か添付のいずれかが必要
  if (!content && !attachment_url) {
    return { error: "メッセージを入力してください" };
  }
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
      attachment_url,
    })
    .select(
      "id, sender_id, receiver_id, content, attachment_url, created_at, is_read"
    )
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
    const baseBody = content || "(画像が送信されました)";
    const snippet = baseBody.length > 280 ? `${baseBody.slice(0, 280)}…` : baseBody;

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

/**
 * 自分が「送信側」または「受信側」のいずれかであるメッセージを削除する。
 *
 * - 受信側として削除する場合: 自分のスレッドからは消えるが、相手側の履歴は残す
 *   が、いま messages テーブルは soft delete を持たないため、完全削除のみ。
 *   将来 archived_by_<role>_at を追加して soft hide に切替える余地あり。
 * - 自分のメッセージでない場合 (= 受信したもの) も、相手の同意なく自分の画面
 *   から消したい需要があるので削除を許可。これは「未読を放置すると残る」と
 *   ユーザーが訴えた問題への対処。
 * - 監査ログには残らない。ユーザー要望 (自分の画面の整理) を優先する。
 */
export async function deleteMessage(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // sender / receiver のいずれかが自分であることを保証して削除
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) return { error: "メッセージの削除に失敗しました" };

  revalidatePath("/dashboard/messages", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
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
