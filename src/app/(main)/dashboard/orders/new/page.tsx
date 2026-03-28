import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { OrderForm } from "./order-form";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ creator_id?: string; package_id?: string }>;
}) {
  const { creator_id, package_id } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!creator_id || !package_id) {
    redirect("/creators");
  }

  // Get creator info
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select(
      `
      id,
      profiles!creator_profiles_user_id_fkey ( display_name )
    `
    )
    .eq("id", creator_id)
    .single();

  // Get package info
  const { data: pkg } = await supabase
    .from("service_packages")
    .select("*")
    .eq("id", package_id)
    .single();

  if (!creator || !pkg) {
    redirect("/creators");
  }

  const creatorName = (creator as unknown as { profiles: { display_name: string } }).profiles.display_name;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">依頼を作成</h1>
      <p className="mt-2 text-sm text-[#828282]">
        クリエイターへの依頼内容を入力してください
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order form */}
        <div className="lg:col-span-2">
          <OrderForm creatorId={creator_id} packageId={package_id} />
        </div>

        {/* Package summary */}
        <div>
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-sm font-bold text-[#828282]">依頼先</h2>
            <p className="mt-1 text-lg font-bold text-[#222]">{creatorName}</p>

            <div className="mt-4 border-t border-[#F2F2F2] pt-4">
              <h3 className="text-sm font-bold text-[#828282]">選択プラン</h3>
              <p className="mt-1 font-bold text-[#222]">{pkg.name}</p>
              <p className="mt-1 text-sm text-[#828282]">{pkg.description}</p>
            </div>

            <div className="mt-4 flex gap-4 text-xs text-[#828282]">
              <span>納期 {pkg.delivery_days}日</span>
              <span>修正 {pkg.revisions}回</span>
            </div>

            {pkg.features.length > 0 && (
              <ul className="mt-3 space-y-1">
                {pkg.features.map((f: string) => (
                  <li
                    key={f}
                    className="flex items-center gap-1.5 text-xs text-[#4F4F4F]"
                  >
                    <svg
                      className="h-3 w-3 shrink-0 text-primary-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-[#F2F2F2] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#828282]">料金</span>
                <span className="text-xl font-bold text-primary-500">
                  {formatPrice(pkg.price)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#BDBDBD]">
                ※ 手数料15%がかかります
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
