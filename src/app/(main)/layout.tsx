import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MessageNotifier } from "@/components/shared/message-notifier";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get unread message count, notifications, and role
  let unreadCount = 0;
  let notifications: { id: string; type: string; title: string; body: string | null; link: string | null; is_read: boolean; created_at: string }[] = [];
  let role: "creator" | "client" | "admin" | null = null;
  if (user) {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);
    unreadCount = count ?? 0;

    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    notifications = notifs ?? [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const r = profile?.role as string | undefined;
    role = r === "creator" || r === "client" || r === "admin" ? r : null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        user={
          user
            ? {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata as {
                  display_name?: string;
                  role?: string;
                },
              }
            : null
        }
        unreadCount={unreadCount}
        notifications={notifications}
        role={role}
      />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
      {user && <MessageNotifier userId={user.id} />}
    </div>
  );
}
