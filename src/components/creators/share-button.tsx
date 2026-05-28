"use client";

import { useState } from "react";

/**
 * 詳細ページのシェアボタン。
 * - クリックで URL をクリップボードコピー
 * - X(Twitter) シェアウィンドウも同時に開く選択肢を提供
 */
export function ShareButton({
  creatorName,
}: {
  creatorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const tweetUrl =
    typeof window !== "undefined"
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `${creatorName} | AILIER (AIクリエイター特化マッチング)`
        )}&url=${encodeURIComponent(window.location.href)}`
      : "#";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 backdrop-blur-sm transition-all hover:border-neon-pink/60 hover:bg-white/10 hover:text-neon-pink"
        aria-label="シェア"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
          />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="閉じる"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-xl border border-white/15 bg-neon-midnight-deep/95 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                void copyUrl();
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
            >
              <span className="text-base">{copied ? "✓" : "🔗"}</span>
              {copied ? "コピーしました" : "URL をコピー"}
            </button>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <span className="text-base">𝕏</span>
              X でシェア
            </a>
          </div>
        </>
      )}
    </div>
  );
}
