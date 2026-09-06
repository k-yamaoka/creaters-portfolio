"use client";

/**
 * JOB-018/021/022 対応: グローバル エラー境界。
 * 500 系エラーで真っ白 / 崩れ画面にならないよう、
 * ユーザー向けの再試行導線を提示する。
 */
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vercel の Sentry / OTel 側に自動送信されるので、ここでは console 記録のみ
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">
        エラーが発生しました
      </h1>
      <p className="text-sm text-gray-600">
        処理中に問題が起きました。少し時間をおいて再度お試しください。
        {error.digest && (
          <>
            <br />
            <span className="mt-2 inline-block font-mono text-[11px] text-gray-400">
              Error ID: {error.digest}
            </span>
          </>
        )}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-pill bg-aimovie-navy-900 px-5 py-2 text-sm font-bold text-white hover:bg-aimovie-navy-700"
        >
          再試行
        </button>
        <Link
          href="/"
          className="rounded-pill border border-gray-300 bg-white px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          トップへ戻る
        </Link>
      </div>
      <p className="mt-4 text-xs text-gray-400">
        問題が繰り返される場合は、support@aimovie-works.com までご連絡ください。
      </p>
    </div>
  );
}
