import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDateJP } from "@/lib/utils";
import { getStatusMeta } from "@/lib/order-status";

export const dynamic = "force-dynamic";

/**
 * 企業向け 支払い・請求管理ページ。
 *
 * クリエイター側に Stripe Connect での支払い導線があるのに対し、企業側にも
 * 同等の参照ページが無かったので新設。MVP は「過去の取引と金額の確認 +
 * 請求書相当の出力導線」のみ。Stripe Customer Portal 連携は今後の TODO。
 */
export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "client") redirect("/dashboard");
  if (!user.client_profile) redirect("/dashboard/profile");

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, title, status, escrow_status, total_amount, platform_fee, created_at, completed_at, creator:creator_profiles!orders_creator_id_fkey ( profiles!creator_profiles_user_id_fkey ( display_name ) )"
    )
    .eq("client_id", user.client_profile.id)
    .order("created_at", { ascending: false });

  // 集計: 今月の確定支払 / 進行中 / 累計
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  let thisMonth = 0;
  let pending = 0;
  let lifetime = 0;
  for (const o of orders ?? []) {
    const r = o as {
      total_amount: number | null;
      status: string;
      escrow_status: string;
      created_at: string;
    };
    const amt = r.total_amount ?? 0;
    if (r.escrow_status === "refunded" || r.status === "cancelled") continue;
    lifetime += amt;
    if (r.created_at >= startOfMonth) thisMonth += amt;
    if (r.status !== "delivered") pending += amt;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">支払い・請求管理</h1>
      <p className="mt-2 text-sm text-[#828282]">
        発注した取引の支払い状況・請求情報を確認できます
      </p>

      {/* サマリーカード 3 つ */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="今月の発注額"
          value={thisMonth}
          hint="今月作成した取引の合計 (税込)"
          tone="accent"
        />
        <SummaryCard
          label="進行中の支払予定"
          value={pending}
          hint="発注済で未完了の取引額"
        />
        <SummaryCard
          label="累計発注額"
          value={lifetime}
          hint="これまでに発注したすべての取引"
        />
      </div>

      <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-wider text-[#828282]">
        取引履歴
      </p>

      {!orders || orders.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-card">
          <h3 className="text-lg font-bold text-[#222]">
            まだ取引履歴がありません
          </h3>
          <p className="mt-2 text-sm text-[#828282]">
            「案件管理」から案件を掲載し、クリエイターとマッチングしましょう
          </p>
          <Link
            href="/dashboard/jobs"
            className="btn-primary mt-4 inline-block text-sm"
          >
            案件管理へ
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">取引日</th>
                <th className="px-4 py-3">案件</th>
                <th className="px-4 py-3">クリエイター</th>
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3 text-right">金額</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => {
                const row = o as unknown as {
                  id: string;
                  title: string;
                  status: string;
                  total_amount: number;
                  created_at: string;
                  creator: {
                    profiles: { display_name: string };
                  } | null;
                };
                const status = getStatusMeta(row.status);
                return (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {formatDateJP(row.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{row.title}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {row.creator?.profiles?.display_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-pill px-2.5 py-0.5 text-[11px] font-bold ${status.color}`}
                      >
                        {status.shortLabel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-neon-purple-deep">
                      {formatPrice(row.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/orders/${row.id}`}
                        className="text-xs font-bold text-neon-purple-deep transition-colors hover:text-neon-pink"
                      >
                        詳細 →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-[11px] text-gray-400">
        ※ 適格請求書 (インボイス) は取引完了後に各取引詳細ページからダウンロードできます (準備中)。
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "accent";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-card ${
        tone === "accent"
          ? "border-neon-pink/30 bg-gradient-to-br from-neon-pink/[0.06] to-neon-purple/[0.04]"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-black leading-none sm:text-3xl ${
          tone === "accent" ? "text-neon-purple-deep" : "text-gray-900"
        }`}
      >
        {formatPrice(value)}
      </p>
      <p className="mt-2 text-[11px] text-gray-500">{hint}</p>
    </div>
  );
}
