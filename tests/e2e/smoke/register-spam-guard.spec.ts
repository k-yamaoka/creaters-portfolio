import { test, expect } from "@playwright/test";

/**
 * Smoke: 登録フォームのスパム名 ガード (name-validation) が UI 経由でも
 * 機能することを検証。実際の signup までは進めず、送信直前にエラーが
 * 表示されることを見る。
 */

test.describe("Register spam guard @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("同一文字繰り返し ああああ で登録ブロック", async ({ page }) => {
    await page.getByLabel(/表示名/i).fill("ああああ");
    await page.getByLabel(/メールアドレス/i).fill("test@example.com");
    await page.getByLabel(/パスワード/i).fill("Password123!");
    await page.getByRole("button", { name: /アカウントを作成/ }).click();
    await expect(page.locator("body")).toContainText(/繰り返し/);
  });

  test("ブロックワード admin で登録ブロック", async ({ page }) => {
    await page.getByLabel(/表示名/i).fill("admin");
    await page.getByLabel(/メールアドレス/i).fill("test@example.com");
    await page.getByLabel(/パスワード/i).fill("Password123!");
    await page.getByRole("button", { name: /アカウントを作成/ }).click();
    await expect(page.locator("body")).toContainText(/使用できません/);
  });

  test("記号のみは登録ブロック", async ({ page }) => {
    await page.getByLabel(/表示名/i).fill("!!!");
    await page.getByLabel(/メールアドレス/i).fill("test@example.com");
    await page.getByLabel(/パスワード/i).fill("Password123!");
    await page.getByRole("button", { name: /アカウントを作成/ }).click();
    await expect(page.locator("body")).toContainText(/文字|数字/);
  });
});
