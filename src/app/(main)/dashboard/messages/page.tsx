import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { getStatusMeta } from "@/lib/order-status";
import Link from "next/link";

function formatLastUpdate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // ユーザーが関わる全メッセージを最新順で取得
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // パートナー単位で会話集計
  const conversations = new Map<
    string,
    {
      partnerId: string;
      lastMessage: string;
      lastAt: string;
      unread: number;
    }
  >();

  for (const msg of messages ?? []) {
    const partnerId =
      msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        partnerId,
        lastMessage: msg.content,
        lastAt: msg.created_at,
        unread: 0,
      });
    }

    if (msg.receiver_id === user.id && !msg.is_read) {
      const conv = conversations.get(partnerId)!;
      conv.unread++;
    }
  }

  const partnerIds = Array.from(conversations.keys());

  // パートナーのプロフィール
  const partners: Record<
    string,
    { display_name: string; avatar_url: string | null; role: string }
  > = {};
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, role")
      .in("id", partnerIds);
    for (const p of profiles ?? []) {
      partners[p.id] = {
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        role: p.role,
      };
    }
  }

  // 自分が関わる取引から「相手→案件名(=order.title)+ status」を解決
  // 自分がclient → creator_profile.user_id=partnerId
  // 自分がcreator → client_profile.user_id=partnerId
  const isCreator = user.role === "creator";
  const latestOrders: Record<
    string,
    { id: string; title: string; status: string; updatedAt: string }
  > = {};

  if (partnerIds.length > 0) {
    if (isCreator && user.creator_profile) {
      const { data: rows } = await supabase
        .from("orders")
        .select(
          `id, title, status, updated_at,
           client:client_profiles!orders_client_id_fkey ( user_id )`
        )
        .eq("creator_id", user.creator_profile.id)
        .order("updated_at", { ascending: false });
      for (const o of rows ?? []) {
        const partnerUserId = (
          o.client as unknown as { user_id: string } | null
        )?.user_id;
        if (!partnerUserId || latestOrders[partnerUserId]) continue;
        latestOrders[partnerUserId] = {
          id: o.id,
          title: o.title,
          status: o.status,
          updatedAt: o.updated_at,
        };
      }
    } else if (user.client_profile) {
      const { data: rows } = await supabase
        .from("orders")
        .select(
          `id, title, status, updated_at,
           creator:creator_profiles!orders_creator_id_fkey ( user_id )`
        )
        .eq("client_id", user.client_profile.id)
        .order("updated_at", { ascending: false });
      for (const o of rows ?? []) {
        const partnerUserId = (
          o.creator as unknown as { user_id: string } | null
        )?.user_id;
        if (!partnerUserId || latestOrders[partnerUserId]) continue;
        latestOrders[partnerUserId] = {
          id: o.id,
          title: o.title,
          status: o.status,
          updatedAt: o.updated_at,
        };
      }
    }
  }

  // Slack風ソート: 未読優先 → 最終更新降順
  const convList = Array.from(conversations.values()).sort((a, b) => {
    if ((a.unread > 0) !== (b.unread > 0)) return a.unread > 0 ? -1 : 1;
    return b.lastAt.localeCompare(a.lastAt);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">受信箱</h1>
      <p className="mt-2 text-sm text-[#828282]">
        応募・スカウト・取引前のやり取りを含む全会話。取引中の連絡は{" "}
        <a href="/dashboard/orders" className="text-primary-500 hover:underline">
          取引管理
        </a>{" "}
        の各取引詳細でも同じ内容を閲覧・送信できます
        <span className="ml-2 text-[11px] text-[#BDBDBD]">
          （未読 → 最終更新の新しい順）
        </span>
      </p>

      <div className="mt-6">
        {convList.length === 0 ? (
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
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-bold text-[#222]">
              まだメッセージはありません
            </h3>
            <p className="mt-2 text-sm text-[#828282]">
              クリエイターのページから「メッセージを送る」で会話を始めましょう
            </p>
            <Link href="/creators" className="btn-primary mt-6 inline-block text-sm">
              クリエイターを探す
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {convList.map((conv) => {
              const partner = partners[conv.partnerId];
              const name = partner?.display_name ?? "ユーザー";
              const initial = name[0];
              const order = latestOrders[conv.partnerId];
              const status = order ? getStatusMeta(order.status) : null;

              return (
                <Link
                  key={conv.partnerId}
                  href={`/dashboard/messages/${conv.partnerId}`}
                  className={`flex items-center gap-4 rounded-xl bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover ${
                    conv.unread > 0 ? "ring-2 ring-primary-200" : ""
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#222]">{name}</h3>
                      {/* 案件名ブロック + 進捗tooltip */}
                      {order && status && (
                        <span
                          className="inline-flex max-w-[28ch] cursor-help items-center gap-1.5 truncate rounded-md border border-primary-100 bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700"
                          title={`${status.label} - ${status.description}`}
                        >
                          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75z" />
                          </svg>
                          <span className="truncate">{order.title}</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-[#828282]">
                      {conv.lastMessage}
                    </p>
                    <p className="mt-1 text-[10px] text-[#BDBDBD]">
                      最終更新: {formatLastUpdate(conv.lastAt)}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] font-bold text-white">
                      {conv.unread > 99 ? "99+" : conv.unread}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
