import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { PortfolioManager } from "./portfolio-manager";

export default async function PortfolioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.creator_profile) {
    redirect("/dashboard/profile");
  }

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("creator_id", user.creator_profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">ポートフォリオ管理</h1>
      <p className="mt-2 text-sm text-[#828282]">
        作品を追加・管理して、クライアントにアピールしましょう
      </p>
      <div className="mt-6">
        <PortfolioManager items={items ?? []} />
      </div>
    </div>
  );
}
