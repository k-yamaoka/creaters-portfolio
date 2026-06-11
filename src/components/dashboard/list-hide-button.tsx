"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  hideApplication,
  hideOrder,
} from "@/app/(main)/dashboard/list-archive-actions";
import { TrashIcon } from "@/components/ui/trash-icon";
import { ArchiveIcon } from "@/components/ui/archive-icon";

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
  // 取引 (order) は「データを消す」ではなく「自分のリストからアーカイブ」運用なので、
  // 箱アイコン + 「アーカイブ」文言に切替える。
  const isArchive = kind === "order";
  const verb = isArchive ? "アーカイブ" : "削除";
  const Icon = isArchive ? ArchiveIcon : TrashIcon;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`「${itemTitle}」を一覧から${verb}`}
        title={isArchive ? "この一覧からアーカイブ" : "この一覧から削除"}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-colors ${
          isArchive
            ? "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
            : "hover:border-red-300 hover:bg-red-50 hover:text-red-500"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
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
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isArchive ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-gray-900">
                  この{label}を一覧から{verb}します
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  「<span className="font-bold">{itemTitle}</span>」を
                  自分の一覧から非表示にします。
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-gray-500">
                  {isArchive ? (
                    <>
                      <li>
                        取引データは削除されません (請求/契約上の必要のため保持)
                      </li>
                      <li>相手側の一覧では引き続き表示されます</li>
                      <li>関連メッセージ履歴はメッセージ画面から閲覧できます</li>
                    </>
                  ) : (
                    <>
                      <li>相手側の一覧では引き続き表示されます</li>
                      <li>復元する機能は現状ありません</li>
                      <li>関連メッセージ履歴はメッセージ画面から閲覧できます</li>
                    </>
                  )}
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
                className={`rounded-pill px-5 py-2 text-sm font-bold text-white shadow-card transition-colors disabled:opacity-50 ${
                  isArchive
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {pending ? `${verb}中...` : `${verb}する`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
