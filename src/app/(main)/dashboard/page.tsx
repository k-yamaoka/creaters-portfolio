import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BasicInfoEditor } from "@/components/dashboard/basic-info-editor";
import { DashboardAlertsBar } from "@/components/dashboard/alerts-bar";
import { DashboardRevenueCard } from "@/components/dashboard/revenue-card";

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

  const roleLabel =
    (isCreator ? "クリエイター" : isAdmin ? "管理者" : "依頼者") + "アカウント";

  const supabase = await createClient();

  // 総いいね数 = このクリエイターの全 portfolio_items の like_count 合計。
  // creator_profile を持つ場合のみ実行。
  let totalLikes = 0;
  if (isCreator && hasCreatorProfile) {
    const { data: rows } = await supabase
      .from("portfolio_items")
      .select("like_count")
      .eq("creator_id", user.creator_profile!.id);
    totalLikes = (rows ?? []).reduce(
      (sum, r) => sum + ((r as { like_count: number | null }).like_count ?? 0),
      0
    );
  }

  // ===== ① 要対応アラート =====
  // 未読メッセージ数 / 未読通知数 / 進行中取引 / あなたの対応待ち
  const [unreadMessagesQ, unreadNotificationsQ] = await Promise.all([
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);
  const unreadMessages = unreadMessagesQ.count ?? 0;
  const unreadNotifications = unreadNotificationsQ.count ?? 0;

  // 進行中取引 (cancelled / delivered 以外)
  let activeOrders = 0;
  let awaitingMyAction = 0;
  if ((isCreator && hasCreatorProfile) || hasClientProfile) {
    let q = supabase
      .from("orders")
      .select("id, status, archived_by_creator_at, archived_by_client_at")
      .not("status", "in", "(delivered,cancelled)");
    if (isCreator && hasCreatorProfile) {
      q = q
        .eq("creator_id", user.creator_profile!.id)
        .is("archived_by_creator_at", null);
    } else {
      q = q
        .eq("client_id", user.client_profile!.id)
        .is("archived_by_client_at", null);
    }
    const { data: openOrders } = await q;
    activeOrders = openOrders?.length ?? 0;
    // 「自分のターン」=各 status で次に動くべき側。
    //   consultation / quoting / data_sharing / delivered確認待ち → client
    //   contract / production / revision → creator
    // contract は両者の意思確認なので両方をカウント
    const CLIENT_TURNS = new Set(["consultation", "quoting", "data_sharing"]);
    const CREATOR_TURNS = new Set(["production", "revision"]);
    const BOTH_TURNS = new Set(["contract"]);
    for (const o of openOrders ?? []) {
      const s = (o as { status: string }).status;
      if (
        (isCreator && (CREATOR_TURNS.has(s) || BOTH_TURNS.has(s))) ||
        (!isCreator && (CLIENT_TURNS.has(s) || BOTH_TURNS.has(s)))
      ) {
        awaitingMyAction += 1;
      }
    }
  }

  // ===== ② 売上・収益状況 =====
  // creator: 自分への支払額 (creator_payout) を escrow_status / 月で集計
  // client : 自分が払った total_amount を月で集計 / 進行中の合計
  let revThisMonth = 0;
  let revPending = 0;
  let revLifetime = 0;
  if ((isCreator && hasCreatorProfile) || hasClientProfile) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    if (isCreator && hasCreatorProfile) {
      // 累計売上 (released = 検収完了) + 未出金 (held = 預かり中)
      const { data: orders } = await supabase
        .from("orders")
        .select("creator_payout, escrow_status, completed_at, status")
        .eq("creator_id", user.creator_profile!.id);
      for (const o of orders ?? []) {
        const r = o as {
          creator_payout: number | null;
          escrow_status: string;
          completed_at: string | null;
          status: string;
        };
        const amount = r.creator_payout ?? 0;
        if (r.escrow_status === "released") {
          revLifetime += amount;
          if (r.completed_at && r.completed_at >= startOfMonth) {
            revThisMonth += amount;
          }
        } else if (r.escrow_status === "held") {
          // Escrow に預かり中の額 — 検収後に支払われる予定
          revPending += amount;
        }
      }
    } else {
      // client: 発注金額ベース
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, status, escrow_status, created_at")
        .eq("client_id", user.client_profile!.id);
      for (const o of orders ?? []) {
        const r = o as {
          total_amount: number | null;
          status: string;
          escrow_status: string;
          created_at: string;
        };
        const amount = r.total_amount ?? 0;
        if (r.escrow_status !== "refunded" && r.status !== "cancelled") {
          revLifetime += amount;
          if (r.created_at >= startOfMonth) revThisMonth += amount;
          if (r.status !== "delivered") revPending += amount;
        }
      }
    }
  }

  return (
    <div className="text-gray-900">
      {/* 基本情報 (アバター + 表示名) を編集できる Welcome 兼 Editor */}
      <BasicInfoEditor
        userId={user.id}
        initialDisplayName={user.display_name}
        initialAvatarUrl={user.avatar_url ?? null}
        roleLabel={roleLabel + (isAdmin ? "  [ADMIN]" : "")}
        isCreator={isCreator && hasCreatorProfile}
        initialMinimumOrderAmount={user.creator_profile?.minimum_order_amount ?? null}
      />

      {/* ① 要対応アラート — ダッシュボード最上部 (最優先) */}
      {!isAdmin && (
        <DashboardAlertsBar
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
          activeOrders={activeOrders}
          awaitingMyAction={awaitingMyAction}
        />
      )}

      {/* ② 売上・収益状況 / 発注・支払状況 */}
      {!isAdmin &&
        ((isCreator && hasCreatorProfile) || hasClientProfile) && (
          <DashboardRevenueCard
            role={isCreator ? "creator" : "client"}
            thisMonth={revThisMonth}
            pending={revPending}
            lifetime={revLifetime}
          />
        )}

      {/* Admin quick link */}
      {isAdmin && (
        <div className="mt-6 rounded-2xl border border-neon-purple/30 bg-neon-purple/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-purple/15">
              <svg className="h-5 w-5 text-neon-purple-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">管理画面</h2>
              <p className="text-sm text-gray-500">ユーザー管理・取引管理・売上サマリー</p>
            </div>
            <Link href="/admin" className="btn-primary text-sm">
              開く
            </Link>
          </div>
        </div>
      )}

      {/* Creator: prompt to create profile */}
      {isCreator && !hasCreatorProfile && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-neon-purple/30 bg-neon-purple/10 p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎬</span>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">クリエイタープロフィールを作成しましょう</h2>
              <p className="mt-1 text-sm text-gray-500">プロフィールを設定すると、クライアントからの検索結果に表示されます</p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="btn-primary mt-4 inline-block text-sm">
            プロフィールを設定する
          </Link>
        </div>
      )}

      {/* Client: prompt to set company info */}
      {!isCreator && !isAdmin && !hasClientProfile && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-neon-purple/30 bg-neon-purple/10 p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">企業情報を登録しましょう</h2>
              <p className="mt-1 text-sm text-gray-500">企業情報を登録すると、クリエイターへの依頼がスムーズになります</p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="btn-primary mt-4 inline-block text-sm">
            企業情報を登録する
          </Link>
        </div>
      )}

      {/* Creator stats
          - 経験年数は削除 (ユーザー判断: ダッシュボード上では情報量過多)
          - 評価 と レビュー数 は同じカードに統合
          - 空いた右側に 総いいね数 を新規表示 */}
      {isCreator && hasCreatorProfile && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 評価 + レビュー数 を 1 カードに */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">評価</p>
              {user.creator_profile!.review_count > 0 && (
                <span className="text-2xl">
                  {user.creator_profile!.rating >= 2.5
                    ? "😊"
                    : user.creator_profile!.rating >= 1.5
                      ? "😐"
                      : "😢"}
                </span>
              )}
            </div>
            {user.creator_profile!.review_count > 0 ? (
              <div className="mt-2 grid grid-cols-2 items-end gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {user.creator_profile!.rating >= 2.5
                      ? "満足"
                      : user.creator_profile!.rating >= 1.5
                        ? "普通"
                        : "不満"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">レーティング</p>
                </div>
                <div className="border-l border-gray-200 pl-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {user.creator_profile!.review_count}
                    <span className="ml-1 text-sm font-normal text-gray-400">
                      件
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">レビュー数</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                まだ評価がありません。
              </p>
            )}
          </div>

          {/* 総いいね数 (新規) — 全ポートフォリオの like_count 合計 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">総いいね数</p>
              <span className="text-2xl">❤️</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalLikes.toLocaleString()}
              <span className="ml-1 text-sm font-normal text-gray-400">件</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              ポートフォリオ動画が獲得したいいねの合計
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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
            <p className="text-sm text-gray-500">会社名</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {user.client_profile!.company_name || "未設定"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
            <p className="text-sm text-gray-500">業種</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {user.client_profile!.industry || "未設定"}
            </p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <h2 className="mt-8 mb-4 text-lg font-bold text-gray-900">クイックアクセス</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isCreator && (
          <>
            <Link
              href="/dashboard/portfolio"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neon-purple/10 transition-colors group-hover:bg-neon-purple/15">
                <svg className="h-6 w-6 text-neon-purple-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">ポートフォリオ管理</h3>
                <p className="mt-0.5 text-sm text-gray-500">作品の追加・編集・削除</p>
              </div>
            </Link>
            <Link
              href="/dashboard/applications"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neon-purple/10 transition-colors group-hover:bg-neon-purple/15">
                <svg className="h-6 w-6 text-neon-purple-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">応募済み案件</h3>
                <p className="mt-0.5 text-sm text-gray-500">応募した案件の状況確認</p>
              </div>
            </Link>
          </>
        )}
        {!isCreator && !isAdmin && (
          <>
            <Link
              href="/creators"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neon-purple/10 transition-colors group-hover:bg-neon-purple/15">
                <svg className="h-6 w-6 text-neon-purple-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">クリエイターを探す</h3>
                <p className="mt-0.5 text-sm text-gray-500">最適なクリエイターを検索</p>
              </div>
            </Link>
            <Link
              href="/dashboard/jobs"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neon-purple/10 transition-colors group-hover:bg-neon-purple/15">
                <svg className="h-6 w-6 text-neon-purple-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">案件を掲載する</h3>
                <p className="mt-0.5 text-sm text-gray-500">新しい募集案件を作成</p>
              </div>
            </Link>
          </>
        )}
        <Link
          href="/dashboard/orders"
          className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neon-purple/10 transition-colors group-hover:bg-neon-purple/15">
            <svg className="h-6 w-6 text-neon-purple-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">取引管理</h3>
            <p className="mt-0.5 text-sm text-gray-500">進行中の取引を確認</p>
          </div>
        </Link>
        <Link
          href="/dashboard/profile"
          className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neon-purple/10 transition-colors group-hover:bg-neon-purple/15">
            <svg className="h-6 w-6 text-neon-purple-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">
              {isCreator ? "プロフィール編集" : "企業情報編集"}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">基本情報の確認・更新</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
