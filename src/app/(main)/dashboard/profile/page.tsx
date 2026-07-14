import { redirect } from "next/navigation";
import { getCreatorById, getCurrentUser } from "@/lib/supabase/queries";
import { ProfileForm } from "./profile-form";
import { ClientForm } from "./client-form";
import { ResumeDownloadButton } from "@/components/resume/ResumeDownloadButton";
import type { ResumeData } from "@/components/resume/types";
import { EarlyMemberBadge } from "@/components/creator/early-member-badge";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isCreator = user.role === "creator";

  // 2026-06-26: 職務経歴書 PDF 用にクリエイター本人の作品一覧を取得。
  // CurrentUser には portfolio_items が含まれないため getCreatorById で
  // 再取得する。creator_profile が無いユーザーには PDF UI を出さない。
  let resumeData: ResumeData | null = null;
  if (isCreator && user.creator_profile) {
    const creator = await getCreatorById(user.creator_profile.id);
    if (creator) {
      resumeData = {
        displayName: user.display_name,
        email: user.email ?? null,
        avatarUrl: user.avatar_url ?? null,
        bio: user.creator_profile.bio ?? "",
        location: user.creator_profile.location ?? null,
        yearsOfExperience: user.creator_profile.years_of_experience ?? 0,
        genres: user.creator_profile.genres ?? [],
        strengths: user.creator_profile.strengths ?? [],
        aiTools: user.creator_profile.ai_tools ?? [],
        videoLengths: user.creator_profile.video_lengths ?? [],
        socialLinks: user.creator_profile.social_links ?? {},
        works: creator.portfolio_items.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          thumbnail_url: p.thumbnail_url ?? null,
          video_url: p.video_url ?? null,
          external_url: p.external_url ?? null,
          aspect_ratio: p.aspect_ratio,
          tags: p.tags ?? [],
          genre: p.genre ?? null,
          used_ai_tools: p.used_ai_tools ?? [],
          // 00062 migration 後に挿入される動画フレーム URL 配列。
          // 旧データ / 動画じゃない作品では未設定 (= 空配列扱い)
          frame_urls:
            (p as { frame_urls?: string[] | null }).frame_urls ?? [],
        })),
      };
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[#222]">
          {isCreator ? "プロフィール編集" : "企業情報編集"}
        </h1>
        {/* 00064: アーリーメンバーはページ最上部で存在感のあるバッジを見せる */}
        {isCreator && user.creator_profile?.is_early_member && (
          <EarlyMemberBadge variant="compact" />
        )}
      </div>
      <p className="mt-2 text-sm text-[#828282]">
        {isCreator
          ? "公開プロフィールの情報を編集します"
          : "企業情報を登録・更新します"}
      </p>

      {/* 職務経歴書 PDF ダウンロード (クリエイターのみ) */}
      {isCreator && resumeData && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900">
            職務経歴書 (PDF) ダウンロード
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            現在のプロフィールと公開作品を 1 つの PDF にまとめて出力します。クライアント企業への提案資料に。
          </p>
          <div className="mt-4">
            <ResumeDownloadButton data={resumeData} />
          </div>
        </div>
      )}

      {/* 2026-06-15: カバー画像エディタはユーザー判断で撤去。
          アバター画像はダッシュボードの BasicInfoEditor で編集する。 */}
      {isCreator && user.creator_profile && (
        <p className="mt-6 text-xs text-[#828282]">
          ※ プロフィール画像 (アバター) はダッシュボードの「基本情報」エリアから編集できます。
        </p>
      )}

      <div className="mt-6">
        {isCreator ? <ProfileForm user={user} /> : <ClientForm user={user} />}
      </div>
    </div>
  );
}
