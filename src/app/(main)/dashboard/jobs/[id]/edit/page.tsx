import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { JobEditForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function DashboardJobEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "creator") redirect(`/jobs/${id}`);

  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, title, description, genres, budget_min, budget_max, deadline, delivery_deadline, status, client_id"
    )
    .eq("id", id)
    .single();

  if (!job) notFound();

  // 認可: 自分の client_profile が掲載した案件のみ編集可
  if (!user.client_profile || job.client_id !== user.client_profile.id) {
    redirect(`/dashboard/jobs`);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#222]">案件を編集</h1>
          <p className="mt-2 text-sm text-[#828282]">
            タイトル・詳細・予算・締切・公開ステータスを変更できます
          </p>
        </div>
        <Link
          href={`/dashboard/jobs/${job.id}`}
          className="text-xs font-bold text-neon-purple-deep transition-colors hover:text-neon-pink"
        >
          ← 詳細に戻る
        </Link>
      </div>

      <div className="mt-6">
        <JobEditForm
          job={{
            id: job.id as string,
            title: job.title as string,
            description: (job.description as string) ?? "",
            genres: (job.genres as string[] | null) ?? [],
            budget_min: (job.budget_min as number | null) ?? null,
            budget_max: (job.budget_max as number | null) ?? null,
            deadline: (job.deadline as string | null) ?? null,
            delivery_deadline:
              (job.delivery_deadline as string | null) ?? null,
            status: job.status as string,
          }}
        />
      </div>
    </div>
  );
}
