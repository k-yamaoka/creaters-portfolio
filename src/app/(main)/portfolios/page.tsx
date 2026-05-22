import type { Metadata } from "next";
import { getCreators } from "@/lib/supabase/queries";
import { fixMissingThumbnails } from "@/lib/video-thumbnail";
import { PortfoliosPageClient } from "./portfolios-client";

export const metadata: Metadata = {
  title: "AI動画ポートフォリオを見る",
  description:
    "Sora / Veo / Runway / Midjourney を使いこなすAIクリエイターのAI動画作品を、プラットフォーム別に一覧で探せます。",
};

export const revalidate = 60;

export default async function PortfoliosPage() {
  await fixMissingThumbnails();
  const creators = await getCreators();

  return <PortfoliosPageClient creators={creators} />;
}
