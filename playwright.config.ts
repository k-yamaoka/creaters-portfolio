import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 設定 (2026-07-21)。
 *
 * 実行方法:
 *   npm run e2e              全 project (smoke + safety-* / auth-required 含む)
 *   npm run e2e:smoke        無認証で public route を叩くスモーク
 *   npm run e2e:safety       認証必須の安全性フロー (creator + client の storageState を使う)
 *   npm run e2e:headed       ブラウザを表示して実行
 *   npm run e2e:ui           Playwright UI Runner
 *   npm run e2e:report       直近実行の HTML レポートを表示
 *
 * 前提:
 *   - `.env.local` に SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL 等
 *   - port 3000 が空いていること (webServer が自動で `npm run dev` を起動)
 *   - 認証必須 テストは tests/e2e/setup/auth.setup.ts が事前に test-*
 *     ユーザーを作成 + storageState を .auth/ 配下に保存する
 */

const CI = !!process.env.CI;
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: CI ? "retain-on-failure" : "off",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  webServer: {
    // 既存の dev サーバーを使い回せるなら再利用する (再起動は遅い)
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },

  projects: [
    // ---------- 0. 認証セットアップ (creator / client の storageState を作る) ----------
    {
      name: "auth-setup",
      testMatch: /setup\/auth\.setup\.ts$/,
    },

    // ---------- 1. Smoke (無認証で public route を叩く) ----------
    {
      name: "smoke",
      testDir: "tests/e2e/smoke",
      use: { ...devices["Desktop Chrome"] },
    },

    // ---------- 2. Safety (認証済み / 安全性ガードレールの UI 検証) ----------
    {
      name: "safety-creator",
      testDir: "tests/e2e/safety",
      dependencies: ["auth-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/creator.json",
      },
      testMatch: /.*creator\.spec\.ts$/,
    },
    {
      name: "safety-client",
      testDir: "tests/e2e/safety",
      dependencies: ["auth-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/client.json",
      },
      testMatch: /.*client\.spec\.ts$/,
    },
  ],
});
