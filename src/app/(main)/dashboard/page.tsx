import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import Link from "next/link";
import dynamic from "next/dynamic";

const StripeConnectButton = dynamic(
  () =>
    import("@/components/dashboard/stripe-connect-button").then(
      (m) => m.StripeConnectButton
    )
);

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isCreator = user.role === "creator";
  const isAdmin = user.role === "admin";
  const hasCreatorProfile = !!user.creator_profile;
  const hasClientProfile = !!user.client_profile;

  return (
    <div>
      {/* Welcome card */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
            {user.display_name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              ようこそ、{user.display_name}さん
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {isCreator ? "クリエイター" : isAdmin ? "管理者" : "依頼者"}アカウント
              {isAdmin && (
                <span className="ml-2 rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                  ADMIN
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Admin quick link */}
      {isAdmin && (
        <div className="mt-6 rounded-2xl border-2 border-primary-200 bg-primary-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
              <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[#222]">管理画面</h2>
              <p className="text-sm text-[#828282]">ユーザー管理・取引管理・売上サマリー</p>
            </div>
            <Link href="/admin" className="btn-primary text-sm">
              開く
            </Link>
          </div>
        </div>
      )}

      {/* Creator: prompt to create profile */}
      {isCreator && !hasCreatorProfile && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎬</span>
            <div className="flex-1">
              <h2 className="font-bold text-[#222]">クリエイタープロフィールを作成しましょう</h2>
              <p className="mt-1 text-sm text-[#828282]">プロフィールを設定すると、クライアントからの検索結果に表示されます</p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="btn-primary mt-4 inline-block text-sm">
            プロフィールを設定する
          </Link>
        </div>
      )}

      {/* Client: prompt to set company info */}
      {!isCreator && !isAdmin && !hasClientProfile && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <div className="flex-1">
              <h2 className="font-bold text-[#222]">企業情報を登録しましょう</h2>
              <p className="mt-1 text-sm text-[#828282]">企業情報を登録すると、クリエイターへの依頼がスムーズになります</p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="btn-primary mt-4 inline-block text-sm">
            企業情報を登録する
          </Link>
        </div>
      )}

      {/* Creator stats */}
      {isCreator && hasCreatorProfile && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#828282]">評価</p>
              <span className="text-2xl">
                {user.creator_profile!.rating >= 2.5 ? "😊" : user.creator_profile!.rating >= 1.5 ? "😐" : "😢"}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#222]">
              {user.creator_profile!.rating >= 2.5 ? "満足" : user.creator_profile!.rating >= 1.5 ? "普通" : "不満"}
            </p>
            <p className="mt-1 text-xs text-[#BDBDBD]">
              {user.creator_profile!.review_count}件のレビュー
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#828282]">レビュー数</p>
              <svg className="h-5 w-5 text-[#BDBDBD]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#222]">
              {user.creator_profile!.review_count}
              <span className="ml-1 text-sm font-normal text-[#BDBDBD]">件</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#828282]">経験年数</p>
              <svg className="h-5 w-5 text-[#BDBDBD]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#222]">
              {user.creator_profile!.years_of_experience}
              <span className="ml-1 text-sm font-normal text-[#BDBDBD]">年</span>
            </p>
          </div>
        </div>
      )}

      {/* Stripe Connect for creators */}
      {isCreator && hasCreatorProfile && (
        <div className="mt-6">
          <StripeConnectButton />
        </div>
      )}

      {/* Client stats */}
      {!isCreator && !isAdmin && hasClientProfile && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <p className="text-sm text-[#828282]">会社名</p>
            <p className="mt-1 text-lg font-bold text-[#222]">
              {user.client_profile!.company_name || "未設定"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <p className="text-sm text-[#828282]">業種</p>
            <p className="mt-1 text-lg font-bold text-[#222]">
              {user.client_profile!.industry || "未設定"}
            </p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <h2 className="mt-8 mb-4 text-lg font-bold text-[#222]">クイックアクセス</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isCreator && (
          <>
            <Link
              href="/dashboard/portfolio"
              className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
                <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[#222]">ポートフォリオ管理</h3>
                <p className="mt-0.5 text-sm text-[#828282]">作品の追加・編集・削除</p>
              </div>
            </Link>
            <Link
              href="/dashboard/packages"
              className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
                <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[#222]">料金プラン管理</h3>
                <p className="mt-0.5 text-sm text-[#828282]">サービスパッケージの設定</p>
              </div>
            </Link>
            <Link
              href="/dashboard/applications"
              className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
                <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[#222]">応募済み案件</h3>
                <p className="mt-0.5 text-sm text-[#828282]">応募した案件の状況確認</p>
              </div>
            </Link>
          </>
        )}
        {!isCreator && !isAdmin && (
          <>
            <Link
              href="/creators"
              className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
                <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[#222]">クリエイターを探す</h3>
                <p className="mt-0.5 text-sm text-[#828282]">最適なクリエイターを検索</p>
              </div>
            </Link>
            <Link
              href="/dashboard/jobs"
              className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
                <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[#222]">案件を掲載する</h3>
                <p className="mt-0.5 text-sm text-[#828282]">新しい募集案件を作成</p>
              </div>
            </Link>
          </>
        )}
        <Link
          href="/dashboard/orders"
          className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
            <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[#222]">取引管理</h3>
            <p className="mt-0.5 text-sm text-[#828282]">進行中の取引を確認</p>
          </div>
        </Link>
        <Link
          href="/dashboard/profile"
          className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
            <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[#222]">
              {isCreator ? "プロフィール編集" : "企業情報編集"}
            </h3>
            <p className="mt-0.5 text-sm text-[#828282]">基本情報の確認・更新</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
