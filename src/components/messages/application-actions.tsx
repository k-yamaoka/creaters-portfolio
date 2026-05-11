"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
};

/**
 * 企業側メッセージ画面の見出し直下に出す「採用 / 不採用」ボタン。
 * クリエイター側には絶対に表示しない（呼び出し元で role を確認すること）。
 */
export function ApplicationActions({ applicationId, jobId, jobTitle }: Props) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const run = async (status: "accepted" | "rejected") => {
    if (status === "accepted") {
      if (
        !confirm(
          `「${jobTitle}」でこのクリエイターを採用しますか?\n他の応募者は自動的に不採用となり、案件は締切られて取引(相談中)が自動生成されます。`
        )
      )
        return;
    } else {
      if (!confirm("このクリエイターを不採用にしますか?")) return;
    }
    setLoading(status === "accepted" ? "accept" : "reject");
    setError(null);
    const res = await fetch("/api/jobs/applications/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status, jobId }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      setError(data.error ?? "更新に失敗しました");
      setLoading(null);
      return;
    }
    if (status === "accepted" && data.orderId) {
      router.push(`/dashboard/orders/${data.orderId}`);
      return;
    }
    router.refresh();
    setLoading(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-[#828282]">「{jobTitle}」への応募:</span>
        <button
          type="button"
          onClick={() => run("accepted")}
          disabled={loading !== null}
          className="btn-primary px-3 py-1.5 text-[11px] disabled:opacity-50"
        >
          {loading === "accept" ? "処理中..." : "採用する"}
        </button>
        <button
          type="button"
          onClick={() => run("rejected")}
          disabled={loading !== null}
          className="btn-white px-3 py-1.5 text-[11px] text-red-500 disabled:opacity-50"
        >
          不採用
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
