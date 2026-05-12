import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ApplyButton } from "./apply-button";
import {
  EditingRequirements,
  type EditingRequirementsData,
} from "@/components/shared/editing-requirements";

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
  let hasApplied = false;
  if (isCreator && user?.creator_profile) {
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", id)
      .eq("creator_id", user.creator_profile.id)
      .single();
    hasApplied = !!existing;
  }

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-[#828282]">
        <Link href="/jobs" className="hover:text-primary-500">
          案件を探す
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#222]">{job.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Left: Job detail */}
        <div className="space-y-8 lg:col-span-2">
          {/* Title */}
          <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="truncate text-2xl font-bold text-[#222] sm:text-3xl" title={job.title}>
                  {job.title}
                </h1>
                <p className="mt-2 text-sm text-[#828282]">
                  {clientData.company_name ||
                    clientData.profiles.display_name}
                  {clientData.industry && (
                    <span className="ml-2 text-[#BDBDBD]">
                      ({clientData.industry})
                    </span>
                  )}
                </p>
              </div>
              {(job.budget_min || job.budget_max) && (
                <div className="shrink-0 text-right">
                  <p className="text-xs text-[#828282]">見積もり</p>
                  <p className="text-xl font-bold text-primary-500">
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
              {job.genres.map((genre: string) => (
                <span
                  key={genre}
                  className="rounded-pill bg-primary-50 px-3 py-1 text-xs font-bold text-primary-500"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Unit price */}
            {job.unit_price && (
              <div className="mt-4 rounded-lg bg-[#F8F8F8] px-4 py-3">
                <p className="text-xs text-[#828282]">動画1本あたりの単価（概算）</p>
                <p className="mt-1 text-lg font-bold text-[#222]">
                  {formatPrice(job.unit_price)}
                </p>
              </div>
            )}

            {/* Meta */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#828282]">
              {job.deadline && (
                <span>
                  応募締切:{" "}
                  {new Date(job.deadline).toLocaleDateString("ja-JP")}
                </span>
              )}
              {job.delivery_deadline && (
                <span>
                  納品希望:{" "}
                  {new Date(job.delivery_deadline).toLocaleDateString("ja-JP")}
                </span>
              )}
              <span>
                掲載日:{" "}
                {new Date(job.created_at).toLocaleDateString("ja-JP")}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
            <h2 className="mb-4 text-lg font-bold text-[#222]">案件詳細</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#4F4F4F]">
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
            <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
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
                    <p className="mt-3 text-sm font-bold text-[#222]">
                      応募済みです
                    </p>
                    <p className="mt-1 text-xs text-[#828282]">
                      企業からの返答をお待ちください
                    </p>
                  </div>
                  {/* 応募済み = メッセージ解放 (#6) */}
                  <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50 p-4">
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-primary-700">
                          メッセージ機能が解放されました
                        </p>
                        <p className="mt-0.5 text-xs text-primary-700/80">
                          {clientData.company_name ||
                            clientData.profiles.display_name}{" "}
                          にメッセージを送れます
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/messages/${clientData.user_id}`}
                      className="btn-primary mt-3 w-full text-sm"
                    >
                      この企業にメッセージを送る
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mb-4 text-lg font-bold text-[#222]">
                    この案件に応募する
                  </h2>
                  <p className="mb-4 text-xs text-[#828282]">
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
            <div className="rounded-2xl bg-white p-6 text-center shadow-card sm:p-8">
              <p className="text-sm text-[#828282]">
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

        {/* Right: Sidebar (Company + Stats) */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Company info */}
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <h3 className="text-sm font-bold text-[#828282]">掲載企業</h3>
              <p className="mt-2 text-lg font-bold text-[#222]">
                {clientData.company_name ||
                  clientData.profiles.display_name}
              </p>
              {clientData.industry && (
                <p className="mt-1 text-sm text-[#828282]">
                  {clientData.industry}
                </p>
              )}
              {clientData.company_url && (
                <a
                  href={clientData.company_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-sm text-primary-500 hover:underline"
                >
                  企業サイト
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="flex justify-between text-sm">
                <span className="text-[#828282]">応募数</span>
                <span className="font-bold text-[#222]">
                  {job.application_count}件
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
