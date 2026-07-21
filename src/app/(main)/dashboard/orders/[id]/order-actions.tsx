"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { updateOrderStatus } from "../actions";
import type { OrderStatus } from "@/lib/order-status";
import { CancelDialog } from "@/components/orders/cancel-dialog";
import { TerminationConfirmDialog } from "@/components/orders/termination-confirm-dialog";
import { TroubleReportWizard } from "@/components/orders/trouble-report-wizard";
import { MessageCircleQuestion, Ban } from "lucide-react";
import { canSubmitDelivery, isEscrowFunded } from "@/lib/order-flow";

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
  /** キャンセルポリシー内訳計算に使用 (00069 A-4) */
  basePrice: number;
  /** active な dispute (00071)。ある場合は運営裁定中 */
  activeDisputeId?: string | null;
  /** 途中終了済み (00071)。ある場合は全操作を隠す */
  terminatedAt?: string | null;
  /** STEP1 催促を発火済みか (00073)。未実施なら wizard で dispute ボタン非活性 */
  hasSentReminder?: boolean;
  /** STEP2 修正依頼を出したことがあるか (revision_count_used > 0) */
  hasRequestedRevision?: boolean;
  /** STEP2 納品を受領済みか (delivered_at != null) */
  hasDelivery?: boolean;
  /** STEP1 導線: メッセージ画面 URL */
  messageThreadHref?: string;
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
      // nextStatus は self-loop だが、検収完了は status を変えず escrow_status だけ
      // released にする操作なので、handleCapture (/api/stripe/capture) が処理する。
      // ラベルだけがこのオブジェクトから引かれる。
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
  basePrice,
  activeDisputeId,
  terminatedAt,
  hasSentReminder,
  hasRequestedRevision,
  hasDelivery,
  messageThreadHref,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A-4: 旧 window.confirm を CancelDialog 経由に置き換え
  const [cancelOpen, setCancelOpen] = useState(false);
  // 00071: 途中終了モーダル + 運営相談 ウィザード
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [troubleOpen, setTroubleOpen] = useState(false);
  const router = useRouter();

  // 00071 ガードレール:
  //   - 途中終了 / 運営裁定中は 進行系の action を全て隠す
  //   - 納品 (production/revision → delivered) は escrow held を要求
  const isLocked = !!terminatedAt || !!activeDisputeId;
  const canDeliver = canSubmitDelivery({
    status: currentStatus,
    escrow_status: escrowStatus,
    terminated_at: terminatedAt ?? null,
    active_dispute_id: activeDisputeId ?? null,
  });
  const escrowFunded = isEscrowFunded(escrowStatus);

  const config = ACTION_MAP[currentStatus as OrderStatus];
  if (!config) return null;

  const action = isCreator ? config.creator : config.client;

  const handleAction = async (nextStatus: string) => {
    setLoading(true);
    setError(null);
    const result = await updateOrderStatus(orderId, nextStatus);
    if (result?.error) {
      setError(result.error);
      // 「他のセッションで状態が変わった」「遷移許可されてない」系のエラーは
      // 画面が古いので router.refresh() で最新ステータスに合わせる
      router.refresh();
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
    }
    // 成功/失敗いずれも最新化
    router.refresh();
    setLoading(false);
  };

  // A-4: 旧 window.confirm を廃止し CancelDialog 経由の完全フローに置き換え。
  //   ダイアログ内で /api/orders/:id/cancel を叩き、cancel_stage / refund 内訳を
  //   DB に snapshot したうえで router.refresh() する。
  const handleCancel = () => setCancelOpen(true);

  const showStripePayment =
    config.useStripePayment && !isCreator && hasStripeKey;
  const showStripeCapture =
    config.useStripeCapture &&
    !isCreator &&
    hasStripeKey &&
    escrowStatus !== "released";

  // 00071: 進行系ボタンを個別に安全チェック。
  //   deliver への遷移だけは escrow held (canDeliver) を強制。他の遷移
  //   (contract → data_sharing / production → revision 等) は既存の
  //   whitelist に任せる。
  const isDeliverAction = action?.nextStatus === "delivered";
  const advanceDisabled =
    loading || isLocked || (isDeliverAction && !canDeliver);
  const advanceHint =
    isLocked
      ? "この案件は途中終了 / 運営裁定中のため操作できません"
      : isDeliverAction && !canDeliver
        ? escrowFunded
          ? "現在の状態では納品できません"
          : "納品には仮払い (エスクロー) の完了が必要です"
        : null;

  // 「運営に相談する」+「途中終了を申請する」共通トリガー
  const safetyButtons = (
    <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={() => setTroubleOpen(true)}
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
      >
        <MessageCircleQuestion size={12} strokeWidth={2} aria-hidden />
        運営に相談する
      </button>
      {!isLocked && currentStatus !== "delivered" && (
        <button
          type="button"
          onClick={() => setTerminateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-pill border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          <Ban size={12} strokeWidth={2} aria-hidden />
          {isCreator ? "途中終了を申請する" : "途中終了に合意する"}
        </button>
      )}
    </div>
  );

  // 共通ダイアログ
  const dialogs = (
    <>
      <CancelDialog
        orderId={orderId}
        currentStatus={currentStatus as OrderStatus}
        basePrice={basePrice}
        isCreator={isCreator}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
      />
      <TerminationConfirmDialog
        orderId={orderId}
        isCreator={isCreator}
        open={terminateOpen}
        onClose={() => setTerminateOpen(false)}
        onContactAdmin={() => setTroubleOpen(true)}
      />
      <TroubleReportWizard
        orderId={orderId}
        open={troubleOpen}
        onClose={() => setTroubleOpen(false)}
        activeDisputeId={activeDisputeId ?? null}
        hasSentReminder={!!hasSentReminder}
        hasRequestedRevision={!!hasRequestedRevision}
        hasDelivery={!!hasDelivery}
        messageThreadHref={messageThreadHref}
      />
    </>
  );

  // クリエイター側: 「アクション」枠組みを廃止し、ボタンを単独で配置
  if (isCreator) {
    const showRevision = false; // クリエイターには修正依頼ボタン無し
    const hasAdvance = !!action;
    const showCancel = config.cancelable;
    if (!hasAdvance && !showCancel && !showRevision) {
      // 進行アクション無し / cancel 無しでも運営相談ボタンは常時提供
      return (
        <div className="space-y-3">
          {safetyButtons}
          {dialogs}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {advanceHint && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {advanceHint}
          </div>
        )}
        {action && (
          <button
            type="button"
            onClick={() => handleAction(action.nextStatus)}
            disabled={advanceDisabled}
            title={advanceHint ?? undefined}
            className={`${action.style} w-full text-sm disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {loading ? "処理中..." : action.label}
          </button>
        )}
        {showCancel && !isLocked && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="block w-full rounded-pill border-2 border-red-200 bg-white px-8 py-3 text-sm font-bold text-red-500 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
          >
            この案件をキャンセルする
          </button>
        )}
        {safetyButtons}
        {dialogs}
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

        {/* Stripe キャプチャ段階 (delivered) で Stripe キー無しのフォールバック
            検収完了は status を変えず escrow_status だけ released にしたいので、
            /api/stripe/capture を叩く handleCapture を呼ぶ (status 遷移ホワイトリストには
            self-loop が無いため、handleAction(delivered) は弾かれてしまう) */}
        {config.useStripeCapture &&
          !hasStripeKey &&
          escrowStatus !== "released" &&
          action && (
            <button
              type="button"
              onClick={handleCapture}
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
      {/* 00071: 「運営に相談する」「途中終了に合意する」共通ボタン + 共通ダイアログ */}
      <div className="mt-4">{safetyButtons}</div>
      {dialogs}
    </div>
  );
}
