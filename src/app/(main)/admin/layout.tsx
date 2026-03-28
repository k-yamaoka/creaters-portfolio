import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
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
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      {/* Admin header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-primary-500">管理画面</h1>
        </div>
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
      </nav>

      {children}
    </div>
  );
}
