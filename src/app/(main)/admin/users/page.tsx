import { createClient } from "@/lib/supabase/server";
import { UserList } from "./user-list";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#222]">ユーザー管理</h2>
      <p className="mt-2 text-sm text-[#828282]">
        全{users?.length ?? 0}件のユーザー
      </p>
      <div className="mt-6">
        <UserList users={users ?? []} />
      </div>
    </div>
  );
}
