import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { ProfileForm } from "./profile-form";
import { ClientForm } from "./client-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isCreator = user.role === "creator";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">
        {isCreator ? "プロフィール編集" : "企業情報編集"}
      </h1>
      <p className="mt-2 text-sm text-[#828282]">
        {isCreator
          ? "公開プロフィールの情報を編集します"
          : "企業情報を登録・更新します"}
      </p>
      <div className="mt-6">
        {isCreator ? <ProfileForm user={user} /> : <ClientForm user={user} />}
      </div>
    </div>
  );
}
