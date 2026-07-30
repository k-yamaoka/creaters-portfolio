import { expect, test } from "@playwright/test";

/**
 * Smoke: SEO / OGP / meta タグ が仕様どおりか。
 * next.config.ts / metadata の設定と 対応する。
 */

test.describe("SEO / OGP / meta @smoke", () => {
  test("html lang='ja'", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("ja");
  });

  test("viewport meta 設定 (レスポンシブ)", async ({ page }) => {
    await page.goto("/");
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewport).toBeTruthy();
    expect(viewport).toMatch(/width=device-width/);
  });

  test("トップ ページ <title> セット", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(3);
  });

  test("og:title / og:description / og:image いずれか設定", async ({ page }) => {
    await page.goto("/");
    // og:title は最低限あるべき
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content")
      .catch(() => null);
    // og:image は SNS シェア用
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content")
      .catch(() => null);
    // 最低 1 つは設定されているべき (未設定なら SEO 不足フラグ)
    expect(ogTitle || ogImage).toBeTruthy();
  });

  test("/creators ページタイトルに 動的値", async ({ page }) => {
    await page.goto("/creators");
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).toMatch(/AILIER|クリエイター|AI/);
  });

  test("/pricing ページタイトル", async ({ page }) => {
    await page.goto("/pricing");
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("/terms ページタイトル", async ({ page }) => {
    await page.goto("/terms");
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("charset UTF-8", async ({ page }) => {
    await page.goto("/");
    const charset = await page.locator("meta[charset]").getAttribute("charset");
    expect(charset?.toLowerCase()).toBe("utf-8");
  });
});
