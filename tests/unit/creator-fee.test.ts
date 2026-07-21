import { describe, it, expect } from "vitest";
import {
  resolveCreatorFeeRate,
  calculateCreatorPayout,
  DEFAULT_CREATOR_FEE_RATE,
  MAX_CREATOR_FEE_RATE,
} from "@/lib/creator-fee";

describe("resolveCreatorFeeRate — 優先順位", () => {
  it("is_early_member=true は強制 0% (custom_fee_rate があっても)", () => {
    const r = resolveCreatorFeeRate({
      isEarlyMember: true,
      customFeeRate: 0.05,
    });
    expect(r.rate).toBe(0);
    expect(r.model).toBe("early_member");
  });
  it("custom_fee_rate が有効なら適用", () => {
    const r = resolveCreatorFeeRate({
      isEarlyMember: false,
      customFeeRate: 0.05,
    });
    expect(r.rate).toBe(0.05);
    expect(r.model).toBe("custom");
  });
  it("custom_fee_rate null → default", () => {
    const r = resolveCreatorFeeRate({
      isEarlyMember: false,
      customFeeRate: null,
    });
    expect(r.rate).toBe(DEFAULT_CREATOR_FEE_RATE);
    expect(r.model).toBe("default");
  });
  it("custom_fee_rate が範囲外 → default にフォールバック", () => {
    expect(
      resolveCreatorFeeRate({
        isEarlyMember: false,
        customFeeRate: MAX_CREATOR_FEE_RATE + 0.01,
      }).model
    ).toBe("default");
    expect(
      resolveCreatorFeeRate({ isEarlyMember: false, customFeeRate: -0.01 })
        .model
    ).toBe("default");
    expect(
      resolveCreatorFeeRate({ isEarlyMember: false, customFeeRate: NaN }).model
    ).toBe("default");
  });
  it("custom_fee_rate 上限ちょうど OK", () => {
    const r = resolveCreatorFeeRate({
      isEarlyMember: false,
      customFeeRate: MAX_CREATOR_FEE_RATE,
    });
    expect(r.rate).toBe(MAX_CREATOR_FEE_RATE);
    expect(r.model).toBe("custom");
  });
});

describe("calculateCreatorPayout — 内訳計算", () => {
  it("早期メンバー: 100% 満額", () => {
    const b = calculateCreatorPayout(100000, {
      isEarlyMember: true,
      customFeeRate: null,
    });
    expect(b.platformFee).toBe(0);
    expect(b.creatorPayout).toBe(100000);
    expect(b.model).toBe("early_member");
  });
  it("デフォルト (現在 0%): 満額", () => {
    const b = calculateCreatorPayout(100000, {
      isEarlyMember: false,
      customFeeRate: null,
    });
    expect(b.platformFee).toBe(0);
    expect(b.creatorPayout).toBe(100000);
  });
  it("custom 5%: 5000 controlled", () => {
    const b = calculateCreatorPayout(100000, {
      isEarlyMember: false,
      customFeeRate: 0.05,
    });
    expect(b.platformFee).toBe(5000);
    expect(b.creatorPayout).toBe(95000);
  });
  it("端数は floor (プラットフォーム有利)", () => {
    const b = calculateCreatorPayout(12345, {
      isEarlyMember: false,
      customFeeRate: 0.03,
    });
    expect(b.platformFee).toBe(Math.floor(12345 * 0.03)); // 370
    expect(b.creatorPayout).toBe(12345 - 370);
  });
  it("負の gross は 0 にクランプ", () => {
    const b = calculateCreatorPayout(-1000, {
      isEarlyMember: false,
      customFeeRate: null,
    });
    expect(b.gross).toBe(0);
    expect(b.creatorPayout).toBe(0);
  });
});
