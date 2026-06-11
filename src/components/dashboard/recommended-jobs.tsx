import Link from "next/link";

type Job = {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  genres: string[];
  matchScore: number;
};

type Props = {
  jobs: Job[];
};

const fmt = (n: number | null) => (n == null ? "—" : `¥${n.toLocaleString()}`);

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * ダッシュボード ③ おすすめ募集案件カードリスト。
 *
 * - 親 (server component) で recommendedScore に基づきソート済の上位 4 件を受け取る
 * - スキルマッチ無 (matchScore = 0) のときも候補ゼロ防止のため新着順に出す
 * - 0 件なら空状態 (CTA: 「案件を探す」)
 */
export function RecommendedJobsSection({ jobs }: Props) {
  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-neon-pink/15 to-neon-cyan/15 text-neon-pink"
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
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
              />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
            おすすめの募集案件
          </h2>
        </div>
        <Link
          href="/jobs"
          className="text-xs font-bold text-neon-purple-deep transition-colors hover:text-neon-pink"
        >
          すべての案件 →
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl bg-gray-50 px-4 py-8 text-center">
          <p className="text-sm text-gray-500">
            現在おすすめできる募集案件がありません
          </p>
          <Link
            href="/jobs"
            className="mt-3 inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-1.5 text-xs font-bold text-white shadow-card transition-shadow hover:shadow-card-hover"
          >
            案件を探す
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {jobs.map((job) => {
            const remain = daysUntil(job.deadline);
            const urgent = remain != null && remain >= 0 && remain <= 3;
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-neon-pink/50 hover:shadow-card-hover"
              >
                {job.matchScore > 0 && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-neon-pink/10 px-2 py-0.5 text-[10px] font-bold text-neon-pink">
                    <span aria-hidden>★</span>
                    マッチ
                  </span>
                )}
                <h3 className="line-clamp-2 pr-14 text-sm font-bold text-gray-900 group-hover:text-neon-pink">
                  {job.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-gray-500">
                  {job.description}
                </p>

                {/* ジャンル チップ — 上位 3 件 */}
                {job.genres.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {job.genres.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="rounded-pill bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* 予算 + 締切 */}
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-[11px]">
                  <span className="font-bold text-gray-700">
                    {fmt(job.budget_min)} 〜 {fmt(job.budget_max)}
                  </span>
                  {remain != null && (
                    <span
                      className={`font-bold ${
                        urgent ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      {remain >= 0 ? `あと ${remain} 日` : "期限切れ"}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
