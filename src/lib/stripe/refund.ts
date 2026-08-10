import { getStripe } from "@/lib/stripe/server";

/**
 * PaymentIntent の状態を判定して、適切な方法で「返金 or キャンセル」を実行する。
 *
 * 背景 (capture_method='manual' フロー):
 *   - 仮払い直後 (escrow_status='held')   → PI は requires_capture 状態
 *   - 検収完了後 (escrow_status='released')→ PI は succeeded 状態
 *
 * 挙動:
 *   - requires_capture の場合: paymentIntents.cancel でオーソリを解放 (100% 返金相当)。
 *     Stripe の仕様上 partial cancel は不可のため、部分返金指定でも 100% cancel になる。
 *     部分キャンセルが要求された場合は amount_to_capture を使った capture で
 *     差額のみ確定させる (残りは自動リリース)。
 *   - succeeded の場合: refunds.create で部分/全額返金。reverse_transfer +
 *     refund_application_fee を true にして Connect へ流れた分も引き戻す。
 *   - canceled / refunded 等: no-op (成功扱い)。
 *
 * 冪等性: idempotency key を PI id + refundAmount で組み立てるので、
 *   同じ (PI, 額) の refund は Stripe 側で単一実行が保証される。
 *
 * 失敗時: throw する。呼び出し側は DB との整合を担保するためリトライ / 通知する
 *   (現状は console.error して 通知しない — 呼出し元でハンドリング)。
 */
export async function refundOrRelease(params: {
  paymentIntentId: string;
  refundAmount: number; // 円 (JPY はゼロ小数)
  reason?: "cancel" | "dispute_ruling" | "terminate";
}): Promise<{
  action: "cancel" | "refund" | "partial_capture" | "noop";
  stripeId: string | null;
}> {
  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(params.paymentIntentId);

  if (pi.status === "requires_capture") {
    // 仮払い状態 (未 capture)。
    if (params.refundAmount >= (pi.amount ?? 0)) {
      // 全額キャンセル
      const canceled = await stripe.paymentIntents.cancel(pi.id, {
        cancellation_reason: "requested_by_customer",
      });
      return { action: "cancel", stripeId: canceled.id };
    }
    // 部分: 差額のみ capture して残りは自動 release
    const captureAmount = (pi.amount ?? 0) - params.refundAmount;
    if (captureAmount <= 0) {
      const canceled = await stripe.paymentIntents.cancel(pi.id, {
        cancellation_reason: "requested_by_customer",
      });
      return { action: "cancel", stripeId: canceled.id };
    }
    const captured = await stripe.paymentIntents.capture(
      pi.id,
      { amount_to_capture: captureAmount },
      { idempotencyKey: `partial-capture:${pi.id}:${captureAmount}` }
    );
    return { action: "partial_capture", stripeId: captured.id };
  }

  if (pi.status === "succeeded") {
    // 検収済み → refund で払い戻し
    if (params.refundAmount <= 0) {
      return { action: "noop", stripeId: pi.id };
    }
    const refund = await stripe.refunds.create(
      {
        payment_intent: pi.id,
        amount: params.refundAmount,
        reverse_transfer: true,
        refund_application_fee: true,
        reason: "requested_by_customer",
      },
      { idempotencyKey: `refund:${pi.id}:${params.refundAmount}` }
    );
    return { action: "refund", stripeId: refund.id };
  }

  // canceled / requires_payment_method / requires_action 等: 何もできない or 不要
  return { action: "noop", stripeId: pi.id };
}
