#!/usr/bin/env node
/**
 * AILIER Sample Works を Supabase に投入するスクリプト。
 *
 * 流れ:
 *  1. .env.local から SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を読み込み
 *  2. 「AILIER Showcase」専用クリエイターを auth + profiles + creator_profiles
 *     に作成 (既存なら再利用)
 *  3. metadata JSON (sample-works-metadata.json) を順に処理
 *  4. 各 mp4 を portfolio-videos/samples/<fileId>.mp4 にアップロード
 *  5. ffmpeg で抽出済の poster jpg を portfolio-videos/samples/<fileId>.jpg
 *     にアップロード
 *  6. portfolio_items に INSERT (display_tag='sample:<fileId>' で冪等判定)
 *
 * 実行前に必要なもの:
 *  - .env.local に SUPABASE_SERVICE_ROLE_KEY を追加
 *  - poster 画像は /tmp/ailier-posters/<base>.jpg にあること (本スクリプトから
 *    ffmpeg で再生成する処理は省略 — 既存の生成済を使う)
 *  - mp4 本体は VIDEOS_DIR 配下にあること (既定: gigafile 解凍済ディレクトリ)
 *
 * 実行:
 *   node scripts/seed-sample-works.mjs
 *
 * 冪等性:
 *  - 同 fileId の portfolio_items 行が既にあれば skip (display_tag で判定)
 *  - Storage にファイルが既にあれば upsert で上書き
 *  - Showcase クリエイターは email で既存判定 → 既存なら再利用
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const VIDEOS_DIR =
  process.env.SAMPLE_VIDEOS_DIR ||
  "/Users/yamaokakoushi/Downloads/gigafile-0719-3bd307c85f2b3069277cf6627ee063eb";
const POSTERS_DIR = process.env.SAMPLE_POSTERS_DIR || "/tmp/ailier-posters";
const METADATA_PATH = path.join(REPO_ROOT, "scripts/sample-works-metadata.json");

const SHOWCASE_EMAIL = "showcase@ailier.app";
const SHOWCASE_NAME = "AILIER Showcase";
const BUCKET = "portfolio-videos";
const STORAGE_PREFIX = "samples";

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
      "  Supabase Dashboard → Settings → API → service_role キーを .env.local に追加してください。"
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ===== Helpers =====
function publicUrl(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function lookupAuthUserByEmail(email) {
  // auth.admin.listUsers / REST /admin/users は本プロジェクトでは empty を返す
  // (auth schema 内に隠れ行があり listing で隠れる挙動)。
  // 00061 で追加した SECURITY DEFINER RPC で auth.users を直接引く。
  const { data, error } = await supabase.rpc("admin_lookup_auth_user_by_email", {
    p_email: email,
  });
  if (error) throw new Error(`auth lookup 失敗: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { id: row.id } : null;
}

async function ensureShowcaseCreator() {
  // 1) Auth User を優先確認 (前回 partial 失敗で auth.users だけ作成済の可能性)
  let profileId = null;
  const found = await lookupAuthUserByEmail(SHOWCASE_EMAIL);
  if (found) {
    profileId = found.id;
  } else {
    const { data: created, error: authErr } =
      await supabase.auth.admin.createUser({
        email: SHOWCASE_EMAIL,
        password: cryptoRandom(),
        email_confirm: true,
        user_metadata: {
          display_name: SHOWCASE_NAME,
          role: "creator",
        },
      });
    if (authErr) throw new Error(`auth user 作成失敗: ${authErr.message}`);
    profileId = created.user?.id;
    if (!profileId) throw new Error("auth user 作成は成功したが id が取れない");
  }

  // 2) profiles 行を upsert (trigger が作る場合も上書き保証)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();
  if (existingProfile) {
    await supabase
      .from("profiles")
      .update({ display_name: SHOWCASE_NAME, role: "creator" })
      .eq("id", profileId);
  } else {
    // trigger が走らなかった場合のフォールバック
    await supabase.from("profiles").insert({
      id: profileId,
      email: SHOWCASE_EMAIL,
      display_name: SHOWCASE_NAME,
      role: "creator",
    });
  }

  // 3) creator_profiles 行を upsert
  const { data: cp } = await supabase
    .from("creator_profiles")
    .select("id, user_id")
    .eq("user_id", profileId)
    .maybeSingle();

  if (cp) {
    return cp.id;
  }

  // 00030 で skills カラムは削除済。strengths / video_lengths / ai_tools などが
  // 後発の列に切り替わっている。本スクリプトでは必須でないものは空配列で投入。
  const { data: inserted, error: cpErr } = await supabase
    .from("creator_profiles")
    .insert({
      user_id: profileId,
      bio: "AILIER 公式サンプル作品集。Sora 2 / Veo 3 / Runway Gen-4 / Kling 2.x で生成された見本動画を 18 本掲載しています。",
      genres: [
        "SNS広告動画",
        "商品紹介動画",
        "会社紹介・コーポレートVP",
        "ミュージックビデオ",
        "ショートドラマ",
        "AIアバター・キャラクター動画",
      ],
      strengths: ["AI 生成全般", "シネマティック演出"],
      ai_tools: ["Sora 2", "Veo 3", "Runway Gen-4", "Kling 2.x"],
      video_lengths: ["〜15秒(SNS広告標準)", "〜60秒", "1〜3分(解説動画 / ショートドラマ)"],
      location: "Tokyo",
      years_of_experience: 0,
    })
    .select("id")
    .single();
  if (cpErr) throw new Error(`creator_profiles INSERT 失敗: ${cpErr.message}`);
  return inserted.id;
}

function cryptoRandom() {
  // 32 文字のランダム英数字 (パスワード用、保存はしない / Service Role でログイン操作する)
  return [...Array(32)]
    .map(() => Math.floor(Math.random() * 36).toString(36))
    .join("");
}

async function uploadIfMissing(localPath, storagePath, contentType) {
  // 既にあるかチェック
  const { data: list } = await supabase.storage
    .from(BUCKET)
    .list(path.posix.dirname(storagePath), {
      limit: 1000,
      search: path.posix.basename(storagePath),
    });
  const exists = list?.some((f) => f.name === path.posix.basename(storagePath));
  if (exists) {
    return { uploaded: false, reused: true };
  }

  const buf = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buf, {
      contentType,
      upsert: false,
    });
  if (error) throw new Error(`Storage upload 失敗 (${storagePath}): ${error.message}`);
  return { uploaded: true, reused: false };
}

async function seedOne(creatorId, meta) {
  const display_tag = `sample:${meta.fileId}`;

  // 既存 row があれば skip
  const { data: existing } = await supabase
    .from("portfolio_items")
    .select("id")
    .eq("display_tag", display_tag)
    .maybeSingle();
  if (existing) {
    console.log(`  [skip] ${meta.fileId} ${meta.title} (既存)`);
    return { skipped: true };
  }

  const videoLocal = path.join(VIDEOS_DIR, meta.fileName);
  const posterBase = meta.fileName.replace(/\.mp4$/, ".jpg");
  const posterLocal = path.join(POSTERS_DIR, posterBase);

  if (!fs.existsSync(videoLocal)) {
    throw new Error(`動画が見つかりません: ${videoLocal}`);
  }
  if (!fs.existsSync(posterLocal)) {
    throw new Error(`poster が見つかりません: ${posterLocal}`);
  }

  const videoKey = `${STORAGE_PREFIX}/${meta.fileId}.mp4`;
  const posterKey = `${STORAGE_PREFIX}/${meta.fileId}.jpg`;

  const v = await uploadIfMissing(videoLocal, videoKey, "video/mp4");
  const p = await uploadIfMissing(posterLocal, posterKey, "image/jpeg");
  console.log(
    `  [up]   ${meta.fileId} video=${v.uploaded ? "new" : "reuse"} poster=${p.uploaded ? "new" : "reuse"}`
  );

  const { error: insErr } = await supabase.from("portfolio_items").insert({
    creator_id: creatorId,
    title: meta.title,
    description: meta.description,
    media_type: "video",
    video_url: publicUrl(videoKey),
    video_platform: "mp4",
    thumbnail_url: publicUrl(posterKey),
    aspect_ratio: meta.aspect_ratio,
    genre: meta.genre,
    tags: meta.tags ?? [],
    used_ai_tools: meta.used_ai_tools ?? [],
    duration_seconds: meta.duration_seconds ?? null,
    visual_style: meta.visual_style ?? null,
    resolution: meta.resolution ?? null,
    usage_role: meta.usage_role ?? "works",
    is_featured: meta.is_featured ?? false,
    display_tag,
    role_scope: "AI 生成 + 編集",
  });
  if (insErr) throw new Error(`portfolio_items INSERT 失敗: ${insErr.message}`);
  console.log(`  [ins]  ${meta.fileId} ${meta.title}`);
  return { inserted: true };
}

// ===== main =====
async function main() {
  console.log("== AILIER sample works seed ==");
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Videos dir:   ${VIDEOS_DIR}`);
  console.log(`Posters dir:  ${POSTERS_DIR}`);

  const meta = JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8"));
  console.log(`Metadata:     ${meta.length} 件\n`);

  console.log("[1] AILIER Showcase クリエイターを準備");
  const creatorId = await ensureShowcaseCreator();
  console.log(`  creator_id: ${creatorId}\n`);

  console.log("[2] 18 本のアップロード + INSERT");
  let inserted = 0;
  let skipped = 0;
  for (const m of meta) {
    const r = await seedOne(creatorId, m);
    if (r.inserted) inserted++;
    if (r.skipped) skipped++;
  }
  console.log(`\n完了: ${inserted} 件 INSERT / ${skipped} 件 skip`);
}

main().catch((e) => {
  console.error("\n[FATAL]", e.message);
  process.exit(1);
});
