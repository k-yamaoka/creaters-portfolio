"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAutoThumbnail, getVimeoThumbnail, getTikTokThumbnail } from "@/lib/video-thumbnail";

export async function addPortfolioItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return { error: "クリエイタープロフィールを先に作成してください" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const video_url = formData.get("video_url") as string;
  const video_platform = formData.get("video_platform") as string;
  const thumbnail_url = formData.get("thumbnail_url") as string;
  const genre = formData.get("genre") as string;
  const tags = (formData.get("tags") as string)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Auto-generate thumbnail if not provided
  let finalThumbnail = thumbnail_url || null;
  if (!finalThumbnail) {
    finalThumbnail = getAutoThumbnail(video_url, video_platform);
  }
  if (!finalThumbnail && video_platform === "vimeo") {
    finalThumbnail = await getVimeoThumbnail(video_url);
  }
  if (!finalThumbnail && video_platform === "tiktok") {
    finalThumbnail = await getTikTokThumbnail(video_url);
  }
  // Instagram requires manual thumbnail - validate
  if (!finalThumbnail && video_platform === "instagram") {
    return { error: "Instagramの動画はサムネイルURLの入力が必須です" };
  }

  const { error } = await supabase.from("portfolio_items").insert({
    creator_id: creator.id,
    title,
    description,
    video_url,
    video_platform,
    thumbnail_url: finalThumbnail,
    genre: genre || null,
    tags,
  });

  if (error) {
    return { error: "ポートフォリオの追加に失敗しました" };
  }

  revalidatePath("/dashboard/portfolio");
  return { success: true };
}

export async function deletePortfolioItem(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify ownership
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) return { error: "権限がありません" };

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", id)
    .eq("creator_id", creator.id);

  if (error) {
    return { error: "削除に失敗しました" };
  }

  revalidatePath("/dashboard/portfolio");
  return { success: true };
}
