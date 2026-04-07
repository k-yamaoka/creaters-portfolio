"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { updateOrderStatus } from "../actions";

const PaymentButton = dynamic(
  () => import("./payment-button").then((m) => m.PaymentButton),
  { ssr: false }
);

type Props = {
  orderId: string;
  currentStatus: string;
  isCreator: boolean;
  hasStripeKey: boolean;
};

// Define which actions are available for each status and role
const ACTION_MAP: Record<
  string,
  {
    creator?: { label: string; nextStatus: string; style: string };
    client?: { label: string; nextStatus: string; style: string };
    cancelable?: boolean;
    useStripePayment?: boolean;
    useStripeCapture?: boolean;
  }
> = {
  inquiry: {
    creator: {
      label: "見積もりを送信",
      nextStatus: "quoted",
      style: "btn-primary",
    },
    cancelable: true,
  },
  quoted: {
    client: {
      label: "見積もりを承認",
      nextStatus: "accepted",
      style: "btn-primary",
    },
    cancelable: true,
  },
  accepted: {
    useStripePayment: true,
    // Fallback if Stripe is not configured
    client: {
      label: "仮払いする（テスト）",
      nextStatus: "paid",
      style: "btn-primary",
    },
    cancelable: true,
  },
  paid: {
    creator: {
      label: "制作を開始",
      nextStatus: "in_progress",
      style: "btn-primary",
    },
  },
  in_progress: {
    creator: {
      label: "納品する",
      nextStatus: "delivered",
      style: "btn-primary",
    },
  },
  delivered: {
    useStripeCapture: true,
    client: {
      label: "検収完了",
      nextStatus: "completed",
      style: "btn-primary",
    },
    creator: undefined,
  },
  revision: {
    creator: {
      label: "修正して再納品",
      nextStatus: "delivered",
      style: "btn-primary",
    },
  },
};

export function OrderActions({
  orderId,
  currentStatus,
  isCreator,
  hasStripeKey,
}: Props) {
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

  const handleCapture = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        window.location.reload();
      }
    } catch {
      setError("エラーが発生しました");
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

  // Show Stripe payment for accepted orders (client side)
  const showStripePayment =
    config.useStripePayment && !isCreator && hasStripeKey;
  // Show Stripe capture for delivered orders (client side)
  const showStripeCapture =
    config.useStripeCapture && !isCreator && hasStripeKey;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <h2 className="mb-4 text-lg font-bold text-[#222]">アクション</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Stripe payment button for escrow */}
        {showStripePayment && <PaymentButton orderId={orderId} />}

        {/* Stripe capture for completion */}
        {showStripeCapture && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={loading}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {loading ? "処理中..." : "検収完了（決済確定）"}
          </button>
        )}

        {/* Regular actions (fallback or non-payment actions) */}
        {action && !showStripePayment && !showStripeCapture && (
          <button
            type="button"
            onClick={() => handleAction(action.nextStatus)}
            disabled={loading}
            className={`${action.style} text-sm disabled:opacity-50`}
          >
            {loading ? "処理中..." : action.label}
          </button>
        )}

        {/* Fallback: non-Stripe payment */}
        {config.useStripePayment && !isCreator && !hasStripeKey && action && (
          <button
            type="button"
            onClick={() => handleAction(action.nextStatus)}
            disabled={loading}
            className={`${action.style} text-sm disabled:opacity-50`}
          >
            {loading ? "処理中..." : action.label}
          </button>
        )}

        {/* Fallback: non-Stripe capture */}
        {config.useStripeCapture && !isCreator && !hasStripeKey && action && (
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

        {!action &&
          !showStripePayment &&
          !showStripeCapture &&
          !config.cancelable &&
          currentStatus !== "delivered" && (
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
