import { describe, it, expect } from "vitest";
import { validateDisplayName } from "@/lib/name-validation";

/**
 * モンキーテスト: validateDisplayName に大量のランダム / 敵対的入力を投げ、
 * 例外を投げず、ok / reason の形が常に正しいことを検証。
 */

function rndString(): string {
  const kinds = [
    () => "", // 空
    () => "   ", // 空白のみ
    () => Math.random().toString(36).slice(2, 2 + Math.floor(Math.random() * 60)), // 英数
    () => "\0\x01\x02", // 制御文字
    () => "​‌‍", // ゼロ幅
    () => "😀🎉🔥",
    () => "あ".repeat(Math.floor(Math.random() * 100)),
    () => Array.from({ length: 20 }, () =>
      String.fromCodePoint(Math.floor(Math.random() * 0x1_FFFF))).join(""),
    () => "🤖".repeat(50),
    () => "!!!" + "@".repeat(30),
    () => "ADMINISTRATOR " + Math.random(),
    () => "山田" + "　".repeat(10) + "太郎",
  ];
  return kinds[Math.floor(Math.random() * kinds.length)]();
}

describe("validateDisplayName FUZZ (3000 iterations)", () => {
  it("例外を投げず、常に { ok } 型を返す", () => {
    for (let i = 0; i < 3000; i++) {
      const input = rndString();
      let result;
      try {
        result = validateDisplayName(input);
      } catch (e) {
        throw new Error(`unexpected throw for input="${input}": ${e}`);
      }
      expect(result).toBeDefined();
      expect(typeof result.ok).toBe("boolean");
      if (result.ok) {
        expect(typeof result.sanitized).toBe("string");
        expect(result.sanitized.length).toBeGreaterThan(0);
        expect(result.sanitized.length).toBeLessThanOrEqual(40);
      } else {
        expect(typeof result.reason).toBe("string");
        expect(result.reason.length).toBeGreaterThan(0);
      }
    }
  });

  it("制御文字 / ゼロ幅を含む名前は必ず reject", () => {
    const inputs = [
      "山田\0太郎",
      "foo​bar",
      "test‌me",
      "‍hello",
    ];
    for (const s of inputs) {
      const r = validateDisplayName(s);
      expect(r.ok).toBe(false);
    }
  });

  it("XSS ペイロード は letter/number を含めば通ることがあるが例外は起きない", () => {
    const payloads = [
      "<script>alert(1)</script>",
      "'; DROP TABLE users; --",
      "onerror=alert(1)",
      "javascript:foo",
    ];
    for (const s of payloads) {
      const r = validateDisplayName(s);
      // ok / not-ok どちらでもよいが 例外は絶対に起きてはいけない
      expect(typeof r.ok).toBe("boolean");
    }
  });
});
