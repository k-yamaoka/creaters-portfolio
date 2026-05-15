"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    // クリエイター側の「見積もりを送信」ボタンは廃止 (要件 #5)。
    // 見積もり内容はメッセージで詰め、企業側が「発注に進む（契約へ）」で契約段階に進める。
    client: {
      label: "発注に進む（契約へ）",
      nextStatus: "contract",
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
    client: {
      label: "仮払いする（テスト）",
      nextStatus: "data_sharing",
      style: "btn-primary",
    },
    cancelable: true,
  },
  data_sharing: {
    // 双方どちらでも「データ共有完了 → 制作へ」を進められる
    client: {
      label: "データ共有を完了する → 制作へ",
      nextStatus: "production",
      style: "btn-primary",
    },
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
  const router = useRouter();

  const config = ACTION_MAP[currentStatus as OrderStatus];
  if (!config) return null;

  const action = isCreator ? config.creator : config.client;

  const handleAction = async (nextStatus: string) => {
    setLoading(true);
    setError(null);
    const result = await updateOrderStatus(orderId, nextStatus);
    if (result?.error) {
      setError(result.error);
    } else {
      // revalidatePath だけだとクライアント側が再フェッチしないので router.refresh() を呼ぶ
      router.refresh();
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
      if (data.error) setError(data.error);
      else window.location.reload();
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
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm("この案件をキャンセルしますか？")) return;
    setLoading(true);
    setError(null);
    const result = await updateOrderStatus(orderId, "cancelled");
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  const showStripePayment =
    config.useStripePayment && !isCreator && hasStripeKey;
  const showStripeCapture =
    config.useStripeCapture &&
    !isCreator &&
    hasStripeKey &&
    escrowStatus !== "released";

  // クリエイター側: 「アクション」枠組みを廃止し、ボタンを単独で配置
  if (isCreator) {
    const showRevision = false; // クリエイターには修正依頼ボタン無し
    const hasAdvance = !!action;
    const showCancel = config.cancelable;
    if (!hasAdvance && !showCancel && !showRevision) return null;

    return (
      <div className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {action && (
          <button
            type="button"
            onClick={() => handleAction(action.nextStatus)}
            disabled={loading}
            className={`${action.style} w-full text-sm disabled:opacity-50`}
          >
            {loading ? "処理中..." : action.label}
          </button>
        )}
        {showCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="block w-full rounded-pill border-2 border-red-200 bg-white px-8 py-3 text-sm font-bold text-red-500 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
          >
            この案件をキャンセルする
          </button>
        )}
      </div>
    );
  }

  // クライアント側: 従来のアクションパネル
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <h2 className="mb-4 text-lg font-bold text-[#222]">アクション</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {showStripePayment && <PaymentButton orderId={orderId} />}

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

        {/* 通常アクション (Stripe 決済/キャプチャを使わないステージ) */}
        {action &&
          !config.useStripePayment &&
          !config.useStripeCapture && (
            <button
              type="button"
              onClick={() => handleAction(action.nextStatus)}
              disabled={loading}
              className={`${action.style} text-sm disabled:opacity-50`}
            >
              {loading ? "処理中..." : action.label}
            </button>
          )}

        {/* Stripe 決済段階 (contract) で Stripe キー無しのフォールバック */}
        {config.useStripePayment && !hasStripeKey && action && (
          <button
            type="button"
            onClick={() => handleAction(action.nextStatus)}
            disabled={loading}
            className={`${action.style} text-sm disabled:opacity-50`}
          >
            {loading ? "処理中..." : action.label}
          </button>
        )}

        {/* Stripe キャプチャ段階 (delivered) で Stripe キー無しのフォールバック */}
        {config.useStripeCapture &&
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

        {currentStatus === "delivered" && escrowStatus !== "released" && (
          <button
            type="button"
            onClick={handleRevision}
            disabled={loading}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            修正を依頼
          </button>
        )}

        {config.cancelable && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="btn-white text-sm text-red-500 disabled:opacity-50"
          >
            この案件をキャンセルする
          </button>
        )}

        {!action &&
          !showStripePayment &&
          !showStripeCapture &&
          !config.cancelable &&
          currentStatus !== "delivered" && (
            <p className="text-sm text-[#828282]">
              クリエイターの対応をお待ちください
            </p>
          )}
      </div>
    </div>
  );
}
