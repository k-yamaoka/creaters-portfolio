import { describe, it, expect } from "vitest";
import { computeCancelBreakdown } from "@/lib/cancel-policy";
import type { OrderStatus } from "@/lib/order-status";

/**
 * モンキーテスト: computeCancelBreakdown に大量ランダム入力を投げ、
 * 「返金 + 補償 = basePrice」の不変式が常に成立することを検証。
 * また NaN / null / 負値 / 巨大値 でも例外を投げないことを確認。
 */

const STATUSES: OrderStatus[] = [
  "consultation",
  "quoting",
  "contract",
  "data_sharing",
  "production",
  "revision",
  "delivered",
  "cancelled",
];

function rndPrice(): number {
  const forms = [
    () => Math.floor(Math.random() * 10_000_000), // 通常 0〜1000 万
    () => -Math.floor(Math.random() * 10_000), // 負値
    () => 0,
    () => NaN,
    () => Infinity,
    () => -Infinity,
    () => Math.random(), // 0〜1 の小数
    () => Math.random() * 1e20, // 巨大値
  ];
  return forms[Math.floor(Math.random() * forms.length)]();
}

function rndStatus(): OrderStatus {
  return STATUSES[Math.floor(Math.random() * STATUSES.length)];
}

describe("computeCancelBreakdown FUZZ (5000 iterations)", () => {
  it("例外を投げず、不変式を満たす", () => {
    for (let i = 0; i < 5000; i++) {
      const status = rndStatus();
      const price = rndPrice();
      const result = (() => {
        try {
          return computeCancelBreakdown(status, price);
        } catch (e) {
          // ここに来たら FAIL
          throw new Error(
            `unexpected throw at status=${status} price=${price}: ${e}`
          );
        }
      })();

      if (result === null) {
        // cancelled ステータス は null 想定 (それ以外で null は バグ)
        expect(status).toBe("cancelled");
        continue;
      }

      // 不変式 1: creatorPayout + refundAmount === basePrice (整数)
      expect(result.creatorPayout + result.refundAmount).toBe(result.basePrice);

      // 不変式 2: basePrice / creatorPayout / refundAmount は 非負整数
      expect(result.basePrice).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.basePrice)).toBe(true);
      expect(result.creatorPayout).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.creatorPayout)).toBe(true);
      expect(result.refundAmount).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.refundAmount)).toBe(true);

      // 不変式 3: rate は 0〜1
      expect(result.creatorPayoutRate).toBeGreaterThanOrEqual(0);
      expect(result.creatorPayoutRate).toBeLessThanOrEqual(1);
      expect(result.refundRate).toBeGreaterThanOrEqual(0);
      expect(result.refundRate).toBeLessThanOrEqual(1);

      // 不変式 4: rate 合計 = 1
      expect(result.creatorPayoutRate + result.refundRate).toBe(1);
    }
  });
});
