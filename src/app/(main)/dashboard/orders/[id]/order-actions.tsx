"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { updateOrderStatus } from "../actions";
import type { OrderStatus } from "@/lib/order-status";

const PaymentButton = dynamic(
  () => import("./payment-button").then((m) => m.PaymentButton),
  { ssr: false }
);

type Props = {
  orderId: string;
  currentStatus: string;
  escrowStatus?: string | null;
  isCreator: boolean;
  hasStripeKey: boolean;
};

type Action = { label: string; nextStatus: OrderStatus; style: string };

type StageConfig = {
  creator?: Action;
  client?: Action;
  cancelable?: boolean;
  /** 契約後の Stripe 決済が必要 */
  useStripePayment?: boolean;
  /** 検収時の Stripe キャプチャ */
  useStripeCapture?: boolean;
};

const ACTION_MAP: Record<OrderStatus, StageConfig> = {
  consultation: {
    creator: {
      label: "見積もりを送信",
      nextStatus: "quoting",
      style: "btn-primary",
    },
    cancelable: true,
  },
  quoting: {
    client: {
      label: "見積もりを承認（契約へ進む）",
      nextStatus: "contract",
      style: "btn-primary",
    },
    cancelable: true,
  },
  contract: {
    useStripePayment: true,
    // Stripe未設定時のフォールバック (テスト用)
    client: {
      label: "仮払いする（テスト）",
      nextStatus: "data_sharing",
      style: "btn-primary",
    },
    cancelable: true,
  },
  data_sharing: {
    creator: {
      label: "データ受領を確認 → 制作開始",
      nextStatus: "production",
      style: "btn-primary",
    },
    cancelable: true,
  },
  production: {
    creator: {
      label: "納品する",
      nextStatus: "delivered",
      style: "btn-primary",
    },
  },
  revision: {
    creator: {
      label: "修正して再納品",
      nextStatus: "delivered",
      style: "btn-primary",
    },
  },
  delivered: {
    useStripeCapture: true,
    client: {
      label: "検収完了（決済確定）",
      nextStatus: "delivered",
      style: "btn-primary",
    },
  },
  cancelled: {},
};

export function OrderActions({
  orderId,
  currentStatus,
  escrowStatus,
  isCreator,
  hasStripeKey,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = ACTION_MAP[currentStatus as OrderStatus];
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

  // 契約ステップでの Stripe 決済 (クライアント側)
  const showStripePayment =
    config.useStripePayment && !isCreator && hasStripeKey;
  // 納品完了ステップでの Stripe キャプチャ (クライアント側、未確定時のみ)
  const showStripeCapture =
    config.useStripeCapture &&
    !isCreator &&
    hasStripeKey &&
    escrowStatus !== "released";

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <h2 className="mb-4 text-lg font-bold text-[#222]">アクション</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Stripe 仮払い */}
        {showStripePayment && <PaymentButton orderId={orderId} />}

        {/* Stripe キャプチャ (検収) */}
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

        {/* 通常アクション */}
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

        {/* Stripe 未設定時の決済フォールバック */}
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

        {/* Stripe 未設定時のキャプチャフォールバック */}
        {config.useStripeCapture &&
          !isCreator &&
          !hasStripeKey &&
          escrowStatus !== "released" &&
          action && (
            <button
              type="button"
              onClick={() => handleAction(action.nextStatus)}
              disabled={loading}
              className={`${action.style} text-sm disabled:opacity-50`}
            >
              {loading ? "処理中..." : action.label}
            </button>
          )}

        {/* 修正依頼 (クライアント、納品完了直後・検収前のみ) */}
        {!isCreator &&
          currentStatus === "delivered" &&
          escrowStatus !== "released" && (
            <button
              type="button"
              onClick={handleRevision}
              disabled={loading}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              修正を依頼
            </button>
          )}

        {/* キャンセル */}
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
