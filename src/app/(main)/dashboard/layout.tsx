import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      <div className="flex gap-10">
        <div className="hidden md:block">
          <Sidebar role={user.role} />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
