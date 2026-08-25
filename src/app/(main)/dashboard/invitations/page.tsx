import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { formatDateJP } from "@/lib/utils";
import { InvitationCard } from "./invitation-card";

export const dynamic = "force-dynamic";

/**
 * C-3 クリエイター用 スカウト受信トレイ (2026-07-21)。
 *
 * 3 タブ:
 *   1. pending (未回答)
 *   2. accepted / responded (回答済み)
 *   3. expired (期限切れ)
 *
 * RLS で本人のみ SELECT / UPDATE 可能。
 */

export default async function InvitationsInboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "creator") redirect("/dashboard");
  if (!user.creator_profile) redirect("/dashboard/profile");

  const supabase = await createClient();

  const { data: invitations } = await supabase
    .from("job_invitations")
    .select(
      `id, status, sent_at, responded_at, expires_at, message,
       job:job_id (
         id, title, description, budget_min, budget_max, deadline,
         delivery_deadline, genres,
         client:client_profiles!jobs_client_id_fkey (
           company_name,
           profiles!client_profiles_user_id_fkey ( display_name )
         )
       )`
    )
    .eq("creator_id", user.creator_profile.id)
    .order("sent_at", { ascending: false });

  const rows = ((invitations ?? []) as unknown as Array<{
    id: string;
    status: string;
    sent_at: string;
    responded_at: string | null;
    expires_at: string;
    message: string | null;
    job?: {
      id: string;
      title?: string;
      description?: string;
      budget_min: number | null;
      budget_max: number | null;
      deadline: string | null;
      delivery_deadline: string | null;
      genres?: string[];
      client?: {
        company_name?: string | null;
        profiles?: { display_name?: string };
      };
    };
  }>);

  const pending = rows.filter((r) => r.status === "pending");
  const responded = rows.filter(
    (r) => r.status === "accepted" || r.status === "declined"
  );
  const expired = rows.filter((r) => r.status === "expired");

  return (
    <div className="text-gray-900">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-gray-900">💌 運営からのおすすめ案件</h1>
        {pending.length > 0 && (
          <span className="rounded-full bg-aimovie-ember-500 px-3 py-0.5 text-xs font-bold text-white">
            {pending.length} 件 未回答
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-500">
        運営があなたのスキル・実績を見て、マッチする案件を厳選してお届けしています。
        「詳細を見て応募」または「今回は見送る」をお選びください。
      </p>

      {/* 未回答 */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold text-gray-900">
          未回答 ({pending.length} 件)
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            新しい招待はありません
          </div>
        ) : (
          <ul className="space-y-3">
            {pending.map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} />
            ))}
          </ul>
        )}
      </section>

      {/* 回答済み */}
      {responded.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold text-gray-900">
            回答済み ({responded.length} 件)
          </h2>
          <ul className="space-y-2">
            {responded.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2.5 text-xs shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-gray-900">
                    {inv.job?.title ?? "-"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {inv.job?.client?.company_name ??
                      inv.job?.client?.profiles?.display_name ??
                      "-"}{" "}
                    /{" "}
                    {inv.responded_at
                      ? formatDateJP(new Date(inv.responded_at))
                      : "-"}
                    {inv.status === "accepted" ? " 応募" : " 見送り"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    inv.status === "accepted"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-gray-300 bg-gray-50 text-gray-600"
                  }`}
                >
                  {inv.status === "accepted" ? "応募済" : "見送り"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 期限切れ */}
      {expired.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold text-gray-500">
            期限切れ ({expired.length} 件)
          </h2>
          <ul className="space-y-2">
            {expired.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5 text-xs opacity-70"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-gray-700">{inv.job?.title ?? "-"}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    有効期限:{" "}
                    {formatDateJP(new Date(inv.expires_at))}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  期限切れ
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
