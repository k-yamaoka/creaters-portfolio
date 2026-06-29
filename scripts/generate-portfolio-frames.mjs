#!/usr/bin/env node
/**
 * portfolio_items.video_url が .mp4 のすべての行について、動画から
 * 5 フレーム (時間位置 10% / 30% / 50% / 70% / 90%) を抽出して
 * Supabase Storage へアップロード + portfolio_items.frame_urls を UPDATE する。
 *
 * 用途:
 *   職務経歴書 PDF のデザインテンプレートで「動画パノラマ」(複数フレームを
 *   横並びで表示) を実現するため。
 *
 * 流れ:
 *  1. .env.local から SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 読込
 *  2. portfolio_items 全件 (video_url IS NOT NULL かつ .mp4 で終わる) を取得
 *     - 既に frame_urls が 5 件入っているものは skip (冪等)
 *  3. 動画の duration を ffprobe で取得
 *  4. ffmpeg で 5 つのタイムスタンプ位置から 1 フレームずつ jpg 抽出
 *     (480px wide, q=4 で軽量)
 *  5. portfolio-videos/frames/<work_id>/<index>.jpg にアップロード (upsert)
 *  6. portfolio_items.frame_urls = [url0, url1, url2, url3, url4] を UPDATE
 *  7. 一時ファイル削除
 *
 * 実行:
 *   node scripts/generate-portfolio-frames.mjs
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
const FRAME_PREFIX = "frames";
const FRAME_COUNT = 5; // 1 作品あたりの抽出フレーム数
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

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
  throw new Error("SUPABASE_SERVICE_ROLE_KEY が未設定 (.env.local)");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ===== ffmpeg / ffprobe =====
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} exited ${code}: ${stderr}`));
    });
  });
}

async function probeDurationSec(videoPath) {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ]);
  const d = parseFloat(stdout.trim());
  if (Number.isNaN(d) || d <= 0)
    throw new Error("could not probe duration");
  return d;
}

async function extractFrame(videoPath, atSec, outPath) {
  // -ss before -i は粗いシークだが高速。短い動画でも問題なし。
  // -frames:v 1: 1 フレームだけ
  // -vf scale=480:-1: 480px wide にダウンスケール
  // -q:v 4: 中品質 jpg (3-5 で品質と容量のバランス)
  await run("ffmpeg", [
    "-y",
    "-ss",
    String(atSec.toFixed(2)),
    "-i",
    videoPath,
    "-frames:v",
    "1",
    "-vf",
    "scale=480:-1",
    "-q:v",
    "4",
    outPath,
  ]);
}

// ===== 動画 DL (ストリーミング)  =====
async function downloadToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`HTTP ${res.status} (${url.slice(0, 80)}...)`);
  const cl = res.headers.get("content-length");
  if (cl && parseInt(cl, 10) > MAX_VIDEO_BYTES)
    throw new Error(`video too large: ${cl} bytes`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_VIDEO_BYTES)
    throw new Error(`video too large after DL: ${buf.byteLength} bytes`);
  fs.writeFileSync(destPath, buf);
  return buf.byteLength;
}

// ===== メイン =====
async function main() {
  console.log("=== Portfolio frame extractor ===");

  // 対象: video_url が .mp4 で frame_urls が未設定 (NULL または length<5)
  // ※ DB 側 PostgREST のフィルタは array_length が使えないので、まず取得して
  //    Node 側でフィルタする
  const { data: items, error } = await supabase
    .from("portfolio_items")
    .select("id, title, video_url, frame_urls")
    .not("video_url", "is", null)
    .ilike("video_url", "%.mp4");
  if (error) throw error;

  const targets = items.filter(
    (i) => !Array.isArray(i.frame_urls) || i.frame_urls.length < FRAME_COUNT
  );
  console.log(
    `target: ${targets.length} 件 (mp4 portfolio_items 全 ${items.length} 件中)`
  );

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "frames-"));

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const label = `[${i + 1}/${targets.length}] ${item.title.slice(0, 40)}`;
    const videoPath = path.join(tmpRoot, `${item.id}.mp4`);
    try {
      console.log(`${label} downloading...`);
      await downloadToFile(item.video_url, videoPath);

      const duration = await probeDurationSec(videoPath);
      // 10%, 30%, 50%, 70%, 90% の 5 ポイント
      const positions = [0.1, 0.3, 0.5, 0.7, 0.9].map((p) => p * duration);

      const urls = [];
      for (let f = 0; f < positions.length; f++) {
        const framePath = path.join(tmpRoot, `${item.id}-${f}.jpg`);
        await extractFrame(videoPath, positions[f], framePath);
        const buf = fs.readFileSync(framePath);
        const storageKey = `${FRAME_PREFIX}/${item.id}/${f}.jpg`;
        const up = await supabase.storage
          .from(BUCKET)
          .upload(storageKey, buf, {
            contentType: "image/jpeg",
            upsert: true,
          });
        if (up.error) throw new Error(`upload ${f}: ${up.error.message}`);
        const { data: pub } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(storageKey);
        urls.push(pub.publicUrl);
        fs.unlinkSync(framePath);
      }

      const upd = await supabase
        .from("portfolio_items")
        .update({ frame_urls: urls })
        .eq("id", item.id);
      if (upd.error) throw upd.error;

      ok += 1;
      console.log(`${label} ✓ 5 frames`);
    } catch (e) {
      failed += 1;
      console.warn(`${label} ✗ ${e.message}`);
    } finally {
      try {
        fs.unlinkSync(videoPath);
      } catch {}
    }
  }

  fs.rmSync(tmpRoot, { recursive: true, force: true });

  console.log("\n=== Result ===");
  console.log(`  success: ${ok}`);
  console.log(`  skipped: ${skipped}`);
  console.log(`  failed : ${failed}`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
