import type { Metadata } from "next";
import { getCreators } from "@/lib/supabase/queries";
import { fixMissingThumbnails } from "@/lib/video-thumbnail";
import { CreatorsPageClient } from "./creators-client";

export const metadata: Metadata = {
  title: "クリエイターを探す",
  description:
    "ジャンル・予算・実績で映像クリエイターを検索。ポートフォリオを見て最適なクリエイターを見つけましょう。",
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function CreatorsPage() {
  // Auto-fix missing thumbnails on page load
  await fixMissingThumbnails();

  const creators = await getCreators();

  return <CreatorsPageClient creators={creators} />;
}
