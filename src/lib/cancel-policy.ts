/**
 * キャンセル ポリシー計算ユーティリティ (A-4 実装 2026-07-15)。
 *
 * ビジネス要件:
 *   - 発注後のキャンセル時のクリエイター報酬割合:
 *       着手前 (consultation / quoting / contract / data_sharing) → 0%
 *       制作中 (production / revision)                             → 50%
 *       納品後 (delivered)                                         → 100%
 *   - クライアントへの返金額 = base_price × (1 - creator_payout_rate)
 *
 * DB (00069) の CHECK 制約と cancel_stage の enum を必ず同期させる。
 */

import type { OrderStatus } from "@/lib/order-status";

export type CancelStage = "pre_start" | "in_progress" | "delivered";

export type CancelBreakdown = {
  /** 段階識別子 (DB 保存用) */
  stage: CancelStage;
  /** UI 表示用のラベル */
  stageLabel: string;
  /** クリエイター補償率 (0.0 〜 1.0) */
  creatorPayoutRate: number;
  /** クライアント返金率 (1 - creatorPayoutRate) */
  refundRate: number;
  /** クリエイター補償額 (円) */
  creatorPayout: number;
  /** クライアント返金額 (円) */
  refundAmount: number;
  /** 元の発注金額 (円) */
  basePrice: number;
  /** 人間向け説明文 */
  description: string;
};

/**
 * 現在の order.status からキャンセル段階を判定する。
 * cancelled ステータスの場合は cancel_stage 側 (DB 保存値) を優先すべきなので
 * null を返す。
 */
export function stageFromOrderStatus(status: OrderStatus): CancelStage | null {
  switch (status) {
    case "consultation":
    case "quoting":
    case "contract":
    case "data_sharing":
      return "pre_start";
    case "production":
    case "revision":
      return "in_progress";
    case "delivered":
      return "delivered";
    case "cancelled":
      return null;
    default:
      return null;
  }
}

/**
 * 段階ごとのクリエイター補償率。
 * 変更する場合は DB 00069 の コメントと /terms の記載も同時更新する。
 */
export function creatorPayoutRateForStage(stage: CancelStage): number {
  switch (stage) {
    case "pre_start":
      return 0.0;
    case "in_progress":
      return 0.5;
    case "delivered":
      return 1.0;
  }
}

function stageLabelJp(stage: CancelStage): string {
  switch (stage) {
    case "pre_start":
      return "着手前";
    case "in_progress":
      return "制作中";
    case "delivered":
      return "納品後";
  }
}

function stageDescriptionJp(stage: CancelStage): string {
  switch (stage) {
    case "pre_start":
      return "着手前のキャンセルはクリエイターへの報酬は発生せず、仮払い金は全額クライアントへ返金されます。";
    case "in_progress":
      return "制作中のキャンセルはクリエイターに 50% の報酬が支払われ、残りの 50% がクライアントへ返金されます。";
    case "delivered":
      return "納品後のキャンセルはクリエイターに 100% の報酬が支払われ、返金は行われません。";
  }
}

/**
 * ステータスから料金内訳を計算する (UI プレビュー用)。
 * status が cancelled の場合は DB の cancel_stage を渡して呼び出す。
 */
export function computeCancelBreakdown(
  status: OrderStatus,
  basePrice: number,
  overrideStage?: CancelStage
): CancelBreakdown | null {
  const stage = overrideStage ?? stageFromOrderStatus(status);
  if (!stage) return null;

  // NaN / ±Infinity / 負値を 0 にクランプ (2026-07-21 fuzz テストで発覚した Infinity バグ対策)
  const safeBase =
    Number.isFinite(basePrice) && basePrice > 0
      ? Math.floor(basePrice)
      : 0;
  const payoutRate = creatorPayoutRateForStage(stage);
  const creatorPayout = Math.floor(safeBase * payoutRate);
  const refundAmount = safeBase - creatorPayout;

  return {
    stage,
    stageLabel: stageLabelJp(stage),
    creatorPayoutRate: payoutRate,
    refundRate: 1 - payoutRate,
    creatorPayout,
    refundAmount,
    basePrice: safeBase,
    description: stageDescriptionJp(stage),
  };
}
