import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { JobsPageClient } from "./jobs-client";

export const metadata: Metadata = {
  title: "AI動画案件を探す",
  description:
    "企業が掲載したAI動画制作の募集案件から、あなたのAIスキルに合った仕事を見つけましょう。",
};

export const revalidate = 60;

export default async function JobsPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `
      *,
      client:client_profiles!jobs_client_id_fkey (
        id,
        company_name,
        industry,
        profiles!client_profiles_user_id_fkey ( display_name )
      )
    `
    )
    .in("status", ["open", "closed"])
    .order("created_at", { ascending: false });

  // ログイン中ユーザーがクリエイターなら、プロフィールを取得して
  // "おすすめ" ソートのスコア計算に使う。
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let viewerProfile: {
    genres: string[];
    strengths: string[];
    video_lengths: string[];
    bio: string;
  } | null = null;
  if (user) {
    const { data: cp } = await supabase
      .from("creator_profiles")
      .select("genres, strengths, video_lengths, bio")
      .eq("user_id", user.id)
      .maybeSingle();
    if (cp) viewerProfile = cp as unknown as NonNullable<typeof viewerProfile>;
  }

  return <JobsPageClient jobs={jobs ?? []} viewerProfile={viewerProfile} />;
}
