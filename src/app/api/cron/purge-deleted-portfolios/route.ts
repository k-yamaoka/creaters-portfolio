import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { notifyAdmin } from "@/lib/admin-notify";

/**
 * MOD-028/029: deleted 作品の Storage 物理削除 cron (日次)。
 *
 * ロジック:
 *   1. Bearer CRON_SECRET で認可
 *   2. portfolio_items WHERE moderation_status='deleted'
 *        AND moderated_at < now() - INTERVAL '30 days' を最大 200 件抽出
 *   3. 各 item の video_url / thumbnail_url / image_url から
 *      portfolio-videos バケット内 path を抽出し、storage.remove() 一括削除
 *   4. moderation_actions に 'hard_purge' 監査ログを INSERT
 *   5. portfolio_items 行を物理 DELETE
 *   6. 運営に件数サマリ通知 (削除発生時のみ)
 *
 * 30 日 grace period:
 *   - unpublish/delete → 復元 (restore) の余地を残すため
 *   - 異議申立て期間 (72h) の 10 倍を確保
 *
 * 冪等: 失敗 (Storage remove エラー等) しても portfolio_items 行は残るので
 *   翌日再試行される。moderation_actions は最初の成功時に INSERT され、
 *   以後 行が消えるので 二重 INSERT は発生しない。
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 猶予期間 (日) — restore / 異議申立て のため */
const GRACE_DAYS = 30;
/** 1 実行あたりの最大件数 — Vercel 60s 制約内に収める */
const BATCH_LIMIT = 200;
/** 対象バケット (video / thumbnail 両方このバケットに入る) */
const BUCKET_ID = "portfolio-videos";

type Item = {
  id: string;
  video_url: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  creator_id: string;
  title: string | null;
};

/**
 * Supabase Storage の public URL から バケット相対 path を抽出。
 *   `https://xxx.supabase.co/storage/v1/object/public/portfolio-videos/{path}`
 *     → `{path}`
 *   バケット名 不一致 or URL 形式不正 は null。
 */
function extractPortfolioVideosPath(url: string | null): string | null {
  if (!url) return null;
  const marker = `/${BUCKET_ID}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const path = url.slice(idx + marker.length).split("?")[0];
  // パストラバーサル / 空 path 除外
  if (!path || path.includes("..") || path.startsWith("/")) return null;
  return path;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/purge-deleted-portfolios] CRON_SECRET is not set");
    return NextResponse.json(
      { ok: false, error: "not configured" },
      { status: 401 }
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const startedAt = Date.now();
  const admin = getSupabaseAdmin();

  const cutoffIso = new Date(
    Date.now() - GRACE_DAYS * 86400_000
  ).toISOString();

  // 1) 対象 item 抽出
  const { data: items, error: selectError } = await admin
    .from("portfolio_items")
    .select("id, video_url, image_url, thumbnail_url, creator_id, title")
    .eq("moderation_status", "deleted")
    .lt("moderated_at", cutoffIso)
    .limit(BATCH_LIMIT);

  if (selectError) {
    console.error(
      "[cron/purge-deleted-portfolios] select failed",
      selectError
    );
    return NextResponse.json(
      { ok: false, error: `select failed: ${selectError.message}` },
      { status: 500 }
    );
  }

  const targets = (items ?? []) as Item[];
  if (targets.length === 0) {
    return NextResponse.json({
      ok: true,
      candidates: 0,
      purged: 0,
      durationMs: Date.now() - startedAt,
    });
  }

  const errors: string[] = [];
  const purgedIds: string[] = [];
  const storageRemoved: string[] = [];

  for (const item of targets) {
    // 2) Storage path 抽出 (最大 3 パス: video / thumbnail / image)
    const paths: string[] = [];
    for (const url of [item.video_url, item.thumbnail_url, item.image_url]) {
      const p = extractPortfolioVideosPath(url);
      if (p) paths.push(p);
    }

    // 3) Storage remove (paths 空でも先に進む: URL が別 CDN の可能性)
    if (paths.length > 0) {
      const { error: rmError } = await admin.storage
        .from(BUCKET_ID)
        .remove(paths);
      if (rmError) {
        // Storage 削除失敗はスキップ (翌日再試行される)
        errors.push(`storage.remove ${item.id}: ${rmError.message}`);
        continue;
      }
      storageRemoved.push(...paths);
    }

    // 4) 監査ログ INSERT (hard_purge)
    const { error: logError } = await admin.from("moderation_actions").insert({
      target_type: "portfolio_item",
      target_id: item.id,
      actor_user_id: null,
      actor_role: "system",
      action_type: "hard_purge",
      reason: `deleted 状態から ${GRACE_DAYS} 日経過したため Storage + DB 物理削除 (title="${
        item.title ?? "(無題)"
      }", removed ${paths.length} storage object${paths.length === 1 ? "" : "s"})`,
    });
    if (logError) {
      errors.push(`audit log ${item.id}: ${logError.message}`);
      continue;
    }

    // 5) portfolio_items 行を DELETE
    const { error: delError } = await admin
      .from("portfolio_items")
      .delete()
      .eq("id", item.id);
    if (delError) {
      errors.push(`row delete ${item.id}: ${delError.message}`);
      continue;
    }

    purgedIds.push(item.id);
  }

  // 6) 削除発生時のみ 運営通知
  if (purgedIds.length > 0) {
    try {
      await notifyAdmin({
        kind: "info",
        subjectPrefix: "【定期処理】",
        subject: `deleted 作品 ${purgedIds.length} 件を Storage + DB から物理削除`,
        body: `${GRACE_DAYS} 日 grace period を経過した deleted 状態の作品を、Storage オブジェクト ${storageRemoved.length} 件とあわせて物理削除しました。`,
        fields: [
          { label: "物理削除 件数 (row)", value: String(purgedIds.length) },
          {
            label: "Storage 削除 件数 (objects)",
            value: String(storageRemoved.length),
          },
          { label: "エラー", value: String(errors.length) },
        ],
      });
    } catch (e) {
      console.error("[cron/purge-deleted-portfolios] notify failed", e);
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: targets.length,
    purged: purgedIds.length,
    storageRemoved: storageRemoved.length,
    errors,
    durationMs: Date.now() - startedAt,
  });
}
