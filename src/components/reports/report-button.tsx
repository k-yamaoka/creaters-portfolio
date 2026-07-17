"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { ReportDialog } from "./report-dialog";

/**
 * 通報ボタン (00072)。作品カード / 詳細ページ に配置する。
 *
 * variant:
 *   - "icon"  : アイコンのみ (16px)。オーバーレイ配置用
 *   - "text"  : アイコン + テキスト。詳細ページ フッタ用
 *
 * ログイン必須。未ログインの場合はクリックで /login へ遷移させる (window.location.href)。
 */

type Props = {
  targetType: "portfolio_item";
  targetId: string;
  targetTitle?: string | null;
  isAuthed: boolean;
  variant?: "icon" | "text";
  className?: string;
};

export function ReportButton({
  targetType,
  targetId,
  targetTitle,
  isAuthed,
  variant = "text",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      window.location.href = "/login?next=" + encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : "/"
      );
      return;
    }
    setOpen(true);
  }

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          aria-label="この作品を通報"
          title="通報"
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-gray-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-600 ${className}`}
        >
          <Flag size={12} strokeWidth={2} aria-hidden />
        </button>
        <ReportDialog
          targetType={targetType}
          targetId={targetId}
          targetTitle={targetTitle}
          open={open}
          onClose={() => setOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 ${className}`}
      >
        <Flag size={12} strokeWidth={1.8} aria-hidden />
        この作品を通報
      </button>
      <ReportDialog
        targetType={targetType}
        targetId={targetId}
        targetTitle={targetTitle}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
