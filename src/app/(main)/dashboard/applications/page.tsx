import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

const APP_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "審査中", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "採用", color: "bg-green-100 text-green-700" },
  rejected: { label: "不採用", color: "bg-gray-100 text-gray-500" },
};

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.creator_profile) redirect("/dashboard");

  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      `
      *,
      job:jobs!job_applications_job_id_fkey (
        id, title, genres, budget_min, budget_max, status,
        client:client_profiles!jobs_client_id_fkey (
          company_name,
          profiles!client_profiles_user_id_fkey ( display_name )
        )
      )
    `
    )
    .eq("creator_id", user.creator_profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">応募済み案件</h1>
      <p className="mt-2 text-sm text-[#828282]">
        応募した案件のステータスを確認できます
      </p>

      <div className="mt-6">
        {!applications || applications.length === 0 ? (
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
              まだ応募した案件はありません
            </h3>
            <p className="mt-2 text-sm text-[#828282]">
              「案件を探す」から気になる案件に応募しましょう
            </p>
            <Link href="/jobs" className="btn-primary mt-6 inline-block text-sm">
              案件を探す
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const job = app.job as unknown as {
                id: string;
                title: string;
                genres: string[];
                budget_min: number | null;
                budget_max: number | null;
                status: string;
                client: {
                  company_name: string | null;
                  profiles: { display_name: string };
                };
              };
              const appStatus = APP_STATUS[app.status] ?? {
                label: app.status,
                color: "bg-gray-100 text-gray-500",
              };
              const clientName =
                job?.client?.company_name ??
                job?.client?.profiles?.display_name ??
                "企業";

              return (
                <Link
                  key={app.id}
                  href={`/jobs/${job?.id}`}
                  className="block rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-sm font-bold text-[#222]">
                          {job?.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-pill px-2.5 py-0.5 text-[11px] font-bold ${appStatus.color}`}
                        >
                          {appStatus.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#828282]">
                        {clientName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {job?.genres?.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#828282]"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {app.proposed_price && (
                        <p className="text-sm font-bold text-primary-500">
                          {formatPrice(app.proposed_price)}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[#BDBDBD]">
                        {new Date(app.created_at).toLocaleDateString("ja-JP")}
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
