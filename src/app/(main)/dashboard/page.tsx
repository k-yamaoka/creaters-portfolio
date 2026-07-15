import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BasicInfoEditor } from "@/components/dashboard/basic-info-editor";
import { EarlyMemberBadge } from "@/components/creator/early-member-badge";
import { CreatorFeeCard } from "@/components/creator/creator-fee-card";
import { Video, Building2, Heart, Smile, Meh, Frown } from "lucide-react";
import { DashboardAlertsBar } from "@/components/dashboard/alerts-bar";
import {
  DashboardLatestActivity,
  type ActivityItem,
} from "@/components/dashboard/latest-activity";
// 2026-06-12 ダッシュボード整理:
// - 売上・収益状況 / おすすめ案件 / アナリティクス の 3 セクションを撤去
// - プロフィール充実度はバナー (BasicInfoEditor) に統合 (独立カードを撤去)

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

  // 総いいね数 = このクリエイターの全 portfolio_items の like_count 合計 (旧 ④
  // アナリティクス撤去後も、評価セクションの「総いいね数」カードで使用)
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

  // ② 売上・収益状況 / ③ おすすめ案件 / ④ アナリティクス の各セクションは
  // 2026-06-12 にダッシュボードから撤去。関連クエリと state はすべて削除。

  // ===== 最新のアクティビティ (新規・企業以外でも有用なので全ロール表示) =====
  // notifications + 直近メッセージ + 直近 orders 更新 をマージ。
  // 各ソースの上限を絞り、最終的に 8 件まで時系列降順で出す。
  let activityItems: ActivityItem[] = [];
  if (!isAdmin) {
    const [
      { data: notifRows },
      { data: msgRows },
      { data: ordRows },
    ] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, title, body, link, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("messages")
        .select("id, sender_id, content, is_read, created_at")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      (async () => {
        let q = supabase
          .from("orders")
          .select("id, title, status, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5);
        if (isCreator && hasCreatorProfile)
          q = q.eq("creator_id", user.creator_profile!.id);
        else if (hasClientProfile)
          q = q.eq("client_id", user.client_profile!.id);
        else return { data: [] as unknown[] };
        return q;
      })(),
    ]);
    const fromNotif: ActivityItem[] = (notifRows ?? []).map((n) => {
      const r = n as {
        id: string;
        title: string;
        body: string | null;
        link: string | null;
        is_read: boolean;
        created_at: string;
      };
      return {
        id: r.id,
        kind: "notification",
        title: r.title,
        body: r.body,
        href: r.link || "/dashboard",
        createdAt: r.created_at,
        isUnread: !r.is_read,
      };
    });
    const fromMsg: ActivityItem[] = (msgRows ?? []).map((m) => {
      const r = m as {
        id: string;
        sender_id: string;
        content: string;
        is_read: boolean;
        created_at: string;
      };
      return {
        id: r.id,
        kind: "message",
        title: "新着メッセージ",
        body: r.content.slice(0, 60),
        href: `/dashboard/messages/${r.sender_id}`,
        createdAt: r.created_at,
        isUnread: !r.is_read,
      };
    });
    const fromOrd: ActivityItem[] = (
      (ordRows as unknown[]) ?? []
    ).map((o) => {
      const r = o as {
        id: string;
        title: string;
        status: string;
        updated_at: string;
      };
      return {
        id: r.id,
        kind: "order",
        title: `取引「${r.title}」が更新`,
        body: r.status,
        href: `/dashboard/orders/${r.id}`,
        createdAt: r.updated_at,
      };
    });
    activityItems = [...fromNotif, ...fromMsg, ...fromOrd]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }

  return (
    <div className="text-gray-900">
      {/* 基本情報 (アバター + 表示名) を編集できる Welcome 兼 Editor。
          2026-06-16: プロフィール充実度メーターは完全撤去 */}
      <BasicInfoEditor
        userId={user.id}
        initialDisplayName={user.display_name}
        initialAvatarUrl={user.avatar_url ?? null}
        roleLabel={roleLabel + (isAdmin ? "  [ADMIN]" : "")}
        isCreator={isCreator && hasCreatorProfile}
        initialMinimumOrderAmount={user.creator_profile?.minimum_order_amount ?? null}
      />

      {/* 00064: クリエイター限定 — アーリーメンバー特典 + 現在の適用手数料
          BasicInfoEditor 直下、要対応アラート直上に配置。
          - 立ち上げ期の登録者 (is_early_member=true) は特典バッジで
            モチベーション向上
          - 誰でも「現在の適用システム手数料」を把握できる (安心感) */}
      {isCreator && hasCreatorProfile && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {user.creator_profile!.is_early_member && <EarlyMemberBadge />}
          <CreatorFeeCard
            isEarlyMember={user.creator_profile!.is_early_member}
            customFeeRate={user.creator_profile!.custom_fee_rate}
            className={user.creator_profile!.is_early_member ? "" : "md:col-span-2"}
          />
        </div>
      )}

      {/* 00067: プロフィール非公開アラート — ポートフォリオ 0 点で is_searchable=false のクリエイター向け。
          企業側の検索・一覧に表示されない旨を明示し、最初の 1 点登録を促す。
          is_searchable の値は portfolio_items INSERT trigger が自動更新する。 */}
      {isCreator && hasCreatorProfile && !user.creator_profile!.is_searchable && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 text-2xl leading-none" aria-hidden>
              ⚠️
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-amber-900">
                あなたのプロフィールはまだ企業に公開されていません
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                最初のポートフォリオを登録すると、企業側の検索・一覧に自動で公開されます。実績を 1 点でも登録して、AILIER 上での露出をスタートしましょう。
              </p>
              <Link
                href="/dashboard/portfolio"
                className="btn-primary mt-3 inline-block text-sm"
              >
                ポートフォリオを登録する
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ① 要対応アラート — ダッシュボード最上部 (最優先) */}
      {!isAdmin && (
        <DashboardAlertsBar
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
          activeOrders={activeOrders}
          awaitingMyAction={awaitingMyAction}
        />
      )}

      {/* 最新のアクティビティ (2026-06-15 追加) — 新着通知・未読メッセージ・取引更新 */}
      {!isAdmin && (
        <DashboardLatestActivity items={activityItems} />
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
            <Video size={36} strokeWidth={1.6} className="text-neon-purple-deep" aria-hidden />
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
            <Building2 size={36} strokeWidth={1.6} className="text-neon-purple-deep" aria-hidden />
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
              {user.creator_profile!.review_count > 0 &&
                (() => {
                  const r = user.creator_profile!.rating;
                  const Icon = r >= 2.5 ? Smile : r >= 1.5 ? Meh : Frown;
                  const cls =
                    r >= 2.5
                      ? "text-green-500"
                      : r >= 1.5
                        ? "text-yellow-500"
                        : "text-gray-400";
                  return <Icon size={28} strokeWidth={1.6} className={cls} aria-hidden />;
                })()}
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
              <Heart size={28} strokeWidth={1.6} fill="currentColor" className="text-neon-pink" aria-hidden />
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

      {/* 2026-06-15: 会社名・業種の巨大ボックスを撤去 */}
      {/* 2026-06-16: 「クイックアクセス」セクション全体を撤去
          (左サイドバーから全ページに到達できるため重複) */}
    </div>
  );
}
