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
    const role = user.user_metadata?.role;
    if (!role) {
      // Check if profile exists with a role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.role) {
        const url = request.nextUrl.clone();
        url.pathname = "/select-role";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
