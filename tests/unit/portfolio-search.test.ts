import { describe, expect, it } from "vitest";
import {
  countActiveFilters,
  readFiltersFromQuery,
  writeFiltersToQuery,
} from "@/lib/portfolio-search";

describe("portfolio-search: URL クエリ ↔ フィルタ 相互変換", () => {
  it("空クエリで空フィルタ", () => {
    const f = readFiltersFromQuery(new URLSearchParams(""));
    expect(f.keyword).toBeUndefined();
    expect(f.genres).toBeUndefined();
    expect(f.aiTools).toBeUndefined();
    expect(f.sortBy).toBeUndefined();
  });

  it("複数タグ CSV 分解", () => {
    const f = readFiltersFromQuery(
      new URLSearchParams("tool=Sora,Runway,Kling&genre=SNS_ad,MV")
    );
    expect(f.aiTools).toEqual(["Sora", "Runway", "Kling"]);
    expect(f.genres).toEqual(["SNS_ad", "MV"]);
  });

  it("空要素は除外 (tool=Sora,,Runway)", () => {
    const f = readFiltersFromQuery(new URLSearchParams("tool=Sora,,Runway"));
    expect(f.aiTools).toEqual(["Sora", "Runway"]);
  });

  it("不正 sort は undefined (fall back)", () => {
    const f = readFiltersFromQuery(new URLSearchParams("sort=nonsense"));
    expect(f.sortBy).toBeUndefined();
  });

  it("有効 sort は保持", () => {
    for (const s of ["newest", "rating", "price_low", "price_high", "recommended"] as const) {
      const f = readFiltersFromQuery(new URLSearchParams(`sort=${s}`));
      expect(f.sortBy).toBe(s);
    }
  });

  it("write → read で round-trip", () => {
    const original = {
      keyword: "hello",
      genres: ["SNS_ad", "MV"],
      aiTools: ["Sora", "Runway"],
      sortBy: "price_low" as const,
    };
    const q = writeFiltersToQuery(original);
    const restored = readFiltersFromQuery(q);
    expect(restored.keyword).toBe("hello");
    expect(restored.genres).toEqual(["SNS_ad", "MV"]);
    expect(restored.aiTools).toEqual(["Sora", "Runway"]);
    expect(restored.sortBy).toBe("price_low");
  });

  it("recommended は URL に含めない (デフォルト)", () => {
    const q = writeFiltersToQuery({ sortBy: "recommended" });
    expect(q.toString()).toBe("");
  });

  it("空 or undefined フィールドは URL 出力しない", () => {
    const q = writeFiltersToQuery({
      keyword: "",
      genres: [],
      aiTools: undefined,
    });
    expect(q.toString()).toBe("");
  });
});

describe("portfolio-search: countActiveFilters", () => {
  it("0 フィルタ", () => {
    expect(countActiveFilters({})).toBe(0);
  });

  it("keyword で 1", () => {
    expect(countActiveFilters({ keyword: "hi" })).toBe(1);
  });

  it("複数タグは 個別カウント (Sora,Runway,Kling → 3)", () => {
    expect(countActiveFilters({ aiTools: ["Sora", "Runway", "Kling"] })).toBe(3);
  });

  it("組み合わせ (keyword + genre × 2 + tool × 3 = 6)", () => {
    expect(
      countActiveFilters({
        keyword: "hi",
        genres: ["a", "b"],
        aiTools: ["x", "y", "z"],
      })
    ).toBe(6);
  });

  it("keyword 空文字列は 0 (falsy)", () => {
    expect(countActiveFilters({ keyword: "" })).toBe(0);
  });
});
