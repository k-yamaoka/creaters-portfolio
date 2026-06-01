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
import {
  parseEnum,
  parseText,
  isAllowedVideoUrl,
  isHttpUrl,
  VIDEO_PLATFORMS,
} from "@/lib/validation";

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

  const title = parseText(formData.get("title"), 200);
  if (!title) return { error: "タイトルを入力してください" };
  const description = parseText(formData.get("description"), 2000) ?? "";

  // media_type: 'video' (default, 後方互換) | 'image'
  const media_type_raw = parseText(formData.get("media_type"), 16) ?? "video";
  const media_type: "video" | "image" =
    media_type_raw === "image" ? "image" : "video";

  const genre = parseText(formData.get("genre"), 100);
  const tags = ((formData.get("tags") as string) ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((t) => (t.length > 30 ? t.slice(0, 30) : t));
  const has_publish_permission = !!formData.get("has_publish_permission");

  if (!has_publish_permission) {
    return { error: "掲載許諾の確認にチェックしてください" };
  }

  // ===== 画像アイテムの場合: image_url 必須、video系不要 =====
  if (media_type === "image") {
    const image_url = parseText(formData.get("image_url"), 2000);
    if (!image_url || !isHttpUrl(image_url)) {
      return { error: "画像をアップロードしてください" };
    }

    const { error } = await supabase.from("portfolio_items").insert({
      creator_id: creator.id,
      title,
      description,
      media_type: "image",
      image_url,
      thumbnail_url: image_url, // 画像はそのままサムネとして使う
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

  // ===== 動画アイテム: 既存ロジック =====
  const video_url = parseText(formData.get("video_url"), 2000);
  if (!video_url) return { error: "動画URLを入力してください" };
  if (!isAllowedVideoUrl(video_url)) {
    return { error: "対応プラットフォーム以外の URL は登録できません" };
  }
  const video_platform = parseEnum(
    formData.get("video_platform"),
    VIDEO_PLATFORMS
  );
  if (!video_platform) {
    return { error: "プラットフォームの指定が不正です" };
  }
  const thumbnail_raw = parseText(formData.get("thumbnail_url"), 2000);
  // thumbnail_url は外部 CDN または Supabase Storage の URL のみ通す
  const thumbnail_url =
    thumbnail_raw && isHttpUrl(thumbnail_raw) ? thumbnail_raw : "";

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

  // aspect_ratio (主に mp4 アップロード時にクライアントから渡される)
  const aspect_raw = parseText(formData.get("aspect_ratio"), 16);
  const aspect_ratio: "vertical" | "horizontal" | "square" | null =
    aspect_raw === "vertical" || aspect_raw === "horizontal" || aspect_raw === "square"
      ? aspect_raw
      : null;

  const { error } = await supabase.from("portfolio_items").insert({
    creator_id: creator.id,
    title,
    description,
    media_type: "video",
    video_url,
    video_platform,
    thumbnail_url: finalThumbnail,
    ...(aspect_ratio ? { aspect_ratio } : {}),
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
