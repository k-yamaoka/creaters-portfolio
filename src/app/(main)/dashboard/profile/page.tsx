import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">プロフィール編集</h1>
      <p className="mt-2 text-sm text-[#828282]">
        公開プロフィールの情報を編集します
      </p>
      <div className="mt-6">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
