import { test, expect } from "@playwright/test";
import { loadE2EOrderIds } from "../setup/e2e-order-ids";

/**
 * 仮払い前アラートバナー + 納品ボタン disabled ガードの UI 検証。
 *
 * 前提: orders-setup で [E2E-SAFETY] pre-payment test order が
 *   contract + escrow=pending の canonical 状態でセット済み。
 *
 * 検証:
 *   1. role=alert のバナー が「仮払いが完了するまで」+「補償の対象外」を含む
 *   2. 「納品」ボタン があれば disabled
 */

test.describe("PrePayment alert @safety-creator", () => {
  test("escrow 前 order の 詳細画面 に警告バナー + 納品ブロック", async ({
    page,
  }) => {
    const { prePaymentOrderId } = loadE2EOrderIds();
    await page.goto(`/dashboard/orders/${prePaymentOrderId}`);

    const alert = page.locator('[role="alert"]');
    await expect(alert.first()).toBeVisible();
    await expect(alert.first()).toContainText(/仮払いが完了するまで/);
    await expect(alert.first()).toContainText(/補償の対象外/);

    // 納品ボタン が UI に存在するなら 非活性
    const deliverBtn = page.getByRole("button", { name: /納品/ });
    if ((await deliverBtn.count()) > 0) {
      await expect(deliverBtn.first()).toBeDisabled();
    }
  });
});
