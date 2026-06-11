import Link from "next/link";

type Props = {
  role: "creator" | "client";
  /** 今月分の集計値 (円) */
  thisMonth: number;
  /** 未出金残高 (creator) または 進行中の支払予定額 (client) */
  pending: number;
  /** 生涯累計 (creator) または 累計発注額 (client) */
  lifetime: number;
};

const fmt = (n: number) => `¥${n.toLocaleString()}`;

/**
 * ダッシュボード ② 売上・収益状況 セクション。
 *
 * - creator: 今月の確定売上 / 未出金残高 / 累計売上
 * - client : 今月の発注額 / 進行中の支払予定 / 累計発注額
 *
 * 金額が大きいので 1 行 3 メトリクスの大型カード。
 * クリックで取引一覧へ遷移できる。
 */
export function DashboardRevenueCard({
  role,
  thisMonth,
  pending,
  lifetime,
}: Props) {
  const isCreator = role === "creator";
  const labels = isCreator
    ? {
        title: "売上・収益状況",
        thisMonthLabel: "今月の確定売上",
        thisMonthHint: "Escrow 検収完了済 (報酬として受領した分)",
        pendingLabel: "未出金残高",
        pendingHint: "受領済だが Stripe Connect へ未振込の分",
        lifetimeLabel: "累計売上",
        lifetimeHint: "プラットフォーム手数料控除後の純額",
      }
    : {
        title: "発注・支払い状況",
        thisMonthLabel: "今月の発注額",
        thisMonthHint: "今月作成した取引の合計 (税込)",
        pendingLabel: "進行中の支払予定",
        pendingHint: "発注済で未完了の取引額",
        lifetimeLabel: "累計発注額",
        lifetimeHint: "これまでに発注したすべての取引額",
      };

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-neon-pink/15 to-neon-purple/15 text-neon-pink"
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
              d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4"
            />
          </svg>
        </span>
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
          {labels.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* 今月分 — 主役 */}
        <div className="rounded-xl border border-neon-pink/30 bg-gradient-to-br from-neon-pink/[0.06] to-neon-purple/[0.04] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {labels.thisMonthLabel}
          </p>
          <p className="mt-2 text-2xl font-black leading-none text-neon-purple-deep sm:text-3xl">
            {fmt(thisMonth)}
          </p>
          <p className="mt-2 text-[11px] text-gray-500">
            {labels.thisMonthHint}
          </p>
        </div>

        {/* 未出金 / 支払予定 */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {labels.pendingLabel}
          </p>
          <p className="mt-2 text-xl font-black leading-none text-gray-900 sm:text-2xl">
            {fmt(pending)}
          </p>
          <p className="mt-2 text-[11px] text-gray-500">{labels.pendingHint}</p>
        </div>

        {/* 累計 */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {labels.lifetimeLabel}
          </p>
          <p className="mt-2 text-xl font-black leading-none text-gray-900 sm:text-2xl">
            {fmt(lifetime)}
          </p>
          <p className="mt-2 text-[11px] text-gray-500">
            {labels.lifetimeHint}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          ※ 売上 = プラットフォーム手数料 ({isCreator ? "差引後" : "込み"}) ・税抜
        </p>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-neon-purple-deep transition-colors hover:text-neon-pink"
        >
          取引一覧で確認
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
