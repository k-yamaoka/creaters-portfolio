"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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

  const userEmail = user.email?.toLowerCase() ?? null;

  // 1. 退会済みメールリストに登録 (同じ Google/LINE で再ログインさせない)
  //    admin client が利用できないケースもあるので try で防御。
  let adminAvailable = false;
  try {
    const admin = getSupabaseAdmin();
    adminAvailable = true;
    if (userEmail) {
      await admin
        .from("deleted_account_emails")
        .upsert(
          { email_lower: userEmail, reason: "user_initiated" },
          { onConflict: "email_lower" }
        );
    }

    // 2. auth.users を物理削除 (FK ON DELETE CASCADE で profiles 以下も消える)
    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      // 物理削除失敗時のフォールバック
      await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", user.id);
      await supabase.auth.signOut();
      return {
        error:
          "アカウントの削除に失敗しました。サポートにお問い合わせください。",
      };
    }
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY 未設定など、admin client 自体が
    // 動かないケース。最低限 soft delete + signOut まではやり切る。
    await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", user.id);
    await supabase.auth.signOut();
    if (!adminAvailable) {
      return {
        error:
          "管理権限が設定されていないため完全削除できませんでした。サポートに連絡してください。",
      };
    }
    return {
      error: "アカウントの削除に失敗しました。サポートにお問い合わせください。",
    };
  }

  // 3. セッション cookie をクリーンアップ
  await supabase.auth.signOut();

  redirect("/");
}
