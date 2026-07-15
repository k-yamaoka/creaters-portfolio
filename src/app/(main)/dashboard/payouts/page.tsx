import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateJP } from "@/lib/utils";
import {
  computeAvailableBalance,
  MIN_PAYOUT_AMOUNT,
  BANK_TRANSFER_FEE,
  PAYOUT_SCHEDULE_MIN_DAYS,
  PAYOUT_SCHEDULE_MAX_DAYS,
  type PayoutStatus,
} from "@/lib/payout";
import { PayoutWithdrawalPanel } from "@/components/creator/payout-withdrawal-panel";

export const dynamic = "force-dynamic";

/**
 * クリエイター 売上・出金管理ページ。
 *
 * A-3 実装 (2026-07-14):
 *  - 検収完了案件からの入金予定額 (creator_payout の集計)
 *  - 出金可能残高 (最低 ¥5,000)
 *  - 振込手数料 ¥250 (クリエイター負担) 明示
 *  - 出金申請ボタン (残高 < ¥5,000 で非活性 + アラート)
 *  - 直近の入金予定・入金済 一覧
 */

const STATUS_LABEL: Record<PayoutStatus, { label: string; color: string }> = {
  pending: { label: "検収待ち", color: "text-gray-600 bg-gray-100" },
  scheduled: { label: "入金予定", color: "text-indigo-700 bg-indigo-50" },
  paid: { label: "入金済", color: "text-emerald-700 bg-emerald-50" },
  failed: { label: "失敗", color: "text-red-700 bg-red-50" },
};

function formatJpy(n: number): string {
  return `¥${Math.max(0, Math.floor(n)).toLocaleString("ja-JP")}`;
}

export default async function PayoutsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "creator") redirect("/dashboard");
  if (!user.creator_profile) redirect("/dashboard/profile");

  const supabase = await createClient();

  // 対象: このクリエイターの検収済 (released) 案件
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, title, creator_payout, escrow_status, payout_status, inspected_at, payout_scheduled_date, completed_at, client:client_profiles!orders_client_id_fkey ( profiles!client_profiles_user_id_fkey ( display_name ) )"
    )
    .eq("creator_id", user.creator_profile.id)
    .in("payout_status", ["pending", "scheduled", "paid", "failed"])
    .order("payout_scheduled_date", { ascending: false, nullsFirst: false })
    .limit(50);

  const availableBalance = computeAvailableBalance(orders ?? []);

  // 集計サマリ
  let scheduledCount = 0;
  let paidCount = 0;
  let paidTotal = 0;
  for (const o of orders ?? []) {
    if (o.payout_status === "scheduled") scheduledCount += 1;
    if (o.payout_status === "paid") {
      paidCount += 1;
      paidTotal += Math.max(0, Math.floor(o.creator_payout ?? 0));
    }
  }

  // Stripe Connect 接続確認 (簡易: creator_profile.stripe_account_id が入る想定だが
  // 現状は API 経由なのでここでは true 扱い。実装時は creator_profiles にカラム追加)
  const hasBankConnected = true;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">売上・出金管理</h1>
      <p className="mt-2 text-sm text-[#828282]">
        検収完了した取引の入金予定と、出金申請を管理できます
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* 出金可能残高 */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-xs font-bold text-[#828282]">出金可能残高</p>
          <p className="mt-2 font-display text-2xl font-black text-[#222]">
            {formatJpy(availableBalance)}
          </p>
          <p className="mt-1 text-[11px] text-[#828282]">
            検収完了 (released) 済 案件の未払残高
          </p>
        </div>

        {/* 入金予定件数 */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-xs font-bold text-[#828282]">入金予定</p>
          <p className="mt-2 font-display text-2xl font-black text-[#222]">
            {scheduledCount} 件
          </p>
          <p className="mt-1 text-[11px] text-[#828282]">
            検収後 {PAYOUT_SCHEDULE_MIN_DAYS}〜{PAYOUT_SCHEDULE_MAX_DAYS} 営業日以内に入金
          </p>
        </div>

        {/* 入金済累計 */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-xs font-bold text-[#828282]">入金済 (累計)</p>
          <p className="mt-2 font-display text-2xl font-black text-[#222]">
            {formatJpy(paidTotal)}
          </p>
          <p className="mt-1 text-[11px] text-[#828282]">{paidCount} 件</p>
        </div>
      </div>

      {/* 出金申請 パネル */}
      <div className="mt-6">
        <PayoutWithdrawalPanel
          availableBalance={availableBalance}
          hasBankConnected={hasBankConnected}
        />
      </div>

      {/* 一覧 */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#222]">入金明細</h2>
        <p className="mt-1 text-xs text-[#828282]">
          直近 50 件。振込手数料 ¥{BANK_TRANSFER_FEE} は各出金申請時に控除されます。
          最低出金金額 ¥{MIN_PAYOUT_AMOUNT.toLocaleString()}。
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">案件</th>
                <th className="px-4 py-3">検収日</th>
                <th className="px-4 py-3">入金予定日</th>
                <th className="px-4 py-3 text-right">金額</th>
                <th className="px-4 py-3">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(orders ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    まだ入金明細はありません
                  </td>
                </tr>
              )}
              {(orders ?? []).map((o) => {
                const status = (o.payout_status ?? "pending") as PayoutStatus;
                const meta = STATUS_LABEL[status];
                const clientName =
                  (
                    o.client as unknown as {
                      profiles?: { display_name?: string };
                    }
                  )?.profiles?.display_name ?? "—";
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {o.title || o.order_number}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {clientName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {o.inspected_at
                        ? formatDateJP(new Date(o.inspected_at))
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {o.payout_scheduled_date
                        ? formatDateJP(new Date(o.payout_scheduled_date))
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-900">
                      {formatJpy(o.creator_payout ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
