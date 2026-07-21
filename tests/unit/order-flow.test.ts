import { describe, it, expect } from "vitest";
import {
  deriveFlowState,
  isEscrowFunded,
  canSubmitDelivery,
  evaluateRevisionState,
  flowStateLabel,
} from "@/lib/order-flow";

describe("deriveFlowState — 優先順位ルール", () => {
  it("terminated_at が最強", () => {
    expect(
      deriveFlowState({
        status: "production",
        escrow_status: "held",
        terminated_at: "2026-07-21",
        active_dispute_id: "abc",
      })
    ).toBe("terminated");
  });
  it("active_dispute_id → in_dispute (terminated 次)", () => {
    expect(
      deriveFlowState({
        status: "production",
        escrow_status: "held",
        active_dispute_id: "abc",
      })
    ).toBe("in_dispute");
  });
  it("cancelled ステータス", () => {
    expect(deriveFlowState({ status: "cancelled" })).toBe("cancelled");
  });
  it("delivered + escrow released = completed", () => {
    expect(
      deriveFlowState({ status: "delivered", escrow_status: "released" })
    ).toBe("completed");
  });
  it("delivered のみ = delivered", () => {
    expect(
      deriveFlowState({ status: "delivered", escrow_status: "held" })
    ).toBe("delivered");
  });
  it("data_sharing / production / revision = in_progress", () => {
    expect(deriveFlowState({ status: "data_sharing" })).toBe("in_progress");
    expect(deriveFlowState({ status: "production" })).toBe("in_progress");
    expect(deriveFlowState({ status: "revision" })).toBe("in_progress");
  });
  it("consultation / quoting / contract = pending_payment", () => {
    expect(deriveFlowState({ status: "consultation" })).toBe("pending_payment");
    expect(deriveFlowState({ status: "quoting" })).toBe("pending_payment");
    expect(deriveFlowState({ status: "contract" })).toBe("pending_payment");
  });
});

describe("isEscrowFunded", () => {
  it("held / released が true", () => {
    expect(isEscrowFunded("held")).toBe(true);
    expect(isEscrowFunded("released")).toBe(true);
  });
  it("pending / refunded / null / undefined が false", () => {
    expect(isEscrowFunded("pending")).toBe(false);
    expect(isEscrowFunded("refunded")).toBe(false);
    expect(isEscrowFunded(null)).toBe(false);
    expect(isEscrowFunded(undefined)).toBe(false);
    expect(isEscrowFunded("")).toBe(false);
  });
});

describe("canSubmitDelivery", () => {
  const base = { escrow_status: "held", terminated_at: null, active_dispute_id: null };

  it("production + held → true", () => {
    expect(canSubmitDelivery({ ...base, status: "production" })).toBe(true);
  });
  it("revision + held → true", () => {
    expect(canSubmitDelivery({ ...base, status: "revision" })).toBe(true);
  });
  it("consultation + held でも false (status が違う)", () => {
    expect(canSubmitDelivery({ ...base, status: "consultation" })).toBe(false);
  });
  it("production + pending → false (escrow 不足)", () => {
    expect(
      canSubmitDelivery({
        ...base,
        status: "production",
        escrow_status: "pending",
      })
    ).toBe(false);
  });
  it("production + held + terminated → false", () => {
    expect(
      canSubmitDelivery({
        ...base,
        status: "production",
        terminated_at: "2026-07-21",
      })
    ).toBe(false);
  });
  it("production + held + dispute → false", () => {
    expect(
      canSubmitDelivery({
        ...base,
        status: "production",
        active_dispute_id: "abc",
      })
    ).toBe(false);
  });
  it("delivered + released → false (再納品は revision 経由)", () => {
    expect(
      canSubmitDelivery({
        ...base,
        status: "delivered",
        escrow_status: "released",
      })
    ).toBe(false);
  });
});

describe("evaluateRevisionState", () => {
  it("使用 0 / 上限 1: 残 1、警告なし", () => {
    const s = evaluateRevisionState(0, 1);
    expect(s.remaining).toBe(1);
    expect(s.isLast).toBe(true); // 残 1 = 最後
    expect(s.isOverLimit).toBe(false);
    expect(s.warning).toContain("最後");
  });
  it("使用 0 / 上限 3: 残 3、警告なし", () => {
    const s = evaluateRevisionState(0, 3);
    expect(s.remaining).toBe(3);
    expect(s.isLast).toBe(false);
    expect(s.warning).toBeNull();
  });
  it("使用 2 / 上限 3: 残 1 → 最後 警告", () => {
    const s = evaluateRevisionState(2, 3);
    expect(s.isLast).toBe(true);
    expect(s.warning).toContain("最後");
  });
  it("使用 3 / 上限 3: 上限到達 → 追加発注 警告", () => {
    const s = evaluateRevisionState(3, 3);
    expect(s.isOverLimit).toBe(true);
    expect(s.warning).toContain("追加発注");
  });
  it("使用 5 / 上限 3: 超過も追加発注 警告", () => {
    const s = evaluateRevisionState(5, 3);
    expect(s.isOverLimit).toBe(true);
    expect(s.remaining).toBe(0);
  });
  it("負の値は 0 にクランプ", () => {
    const s = evaluateRevisionState(-1, -1);
    expect(s.used).toBe(0);
    expect(s.max).toBe(0);
  });
});

describe("flowStateLabel", () => {
  it("全 7 状態にラベルあり", () => {
    expect(flowStateLabel("pending_payment")).toBe("仮払い待ち");
    expect(flowStateLabel("in_progress")).toBe("進行中");
    expect(flowStateLabel("delivered")).toContain("納品");
    expect(flowStateLabel("in_dispute")).toContain("裁定");
    expect(flowStateLabel("completed")).toBe("完了");
    expect(flowStateLabel("terminated")).toBe("途中終了");
    expect(flowStateLabel("cancelled")).toBe("キャンセル");
  });
});
