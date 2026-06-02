import type { Metadata } from "next";
import { getCreators, getCurrentUser } from "@/lib/supabase/queries";
import { fixMissingThumbnails } from "@/lib/video-thumbnail";
import { createClient } from "@/lib/supabase/server";
import { CreatorsPageClient } from "./creators-client";

export const metadata: Metadata = {
  title: "AIクリエイターを探す",
  description:
    "Sora・Veo・Runway・Midjourneyを使いこなすAIクリエイターを、ツール・ジャンル・料金で検索。最適なクリエイターを見つけましょう。",
};

// 役割で表示が変わるため revalidate キャッシュは外す
export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  // Auto-fix missing thumbnails on page load
  await fixMissingThumbnails();

  const [creators, user] = await Promise.all([
    getCreators(),
    getCurrentUser(),
  ]);

  // 現在ユーザーが「いいね」した portfolio_item_id 一覧 (サムネのハート反映用)
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let likedIds: string[] = [];
  if (authUser) {
    const { data } = await supabase
      .from("portfolio_likes")
      .select("portfolio_item_id")
      .eq("user_id", authUser.id);
    likedIds = (data ?? []).map((r) => r.portfolio_item_id as string);
  }

  return (
    <CreatorsPageClient
      creators={creators}
      viewerRole={user?.role ?? null}
      viewerCreatorId={user?.creator_profile?.id ?? null}
      likedIds={likedIds}
      isAuthed={!!authUser}
    />
  );
}
