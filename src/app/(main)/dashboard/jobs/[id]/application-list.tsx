"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, formatDateJP } from "@/lib/utils";

type Application = {
  id: string;
  job_id: string;
  creator_id: string;
  message: string;
  proposed_price: number | null;
  status: string;
  created_at: string;
  creator: {
    id: string;
    user_id: string;
    bio: string;
    rating: number;
    review_count: number;
    location: string | null;
    years_of_experience: number;
    profiles: {
      display_name: string;
      avatar_url: string | null;
    };
  };
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "審査中", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "採用", color: "bg-green-100 text-green-700" },
  rejected: { label: "不採用", color: "bg-gray-100 text-gray-500" },
};

export function ApplicationList({
  applications,
  jobId,
}: {
  applications: Application[];
  jobId: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (applicationId: string, newStatus: string) => {
    if (newStatus === "accepted") {
      if (
        !confirm(
          "このクリエイターを採用しますか?\n他の応募者は自動的に「不採用」となり、案件は締切られて取引(相談中)が自動生成されます。"
        )
      )
        return;
    } else if (newStatus === "rejected") {
      if (!confirm("このクリエイターを不採用にしますか?")) return;
    }
    setLoading(applicationId);
    setError(null);
    const res = await fetch("/api/jobs/applications/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status: newStatus, jobId }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      setError(data.error ?? "更新に失敗しました");
      setLoading(null);
      return;
    }
    if (newStatus === "accepted" && data.orderId) {
      router.push(`/dashboard/orders/${data.orderId}`);
      return;
    }
    router.refresh();
    setLoading(null);
  };

  if (applications.length === 0) {
    return (
      <div className="rounded-2xl bg-white py-12 text-center shadow-card">
        <p className="text-sm text-[#828282]">まだ応募はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {applications.map((app) => {
        const creator = app.creator;
        const profile = creator?.profiles;
        const displayName = profile?.display_name ?? "クリエイター";
        const initial = displayName[0];
        const statusInfo = STATUS_MAP[app.status] ?? {
          label: app.status,
          color: "bg-gray-100 text-gray-500",
        };
        const isPending = app.status === "pending";
        const isLoading = loading === app.id;

        return (
          <div key={app.id} className="rounded-2xl bg-white p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neon-purple/15 text-sm font-bold text-neon-purple-deep">
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/creators/${creator.id}`}
                      className="text-sm font-bold text-[#222] hover:text-neon-pink"
                    >
                      {displayName}
                    </Link>
                    <span
                      className={`rounded-pill px-2.5 py-0.5 text-[11px] font-bold ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <span className="text-xs text-[#BDBDBD]">
                    {formatDateJP(app.created_at)}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#828282]">
                  <span>経験{creator.years_of_experience}年</span>
                  <span>
                    評価 {creator.rating}（{creator.review_count}件）
                  </span>
                </div>

                {app.proposed_price && (
                  <p className="mt-2 text-sm">
                    <span className="text-[#828282]">提案金額: </span>
                    <span className="font-bold text-neon-purple-deep">
                      {formatPrice(app.proposed_price)}
                    </span>
                  </p>
                )}

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#4F4F4F]">
                  {app.message}
                </p>

                {/* 4ボタン: 採用 / 不採用 / メッセージ / プロフィール */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleAction(app.id, "accepted")}
                      disabled={isLoading}
                      className="btn-primary text-xs disabled:opacity-50"
                    >
                      {isLoading ? "処理中..." : "採用する"}
                    </button>
                  )}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleAction(app.id, "rejected")}
                      disabled={isLoading}
                      className="btn-white text-xs text-red-500 disabled:opacity-50"
                    >
                      不採用
                    </button>
                  )}
                  <Link
                    href={`/dashboard/messages/${creator.user_id}`}
                    className="btn-white text-xs"
                  >
                    メッセージ
                  </Link>
                  <Link
                    href={`/creators/${creator.id}`}
                    className="btn-white text-xs"
                  >
                    プロフィール
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
