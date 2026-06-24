import type { Metadata } from "next";
import { getCreators } from "@/lib/supabase/queries";
import { fixMissingThumbnails } from "@/lib/video-thumbnail";
import { extractHeroVideos } from "@/lib/hero-videos";
import { createClient } from "@/lib/supabase/server";
import { PortfoliosPageClient } from "./portfolios-client";

export const metadata: Metadata = {
  title: "AI動画ポートフォリオを見る",
  description:
    "Sora / Veo / Runway / Midjourney を使いこなすAIクリエイターのAI動画作品を、プラットフォーム別に一覧で探せます。",
};

// いいね状態が一覧に反映されるよう動的レンダリング
export const dynamic = "force-dynamic";

export default async function PortfoliosPage() {
  await fixMissingThumbnails();
  const creators = await getCreators();

  // 現在のユーザーが「いいね」した portfolio_item_id 一覧
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let likedIds: string[] = [];
  if (user) {
    const { data } = await supabase
      .from("portfolio_likes")
      .select("portfolio_item_id")
      .eq("user_id", user.id);
    likedIds = (data ?? []).map((r) => r.portfolio_item_id as string);
  }

  const heroVideos = extractHeroVideos(creators);

  return (
    <PortfoliosPageClient
      creators={creators}
      likedIds={likedIds}
      isAuthed={!!user}
      heroVideos={heroVideos}
    />
  );
}
