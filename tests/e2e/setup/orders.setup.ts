import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

/**
 * E2E: test-client → test-creator の テスト用 order を seed する (2026-07-21)。
 *
 * 2 種類の order を用意し、以降の safety-* テストで直接参照する:
 *
 *   Order A (termination / wizard 用)
 *     title: [E2E-SAFETY] termination test order
 *     status: production / escrow_status: held
 *     → 途中終了 モーダル / 運営相談 ウィザード が表示される状態
 *
 *   Order B (pre-payment alert 用)
 *     title: [E2E-SAFETY] pre-payment test order
 *     status: contract / escrow_status: pending
 *     → 「⚠️ 仮払いが完了するまで作業を開始しないでください」バナー が出る状態
 *
 * 冪等性:
 *   - 既存 order は title + client_id + creator_id で検索し、あれば
 *     canonical 状態に UPDATE で戻す (テストで状態が汚れても翌回にリセット)
 *   - 無ければ INSERT
 *
 * 出力: .auth/e2e-orders.json { terminationOrderId, prePaymentOrderId }
 *   safety テスト側は これを読んで page.goto(`/dashboard/orders/${id}`) に使う。
 */

const TEST_CREATOR_EMAIL = "test-creator@ailier.app";
const TEST_CLIENT_EMAIL = "test-client@ailier.app";

const E2E_TITLE_TERMINATION = "[E2E-SAFETY] termination test order";
const E2E_TITLE_PRE_PAYMENT = "[E2E-SAFETY] pre-payment test order";

function loadEnv(): Record<string, string> {
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

async function lookupUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string
): Promise<string> {
  // Supabase 生成型が custom RPC を持たないため any 経由で呼ぶ
  const { data, error } = await (
    admin as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    }
  ).rpc("admin_lookup_auth_user_by_email", { p_email: email });
  if (error) throw new Error(`user lookup 失敗 (${email}): ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error(`auth user が存在しません (${email})`);
  return row.id as string;
}

async function ensureProfileId(
  admin: ReturnType<typeof createClient>,
  table: "client_profiles" | "creator_profiles",
  userId: string,
  role: "client" | "creator"
): Promise<string> {
  // 1. まず profiles 側の存在確認 (creator_/client_profiles の FK 前提)
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.id) {
    // profiles すら無い → 手で作る (handle_new_user 未実行のケース)
    await admin.from("profiles").insert({
      id: userId,
      email: `${userId}@e2e.local`, // 後段で updateUser で正しい email に上書きしても OK
      display_name: role === "creator" ? "E2E Test Creator" : "E2E Test Client",
      role,
    });
  }

  // 2. profile-specific 行を探す
  const { data } = await admin
    .from(table)
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (data?.id) return data.id as string;

  // 3. 無ければ手動作成 (トリガーが発火しなかった / 古い migration ケース)
  const insertPayload =
    table === "creator_profiles"
      ? {
          user_id: userId,
          bio: "E2E test creator",
          video_lengths: [],
          strengths: [],
          genres: [],
          years_of_experience: 0,
        }
      : { user_id: userId, company_name: "E2E Test Client" };

  const { data: created, error } = await admin
    .from(table)
    .insert(insertPayload)
    .select("id")
    .single();
  if (error || !created) {
    throw new Error(
      `${table} の手動作成に失敗しました (user_id=${userId}): ${error?.message}`
    );
  }
  return created.id as string;
}

type OrderSpec = {
  title: string;
  status: string;
  escrowStatus: string;
  basePrice: number;
  description: string;
};

const CANONICAL_RESET = {
  terminated_at: null,
  terminated_by: null,
  terminated_reason: null,
  cancelled_at: null,
  cancel_stage: null,
  cancel_refund_rate: null,
  cancel_refund_amount: null,
  cancel_creator_payout: null,
  cancel_reason: null,
  active_dispute_id: null,
  delivered_at: null,
  completed_at: null,
  inspected_at: null,
  first_reminder_sent_at: null,
  nondelivery_deadline_at: null,
  auto_approve_at: null,
  auto_approved_at: null,
  is_downloaded_by_client: false,
  first_downloaded_at: null,
  soft_deleted_at: null,
  data_retention_until: null,
  revision_count_used: 0,
  max_revisions: 3,
} as const;

async function ensureOrder(
  admin: ReturnType<typeof createClient>,
  clientProfileId: string,
  creatorProfileId: string,
  spec: OrderSpec
): Promise<string> {
  // 既存を検索
  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("title", spec.title)
    .eq("client_id", clientProfileId)
    .eq("creator_id", creatorProfileId)
    .maybeSingle();

  const payload = {
    ...CANONICAL_RESET,
    status: spec.status,
    escrow_status: spec.escrowStatus,
    base_price: spec.basePrice,
  };

  if (existing?.id) {
    // 既存 → canonical 状態に強制リセット
    const { error } = await admin
      .from("orders")
      .update(payload)
      .eq("id", existing.id);
    if (error) {
      throw new Error(`order 更新失敗 (${spec.title}): ${error.message}`);
    }
    return existing.id as string;
  }

  // 新規 INSERT
  const { data: created, error } = await admin
    .from("orders")
    .insert({
      title: spec.title,
      description: spec.description,
      client_id: clientProfileId,
      creator_id: creatorProfileId,
      ...payload,
    })
    .select("id")
    .single();
  if (error || !created) {
    throw new Error(`order 作成失敗 (${spec.title}): ${error?.message}`);
  }
  return created.id as string;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Supabase の env が未設定");
}

setup("E2E 用 order を seed (production+held / contract+pending の 2 件)", async () => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. 両アカウントの profile.id を解決
  const clientUserId = await lookupUserIdByEmail(admin, TEST_CLIENT_EMAIL);
  const creatorUserId = await lookupUserIdByEmail(admin, TEST_CREATOR_EMAIL);
  const clientProfileId = await ensureProfileId(
    admin,
    "client_profiles",
    clientUserId,
    "client"
  );
  const creatorProfileId = await ensureProfileId(
    admin,
    "creator_profiles",
    creatorUserId,
    "creator"
  );

  // 2. 2 種類の order を冪等 seed
  const terminationOrderId = await ensureOrder(
    admin,
    clientProfileId,
    creatorProfileId,
    {
      title: E2E_TITLE_TERMINATION,
      status: "production",
      escrowStatus: "held",
      basePrice: 100_000,
      description:
        "E2E テスト用 (途中終了 モーダル / 運営相談 ウィザード)。自動生成、削除しないでください。",
    }
  );

  const prePaymentOrderId = await ensureOrder(
    admin,
    clientProfileId,
    creatorProfileId,
    {
      title: E2E_TITLE_PRE_PAYMENT,
      status: "contract",
      escrowStatus: "pending",
      basePrice: 50_000,
      description:
        "E2E テスト用 (仮払い前アラート)。自動生成、削除しないでください。",
    }
  );

  // 3. .auth/e2e-orders.json に order id を書き出す (テストから読む)
  if (!fs.existsSync(".auth")) fs.mkdirSync(".auth", { recursive: true });
  fs.writeFileSync(
    ".auth/e2e-orders.json",
    JSON.stringify(
      {
        terminationOrderId,
        prePaymentOrderId,
        clientProfileId,
        creatorProfileId,
      },
      null,
      2
    )
  );

  // 最低限の sanity 検証
  expect(terminationOrderId).toMatch(/^[0-9a-f-]{36}$/);
  expect(prePaymentOrderId).toMatch(/^[0-9a-f-]{36}$/);
});
