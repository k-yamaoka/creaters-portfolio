"use client";

import { useState } from "react";
import { MIcon } from "@/components/ui/m-icon";

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
          <div className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-xl border border-white/15 bg-ink-deep/95 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                void copyUrl();
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
            >
              <MIcon name={copied ? "check" : "link"} size={18} />
              {copied ? "コピーしました" : "URL をコピー"}
            </button>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              {/* 旧コードでは Unicode "𝕏" が環境によって "X" 風に潰れ "XX でシェア" と
                  二重表示になっていた。公式 X ロゴ SVG に置換して 1 文字で表現する。 */}
              <svg
                aria-hidden
                viewBox="0 0 1200 1227"
                className="h-3.5 w-3.5 fill-current"
              >
                <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z" />
              </svg>
              X でシェア
            </a>
          </div>
        </>
      )}
    </div>
  );
}
