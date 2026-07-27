import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatDateJP } from "@/lib/utils";
import { InviteSection } from "./invite-section";

export const dynamic = "force-dynamic";

/**
 * C-3 管理者用 案件詳細 + スカウト UI (2026-07-21)。
 *
 * 左: 案件情報 + 既招待クリエイター一覧 (status バッジ + 日時)
 * 右: <InviteSection> — タグで creator を検索して 招待ボタン
 */

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = await params;
  const admin = getSupabaseAdmin();

  // 案件情報
  const { data: job } = await admin
    .from("jobs")
    .select(
      `id, title, description, status, budget_min, budget_max, deadline,
       delivery_deadline, application_count, genres, created_at,
       client:client_profiles!jobs_client_id_fkey (
         id, company_name,
         profiles!client_profiles_user_id_fkey ( display_name )
       )`
    )
    .eq("id", jobId)
    .maybeSingle();

  if (!job) notFound();

  const j = job as unknown as {
    id: string;
    title: string;
    description: string;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    deadline: string | null;
    delivery_deadline: string | null;
    application_count: number;
    genres: string[] | null;
    created_at: string;
    client?: {
      company_name?: string | null;
      profiles?: { display_name?: string };
    };
  };

  // タグマスタ (invite セクションで使う)
  const { data: tags } = await admin
    .from("tags")
    .select("id, category, name, sort_order")
    .eq("is_active", true)
    .order("category")
    .order("sort_order");

  // job_tags (既に案件に紐付いたタグ)
  const { data: jobTags } = await admin
    .from("job_tags")
    .select("tag_id, requirement")
    .eq("job_id", jobId);
  const jobTagIds = new Set(
    (jobTags ?? []).map((t) => (t as { tag_id: string }).tag_id)
  );

  // 既招待クリエイター
  const { data: invitations } = await admin
    .from("job_invitations")
    .select(
      `id, status, sent_at, responded_at, expires_at, message,
       creator:creator_profiles!job_invitations_creator_id_fkey (
         id, profiles!creator_profiles_user_id_fkey ( display_name, avatar_url )
       )`
    )
    .eq("job_id", jobId)
    .order("sent_at", { ascending: false });

  const invitationRows = ((invitations ?? []) as unknown as Array<{
    id: string;
    status: string;
    sent_at: string;
    responded_at: string | null;
    expires_at: string;
    message: string | null;
    creator?: {
      id: string;
      profiles?: { display_name?: string; avatar_url?: string | null };
    };
  }>);

  const STATUS_BADGE: Record<string, string> = {
    pending: "border-indigo-300 bg-indigo-50 text-indigo-800",
    accepted: "border-emerald-300 bg-emerald-50 text-emerald-800",
    declined: "border-gray-300 bg-gray-50 text-gray-600",
    expired: "border-amber-300 bg-amber-50 text-amber-800",
  };
  const STATUS_LABEL: Record<string, string> = {
    pending: "招待中",
    accepted: "応募済",
    declined: "見送り",
    expired: "期限切れ",
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/jobs"
          className="text-xs text-gray-500 hover:text-indigo-600"
        >
          ← 案件一覧に戻る
        </Link>
        <h2 className="mt-2 text-lg font-bold text-gray-900">{j.title}</h2>
        <p className="mt-1 text-xs text-gray-500">
          クライアント:{" "}
          {j.client?.company_name ?? j.client?.profiles?.display_name ?? "-"} /{" "}
          {formatDateJP(new Date(j.created_at))} 掲載
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左: 案件情報 + 既招待一覧 */}
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">案件概要</h3>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
              {j.description}
            </p>
            <dl className="mt-4 grid gap-x-4 gap-y-2 text-xs text-gray-700 sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">予算</dt>
                <dd className="font-mono">
                  ¥{(j.budget_min ?? 0).toLocaleString()}〜¥
                  {(j.budget_max ?? 0).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">応募締切</dt>
                <dd>{j.deadline ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">納品希望日</dt>
                <dd>{j.delivery_deadline ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">応募数</dt>
                <dd className="font-mono">{j.application_count ?? 0} 件</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">ジャンル (旧テキスト配列)</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {(j.genres ?? []).map((g) => (
                    <span
                      key={g}
                      className="rounded bg-gray-100 px-2 py-0.5 text-[10px]"
                    >
                      {g}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">
              招待済みクリエイター ({invitationRows.length} 名)
            </h3>
            {invitationRows.length === 0 ? (
              <p className="mt-2 text-xs text-gray-500">
                まだ誰にも招待していません。右のセクションから招待を送れます。
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {invitationRows.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 text-xs"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">
                        {inv.creator?.profiles?.display_name ?? "-"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        送信:{" "}
                        {new Date(inv.sent_at)
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")}
                        {inv.responded_at &&
                          ` / 応答: ${inv.responded_at.slice(0, 10)}`}
                      </p>
                      {inv.message && (
                        <p className="mt-1 text-[10px] italic text-gray-600">
                          「{inv.message.slice(0, 60)}
                          {inv.message.length > 60 ? "…" : ""}」
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[inv.status] ?? ""}`}
                    >
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* 右: 招待セクション */}
        <div>
          <InviteSection
            jobId={jobId}
            jobTitle={j.title}
            tags={(tags ?? []) as unknown as Array<{
              id: string;
              category: string;
              name: string;
              sort_order: number;
            }>}
            preselectedTagIds={Array.from(jobTagIds)}
          />
        </div>
      </div>
    </div>
  );
}
