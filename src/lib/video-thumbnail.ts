import { createClient } from "@/lib/supabase/server";

/**
 * YouTube/Vimeoの動画URLからサムネイルURLを自動取得
 */
export function getAutoThumbnail(
  videoUrl: string,
  platform: string
): string | null {
  if (platform === "youtube") {
    const match = videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) {
      // maxresdefault > hqdefault > mqdefault
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  }

  if (platform === "vimeo") {
    // Vimeo requires API call, return null for now
    // Will be resolved via oEmbed API
    return null;
  }

  return null;
}

/**
 * Vimeo oEmbed APIからサムネイルを取得（サーバーサイド）
 */
export async function getVimeoThumbnail(
  videoUrl: string
): Promise<string | null> {
  try {
    const match = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (!match) return null;

    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${match[1]}`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.thumbnail_url || null;
  } catch {
    return null;
  }
}

/**
 * サムネイルがnullのポートフォリオを一括修正（サーバーサイド）
 */
export async function fixMissingThumbnails(): Promise<number> {
  try {
    const supabase = await createClient();

    const { data: items } = await supabase
      .from("portfolio_items")
      .select("id, video_url, video_platform")
      .is("thumbnail_url", null);

    if (!items || items.length === 0) return 0;

    let fixed = 0;
    for (const item of items) {
      let thumbnail = getAutoThumbnail(item.video_url, item.video_platform);

      if (!thumbnail && item.video_platform === "vimeo") {
        thumbnail = await getVimeoThumbnail(item.video_url);
      }

      if (thumbnail) {
        await supabase
          .from("portfolio_items")
          .update({ thumbnail_url: thumbnail })
          .eq("id", item.id);
        fixed++;
      }
    }

    return fixed;
  } catch {
    return 0;
  }
}
