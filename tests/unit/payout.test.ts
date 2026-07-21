import { describe, it, expect } from "vitest";
import {
  MIN_PAYOUT_AMOUNT,
  BANK_TRANSFER_FEE,
  PAYOUT_SCHEDULE_MIN_DAYS,
  computePayoutScheduleDate,
  computeWithdrawal,
  computeAvailableBalance,
} from "@/lib/payout";

describe("computePayoutScheduleDate", () => {
  it("デフォルト = 3 営業日後", () => {
    const src = new Date("2026-07-01T00:00:00Z");
    const scheduled = computePayoutScheduleDate(src);
    expect(scheduled).toBe("2026-07-04");
  });
  it("PAYOUT_SCHEDULE_MIN_DAYS 定数を使用", () => {
    expect(PAYOUT_SCHEDULE_MIN_DAYS).toBe(3);
  });
  it("string 入力も受ける", () => {
    const scheduled = computePayoutScheduleDate("2026-07-01T00:00:00Z");
    expect(scheduled).toBe("2026-07-04");
  });
  it("カスタム日数 (7 日)", () => {
    const scheduled = computePayoutScheduleDate(
      new Date("2026-07-01T00:00:00Z"),
      7
    );
    expect(scheduled).toBe("2026-07-08");
  });
});

describe("computeWithdrawal", () => {
  it("残高 ¥10,000 / 申請 ¥5,000: 手数料控除後の netPayout", () => {
    const b = computeWithdrawal(10_000, 5_000);
    expect(b.gross).toBe(5_000);
    expect(b.netPayout).toBe(5_000 - BANK_TRANSFER_FEE);
    expect(b.eligible).toBe(true);
    expect(b.reason).toBeUndefined();
  });
  it("残高 < 最低 → eligible=false", () => {
    const b = computeWithdrawal(1_000, 1_000);
    expect(b.eligible).toBe(false);
    expect(b.reason).toContain("最低");
  });
  it("申請 > 残高 でも残高上限までに silently cap されて eligible=true", () => {
    // 仕様: gross = min(requested, balance) で丸められる
    const b = computeWithdrawal(5_000, 10_000);
    expect(b.gross).toBe(5_000);
    expect(b.eligible).toBe(true);
  });
  it("最低 (¥5,000) ちょうど OK", () => {
    const b = computeWithdrawal(MIN_PAYOUT_AMOUNT, MIN_PAYOUT_AMOUNT);
    expect(b.eligible).toBe(true);
    expect(b.netPayout).toBe(MIN_PAYOUT_AMOUNT - BANK_TRANSFER_FEE);
  });
});

describe("computeAvailableBalance", () => {
  it("released + pending/scheduled 案件の合計", () => {
    const total = computeAvailableBalance([
      {
        creator_payout: 10_000,
        escrow_status: "released",
        payout_status: "pending",
      },
      {
        creator_payout: 5_000,
        escrow_status: "released",
        payout_status: "scheduled",
      },
      {
        creator_payout: 3_000,
        escrow_status: "released",
        payout_status: "paid",
      }, // paid は除外
      {
        creator_payout: 1_000,
        escrow_status: "held",
        payout_status: "pending",
      }, // held は除外
    ]);
    expect(total).toBe(15_000);
  });
  it("空配列 → 0", () => {
    expect(computeAvailableBalance([])).toBe(0);
  });
  it("null / undefined creator_payout は 0 扱い", () => {
    const total = computeAvailableBalance([
      {
        creator_payout: null,
        escrow_status: "released",
        payout_status: "pending",
      },
    ]);
    expect(total).toBe(0);
  });
});
