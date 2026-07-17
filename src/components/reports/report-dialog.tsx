"use client";

import { useState } from "react";
import { Flag, X, CheckCircle2 } from "lucide-react";

/**
 * コンテンツ通報ダイアログ (00072)。
 *
 * カテゴリ選択 + 詳細入力 → POST /api/reports。
 * 3 件以上 (unique IP) の open 通報が集まると DB trigger で自動非公開。
 *
 * ログイン必須。未ログインの場合は "ログインが必要です" とだけ表示する
 * 呼び出し側で /login 誘導する設計 (ここではエラー表示のみ)。
 */

const CATEGORIES: Array<{
  key: string;
  label: string;
  hint: string;
}> = [
  {
    key: "copyright",
    label: "著作権侵害",
    hint: "他者の著作物を無断利用している疑いがある",
  },
  {
    key: "impersonation",
    label: "なりすまし / 他人の作品",
    hint: "本人が生成・制作した作品ではない疑いがある",
  },
  {
    key: "unauthorized_person",
    label: "実在人物の無断生成",
    hint: "本人の同意なく実在の人物 (著名人 / 一般人) を生成している",
  },
  {
    key: "inappropriate",
    label: "公序良俗違反",
    hint: "性的 / 暴力 / 差別 / 児童虐待的な表現",
  },
  {
    key: "spam",
    label: "スパム / 迷惑投稿",
    hint: "取引と無関係な宣伝 / 反復投稿",
  },
  {
    key: "other",
    label: "その他",
    hint: "上記に当てはまらない問題",
  },
];

type Props = {
  targetType: "portfolio_item";
  targetId: string;
  targetTitle?: string | null;
  open: boolean;
  onClose: () => void;
};

export function ReportDialog({
  targetType,
  targetId,
  targetTitle,
  open,
  onClose,
}: Props) {
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (!category) return;
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason_category: category,
          reason_note: note.trim() || undefined,
        }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!r.ok || !j.ok) {
        throw new Error(j.error ?? "通報の送信に失敗しました");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setCategory(null);
    setNote("");
    setError(null);
    setDone(false);
    setSubmitting(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="コンテンツ通報"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ヘッダ */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Flag
              size={16}
              strokeWidth={2}
              className="text-red-600"
              aria-hidden
            />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">
              この作品を通報する
            </h2>
            {targetTitle && (
              <p className="truncate text-[11px] text-gray-500">
                対象: {targetTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="閉じる"
            disabled={submitting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="px-5 py-5">
          {done ? (
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
                通報を受け付けました
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                運営が内容を確認します。悪意のある通報の連発は逆にアカウント停止の対象になりますのでご注意ください。
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-4 inline-flex items-center rounded-pill bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                閉じる
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-600">
                通報カテゴリを選択してください:
              </p>
              <ul className="mt-3 space-y-2">
                {CATEGORIES.map((c) => (
                  <li key={c.key}>
                    <label
                      className={`flex cursor-pointer items-start gap-2 rounded-lg border-2 px-3 py-2 transition-colors ${
                        category === c.key
                          ? "border-red-400 bg-red-50/60"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-category"
                        value={c.key}
                        checked={category === c.key}
                        onChange={() => setCategory(c.key)}
                        disabled={submitting}
                        className="mt-1 h-3.5 w-3.5 accent-red-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-900">
                          {c.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
                          {c.hint}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <label
                  htmlFor="report-note"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  詳細 (任意 2000 字)
                </label>
                <textarea
                  id="report-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 2000))}
                  rows={3}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-gray-50"
                  placeholder="例) 他社サイトで公開されている同一画像です: https://..."
                />
              </div>

              {error && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={submitting}
                  className="rounded-pill border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!category || submitting}
                  className="rounded-pill bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {submitting ? "送信中..." : "通報を送信"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
