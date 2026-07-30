import { expect, test } from "@playwright/test";

/**
 * Smoke: 404 / 認証未 で保護ページに 触れた時の挙動。
 */

const BAD_UUID = "00000000-0000-0000-0000-000000000000";

test.describe("404 / 存在しないリソース @smoke", () => {
  test("存在しないルート → 404", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
  });

  test("存在しない creator id → 404", async ({ page }) => {
    const res = await page.goto(`/creators/${BAD_UUID}`);
    expect(res?.status()).toBe(404);
  });

  test("不正 UUID の creator id → 404 or 400", async ({ page }) => {
    const res = await page.goto("/creators/not-a-uuid");
    // 実装次第で 404 or 400
    expect([400, 404]).toContain(res?.status() ?? 0);
  });
});

test.describe("Auth ガード @smoke", () => {
  test("未ログインで /dashboard → /login リダイレクト", async ({ page }) => {
    await page.goto("/dashboard");
    // middleware or layout でリダイレクト
    await expect(page).toHaveURL(/\/login/);
  });

  test("未ログインで /admin → /login or /dashboard", async ({ page }) => {
    await page.goto("/admin");
    // admin は 未ログインなら /login、ログイン済でも非 admin なら /dashboard
    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });

  test("未ログインで /dashboard/invitations → /login", async ({ page }) => {
    await page.goto("/dashboard/invitations");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未ログインで /dashboard/orders → /login", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("API 認可 @smoke", () => {
  test("POST /api/reports 未認証 → 401", async ({ request }) => {
    const res = await request.post("/api/reports", {
      data: {
        target_type: "portfolio",
        target_id: BAD_UUID,
        category: "spam",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/creators/search 未認証 → 401/403/302", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/creators/search?tags=");
    expect([401, 403, 302]).toContain(res.status());
  });

  test("POST /api/admin/disputes/[id]/ruling 未認証 → 401/403/302/404", async ({
    request,
  }) => {
    const res = await request.post(`/api/admin/disputes/${BAD_UUID}/ruling`, {
      data: { ruling_type: "no_action", resolution_summary: "test" },
    });
    expect([401, 403, 302, 404]).toContain(res.status());
  });

  test("GET /api/orders/[id]/download-delivery 未認証 → 401/302", async ({
    request,
  }) => {
    const res = await request.get(`/api/orders/${BAD_UUID}/download-delivery`);
    expect([401, 302, 403, 404]).toContain(res.status());
  });
});
