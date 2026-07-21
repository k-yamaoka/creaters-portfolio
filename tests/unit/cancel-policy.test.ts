import { describe, it, expect } from "vitest";
import {
  stageFromOrderStatus,
  creatorPayoutRateForStage,
  computeCancelBreakdown,
} from "@/lib/cancel-policy";

describe("stageFromOrderStatus", () => {
  it("pre_start segment", () => {
    expect(stageFromOrderStatus("consultation")).toBe("pre_start");
    expect(stageFromOrderStatus("quoting")).toBe("pre_start");
    expect(stageFromOrderStatus("contract")).toBe("pre_start");
    expect(stageFromOrderStatus("data_sharing")).toBe("pre_start");
  });
  it("in_progress segment", () => {
    expect(stageFromOrderStatus("production")).toBe("in_progress");
    expect(stageFromOrderStatus("revision")).toBe("in_progress");
  });
  it("delivered segment", () => {
    expect(stageFromOrderStatus("delivered")).toBe("delivered");
  });
  it("cancelled returns null (no active cancel stage)", () => {
    expect(stageFromOrderStatus("cancelled")).toBeNull();
  });
});

describe("creatorPayoutRateForStage", () => {
  it("pre_start = 0%", () => {
    expect(creatorPayoutRateForStage("pre_start")).toBe(0);
  });
  it("in_progress = 50%", () => {
    expect(creatorPayoutRateForStage("in_progress")).toBe(0.5);
  });
  it("delivered = 100%", () => {
    expect(creatorPayoutRateForStage("delivered")).toBe(1.0);
  });
});

describe("computeCancelBreakdown", () => {
  it("pre_start: 全額返金 / クリエイター補償 0", () => {
    const b = computeCancelBreakdown("contract", 100000);
    expect(b).not.toBeNull();
    expect(b!.stage).toBe("pre_start");
    expect(b!.creatorPayout).toBe(0);
    expect(b!.refundAmount).toBe(100000);
    expect(b!.creatorPayoutRate).toBe(0);
    expect(b!.refundRate).toBe(1);
  });
  it("in_progress: 50% 返金 / 50% 補償", () => {
    const b = computeCancelBreakdown("production", 100000);
    expect(b!.stage).toBe("in_progress");
    expect(b!.creatorPayout).toBe(50000);
    expect(b!.refundAmount).toBe(50000);
  });
  it("delivered: 補償 100% / 返金 0", () => {
    const b = computeCancelBreakdown("delivered", 100000);
    expect(b!.stage).toBe("delivered");
    expect(b!.creatorPayout).toBe(100000);
    expect(b!.refundAmount).toBe(0);
  });
  it("端数は floor (プラットフォーム有利側 = クリエイター補償が若干減る)", () => {
    const b = computeCancelBreakdown("production", 12345);
    expect(b!.creatorPayout).toBe(6172); // floor(12345 * 0.5)
    expect(b!.refundAmount).toBe(6173); // 12345 - 6172
  });
  it("basePrice 0 の境界: 全項目 0", () => {
    const b = computeCancelBreakdown("production", 0);
    expect(b!.creatorPayout).toBe(0);
    expect(b!.refundAmount).toBe(0);
  });
  it("負の basePrice は 0 にクランプ", () => {
    const b = computeCancelBreakdown("production", -1000);
    expect(b!.creatorPayout).toBe(0);
    expect(b!.refundAmount).toBe(0);
  });
  it("cancelled ステータスは stage 導出不可 → null", () => {
    expect(computeCancelBreakdown("cancelled", 100000)).toBeNull();
  });
  it("overrideStage で明示指定できる", () => {
    const b = computeCancelBreakdown("cancelled", 100000, "delivered");
    expect(b!.stage).toBe("delivered");
    expect(b!.creatorPayout).toBe(100000);
  });
  it("stageLabel / description が返る", () => {
    const b = computeCancelBreakdown("production", 50000);
    expect(b!.stageLabel).toBe("制作中");
    expect(b!.description).toContain("50%");
  });
});
