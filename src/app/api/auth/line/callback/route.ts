import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { isEmailBlocked } from "@/lib/account-blocklist";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("line_oauth_state")?.value;
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).trim();
  if (!origin) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL not configured" },
      { status: 500 }
    );
  }

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
    let lineUserId: string | undefined;

    if (tokens.id_token) {
      const payload = JSON.parse(
        Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
      );
      email = payload.email;
      displayName = payload.name || email?.split("@")[0] || "LINE User";
      // sub は LINE 側の user ID (U で始まる 33 文字)。LINE Push API で
      // 通知を送るのに必要なので profiles.line_user_id に保存する。
      lineUserId = typeof payload.sub === "string" ? payload.sub : undefined;
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

    // 退会後 30 日以内のメールは LINE 経由でも再ログインさせない
    if (await isEmailBlocked(supabaseAdmin, email.toLowerCase())) {
      return NextResponse.redirect(
        `${origin}/login?error=account_deactivated`
      );
    }

    // 既存ユーザー確認は profiles テーブルへの SELECT で行う。
    // ※ かつては auth.admin.listUsers() を使っていたが、これは default 50/max 1000 件で
    //   全件ページネーション必須となるため、ユーザー数の増加で破綻する時限爆弾だった。
    //   profiles.email は handle_new_user trigger で auth.users と同期されるので、
    //   email でピンポイント検索すれば O(1) で済む。
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!existingProfile) {
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

    // LINE Push 通知の宛先として line_user_id を保存する。
    // 既存プロフィールなら email で引き当てて UPDATE、新規なら handle_new_user
    // trigger で行が作成された直後なので UPDATE できる。
    if (lineUserId) {
      try {
        await supabaseAdmin
          .from("profiles")
          .update({ line_user_id: lineUserId })
          .eq("email", email);
      } catch (e) {
        // 通知先保存の失敗はログインを止める理由にならないので握りつぶす
        console.error("[line-callback] line_user_id save failed", e);
      }
    }

    // start endpoint で保存した next path を取り出して redirect 先に。
    // 型チェック済 (safeNextPath 相当) の値のみ入っているが 二重防御。
    const rawNext = request.cookies.get("line_oauth_next")?.value ?? null;
    const nextPath =
      rawNext &&
      rawNext.startsWith("/") &&
      !rawNext.startsWith("//") &&
      !rawNext.startsWith("/\\") &&
      !/[\r\n]/.test(rawNext)
        ? rawNext
        : "/";
    revalidatePath("/", "layout");
    const response = NextResponse.redirect(`${origin}${nextPath}`);
    response.cookies.delete("line_oauth_state");
    response.cookies.delete("line_oauth_next");
    return response;
  } catch {
    return NextResponse.redirect(`${origin}/login?error=line_auth_error`);
  }
}
