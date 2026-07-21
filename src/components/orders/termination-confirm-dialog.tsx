"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, MessageCircleHeart } from "lucide-react";

/**
 * 途中終了 (合意解約) の "自爆防止" 全画面モーダル。
 *
 * 仕様 (2026-07-16):
 *   - 「途中終了を申請する」または相手の申請に「同意する」ボタン押下時に表示
 *   - 警告テキスト:
 *       ⚠️ 警告：同意すると仮払い金は全額返金され、あなたの報酬は『ゼロ』になります。
 *       本当に合意のない途中終了ですか？
 *   - チェックボックスを ON にしないと確定不可
 *   - 直前に「運営に相談する」ボタンを必ず配置
 *
 * 使い方:
 *   <TerminationConfirmDialog
 *     orderId={id}
 *     isCreator
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     onContactAdmin={() => openTroubleWizard()}
 *   />
 */

type Props = {
  orderId: string;
  isCreator: boolean;
  /** モードの区別 (申請 / 相手の申請への同意)。UI 文言のみ変わる。 */
  mode?: "propose" | "agree";
  open: boolean;
  onClose: () => void;
  /** 「運営に相談する」を押した際の外部ハンドラ (ウィザードを開く等) */
  onContactAdmin?: () => void;
};

export function TerminationConfirmDialog({
  orderId,
  isCreator,
  mode = "propose",
  open,
  onClose,
  onContactAdmin,
}: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleConfirm() {
    if (!checked) return;
    if (reason.trim().length === 0) {
      setError("途中終了の理由記入は必須です");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(`/api/orders/${orderId}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim() || undefined,
          acknowledgeMutualConsent: true,
        }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) {
        throw new Error(j.error ?? "途中終了処理に失敗しました");
      }
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="途中終了の確認"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ヘッダ */}
        <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle
              size={20}
              strokeWidth={2}
              className="text-red-600"
              aria-hidden
            />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-red-900">
              {mode === "agree"
                ? "途中終了の申請に同意しますか？"
                : "途中終了を申請しますか？"}
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-red-700">
              この操作は取り消せません
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            disabled={submitting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-400 hover:bg-red-100/60 hover:text-red-700 disabled:opacity-50"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {/* Phase 3 仕様準拠 (2026-07-21):
              巨大で目立つ警告文 — フォント大きめ + 「ゼロ」を強調バッジ表現 */}
          <div className="rounded-2xl border-2 border-red-400 bg-red-50 px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-base font-black leading-[1.7] text-red-900 sm:text-lg">
              ⚠️ 警告：同意すると仮払い金は
              <br className="sm:hidden" />
              <b className="mx-0.5 underline decoration-red-500 decoration-wavy underline-offset-4">
                全額発注者に返金
              </b>
              され、あなたの報酬は
              <span className="mx-1 inline-flex items-baseline rounded bg-red-600 px-2 py-0.5 font-black text-white shadow-md">
                『ゼロ』
              </span>
              になります。
            </p>
            {isCreator && (
              <p className="mt-3 text-xs leading-relaxed text-red-800">
                クリエイターの方へ: これまで制作にかけた時間・素材のコストは
                すべてご自身の負担になります。「連絡が来ない」「不当な修正要求」
                などのトラブルであれば、途中終了ではなく <b>運営裁定</b> を
                申請することを強く推奨します。
              </p>
            )}
          </div>

          {/* Phase 3 仕様: 「同意する前に」見出し + 運営相談ボタン */}
          {onContactAdmin && (
            <div className="mt-5 rounded-xl border-2 border-indigo-300 bg-indigo-50 p-4">
              <p className="text-sm font-bold text-indigo-900">
                同意する前に
              </p>
              <p className="mt-1 text-xs leading-relaxed text-indigo-800">
                トラブルの内容によっては、途中終了ではなく <b>運営裁定</b> や <b>催促通知</b> で
                解決できる可能性があります。まず運営にご相談ください。
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onContactAdmin();
                }}
                disabled={submitting}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50"
              >
                <MessageCircleHeart
                  size={16}
                  strokeWidth={2}
                  aria-hidden
                />
                運営に相談する
              </button>
            </div>
          )}

          {/* 理由入力 (必須, 00072 仕様 #4) */}
          <div className="mt-4">
            <label
              htmlFor="term-reason"
              className="mb-1 block text-xs font-medium text-gray-700"
            >
              途中終了の理由{" "}
              <span className="font-bold text-red-600">(必須 500 字以内)</span>
            </label>
            <textarea
              id="term-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              rows={2}
              disabled={submitting}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink disabled:bg-gray-50"
              placeholder="例) 双方合意のうえで見送ります"
            />
          </div>

          {/* Phase 3 仕様準拠: 必須チェックボックス (ラベル文言も仕様どおり) */}
          <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-xl border-2 border-red-300 bg-white p-4 text-sm shadow-inner hover:bg-red-50/40">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-5 w-5 shrink-0 accent-red-600"
              aria-label="報酬ゼロで途中終了することに同意"
            />
            <span className="leading-relaxed text-red-900">
              上記を理解し、
              <b>報酬ゼロで途中終了することに同意します</b>
              。
            </span>
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
              キャンセル (戻る)
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!checked || reason.trim().length === 0 || submitting}
              className="rounded-pill bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting
                ? "処理中..."
                : mode === "agree"
                  ? "同意して途中終了を確定"
                  : "途中終了を確定する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
