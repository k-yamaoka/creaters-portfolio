import { describe, it, expect } from "vitest";
import {
  ENTERPRISE_FEE_RATE,
  calculateClientBilling,
  formatEnterpriseFeePercent,
  formatJpy,
} from "@/lib/enterprise-fee";

describe("ENTERPRISE_FEE_RATE", () => {
  it("15% 固定", () => {
    expect(ENTERPRISE_FEE_RATE).toBe(0.15);
  });
});

describe("calculateClientBilling", () => {
  it("¥100,000 → 手数料 ¥15,000 / 総額 ¥115,000", () => {
    const b = calculateClientBilling(100_000);
    expect(b.basePrice).toBe(100_000);
    expect(b.systemFee).toBe(15_000);
    expect(b.totalAmount).toBe(115_000);
    expect(b.feeRate).toBe(0.15);
  });
  it("¥1 → 手数料 ¥0 (floor) / 総額 ¥1", () => {
    const b = calculateClientBilling(1);
    expect(b.systemFee).toBe(0);
    expect(b.totalAmount).toBe(1);
  });
  it("端数は floor", () => {
    const b = calculateClientBilling(12_345);
    expect(b.systemFee).toBe(Math.floor(12_345 * 0.15)); // 1851
    expect(b.totalAmount).toBe(12_345 + 1851);
  });
  it("負 / NaN / Infinity → 0", () => {
    expect(calculateClientBilling(-1000).basePrice).toBe(0);
    expect(calculateClientBilling(NaN).basePrice).toBe(0);
    expect(calculateClientBilling(Infinity).basePrice).toBe(0);
  });
});

describe("formatEnterpriseFeePercent", () => {
  it("15% 表示", () => {
    expect(formatEnterpriseFeePercent()).toContain("15");
  });
});

describe("formatJpy", () => {
  it("カンマ区切り + ¥", () => {
    expect(formatJpy(100_000)).toBe("¥100,000");
    expect(formatJpy(1_000_000)).toBe("¥1,000,000");
  });
  it("0 は ¥0", () => {
    expect(formatJpy(0)).toBe("¥0");
  });
  it("負は ¥0 にクランプ", () => {
    expect(formatJpy(-100)).toBe("¥0");
  });
});
