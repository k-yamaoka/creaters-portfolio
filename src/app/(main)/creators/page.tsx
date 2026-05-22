import type { Metadata } from "next";
import { getCreators, getCurrentUser } from "@/lib/supabase/queries";
import { fixMissingThumbnails } from "@/lib/video-thumbnail";
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

  return (
    <CreatorsPageClient
      creators={creators}
      viewerRole={user?.role ?? null}
      viewerCreatorId={user?.creator_profile?.id ?? null}
    />
  );
}
