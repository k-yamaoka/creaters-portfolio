import { describe, it, expect } from "vitest";
import { validateDisplayName } from "@/lib/name-validation";

describe("validateDisplayName — 通常入力", () => {
  it("正常な日本語名", () => {
    const r = validateDisplayName("山田 太郎");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sanitized).toBe("山田 太郎");
  });
  it("英語名", () => {
    const r = validateDisplayName("John Smith");
    expect(r.ok).toBe(true);
  });
  it("前後空白は trim", () => {
    const r = validateDisplayName("  Foo Bar  ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sanitized).toBe("Foo Bar");
  });
});

describe("validateDisplayName — 長さ", () => {
  it("空文字 → NG", () => {
    expect(validateDisplayName("").ok).toBe(false);
  });
  it("空白のみ → NG", () => {
    expect(validateDisplayName("   ").ok).toBe(false);
  });
  it("1 文字は NG (最小 2)", () => {
    expect(validateDisplayName("あ").ok).toBe(false);
  });
  it("2 文字は OK", () => {
    // 「ああ」は同一文字繰り返しで別途 NG になるので違う文字で
    expect(validateDisplayName("あい").ok).toBe(true);
  });
  it("40 文字は OK", () => {
    const s = "a".repeat(2) + "b".repeat(38); // 全部同じは NG なので混在
    // ↑ の "aa" 頭は 2 文字連続だが 3 文字未満なら reject 対象外
    // 40 文字きっかり + 全同一でない
    const name = "山".repeat(20) + "田".repeat(20);
    expect(validateDisplayName(name).ok).toBe(true);
  });
  it("41 文字は NG", () => {
    expect(validateDisplayName("a".repeat(20) + "b".repeat(21)).ok).toBe(false);
  });
});

describe("validateDisplayName — 同一文字繰り返し", () => {
  it("ああああ → NG", () => {
    const r = validateDisplayName("ああああ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("繰り返し");
  });
  it("aaaa → NG", () => {
    expect(validateDisplayName("aaaa").ok).toBe(false);
  });
  it("1111 → NG", () => {
    expect(validateDisplayName("1111").ok).toBe(false);
  });
  it("同一文字 2 文字は許可 (min length と衝突するが)", () => {
    // ああ = 2 文字 = チェック閾値 3 未満なので繰り返し判定は通る。
    // しかし別途 blocked word ^あ+$ で弾かれる
    const r = validateDisplayName("ああ");
    expect(r.ok).toBe(false); // blocked keyword hit
  });
});

describe("validateDisplayName — 記号のみ", () => {
  it("記号のみは NG (letter/number 必須)", () => {
    expect(validateDisplayName("!!!").ok).toBe(false);
    expect(validateDisplayName("★★★").ok).toBe(false);
    expect(validateDisplayName("---").ok).toBe(false);
  });
});

describe("validateDisplayName — ブロックワード", () => {
  it("admin (case insensitive)", () => {
    expect(validateDisplayName("admin").ok).toBe(false);
    expect(validateDisplayName("ADMIN").ok).toBe(false);
    expect(validateDisplayName("Admin").ok).toBe(false);
  });
  it("test / testtest / bot / spam", () => {
    expect(validateDisplayName("test").ok).toBe(false);
    expect(validateDisplayName("testtest").ok).toBe(false);
    expect(validateDisplayName("bot").ok).toBe(false);
    expect(validateDisplayName("spam").ok).toBe(false);
  });
  it("qwerty (半角 + 全角)", () => {
    expect(validateDisplayName("qwerty").ok).toBe(false);
    expect(validateDisplayName("ｑｗｅｒｔｙ").ok).toBe(false);
  });
  it("asdf 繰り返し", () => {
    expect(validateDisplayName("asdfasdf").ok).toBe(false);
  });
  it("user + 数字", () => {
    expect(validateDisplayName("user1").ok).toBe(false);
    expect(validateDisplayName("user123").ok).toBe(false);
  });
  it("正常な admin を含む名前は OK", () => {
    expect(validateDisplayName("administrator taro").ok).toBe(true);
  });
});

describe("validateDisplayName — 非文字列 / null", () => {
  it("undefined 相当", () => {
    // 型上 string だが実装は型ガード
    expect(validateDisplayName(undefined as unknown as string).ok).toBe(false);
    expect(validateDisplayName(null as unknown as string).ok).toBe(false);
    expect(validateDisplayName(123 as unknown as string).ok).toBe(false);
  });
});
