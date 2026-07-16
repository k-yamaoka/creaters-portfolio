#!/usr/bin/env node
/**
 * F-2: 初期案件のモック/プレースホルダーを Supabase に投入するスクリプト。
 *
 * 流れ:
 *  1. .env.local から SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を読み込み
 *  2. 「AILIER Sample Client」専用クライアントを auth + profiles +
 *     client_profiles に作成 (既存なら再利用)
 *  3. sample-jobs-metadata.json (5 案件) を順に処理
 *  4. jobs テーブルに INSERT
 *  5. 既存の sample id (title で判定) は skip して冪等化
 *
 * 実行:
 *   node scripts/seed-sample-jobs.mjs
 *
 * 前提:
 *  - .env.local に SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API)
 *  - Supabase 側で 00069 まで migration が適用済み
 *
 * 冪等性:
 *  - 同 title の jobs 行が既にあれば skip
 *  - Sample Client は email で既存判定 → 既存なら再利用
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const METADATA_PATH = path.join(REPO_ROOT, "scripts/sample-jobs-metadata.json");
const SAMPLE_CLIENT_EMAIL = "sample-client@ailier.app";
const SAMPLE_CLIENT_NAME = "AILIER Sample Client";
const SAMPLE_COMPANY_NAME = "AILIER 営業サンプル";

// ===== Env =====
function loadEnvLocal() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.local が見つかりません: ${envPath}`);
  }
  const raw = fs.readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const [, k, v] = m;
    env[k] = v.replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL が .env.local に未設定");
if (!SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY が .env.local に未設定。\n" +
      "  Supabase Dashboard → Settings → API → service_role を .env.local に追加してください。"
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ===== Helpers =====
function cryptoRandom() {
  // Node 18+ で crypto.randomUUID が使える
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

async function lookupAuthUserByEmail(email) {
  const { data, error } = await supabase.rpc("admin_lookup_auth_user_by_email", {
    p_email: email,
  });
  if (error) throw new Error(`auth lookup 失敗: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { id: row.id } : null;
}

async function ensureSampleClient() {
  let profileId = null;
  const found = await lookupAuthUserByEmail(SAMPLE_CLIENT_EMAIL);
  if (found) {
    profileId = found.id;
  } else {
    const { data: created, error: authErr } =
      await supabase.auth.admin.createUser({
        email: SAMPLE_CLIENT_EMAIL,
        password: cryptoRandom(),
        email_confirm: true,
        user_metadata: {
          display_name: SAMPLE_CLIENT_NAME,
          role: "client",
        },
      });
    if (authErr) throw new Error(`auth user 作成失敗: ${authErr.message}`);
    profileId = created.user?.id;
    if (!profileId) throw new Error("auth user 作成は成功したが id が取れない");
  }

  // profiles 行を保証
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();
  if (!existingProfile) {
    await supabase.from("profiles").insert({
      id: profileId,
      email: SAMPLE_CLIENT_EMAIL,
      display_name: SAMPLE_CLIENT_NAME,
      role: "client",
    });
  }

  // client_profiles 行を保証
  const { data: cp } = await supabase
    .from("client_profiles")
    .select("id, user_id")
    .eq("user_id", profileId)
    .maybeSingle();
  if (cp) return cp.id;

  const { data: inserted, error: cpErr } = await supabase
    .from("client_profiles")
    .insert({
      user_id: profileId,
      company_name: SAMPLE_COMPANY_NAME,
      industry: "運営サンプル",
    })
    .select("id")
    .single();
  if (cpErr) throw new Error(`client_profiles 作成失敗: ${cpErr.message}`);
  return inserted.id;
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seedJobs(clientId) {
  const raw = fs.readFileSync(METADATA_PATH, "utf-8");
  const items = JSON.parse(raw);
  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    // 冪等判定: 同 title + 同 client_id が既にあれば skip
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("client_id", clientId)
      .eq("title", item.title)
      .maybeSingle();
    if (existing) {
      console.log(`  ⏭  skip: ${item.title}`);
      skipped += 1;
      continue;
    }

    const row = {
      client_id: clientId,
      title: item.title,
      description: item.description,
      genres: item.genres ?? [],
      budget_min: item.budget_min,
      budget_max: item.budget_max,
      deadline: daysFromNow(item.deadline_days ?? 14),
      delivery_deadline: daysFromNow(item.delivery_days ?? 30),
      status: "open",
    };
    const { error } = await supabase.from("jobs").insert(row);
    if (error) {
      console.error(`  ✗  fail: ${item.title}: ${error.message}`);
      continue;
    }
    console.log(`  ✓  inserted: ${item.title}`);
    inserted += 1;
  }

  return { inserted, skipped, total: items.length };
}

// ===== Main =====
(async () => {
  console.log("▶ Sample Client 準備中...");
  const clientId = await ensureSampleClient();
  console.log(`  ✓  client_profiles.id = ${clientId}`);

  console.log("▶ Sample Jobs 投入中...");
  const stats = await seedJobs(clientId);
  console.log(
    `\n完了: 投入 ${stats.inserted} 件 / skip ${stats.skipped} 件 / 全 ${stats.total} 件`
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
