import { test, expect } from "@playwright/test";
import { loadE2EOrderIds } from "../setup/e2e-order-ids";

/**
 * 途中終了 自爆防止 モーダル の UI ガード検証 (creator 視点)。
 *
 * 前提: orders-setup により [E2E-SAFETY] termination test order が
 *   production + escrow=held の canonical 状態でセット済み。
 *
 * テスト自体は モーダル 表示 → 必須チェック / disabled 遷移 の確認まで。
 * "途中終了を確定" は押さない (state を汚さない)。
 */

test.describe("Termination confirm dialog @safety-creator", () => {
  test("dashboard へ到達 (auth state 有効性の確認)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/(dashboard|onboarding)/);
  });

  test("取引詳細ページの途中終了ボタン → モーダル → 必須チェック", async ({
    page,
  }) => {
    // dependencies (orders-setup) 実行後に .auth/e2e-orders.json を lazy 読込
    const { terminationOrderId } = loadE2EOrderIds();
    await page.goto(`/dashboard/orders/${terminationOrderId}`);
    // 「途中終了を申請する」ボタン
    const termButton = page.getByRole("button", { name: /途中終了/ });
    await expect(termButton).toBeVisible();
    await termButton.click();

    // モーダル: 巨大警告 + 「同意する前に」ヘッダ + 運営相談ボタン
    const modal = page.getByRole("dialog", { name: /途中終了/ });
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/全額発注者に返金/);
    await expect(modal).toContainText(/ゼロ/);
    await expect(modal).toContainText(/同意する前に/);
    await expect(
      modal.getByRole("button", { name: /運営に相談/ })
    ).toBeVisible();

    // 「途中終了を確定」ボタンは 初期状態で disabled
    const confirmBtn = modal.getByRole("button", { name: /途中終了を確定/ });
    await expect(confirmBtn).toBeDisabled();

    // 理由だけ入力 → チェック OFF → 依然 disabled
    await modal.getByRole("textbox").fill("E2E テスト用の理由");
    await expect(confirmBtn).toBeDisabled();

    // チェック ON → enabled
    await modal.getByRole("checkbox").check();
    await expect(confirmBtn).toBeEnabled();

    // モーダルを閉じる (実行はしない)
    await modal
      .getByRole("button", { name: /閉じる|キャンセル/ })
      .first()
      .click();
    await expect(modal).toBeHidden();
  });
});
