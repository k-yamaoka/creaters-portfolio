import type { Metadata } from "next";
import { getCreators } from "@/lib/supabase/queries";
import { fixMissingThumbnails } from "@/lib/video-thumbnail";
import { PortfoliosPageClient } from "./portfolios-client";

export const metadata: Metadata = {
  title: "ポートフォリオを見る",
  description:
    "プラットフォーム別にサムネイル一覧から作品を探す。気になる作品からクリエイター詳細へ。",
};

export const revalidate = 60;

export default async function PortfoliosPage() {
  await fixMissingThumbnails();
  const creators = await getCreators();

  return <PortfoliosPageClient creators={creators} />;
}
