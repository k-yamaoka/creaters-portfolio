import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("line_oauth_state")?.value;
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://creaters-portfolio.vercel.app").trim();

  // CSRF check
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const clientId = process.env.LINE_CHANNEL_ID!.trim();
  const clientSecret = process.env.LINE_CHANNEL_SECRET!.trim();
  const redirectUri = `${origin}/api/auth/line/callback`;

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();

    // 2. Extract user info from id_token
    let email: string | undefined;
    let displayName = "LINE User";

    if (tokens.id_token) {
      const payload = JSON.parse(
        Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
      );
      email = payload.email;
      displayName = payload.name || email?.split("@")[0] || "LINE User";
    }

    // 3. Fallback: get profile from LINE API
    if (!displayName || displayName === "LINE User") {
      const profileRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        displayName = profile.displayName || displayName;
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

    if (!existingUser) {
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          provider: "line",
        },
      });
      if (createError) {
        return NextResponse.redirect(`${origin}/login?error=user_creation_failed`);
      }
    }

    // 5. Generate magic link and verify to establish session
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.redirect(`${origin}/login?error=link_generation_failed`);
    }

    const supabase = await createServerClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: linkData.properties.hashed_token,
    });

    if (verifyError) {
      return NextResponse.redirect(`${origin}/login?error=verify_failed`);
    }

    revalidatePath("/", "layout");
    const response = NextResponse.redirect(`${origin}/`);
    response.cookies.delete("line_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(`${origin}/login?error=line_auth_error`);
  }
}
