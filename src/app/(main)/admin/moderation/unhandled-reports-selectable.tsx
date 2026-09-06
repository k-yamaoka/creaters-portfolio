"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModerationActionForm } from "./moderation-action-form";

/**
 * MOD-038 対応: 未対応通報 一覧に チェックボックス + 一括 unpublish/delete
 * バーを追加した Client Component。
 *
 * server ページから受け取った rows をローカル state で管理し、
 * 選択された portfolio_id 群に対して 既存 single-item API を N 回叩く。
 * 全ての emit 完了後に router.refresh() で再取得。
 */

const CATEGORY_LABEL: Record<string, string> = {
  copyright: "著作権",
  impersonation: "なりすまし",
  inappropriate: "公序良俗",
  unauthorized_person: "実在人物",
  spam: "スパム",
  other: "その他",
};

const STATUS_LABEL: Record<string, string> = {
  published: "公開",
  unpublished: "非公開",
  deleted: "削除",
};

const STATUS_BADGE: Record<string, string> = {
  published: "bg-green-50 text-green-700 border-green-200",
  unpublished: "bg-yellow-50 text-yellow-700 border-yellow-200",
  deleted: "bg-red-50 text-red-700 border-red-200",
};

const REASON_CATEGORIES: { value: string; label: string }[] = [
  { value: "copyright", label: "著作権侵害" },
  { value: "impersonation", label: "なりすまし / 他人作品" },
  { value: "inappropriate", label: "公序良俗違反" },
  { value: "unauthorized_person", label: "実在人物 無断生成" },
  { value: "spam", label: "スパム" },
  { value: "other", label: "その他" },
];

export type UnhandledRow = {
  targetId: string;
  title: string | null;
  thumbnailUrl: string | null;
  creatorId: string | null;
  creatorName: string | null;
  currentStatus: string;
  total: number;
  uniqueIpCount: number;
  topCategory: string;
  latestNote: string | null;
};

type BulkAction = "unpublish" | "delete";

export function UnhandledReportsSelectable({ rows }: { rows: UnhandledRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [reasonCategory, setReasonCategory] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
    errors: string[];
  } | null>(null);

  const allChecked =
    rows.length > 0 && rows.every((r) => selected.has(r.targetId));
  const someChecked = selected.size > 0 && !allChecked;

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.targetId)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const openBulk = (action: BulkAction) => {
    if (selected.size === 0) return;
    setBulkAction(action);
    setReasonCategory("");
    setReasonDetail("");
    setProgress(null);
  };

  const cancelBulk = () => {
    setBulkAction(null);
    setReasonCategory("");
    setReasonDetail("");
    setProgress(null);
  };

  const submitDisabled =
    submitting || reasonCategory === "" || selected.size === 0;

  const handleSubmit = async () => {
    if (!bulkAction || submitDisabled) return;
    const ids = Array.from(selected);
    setSubmitting(true);
    setProgress({ done: 0, total: ids.length, errors: [] });

    const errors: string[] = [];
    let done = 0;
    // 直列で叩く: レート/audit 順序を保守。並列にしても大差ないので簡潔優先。
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/portfolio/${id}/moderation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: bulkAction,
            reason_category: reasonCategory,
            reason_detail: reasonDetail.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          errors.push(`${id.slice(0, 8)}: ${data.error ?? res.status}`);
        }
      } catch (e) {
        errors.push(`${id.slice(0, 8)}: ${(e as Error).message}`);
      }
      done += 1;
      setProgress({ done, total: ids.length, errors: [...errors] });
    }

    setSubmitting(false);
    // 完了。エラーがあれば表示し続ける、なければ 1 秒後に閉じて refresh。
    if (errors.length === 0) {
      setTimeout(() => {
        setBulkAction(null);
        setSelected(new Set());
        router.refresh();
      }, 800);
    } else {
      // 部分成功でも sub-refresh (成功分は消える)
      router.refresh();
      // ダイアログはエラー確認のため開いたまま、成功分は選択から外す
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          const failedTail = errors.find((e) => e.startsWith(id.slice(0, 8)));
          if (!failedTail) next.delete(id);
        }
        return next;
      });
    }
  };

  return (
    <>
      {/* 選択されたら 上部に sticky bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-2.5 shadow-sm backdrop-blur">
          <span className="text-xs font-bold text-red-800">
            {selected.size} 件 選択中
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              選択解除
            </button>
            <button
              type="button"
              onClick={() => openBulk("unpublish")}
              className="rounded-md border border-yellow-300 bg-white px-3 py-1 text-[11px] font-bold text-yellow-800 hover:bg-yellow-50"
            >
              一括 一時非公開
            </button>
            <button
              type="button"
              onClick={() => openBulk("delete")}
              className="rounded-md border border-red-400 bg-white px-3 py-1 text-[11px] font-bold text-red-700 hover:bg-red-50"
            >
              一括 削除
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={toggleAll}
                  aria-label="全選択"
                />
              </th>
              <th className="px-3 py-3">作品</th>
              <th className="px-3 py-3">クリエイター</th>
              <th className="px-3 py-3">状態</th>
              <th className="px-3 py-3 text-right">通報数 (unique IP)</th>
              <th className="px-3 py-3">主要カテゴリ</th>
              <th className="px-3 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((g) => {
              const checked = selected.has(g.targetId);
              return (
                <tr
                  key={g.targetId}
                  className={checked ? "bg-red-50/40" : undefined}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(g.targetId)}
                      aria-label={`select ${g.title ?? ""}`}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    {g.creatorId ? (
                      <Link
                        href={`/creators/${g.creatorId}#portfolio`}
                        className="font-medium text-gray-900 hover:text-red-600"
                      >
                        {g.title ?? "(削除済み)"}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">
                        {g.title ?? "(削除済み)"}
                      </span>
                    )}
                    {g.latestNote && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">
                        {g.latestNote}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">
                    {g.creatorName ?? "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        STATUS_BADGE[g.currentStatus] ??
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {STATUS_LABEL[g.currentStatus] ?? "unknown"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs text-gray-700">
                    {g.total} <span className="text-gray-400">(</span>
                    <span
                      className={
                        g.uniqueIpCount >= 3
                          ? "text-red-600 font-bold"
                          : ""
                      }
                    >
                      {g.uniqueIpCount}
                    </span>
                    <span className="text-gray-400">)</span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-gray-700">
                    {CATEGORY_LABEL[g.topCategory] ?? g.topCategory}
                  </td>
                  <td className="px-3 py-2.5">
                    <ModerationActionForm
                      portfolioId={g.targetId}
                      currentStatus={g.currentStatus}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 一括操作モーダル */}
      {bulkAction && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={submitting ? undefined : cancelBulk}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">
              {bulkAction === "unpublish"
                ? "選択作品を一括 一時非公開"
                : "選択作品を一括 削除"}
              <span className="ml-2 text-xs font-medium text-gray-500">
                ({selected.size} 件)
              </span>
            </h3>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700">
                カテゴリ <b className="text-red-600">(必須)</b>
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                disabled={submitting}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-gray-100"
              >
                <option value="">-- 選択してください --</option>
                {REASON_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700">
                補足 (任意 2000 字)
              </label>
              <textarea
                rows={3}
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value.slice(0, 2000))}
                disabled={submitting}
                placeholder="全 選択作品に共通の 補足理由 (任意)"
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-gray-100"
              />
            </div>

            {progress && (
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11px]">
                <p className="font-mono text-gray-700">
                  進捗 {progress.done} / {progress.total}
                </p>
                {progress.errors.length > 0 && (
                  <ul className="mt-2 max-h-24 space-y-0.5 overflow-y-auto text-red-700">
                    {progress.errors.map((e, i) => (
                      <li key={i} className="truncate">
                        {e}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelBulk}
                disabled={submitting}
                className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {progress?.errors.length ? "閉じる" : "キャンセル"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitDisabled}
                className={`rounded-md px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40 ${
                  bulkAction === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {submitting
                  ? `処理中… ${progress?.done ?? 0}/${progress?.total ?? 0}`
                  : bulkAction === "delete"
                    ? `${selected.size} 件を削除`
                    : `${selected.size} 件を一時非公開`}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
