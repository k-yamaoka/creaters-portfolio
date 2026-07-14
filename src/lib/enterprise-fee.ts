/**
 * 企業 (発注側) 手数料モデル 計算ユーティリティ。
 *
 * ビジネス要件 (2026-07-14):
 *   - クリエイターの提示額 (base_price) は クリエイターの受取額そのもの
 *   - 企業には base_price に 15% のサービス手数料 (system_fee) を上乗せ請求
 *   - 総請求額 total_amount = base_price + system_fee
 *
 * 例:
 *   base_price = ¥100,000
 *   system_fee = ¥15,000  (100,000 × 0.15)
 *   total     = ¥115,000  (100,000 + 15,000)
 *
 * セキュリティ方針:
 *   金額計算は必ずバックエンドで実行し、
 *   フロントエンドから渡された金額はそのまま信用しない (base_price だけを受け取り、
 *   system_fee / total_amount は必ず本関数で再計算してから DB に保存する)。
 */

/**
 * 企業 (発注側) から徴収するシステム手数料率 (0.15 = 15%)。
 * 一箇所集約: 将来この値だけを変更すれば全社レートを一括切替できる。
 */
export const ENTERPRISE_FEE_RATE = 0.15;

export type EnterpriseBillingBreakdown = {
  /** クリエイターが提示した基本報酬額 (=クリエイターの受取額) */
  basePrice: number;
  /** 企業から徴収する 15% のサービス手数料 (円、floor) */
  systemFee: number;
  /** 企業への総請求額 = base + fee */
  totalAmount: number;
  /** 適用された手数料率 (常に ENTERPRISE_FEE_RATE) */
  feeRate: number;
};

/**
 * クリエイター提示額 (base_price) を受け取り、企業への請求内訳を返す。
 * 銭 未満は floor (企業有利側、over-charge しない)。
 *
 * 入力バリデーション:
 *  - 負値 / NaN / Infinity は 0 に丸める
 *  - 小数円は floor
 */
export function calculateClientBilling(
  basePrice: number
): EnterpriseBillingBreakdown {
  const safeBase =
    Number.isFinite(basePrice) && basePrice > 0
      ? Math.floor(basePrice)
      : 0;
  const systemFee = Math.floor(safeBase * ENTERPRISE_FEE_RATE);
  return {
    basePrice: safeBase,
    systemFee,
    totalAmount: safeBase + systemFee,
    feeRate: ENTERPRISE_FEE_RATE,
  };
}

/**
 * 手数料率をパーセント表示文字列にする (UI 表示用)。
 * 0.15 → "15%"、0.075 → "7.5%"
 */
export function formatEnterpriseFeePercent(
  rate: number = ENTERPRISE_FEE_RATE
): string {
  const pct = rate * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

/**
 * 金額を日本円表記に (¥1,234,567)。
 */
export function formatJpy(amount: number): string {
  return `¥${Math.max(0, Math.floor(amount || 0)).toLocaleString("ja-JP")}`;
}
