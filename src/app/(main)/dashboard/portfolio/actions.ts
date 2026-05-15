"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAutoThumbnail,
  getVimeoThumbnail,
  getTikTokThumbnail,
  getInstagramThumbnail,
} from "@/lib/video-thumbnail";

/**
 * Platforms where auto-fetch is unreliable and we should require a manual thumbnail.
 * Even though we try oembed/og:image as a best effort, those endpoints often fail
 * or return tokens that expire shortly, so the safer UX is to make uploads mandatory.
 */
const PLATFORMS_REQUIRING_MANUAL_THUMB = new Set(["tiktok", "instagram"]);

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
  const has_publish_permission = !!formData.get("has_publish_permission");

  if (!has_publish_permission) {
    return { error: "掲載許諾の確認にチェックしてください" };
  }

  // Manual-required platforms: thumbnail must be provided by the user.
  if (
    PLATFORMS_REQUIRING_MANUAL_THUMB.has(video_platform) &&
    !thumbnail_url
  ) {
    return {
      error:
        "TikTok / Instagram は自動取得が不安定なため、サムネイル画像をアップロードしてください。",
    };
  }

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
  if (!finalThumbnail && video_platform === "instagram") {
    finalThumbnail = await getInstagramThumbnail(video_url);
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
    has_publish_permission: true,
  });

  if (error) {
    return { error: "ポートフォリオの追加に失敗しました" };
  }

  revalidatePath("/dashboard/portfolio");
  return { success: true };
}

/**
 * 既存ポートフォリオの thumbnail_url を差し替える。
 * 自動取得が失敗してサムネ NULL のままになっているアイテムや、
 * 期限切れ CDN URL を再アップロード画像で上書きしたいケース向け。
 */
export async function updatePortfolioThumbnail(
  id: string,
  thumbnailUrl: string
) {
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

  if (!creator) return { error: "権限がありません" };

  if (!thumbnailUrl) {
    return { error: "サムネイル画像のURLが空です" };
  }

  const { error } = await supabase
    .from("portfolio_items")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("id", id)
    .eq("creator_id", creator.id);

  if (error) {
    return { error: "サムネイルの更新に失敗しました" };
  }

  revalidatePath("/dashboard/portfolio");
  return { success: true };
}

/**
 * クリエイター一覧のサムネイル行に出す作品を選ぶための featured フラグ切り替え。
 * 上限(4件)はDBトリガで保証しているので、ここではエラーメッセージだけ整形する。
 */
export async function togglePortfolioFeatured(id: string, next: boolean) {
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

  if (!creator) return { error: "権限がありません" };

  const { error } = await supabase
    .from("portfolio_items")
    .update({ is_featured: next })
    .eq("id", id)
    .eq("creator_id", creator.id);

  if (error) {
    if (error.message?.includes("最大4件")) {
      return { error: "表示できる作品は最大4件までです" };
    }
    return { error: "表示設定の更新に失敗しました" };
  }

  revalidatePath("/dashboard/portfolio");
  revalidatePath("/creators");
  return { success: true };
}

export async function deletePortfolioItem(id: string) {
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
