import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/users", label: "ユーザー管理" },
  { href: "/admin/orders", label: "取引・売上管理" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Directly query profile role instead of using getCurrentUser
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      {/* Admin header */}
      <div className="mb-8">
        <h1 className="text-sm font-bold text-primary-500">管理画面</h1>
      </div>

      {/* Tab navigation */}
      <nav className="mb-8 flex gap-1 rounded-xl bg-white p-1 shadow-card">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-[#4F4F4F] transition-colors hover:bg-[#F2F2F2]"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/dashboard"
          className="ml-auto rounded-lg px-5 py-2.5 text-sm font-medium text-[#828282] transition-colors hover:bg-[#F2F2F2]"
        >
          ダッシュボードに戻る
        </Link>
      </nav>

      {children}
    </div>
  );
}
