import type { Metadata } from "next";
import { getCreators, getCurrentUser } from "@/lib/supabase/queries";
import { fixMissingThumbnails } from "@/lib/video-thumbnail";
import { CreatorsPageClient } from "./creators-client";

export const metadata: Metadata = {
  title: "クリエイターを探す",
  description:
    "ジャンル・予算・実績で映像クリエイターを検索。ポートフォリオを見て最適なクリエイターを見つけましょう。",
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
