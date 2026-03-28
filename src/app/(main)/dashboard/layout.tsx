import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // First check auth session
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await getCurrentUser();

  // If profile creation failed, show a minimal fallback
  const role = user?.role ?? "client";

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      <div className="flex gap-10">
        <div className="hidden md:block">
          <Sidebar role={role} />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
