"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Wallet, Info } from "lucide-react";
import {
  MIN_PAYOUT_AMOUNT,
  BANK_TRANSFER_FEE,
  computeWithdrawal,
} from "@/lib/payout";

/**
 * 出金申請 パネル (クリエイター専用)。
 *
 * 表示:
 *   - 出金可能残高
 *   - 出金申請額を入力 (デフォルト = 残高全額)
 *   - 振込手数料 (¥250、クリエイター負担) を控除した最終受取額
 *   - 出金申請ボタン (残高 < ¥5,000 で非活性 + アラート)
 *
 * ボタン押下時のロジックは placeholder (実際の Stripe payout API 連携は
 * 別 PR で追加する想定)。
 */
type Props = {
  availableBalance: number;
  hasBankConnected: boolean;
};

function formatJpy(n: number): string {
  return `¥${Math.max(0, Math.floor(n)).toLocaleString("ja-JP")}`;
}

export function PayoutWithdrawalPanel({
  availableBalance,
  hasBankConnected,
}: Props) {
  const [requestAmount, setRequestAmount] = useState<number>(availableBalance);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const breakdown = useMemo(
    () => computeWithdrawal(availableBalance, requestAmount),
    [availableBalance, requestAmount]
  );

  const underMin = availableBalance < MIN_PAYOUT_AMOUNT;
  const buttonDisabled =
    underMin ||
    !hasBankConnected ||
    !breakdown.eligible ||
    status === "submitting";

  async function handleWithdraw() {
    if (buttonDisabled) return;
    setStatus("submitting");
    setMessage(null);
    try {
      // 現時点は placeholder: Stripe Connect payout API 連携は次 PR
      // 実装では POST /api/payouts/request { amount } → Stripe transfers.create
      await new Promise((r) => setTimeout(r, 800));
      setStatus("done");
      setMessage(
        `出金申請を受け付けました (¥${breakdown.netPayout.toLocaleString()} を Stripe Connect 経由でお振込)`
      );
    } catch {
      setStatus("error");
      setMessage("出金申請に失敗しました。時間をおいて再度お試しください。");
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
          Withdrawal ／ 出金申請
        </p>
      </div>

      {/* 残高表示 */}
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md">
          <Wallet size={20} strokeWidth={2} aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600">出金可能残高</p>
          <p className="font-display mt-1 text-3xl font-black tabular-nums text-gray-900">
            {formatJpy(availableBalance)}
          </p>
        </div>
      </div>

      {/* 最低金額アラート */}
      {underMin && (
        <div className="mx-5 mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertCircle
            size={14}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0"
            aria-hidden
          />
          <span>
            最低出金金額 <b>{formatJpy(MIN_PAYOUT_AMOUNT)}</b> に達していません。
            検収完了案件を積み上げてから出金申請してください。
          </span>
        </div>
      )}

      {/* Stripe Connect 未接続アラート */}
      {!hasBankConnected && !underMin && (
        <div className="mx-5 mb-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <AlertCircle
            size={14}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0"
            aria-hidden
          />
          <span>
            出金を受けるには Stripe Connect (受取口座) の接続が必要です。
            <br />
            ダッシュボード基本情報から接続してください。
          </span>
        </div>
      )}

      {/* 申請額入力 (残高 >= 最低金額 のときのみ表示) */}
      {!underMin && hasBankConnected && (
        <div className="border-t border-gray-100 px-5 py-4">
          <label
            htmlFor="withdraw-amount"
            className="block text-xs font-medium text-gray-700"
          >
            出金申請額 (円)
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="withdraw-amount"
              type="number"
              min={MIN_PAYOUT_AMOUNT}
              max={availableBalance}
              step={100}
              value={requestAmount}
              onChange={(e) => setRequestAmount(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={() => setRequestAmount(availableBalance)}
              className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              全額
            </button>
          </div>

          {/* 内訳 */}
          <dl className="mt-4 space-y-1.5 text-xs text-gray-700">
            <div className="flex justify-between">
              <dt>申請額</dt>
              <dd className="font-mono tabular-nums">
                {formatJpy(breakdown.gross)}
              </dd>
            </div>
            <div className="flex justify-between text-gray-500">
              <dt>振込手数料 (クリエイター負担)</dt>
              <dd className="font-mono tabular-nums">
                − {formatJpy(BANK_TRANSFER_FEE)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-1.5 text-sm font-bold text-gray-900">
              <dt>お受取額</dt>
              <dd className="font-mono tabular-nums">
                {formatJpy(breakdown.netPayout)}
              </dd>
            </div>
          </dl>

          {breakdown.reason && (
            <p className="mt-2 text-xs text-red-600">{breakdown.reason}</p>
          )}
        </div>
      )}

      {/* 出金申請ボタン */}
      <div className="border-t border-gray-100 px-5 py-4">
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={buttonDisabled}
          className="w-full rounded-pill bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:translate-y-0 disabled:hover:shadow-md"
        >
          {status === "submitting" ? "申請中…" : "出金申請する"}
        </button>

        {status === "done" && message && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {message}
          </p>
        )}
        {status === "error" && message && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {message}
          </p>
        )}

        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-500">
          <Info
            size={12}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0"
            aria-hidden
          />
          出金申請後、Stripe Connect 経由で国内銀行口座に振込されます。
          振込手数料 (¥{BANK_TRANSFER_FEE}) はクリエイター負担で申請額から控除されます。
          着金は通常 1〜3 営業日です。
        </p>
      </div>
    </div>
  );
}
