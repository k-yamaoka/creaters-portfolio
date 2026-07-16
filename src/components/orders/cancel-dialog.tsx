"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";
import {
  computeCancelBreakdown,
  type CancelBreakdown,
} from "@/lib/cancel-policy";
import type { OrderStatus } from "@/lib/order-status";

/**
 * キャンセル確認ダイアログ (A-4)。
 *
 * 現在ステータスと発注金額から返金/補償の内訳をプレビューし、
 * 同意チェック + 任意の理由入力の上で /api/orders/:id/cancel を叩く。
 */

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  basePrice: number;
  isCreator: boolean;
  open: boolean;
  onClose: () => void;
};

function formatJpy(n: number): string {
  return `¥${Math.max(0, Math.floor(n)).toLocaleString("ja-JP")}`;
}

export function CancelDialog({
  orderId,
  currentStatus,
  basePrice,
  isCreator,
  open,
  onClose,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breakdown: CancelBreakdown | null = computeCancelBreakdown(
    currentStatus,
    basePrice
  );

  if (!open) return null;
  if (!breakdown) {
    return (
      <ModalShell onClose={onClose} title="キャンセル不可">
        <p className="text-sm text-gray-700">
          この状態の注文はキャンセルできません。
        </p>
      </ModalShell>
    );
  }

  async function handleCancel() {
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const j = (await r.json()) as { error?: string; ok?: boolean };
      if (!r.ok || !j.ok) {
        throw new Error(j.error ?? "キャンセルに失敗しました");
      }
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
      setSubmitting(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="この案件をキャンセルしますか？">
      {/* 警告バナー */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <AlertTriangle
          size={14}
          strokeWidth={1.8}
          className="mt-0.5 shrink-0"
          aria-hidden
        />
        <span>{breakdown.description}</span>
      </div>

      {/* 内訳 */}
      <dl className="mt-4 space-y-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">現在の段階</dt>
          <dd className="font-bold text-gray-900">
            {breakdown.stageLabel}
            <span className="ml-1 text-xs font-normal text-gray-500">
              ({currentStatus})
            </span>
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">発注金額</dt>
          <dd className="font-mono tabular-nums text-gray-900">
            {formatJpy(breakdown.basePrice)}
          </dd>
        </div>
        <div className="border-t border-gray-200 pt-1.5" />
        <div className="flex justify-between">
          <dt className="text-gray-500">
            クリエイター補償 ({Math.round(breakdown.creatorPayoutRate * 100)}%)
          </dt>
          <dd className="font-mono tabular-nums text-gray-900">
            {formatJpy(breakdown.creatorPayout)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">
            クライアント返金 ({Math.round(breakdown.refundRate * 100)}%)
          </dt>
          <dd className="font-mono tabular-nums text-gray-900">
            {formatJpy(breakdown.refundAmount)}
          </dd>
        </div>
      </dl>

      {/* 理由 */}
      <div className="mt-4">
        <label
          htmlFor="cancel-reason"
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          キャンセル理由{" "}
          <span className="text-gray-400">(任意 500 文字以内)</span>
        </label>
        <textarea
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 500))}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
          placeholder={
            isCreator
              ? "例) スケジュールが確保できなくなったため"
              : "例) 企画変更のため"
          }
        />
      </div>

      {/* 同意 */}
      <label className="mt-3 flex items-start gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5"
        />
        上記の返金/補償内容に同意し、キャンセルを確定します。
      </label>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* ボタン */}
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-pill border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={!agreed || submitting}
          className="rounded-pill bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "処理中..." : "キャンセルを確定"}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
