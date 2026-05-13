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
 * TikTok oEmbed APIからサムネイルを取得。
 * oembed が 400 を返す場合 (vm.tiktok.com 形式や一部 video URL 等) は、
 * フォールバックとして HTML を取得し og:image を抜き出す。
 */
export async function getTikTokThumbnail(
  videoUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`,
      { next: { revalidate: 86400 } }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail_url) return data.thumbnail_url;
    }
  } catch {
    /* fallthrough */
  }
  return scrapeOgImage(videoUrl);
}

/**
 * Instagram (Reel/Post) のサムネイル取得。
 * Graph API は App Token が必要なので、公開ページの og:image を取得する。
 * 取得したURLは数日〜数週間で失効するため、フィルター時に再取得される。
 */
export async function getInstagramThumbnail(
  videoUrl: string
): Promise<string | null> {
  return scrapeOgImage(videoUrl);
}

/**
 * 任意のURLから og:image を抜き出す共通ヘルパー。
 * - User-Agent を Mozilla に偽装しないとブロックされる
 * - 失敗時は null
 */
async function scrapeOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "ja,en;q=0.9",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
      );
    if (!m) return null;
    // HTMLエンティティを軽くデコード
    return m[1].replace(/&amp;/g, "&");
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

      if (!thumbnail && item.video_platform === "instagram") {
        thumbnail = await getInstagramThumbnail(item.video_url);
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
