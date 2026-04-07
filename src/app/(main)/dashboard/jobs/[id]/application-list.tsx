"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

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

  const handleAction = async (applicationId: string, newStatus: string) => {
    setLoading(applicationId);
    await fetch("/api/jobs/applications/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status: newStatus, jobId }),
    });
    window.location.reload();
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
      {applications.map((app) => {
        const creator = app.creator;
        const profile = creator?.profiles;
        const displayName = profile?.display_name ?? "クリエイター";
        const initial = displayName[0];
        const statusInfo = STATUS_MAP[app.status] ?? {
          label: app.status,
          color: "bg-gray-100 text-gray-500",
        };

        return (
          <div
            key={app.id}
            className="rounded-2xl bg-white p-6 shadow-card"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/creators/${creator.id}`}
                      className="text-sm font-bold text-[#222] hover:text-primary-500"
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
                    {new Date(app.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>

                {/* Creator meta */}
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#828282]">
                  {creator.location && <span>{creator.location}</span>}
                  <span>経験{creator.years_of_experience}年</span>
                  <span>
                    評価 {creator.rating}（{creator.review_count}件）
                  </span>
                </div>

                {/* Proposed price */}
                {app.proposed_price && (
                  <p className="mt-2 text-sm">
                    <span className="text-[#828282]">提案金額: </span>
                    <span className="font-bold text-primary-500">
                      {formatPrice(app.proposed_price)}
                    </span>
                  </p>
                )}

                {/* Message */}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#4F4F4F]">
                  {app.message}
                </p>

                {/* Actions */}
                {app.status === "pending" && (
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleAction(app.id, "accepted")}
                      disabled={loading === app.id}
                      className="btn-primary text-xs disabled:opacity-50"
                    >
                      {loading === app.id ? "処理中..." : "採用する"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(app.id, "rejected")}
                      disabled={loading === app.id}
                      className="btn-white text-xs text-[#828282] disabled:opacity-50"
                    >
                      不採用
                    </button>
                    <Link
                      href={`/dashboard/messages/${creator.profiles ? (creator as unknown as { profiles: { display_name: string }; user_id?: string }).user_id ?? creator.id : creator.id}`}
                      className="btn-white text-xs"
                    >
                      メッセージ
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
