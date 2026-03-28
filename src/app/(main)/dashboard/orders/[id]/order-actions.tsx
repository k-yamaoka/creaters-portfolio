"use client";

import { useState } from "react";
import { updateOrderStatus } from "../actions";

type Props = {
  orderId: string;
  currentStatus: string;
  isCreator: boolean;
};

// Define which actions are available for each status and role
const ACTION_MAP: Record<
  string,
  { creator?: { label: string; nextStatus: string; style: string };
    client?: { label: string; nextStatus: string; style: string };
    cancelable?: boolean }
> = {
  inquiry: {
    creator: { label: "見積もりを送信", nextStatus: "quoted", style: "btn-primary" },
    cancelable: true,
  },
  quoted: {
    client: { label: "見積もりを承認", nextStatus: "accepted", style: "btn-primary" },
    cancelable: true,
  },
  accepted: {
    client: { label: "仮払いする", nextStatus: "paid", style: "btn-primary" },
    cancelable: true,
  },
  paid: {
    creator: { label: "制作を開始", nextStatus: "in_progress", style: "btn-primary" },
  },
  in_progress: {
    creator: { label: "納品する", nextStatus: "delivered", style: "btn-primary" },
  },
  delivered: {
    client: { label: "検収完了", nextStatus: "completed", style: "btn-primary" },
    creator: undefined,
  },
  revision: {
    creator: { label: "修正して再納品", nextStatus: "delivered", style: "btn-primary" },
  },
};

export function OrderActions({ orderId, currentStatus, isCreator }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = ACTION_MAP[currentStatus];
  if (!config) return null;

  const action = isCreator ? config.creator : config.client;

  const handleAction = async (nextStatus: string) => {
    setLoading(true);
    setError(null);
    const result = await updateOrderStatus(orderId, nextStatus);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleRevision = async () => {
    setLoading(true);
    setError(null);
    const result = await updateOrderStatus(orderId, "revision");
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm("この取引をキャンセルしますか？")) return;
    setLoading(true);
    const result = await updateOrderStatus(orderId, "cancelled");
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <h2 className="mb-4 text-lg font-bold text-[#222]">アクション</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {action && (
          <button
            type="button"
            onClick={() => handleAction(action.nextStatus)}
            disabled={loading}
            className={`${action.style} text-sm disabled:opacity-50`}
          >
            {loading ? "処理中..." : action.label}
          </button>
        )}

        {/* Revision request (client only, when delivered) */}
        {!isCreator && currentStatus === "delivered" && (
          <button
            type="button"
            onClick={handleRevision}
            disabled={loading}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            修正を依頼
          </button>
        )}

        {/* Cancel */}
        {config.cancelable && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="btn-white text-sm text-red-500 disabled:opacity-50"
          >
            キャンセル
          </button>
        )}

        {!action && !config.cancelable && currentStatus !== "delivered" && (
          <p className="text-sm text-[#828282]">
            {isCreator
              ? "クライアントの対応をお待ちください"
              : "クリエイターの対応をお待ちください"}
          </p>
        )}
      </div>
    </div>
  );
}
