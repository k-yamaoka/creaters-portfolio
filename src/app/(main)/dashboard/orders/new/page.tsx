import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { OrderForm } from "./order-form";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ creator_id?: string }>;
}) {
  const { creator_id } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!creator_id) {
    redirect("/creators");
  }

  // Get creator + minimum_order_amount
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select(
      `
      id, minimum_order_amount,
      profiles!creator_profiles_user_id_fkey ( display_name )
    `
    )
    .eq("id", creator_id)
    .single();

  if (!creator) {
    redirect("/creators");
  }

  const creatorName = (creator as unknown as { profiles: { display_name: string } }).profiles.display_name;
  const minAmount =
    (creator as unknown as { minimum_order_amount: number | null })
      .minimum_order_amount;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">依頼を作成</h1>
      <p className="mt-2 text-sm text-[#828282]">
        クリエイターへの依頼内容を入力してください
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order form */}
        <div className="lg:col-span-2">
          <OrderForm creatorId={creator_id} />
        </div>

        {/* Creator summary (旧パッケージサマリーを撤去し、最低受注金額のみ表示) */}
        <div>
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-sm font-bold text-[#828282]">依頼先</h2>
            <p className="mt-1 text-lg font-bold text-[#222]">{creatorName}</p>

            <div className="mt-4 border-t border-[#F2F2F2] pt-4">
              <h3 className="text-sm font-bold text-[#828282]">最低受注金額</h3>
              <p className="mt-1 text-2xl font-black text-neon-purple-deep">
                {minAmount != null ? `${formatPrice(minAmount)}〜` : "応相談"}
              </p>
              <p className="mt-1 text-[11px] text-[#BDBDBD]">
                ※ 仕様/尺/本数で見積もりは変動します。手数料 15% を含みません。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
