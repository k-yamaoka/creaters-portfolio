"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageThread } from "@/app/(main)/dashboard/messages/[partnerId]/message-thread";

type Role = "creator" | "client" | "admin" | undefined;

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
};

/**
 * 「この企業/クリエイターにメッセージを送る」ボタンとモーダル。
 * 案件詳細・クリエイター詳細などのページ内コンテンツと被らないように
 * 高い z-index の中央モーダルで表示し、内側に MessageThread を埋め込む。
 */
export function MessageDialog({
  partnerUserId,
  partnerName,
  currentUserId,
  senderRole,
  initialMessages,
  triggerLabel = "メッセージを送る",
  triggerClassName = "btn-primary w-full text-sm",
}: {
  partnerUserId: string;
  partnerName: string;
  currentUserId: string;
  senderRole: Role;
  initialMessages: Message[];
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  // Esc キーで閉じる + 開いている間 body スクロール禁止
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${partnerName} とのメッセージ`}
        >
          {/* バックドロップ */}
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          {/* 本体 */}
          <div className="relative z-10 flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-pop">
            {/* ヘッダ */}
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-paper-deep px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-primary-100 text-sm font-bold text-primary-600">
                  {partnerName[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-ink">
                    {partnerName} とのメッセージ
                  </p>
                  <p className="text-[10px] text-ink-soft">
                    Esc で閉じる ・ メッセージ画面と同期されています
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/dashboard/messages/${partnerUserId}`}
                  className="rounded-pill px-3 py-1 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-50"
                >
                  別画面で開く →
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="閉じる"
                  className="flex h-8 w-8 items-center justify-center rounded-pill text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                >
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
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* スレッド本体 */}
            <div className="flex-1 overflow-hidden px-5 pb-4 pt-2">
              <MessageThread
                initialMessages={initialMessages}
                currentUserId={currentUserId}
                partnerId={partnerUserId}
                senderRole={senderRole}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
