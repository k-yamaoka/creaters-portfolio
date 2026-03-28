import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
      />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}
