import { createClient } from "@/lib/supabase/server";

/**
 * YouTube/YouTube Shortsの動画URLからサムネイルURLを自動取得
 */
export function getAutoThumbnail(
  videoUrl: string,
  platform: string
): string | null {
  if (platform === "youtube" || platform === "youtube_short") {
    const match = videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  }

  if (platform === "vimeo") {
    return null;
  }

  return null;
}

/**
 * Vimeo oEmbed APIからサムネイルを取得
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
 * TikTok oEmbed APIからサムネイルを取得
 */
export async function getTikTokThumbnail(
  videoUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`,
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
 * サムネイルがnullのポートフォリオを一括修正
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

      if (!thumbnail && item.video_platform === "tiktok") {
        thumbnail = await getTikTokThumbnail(item.video_url);
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
