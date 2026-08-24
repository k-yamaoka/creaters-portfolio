import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/security/csp";

export async function updateSession(request: NextRequest) {
  // Per-request nonce (base64) — Web Crypto で 16 バイトのランダム。
  // これを CSP script-src の 'nonce-...' と、layout.tsx の headers() 経由で
  // <script nonce=...> にも渡す。
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));

  // request の header に x-nonce を注入 (Server Component が headers() で読める)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  supabaseResponse.headers.set(
    "Content-Security-Policy",
    buildCsp(nonce)
  );

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
            request: { headers: requestHeaders },
          });
          // 再作成した response に CSP を再セット (nonce は同一リクエスト内で不変)
          supabaseResponse.headers.set(
            "Content-Security-Policy",
            buildCsp(nonce)
          );
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

    // 退会後 30 日以内のメールは middleware でも防御する。
    // RLS policy 側で deleted_at > now() - 30 days をフィルタしているため、
    // 30 日経過した行はクエリ結果に含まれず素通りする (再登録可能)。
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
