import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("yahoo_oauth_state")?.value;
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://creaters-portfolio.vercel.app").trim();

  // CSRF check
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const clientId = process.env.YAHOO_CLIENT_ID!.trim();
  const clientSecret = process.env.YAHOO_CLIENT_SECRET!.trim();
  const redirectUri = `${origin}/api/auth/yahoo/callback`;

  try {
    // 1. Exchange code for tokens
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

    // 2. Extract user info from id_token JWT
    let email: string | undefined;
    let displayName: string = "Yahoo User";

    if (tokens.id_token) {
      const payload = JSON.parse(
        Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
      );
      email = payload.email;
      displayName = payload.name || payload.preferred_username || email?.split("@")[0] || "Yahoo User";
    }

    // 3. Fallback: try UserInfo API
    if (!email && tokens.access_token) {
      const userInfoRes = await fetch("https://userinfo.yahooapis.jp/yconnect/v2/attribute", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        email = userInfo.email;
        displayName = userInfo.name || userInfo.given_name || email?.split("@")[0] || "Yahoo User";
      }
    }

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=no_email`);
    }

    // 4. Use Supabase Admin API to create/sign in user
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user with random password (they'll use OAuth to login)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          provider: "yahoo",
        },
      });
      if (createError || !newUser.user) {
        return NextResponse.redirect(`${origin}/login?error=user_creation_failed`);
      }
      userId = newUser.user.id;
    }

    // 5. Generate a magic link to sign in the user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData) {
      return NextResponse.redirect(`${origin}/login?error=link_generation_failed`);
    }

    // Extract the token from the link and use it to verify OTP
    const hashed_token = linkData.properties?.hashed_token;
    if (!hashed_token) {
      return NextResponse.redirect(`${origin}/login?error=no_token`);
    }

    // 6. Use the server client to verify the OTP and set session cookies
    const supabase = await createServerClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: hashed_token,
    });

    if (verifyError) {
      return NextResponse.redirect(`${origin}/login?error=verify_failed`);
    }

    const response = NextResponse.redirect(`${origin}/`);
    response.cookies.delete("yahoo_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(`${origin}/login?error=yahoo_auth_error`);
  }
}
