import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

/**
 * E2E 認証セットアップ (2026-07-21)。
 *
 * 手順:
 *   1. .env.local から SUPABASE_URL + SERVICE_ROLE_KEY を読む
 *   2. test-creator@ailier.app / test-client@ailier.app が存在しなければ
 *      auth.admin.createUser で作成 (メタデータで role をセット)
 *   3. UI 経由の login (メール + パスワード) を実行
 *   4. Storage state (Cookie + localStorage) を .auth/{creator,client}.json に保存
 *
 * これ以降、"safety-creator" / "safety-client" project は保存された state を
 * 使って認証済み状態でテストを開始する。
 */

const TEST_CREATOR_EMAIL = "test-creator@ailier.app";
const TEST_CLIENT_EMAIL = "test-client@ailier.app";
const TEST_PASSWORD = "AilierE2ETest2026!";

function loadEnv() {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) throw new Error(".env.local が見つかりません");
  const raw = fs.readFileSync(p, "utf-8");
  const env: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

async function ensureTestUser(
  supabaseUrl: string,
  serviceKey: string,
  email: string,
  role: "creator" | "client",
  displayName: string
) {
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // RPC で既存判定 (00061 で追加した SECURITY DEFINER 関数)
  const { data: found } = await admin.rpc("admin_lookup_auth_user_by_email", {
    p_email: email,
  });
  const existing = Array.isArray(found) ? found[0] : found;
  if (existing?.id) {
    // 既存ユーザーの password を TEST_PASSWORD に強制リセット (E2E 冪等性のため)
    const { error: updErr } = await admin.auth.admin.updateUserById(
      existing.id,
      {
        password: TEST_PASSWORD,
        email_confirm: true,
      }
    );
    if (updErr) {
      throw new Error(
        `既存 test user の password 更新失敗 (${email}): ${updErr.message}`
      );
    }
    return existing.id;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      role,
      ...(role === "creator" ? { user_type: "individual" } : {}),
    },
  });
  if (error) throw new Error(`auth user 作成失敗 (${email}): ${error.message}`);
  return created.user?.id;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定");
}

if (!fs.existsSync(".auth")) fs.mkdirSync(".auth", { recursive: true });

setup("test creator を作成 + ログイン", async ({ page }) => {
  const uid = await ensureTestUser(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
    TEST_CREATOR_EMAIL,
    "creator",
    "E2E Test Creator"
  );
  setup.info().annotations.push({ type: "user_id", description: String(uid) });

  await page.goto("/login");
  await page.getByLabel(/メール/i).fill(TEST_CREATOR_EMAIL);
  await page.getByLabel(/パスワード/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  // /login 画面から離脱するまで待つ (実装は router.push で / or /dashboard のどちらか)
  await page.waitForURL((url) => !/\/login$/.test(url.pathname), {
    timeout: 15_000,
  });
  // 明示的に /dashboard へ移動して認証済み状態を確定
  await page.goto("/dashboard");
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
  await page.context().storageState({ path: ".auth/creator.json" });
});

setup("test client を作成 + ログイン", async ({ page }) => {
  const uid = await ensureTestUser(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
    TEST_CLIENT_EMAIL,
    "client",
    "E2E Test Client"
  );
  setup.info().annotations.push({ type: "user_id", description: String(uid) });

  await page.goto("/login");
  await page.getByLabel(/メール/i).fill(TEST_CLIENT_EMAIL);
  await page.getByLabel(/パスワード/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await page.waitForURL((url) => !/\/login$/.test(url.pathname), {
    timeout: 15_000,
  });
  await page.goto("/dashboard");
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  await page.context().storageState({ path: ".auth/client.json" });
});
