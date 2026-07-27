import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatDateJP } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * C-3 管理者用 案件・スカウト 一覧 (2026-07-21)。
 *
 * オープン案件を一覧化し、各行から /admin/jobs/[id] に遷移して
 * クリエイターに手動スカウトを送れる導線。
 */

const STATUS_LABEL: Record<string, string> = {
  open: "募集中",
  closed: "終了",
  draft: "下書き",
  cancelled: "キャンセル",
};

const STATUS_CLASS: Record<string, string> = {
  open: "border-emerald-300 bg-emerald-50 text-emerald-800",
  closed: "border-gray-300 bg-gray-50 text-gray-700",
  draft: "border-amber-300 bg-amber-50 text-amber-800",
  cancelled: "border-red-300 bg-red-50 text-red-700",
};

export default async function AdminJobsPage() {
  const admin = getSupabaseAdmin();

  const { data: jobs } = await admin
    .from("jobs")
    .select(
      `id, title, status, budget_min, budget_max, deadline, application_count,
       created_at,
       client:client_profiles!jobs_client_id_fkey (
         id, company_name,
         profiles!client_profiles_user_id_fkey ( display_name )
       )`
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // 各 job の招待数を集計
  const jobIds = (jobs ?? []).map((j) => (j as { id: string }).id);
  const inviteCounts = new Map<string, number>();
  if (jobIds.length > 0) {
    const { data: invites } = await admin
      .from("job_invitations")
      .select("job_id")
      .in("job_id", jobIds);
    for (const row of invites ?? []) {
      const jid = (row as { job_id: string }).job_id;
      inviteCounts.set(jid, (inviteCounts.get(jid) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">案件・スカウト</h2>
        <p className="mt-1 text-sm text-gray-500">
          オープン案件を確認し、タグでクリエイターを検索して手動スカウトが送れます。
        </p>
      </div>

      {(jobs ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          案件はまだ登録されていません
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-3 py-3">案件</th>
                <th className="px-3 py-3">クライアント</th>
                <th className="px-3 py-3">予算</th>
                <th className="px-3 py-3">締切</th>
                <th className="px-3 py-3">応募</th>
                <th className="px-3 py-3">招待済</th>
                <th className="px-3 py-3">状態</th>
                <th className="px-3 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(jobs ?? []).map((j) => {
                const row = j as unknown as {
                  id: string;
                  title: string;
                  status: string;
                  budget_min: number | null;
                  budget_max: number | null;
                  deadline: string | null;
                  application_count: number;
                  created_at: string;
                  client?: {
                    company_name?: string | null;
                    profiles?: { display_name?: string };
                  };
                };
                const invCount = inviteCounts.get(row.id) ?? 0;
                return (
                  <tr key={row.id}>
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-bold text-gray-900">
                        {row.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {formatDateJP(new Date(row.created_at))} 掲載
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">
                      {row.client?.company_name ??
                        row.client?.profiles?.display_name ??
                        "-"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">
                      {row.budget_min || row.budget_max
                        ? `¥${(row.budget_min ?? 0).toLocaleString()}〜`
                        : "応相談"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-gray-500">
                      {row.deadline ?? "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs">
                      {row.application_count ?? 0}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs">
                      {invCount > 0 ? (
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-800">
                          {invCount}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          STATUS_CLASS[row.status] ?? ""
                        }`}
                      >
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/admin/jobs/${row.id}`}
                        className="inline-flex rounded-md bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-indigo-700"
                      >
                        スカウト
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
