"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * ダッシュボード上部の「基本情報」(表示名 + アバター) のみを更新するアクション。
 *
 * - 表示名: 1〜40 文字。空文字は弾く。
 * - avatar_url: アップロード後のクライアントが Storage の public URL を渡す。
 *   "" を渡すとアバターを解除 (null 保存)。
 * - profiles テーブルのみ更新 (creator_profiles などは触らない)。
 *
 * 楽観更新で UI が即時反映されるよう、エラー時は { error } を返す。
 * 成功時は呼び出し元 path を revalidate して /dashboard と /creators の
 * SSR データを最新化する。
 */
export async function updateBasicInfo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const rawName = String(formData.get("display_name") ?? "").trim();
  if (!rawName) return { error: "表示名を入力してください" };
  if (rawName.length > 40) return { error: "表示名は 40 文字以内で入力してください" };

  // avatar_url は signed-URL アップロード後の public URL を受け取る形にする。
  // "__keep__" を渡すと既存値を維持、"" を渡すと null 化 (アバター解除)。
  const rawAvatar = formData.get("avatar_url");
  const avatarParam =
    typeof rawAvatar === "string" ? rawAvatar : undefined;

  const updates: Record<string, unknown> = { display_name: rawName };
  if (avatarParam !== undefined && avatarParam !== "__keep__") {
    // 簡易ホワイトリスト: 自社 Supabase Storage の URL のみ受け付ける
    if (avatarParam === "") {
      updates.avatar_url = null;
    } else if (
      /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/avatars\//.test(
        avatarParam
      )
    ) {
      updates.avatar_url = avatarParam;
    } else {
      return { error: "アバター画像 URL の形式が不正です" };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { error: "基本情報の更新に失敗しました" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { ok: true as const };
}



export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const display_name = formData.get("display_name") as string;
  const bio = formData.get("bio") as string;
  const location = formData.get("location") as string;
  const years_of_experience = parseInt(
    (formData.get("years_of_experience") as string) || "0"
  );
  const genres = formData.getAll("genres") as string[];
  const video_lengths = formData.getAll("video_lengths") as string[];
  const strengths_raw = formData.getAll("strengths") as string[];
  // 強みは最大2つまで(DB制約と二重に防御)
  if (strengths_raw.length > 2) {
    return { error: "強みは最大2つまで選択できます" };
  }
  const strengths = strengths_raw.slice(0, 2);

  // Update profile (display_name)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name })
    .eq("id", user.id);

  if (profileError) {
    return { error: "プロフィールの更新に失敗しました" };
  }

  // Check if creator_profile exists
  const { data: existing } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const payload = {
    bio,
    video_lengths,
    strengths,
    // ai_tools は UI から廃止 (顧客にとって不要 + 流動性が高い)。
    // DB カラムは互換のため残し、新規入力では常に空配列で上書きする。
    ai_tools: [] as string[],
    genres,
    location: location || null,
    years_of_experience,
  };

  if (existing) {
    const { error } = await supabase
      .from("creator_profiles")
      .update(payload)
      .eq("user_id", user.id);

    if (error) {
      return { error: "クリエイタープロフィールの更新に失敗しました" };
    }
  } else {
    const { error } = await supabase
      .from("creator_profiles")
      .insert({ user_id: user.id, ...payload });

    if (error) {
      return { error: "クリエイタープロフィールの作成に失敗しました" };
    }
  }

  redirect("/dashboard");
}

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const display_name = formData.get("display_name") as string;
  const company_name = formData.get("company_name") as string;
  const company_url = formData.get("company_url") as string;
  const industry = formData.get("industry") as string;

  // Update profile (display_name)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name })
    .eq("id", user.id);

  if (profileError) {
    return { error: "プロフィールの更新に失敗しました" };
  }

  // Check if client_profile exists
  const { data: existing } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const clientData = {
    company_name: company_name || null,
    company_url: company_url || null,
    industry: industry || null,
  };

  if (existing) {
    const { error } = await supabase
      .from("client_profiles")
      .update(clientData)
      .eq("user_id", user.id);

    if (error) {
      return { error: "企業情報の更新に失敗しました" };
    }
  } else {
    const { error } = await supabase.from("client_profiles").insert({
      user_id: user.id,
      ...clientData,
    });

    if (error) {
      return { error: "企業情報の作成に失敗しました" };
    }
  }

  redirect("/dashboard");
}
