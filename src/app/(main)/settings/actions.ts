"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";

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
      // upsert で deleted_at を明示的に上書きし、再退会した場合に
      // 30 日の猶予クロックがリセットされるようにする
      await admin
        .from("deleted_account_emails")
        .upsert(
          {
            email_lower: userEmail,
            reason: "user_initiated",
            deleted_at: new Date().toISOString(),
          },
          { onConflict: "email_lower" }
        );
    }

    // 2. 退会前に profile snapshot を archived_profiles に書き残す。
    //    orders.archived_client_user_id / archived_creator_user_id と
    //    アプリ層で結合させて「(退会済み: 山田太郎)」のような表示に使う。
    const { data: profileSnapshot } = await admin
      .from("profiles")
      .select("id, display_name, role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileSnapshot) {
      const emailHash = userEmail
        ? createHash("sha256").update(userEmail).digest("hex")
        : null;
      await admin
        .from("archived_profiles")
        .upsert(
          {
            original_user_id: profileSnapshot.id,
            display_name: profileSnapshot.display_name,
            role: profileSnapshot.role,
            email_hash: emailHash,
          },
          { onConflict: "original_user_id" }
        );
    }

    // 3. orders に archived_*_user_id を書き戻してから auth.users を消す。
    //    FK SET NULL で client_id / creator_id は NULL になるが、
    //    どのユーザーだったかは archived_*_user_id 列で追える。
    if (profileSnapshot) {
      if (profileSnapshot.role === "client") {
        const { data: cp } = await admin
          .from("client_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cp) {
          await admin
            .from("orders")
            .update({ archived_client_user_id: user.id })
            .eq("client_id", cp.id);
        }
      } else if (profileSnapshot.role === "creator") {
        const { data: crp } = await admin
          .from("creator_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (crp) {
          await admin
            .from("orders")
            .update({ archived_creator_user_id: user.id })
            .eq("creator_id", crp.id);
        }
      }
    }

    // 4. auth.users を物理削除 → FK SET NULL で orders/messages 等は残る
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
