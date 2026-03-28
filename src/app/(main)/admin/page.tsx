import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // User counts
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: creatorCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "creator");

  const { count: clientCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "client");

  // Order stats
  const { data: orders } = await supabase
    .from("orders")
    .select("total_amount, platform_fee, status");

  const totalOrders = orders?.length ?? 0;
  const completedOrders = orders?.filter((o) => o.status === "completed") ?? [];
  const activeOrders =
    orders?.filter(
      (o) => !["completed", "cancelled"].includes(o.status)
    ) ?? [];

  const gmv = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalFees = completedOrders.reduce((sum, o) => sum + o.platform_fee, 0);
  const activeGmv = activeOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#222]">全体サマリー</h2>

      {/* User stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="text-sm text-[#828282]">総会員数</p>
          <p className="mt-1 text-3xl font-bold text-[#222]">
            {totalUsers ?? 0}
            <span className="ml-1 text-sm font-normal text-[#BDBDBD]">人</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="text-sm text-[#828282]">クリエイター</p>
          <p className="mt-1 text-3xl font-bold text-[#222]">
            {creatorCount ?? 0}
            <span className="ml-1 text-sm font-normal text-[#BDBDBD]">人</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="text-sm text-[#828282]">クライアント</p>
          <p className="mt-1 text-3xl font-bold text-[#222]">
            {clientCount ?? 0}
            <span className="ml-1 text-sm font-normal text-[#BDBDBD]">人</span>
          </p>
        </div>
      </div>

      {/* Revenue stats */}
      <h3 className="mt-10 text-lg font-bold text-[#222]">売上・取引</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="text-sm text-[#828282]">流通総額（GMV）</p>
          <p className="mt-1 text-2xl font-bold text-[#222]">
            {formatPrice(gmv)}
          </p>
          <p className="mt-1 text-xs text-[#BDBDBD]">完了済み取引</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="text-sm text-[#828282]">手数料収入</p>
          <p className="mt-1 text-2xl font-bold text-primary-500">
            {formatPrice(totalFees)}
          </p>
          <p className="mt-1 text-xs text-[#BDBDBD]">15% × 完了取引</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="text-sm text-[#828282]">進行中の取引額</p>
          <p className="mt-1 text-2xl font-bold text-[#222]">
            {formatPrice(activeGmv)}
          </p>
          <p className="mt-1 text-xs text-[#BDBDBD]">{activeOrders.length}件</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="text-sm text-[#828282]">総取引数</p>
          <p className="mt-1 text-2xl font-bold text-[#222]">
            {totalOrders}
            <span className="ml-1 text-sm font-normal text-[#BDBDBD]">件</span>
          </p>
          <p className="mt-1 text-xs text-[#BDBDBD]">
            完了 {completedOrders.length}件
          </p>
        </div>
      </div>
    </div>
  );
}
