import { describe, expect, it, vi } from "vitest";
import { FOUNDING_SLOT_LIMIT, getFoundingStats } from "@/lib/founding-creator";

/**
 * 統合テストは Supabase 依存なので単体では mock で挙動確認。
 */
describe("founding-creator", () => {
  it("SLOT_LIMIT は 50", () => {
    expect(FOUNDING_SLOT_LIMIT).toBe(50);
  });

  it("view 経由で stats 取得", async () => {
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { slot_limit: 50, filled: 12, remaining: 38, is_full: false },
          error: null,
        }),
    } as any;
    const stats = await getFoundingStats(supabase);
    expect(stats.slotLimit).toBe(50);
    expect(stats.filled).toBe(12);
    expect(stats.remaining).toBe(38);
    expect(stats.isFull).toBe(false);
  });

  it("view エラー時 直接 count フォールバック", async () => {
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi
        .fn()
        // 1 回目 view SELECT
        .mockReturnValueOnce({
          maybeSingle: () => Promise.resolve({ data: null, error: { message: "view missing" } }),
        })
        // 2 回目 fallback count
        .mockReturnValueOnce({
          eq: () => Promise.resolve({ count: 30, error: null }),
        }),
    } as any;
    const stats = await getFoundingStats(supabase);
    expect(stats.slotLimit).toBe(50);
    expect(stats.filled).toBe(30);
    expect(stats.remaining).toBe(20);
    expect(stats.isFull).toBe(false);
  });

  it("filled >= SLOT_LIMIT で isFull=true / remaining=0", async () => {
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi
        .fn()
        .mockReturnValueOnce({
          maybeSingle: () => Promise.resolve({ data: null, error: { message: "x" } }),
        })
        .mockReturnValueOnce({
          eq: () => Promise.resolve({ count: 55, error: null }),
        }),
    } as any;
    const stats = await getFoundingStats(supabase);
    expect(stats.filled).toBe(55);
    expect(stats.remaining).toBe(0);
    expect(stats.isFull).toBe(true);
  });
});
