import { getSupabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { formatDateJP } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * §B8 管理者用 dispute (運営裁定) 一覧画面 (2026-07-21)。
 *
 * 3 セクション:
 *   1. 未対応 (admin_status='received')
 *   2. 確認中 (admin_status='reviewing')
 *   3. 対応完了 (admin_status='resolved') 直近 20 件
 *
 * 行をクリックすると /admin/disputes/[id] 詳細画面へ。
 */

const CATEGORY_LABEL: Record<string, string> = {
  no_response: "連絡なし",
  unfair_revision: "不当な修正",
  payment_delay: "検収遅延",
  quality_issue: "品質問題",
  termination_dispute: "途中終了の不一致",
  other: "その他",
};

const ROLE_LABEL: Record<string, string> = {
  creator: "クリエイター",
  client: "クライアント",
};

const STATUS_BADGE: Record<string, string> = {
  received: "border-indigo-300 bg-indigo-50 text-indigo-800",
  reviewing: "border-amber-300 bg-amber-50 text-amber-800",
  resolved: "border-emerald-300 bg-emerald-50 text-emerald-800",
};
const STATUS_LABEL: Record<string, string> = {
  received: "受付",
  reviewing: "確認中",
  resolved: "対応完了",
};

export default async function AdminDisputesPage() {
  const admin = getSupabaseAdmin();

  // 未対応 + 確認中 (open)
  const { data: openDisputes } = await admin
    .from("disputes")
    .select(
      `id, order_id, opened_by_role, category, reason, admin_status, created_at,
       ruling_type,
       orders:order_id (
         title, base_price,
         client:client_profiles!orders_client_id_fkey (
           profiles!client_profiles_user_id_fkey ( display_name )
         ),
         creator:creator_profiles!orders_creator_id_fkey (
           profiles!creator_profiles_user_id_fkey ( display_name )
         )
       )`
    )
    .in("admin_status", ["received", "reviewing"])
    .order("created_at", { ascending: true });

  const { data: resolvedDisputes } = await admin
    .from("disputes")
    .select(
      `id, order_id, opened_by_role, category, admin_status, resolved_at,
       ruling_type, ruling_refund_rate,
       orders:order_id ( title,
         client:client_profiles!orders_client_id_fkey (
           profiles!client_profiles_user_id_fkey ( display_name )
         ),
         creator:creator_profiles!orders_creator_id_fkey (
           profiles!creator_profiles_user_id_fkey ( display_name )
         )
       )`
    )
    .eq("admin_status", "resolved")
    .order("resolved_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-bold text-gray-900">運営裁定 (dispute)</h2>
        <p className="mt-1 text-sm text-gray-500">
          クリエイター / クライアント からの申告を確認し、合意仕様との照合を基準に裁定します。
        </p>
      </div>

      {/* 未対応 + 確認中 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-gray-900">
          対応が必要 ({(openDisputes ?? []).length} 件)
        </h3>
        {(openDisputes ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            未対応の申告はありません
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-3">案件</th>
                  <th className="px-3 py-3">申請者</th>
                  <th className="px-3 py-3">カテゴリ</th>
                  <th className="px-3 py-3">状態</th>
                  <th className="px-3 py-3">受付日</th>
                  <th className="px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(openDisputes ?? []).map((d) => {
                  const row = d as unknown as {
                    id: string;
                    order_id: string;
                    opened_by_role: string;
                    category: string;
                    reason: string | null;
                    admin_status: string;
                    created_at: string;
                    orders?: {
                      title?: string;
                      base_price?: number;
                      client?: {
                        profiles?: { display_name?: string };
                      };
                      creator?: {
                        profiles?: { display_name?: string };
                      };
                    };
                  };
                  return (
                    <tr key={row.id}>
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-medium text-gray-900">
                          {row.orders?.title ?? "(タイトル無し)"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          クライアント:{" "}
                          {row.orders?.client?.profiles?.display_name ?? "-"} /
                          クリエイター:{" "}
                          {row.orders?.creator?.profiles?.display_name ?? "-"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          金額 ¥
                          {(row.orders?.base_price ?? 0).toLocaleString("ja-JP")}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-700">
                        {ROLE_LABEL[row.opened_by_role] ?? row.opened_by_role}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-700">
                        {CATEGORY_LABEL[row.category] ?? row.category}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            STATUS_BADGE[row.admin_status] ?? ""
                          }`}
                        >
                          {STATUS_LABEL[row.admin_status] ?? row.admin_status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500">
                        {formatDateJP(new Date(row.created_at))}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/admin/disputes/${row.id}`}
                          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-indigo-700"
                        >
                          詳細・裁定
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 対応完了 (直近 20) */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-gray-900">
          対応完了 (直近 {(resolvedDisputes ?? []).length} 件)
        </h3>
        {(resolvedDisputes ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            完了済みの申告はありません
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-3">案件</th>
                  <th className="px-3 py-3">カテゴリ</th>
                  <th className="px-3 py-3">裁定</th>
                  <th className="px-3 py-3">完了日</th>
                  <th className="px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(resolvedDisputes ?? []).map((d) => {
                  const row = d as unknown as {
                    id: string;
                    category: string;
                    ruling_type: string | null;
                    ruling_refund_rate: number | null;
                    resolved_at: string | null;
                    orders?: { title?: string };
                  };
                  return (
                    <tr key={row.id}>
                      <td className="px-3 py-2.5 text-xs text-gray-900">
                        {row.orders?.title ?? "-"}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-700">
                        {CATEGORY_LABEL[row.category] ?? row.category}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-700">
                        {row.ruling_type ?? "-"}
                        {row.ruling_refund_rate !== null &&
                          ` (${Math.round(row.ruling_refund_rate * 100)}% 返金)`}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500">
                        {row.resolved_at
                          ? formatDateJP(new Date(row.resolved_at))
                          : "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/admin/disputes/${row.id}`}
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
