"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  hideApplication,
  hideOrder,
} from "@/app/(main)/dashboard/list-archive-actions";
import { TrashIcon } from "@/components/ui/trash-icon";

type Props = {
  kind: "application" | "order";
  id: string;
  /** ボタンのツールチップやモーダル本文に出すアイテム名 (例: 案件タイトル) */
  itemTitle: string;
};

/**
 * 応募済み案件 / 取引一覧 のカードに乗せる「自分の一覧から消す」ボタン。
 *
 * - クリックすると確認モーダルを表示
 * - 「削除する」を押すと server action 経由で archived_*_at にタイムスタンプを入れる
 * - 完全削除ではなく self-archive。相手側からは見える旨を明記
 *
 * 親 <Link> 内に配置する想定なので、click イベントは stopPropagation する。
 */
export function ListHideButton({ kind, id, itemTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setOpen(true);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (pending) return;
    setOpen(false);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      const res =
        kind === "application"
          ? await hideApplication(id)
          : await hideOrder(id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  const label = kind === "application" ? "応募" : "取引";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`「${itemTitle}」を一覧から削除`}
        title="この一覧から削除"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          // 親 Link 上に重ねる確認モーダル。背景クリックでキャンセル。
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleCancel}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-card"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-gray-900">
                  この{label}を自分の一覧から削除します
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  「<span className="font-bold">{itemTitle}</span>」を
                  この一覧から非表示にします。
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-gray-500">
                  <li>相手側の一覧では引き続き表示されます</li>
                  <li>復元する機能は現状ありません</li>
                  <li>関連メッセージ履歴はメッセージ画面から閲覧できます</li>
                </ul>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={pending}
                className="rounded-pill border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="rounded-pill bg-red-500 px-5 py-2 text-sm font-bold text-white shadow-card transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {pending ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
