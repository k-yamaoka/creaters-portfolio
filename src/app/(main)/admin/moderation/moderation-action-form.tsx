"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Trash2, RotateCcw } from "lucide-react";

/**
 * モデレーション アクション フォーム (00072)。
 *
 * 選択できる action:
 *   - unpublish (一時非公開)
 *   - delete (論理削除)
 *   - restore (公開状態に戻す) — 現在 unpublished / deleted のときのみ
 *
 * 理由入力を必須にしてから /api/admin/portfolio/:id/moderation を叩く。
 */

type Props = {
  portfolioId: string;
  currentStatus: string;
};

type Action = "unpublish" | "delete" | "restore";

// §B-2 理由プルダウン (2026-07-21):
//   unpublish / delete では必ずカテゴリを 1 つ選択する。
//   自由入力 (reason_detail) は補足として任意。
const REASON_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "copyright_suspected", label: "著作権侵害の疑い" },
  { value: "quality_below", label: "品質基準" },
  { value: "prohibited_content", label: "禁止コンテンツ" },
  { value: "many_reports", label: "通報多数" },
  { value: "other", label: "その他" },
];

export function ModerationActionForm({ portfolioId, currentStatus }: Props) {
  const router = useRouter();
  const [openAction, setOpenAction] = useState<Action | null>(null);
  const [reasonCategory, setReasonCategory] = useState<string>("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRestore =
    currentStatus === "unpublished" || currentStatus === "deleted";
  const canUnpublish = currentStatus === "published";
  const canDelete = currentStatus !== "deleted";

  // restore はカテゴリ任意 / それ以外は必須
  const categoryRequired = openAction !== "restore";
  const submitDisabled =
    submitting ||
    (categoryRequired && reasonCategory === "") ||
    (!categoryRequired && reasonDetail.trim().length === 0);

  async function handleSubmit() {
    if (!openAction) return;
    if (categoryRequired && reasonCategory === "") {
      setError("理由カテゴリの選択は必須です");
      return;
    }
    if (!categoryRequired && reasonDetail.trim().length === 0) {
      setError("理由の記入は必須です");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(
        `/api/admin/portfolio/${portfolioId}/moderation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: openAction,
            reason_category: reasonCategory || undefined,
            reason_detail: reasonDetail.trim() || undefined,
          }),
        }
      );
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) throw new Error(j.error ?? "更新に失敗しました");
      setOpenAction(null);
      setReasonCategory("");
      setReasonDetail("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setSubmitting(false);
    }
  }

  if (openAction) {
    const label =
      openAction === "unpublish"
        ? "一時非公開"
        : openAction === "delete"
          ? "削除"
          : "復元";
    return (
      <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <div className="text-[11px] font-bold text-gray-700">
          {label} の理由
        </div>
        {/* カテゴリ プルダウン (restore は任意) */}
        <label className="block">
          <span className="text-[10px] text-gray-600">
            カテゴリ {categoryRequired && <b className="text-red-600">(必須)</b>}
          </span>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            disabled={submitting}
            className="mt-0.5 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">
              {categoryRequired ? "-- 選択してください --" : "(任意)"}
            </option>
            {REASON_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] text-gray-600">
            補足{" "}
            <span className="text-gray-400">
              {categoryRequired ? "(任意 2000 字)" : "(必須)"}
            </span>
          </span>
          <textarea
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value.slice(0, 2000))}
            rows={2}
            disabled={submitting}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-[11px] outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-gray-100"
            placeholder="例) 明らかに他社サイトの画像を無断転載 (URL: ...)"
            autoFocus
          />
        </label>
        {error && (
          <p className="text-[10px] text-red-600">{error}</p>
        )}
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setOpenAction(null);
              setReasonCategory("");
              setReasonDetail("");
              setError(null);
            }}
            disabled={submitting}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            className={`rounded-md px-3 py-1 text-[10px] font-bold text-white disabled:bg-gray-300 ${
              openAction === "restore"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : openAction === "delete"
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {submitting ? "..." : `${label}を実行`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {canUnpublish && (
        <button
          type="button"
          onClick={() => setOpenAction("unpublish")}
          title="一時非公開"
          className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-50"
        >
          <EyeOff size={10} strokeWidth={2} aria-hidden />
          非公開
        </button>
      )}
      {canRestore && (
        <button
          type="button"
          onClick={() => setOpenAction("restore")}
          title="公開に復元"
          className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2 py-1 text-[10px] font-bold text-emerald-800 hover:bg-emerald-50"
        >
          <RotateCcw size={10} strokeWidth={2} aria-hidden />
          復元
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => setOpenAction("delete")}
          title="削除"
          className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-2 py-1 text-[10px] font-bold text-red-800 hover:bg-red-50"
        >
          <Trash2 size={10} strokeWidth={2} aria-hidden />
          削除
        </button>
      )}
    </div>
  );
}
