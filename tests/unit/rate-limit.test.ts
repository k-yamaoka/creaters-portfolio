import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// rate-limit はプロセス内 Map を使うので、テスト間で key を分けて衝突回避

describe("checkRateLimit", () => {
  it("最初のリクエストは通る", () => {
    const r = checkRateLimit("k1", 3, 60);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(2);
  });
  it("limit 到達で 4 回目が block", () => {
    checkRateLimit("k2", 3, 60);
    checkRateLimit("k2", 3, 60);
    checkRateLimit("k2", 3, 60);
    const r = checkRateLimit("k2", 3, 60);
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });
  it("別 key は独立", () => {
    checkRateLimit("k3", 1, 60);
    const r = checkRateLimit("k3-other", 1, 60);
    expect(r.ok).toBe(true);
  });
  it("windowSec 経過で reset (fake timers)", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-07-21T00:00:00Z"));
      checkRateLimit("k4", 1, 10);
      const blocked = checkRateLimit("k4", 1, 10);
      expect(blocked.ok).toBe(false);
      // 11 秒進めて reset
      vi.setSystemTime(new Date("2026-07-21T00:00:11Z"));
      const reopened = checkRateLimit("k4", 1, 10);
      expect(reopened.ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("getClientIp", () => {
  it("x-forwarded-for の先頭を返す", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(h)).toBe("1.2.3.4");
  });
  it("x-real-ip fallback", () => {
    const h = new Headers({ "x-real-ip": "9.9.9.9" });
    expect(getClientIp(h)).toBe("9.9.9.9");
  });
  it("両方無ければ 'unknown'", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
