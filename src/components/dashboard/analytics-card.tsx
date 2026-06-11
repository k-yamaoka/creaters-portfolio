import Link from "next/link";

type Metric = {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  href?: string;
};

type Props = {
  metrics: Metric[];
  // 編集導線 (該当する場合のみ)
  promptText?: string;
  promptHref?: string;
  promptCta?: string;
};

const fmt = (n: number) => n.toLocaleString();

/**
 * ダッシュボード ④ アナリティクス簡易表示。
 * - 4 つの数値メトリクスを並列カードで表示
 * - 各カードは hint テキストで意味付け
 * - 全部 0 のときは「まだデータがありません」のヒント
 */
export function DashboardAnalyticsCard({
  metrics,
  promptText,
  promptHref,
  promptCta,
}: Props) {
  const allZero = metrics.every((m) => m.value === 0);
  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-neon-cyan/15 to-neon-purple/15 text-neon-cyan"
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
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
            アナリティクス
          </h2>
        </div>
      </div>

      {allZero ? (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          まだ集計できるデータがありません。プロフィール公開後、徐々に数値が反映されます。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {metrics.map((m) => {
            const inner = (
              <>
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-neon-cyan/15 group-hover:text-neon-cyan"
                >
                  {m.icon}
                </span>
                <div className="mt-2.5">
                  <p className="text-2xl font-black leading-none text-gray-900">
                    {fmt(m.value)}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {m.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-gray-400">
                    {m.hint}
                  </p>
                </div>
              </>
            );
            return m.href ? (
              <Link
                key={m.label}
                href={m.href}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-neon-cyan/50 hover:shadow-card"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={m.label}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-3"
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {promptText && promptHref && promptCta && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-neon-cyan/[0.06] px-3 py-2 text-xs">
          <span className="text-gray-700">{promptText}</span>
          <Link
            href={promptHref}
            className="font-bold text-neon-cyan transition-colors hover:text-neon-pink"
          >
            {promptCta} →
          </Link>
        </div>
      )}
    </section>
  );
}
