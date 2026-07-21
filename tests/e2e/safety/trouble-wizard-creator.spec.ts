import { test, expect } from "@playwright/test";
import { loadE2EOrderIds } from "../setup/e2e-order-ids";

/**
 * トラブル報告ウィザードの STEP1→2→3 順序ガードを UI で確認 (creator 視点)。
 *
 * 前提: orders-setup で first_reminder_sent_at=null にリセット済み。
 * 「連絡が来ない」カテゴリ選択 時 STEP1 未達で STEP3 が非活性であることを
 * 検証。
 */

test.describe("Trouble report wizard @safety-creator", () => {
  test("「運営に相談する」→ ウィザード → STEP1 未達なら STEP3 非活性", async ({
    page,
  }) => {
    const { terminationOrderId } = loadE2EOrderIds();
    await page.goto(`/dashboard/orders/${terminationOrderId}`);

    // 「運営に相談する」ボタン (safety buttons 群)
    const troubleBtn = page.getByRole("button", { name: /運営に相談/ });
    await expect(troubleBtn).toBeVisible();
    await troubleBtn.click();

    // ウィザード モーダルが開く
    const wizard = page.getByRole("dialog", { name: /運営に相談/ });
    await expect(wizard).toBeVisible();
    await expect(wizard).toContainText(/どのようなお困り/);

    // 「連絡が来ない」カテゴリを選択
    await wizard.getByRole("button", { name: /連絡が来ない/ }).click();

    // STEP1 と STEP3 (needsStep2=false のため STEP は 2 段) が表示される
    await expect(wizard).toContainText(/STEP\s*1/);
    await expect(wizard).toContainText(/催促/);

    // STEP1 未達 (first_reminder_sent_at=null) なので:
    //   → 「STEP N が完了していません」バナーが表示
    //   → 「運営に裁定を申請する」ボタンは 存在しない or disabled
    await expect(wizard).toContainText(/完了していません/);

    const gavelBtn = wizard.getByRole("button", { name: /運営に裁定を申請/ });
    const gavelBtnCount = await gavelBtn.count();
    if (gavelBtnCount > 0) {
      // ボタンが render されているなら disabled であること
      await expect(gavelBtn).toBeDisabled();
    }
    // (0 件 = そもそも render されていない、も許容 = 期待どおり STEP3 は非表示)

    // 「カテゴリ選択に戻る」で 1 画面戻れる
    await wizard.getByRole("button", { name: /カテゴリ選択に戻る/ }).click();
    await expect(wizard).toContainText(/どのようなお困り/);
  });
});
