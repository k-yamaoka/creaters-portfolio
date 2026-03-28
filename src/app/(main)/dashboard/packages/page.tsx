import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { PackageManager } from "./package-manager";

export default async function PackagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.creator_profile) {
    redirect("/dashboard/profile");
  }

  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("service_packages")
    .select("*")
    .eq("creator_id", user.creator_profile.id)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">料金プラン管理</h1>
      <p className="mt-2 text-sm text-[#828282]">
        提供するサービスの料金プランを設定しましょう
      </p>
      <div className="mt-6">
        <PackageManager packages={packages ?? []} />
      </div>
    </div>
  );
}
