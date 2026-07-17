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

export function ModerationActionForm({ portfolioId, currentStatus }: Props) {
  const router = useRouter();
  const [openAction, setOpenAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRestore =
    currentStatus === "unpublished" || currentStatus === "deleted";
  const canUnpublish = currentStatus === "published";
  const canDelete = currentStatus !== "deleted";

  async function handleSubmit() {
    if (!openAction) return;
    if (reason.trim().length === 0) {
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
          body: JSON.stringify({ action: openAction, reason: reason.trim() }),
        }
      );
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) throw new Error(j.error ?? "更新に失敗しました");
      setOpenAction(null);
      setReason("");
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
          {label} の理由 (必須)
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 2000))}
          rows={2}
          disabled={submitting}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-[11px] outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-gray-100"
          placeholder="例) 著作権侵害の疑い / 通報カテゴリと合致"
          autoFocus
        />
        {error && (
          <p className="text-[10px] text-red-600">{error}</p>
        )}
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setOpenAction(null);
              setReason("");
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
            disabled={submitting || reason.trim().length === 0}
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
