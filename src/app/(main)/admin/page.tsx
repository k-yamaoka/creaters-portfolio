import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Range = "today" | "7d" | "30d" | "90d" | "all";

const RANGE_LABEL: Record<Range, string> = {
  today: "今日",
  "7d": "直近 7 日",
  "30d": "直近 30 日",
  "90d": "直近 90 日",
  all: "全期間",
};

function rangeStartIso(r: Range): string | null {
  if (r === "all") return null;
  const daysAgo = r === "today" ? 0 : r === "7d" ? 7 : r === "30d" ? 30 : 90;
  const now = new Date();
  const d = new Date(now.getTime() - daysAgo * 86_400_000);
  if (r === "today") {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

type SearchParams = Promise<{ range?: string }>;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const sp = await searchParams;
  const range: Range =
    sp.range === "today" ||
    sp.range === "7d" ||
    sp.range === "30d" ||
    sp.range === "90d"
      ? sp.range
      : "all";
  const startIso = rangeStartIso(range);

  // ─── ユーザー統計 (全期間 or 期間内新規) ───
  const usersBase = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const { count: totalUsers } = await (startIso
    ? usersBase.gte("created_at", startIso)
    : usersBase);
  const { count: creatorCount } = await (startIso
    ? supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "creator")
        .gte("created_at", startIso)
    : supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "creator"));
  const { count: clientCount } = await (startIso
    ? supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client")
        .gte("created_at", startIso)
    : supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client"));

  // ─── 取引統計 (期間内 完了 or 全) ───
  let ordersQ = supabase
    .from("orders")
    .select("total_amount, platform_fee, status, escrow_status, created_at");
  if (startIso) ordersQ = ordersQ.gte("created_at", startIso);
  const { data: orders } = await ordersQ;

  const totalOrders = orders?.length ?? 0;
  const completedOrders =
    orders?.filter(
      (o) => o.status === "delivered" && o.escrow_status === "released"
    ) ?? [];
  const activeOrders =
    orders?.filter(
      (o) =>
        o.status !== "cancelled" &&
        !(o.status === "delivered" && o.escrow_status === "released")
    ) ?? [];

  const gmv = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalFees = completedOrders.reduce((sum, o) => sum + o.platform_fee, 0);
  const activeGmv = activeOrders.reduce((sum, o) => sum + o.total_amount, 0);

  // ─── 日次売上トレンド (直近 30 日、range と独立) ───
  const trendStart = new Date(Date.now() - 30 * 86_400_000);
  trendStart.setHours(0, 0, 0, 0);
  const { data: trendOrders } = await supabase
    .from("orders")
    .select("total_amount, created_at, status, escrow_status")
    .gte("created_at", trendStart.toISOString());

  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, 0);
  }
  for (const o of trendOrders ?? []) {
    if (o.status !== "delivered" || o.escrow_status !== "released") continue;
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + o.total_amount);
  }
  const trendData = Array.from(dayMap.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));
  const maxTrend = Math.max(1, ...trendData.map((d) => d.amount));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#222]">全体サマリー</h2>
        {/* 期間フィルタ */}
        <div className="flex flex-wrap gap-1 rounded-full bg-gray-100 p-1 text-xs">
          {(["today", "7d", "30d", "90d", "all"] as const).map((r) => (
            <Link
              key={r}
              href={r === "all" ? "/admin" : `/admin?range=${r}`}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                r === range
                  ? "bg-white font-bold text-aimovie-navy-900 shadow"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {RANGE_LABEL[r]}
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        表示期間: {RANGE_LABEL[range]}
        {startIso ? ` (${startIso.slice(0, 10)} 〜)` : ""}
      </p>

      {/* User stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={range === "all" ? "総会員数" : "期間内 新規登録"}
          value={`${totalUsers ?? 0}人`}
        />
        <StatCard
          label={range === "all" ? "クリエイター" : "期間内 新規 creator"}
          value={`${creatorCount ?? 0}人`}
        />
        <StatCard
          label={range === "all" ? "クライアント" : "期間内 新規 client"}
          value={`${clientCount ?? 0}人`}
        />
      </div>

      {/* Revenue stats */}
      <h3 className="mt-10 text-lg font-bold text-[#222]">売上・取引</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="流通総額 (GMV)"
          value={formatPrice(gmv)}
          hint="完了済み取引"
        />
        <StatCard
          label="手数料収入"
          value={formatPrice(totalFees)}
          hint="15% × 完了取引"
          accent
        />
        <StatCard
          label="進行中の取引額"
          value={formatPrice(activeGmv)}
          hint={`${activeOrders.length}件`}
        />
        <StatCard
          label="総取引数"
          value={`${totalOrders}件`}
          hint={`完了 ${completedOrders.length}件`}
        />
      </div>

      {/* 30 日トレンド (inline SVG bar) */}
      <h3 className="mt-10 text-lg font-bold text-[#222]">
        日次売上トレンド (直近 30 日 / 完了取引)
      </h3>
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card">
        <TrendBar data={trendData} max={maxTrend} />
        <p className="mt-3 text-xs text-gray-400">
          最大値: {formatPrice(maxTrend)}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <p className="text-sm text-[#828282]">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${accent ? "text-aimovie-navy-900" : "text-[#222]"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[#BDBDBD]">{hint}</p>}
    </div>
  );
}

function TrendBar({
  data,
  max,
}: {
  data: { date: string; amount: number }[];
  max: number;
}) {
  const w = 900;
  const h = 160;
  const padding = 20;
  const barWidth = (w - padding * 2) / data.length - 2;
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="min-w-[600px]"
        preserveAspectRatio="xMinYMin meet"
      >
        {/* baseline */}
        <line
          x1={padding}
          y1={h - padding}
          x2={w - padding}
          y2={h - padding}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const barH = ((h - padding * 2) * d.amount) / max;
          const x = padding + i * ((w - padding * 2) / data.length);
          const y = h - padding - barH;
          const isLast = i === data.length - 1;
          const isFirst = i === 0;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 0.5)}
                fill={d.amount > 0 ? "#8b5cf6" : "#e5e7eb"}
                rx={1}
              />
              {(isFirst || isLast || i % 5 === 0) && (
                <text
                  x={x + barWidth / 2}
                  y={h - 4}
                  fontSize={9}
                  fill="#9ca3af"
                  textAnchor="middle"
                >
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
