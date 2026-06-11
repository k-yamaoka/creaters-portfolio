"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDateJP } from "@/lib/utils";
import { ListHideButton } from "@/components/dashboard/list-hide-button";

const APP_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "審査中", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "採用", color: "bg-green-100 text-green-700" },
  rejected: { label: "不採用", color: "bg-gray-100 text-gray-500" },
};

type Row = {
  id: string;
  status: string;
  proposed_price: number | null;
  created_at: string;
  job: {
    id: string;
    title: string;
    genres: string[];
    clientName: string;
    clientUserId: string | null;
  };
  hasUnread: boolean;
  orderId: string | null;
};

type Tab = "all" | "pending" | "accepted" | "rejected";

export function ApplicationsList({ rows }: { rows: Row[] }) {
  const [tab, setTab] = useState<Tab>("all");

  // タブごとの件数
  const counts = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let rejected = 0;
    for (const r of rows) {
      if (r.status === "pending") pending += 1;
      else if (r.status === "accepted") accepted += 1;
      else if (r.status === "rejected") rejected += 1;
    }
    return { all: rows.length, pending, accepted, rejected };
  }, [rows]);

  const filtered = useMemo(
    () => (tab === "all" ? rows : rows.filter((r) => r.status === tab)),
    [rows, tab]
  );

  const TABS: { key: Tab; label: string; n: number }[] = [
    { key: "all", label: "すべて", n: counts.all },
    { key: "pending", label: "審査中", n: counts.pending },
    { key: "accepted", label: "採用", n: counts.accepted },
    { key: "rejected", label: "不採用", n: counts.rejected },
  ];

  return (
    <div>
      {/* タブ */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-gray-200">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 pb-2 pt-1 text-sm font-bold transition-colors ${
                active
                  ? "border-neon-pink text-neon-pink"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
              <span
                className={`rounded-pill px-1.5 py-0 text-[10px] font-bold ${
                  active ? "bg-neon-pink/15 text-neon-pink" : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.n}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
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
            該当する応募がありません
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
          {filtered.map((row) => {
            const appStatus = APP_STATUS[row.status] ?? {
              label: row.status,
              color: "bg-gray-100 text-gray-500",
            };
            const isAccepted = row.status === "accepted";
            return (
              <div
                key={row.id}
                className="relative rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                {/* 一覧から非表示 */}
                <div className="absolute right-3 top-3 z-10">
                  <ListHideButton
                    kind="application"
                    id={row.id}
                    itemTitle={row.job.title || "応募"}
                  />
                </div>

                <Link href={`/jobs/${row.job.id}`} className="block pr-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="truncate text-lg font-bold text-[#222] sm:text-xl">
                          {row.job.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-bold ${appStatus.color}`}
                        >
                          {appStatus.label}
                        </span>
                        {row.hasUnread && (
                          <span
                            className="inline-flex items-center gap-1 rounded-pill bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600"
                            title="この企業から未読メッセージがあります"
                          >
                            <span
                              aria-hidden
                              className="inline-block h-1.5 w-1.5 rounded-full bg-red-500"
                            />
                            未読
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#828282]">
                        {row.job.clientName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {row.job.genres.slice(0, 3).map((g) => (
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
                      {row.proposed_price && (
                        <p className="text-lg font-bold text-neon-purple-deep">
                          {formatPrice(row.proposed_price)}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-[#828282]">
                        応募日 {formatDateJP(row.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* 採用カードのみクイックアクション */}
                {isAccepted && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                    {row.orderId ? (
                      <Link
                        href={`/dashboard/orders/${row.orderId}`}
                        className="inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-1.5 text-xs font-bold text-white shadow-card transition-shadow hover:shadow-card-hover"
                      >
                        取引管理へ
                        <span aria-hidden>→</span>
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard/orders"
                        className="inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-1.5 text-xs font-bold text-white shadow-card transition-shadow hover:shadow-card-hover"
                      >
                        取引一覧へ
                        <span aria-hidden>→</span>
                      </Link>
                    )}
                    {row.job.clientUserId && (
                      <Link
                        href={`/dashboard/messages/${row.job.clientUserId}`}
                        className="inline-flex items-center gap-1 rounded-pill border border-gray-300 bg-white px-4 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:border-neon-pink hover:text-neon-pink"
                      >
                        メッセージを送る
                      </Link>
                    )}
                    <span className="text-[11px] text-gray-400">
                      ※ 採用後の進捗はこちらから
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
