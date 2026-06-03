"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
