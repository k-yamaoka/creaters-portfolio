import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";

// 案件詳細は応募ステータス・閲覧者依存で表示が変わるため動的レンダリング
export const dynamic = "force-dynamic";
import { formatPrice, formatDateJP } from "@/lib/utils";
import Link from "next/link";
import { ApplyButton } from "./apply-button";
import {
  EditingRequirements,
  type EditingRequirementsData,
} from "@/components/shared/editing-requirements";
import { MessageDialog } from "@/components/messages/message-dialog";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      `
      *,
      client:client_profiles!jobs_client_id_fkey (
        id, user_id, company_name, company_url, industry,
        profiles!client_profiles_user_id_fkey ( display_name )
      )
    `
    )
    .eq("id", id)
    .single();

  if (!job) notFound();

  const user = await getCurrentUser();
  const isCreator = user?.role === "creator";
  const clientData = job.client as unknown as {
    id: string;
    user_id: string;
    company_name: string | null;
    company_url: string | null;
    industry: string | null;
    profiles: { display_name: string };
  };

  // Check if already applied
  // この応募の created_at は「過去取引のメッセージを引き継がない」境界として使う。
  let hasApplied = false;
  let applicationCreatedAt: string | null = null;
  if (isCreator && user?.creator_profile) {
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id, created_at")
      .eq("job_id", id)
      .eq("creator_id", user.creator_profile.id)
      .single();
    hasApplied = !!existing;
    applicationCreatedAt = existing?.created_at ?? null;
  }

  // 応募済みの場合のみ、初期メッセージ履歴を取得 (ダイアログに渡す)。
  // この応募の created_at 以降に限定し、同じクライアントとの過去取引メッセージが
  // 混ざらないようにする。
  let initialMessages: Array<{
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachment_url?: string | null;
    created_at: string;
    is_read?: boolean;
  }> = [];
  if (hasApplied && user) {
    let q = supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${clientData.user_id}),and(sender_id.eq.${clientData.user_id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    if (applicationCreatedAt) {
      q = q.gte("created_at", applicationCreatedAt);
    }
    const { data: msgs } = await q;
    initialMessages = msgs ?? [];
  }

  return (
    // 案件詳細はライトテーマ (bg-gray-50 + text-gray-900) で全幅を覆い、
    // 内側の card 群とコントラストを揃える。body の dark midnight bg を上書きする。
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-500">
        <Link href="/jobs" className="hover:text-neon-purple-deep">
          AI動画案件を探す
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{job.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Left: Job detail */}
        <div className="space-y-8 lg:col-span-2">
          {/* Title */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold text-gray-900 sm:text-3xl" title={job.title}>
                  {job.title}
                </h1>
                {/* 2026-06-16: 企業名は伏せ、業種カテゴリのみ公開。
                    企業名は応募済み案件/取引管理画面でのみ開示する。 */}
                <p className="mt-2 text-sm text-gray-500">
                  {clientData.industry || "業種非公開"}<span className="ml-2 text-gray-400">の企業</span>
                </p>
              </div>
              {(job.budget_min || job.budget_max) && (
                <div className="shrink-0 whitespace-nowrap text-right">
                  <p className="text-xs text-gray-500">見積もり</p>
                  <p className="text-xl font-bold text-neon-purple-deep">
                    {job.budget_min &&
                    job.budget_max &&
                    job.budget_min === job.budget_max
                      ? formatPrice(job.budget_min)
                      : job.budget_min && job.budget_max
                        ? `${formatPrice(job.budget_min)}〜${formatPrice(job.budget_max)}`
                        : job.budget_max
                          ? `〜${formatPrice(job.budget_max)}`
                          : `${formatPrice(job.budget_min!)}〜`}
                  </p>
                </div>
              )}
            </div>

            {/* Genre tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(job.genres ?? []).map((genre: string) => (
                <span
                  key={genre}
                  className="rounded-pill bg-neon-purple/10 px-3 py-1 text-xs font-bold text-neon-purple-deep"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Unit price */}
            {job.unit_price && (
              <div className="mt-4 rounded-lg bg-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500">動画1本あたりの単価（概算）</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {formatPrice(job.unit_price)}
                </p>
              </div>
            )}

            {/* Meta */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              {job.deadline && (
                <span>応募締切: {formatDateJP(job.deadline)}</span>
              )}
              {job.delivery_deadline && (
                <span>納品希望: {formatDateJP(job.delivery_deadline)}</span>
              )}
              <span>掲載日: {formatDateJP(job.created_at)}</span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card sm:p-8">
            <h2 className="mb-4 text-lg font-bold text-gray-900">案件詳細</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {job.description.replace(/\\n/g, "\n")}
            </div>
          </div>

          {/* 編集要件 */}
          <EditingRequirements
            data={{
              footage_minutes: job.footage_minutes ?? null,
              finish_duration_unit: (job.finish_duration_unit as
                | "sec"
                | "min"
                | null) ?? null,
              finish_duration_min: job.finish_duration_min ?? null,
              finish_duration_max: job.finish_duration_max ?? null,
              count_min: job.count_min ?? null,
              count_max: job.count_max ?? null,
              work_types: job.work_types ?? [],
              revision_count: job.revision_count ?? null,
              software_options: job.software_options ?? [],
              delivery_formats: job.delivery_formats ?? [],
              delivery_days: job.delivery_days ?? null,
              reference_url: job.reference_url ?? null,
              is_recurring: !!job.is_recurring,
              monthly_count: job.monthly_count ?? null,
              client_type: job.client_type ?? null,
            } satisfies EditingRequirementsData}
          />

          {/* Apply form (案件詳細と同じコンテンツ幅) */}
          {isCreator && user?.creator_profile && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card sm:p-8">
              {hasApplied ? (
                <div>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">
                      応募済みです
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      企業からの返答をお待ちください
                    </p>
                  </div>
                  {/* 応募済み = メッセージ解放 (#6) */}
                  <div className="mt-6 rounded-xl border border-neon-purple/20 bg-neon-purple/10 p-4">
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-neon-purple-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-neon-purple-deep">
                          メッセージ機能が解放されました
                        </p>
                        <p className="mt-0.5 text-xs text-neon-purple-deep/80">
                          この企業にメッセージを送れます (企業名は
                          「応募済み案件」画面で確認できます)
                        </p>
                      </div>
                    </div>
                    {user && (
                      <MessageDialog
                        partnerUserId={clientData.user_id}
                        // 公開ページでは企業名を伏せる仕様 (2026-06-16)。
                        // ダイアログ内の partner 表記は「依頼企業」で代替し、
                        // 実名は応募済み案件画面でのみ開示する。
                        partnerName="依頼企業"
                        currentUserId={user.id}
                        senderRole={
                          user.role === "creator" ||
                          user.role === "client" ||
                          user.role === "admin"
                            ? user.role
                            : undefined
                        }
                        initialMessages={initialMessages}
                        triggerLabel="この企業にメッセージを送る"
                        triggerClassName="btn-primary mt-3 w-full text-sm"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mb-4 text-lg font-bold text-gray-900">
                    この案件に応募する
                  </h2>
                  <p className="mb-4 text-xs text-gray-500">
                    応募ボタンを押すと、この企業へのメッセージ機能が解放されます。
                  </p>
                  <ApplyButton
                    jobId={job.id}
                    creatorId={user.creator_profile.id}
                  />
                </>
              )}
            </div>
          )}

          {!user && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-card sm:p-8">
              <p className="text-sm text-gray-500">
                応募するにはログインが必要です
              </p>
              <Link
                href="/login"
                className="btn-primary mt-4 inline-block text-sm"
              >
                ログイン
              </Link>
            </div>
          )}
        </div>

        {/* Right: Sidebar — 掲載企業 + 応募数 を 1 つの divide-x で統合 */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <div className="grid grid-cols-[1fr,auto] divide-x divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-card">
              {/* 掲載企業 — 公開ページでは業種カテゴリのみ表示 (2026-06-16) */}
              <div className="min-w-0 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  掲載企業
                </h3>
                <p className="mt-2 truncate text-lg font-bold text-gray-900">
                  {clientData.industry || "業種非公開"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  ※ 企業名は応募後、応募済み案件画面で確認できます
                </p>
                {/* 2026-06-16: 企業サイトリンクは公開ページから削除
                    (企業名特定につながるため) */}
              </div>

              {/* 応募数 — 縦区切り線で隣接 */}
              <div className="flex w-32 flex-col items-center justify-center p-5 text-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  応募数
                </h3>
                <p className="mt-2 text-3xl font-black text-neon-purple-deep">
                  {job.application_count}
                </p>
                <p className="text-xs text-gray-500">件</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
