import { Info } from "lucide-react";
import {
  calculateClientBilling,
  formatEnterpriseFeePercent,
  formatJpy,
  ENTERPRISE_FEE_RATE,
} from "@/lib/enterprise-fee";

/**
 * 企業 (発注側) 向け 明細表示コンポーネント。
 *
 * 見積もり確認 / 決済確認 画面で「透明性の高い明細」として使う。
 *
 * 表示例:
 *   クリエイター報酬         ¥100,000
 *   システム利用料 (15%)      ¥15,000
 *   ─────────────
 *   合計請求額               ¥115,000
 *
 * 使い方:
 *   <ClientBillingBreakdown basePrice={100000} />
 *
 * 安全性:
 *   basePrice は必ずバックエンドで確定した値を渡すこと。
 *   フロントで計算した値をそのまま金額として送信・保存しないこと。
 *   本コンポーネントは lib/enterprise-fee.ts の calculateClientBilling を
 *   使って表示専用に再計算するだけで、金額の"確定"は API 側が担う。
 */
type Props = {
  /** クリエイター提示額 (= クリエイター受取額) — サーバから取得した値 */
  basePrice: number;
  /**
   * 事前計算済の system_fee / total_amount がある場合はそちらを優先表示。
   * サーバ側で保存された order.system_fee / order.total_amount を渡すと、
   * (稀に) 過去の税率で確定された取引の値と一致させられる。
   */
  systemFeeOverride?: number;
  totalAmountOverride?: number;
  className?: string;
};

export function ClientBillingBreakdown({
  basePrice,
  systemFeeOverride,
  totalAmountOverride,
  className = "",
}: Props) {
  const calc = calculateClientBilling(basePrice);
  const systemFee = systemFeeOverride ?? calc.systemFee;
  const total = totalAmountOverride ?? calc.totalAmount;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
          Billing breakdown ／ ご請求内訳
        </p>
      </div>
      <div className="divide-y divide-gray-100 px-5 py-3">
        <div className="flex items-baseline justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">クリエイター報酬</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              クリエイターへ全額支払われます
            </p>
          </div>
          <p className="font-display text-base font-bold tabular-nums text-gray-900">
            {formatJpy(calc.basePrice)}
          </p>
        </div>
        <div className="flex items-baseline justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              システム利用料 ({formatEnterpriseFeePercent(ENTERPRISE_FEE_RATE)})
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              取引管理・エスクロー・チャット等の運営費用
            </p>
          </div>
          <p className="font-display text-base font-bold tabular-nums text-gray-900">
            {formatJpy(systemFee)}
          </p>
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t-2 border-gray-900 px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            Total ／ 合計請求額
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            税込 (JPY) ／ 決済時にエスクロー預託
          </p>
        </div>
        <p className="font-display text-2xl font-black tabular-nums text-gray-900">
          {formatJpy(total)}
        </p>
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-600">
          <Info
            size={12}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0 text-gray-500"
            aria-hidden
          />
          クリエイターは検収完了後に「クリエイター報酬」全額を受け取ります。
          システム利用料は AILIER の運営費用として充当されます。
        </p>
      </div>
    </div>
  );
}
