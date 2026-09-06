/**
 * JOB-022 対応: グローバル 404 ハンドラ。
 * 無効な URL や期限切れリソース (存在しない案件 / 削除済 creator 等) で
 * 崩れ画面や真っ白にならず、ユーザーが次の行動を選べる状態を用意する。
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs text-gray-400">404</p>
      <h1 className="text-2xl font-bold text-gray-900">
        お探しのページは見つかりません
      </h1>
      <p className="text-sm text-gray-600">
        URL に誤りがあるか、対象のコンテンツが削除・非公開になっている
        可能性があります。
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link
          href="/creators"
          className="rounded-pill bg-aimovie-navy-900 px-5 py-2 text-sm font-bold text-white hover:bg-aimovie-navy-700"
        >
          クリエイターを見る
        </Link>
        <Link
          href="/jobs"
          className="rounded-pill border border-gray-300 bg-white px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          案件を見る
        </Link>
        <Link
          href="/"
          className="rounded-pill border border-gray-300 bg-white px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
