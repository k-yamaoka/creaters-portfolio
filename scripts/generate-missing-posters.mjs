#!/usr/bin/env node
/**
 * thumbnail_url が NULL の portfolio_items に対して、動画ファイル (mp4) から
 * 1 フレーム目を ffmpeg で抽出し、Supabase Storage へアップロード + DB 更新する。
 *
 * 流れ:
 *  1. .env.local から SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 読込
 *  2. portfolio_items から thumbnail_url IS NULL かつ video_url が .mp4 の
 *     行を全件取得
 *  3. 動画を一時ファイルに DL (大きいものは制限)
 *  4. ffmpeg で 1 秒目のフレームを 480px wide jpg として抽出
 *  5. portfolio-videos/posters/<id>.jpg にアップロード (upsert: false)
 *  6. portfolio_items.thumbnail_url を生成 URL で UPDATE
 *  7. 一時ファイル削除
 *
 * 冪等性:
 *  - 既に thumbnail_url が入っている行は対象外 (SELECT で除外済)
 *  - Storage で同名が既にあれば skip (upsert: false)、その URL を DB に書く
 *
 * 実行:
 *   node scripts/generate-missing-posters.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const BUCKET = "portfolio-videos";
const POSTER_PREFIX = "posters";
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB を超える動画は skip

// ===== .env.local =====
function loadEnvLocal() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  if (!fs.existsSync(envPath))
    throw new Error(`.env.local が見つかりません: ${envPath}`);
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL が未設定");
if (!SERVICE_ROLE_KEY)
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY が .env.local に未設定。\n" +
      "Supabase Dashboard → Settings → API → service_role キーを追加してください。"
  );

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function publicUrl(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

// ===== ヘルパー: ffmpeg で 1 秒目フレームを抽出 =====
function extractFrame(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // -ss 1: 1 秒目を seek (短い動画もカバーするため -ss を -i の後ろにも対応)
    // -vf scale=480:-1: 横 480px に縮小 (高さは自動)
    // -frames:v 1: 1 frame のみ書き出し
    // -y: 上書き許可
    const args = [
      "-ss",
      "1",
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-vf",
      "scale=480:-1",
      "-y",
      outputPath,
      "-loglevel",
      "error",
    ];
    const p = spawn("ffmpeg", args);
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve();
      // 1 秒目に seek できない短い動画は -ss なしで再試行
      else if (code !== 0) {
        const args2 = [
          "-i",
          inputPath,
          "-frames:v",
          "1",
          "-vf",
          "scale=480:-1",
          "-y",
          outputPath,
          "-loglevel",
          "error",
        ];
        const p2 = spawn("ffmpeg", args2);
        let stderr2 = "";
        p2.stderr.on("data", (d) => (stderr2 += d.toString()));
        p2.on("error", reject);
        p2.on("close", (c2) => {
          if (c2 === 0) resolve();
          else reject(new Error(`ffmpeg failed (${code}/${c2}): ${stderr2 || stderr}`));
        });
      }
    });
  });
}

// ===== ヘルパー: URL → tmp に DL =====
async function downloadToTmp(url, dest) {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  const len = Number(r.headers.get("content-length") || 0);
  if (len && len > MAX_VIDEO_BYTES)
    throw new Error(`動画が大きすぎる (${(len / 1024 / 1024).toFixed(1)}MB > 100MB)`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_VIDEO_BYTES)
    throw new Error(`動画が大きすぎる (${(buf.length / 1024 / 1024).toFixed(1)}MB > 100MB)`);
  fs.writeFileSync(dest, buf);
}

// ===== ヘルパー: Storage に存在チェック → なければアップロード =====
async function uploadIfMissing(localPath, storagePath) {
  const dir = path.posix.dirname(storagePath);
  const base = path.posix.basename(storagePath);
  const { data: list } = await supabase.storage
    .from(BUCKET)
    .list(dir, { limit: 1000, search: base });
  const exists = list?.some((f) => f.name === base);
  if (exists) return { reused: true };
  const buf = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(`Storage upload 失敗: ${error.message}`);
  return { uploaded: true };
}

// ===== メイン =====
async function main() {
  console.log("== Generate missing posters from videos ==");
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  const { data: items, error } = await supabase
    .from("portfolio_items")
    .select("id, title, video_url")
    .is("thumbnail_url", null)
    .eq("media_type", "video");
  if (error) throw new Error(`SELECT 失敗: ${error.message}`);
  const targets = (items ?? []).filter(
    (it) => it.video_url && /\.mp4(\?|$)/i.test(it.video_url)
  );
  console.log(`対象: ${targets.length} 件 (thumbnail_url=NULL & mp4 動画)\n`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "poster-gen-"));
  let ok = 0;
  let skipped = 0;
  const failures = [];

  for (const it of targets) {
    const id = it.id;
    const videoTmp = path.join(tmpDir, `${id}.mp4`);
    const posterTmp = path.join(tmpDir, `${id}.jpg`);
    const storagePath = `${POSTER_PREFIX}/${id}.jpg`;
    try {
      console.log(`[${id}] ${it.title}`);
      console.log(`  ↓ DL ${it.video_url.slice(0, 80)}…`);
      await downloadToTmp(it.video_url, videoTmp);
      console.log(`  ⚙ ffmpeg frame抽出`);
      await extractFrame(videoTmp, posterTmp);
      const r = await uploadIfMissing(posterTmp, storagePath);
      console.log(`  ↑ Storage ${r.uploaded ? "new" : "reuse"}`);
      const newUrl = publicUrl(storagePath);
      const { error: upErr } = await supabase
        .from("portfolio_items")
        .update({ thumbnail_url: newUrl })
        .eq("id", id);
      if (upErr) throw new Error(`UPDATE 失敗: ${upErr.message}`);
      console.log(`  ✓ DB updated\n`);
      ok++;
    } catch (e) {
      console.log(`  ✗ ${e.message}\n`);
      failures.push({ id, title: it.title, error: e.message });
      skipped++;
    } finally {
      for (const f of [videoTmp, posterTmp]) {
        try {
          fs.unlinkSync(f);
        } catch {
          /* ignore */
        }
      }
    }
  }

  try {
    fs.rmdirSync(tmpDir);
  } catch {
    /* ignore */
  }

  console.log(`完了: ${ok} 件成功 / ${skipped} 件スキップ`);
  if (failures.length > 0) {
    console.log("\n失敗一覧:");
    for (const f of failures) console.log(`  - ${f.id} (${f.title}): ${f.error}`);
  }
}

main().catch((e) => {
  console.error("\n[FATAL]", e.message);
  process.exit(1);
});
