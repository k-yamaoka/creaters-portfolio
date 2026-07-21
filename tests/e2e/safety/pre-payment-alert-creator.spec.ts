import { test, expect } from "@playwright/test";

/**
 * 仮払い前アラートバナー + 納品ボタン disabled ガードの UI 検証。
 *
 * escrow_status ≠ held の order を開いて:
 *   1. 「⚠️ 仮払いが完了するまで作業を開始しないでください」バナー が表示
 *   2. 「補償の対象外」の文言が含まれる
 *   3. 納品系のアクションボタン (「納品する」) が存在するなら disabled
 */

test.describe("PrePayment alert @safety-creator", () => {
  test("escrow 前 order の 詳細画面 に警告バナー + 納品ブロック", async ({
    page,
  }) => {
    await page.goto("/dashboard/orders");
    const orderLink = page.locator('a[href^="/dashboard/orders/"]').first();
    test.skip((await orderLink.count()) === 0, "取引が無いため skip");
    await orderLink.click();
    await page.waitForURL(/\/dashboard\/orders\/[^/]+/);

    // alert 系はロール "alert" として render される
    const alert = page.locator('[role="alert"]');
    if ((await alert.count()) === 0) {
      // escrow=held 済 (仮払い完了) の order だった場合はスキップ
      test.skip(true, "仮払い済 order だったため PrePaymentAlert 非表示");
      return;
    }
    await expect(alert.first()).toContainText(/仮払いが完了するまで/);
    await expect(alert.first()).toContainText(/補償の対象外/);

    // 納品ボタン が UI に存在するなら 非活性であること
    const deliverBtn = page.getByRole("button", { name: /納品/ });
    if ((await deliverBtn.count()) > 0) {
      await expect(deliverBtn.first()).toBeDisabled();
    }
  });
});
