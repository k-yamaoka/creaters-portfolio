import { describe, it, expect, vi, beforeEach } from "vitest";

// Next.js server クライアントを mock する準備
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/orders/[id]/request-revision/route";
import { createClient } from "@/lib/supabase/server";

/**
 * 結合テスト: /api/orders/:id/request-revision
 *   Supabase を mock し、以下の分岐を確認:
 *     - 未ログイン → 401
 *     - 認可失敗 (client でない) → 403
 *     - 状態不整合 (not delivered) → 403 NOT_IN_DELIVERED_STATE
 *     - 上限超過 → 402 REVISION_LIMIT_EXCEEDED
 *     - 最後の無償修正 → 200 warning_code=LAST_FREE_REVISION
 *     - 通常成功 → 200 warning=null
 */

function makeReq(body: unknown, orderId = "order-1") {
  return {
    json: async () => body,
  } as unknown as Request;
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// 共通の supabase mock ヘルパー
function makeSupabaseMock(opts: {
  user: { id: string } | null;
  order: unknown;
  updateResult?: { data: unknown; error: unknown };
  messageInsertError?: unknown;
}) {
  const single = vi.fn().mockResolvedValue({ data: opts.order });
  const maybeSingle = vi.fn().mockResolvedValue({ data: opts.order });
  const select = vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockImplementation(() => ({
        is: vi.fn().mockImplementation(() => ({
          is: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockResolvedValue(
              opts.updateResult ?? {
                data: [{ id: "order-1" }],
                error: null,
              }
            ),
          })),
        })),
      })),
      maybeSingle,
      single,
    })),
    single,
    maybeSingle,
  }));

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "orders") {
      return {
        select,
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockImplementation(() => ({
              is: vi.fn().mockImplementation(() => ({
                is: vi.fn().mockImplementation(() => ({
                  select: vi.fn().mockResolvedValue(
                    opts.updateResult ?? {
                      data: [{ id: "order-1" }],
                      error: null,
                    }
                  ),
                })),
              })),
            })),
          })),
        })),
      };
    }
    if (table === "messages") {
      return {
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: opts.messageInsertError ?? null,
        }),
      };
    }
    return {};
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user } }),
    },
    from,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/orders/[id]/request-revision", () => {
  it("未ログイン → 401", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({ user: null, order: null })
    );
    const res = await POST(makeReq({}), makeParams("order-1"));
    expect(res.status).toBe(401);
  });

  it("非 client (= creator など) → 403", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({
        user: { id: "user-not-client" },
        order: {
          id: "order-1",
          status: "delivered",
          escrow_status: "held",
          max_revisions: 3,
          revision_count_used: 0,
          terminated_at: null,
          active_dispute_id: null,
          soft_deleted_at: null,
          client: { user_id: "some-other-client" },
          creator: { user_id: "creator-1" },
        },
      })
    );
    const res = await POST(makeReq({}), makeParams("order-1"));
    expect(res.status).toBe(403);
  });

  it("delivered 状態でない → 403 NOT_IN_DELIVERED_STATE", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({
        user: { id: "client-1" },
        order: {
          id: "order-1",
          status: "production", // ← ここ
          escrow_status: "held",
          max_revisions: 3,
          revision_count_used: 0,
          terminated_at: null,
          active_dispute_id: null,
          soft_deleted_at: null,
          client: { user_id: "client-1" },
          creator: { user_id: "creator-1" },
        },
      })
    );
    const res = await POST(makeReq({}), makeParams("order-1"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error_code).toBe("NOT_IN_DELIVERED_STATE");
  });

  it("修正上限に到達済み → 402 REVISION_LIMIT_EXCEEDED", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({
        user: { id: "client-1" },
        order: {
          id: "order-1",
          status: "delivered",
          escrow_status: "held",
          max_revisions: 2,
          revision_count_used: 2,
          terminated_at: null,
          active_dispute_id: null,
          soft_deleted_at: null,
          client: { user_id: "client-1" },
          creator: { user_id: "creator-1" },
        },
      })
    );
    const res = await POST(makeReq({}), makeParams("order-1"));
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error_code).toBe("REVISION_LIMIT_EXCEEDED");
    expect(body.additional_order_required).toBe(true);
    expect(body.max_revisions).toBe(2);
  });

  it("最後の無償修正 → 200 warning_code=LAST_FREE_REVISION", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({
        user: { id: "client-1" },
        order: {
          id: "order-1",
          status: "delivered",
          escrow_status: "held",
          max_revisions: 2,
          revision_count_used: 1, // これで nextUsed=2=max → willBeLast
          terminated_at: null,
          active_dispute_id: null,
          soft_deleted_at: null,
          client: { user_id: "client-1" },
          creator: { user_id: "creator-1" },
        },
      })
    );
    const res = await POST(makeReq({}), makeParams("order-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.warning_code).toBe("LAST_FREE_REVISION");
    expect(body.revision_count_used).toBe(2);
  });

  it("通常の 1 回目修正 → 200 warning=null", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({
        user: { id: "client-1" },
        order: {
          id: "order-1",
          status: "delivered",
          escrow_status: "held",
          max_revisions: 3,
          revision_count_used: 0,
          terminated_at: null,
          active_dispute_id: null,
          soft_deleted_at: null,
          client: { user_id: "client-1" },
          creator: { user_id: "creator-1" },
        },
      })
    );
    const res = await POST(makeReq({}), makeParams("order-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.warning_code).toBeNull();
    expect(body.revision_count_used).toBe(1);
  });

  it("terminated / dispute 中は 403", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({
        user: { id: "client-1" },
        order: {
          id: "order-1",
          status: "delivered",
          escrow_status: "held",
          max_revisions: 3,
          revision_count_used: 0,
          terminated_at: "2026-07-21",
          active_dispute_id: null,
          soft_deleted_at: null,
          client: { user_id: "client-1" },
          creator: { user_id: "creator-1" },
        },
      })
    );
    const res = await POST(makeReq({}), makeParams("order-1"));
    expect(res.status).toBe(403);
  });
});
