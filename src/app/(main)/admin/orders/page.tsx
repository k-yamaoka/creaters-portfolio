import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDateJP } from "@/lib/utils";
import { getStatusMeta } from "@/lib/order-status";
import Link from "next/link";

const PAGE_SIZE = 50;

type SearchParams = Promise<{
  page?: string;
  status?: string;
}>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const statusFilter = params.status?.trim() ?? "";

  // ─── サマリー (全件集計、ページとは独立に総額を出す) ───
  const { data: allForSum } = await supabase
    .from("orders")
    .select("total_amount, platform_fee");
  const totalAmount = allForSum?.reduce((s, o) => s + o.total_amount, 0) ?? 0;
  const totalFees = allForSum?.reduce((s, o) => s + o.platform_fee, 0) ?? 0;

  // ─── 一覧クエリ ───
  let query = supabase
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
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });
  if (statusFilter) query = query.eq("status", statusFilter);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: orders, count } = await query.range(from, to);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const linkFor = (p: number) => {
    const sp = new URLSearchParams();
    if (p > 1) sp.set("page", String(p));
    if (statusFilter) sp.set("status", statusFilter);
    const s = sp.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#222]">取引・売上管理</h2>
        <div className="flex flex-wrap items-center gap-2">
          <form method="GET" className="flex items-center gap-2 text-sm">
            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">全 status</option>
              <option value="consultation">相談中</option>
              <option value="quoting">見積提示</option>
              <option value="contract">契約 (仮払い前)</option>
              <option value="data_sharing">データ共有中</option>
              <option value="production">制作中</option>
              <option value="revision">修正中</option>
              <option value="delivered">納品済</option>
              <option value="cancelled">キャンセル</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
            >
              絞込
            </button>
          </form>
          <a
            href={`/api/admin/orders/export${statusFilter ? `?status=${statusFilter}` : ""}`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            download
          >
            📥 CSV ダウンロード
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-sm text-[#828282]">総取引件数</p>
          <p className="mt-1 text-2xl font-bold text-[#222]">
            {total.toLocaleString()}件
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
          <p className="mt-1 text-2xl font-bold text-neon-purple-deep">
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
              const status = getStatusMeta(order.status);
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
                      className="text-xs font-medium text-neon-purple-deep hover:underline"
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
                      {status.shortLabel}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-[#222]">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-[#828282]">
                    {formatPrice(order.platform_fee)}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-[#BDBDBD]">
                    {formatDateJP(order.created_at)}
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

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={linkFor(page - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
            >
              ← 前へ
            </Link>
          )}
          <span className="px-3 py-2 text-gray-500">
            {page} / {totalPages} ページ ({total.toLocaleString()} 件)
          </span>
          {page < totalPages && (
            <Link
              href={linkFor(page + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
            >
              次へ →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
