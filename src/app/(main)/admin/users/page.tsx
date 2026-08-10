import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { UserList } from "./user-list";

export default async function AdminUsersPage() {
  // 管理画面では email / phone を含む PII 全列を扱うため、migration 00082 で
  // anon/authenticated から REVOKE された PII 列も見える service_role を使う。
  // admin ロール検証は admin/layout.tsx (親レイアウト) で完了済み。
  const admin = getSupabaseAdmin();

  const { data: users } = await admin
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
