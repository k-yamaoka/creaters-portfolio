import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-100 text-gray-500" },
  open: { label: "募集中", color: "bg-green-100 text-green-700" },
  closed: { label: "締切", color: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "キャンセル", color: "bg-red-100 text-red-500" },
};

export default async function DashboardJobsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "creator") redirect("/dashboard");

  const supabase = await createClient();

  // Get or create client profile
  let clientId = user.client_profile?.id;
  if (!clientId) {
    const { data } = await supabase
      .from("client_profiles")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    clientId = data?.id;
  }

  const { data: jobs } = clientId
    ? await supabase
        .from("jobs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222]">案件管理</h1>
          <p className="mt-2 text-sm text-[#828282]">
            掲載中の案件と応募状況を管理
          </p>
        </div>
        <Link href="/dashboard/jobs/new" className="btn-primary text-sm">
          + 新規案件を作成
        </Link>
      </div>

      <div className="mt-6">
        {!jobs || jobs.length === 0 ? (
          <div className="rounded-2xl bg-white py-16 text-center shadow-card">
            <svg
              className="mx-auto h-12 w-12 text-[#E0E0E0]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            <h3 className="mt-4 text-lg font-bold text-[#222]">
              まだ案件がありません
            </h3>
            <p className="mt-2 text-sm text-[#828282]">
              「新規案件を作成」から募集を開始しましょう
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const status = STATUS_LABELS[job.status] ?? {
                label: job.status,
                color: "bg-gray-100 text-gray-500",
              };
              return (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="block rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-[#222]">
                          {job.title}
                        </h3>
                        <span
                          className={`rounded-pill px-2.5 py-0.5 text-[11px] font-bold ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {job.genres?.slice(0, 3).map((g: string) => (
                          <span
                            key={g}
                            className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#828282]"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      {(job.budget_min || job.budget_max) && (
                        <p className="text-sm font-bold text-[#222]">
                          {job.budget_min
                            ? formatPrice(job.budget_min)
                            : ""}
                          {job.budget_min && job.budget_max ? "〜" : ""}
                          {job.budget_max
                            ? formatPrice(job.budget_max)
                            : "〜"}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[#828282]">
                        応募 {job.application_count}件
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
