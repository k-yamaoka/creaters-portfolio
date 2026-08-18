import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { UserList } from "./user-list";

const PAGE_SIZE = 50;

type SearchParams = Promise<{
  page?: string;
  role?: string;
  q?: string;
}>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = getSupabaseAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const role =
    params.role === "creator" || params.role === "client" || params.role === "admin"
      ? params.role
      : null;
  const q = params.q?.trim() ?? "";

  let query = admin
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (role) query = query.eq("role", role);
  if (q) query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: users, count } = await query.range(from, to);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const linkFor = (p: number) => {
    const sp = new URLSearchParams();
    if (p > 1) sp.set("page", String(p));
    if (role) sp.set("role", role);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/admin/users?${s}` : "/admin/users";
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#222]">ユーザー管理</h2>
          <p className="mt-2 text-sm text-[#828282]">
            全 {total.toLocaleString()} 件 / {page} / {totalPages} ページ
          </p>
        </div>
        {/* フィルタ */}
        <form
          className="flex flex-wrap items-center gap-2 text-sm"
          method="GET"
        >
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="表示名 / メール検索"
            className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <select
            name="role"
            defaultValue={role ?? ""}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">全 role</option>
            <option value="creator">creator</option>
            <option value="client">client</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
          >
            絞込
          </button>
        </form>
      </div>

      <div className="mt-6">
        <UserList users={users ?? []} />
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={linkFor(page - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
            >
              ← 前へ
            </Link>
          )}
          <span className="px-3 py-2 text-gray-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={linkFor(page + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
            >
              次へ →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
