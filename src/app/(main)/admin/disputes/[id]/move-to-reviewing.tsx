"use client";

import { useState, useTransition } from "react";

/**
 * received → reviewing への手動遷移ボタン。
 * 「受付済み」を「対応中」ステータスに切り替えるだけで、実処理は無し。
 * ユーザー側 UI の「運営: 確認中」バッジ表示切替のためのマーカー。
 */
export function MoveToReviewingButton({ disputeId }: { disputeId: string }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handle() {
    if (!confirm("この dispute を「対応中 (reviewing)」に遷移しますか?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/disputes/${disputeId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_status: "reviewing" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error ?? "更新に失敗しました");
        return;
      }
      window.location.reload();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className="rounded-full border border-amber-400 bg-amber-50 px-3 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      >
        {pending ? "..." : "対応中にする →"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </>
  );
}
