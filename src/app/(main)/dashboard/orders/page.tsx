import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { formatPrice, formatDateJP, formatDateTimeJP } from "@/lib/utils";
import { getStatusMeta } from "@/lib/order-status";
import Link from "next/link";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const isCreator = user.role === "creator";

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      creator:creator_profiles!orders_creator_id_fkey (
        id, user_id,
        profiles!creator_profiles_user_id_fkey ( display_name )
      ),
      client:client_profiles!orders_client_id_fkey (
        id, user_id,
        profiles!client_profiles_user_id_fkey ( display_name )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (isCreator && user.creator_profile) {
    query = query.eq("creator_id", user.creator_profile.id);
  } else if (user.client_profile) {
    query = query.eq("client_id", user.client_profile.id);
  }

  const { data: orders } = await query;

  // 各取引相手とのメッセージ集計（最終更新日時 + 未読件数）
  const partnerIds = (orders ?? [])
    .map((o) => {
      const c = o.creator as unknown as { user_id: string };
      const cl = o.client as unknown as { user_id: string };
      return isCreator ? cl?.user_id : c?.user_id;
    })
    .filter(Boolean) as string[];

  const messageStats = new Map<
    string,
    { lastAt: string; unread: number }
  >();

  if (partnerIds.length > 0) {
    // partnerIds に絞り込んでメッセージを取得し、JS 側のフィルタを最小化する。
    // (以前は user が関与する全メッセージを取得して全件スキャンしていた)
    const csvList = partnerIds.map((id) => `"${id}"`).join(",");
    const { data: msgs } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, created_at, is_read")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.in.(${csvList})),` +
          `and(receiver_id.eq.${user.id},sender_id.in.(${csvList}))`
      )
      .order("created_at", { ascending: false });

    for (const m of msgs ?? []) {
      const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const cur = messageStats.get(partnerId);
      if (!cur) {
        messageStats.set(partnerId, {
          lastAt: m.created_at,
          unread: m.receiver_id === user.id && !m.is_read ? 1 : 0,
        });
      } else {
        if (m.created_at > cur.lastAt) cur.lastAt = m.created_at;
        if (m.receiver_id === user.id && !m.is_read) cur.unread += 1;
      }
    }
  }

  // 取引にメッセージ統計をマージしてからSlack風ソート (未読 > 最終更新 > 作成日)
  const enriched = (orders ?? [])
    .map((o) => {
      const c = o.creator as unknown as { user_id: string };
      const cl = o.client as unknown as { user_id: string };
      const partnerUserId = isCreator ? cl?.user_id : c?.user_id;
      const stats = partnerUserId ? messageStats.get(partnerUserId) : undefined;
      return {
        order: o,
        partnerUserId,
        unread: stats?.unread ?? 0,
        lastAt: stats?.lastAt ?? o.created_at,
      };
    })
    .sort((a, b) => {
      // 未読あり優先
      if ((a.unread > 0) !== (b.unread > 0)) return a.unread > 0 ? -1 : 1;
      // 次に最終更新降順
      return b.lastAt.localeCompare(a.lastAt);
    });

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#222]">取引一覧</h1>
          <p className="mt-2 text-sm text-[#828282]">
            {isCreator ? "受注した依頼の管理" : "依頼した取引の管理"}
            <span className="ml-2 text-[11px] text-[#BDBDBD]">
              （未読 → 最終更新の新しい順で表示）
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        {enriched.length === 0 ? (
          <div className="rounded-2xl bg-white py-16 text-center shadow-card">
            <svg
              className="mx-auto h-12 w-12 text-[#E0E0E0]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-bold text-[#222]">
              まだ取引はありません
            </h3>
            <p className="mt-2 text-sm text-[#828282]">
              {isCreator
                ? "クライアントからの依頼が届くとここに表示されます"
                : "クリエイターに依頼するとここに表示されます"}
            </p>
            {!isCreator && (
              <Link href="/creators" className="btn-primary mt-6 inline-block text-sm">
                クリエイターを探す
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {enriched.map(({ order, unread, lastAt }) => {
              const status = getStatusMeta(order.status);
              const creatorProfiles = (order.creator as unknown as { profiles: { display_name: string } })?.profiles;
              const clientProfiles = (order.client as unknown as { profiles: { display_name: string } })?.profiles;
              const partnerName = isCreator
                ? clientProfiles?.display_name ?? "クライアント"
                : creatorProfiles?.display_name ?? "クリエイター";
              // package_id 列は 00050 で撤去済

              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className={`block rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover ${
                    unread > 0 ? "ring-2 ring-neon-pink/40" : ""
                  }`}
                >
                  {/* 応募済み案件ページと同じ文字サイズ・太さに統一 */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3
                          className="truncate text-lg font-bold text-[#222] sm:text-xl"
                          title={`${status.label}: ${status.description}`}
                        >
                          {order.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-bold ${status.color}`}
                        >
                          {status.shortLabel}
                        </span>
                        {unread > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-purple px-1.5 text-[10px] font-bold text-white">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#828282]">{partnerName}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#828282]">
                        <span>{order.order_number}</span>
                        <span className="text-[#E0E0E0]">|</span>
                        <span>最終更新 {formatDateTimeJP(lastAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-neon-purple-deep">
                        {formatPrice(order.total_amount)}
                      </p>
                      <p className="mt-1 text-sm text-[#828282]">
                        取引日 {formatDateJP(order.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
