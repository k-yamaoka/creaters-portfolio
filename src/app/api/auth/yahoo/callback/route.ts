import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Yahoo! JAPAN OAuth callback
// Exchange code for tokens, then sign in to Supabase

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("yahoo_oauth_state")?.value;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://creaters-portfolio.vercel.app";

  // CSRF check
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const clientId = process.env.YAHOO_CLIENT_ID!;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET!;
  const redirectUri = `${origin}/api/auth/yahoo/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://auth.login.yahoo.co.jp/yconnect/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch("https://userinfo.yahooapis.jp/yconnect/v2/attribute", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=userinfo_failed`);
    }

    const userInfo = await userInfoRes.json();
    const email = userInfo.email;
    const displayName = userInfo.name || userInfo.given_name || email?.split("@")[0] || "Yahoo User";

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=no_email`);
    }

    // Sign in or sign up via Supabase using email
    const supabase = await createClient();

    // Try to sign in with OTP (magic link style, auto-confirm)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: {
          display_name: displayName,
          provider: "yahoo",
        },
        shouldCreateUser: true,
      },
    });

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=supabase_auth_failed`);
    }

    // Since OTP sends an email, we redirect to a confirmation page
    // For a seamless experience, you could use admin API to create/sign in users directly
    const response = NextResponse.redirect(`${origin}/login?message=yahoo_check_email`);
    response.cookies.delete("yahoo_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(`${origin}/login?error=yahoo_auth_error`);
  }
}
