import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { OrdersList, type OrderRow } from "./orders-list";

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
    query = query
      .eq("creator_id", user.creator_profile.id)
      .is("archived_by_creator_at", null);
  } else if (user.client_profile) {
    query = query
      .eq("client_id", user.client_profile.id)
      .is("archived_by_client_at", null);
  }

  const { data: orders } = await query;

  // 取引相手とのメッセージ集計 (最終更新 + 未読件数)
  const partnerIds = (orders ?? [])
    .map((o) => {
      const c = o.creator as unknown as { user_id: string };
      const cl = o.client as unknown as { user_id: string };
      return isCreator ? cl?.user_id : c?.user_id;
    })
    .filter(Boolean) as string[];

  const messageStats = new Map<string, { lastAt: string; unread: number }>();

  if (partnerIds.length > 0) {
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
      const partnerId =
        m.sender_id === user.id ? m.receiver_id : m.sender_id;
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

  const rows: OrderRow[] = (orders ?? [])
    .map((o) => {
      const c = o.creator as unknown as {
        user_id: string;
        profiles: { display_name: string };
      };
      const cl = o.client as unknown as {
        user_id: string;
        profiles: { display_name: string };
      };
      const partnerUserId = isCreator ? cl?.user_id : c?.user_id;
      const stats = partnerUserId ? messageStats.get(partnerUserId) : undefined;
      const partnerName = isCreator
        ? cl?.profiles?.display_name ?? "クライアント"
        : c?.profiles?.display_name ?? "クリエイター";
      return {
        id: o.id as string,
        title: (o.title as string) ?? "取引",
        status: o.status as string,
        total_amount: (o.total_amount as number) ?? 0,
        created_at: o.created_at as string,
        delivery_deadline: (o.delivery_deadline as string | null) ?? null,
        partnerUserId,
        partnerName,
        unread: stats?.unread ?? 0,
        lastAt: stats?.lastAt ?? (o.created_at as string),
      };
    })
    // 未読あり優先 → 最終更新降順
    .sort((a, b) => {
      if ((a.unread > 0) !== (b.unread > 0)) return a.unread > 0 ? -1 : 1;
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
              (未読 → 最終更新の新しい順で表示)
            </span>
          </p>
        </div>
      </div>
      <div className="mt-6">
        <OrdersList rows={rows} isCreator={isCreator} />
      </div>
    </div>
  );
}
