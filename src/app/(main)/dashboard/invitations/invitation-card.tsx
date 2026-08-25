"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ExternalLink, Sparkles, Clock } from "lucide-react";

type Props = {
  invitation: {
    id: string;
    status: string;
    sent_at: string;
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
  };
};

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function InvitationCard({ invitation }: Props) {
  const router = useRouter();
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inv = invitation;
  const job = inv.job;
  const remaining = daysUntil(inv.expires_at);
  const urgent = remaining <= 3;

  async function respond(action: "accept" | "decline") {
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(`/api/invitations/${inv.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "decline" ? declineReason.trim() || undefined : undefined,
        }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        error?: string;
        redirect_to?: string;
      };
      if (!r.ok || !j.ok) throw new Error(j.error ?? "処理に失敗しました");
      if (action === "accept" && j.redirect_to) {
        router.push(j.redirect_to);
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
      setSubmitting(false);
    }
  }

  const budgetLabel =
    job?.budget_min || job?.budget_max
      ? `¥${(job?.budget_min ?? 0).toLocaleString()}〜¥${(job?.budget_max ?? 0).toLocaleString()}`
      : "予算応相談";

  return (
    <li className="overflow-hidden rounded-2xl border-2 border-aimovie-ember-500/30 bg-gradient-to-br from-aimovie-ember-500/5 via-white to-aimovie-navy-700/5 shadow-md">
      <div className="border-b border-aimovie-ember-500/20 bg-aimovie-ember-500/10 px-4 py-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-aimovie-ember-500">
          <Sparkles size={12} strokeWidth={2} aria-hidden />
          運営からのおすすめ
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-aimovie-ember-500/80">
            <Clock size={10} strokeWidth={2} aria-hidden />
            {remaining > 0
              ? `残り ${remaining} 日で自動見送り`
              : "本日期限切れ"}
            {urgent && remaining > 0 && (
              <span className="ml-1 rounded bg-red-500 px-1 py-0 text-[9px] font-bold text-white">
                お早めに
              </span>
            )}
          </span>
        </p>
      </div>

      <div className="p-5">
        <h3 className="text-base font-bold text-gray-900">
          {job?.title ?? "-"}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          クライアント:{" "}
          {job?.client?.company_name ??
            job?.client?.profiles?.display_name ??
            "-"}
        </p>

        <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">予算</dt>
            <dd className="font-mono text-gray-900">{budgetLabel}</dd>
          </div>
          <div>
            <dt className="text-gray-500">応募締切</dt>
            <dd className="text-gray-900">{job?.deadline ?? "-"}</dd>
          </div>
        </dl>

        {job?.description && (
          <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
            {job.description}
          </p>
        )}

        {inv.message && (
          <div className="mt-3 rounded-lg border-l-4 border-aimovie-ember-500 bg-aimovie-ember-500/5 px-3 py-2 text-xs text-gray-800">
            <p className="text-[10px] font-bold text-aimovie-ember-500">
              運営から一言:
            </p>
            <p className="mt-1 whitespace-pre-wrap italic">{inv.message}</p>
          </div>
        )}

        {(job?.genres ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {(job?.genres ?? []).slice(0, 6).map((g) => (
              <span
                key={g}
                className="rounded-pill border border-aimovie-navy-700/40 bg-aimovie-navy-700/10 px-2 py-0.5 text-[10px] font-bold text-aimovie-navy-700"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* 見送り理由入力 (トグル) */}
        {showDeclineForm && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <label className="text-[11px] font-medium text-gray-700">
              見送り理由 (任意、運営の改善に活かします)
            </label>
            <textarea
              rows={2}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value.slice(0, 500))}
              disabled={submitting}
              placeholder="例) 現在他案件で稼働中のため、次回よろしくお願いします"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
            {error}
          </div>
        )}

        {/* アクション */}
        <div className="mt-4 flex flex-wrap gap-2">
          {!showDeclineForm ? (
            <>
              <button
                type="button"
                onClick={() => respond("accept")}
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-gradient-to-r from-aimovie-navy-900 to-aimovie-ember-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                <ExternalLink size={14} strokeWidth={2} aria-hidden />
                {submitting ? "処理中..." : "詳細を見て応募する"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeclineForm(true)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-pill border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <X size={14} strokeWidth={2} aria-hidden />
                今回は見送る
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => respond("decline")}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-pill bg-gray-800 px-4 py-2 text-sm font-bold text-white hover:bg-gray-900 disabled:opacity-50"
              >
                <Check size={14} strokeWidth={2} aria-hidden />
                {submitting ? "送信中..." : "見送りを確定"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeclineForm(false);
                  setDeclineReason("");
                }}
                disabled={submitting}
                className="rounded-pill border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
