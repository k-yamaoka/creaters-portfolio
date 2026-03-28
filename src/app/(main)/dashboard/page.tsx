import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isCreator = user.role === "creator";
  const hasCreatorProfile = !!user.creator_profile;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">ダッシュボード</h1>
      <p className="mt-2 text-sm text-[#828282]">
        ようこそ、{user.display_name}さん
      </p>

      {isCreator && !hasCreatorProfile && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-6">
          <h2 className="text-lg font-bold text-[#222]">
            クリエイタープロフィールを作成しましょう
          </h2>
          <p className="mt-2 text-sm text-[#828282]">
            プロフィールを設定すると、クライアントからの検索結果に表示されるようになります。
          </p>
          <Link href="/dashboard/profile" className="btn-primary mt-4 inline-block text-sm">
            プロフィールを設定する
          </Link>
        </div>
      )}

      {/* Quick stats for creators */}
      {isCreator && hasCreatorProfile && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <p className="text-sm text-[#828282]">評価</p>
            <p className="mt-1 text-2xl font-bold text-[#222]">
              {user.creator_profile!.rating}
              <span className="ml-1 text-sm font-normal text-[#BDBDBD]">
                / 5.0
              </span>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <p className="text-sm text-[#828282]">レビュー数</p>
            <p className="mt-1 text-2xl font-bold text-[#222]">
              {user.creator_profile!.review_count}
              <span className="ml-1 text-sm font-normal text-[#BDBDBD]">件</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <p className="text-sm text-[#828282]">経験年数</p>
            <p className="mt-1 text-2xl font-bold text-[#222]">
              {user.creator_profile!.years_of_experience}
              <span className="ml-1 text-sm font-normal text-[#BDBDBD]">年</span>
            </p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isCreator && (
          <>
            <Link
              href="/dashboard/portfolio"
              className="rounded-2xl bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <h3 className="font-bold text-[#222]">ポートフォリオ管理</h3>
              <p className="mt-1 text-sm text-[#828282]">
                作品の追加・編集・削除
              </p>
            </Link>
            <Link
              href="/dashboard/packages"
              className="rounded-2xl bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <h3 className="font-bold text-[#222]">料金プラン管理</h3>
              <p className="mt-1 text-sm text-[#828282]">
                サービスパッケージの設定
              </p>
            </Link>
          </>
        )}
        <Link
          href="/dashboard/profile"
          className="rounded-2xl bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <h3 className="font-bold text-[#222]">
            {isCreator ? "プロフィール編集" : "企業情報編集"}
          </h3>
          <p className="mt-1 text-sm text-[#828282]">
            基本情報の確認・更新
          </p>
        </Link>
      </div>
    </div>
  );
}
