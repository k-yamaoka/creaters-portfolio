"use client";

import { useState } from "react";

export function JobStatusActions({
  jobId,
  currentStatus,
}: {
  jobId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (newStatus: string) => {
    if (
      newStatus === "cancelled" &&
      !confirm("この案件をキャンセルしますか？")
    )
      return;

    setLoading(true);
    await fetch("/api/jobs/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, status: newStatus }),
    });
    window.location.reload();
  };

  if (currentStatus === "cancelled") return null;

  return (
    <div className="flex flex-wrap gap-3">
      {currentStatus === "open" && (
        <>
          <button
            type="button"
            onClick={() => handleUpdate("closed")}
            disabled={loading}
            className="btn-white text-sm disabled:opacity-50"
          >
            {loading ? "処理中..." : "募集を締め切る"}
          </button>
          <button
            type="button"
            onClick={() => handleUpdate("cancelled")}
            disabled={loading}
            className="btn-white text-sm text-red-500 disabled:opacity-50"
          >
            キャンセル
          </button>
        </>
      )}
      {currentStatus === "closed" && (
        <button
          type="button"
          onClick={() => handleUpdate("open")}
          disabled={loading}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {loading ? "処理中..." : "再公開する"}
        </button>
      )}
    </div>
  );
}
