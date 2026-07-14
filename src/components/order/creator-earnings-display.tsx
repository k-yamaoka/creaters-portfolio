import { Coins } from "lucide-react";
import { formatJpy } from "@/lib/enterprise-fee";

/**
 * クリエイター (受注側) 向け 受取表示コンポーネント。
 *
 * ビジネス要件:
 *   企業がいくら支払っているか (手数料込みの total_amount) は原則表示せず、
 *   「あなたの受取予定額」だけをシンプルに提示する。
 *
 * 表示例:
 *   あなたの受取予定額
 *   ¥100,000
 *   検収完了後に お振込
 *
 * 使い方:
 *   <CreatorEarningsDisplay creatorPayout={100000} status="pending" />
 */
type Props = {
  /** クリエイターへの支払額 (= base_price、custom_fee_rate 適用後) */
  creatorPayout: number;
  /**
   * 支払いステータス (表示補助):
   *  - "pending"    : まだ検収前 (受取予定額)
   *  - "escrowed"   : エスクロー預託済 (検収待ち)
   *  - "delivered"  : 納品済 (検収待ち)
   *  - "settled"    : 送金完了 (受取済)
   */
  status?: "pending" | "escrowed" | "delivered" | "settled";
  className?: string;
};

const STATUS_LABEL: Record<NonNullable<Props["status"]>, string> = {
  pending: "受取予定額 ／ 検収完了後にお振込",
  escrowed: "エスクロー預託済 ／ 納品→検収でお振込",
  delivered: "納品済 ／ クライアントの検収待ち",
  settled: "送金完了 ／ お受取済",
};

export function CreatorEarningsDisplay({
  creatorPayout,
  status = "pending",
  className = "",
}: Props) {
  const isSettled = status === "settled";
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-start gap-4 p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md ${
            isSettled
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
              : "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white"
          }`}
        >
          <Coins size={20} strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            Your earnings ／ あなたの受取
            {isSettled ? "額" : "予定額"}
          </p>
          <p
            className={`font-display mt-1 text-3xl font-black tabular-nums ${
              isSettled ? "text-emerald-600" : "text-gray-900"
            }`}
          >
            {formatJpy(creatorPayout)}
          </p>
          <p className="mt-2 text-xs text-gray-600">{STATUS_LABEL[status]}</p>
        </div>
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
        <p className="text-[11px] leading-relaxed text-gray-600">
          クリエイター向けシステム手数料は{" "}
          <span className="font-bold text-gray-900">0%</span>{" "}
          です。提示した見積もり額がそのまま受取額になります。
        </p>
      </div>
    </div>
  );
}
