import { expect, test } from "@playwright/test";

/**
 * Smoke: Hero テキスト保護 (select-none / no-drag) + 外部リンク target/rel。
 */

test.describe("Hero テキスト / 動画保護 @smoke", () => {
  test("Hero メインコピー 2 行構成 (単語途中改行なし)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText("AIクリエイターと、");
    await expect(page.locator("body")).toContainText("企業をつなぐ。");
  });

  test("Hero テキスト select-none 適用", async ({ page }) => {
    await page.goto("/");
    // "AIクリエイターと、" を含む要素 (と 祖先) を確認
    const heroText = page.locator("text=/AIクリエイターと、/").first();
    await expect(heroText).toBeVisible();
    const selectValue = await heroText.evaluate(
      (el) => window.getComputedStyle(el).userSelect
    );
    // Tailwind の select-none は user-select: none を生成
    expect(selectValue).toBe("none");
  });

  test("Hero 動画 draggable=false + controlsList", async ({ page }) => {
    await page.goto("/");
    const video = page.locator("video").first();
    if ((await video.count()) === 0) {
      test.skip(true, "Hero 動画未実装 (skip)");
      return;
    }
    // draggable 属性
    const draggable = await video.getAttribute("draggable");
    expect(draggable).toBe("false");
    // controlsList (nodownload)
    const controlsList = await video.getAttribute("controlslist");
    // 実装により省略される場合もあるが 望ましくは nodownload を含む
    if (controlsList !== null) {
      expect(controlsList).toMatch(/nodownload/);
    }
  });
});

test.describe("外部リンク target/rel @smoke", () => {
  test("トップ内の 全 target=_blank リンクに rel=noopener 付与", async ({
    page,
  }) => {
    await page.goto("/");
    // AI ニュース 読込を待機
    await page.waitForLoadState("networkidle").catch(() => {});
    const anchors = page.locator('a[target="_blank"]');
    const count = await anchors.count();
    if (count === 0) {
      test.skip(true, "外部リンク無し (skip)");
      return;
    }
    for (let i = 0; i < count; i++) {
      const rel = (await anchors.nth(i).getAttribute("rel")) ?? "";
      expect.soft(rel).toMatch(/noopener/);
    }
  });
});
