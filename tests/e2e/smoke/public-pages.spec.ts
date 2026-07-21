import { test, expect } from "@playwright/test";

/**
 * Smoke: 認証不要の主要 public route が 200 で表示されることを確認。
 * 各ページのタイトル / 主要見出し / 主要 CTA の存在を検証。
 */

test.describe("Public pages @smoke", () => {
  test("トップページ / が開く", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(400);
    // "AILIER" は必ずどこかに表示 (Header / Footer / Hero のいずれか)
    await expect(page.locator("body")).toContainText(/AILIER/i);
  });

  test("/creators クリエイター一覧", async ({ page }) => {
    const res = await page.goto("/creators");
    expect(res?.status()).toBeLessThan(400);
    // 検索 UI or 一覧の主要要素
    await expect(page).toHaveTitle(/クリエイター|AI/i);
  });

  test("/pricing 料金ページ + 15% / 0% 明示", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).toContainText(/15\s*%/);
    await expect(page.locator("body")).toContainText(/0\s*%/);
    // 他社比較セクションが表示される
    await expect(page.locator("body")).toContainText(/AILIER/);
  });

  test("/help FAQ 7 項目が全て存在", async ({ page }) => {
    await page.goto("/help");
    // 7 テーマの Q 部分が全部 leaf テキスト として存在するか
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/手数料はいくら/);
    expect(bodyText).toMatch(/支払いはいつ/);
    expect(bodyText).toMatch(/登録方法/);
    expect(bodyText).toMatch(/案件はどのくらい/);
    expect(bodyText).toMatch(/著作権/);
    expect(bodyText).toMatch(/他のクラウドソーシング/);
    expect(bodyText).toMatch(/メッセージの返信|レスポンス/);
  });

  test("/terms 規約 + AI コンテンツ ガイドライン", async ({ page }) => {
    await page.goto("/terms");
    // 第 4 条の 2 が存在
    await expect(page.locator("body")).toContainText(/AI\s*生成/);
    // キャンセルポリシー表
    await expect(page.locator("body")).toContainText(/着手前/);
    await expect(page.locator("body")).toContainText(/制作中/);
    await expect(page.locator("body")).toContainText(/納品後/);
    // 2 年保持 免責
    await expect(page.locator("body")).toContainText(/2\s*年/);
  });

  test("/register 登録画面 + 創設メンバー カウンター", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /新規登録/ })).toBeVisible();
    // 創設メンバー カウンター (fetch 完了後に表示、少し待つ)
    await expect(page.locator("body")).toContainText(
      /創設メンバー|残り/,
      { timeout: 10_000 }
    );
  });

  test("/login ログイン画面", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/メール/i)).toBeVisible();
    await expect(page.getByLabel(/パスワード/i)).toBeVisible();
    // 「ログイン」ボタンは submit / Google / LINE の 3 種あるので submit を exact 指定
    await expect(
      page.getByRole("button", { name: "ログイン", exact: true })
    ).toBeVisible();
  });
});
