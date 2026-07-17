/**
 * 取引フロー状態 (Trust & Safety 用のカテゴリカル状態)。
 *
 * 仕様書 (2026-07-16) の `pending_payment / in_progress / delivered /
 * in_dispute / completed / terminated` の 6 段階を、既存の
 * order_status + escrow_status + terminated_at + active_dispute_id
 * から導出する。
 *
 * 既存の細かい status (consultation / quoting / ...) は温存し、
 * UI での粗粒度な "何をすべきか" 判定 (仮払いブロック / 納品不可 /
 * 運営裁定中バッジ) に本モジュールを使う。
 */

import type { OrderStatus } from "./order-status";

export type FlowState =
  | "pending_payment"  // 仮払い前 (作業開始してはいけない)
  | "in_progress"      // 制作中 (納品可能)
  | "delivered"        // 納品済み (検収待ち)
  | "in_dispute"       // 運営裁定中
  | "completed"        // 完了 (検収済み + 支払確定)
  | "terminated"       // 途中終了 (合意解約)
  | "cancelled";       // 単独キャンセル (00069)

export type OrderFlowInput = {
  status: OrderStatus | string;
  escrow_status?: string | null;
  terminated_at?: string | null;
  active_dispute_id?: string | null;
};

/**
 * 導出ルール (優先順位): 上ほど強い
 *  1. terminated_at セット → terminated
 *  2. active_dispute_id セット → in_dispute
 *  3. status='cancelled' → cancelled
 *  4. status='delivered' + escrow_status='released' → completed
 *  5. status='delivered' → delivered
 *  6. status in (data_sharing / production / revision) → in_progress
 *  7. その他 (consultation / quoting / contract) → pending_payment
 */
export function deriveFlowState(input: OrderFlowInput): FlowState {
  if (input.terminated_at) return "terminated";
  if (input.active_dispute_id) return "in_dispute";
  if (input.status === "cancelled") return "cancelled";
  if (input.status === "delivered") {
    return input.escrow_status === "released" ? "completed" : "delivered";
  }
  if (
    input.status === "data_sharing" ||
    input.status === "production" ||
    input.status === "revision"
  ) {
    return "in_progress";
  }
  return "pending_payment";
}

/** UI 表示用の日本語ラベル */
export function flowStateLabel(state: FlowState): string {
  switch (state) {
    case "pending_payment":
      return "仮払い待ち";
    case "in_progress":
      return "進行中";
    case "delivered":
      return "納品済み (検収待ち)";
    case "in_dispute":
      return "運営裁定中";
    case "completed":
      return "完了";
    case "terminated":
      return "途中終了";
    case "cancelled":
      return "キャンセル";
  }
}

/**
 * escrow 状態から「仮払いが完了しているか」を判定。
 * held (仮払い済) / released (支払確定) のみ true。
 */
export function isEscrowFunded(escrowStatus: string | null | undefined): boolean {
  return escrowStatus === "held" || escrowStatus === "released";
}

/**
 * 納品ボタンを有効化してよいかの guard。
 * (production / revision) かつ 仮払い済 のときのみ true。
 * status='delivered' からの再納品は revision 経由なので false。
 */
export function canSubmitDelivery(input: OrderFlowInput): boolean {
  if (input.status !== "production" && input.status !== "revision") {
    return false;
  }
  if (!isEscrowFunded(input.escrow_status)) return false;
  if (input.terminated_at || input.active_dispute_id) return false;
  return true;
}

/** 修正回数の使用状況から警告メッセージを算出 */
export type RevisionState = {
  used: number;
  max: number;
  remaining: number;
  isLast: boolean;   // これが最後の無償修正
  isOverLimit: boolean; // 上限超過 (追加発注扱い)
  warning: string | null;
};

export function evaluateRevisionState(
  used: number,
  max: number
): RevisionState {
  const safeUsed = Math.max(0, used | 0);
  const safeMax = Math.max(0, max | 0);
  const remaining = Math.max(0, safeMax - safeUsed);
  const isOverLimit = safeUsed >= safeMax;
  const isLast = remaining === 1;

  let warning: string | null = null;
  if (isOverLimit) {
    warning =
      "⚠️ 合意した修正回数の上限に達しました。これ以降の修正対応は追加発注 (別料金) の対象となります。運営に相談される場合は「運営に相談する」ボタンからご連絡ください。";
  } else if (isLast) {
    warning =
      "⚠️ これが最後の無償修正です。次回以降の修正対応は追加発注の対象となります。";
  }

  return {
    used: safeUsed,
    max: safeMax,
    remaining,
    isLast,
    isOverLimit,
    warning,
  };
}
