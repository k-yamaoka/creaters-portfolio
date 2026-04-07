import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ApplicationList } from "./application-list";
import { JobStatusActions } from "./job-status-actions";

export default async function DashboardJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) notFound();

  // Get applications with creator info
  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      `
      *,
      creator:creator_profiles!job_applications_creator_id_fkey (
        id, bio, rating, review_count, location, years_of_experience,
        profiles!creator_profiles_user_id_fkey ( display_name, avatar_url )
      )
    `
    )
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: "下書き", color: "bg-gray-100 text-gray-500" },
    open: { label: "募集中", color: "bg-green-100 text-green-700" },
    closed: { label: "締切", color: "bg-yellow-100 text-yellow-700" },
    cancelled: { label: "キャンセル", color: "bg-red-100 text-red-500" },
  };

  const status = STATUS_LABELS[job.status] ?? {
    label: job.status,
    color: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      {/* Header */}
      <Link
        href="/dashboard/jobs"
        className="text-sm text-[#828282] hover:text-primary-500"
      >
        &larr; 案件一覧に戻る
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#222]">{job.title}</h1>
            <span
              className={`rounded-pill px-3 py-1 text-xs font-bold ${status.color}`}
            >
              {status.label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#828282]">
            {(job.budget_min || job.budget_max) && (
              <span>
                予算:{" "}
                {job.budget_min && job.budget_max
                  ? `${formatPrice(job.budget_min)}〜${formatPrice(job.budget_max)}`
                  : job.budget_max
                    ? `〜${formatPrice(job.budget_max)}`
                    : `${formatPrice(job.budget_min)}〜`}
              </span>
            )}
            {job.deadline && (
              <span>
                締切: {new Date(job.deadline).toLocaleDateString("ja-JP")}
              </span>
            )}
            <span>応募 {job.application_count}件</span>
          </div>
        </div>
      </div>

      {/* Status actions */}
      <div className="mt-6">
        <JobStatusActions jobId={job.id} currentStatus={job.status} />
      </div>

      {/* Applications */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#222]">
          応募一覧（{applications?.length ?? 0}件）
        </h2>
        <div className="mt-4">
          <ApplicationList applications={applications ?? []} jobId={job.id} />
        </div>
      </div>
    </div>
  );
}
