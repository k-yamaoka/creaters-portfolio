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
  const skills = (formData.get("skills") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const genres = formData.getAll("genres") as string[];

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

  if (existing) {
    // Update
    const { error } = await supabase
      .from("creator_profiles")
      .update({
        bio,
        skills,
        genres,
        location: location || null,
        years_of_experience,
      })
      .eq("user_id", user.id);

    if (error) {
      return { error: "クリエイタープロフィールの更新に失敗しました" };
    }
  } else {
    // Insert
    const { error } = await supabase.from("creator_profiles").insert({
      user_id: user.id,
      bio,
      skills,
      genres,
      location: location || null,
      years_of_experience,
    });

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
