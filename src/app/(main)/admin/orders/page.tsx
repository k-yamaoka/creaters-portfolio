import { createClient } from "@/lib/supabase/server";
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

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      creator:creator_profiles!orders_creator_id_fkey (
        profiles!creator_profiles_user_id_fkey ( display_name )
      ),
      client:client_profiles!orders_client_id_fkey (
        profiles!client_profiles_user_id_fkey ( display_name )
      )
    `
    )
    .order("created_at", { ascending: false });

  // Summary
  const totalAmount = orders?.reduce((s, o) => s + o.total_amount, 0) ?? 0;
  const totalFees = orders?.reduce((s, o) => s + o.platform_fee, 0) ?? 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#222]">取引・売上管理</h2>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-sm text-[#828282]">総取引件数</p>
          <p className="mt-1 text-2xl font-bold text-[#222]">
            {orders?.length ?? 0}件
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-sm text-[#828282]">総取引額</p>
          <p className="mt-1 text-2xl font-bold text-[#222]">
            {formatPrice(totalAmount)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-sm text-[#828282]">総手数料</p>
          <p className="mt-1 text-2xl font-bold text-primary-500">
            {formatPrice(totalFees)}
          </p>
        </div>
      </div>

      {/* Orders table */}
      <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F2F2F2]">
              <th className="px-5 py-3 text-left text-xs font-bold text-[#828282]">
                注文番号
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-[#828282]">
                タイトル
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-[#828282]">
                クリエイター
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-[#828282]">
                クライアント
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-[#828282]">
                ステータス
              </th>
              <th className="px-5 py-3 text-right text-xs font-bold text-[#828282]">
                金額
              </th>
              <th className="px-5 py-3 text-right text-xs font-bold text-[#828282]">
                手数料
              </th>
              <th className="px-5 py-3 text-right text-xs font-bold text-[#828282]">
                日付
              </th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => {
              const status = STATUS_LABELS[order.status] ?? {
                label: order.status,
                color: "bg-gray-100 text-gray-500",
              };
              const creatorName =
                (
                  order.creator as unknown as {
                    profiles: { display_name: string };
                  }
                )?.profiles?.display_name ?? "-";
              const clientName =
                (
                  order.client as unknown as {
                    profiles: { display_name: string };
                  }
                )?.profiles?.display_name ?? "-";

              return (
                <tr
                  key={order.id}
                  className="border-b border-[#F2F2F2] last:border-0"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-xs font-medium text-primary-500 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-sm text-[#222]">
                    {order.title}
                  </td>
                  <td className="px-5 py-3 text-sm text-[#4F4F4F]">
                    {creatorName}
                  </td>
                  <td className="px-5 py-3 text-sm text-[#4F4F4F]">
                    {clientName}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-pill px-2.5 py-0.5 text-[11px] font-bold ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-[#222]">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-[#828282]">
                    {formatPrice(order.platform_fee)}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-[#BDBDBD]">
                    {new Date(order.created_at).toLocaleDateString("ja-JP")}
                  </td>
                </tr>
              );
            })}
            {(!orders || orders.length === 0) && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center text-sm text-[#828282]"
                >
                  取引はまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
