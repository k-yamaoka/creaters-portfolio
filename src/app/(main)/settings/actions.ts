"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (newPassword.length < 6) {
    return { error: "パスワードは6文字以上で設定してください" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "パスワードが一致しません" };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: "パスワードの更新に失敗しました" };
  }

  return { success: "パスワードを更新しました" };
}

export async function updateEmail(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const newEmail = formData.get("new_email") as string;

  if (!newEmail || !newEmail.includes("@")) {
    return { error: "有効なメールアドレスを入力してください" };
  }

  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    return { error: "メールアドレスの更新に失敗しました" };
  }

  // Also update profiles table
  await supabase
    .from("profiles")
    .update({ email: newEmail })
    .eq("id", user.id);

  return { success: "確認メールを送信しました。メール内のリンクをクリックして変更を完了してください。" };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Deactivate profile instead of hard delete
  await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", user.id);

  // Sign out
  await supabase.auth.signOut();

  redirect("/");
}
