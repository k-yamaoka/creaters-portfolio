"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  MessageCircleQuestion,
  MailWarning,
  RefreshCcw,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Send,
  FileEdit,
  Gavel,
} from "lucide-react";

/**
 * トラブル解決 ウィザード (Phase 3, 2026-07-21 全面改修)。
 *
 * 仕様の 3 STEP 動線を UI で強制する:
 *   STEP1  催促  — メッセージ機能への導線 + 「まずはメッセージで期限を区切って
 *                  催促してください (これが申告の証拠になります)」
 *   STEP2  検収 / 修正  — 「納品管理画面から修正仕様の相違点を指摘してください」
 *   STEP3  運営裁定  — STEP1/2 がクリア済みのときのみ活性化 (未達なら disabled)
 *
 * カテゴリごとに STEP2 の要否が変わる:
 *   no_response          STEP2 不要 (催促した後 → 運営裁定に直接進める)
 *   payment_delay        STEP2 不要 (検収期限が過ぎたら みなし検収 自動発火)
 *   unfair_revision      STEP2 必須 (修正依頼を送っている必要がある)
 *   quality_issue        STEP2 必須 (納品を受け取っている必要がある)
 *   termination_dispute  STEP2 不要
 *   other                STEP2 不要
 *
 * Props で order の状態を受け取る:
 *   hasSentReminder     first_reminder_sent_at OR sent 1+ message  → STEP1 ✓
 *   hasRequestedRevision revision_count_used > 0  → STEP2 部分 ✓
 *   hasDelivery         delivered_at != null      → STEP2 部分 ✓
 *   messageThreadHref   メッセージ相手 URL (STEP1 導線先)
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
  icon: typeof MessageCircleQuestion;
  /** STEP2 が意味を持つカテゴリか (false なら STEP1 のみで STEP3 に進める) */
  needsStep2: boolean;
  /** STEP1 で表示する具体的アドバイス */
  step1Advice: string;
  /** STEP2 で表示する具体的アドバイス (needsStep2=true のみ) */
  step2Advice?: string;
  /** STEP2 相当 の状態を持っているか判定するキー */
  step2Check?: "hasRequestedRevision" | "hasDelivery";
};

const CATEGORIES: CategoryMeta[] = [
  {
    key: "no_response",
    label: "連絡が来ない / 返信がない",
    desc: "相手からの返信・対応が長期間ない",
    icon: MailWarning,
    needsStep2: false,
    step1Advice:
      "まずはメッセージ機能で「◯月◯日までにご連絡ください」と期限を区切って催促してください。この記録が運営裁定の証拠になります。",
  },
  {
    key: "payment_delay",
    label: "検収されない / 支払いが遅い",
    desc: "納品後、クライアントの検収 (支払確定) が長期間行われない",
    icon: RefreshCcw,
    needsStep2: false,
    step1Advice:
      "クライアントにメッセージで検収を依頼してください。納品後 7 日 経過すると自動検収 (みなし承認) が発動し、報酬が確定します。",
  },
  {
    key: "unfair_revision",
    label: "不当な修正を求められた",
    desc: "合意した修正回数や範囲を超える対応を要求されている",
    icon: ShieldAlert,
    needsStep2: true,
    step2Check: "hasRequestedRevision",
    step1Advice:
      "まず相手に「合意した修正回数と範囲」を明示するメッセージを送ってください。",
    step2Advice:
      "納品管理画面 (取引詳細ページ) から修正仕様の相違点を指摘してください。契約時に合意した修正回数を超える対応は追加発注 (別料金) の対象です。",
  },
  {
    key: "quality_issue",
    label: "納品物の品質に重大な問題がある",
    desc: "AI 未修正 / 明らかな未完成 / 依頼と大きく異なる など",
    icon: ShieldAlert,
    needsStep2: true,
    step2Check: "hasDelivery",
    step1Advice:
      "まず相手にメッセージで具体的な問題点を指摘してください。",
    step2Advice:
      "納品を受け取ったうえで、納品管理画面から「修正を依頼」してください。それでも改善しない場合に運営裁定を申請できます。",
  },
  {
    key: "termination_dispute",
    label: "途中終了に関する意見の相違",
    desc: "相手が途中終了を主張しているが同意できない",
    icon: MessageCircleQuestion,
    needsStep2: false,
    step1Advice:
      "まず相手とメッセージで意見の相違点を整理してください。",
  },
  {
    key: "other",
    label: "その他 (上記以外のトラブル)",
    desc: "上記に当てはまらない相談・報告",
    icon: MessageCircleQuestion,
    needsStep2: false,
    step1Advice:
      "まず相手にメッセージで状況を共有してください。証跡が運営裁定の判断に使われます。",
  },
];

type Props = {
  orderId: string;
  open: boolean;
  onClose: () => void;
  /** 既に active な dispute があるとき ID を渡すと Step2 で「申請済み」を表示 */
  activeDisputeId?: string | null;
  /** STEP1 催促を発火済みか (first_reminder_sent_at OR message count > 0) */
  hasSentReminder?: boolean;
  /** STEP2: 修正依頼を出したことがあるか (revision_count_used > 0) */
  hasRequestedRevision?: boolean;
  /** STEP2: 納品を受け取っているか (delivered_at != null) */
  hasDelivery?: boolean;
  /** STEP1 導線: メッセージ画面 URL (相手 partnerId 込み) */
  messageThreadHref?: string;
};

type Step = "select" | "guide" | "done";

export function TroubleReportWizard({
  orderId,
  open,
  onClose,
  activeDisputeId,
  hasSentReminder = false,
  hasRequestedRevision = false,
  hasDelivery = false,
  messageThreadHref,
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

  // STEP 完了判定
  const step1Done = hasSentReminder;
  const step2Done = catMeta
    ? !catMeta.needsStep2 ||
      (catMeta.step2Check === "hasRequestedRevision" && hasRequestedRevision) ||
      (catMeta.step2Check === "hasDelivery" && hasDelivery)
    : false;
  // STEP3 (運営裁定) は STEP1 完了必須、STEP2 は カテゴリ次第
  const canOpenStep3 = step1Done && step2Done;

  function reset() {
    setStep("select");
    setCategory(null);
    setReason("");
    setError(null);
    setDoneMessage("");
    setSubmitting(false)
  }

  function close() {
    reset();
    onClose();
  }

  async function runRemind() {
    if (!catMeta) return;
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
        "相手に催促通知を送りました。24 時間以内に応答がない場合は、再度このウィザードから運営裁定を申請できます。"
      );
      setStep("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDispute() {
    if (!category) return;
    if (reason.trim().length === 0) {
      setError("運営裁定申請には理由の記入が必須です");
      return;
    }
    if (!canOpenStep3) {
      setError(
        "STEP1 / STEP2 の完了が確認できません。上のガイドに沿って先に対応してください。"
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(`/api/disputes/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          category,
          reason: reason.trim(),
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
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ヘッダ */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <MessageCircleQuestion
              size={18}
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
              まず状況を教えてください。正しい手順にご案内します。
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

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {/* ---- STEP: select ---- */}
          {step === "select" && (
            <>
              {activeDisputeId && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  この案件は既に運営裁定を申請中です。対応状況は取引画面のバッジをご確認ください。
                </div>
              )}
              <p className="text-sm font-bold text-gray-900">
                どのようなお困りごとですか？
              </p>
              <ul className="mt-3 space-y-2">
                {CATEGORIES.map((c) => (
                  <li key={c.key}>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeDisputeId) return;
                        setCategory(c.key);
                        setStep("guide");
                      }}
                      disabled={!!activeDisputeId}
                      className="flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <c.icon
                        size={20}
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

          {/* ---- STEP: guide (STEP1/2/3 progress + advice + dispute form) ---- */}
          {step === "guide" && catMeta && (
            <>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
                <b>選択したトラブル:</b> {catMeta.label}
              </div>

              {/* Progress: STEP1 → STEP2 → STEP3 */}
              <ol className="mt-4 space-y-3">
                {/* STEP 1 */}
                <StepBlock
                  n={1}
                  title="催促メッセージを送る"
                  done={step1Done}
                  icon={Send}
                >
                  <p className="text-xs leading-relaxed text-gray-700">
                    {catMeta.step1Advice}
                  </p>
                  {!step1Done && messageThreadHref && (
                    <Link
                      href={messageThreadHref}
                      onClick={close}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Send size={12} strokeWidth={2} aria-hidden />
                      メッセージを送る
                    </Link>
                  )}
                  {!step1Done && !messageThreadHref && (
                    <button
                      type="button"
                      onClick={runRemind}
                      disabled={submitting}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      催促通知を送る (代替)
                    </button>
                  )}
                </StepBlock>

                {/* STEP 2 (needsStep2 のみ) */}
                {catMeta.needsStep2 && (
                  <StepBlock
                    n={2}
                    title="検収・修正で相違点を指摘する"
                    done={step2Done}
                    icon={FileEdit}
                  >
                    <p className="text-xs leading-relaxed text-gray-700">
                      {catMeta.step2Advice}
                    </p>
                    {!step2Done && (
                      <Link
                        href={`/dashboard/orders/${orderId}`}
                        onClick={close}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-indigo-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-indigo-700"
                      >
                        <FileEdit size={12} strokeWidth={2} aria-hidden />
                        取引詳細画面へ
                      </Link>
                    )}
                  </StepBlock>
                )}

                {/* STEP 3 (dispute) */}
                <StepBlock
                  n={catMeta.needsStep2 ? 3 : 2}
                  title="運営裁定を申し立てる"
                  done={false}
                  icon={Gavel}
                  disabled={!canOpenStep3}
                >
                  {!canOpenStep3 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-900">
                      ⚠️ 上の STEP{catMeta.needsStep2 ? " 1 / 2" : " 1"} が
                      完了していません。先にそれらを終えてから運営裁定を申請してください。
                    </div>
                  )}
                  {canOpenStep3 && (
                    <>
                      <p className="text-xs leading-relaxed text-gray-700">
                        STEP{catMeta.needsStep2 ? " 1 / 2" : " 1"} が完了しました。
                        以下に状況を記入して運営裁定を申請できます。
                      </p>
                      <label
                        htmlFor="trouble-reason"
                        className="mt-3 block text-[11px] font-medium text-gray-700"
                      >
                        詳細{" "}
                        <span className="font-bold text-red-600">
                          (必須 2000 字以内)
                        </span>
                      </label>
                      <textarea
                        id="trouble-reason"
                        value={reason}
                        onChange={(e) =>
                          setReason(e.target.value.slice(0, 2000))
                        }
                        rows={4}
                        disabled={submitting}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
                        placeholder="例) 3 回目の修正で、契約時の範囲外である新規カット追加を求められています"
                      />
                      <p className="mt-1 text-[10px] text-gray-500">
                        {reason.length} / 2000 文字
                      </p>
                      <button
                        type="button"
                        onClick={submitDispute}
                        disabled={
                          submitting || reason.trim().length === 0
                        }
                        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-pill bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        <Gavel size={14} strokeWidth={2} aria-hidden />
                        {submitting ? "申請中..." : "運営に裁定を申請する"}
                      </button>
                    </>
                  )}
                </StepBlock>
              </ol>

              {error && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-5 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("select")}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 rounded-pill border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ArrowLeft size={12} strokeWidth={2} aria-hidden />
                  カテゴリ選択に戻る
                </button>
              </div>
            </>
          )}

          {/* ---- STEP: done ---- */}
          {step === "done" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2
                  size={24}
                  strokeWidth={2}
                  className="text-emerald-700"
                  aria-hidden
                />
              </div>
              <p className="mt-3 text-base font-bold text-emerald-900">
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

/**
 * STEP ブロック (ウィザード内の各 STEP)。
 *   done = true    → 緑チェック + 完了バッジ
 *   done = false   → グレー丸 + アクション ボタンなど
 *   disabled       → 全体的にグレーアウト
 */
function StepBlock({
  n,
  title,
  done,
  disabled = false,
  icon: Icon,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  disabled?: boolean;
  icon: typeof Circle;
  children: React.ReactNode;
}) {
  return (
    <li
      className={`rounded-xl border p-3.5 transition-colors ${
        done
          ? "border-emerald-300 bg-emerald-50/40"
          : disabled
            ? "border-gray-200 bg-gray-50/60 opacity-70"
            : "border-indigo-300 bg-white"
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
            done
              ? "bg-emerald-500 text-white"
              : disabled
                ? "bg-gray-300 text-gray-500"
                : "bg-indigo-600 text-white"
          }`}
        >
          {done ? (
            <CheckCircle2
              size={14}
              strokeWidth={2.4}
              aria-hidden
            />
          ) : (
            n
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon
              size={12}
              strokeWidth={1.8}
              className="text-gray-500"
              aria-hidden
            />
            <p
              className={`text-xs font-bold ${
                done
                  ? "text-emerald-900"
                  : disabled
                    ? "text-gray-500"
                    : "text-gray-900"
              }`}
            >
              STEP {n}: {title}
              {done && (
                <span className="ml-2 text-[10px] font-medium text-emerald-700">
                  ✓ 完了
                </span>
              )}
            </p>
          </div>
          <div className="mt-2 space-y-2">{children}</div>
        </div>
      </div>
    </li>
  );
}
