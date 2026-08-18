import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { notifyAdmin } from "@/lib/admin-notify";

/**
 * 日次で、48 時間以上放置されている open な通報を集計して運営に通知する。
 *
 * open 判定: content_reports.status='open' (unpublish/delete/restore/dismissed 前)。
 * 起票から 48h 経過したもの、または最古のものだけをまとめて 1 通で通知。
 *
 * 対象 0 件なら何もしない (静かな日)。
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const STALE_HOURS = 48;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 401 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - STALE_HOURS * 3600_000).toISOString();

  const { data: stale, error } = await admin
    .from("content_reports")
    .select("id, category, target_id, target_type, created_at")
    .eq("status", "open")
    .lte("created_at", cutoff)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[cron/pending-reports-reminder] fetch failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const count = stale?.length ?? 0;
  if (count === 0) {
    return NextResponse.json({ ok: true, count: 0, message: "no stale reports" });
  }

  // カテゴリ別に集約
  const byCategory = new Map<string, number>();
  for (const r of stale ?? []) {
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
  }
  const oldestAt = stale?.[0]?.created_at;
  const ageDays = oldestAt
    ? Math.floor((Date.now() - new Date(oldestAt).getTime()) / 86_400_000)
    : 0;

  try {
    await notifyAdmin({
      kind: "content_report",
      subjectPrefix: "【リマインダー】",
      subject: `48h 以上放置の通報 ${count} 件`,
      body:
        `${STALE_HOURS} 時間以上 status=open のままの通報が ${count} 件あります。\n` +
        `最古: ${ageDays} 日前 (${oldestAt ?? "-"})\n\n` +
        `カテゴリ別内訳:\n` +
        Array.from(byCategory.entries())
          .map(([cat, n]) => `- ${cat}: ${n} 件`)
          .join("\n"),
      fields: Array.from(byCategory.entries())
        .slice(0, 6)
        .map(([cat, n]) => ({ label: cat, value: String(n) })),
      actions: [
        {
          label: "モデレーション画面へ",
          path: "/admin/moderation",
          style: "primary",
        },
      ],
    });
  } catch (e) {
    console.error("[cron/pending-reports-reminder] notifyAdmin failed", e);
  }

  return NextResponse.json({ ok: true, count });
}
