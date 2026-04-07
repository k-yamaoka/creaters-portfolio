import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAutoThumbnail, getVimeoThumbnail } from "@/lib/video-thumbnail";

// Fix missing thumbnails for existing portfolio items
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get items without thumbnails
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id, video_url, video_platform, thumbnail_url, creator_id")
    .is("thumbnail_url", null);

  if (!items || items.length === 0) {
    return NextResponse.json({ message: "No items to fix", fixed: 0 });
  }

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

  return NextResponse.json({ message: `Fixed ${fixed} items`, fixed });
}
