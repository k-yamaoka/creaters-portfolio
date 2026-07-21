import { test, expect } from "@playwright/test";

/**
 * トラブル報告ウィザードの STEP1→2→3 順序ガードを UI で確認 (creator 視点)。
 *
 * 検証項目:
 *   1. 「運営に相談する」ボタンが常設されている
 *   2. カテゴリ選択画面が開く
 *   3. 「連絡が来ない」を選ぶと STEP1 未達なら STEP3 未表示 (催促 CTA 表示)
 *   4. カテゴリ選択に戻るナビが機能
 */

test.describe("Trouble report wizard @safety-creator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/orders");
    const anyOrder = page.locator('a[href^="/dashboard/orders/"]').first();
    test.skip(
      (await anyOrder.count()) === 0,
      "取引が 1 件も無いため skip"
    );
    await anyOrder.click();
    await page.waitForURL(/\/dashboard\/orders\/[^/]+/);
  });

  test("「運営に相談する」→ ウィザード → STEP1 順序ガード", async ({
    page,
  }) => {
    // 「運営に相談する」ボタンは safety buttons 群にある
    const troubleBtn = page.getByRole("button", { name: /運営に相談/ });
    await troubleBtn.click();

    const wizard = page.getByRole("dialog", { name: /運営に相談/ });
    await expect(wizard).toBeVisible();
    await expect(wizard).toContainText(/どのようなお困り/);

    // 「連絡が来ない」カテゴリを選択
    await wizard.getByRole("button", { name: /連絡が来ない/ }).click();

    // STEP 1 と STEP 3 (or STEP 2) が表示される。カテゴリ no_response は
    // needsStep2=false なので STEP は 2 段構成 (STEP1 + STEP3 表記)
    await expect(wizard).toContainText(/STEP\s*1/);
    await expect(wizard).toContainText(/催促/);

    // STEP1 未達なら 「STEP 1 が完了していません」バナー
    // (creator に seed した order で first_reminder_sent_at が null な前提)
    // 未達 でも達成済でも どちらの UI も許容
    const stillPending = await wizard
      .locator("text=/STEP.*完了していません/")
      .count();
    if (stillPending > 0) {
      // 未達 パターン: 運営裁定申請ボタン は非表示 or disabled
      const gavelBtn = wizard.getByRole("button", { name: /運営に裁定を申請/ });
      const gavelBtnCount = await gavelBtn.count();
      if (gavelBtnCount > 0) {
        await expect(gavelBtn).toBeDisabled();
      }
    } else {
      // 達成済 パターン: 申請ボタンが有効化
      const gavelBtn = wizard.getByRole("button", { name: /運営に裁定を申請/ });
      await expect(gavelBtn).toBeEnabled();
    }

    // 「カテゴリ選択に戻る」で 1 画面戻れる
    await wizard.getByRole("button", { name: /カテゴリ選択に戻る/ }).click();
    await expect(wizard).toContainText(/どのようなお困り/);
  });
});
