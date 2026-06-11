import Link from "next/link";

export type CompletenessItem = {
  label: string;
  /** 入力済かどうか */
  done: boolean;
  /** 編集導線 (未入力時に表示) */
  editHref?: string;
};

type Props = {
  items: CompletenessItem[];
};

/**
 * ダッシュボード ⑤ プロフィール充実度メーター。
 * - 必須/任意のチェック項目を 1pt ずつ加算、% で進捗バー表示
 * - 100% なら緑バッジ「完成」、それ以外は未入力リストを表示
 * - 各未入力項目に「設定する →」リンク
 */
export function DashboardCompletenessMeter({ items }: Props) {
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const isComplete = pct === 100;
  // バーの色: 70% 以上で緑寄り、40% 以下でグレー寄り、その間は pink/purple
  const barColor = isComplete
    ? "bg-green-500"
    : pct >= 70
      ? "bg-gradient-to-r from-neon-pink to-green-500"
      : pct >= 40
        ? "bg-gradient-to-r from-neon-pink to-neon-purple"
        : "bg-gradient-to-r from-neon-pink/70 to-neon-pink";

  const unfilled = items.filter((i) => !i.done);

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-neon-pink/15 to-neon-purple/15 text-neon-pink"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
              />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
            プロフィール充実度
          </h2>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-xs font-bold ${
            isComplete
              ? "bg-green-100 text-green-700"
              : pct >= 70
                ? "bg-neon-pink/15 text-neon-pink"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {pct}%
        </span>
      </div>

      {/* プログレスバー */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full transition-[width] duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {done} / {total} 項目入力済
      </p>

      {isComplete ? (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <span aria-hidden className="mr-1.5">✓</span>
          プロフィールが完成しています。検索結果での表示優先度が最大です。
        </div>
      ) : (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-bold text-gray-700">未入力の項目</p>
          {unfilled.map((it) => (
            <div
              key={it.label}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-xs text-gray-700">
                <span
                  aria-hidden
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white"
                >
                  <span className="text-[10px] text-gray-300">−</span>
                </span>
                {it.label}
              </span>
              {it.editHref && (
                <Link
                  href={it.editHref}
                  className="text-xs font-bold text-neon-purple-deep transition-colors hover:text-neon-pink"
                >
                  設定する →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
