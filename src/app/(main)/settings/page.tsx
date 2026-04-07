import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-0">
      <h1 className="text-2xl font-bold text-[#222]">アカウント設定</h1>
      <p className="mt-2 text-sm text-[#828282]">
        メールアドレス・パスワード・アカウントの管理
      </p>
      <div className="mt-8">
        <SettingsForm email={user.email} />
      </div>
    </div>
  );
}
