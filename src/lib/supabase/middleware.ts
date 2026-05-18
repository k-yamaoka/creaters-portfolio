import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in but has no role, redirect to role selection
  // Skip for API routes, auth routes, select-role page, and static assets
  const pathname = request.nextUrl.pathname;
  const skipPaths = ["/select-role", "/api/", "/auth/", "/login", "/register", "/_next/", "/favicon.ico"];
  const shouldSkip = skipPaths.some((p) => pathname.startsWith(p));

  if (user && !shouldSkip) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    // 退会済み (is_active=false) は強制ログアウトしてトップへ送る。
    // ハード削除でなく soft delete で残った場合のフェイルセーフ。
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "account_deactivated");
      return NextResponse.redirect(url);
    }

    // blocklist (deleted_account_emails) のメールで作成されたユーザーも遮断。
    // RLS は anon/authenticated を弾くので auth callback / 管理サーバー側で
    // しか入らないが、念のため middleware からも防御層を張る。
    // RLS により読めない場合は何も返らない (= スキップ) ので副作用なし。
    if (user.email) {
      const { data: blocked } = await supabase
        .from("deleted_account_emails")
        .select("email_lower")
        .eq("email_lower", user.email.toLowerCase())
        .maybeSingle();
      if (blocked) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "account_deactivated");
        return NextResponse.redirect(url);
      }
    }

    const role = user.user_metadata?.role ?? profile?.role;
    if (!role) {
      const url = request.nextUrl.clone();
      url.pathname = "/select-role";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
