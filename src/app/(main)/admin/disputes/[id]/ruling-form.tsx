"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, AlertTriangle } from "lucide-react";

/**
 * §B8 Ruling フォーム (2026-07-21)。
 *
 * admin が ruling_type と (該当時) refund_rate を選び、ユーザー向けの要約と
 * 運営内部メモを入力して裁定確定する。
 *
 * ruling_type:
 *   partial_refund    → 一部返金 (rate スライダ 0.0〜1.0 で指定)
 *   full_refund       → 全額返金 (rate = 1.0 に強制)
 *   reproduction      → 再制作 (revision へ戻す)
 *   no_action         → 申告却下
 *   as_is             → 満額支払 (クリエイター側有利)
 */

type RulingType =
  | "partial_refund"
  | "full_refund"
  | "reproduction"
  | "no_action"
  | "as_is";

const RULING_OPTIONS: Array<{
  key: RulingType;
  label: string;
  desc: string;
  needsRate: boolean;
}> = [
  {
    key: "partial_refund",
    label: "一部返金",
    desc: "合意仕様の一部未達 → クライアントに 一部返金、残りはクリエイターへ",
    needsRate: true,
  },
  {
    key: "full_refund",
    label: "全額返金",
    desc: "仕様未達が明確 or 未納品 → クライアントに 100% 返金 (rate=1.0 固定)",
    needsRate: true,
  },
  {
    key: "reproduction",
    label: "再制作",
    desc: "revision に戻し、双方で仕様確認のうえ再制作",
    needsRate: false,
  },
  {
    key: "no_action",
    label: "申告却下",
    desc: "証拠不十分 / 主観的評価のみ → 状態変更なし",
    needsRate: false,
  },
  {
    key: "as_is",
    label: "満額支払 (クリエイター有利)",
    desc: "納品物が合意仕様どおり → クリエイターへ満額支払を確定",
    needsRate: false,
  },
];

type Props = {
  disputeId: string;
  basePrice: number;
  currentInternalNote: string;
};

export function RulingForm({
  disputeId,
  basePrice,
  currentInternalNote,
}: Props) {
  const router = useRouter();
  const [ruling, setRuling] = useState<RulingType | "">("");
  const [refundRate, setRefundRate] = useState<number>(0.5);
  const [summary, setSummary] = useState("");
  const [internalNote, setInternalNote] = useState(currentInternalNote);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => RULING_OPTIONS.find((o) => o.key === ruling) ?? null,
    [ruling]
  );

  const effectiveRate =
    ruling === "full_refund"
      ? 1
      : ruling === "partial_refund"
        ? refundRate
        : null;

  const refundAmount =
    effectiveRate !== null ? Math.floor(basePrice * effectiveRate) : null;
  const creatorPayout =
    effectiveRate !== null ? basePrice - (refundAmount ?? 0) : null;

  const canSubmit =
    !!ruling && summary.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !ruling) return;
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(`/api/admin/disputes/${disputeId}/ruling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruling_type: ruling,
          ruling_refund_rate: effectiveRate,
          resolution_summary: summary.trim(),
          internal_note: internalNote.trim() || undefined,
        }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) {
        throw new Error(j.error ?? "裁定に失敗しました");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
      setSubmitting(false);
    }
  }

  return (
    <div className="sticky top-6 space-y-3 rounded-2xl border-2 border-indigo-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Gavel size={16} strokeWidth={2} className="text-indigo-600" aria-hidden />
        <h3 className="text-sm font-bold text-gray-900">裁定を確定する</h3>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-700">
          裁定タイプ (必須)
        </label>
        <div className="space-y-1.5">
          {RULING_OPTIONS.map((o) => (
            <label
              key={o.key}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                ruling === o.key
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="ruling"
                value={o.key}
                checked={ruling === o.key}
                onChange={() => setRuling(o.key)}
                disabled={submitting}
                className="mt-0.5 h-3 w-3 accent-indigo-600"
              />
              <span>
                <b className="text-gray-900">{o.label}</b>
                <p className="mt-0.5 text-[10px] text-gray-600">{o.desc}</p>
              </span>
            </label>
          ))}
        </div>
      </div>

      {selected?.needsRate && ruling !== "full_refund" && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-700">
            返金率: <b>{Math.round(refundRate * 100)}%</b>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={refundRate}
            onChange={(e) => setRefundRate(Number(e.target.value))}
            disabled={submitting}
            className="w-full accent-indigo-600"
          />
          <div className="mt-1 flex justify-between text-[10px] text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {effectiveRate !== null && basePrice > 0 && (
        <dl className="rounded-md bg-gray-50 p-2.5 text-[11px]">
          <div className="flex justify-between">
            <dt className="text-gray-600">クライアント返金</dt>
            <dd className="font-mono">
              ¥{(refundAmount ?? 0).toLocaleString("ja-JP")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">クリエイター補償</dt>
            <dd className="font-mono">
              ¥{(creatorPayout ?? 0).toLocaleString("ja-JP")}
            </dd>
          </div>
        </dl>
      )}

      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-700">
          ユーザーへの説明 (必須 2000 字以内)
        </label>
        <textarea
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value.slice(0, 2000))}
          disabled={submitting}
          placeholder="例) 合意仕様のうち BGM のクレジット表記が未達成のため、双方の主張と証跡を確認したうえ、10% の一部返金を裁定します。"
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
        />
        <p className="mt-1 text-[10px] text-gray-500">
          {summary.length} / 2000 (双方の当事者にメール通知されます)
        </p>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-700">
          運営内部メモ (INTERNAL, 任意)
        </label>
        <textarea
          rows={3}
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value.slice(0, 5000))}
          disabled={submitting}
          placeholder="ユーザーには表示されません。判断根拠 / 参考情報 など。"
          className="w-full rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:bg-amber-100/60"
        />
      </div>

      {error && (
        <div className="flex items-start gap-1.5 rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
          <AlertTriangle size={12} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-pill bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {submitting ? "確定中..." : "この裁定で確定する"}
      </button>
      <p className="text-center text-[10px] text-gray-500">
        確定すると orders の状態が更新され、双方に通知されます (取消不可)
      </p>
    </div>
  );
}
