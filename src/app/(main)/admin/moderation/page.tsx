import { getSupabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { ModerationActionForm } from "./moderation-action-form";

export const dynamic = "force-dynamic";

/**
 * 管理者用モデレーション画面 (00072)。
 *
 * 表示:
 *   1. 未対応の通報 (open) 一覧
 *   2. 現在 unpublished / deleted な portfolio_items 一覧
 *
 * 操作:
 *   - 各行から <ModerationActionForm> で unpublish / delete / restore + 理由
 *   - 実行時は /api/admin/portfolio/:id/moderation を叩く
 */

const CATEGORY_LABEL: Record<string, string> = {
  copyright: "著作権侵害",
  impersonation: "なりすまし",
  inappropriate: "公序良俗違反",
  unauthorized_person: "実在人物 無断生成",
  spam: "スパム",
  other: "その他",
};

const STATUS_LABEL: Record<string, string> = {
  published: "公開中",
  unpublished: "一時非公開",
  deleted: "削除済み",
};

const STATUS_BADGE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unpublished: "bg-amber-50 text-amber-800 border-amber-200",
  deleted: "bg-red-50 text-red-700 border-red-200",
};

export default async function AdminModerationPage() {
  // service_role で RLS を bypass して集計 (auth は layout で保証済)
  const admin = getSupabaseAdmin();

  // 1. 未対応 (open) 通報を件数と最新通報でグループ化
  //   Supabase JS の group by は制約が多いので、生 SELECT + JS 側で集約
  const { data: openReports } = await admin
    .from("content_reports")
    .select(
      "id, target_id, reason_category, reason_note, reporter_ip, created_at, reporter:profiles!content_reports_reporter_user_id_fkey ( display_name )"
    )
    .eq("target_type", "portfolio_item")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(200);

  // target_id ごとに集約
  type Grouped = {
    targetId: string;
    total: number;
    uniqueIps: Set<string>;
    latest: string;
    categories: Map<string, number>;
    latestNote: string | null;
  };
  const grouped = new Map<string, Grouped>();
  for (const r of openReports ?? []) {
    const key = r.target_id as string;
    const g =
      grouped.get(key) ??
      ({
        targetId: key,
        total: 0,
        uniqueIps: new Set<string>(),
        latest: r.created_at as string,
        categories: new Map(),
        latestNote: null,
      } as Grouped);
    g.total += 1;
    if (r.reporter_ip) g.uniqueIps.add(r.reporter_ip as string);
    if ((r.created_at as string) > g.latest) g.latest = r.created_at as string;
    g.categories.set(
      r.reason_category as string,
      (g.categories.get(r.reason_category as string) ?? 0) + 1
    );
    if (!g.latestNote && r.reason_note) g.latestNote = r.reason_note as string;
    grouped.set(key, g);
  }
  const groupedList = Array.from(grouped.values()).sort(
    (a, b) => b.uniqueIps.size - a.uniqueIps.size || b.total - a.total
  );

  // 通報対象作品の情報をまとめて取得
  const targetIds = groupedList.map((g) => g.targetId);
  type ItemRow = {
    id: string;
    title: string | null;
    thumbnail_url: string | null;
    image_url: string | null;
    moderation_status: string;
    creator?: {
      profiles?: { display_name?: string };
    };
  };
  const { data: rawItems } = targetIds.length
    ? await admin
        .from("portfolio_items")
        .select(
          "id, title, thumbnail_url, image_url, moderation_status, creator:creator_profiles!portfolio_items_creator_id_fkey ( id, profiles!creator_profiles_user_id_fkey ( display_name ) )"
        )
        .in("id", targetIds)
    : { data: null };
  const items = (rawItems ?? []) as unknown as ItemRow[];
  const itemMap = new Map<string, ItemRow>();
  for (const it of items) itemMap.set(it.id, it);

  // 2. モデレーション対象 (unpublished / deleted) 一覧
  const { data: moderated } = await admin
    .from("portfolio_items")
    .select(
      "id, title, thumbnail_url, image_url, moderation_status, moderation_reason, moderated_at, creator:creator_profiles!portfolio_items_creator_id_fkey ( id, profiles!creator_profiles_user_id_fkey ( display_name ) )"
    )
    .in("moderation_status", ["unpublished", "deleted"])
    .order("moderated_at", { ascending: false })
    .limit(100);

  // 3. 直近の監査ログ
  const { data: auditLog } = await admin
    .from("moderation_actions")
    .select(
      "id, action_type, actor_role, reason, created_at, target_id, actor_user_id, actor:profiles!moderation_actions_actor_user_id_fkey ( display_name )"
    )
    .eq("target_type", "portfolio_item")
    .order("created_at", { ascending: false })
    .limit(30);

  // 4. 常習者 (§B-2 §1d) — creator_report_stats view (00078) から
  //    累積通報 / 累積非公開 が多い creator を上位表示。
  const { data: rawRepeatOffenders } = await admin
    .from("creator_report_stats")
    .select("creator_profile_id, report_total, report_open, unpublished_total, deleted_total, last_incident_at")
    .order("report_total", { ascending: false })
    .limit(20);
  type OffenderRow = {
    creator_profile_id: string;
    report_total: number;
    report_open: number;
    unpublished_total: number;
    deleted_total: number;
    last_incident_at: string | null;
    display_name?: string;
  };
  const repeatOffenders: OffenderRow[] = ((rawRepeatOffenders ?? []) as unknown as OffenderRow[])
    .filter((r) => r.report_total >= 2 || r.unpublished_total >= 1);
  // 名前をまとめて解決
  if (repeatOffenders.length > 0) {
    const ids = repeatOffenders.map((r) => r.creator_profile_id);
    const { data: creators } = await admin
      .from("creator_profiles")
      .select("id, profiles!creator_profiles_user_id_fkey ( display_name )")
      .in("id", ids);
    const map = new Map<string, string>();
    for (const c of creators ?? []) {
      const row = c as unknown as {
        id: string;
        profiles?: { display_name?: string };
      };
      map.set(row.id, row.profiles?.display_name ?? "-");
    }
    for (const r of repeatOffenders) {
      r.display_name = map.get(r.creator_profile_id) ?? "-";
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-bold text-gray-900">モデレーション</h2>
        <p className="mt-1 text-sm text-gray-500">
          通報の受付・確認と、一時非公開 / 削除 / 復元 の操作。
        </p>
      </div>

      {/* 未対応通報 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-gray-900">
          未対応の通報 ({groupedList.length} 作品)
        </h3>
        {groupedList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            未対応の通報はありません
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-3">作品</th>
                  <th className="px-3 py-3">クリエイター</th>
                  <th className="px-3 py-3">状態</th>
                  <th className="px-3 py-3 text-right">通報数 (unique IP)</th>
                  <th className="px-3 py-3">主要カテゴリ</th>
                  <th className="px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupedList.map((g) => {
                  const it = itemMap.get(g.targetId);
                  const topCategory =
                    Array.from(g.categories.entries()).sort(
                      (a, b) => b[1] - a[1]
                    )[0]?.[0] ?? "-";
                  return (
                    <tr key={g.targetId}>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/creators/${
                            it?.creator ? "" : ""
                          }#portfolio`}
                          className="font-medium text-gray-900 hover:text-red-600"
                        >
                          {it?.title ?? "(削除済み)"}
                        </Link>
                        {g.latestNote && (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">
                            {g.latestNote}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-700">
                        {it?.creator?.profiles?.display_name ?? "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            STATUS_BADGE[it?.moderation_status ?? ""] ??
                            "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {STATUS_LABEL[it?.moderation_status ?? ""] ??
                            "unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs text-gray-700">
                        {g.total} <span className="text-gray-400">(</span>
                        <span
                          className={
                            g.uniqueIps.size >= 3
                              ? "text-red-600 font-bold"
                              : ""
                          }
                        >
                          {g.uniqueIps.size}
                        </span>
                        <span className="text-gray-400">)</span>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-700">
                        {CATEGORY_LABEL[topCategory] ?? topCategory}
                      </td>
                      <td className="px-3 py-2.5">
                        <ModerationActionForm
                          portfolioId={g.targetId}
                          currentStatus={it?.moderation_status ?? "published"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* モデレーション対象作品 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-gray-900">
          非公開 / 削除済み ({(moderated ?? []).length} 件)
        </h3>
        {(moderated ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            対象作品はありません
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-3">作品</th>
                  <th className="px-3 py-3">クリエイター</th>
                  <th className="px-3 py-3">状態</th>
                  <th className="px-3 py-3">理由</th>
                  <th className="px-3 py-3">日時</th>
                  <th className="px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(moderated ?? []).map((r) => {
                  const row = r as unknown as {
                    id: string;
                    title: string;
                    moderation_status: string;
                    moderation_reason: string | null;
                    moderated_at: string | null;
                    creator?: {
                      profiles?: { display_name?: string };
                    };
                  };
                  return (
                    <tr key={row.id}>
                      <td className="px-3 py-2.5 text-xs font-medium text-gray-900">
                        {row.title ?? "(無題)"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-700">
                        {row.creator?.profiles?.display_name ?? "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            STATUS_BADGE[row.moderation_status] ?? ""
                          }`}
                        >
                          {STATUS_LABEL[row.moderation_status] ??
                            row.moderation_status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 line-clamp-2 max-w-xs text-[11px] text-gray-600">
                        {row.moderation_reason ?? "-"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-500">
                        {row.moderated_at?.slice(0, 10) ?? "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <ModerationActionForm
                          portfolioId={row.id}
                          currentStatus={row.moderation_status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 常習者 (§B-2 §1d) */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-gray-900">
          常習者 (通報 2 件以上 / 非公開 1 回以上)
        </h3>
        {repeatOffenders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            対象クリエイターはいません
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-3">クリエイター</th>
                  <th className="px-3 py-3 text-right">累積通報</th>
                  <th className="px-3 py-3 text-right">未対応</th>
                  <th className="px-3 py-3 text-right">非公開回数</th>
                  <th className="px-3 py-3 text-right">削除回数</th>
                  <th className="px-3 py-3">最新インシデント</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {repeatOffenders.map((r) => {
                  const severe = r.deleted_total > 0 || r.unpublished_total >= 3;
                  return (
                    <tr key={r.creator_profile_id}>
                      <td className="px-3 py-2.5">
                        <span
                          className={`text-xs font-medium ${severe ? "text-red-800" : "text-gray-900"}`}
                        >
                          {r.display_name ?? "-"}
                        </span>
                        {severe && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                            ⚠️要監視
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs">
                        {r.report_total}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs">
                        {r.report_open > 0 ? (
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-800">
                            {r.report_open}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs">
                        {r.unpublished_total}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs">
                        {r.deleted_total > 0 ? (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-800">
                            {r.deleted_total}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500">
                        {r.last_incident_at?.slice(0, 10) ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 監査ログ */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-gray-900">
          監査ログ (直近 30 件)
        </h3>
        {(auditLog ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            ログはありません
          </div>
        ) : (
          <ul className="space-y-2">
            {(auditLog ?? []).map((a) => {
              const row = a as unknown as {
                id: string;
                action_type: string;
                actor_role: string;
                reason: string;
                created_at: string;
                target_id: string;
                actor?: { display_name?: string };
              };
              return (
                <li
                  key={row.id}
                  className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-gray-900">
                      {row.action_type}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {row.created_at.slice(0, 16).replace("T", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-600">
                    実行者:{" "}
                    {row.actor_role === "system"
                      ? "システム"
                      : (row.actor?.display_name ?? "管理者")}
                    {" / "}対象: {row.target_id.slice(0, 8)}...
                  </p>
                  <p className="mt-1 text-[11px] text-gray-700">
                    理由: {row.reason}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
