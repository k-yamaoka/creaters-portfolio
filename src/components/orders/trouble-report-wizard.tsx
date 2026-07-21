"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  MessageCircleQuestion,
  MailWarning,
  RefreshCcw,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

/**
 * トラブル報告ウィザード (Trust & Safety)。
 *
 * 仕様 (2026-07-16):
 *   - 「連絡が来ない」「不当な修正要求」等の選択肢
 *   - 選択に応じて正しい手順 (催促 / 検収依頼 / 運営裁定) へ自動誘導
 *
 * フロー:
 *   Step1 カテゴリ選択 → Step2 一次アクション提案 (催促等) or 詳細入力
 *     → Step3 完了メッセージ
 *
 * カテゴリ:
 *   no_response       → まず催促 (POST /api/orders/:id/remind)、それでもダメなら運営申請
 *   payment_delay     → 検収依頼リマインド → 運営申請
 *   unfair_revision   → 修正回数上限を提示 → 運営申請
 *   quality_issue     → 直接運営申請
 *   termination_dispute → 直接運営申請
 *   other             → 直接運営申請
 *
 * 運営申請は POST /api/orders/:id/dispute (category / reason)。
 */

type Category =
  | "no_response"
  | "payment_delay"
  | "unfair_revision"
  | "quality_issue"
  | "termination_dispute"
  | "other";

type CategoryMeta = {
  key: Category;
  label: string;
  desc: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
    "aria-hidden"?: boolean;
  }>;
  /** 運営裁定の前に試せる一次アクション */
  quickAction?: "remind";
  quickActionLabel?: string;
  quickActionHint?: string;
};

const CATEGORIES: CategoryMeta[] = [
  {
    key: "no_response",
    label: "連絡が来ない / 返信がない",
    desc: "相手からの返信・対応が長期間ない",
    icon: MailWarning,
    quickAction: "remind",
    quickActionLabel: "まず相手に催促通知を送る",
    quickActionHint:
      "24 時間以内に応答がない場合は、続けて運営裁定を申請できます",
  },
  {
    key: "payment_delay",
    label: "検収されない / 支払いが遅い",
    desc: "納品後、クライアントの検収 (支払確定) が長期間行われない",
    icon: RefreshCcw,
    quickAction: "remind",
    quickActionLabel: "検収依頼を催促する",
    quickActionHint:
      "納品後 7 日で自動検収 (みなし承認) が発動しますが、事前に催促できます",
  },
  {
    key: "unfair_revision",
    label: "不当な修正要求 / 追加作業要求",
    desc: "合意した修正回数や範囲を超える対応を要求されている",
    icon: ShieldAlert,
    quickActionHint:
      "契約時に合意した修正回数を超える対応は追加発注 (別料金) の対象です。運営裁定を申請できます",
  },
  {
    key: "quality_issue",
    label: "納品物の品質に重大な問題がある",
    desc: "AI 未修正 / 明らかな未完成 / 依頼と大きく異なる など",
    icon: ShieldAlert,
  },
  {
    key: "termination_dispute",
    label: "途中終了に関する意見の相違",
    desc: "相手が途中終了を主張しているが同意できない",
    icon: MessageCircleQuestion,
  },
  {
    key: "other",
    label: "その他 (上記以外のトラブル)",
    desc: "上記に当てはまらない相談・報告",
    icon: MessageCircleQuestion,
  },
];

type Props = {
  orderId: string;
  open: boolean;
  onClose: () => void;
  /** 既に active な dispute があるとき ID を渡すと Step2 で「申請済み」を表示 */
  activeDisputeId?: string | null;
  /** 00073 STEP1 催促 済みか (orders.first_reminder_sent_at IS NOT NULL) */
  hasSentReminder?: boolean;
};

type Step = "select" | "confirm" | "done";

export function TroubleReportWizard({
  orderId,
  open,
  onClose,
  activeDisputeId,
  hasSentReminder = false,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [category, setCategory] = useState<Category | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState("");

  if (!open) return null;

  const catMeta = category
    ? CATEGORIES.find((c) => c.key === category) ?? null
    : null;

  function reset() {
    setStep("select");
    setCategory(null);
    setReason("");
    setError(null);
    setDoneMessage("");
    setSubmitting(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function runQuickAction() {
    if (!catMeta || catMeta.quickAction !== "remind") return;
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(`/api/orders/${orderId}/remind`, {
        method: "POST",
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) {
        throw new Error(j.error ?? "催促の送信に失敗しました");
      }
      setDoneMessage(
        "相手に催促通知を送りました。24 時間以内に応答がない場合は、もう一度このウィザードから運営裁定を申請できます。"
      );
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDispute() {
    if (!category) return;
    if (reason.trim().length === 0) {
      setError("運営に申請する場合は詳細の記入が必須です");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(`/api/orders/${orderId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          reason: reason.trim() || undefined,
        }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) {
        throw new Error(j.error ?? "運営申請に失敗しました");
      }
      setDoneMessage(
        "運営に受け付けられました。数営業日以内に確認 / 対応いたします。進捗はこの取引画面のバッジで確認できます。"
      );
      setStep("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="運営に相談する"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ヘッダ */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <MessageCircleQuestion
              size={16}
              strokeWidth={2}
              className="text-indigo-700"
              aria-hidden
            />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">
              運営に相談する
            </h2>
            <p className="text-[11px] text-gray-500">
              トラブルの内容から正しい手順にご案内します
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="閉じる"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* ---- STEP: select ---- */}
          {step === "select" && (
            <>
              {activeDisputeId ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                  この案件については既に運営裁定を申請中です。対応状況は取引画面のバッジをご確認ください。
                </div>
              ) : (
                <p className="text-xs text-gray-600">
                  該当するトラブルを選択してください:
                </p>
              )}
              <ul className="mt-3 space-y-2">
                {CATEGORIES.map((c) => (
                  <li key={c.key}>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeDisputeId) return;
                        setCategory(c.key);
                        setStep("confirm");
                      }}
                      disabled={!!activeDisputeId}
                      className="flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <c.icon
                        size={18}
                        strokeWidth={1.8}
                        className="mt-0.5 shrink-0 text-indigo-600"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-900">
                          {c.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-gray-500">
                          {c.desc}
                        </span>
                      </span>
                      <ArrowRight
                        size={14}
                        strokeWidth={2}
                        className="mt-1.5 shrink-0 text-gray-400"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ---- STEP: confirm ---- */}
          {step === "confirm" && catMeta && (
            <>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
                <b>選択したトラブル:</b> {catMeta.label}
              </div>
              {catMeta.quickActionHint && (
                <p className="mt-3 text-xs leading-relaxed text-gray-600">
                  {catMeta.quickActionHint}
                </p>
              )}

              {/* Quick Action (催促) がある場合はそちらを prominent に */}
              {catMeta.quickAction === "remind" && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-bold text-emerald-900">
                    まず、相手に催促通知を送りませんか？
                  </p>
                  <button
                    type="button"
                    onClick={runQuickAction}
                    disabled={submitting}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submitting
                      ? "送信中..."
                      : (catMeta.quickActionLabel ?? "催促通知を送る")}
                  </button>
                  <p className="mt-1.5 text-[10px] text-emerald-800">
                    ※ 24 時間に 1 回まで
                  </p>
                </div>
              )}

              <div className="mt-4">
                <label
                  htmlFor="trouble-reason"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  詳細{" "}
                  <span className="font-bold text-red-600">
                    (運営裁定を申請する場合は必須)
                  </span>
                </label>
                <textarea
                  id="trouble-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 2000))}
                  rows={4}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink disabled:bg-gray-50"
                  placeholder="例) 3 回目の修正で、契約時の範囲外である新規カット追加を求められています"
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  {reason.length} / 2000 文字
                </p>
              </div>

              {error && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* 00073 STEP1 ガード可視化:
                  no_response / payment_delay カテゴリは 催促未実施のとき
                  裁定ボタンを非活性化し「まず催促してください」を促す */}
              {(catMeta.quickAction === "remind" && !hasSentReminder) && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  ⚠️ このカテゴリでは まず STEP1 (催促) を実行してください。
                  催促の記録がないと 運営裁定は受付できません。
                </div>
              )}

              <div className="mt-5 flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep("select")}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 rounded-pill border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ArrowLeft size={12} strokeWidth={2} aria-hidden />
                  戻る
                </button>
                <button
                  type="button"
                  onClick={submitDispute}
                  disabled={
                    submitting ||
                    reason.trim().length === 0 ||
                    (catMeta.quickAction === "remind" && !hasSentReminder)
                  }
                  className="inline-flex items-center gap-1 rounded-pill bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {submitting ? "申請中..." : "運営に裁定を申請する"}
                </button>
              </div>
            </>
          )}

          {/* ---- STEP: done ---- */}
          {step === "done" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2
                  size={20}
                  strokeWidth={2}
                  className="text-emerald-700"
                  aria-hidden
                />
              </div>
              <p className="mt-3 text-sm font-bold text-emerald-900">
                受け付けました
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                {doneMessage}
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-4 inline-flex items-center gap-1 rounded-pill bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                閉じる
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
