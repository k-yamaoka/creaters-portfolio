import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatDateJP } from "@/lib/utils";
import { RulingForm } from "./ruling-form";

export const dynamic = "force-dynamic";

/**
 * §B8 管理者用 dispute 詳細画面 (2026-07-21)。
 *
 * 表示内容:
 *   1. 対象 order 情報 (title / 金額 / status / escrow / delivered_at)
 *   2. 申請者 (creator/client) + 理由 (reason)
 *   3. dispute_actions 全履歴 (public + internal 含む)
 *   4. RulingForm — resolved でない場合のみ
 */

const CATEGORY_LABEL: Record<string, string> = {
  no_response: "連絡が来ない",
  unfair_revision: "不当な修正要求",
  payment_delay: "検収・支払い遅延",
  quality_issue: "品質問題",
  termination_dispute: "途中終了の不一致",
  other: "その他",
};

const ROLE_LABEL: Record<string, string> = {
  creator: "クリエイター",
  client: "クライアント",
  admin: "運営",
  system: "システム",
};

const ACTION_LABEL: Record<string, string> = {
  reminder: "催促",
  dispute_opened: "裁定申請",
  admin_status_update: "運営ステータス更新",
  ruling: "裁定決定",
  termination_agreed: "途中終了に同意",
  termination_declined: "途中終了を拒否",
  auto_approval: "みなし検収",
  system_note: "システムノート",
};

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = getSupabaseAdmin();

  // dispute 本体 + order 詳細
  const { data: dispute } = await admin
    .from("disputes")
    .select(
      `id, order_id, opened_by_user_id, opened_by_role, category, reason,
       admin_status, internal_note, resolution_summary, ruling_type,
       ruling_refund_rate, created_at, resolved_at,
       opened_by:profiles!disputes_opened_by_user_id_fkey ( display_name ),
       orders:order_id (
         id, title, description, status, escrow_status, base_price,
         delivered_at, max_revisions, revision_count_used, first_reminder_sent_at,
         is_downloaded_by_client, first_downloaded_at,
         client:client_profiles!orders_client_id_fkey (
           id, profiles!client_profiles_user_id_fkey ( display_name )
         ),
         creator:creator_profiles!orders_creator_id_fkey (
           id, profiles!creator_profiles_user_id_fkey ( display_name )
         )
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (!dispute) notFound();

  // 履歴
  const { data: actions } = await admin
    .from("dispute_actions")
    .select(
      `id, actor_role, action_type, note, is_public, created_at,
       actor:profiles!dispute_actions_actor_user_id_fkey ( display_name )`
    )
    .eq("dispute_id", id)
    .order("created_at", { ascending: true });

  const d = dispute as unknown as {
    id: string;
    order_id: string;
    opened_by_role: string;
    category: string;
    reason: string | null;
    admin_status: string;
    internal_note: string | null;
    resolution_summary: string | null;
    ruling_type: string | null;
    ruling_refund_rate: number | null;
    created_at: string;
    resolved_at: string | null;
    opened_by?: { display_name?: string };
    orders?: {
      id: string;
      title?: string;
      description?: string;
      status?: string;
      escrow_status?: string;
      base_price?: number;
      delivered_at?: string;
      max_revisions?: number;
      revision_count_used?: number;
      first_reminder_sent_at?: string;
      is_downloaded_by_client?: boolean;
      first_downloaded_at?: string;
      client?: {
        id?: string;
        profiles?: { display_name?: string };
      };
      creator?: {
        id?: string;
        profiles?: { display_name?: string };
      };
    };
  };
  const order = d.orders;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/disputes"
          className="text-xs text-gray-500 hover:text-indigo-600"
        >
          ← 一覧に戻る
        </Link>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            裁定申請: {order?.title ?? "(タイトル無し)"}
          </h2>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              d.admin_status === "resolved"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : d.admin_status === "reviewing"
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-indigo-300 bg-indigo-50 text-indigo-800"
            }`}
          >
            {d.admin_status}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          カテゴリ: {CATEGORY_LABEL[d.category] ?? d.category} / 申請者:{" "}
          {ROLE_LABEL[d.opened_by_role] ?? d.opened_by_role} ({d.opened_by?.display_name ?? "-"}) / 受付:{" "}
          {formatDateJP(new Date(d.created_at))}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左: order + reason */}
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">申請理由</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {d.reason ?? "(記入なし)"}
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">対象 取引</h3>
            <dl className="mt-3 grid gap-x-4 gap-y-2 text-xs text-gray-700 sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">クライアント</dt>
                <dd>{order?.client?.profiles?.display_name ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">クリエイター</dt>
                <dd>{order?.creator?.profiles?.display_name ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">status</dt>
                <dd className="font-mono">{order?.status ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">escrow_status</dt>
                <dd className="font-mono">{order?.escrow_status ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">合意金額 (base_price)</dt>
                <dd className="font-mono">
                  ¥{(order?.base_price ?? 0).toLocaleString("ja-JP")}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">修正回数</dt>
                <dd className="font-mono">
                  {order?.revision_count_used ?? 0} / {order?.max_revisions ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">STEP1 催促日時</dt>
                <dd className="font-mono text-[11px]">
                  {order?.first_reminder_sent_at
                    ? new Date(order.first_reminder_sent_at)
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")
                    : "未実施"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">納品日時</dt>
                <dd className="font-mono text-[11px]">
                  {order?.delivered_at
                    ? new Date(order.delivered_at)
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")
                    : "未納品"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">クライアント ダウンロード</dt>
                <dd className="text-[11px]">
                  {order?.is_downloaded_by_client
                    ? `済 (${order.first_downloaded_at?.slice(0, 10) ?? ""})`
                    : "未"}
                </dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-[11px] text-gray-500">依頼内容 (description)</p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-gray-700">
                {order?.description ?? "-"}
              </p>
            </div>
            <div className="mt-4">
              <Link
                href={`/dashboard/orders/${d.order_id}`}
                target="_blank"
                className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-200"
              >
                ユーザー側の取引画面を確認 (別タブ)
              </Link>
            </div>
          </section>

          {/* 履歴 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">対応履歴</h3>
            {(actions ?? []).length === 0 ? (
              <p className="mt-2 text-xs text-gray-500">履歴はありません</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(actions ?? []).map((a) => {
                  const r = a as unknown as {
                    id: string;
                    actor_role: string;
                    action_type: string;
                    note: string | null;
                    is_public: boolean;
                    created_at: string;
                    actor?: { display_name?: string };
                  };
                  return (
                    <li
                      key={r.id}
                      className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 text-xs"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-gray-900">
                          {ACTION_LABEL[r.action_type] ?? r.action_type}
                          {!r.is_public && (
                            <span className="ml-1 rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-800">
                              INTERNAL
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {ROLE_LABEL[r.actor_role] ?? r.actor_role} /{" "}
                          {r.created_at
                            .slice(0, 16)
                            .replace("T", " ")}
                        </span>
                      </div>
                      {r.note && (
                        <p className="mt-1 whitespace-pre-wrap text-[11px] text-gray-700">
                          {r.note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* 右: RulingForm or 既済表示 */}
        <div>
          {d.admin_status === "resolved" ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="text-sm font-bold text-emerald-900">
                裁定 済み
              </h3>
              <dl className="mt-3 space-y-2 text-xs text-emerald-900">
                <div>
                  <dt className="text-emerald-700/80">ruling_type</dt>
                  <dd className="font-mono">{d.ruling_type ?? "-"}</dd>
                </div>
                {d.ruling_refund_rate !== null && (
                  <div>
                    <dt className="text-emerald-700/80">返金率</dt>
                    <dd className="font-mono">
                      {Math.round((d.ruling_refund_rate ?? 0) * 100)}%
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-emerald-700/80">完了日時</dt>
                  <dd className="font-mono text-[11px]">
                    {d.resolved_at
                      ? new Date(d.resolved_at)
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")
                      : "-"}
                  </dd>
                </div>
                <div className="mt-2 border-t border-emerald-200 pt-2">
                  <dt className="text-emerald-700/80">ユーザーへの説明</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-xs">
                    {d.resolution_summary ?? "-"}
                  </dd>
                </div>
                {d.internal_note && (
                  <div className="mt-2 border-t border-emerald-200 pt-2">
                    <dt className="text-emerald-700/80">
                      内部メモ (INTERNAL)
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-xs">
                      {d.internal_note}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          ) : (
            <RulingForm
              disputeId={d.id}
              basePrice={order?.base_price ?? 0}
              currentInternalNote={d.internal_note ?? ""}
            />
          )}
        </div>
      </div>
    </div>
  );
}
