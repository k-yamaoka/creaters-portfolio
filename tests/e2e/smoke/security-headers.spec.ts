import { expect, test } from "@playwright/test";

/**
 * Smoke: セキュリティ ヘッダー が next.config.ts の SECURITY_HEADERS どおりに
 * 全レスポンスに付与されているか。
 */

test.describe("Security headers @smoke", () => {
  test("X-Frame-Options: SAMEORIGIN", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  });

  test("X-Content-Type-Options: nosniff", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("Referrer-Policy: strict-origin-when-cross-origin", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  test("Strict-Transport-Security 設定 (max-age 1 年+)", async ({ request }) => {
    const res = await request.get("/");
    const hsts = res.headers()["strict-transport-security"];
    expect(hsts).toBeTruthy();
    expect(hsts).toMatch(/max-age=\d+/);
    const m = hsts?.match(/max-age=(\d+)/);
    expect(Number(m?.[1] ?? 0)).toBeGreaterThanOrEqual(31536000);
  });

  test("Permissions-Policy: camera/mic/geo 無効", async ({ request }) => {
    const res = await request.get("/");
    const p = res.headers()["permissions-policy"];
    expect(p).toContain("camera=()");
    expect(p).toContain("microphone=()");
    expect(p).toContain("geolocation=()");
  });

  test("CSP: default-src 'self'", async ({ request }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  test("CSP: YouTube / Vimeo 埋込 許可", async ({ request }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toContain("youtube.com");
    expect(csp).toContain("vimeo.com");
  });

  test("CSP: Supabase Realtime (wss) / REST (https) 許可", async ({ request }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toContain("wss://*.supabase.co");
    expect(csp).toContain("https://*.supabase.co");
  });

  test("CSP: Stripe 許可", async ({ request }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toContain("stripe.com");
  });
});
