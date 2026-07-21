import { describe, it, expect } from "vitest";
import {
  deriveFlowState,
  canSubmitDelivery,
  evaluateRevisionState,
} from "@/lib/order-flow";

const STATUSES = [
  "consultation",
  "quoting",
  "contract",
  "data_sharing",
  "production",
  "revision",
  "delivered",
  "cancelled",
  "unknown_status", // 未知値
  "",
  null,
];
const ESCROW = ["pending", "held", "released", "refunded", null, undefined, ""];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

describe("deriveFlowState FUZZ (2000 iterations)", () => {
  it("例外を投げず、既知 flow_state に落ちる", () => {
    const validStates = new Set([
      "pending_payment",
      "in_progress",
      "delivered",
      "in_dispute",
      "completed",
      "terminated",
      "cancelled",
    ]);
    for (let i = 0; i < 2000; i++) {
      const input = {
        status: pick(STATUSES) as string,
        escrow_status: pick(ESCROW) as string | null | undefined,
        terminated_at: Math.random() < 0.15 ? "2026-07-21" : null,
        active_dispute_id: Math.random() < 0.15 ? "abc-123" : null,
      };
      const s = deriveFlowState(input);
      expect(validStates.has(s)).toBe(true);
    }
  });
});

describe("canSubmitDelivery FUZZ (2000 iterations)", () => {
  it("常に boolean を返し、pending_payment 状態からは false", () => {
    for (let i = 0; i < 2000; i++) {
      const status = pick(STATUSES) as string;
      const input = {
        status,
        escrow_status: pick(ESCROW) as string | null | undefined,
        terminated_at: Math.random() < 0.1 ? "2026-07-21" : null,
        active_dispute_id: Math.random() < 0.1 ? "abc-123" : null,
      };
      const can = canSubmitDelivery(input);
      expect(typeof can).toBe("boolean");
      // status が production/revision 以外なら 必ず false
      if (status !== "production" && status !== "revision") {
        expect(can).toBe(false);
      }
      // terminated / dispute のとき 必ず false
      if (input.terminated_at || input.active_dispute_id) {
        expect(can).toBe(false);
      }
      // escrow が held/released 以外なら 必ず false
      if (input.escrow_status !== "held" && input.escrow_status !== "released") {
        expect(can).toBe(false);
      }
    }
  });
});

describe("evaluateRevisionState FUZZ (1000 iterations)", () => {
  it("remaining は非負、warning は null または非空 string", () => {
    for (let i = 0; i < 1000; i++) {
      const used = Math.floor((Math.random() - 0.3) * 20); // -6 〜 14
      const max = Math.floor(Math.random() * 10) - 3; // -3 〜 6
      const s = evaluateRevisionState(used, max);
      expect(s.remaining).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(s.remaining)).toBe(true);
      expect(s.used).toBeGreaterThanOrEqual(0);
      expect(s.max).toBeGreaterThanOrEqual(0);
      if (s.warning !== null) {
        expect(typeof s.warning).toBe("string");
        expect(s.warning.length).toBeGreaterThan(0);
      }
      // isOverLimit と isLast は互いに排他 (except when max=0 で used=0)
      if (s.isOverLimit && s.max > 0) {
        expect(s.isLast).toBe(false);
        expect(s.remaining).toBe(0);
      }
    }
  });
});
