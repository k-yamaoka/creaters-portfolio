import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  inquiry: { label: "相談中", color: "bg-blue-100 text-blue-700" },
  quoted: { label: "見積済", color: "bg-purple-100 text-purple-700" },
  accepted: { label: "受注済", color: "bg-indigo-100 text-indigo-700" },
  paid: { label: "仮払済", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "制作中", color: "bg-orange-100 text-orange-700" },
  delivered: { label: "納品済", color: "bg-teal-100 text-teal-700" },
  revision: { label: "修正中", color: "bg-pink-100 text-pink-700" },
  completed: { label: "完了", color: "bg-green-100 text-green-700" },
  cancelled: { label: "キャンセル", color: "bg-gray-100 text-gray-500" },
};

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
        id,
        profiles!creator_profiles_user_id_fkey ( display_name )
      ),
      client:client_profiles!orders_client_id_fkey (
        id,
        profiles!client_profiles_user_id_fkey ( display_name )
      ),
      package:service_packages ( name )
    `
    )
    .order("created_at", { ascending: false });

  if (isCreator && user.creator_profile) {
    query = query.eq("creator_id", user.creator_profile.id);
  } else if (user.client_profile) {
    query = query.eq("client_id", user.client_profile.id);
  }

  const { data: orders } = await query;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">取引一覧</h1>
      <p className="mt-2 text-sm text-[#828282]">
        {isCreator ? "受注した依頼の管理" : "依頼した取引の管理"}
      </p>

      <div className="mt-6">
        {!orders || orders.length === 0 ? (
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
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] ?? {
                label: order.status,
                color: "bg-gray-100 text-gray-500",
              };
              const creatorProfiles = (order.creator as unknown as { profiles: { display_name: string } })?.profiles;
              const clientProfiles = (order.client as unknown as { profiles: { display_name: string } })?.profiles;
              const partnerName = isCreator
                ? clientProfiles?.display_name ?? "クライアント"
                : creatorProfiles?.display_name ?? "クリエイター";
              const packageName = (order.package as unknown as { name: string })?.name;

              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="block rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-sm font-bold text-[#222]">
                          {order.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-pill px-2.5 py-0.5 text-[11px] font-bold ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#828282]">
                        <span>{partnerName}</span>
                        {packageName && (
                          <>
                            <span className="text-[#E0E0E0]">|</span>
                            <span>{packageName}</span>
                          </>
                        )}
                        <span className="text-[#E0E0E0]">|</span>
                        <span>{order.order_number}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#222]">
                        {formatPrice(order.total_amount)}
                      </p>
                      <p className="mt-1 text-[11px] text-[#BDBDBD]">
                        {new Date(order.created_at).toLocaleDateString("ja-JP")}
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
