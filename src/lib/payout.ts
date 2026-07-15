/**
 * クリエイター出金 (payout) 管理ユーティリティ。
 *
 * ビジネス要件 (A-3, 2026-07-14):
 *   - 検収完了 (escrow_status=released) 後 3〜7 営業日以内に入金
 *   - 最低出金金額: ¥5,000 未満は出金申請不可
 *   - 振込手数料: クリエイター負担、出金額から控除
 *   - 出金先: 国内銀行振込 (Stripe Connect 経由)
 *
 * 定数を一箇所に集約: 規約変更時にこの値だけ変更すれば全社レートを一括切替。
 */

/** 最低出金金額 (円)。この未満は出金申請ボタン非活性 */
export const MIN_PAYOUT_AMOUNT = 5000;

/**
 * 振込手数料 (円、プレースホルダー)。
 * 国内銀行 3 万円未満 = 250 円が業界平均。実運用では:
 *  - Stripe Connect の場合、Stripe が徴収する固定手数料 + 送金額の 0.25% 等
 *  - ゆうちょ / メガバンク / ネット銀行で異なる → 出金先で分岐が必要
 * 本値は「暫定的な平均値」として UI 表示に利用。実際の徴収額は
 * Stripe payout 実行時のログで確定する。
 */
export const BANK_TRANSFER_FEE = 250;

/** 検収完了から入金までの営業日数 (規約準拠 3〜7 日) */
export const PAYOUT_SCHEDULE_MIN_DAYS = 3;
export const PAYOUT_SCHEDULE_MAX_DAYS = 7;

/** payout_status enum (DB CHECK 制約と同期) */
export type PayoutStatus = "pending" | "scheduled" | "paid" | "failed";

/**
 * 検収完了日時 (inspected_at) から入金予定日を算出。
 * デフォルト 3 日後 (最短)。JS Date で日付加算 → YYYY-MM-DD を返す。
 * 土日祝日調整は行わない (Stripe 側で送金実行タイミングを吸収するため)。
 */
export function computePayoutScheduleDate(
  inspectedAt: Date | string,
  daysUntilPayout: number = PAYOUT_SCHEDULE_MIN_DAYS
): string {
  const src =
    typeof inspectedAt === "string" ? new Date(inspectedAt) : inspectedAt;
  const dst = new Date(src.getTime() + daysUntilPayout * 86_400_000);
  // YYYY-MM-DD (UTC 基準、日本の date 型と一致)
  return dst.toISOString().slice(0, 10);
}

/**
 * 出金申請時の内訳を算出。
 * @param availableBalance 出金可能残高 (円)
 * @param requestAmount    出金申請額 (円、省略時は残高全額)
 */
export type WithdrawalBreakdown = {
  /** 申請額 (=控除前の gross) */
  gross: number;
  /** 振込手数料 (円、クリエイター負担) */
  transferFee: number;
  /** 実際に振り込まれる額 (= gross - transferFee) */
  netPayout: number;
  /** 最低金額 (¥5,000) を満たしているか */
  eligible: boolean;
  /** eligible=false のときの UI 表示用メッセージ */
  reason?: string;
};

export function computeWithdrawal(
  availableBalance: number,
  requestAmount?: number
): WithdrawalBreakdown {
  const balance = Math.max(0, Math.floor(availableBalance || 0));
  const requested =
    requestAmount === undefined
      ? balance
      : Math.max(0, Math.floor(requestAmount || 0));
  const gross = Math.min(requested, balance);

  if (gross < MIN_PAYOUT_AMOUNT) {
    return {
      gross,
      transferFee: BANK_TRANSFER_FEE,
      netPayout: 0,
      eligible: false,
      reason: `最低出金金額 ¥${MIN_PAYOUT_AMOUNT.toLocaleString()} に達していません`,
    };
  }
  if (gross > balance) {
    return {
      gross,
      transferFee: BANK_TRANSFER_FEE,
      netPayout: 0,
      eligible: false,
      reason: "出金可能残高を超えています",
    };
  }

  // 振込手数料を控除、残る額 (=クリエイターの実受取)
  const netPayout = Math.max(0, gross - BANK_TRANSFER_FEE);
  return {
    gross,
    transferFee: BANK_TRANSFER_FEE,
    netPayout,
    eligible: true,
  };
}

/**
 * 出金可能残高を集計する (creator_payout の合計)。
 * 対象:
 *   escrow_status='released' かつ payout_status IN ('pending','scheduled')
 * (paid / failed は集計対象外)
 */
export type PayoutRow = {
  creator_payout: number | null;
  escrow_status: string | null;
  payout_status: PayoutStatus | null;
};

export function computeAvailableBalance(orders: PayoutRow[]): number {
  let total = 0;
  for (const o of orders ?? []) {
    if (o.escrow_status !== "released") continue;
    const status = o.payout_status ?? "pending";
    if (status === "paid" || status === "failed") continue;
    total += Math.max(0, Math.floor(o.creator_payout ?? 0));
  }
  return total;
}
