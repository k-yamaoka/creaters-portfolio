"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDateJP, formatDateTimeJP } from "@/lib/utils";
import { getStatusMeta } from "@/lib/order-status";
import { ListHideButton } from "@/components/dashboard/list-hide-button";

export type OrderRow = {
  id: string;
  title: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_deadline: string | null;
  partnerUserId: string | null;
  partnerName: string;
  unread: number;
  lastAt: string;
};

type Tab = "all" | "active" | "done";

function isActive(status: string): boolean {
  return status !== "delivered" && status !== "cancelled";
}
function isDone(status: string): boolean {
  return status === "delivered" || status === "cancelled";
}

/** 納期と今日の差分 (日)。null は期限なし */
function daysUntilDeadline(date: string | null): number | null {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
}

export function OrdersList({
  rows,
  isCreator,
}: {
  rows: OrderRow[];
  isCreator: boolean;
}) {
  const [tab, setTab] = useState<Tab>("all");

  const counts = useMemo(() => {
    let active = 0;
    let done = 0;
    for (const r of rows) {
      if (isActive(r.status)) active += 1;
      else if (isDone(r.status)) done += 1;
    }
    return { all: rows.length, active, done };
  }, [rows]);

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    if (tab === "active") return rows.filter((r) => isActive(r.status));
    return rows.filter((r) => isDone(r.status));
  }, [rows, tab]);

  const TABS: { key: Tab; label: string; n: number }[] = [
    { key: "all", label: "すべて", n: counts.all },
    { key: "active", label: "進行中", n: counts.active },
    { key: "done", label: "完了", n: counts.done },
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
                  active
                    ? "bg-neon-pink/15 text-neon-pink"
                    : "bg-gray-100 text-gray-500"
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
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664"
            />
          </svg>
          <h3 className="mt-4 text-lg font-bold text-[#222]">
            該当する取引はありません
          </h3>
          {!isCreator && (
            <Link
              href="/creators"
              className="btn-primary mt-6 inline-block text-sm"
            >
              クリエイターを探す
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const status = getStatusMeta(row.status);
            const remain = daysUntilDeadline(row.delivery_deadline);
            const urgent = remain != null && remain >= 0 && remain <= 3;
            const overdue = remain != null && remain < 0 && row.status !== "delivered";
            const dlText = row.delivery_deadline
              ? formatDateJP(row.delivery_deadline)
              : "未設定";

            // ステータスに応じてクイックアクションを出し分け
            const showCreatorDeliver =
              isCreator && (row.status === "production" || row.status === "revision");
            const showClientApprove = !isCreator && row.status === "delivered";

            return (
              <div
                key={row.id}
                className={`relative rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover ${
                  row.unread > 0 ? "ring-2 ring-red-300" : ""
                }`}
              >
                {/* アーカイブ ボタン (右上、箱アイコン) */}
                <div className="absolute right-3 top-3 z-10">
                  <ListHideButton
                    kind="order"
                    id={row.id}
                    itemTitle={row.title}
                  />
                </div>

                <Link
                  href={`/dashboard/orders/${row.id}`}
                  className="block pr-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3
                          className="truncate text-lg font-bold text-[#222] sm:text-xl"
                          title={`${status.label}: ${status.description}`}
                        >
                          {row.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-bold ${status.color}`}
                        >
                          {status.shortLabel}
                        </span>
                        {row.unread > 0 && (
                          <span
                            title="この取引相手から未読メッセージがあります"
                            className="inline-flex items-center gap-1 rounded-pill bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600"
                          >
                            <span
                              aria-hidden
                              className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500"
                            />
                            未読 {row.unread}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#828282]">
                        {row.partnerName}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#828282]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${
                            overdue
                              ? "bg-red-50 text-red-600"
                              : urgent
                                ? "bg-amber-50 text-amber-700"
                                : "bg-gray-50 text-gray-600"
                          }`}
                          title={overdue ? "納期を過ぎています" : ""}
                        >
                          <svg
                            aria-hidden
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                            />
                          </svg>
                          納期 {dlText}
                          {remain != null && remain >= 0 && (
                            <span className="font-normal text-gray-500">
                              (あと {remain} 日)
                            </span>
                          )}
                          {overdue && (
                            <span className="ml-1">超過</span>
                          )}
                        </span>
                        <span>最終更新 {formatDateTimeJP(row.lastAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-neon-purple-deep">
                        {formatPrice(row.total_amount)}
                      </p>
                      <p className="mt-1 text-sm text-[#828282]">
                        取引日 {formatDateJP(row.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* クイックアクション */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  {row.partnerUserId && (
                    <Link
                      href={`/dashboard/messages/${row.partnerUserId}`}
                      className="inline-flex items-center gap-1 rounded-pill border border-gray-300 bg-white px-4 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:border-neon-pink hover:text-neon-pink"
                    >
                      <svg
                        aria-hidden
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                        />
                      </svg>
                      メッセージ画面へ
                    </Link>
                  )}
                  {showCreatorDeliver && (
                    <Link
                      href={`/dashboard/orders/${row.id}#deliver`}
                      className="inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-1.5 text-xs font-bold text-white shadow-card transition-shadow hover:shadow-card-hover"
                    >
                      納品する
                      <span aria-hidden>→</span>
                    </Link>
                  )}
                  {showClientApprove && (
                    <Link
                      href={`/dashboard/orders/${row.id}#approve`}
                      className="inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-green-500 to-green-600 px-4 py-1.5 text-xs font-bold text-white shadow-card transition-shadow hover:shadow-card-hover"
                    >
                      検収を確定
                      <span aria-hidden>→</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
