import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// LINE Login OAuth 2.0
// Docs: https://developers.line.biz/ja/docs/line-login/integrate-line-login/

/** Open Redirect 対策: "/" 始まり + "//" "/\\" 除外 + CR/LF 無し のみ許可 */
function safeNextPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/dashboard";
  if (/[\r\n]/.test(raw)) return "/dashboard";
  return raw;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.LINE_CHANNEL_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "LINE Login is not configured" },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");
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
  const redirectUri = `${origin}/api/auth/line/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId.trim(),
    redirect_uri: redirectUri,
    state,
    scope: "profile openid email",
    nonce,
  });

  const response = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
  );

  response.cookies.set("line_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  // next パスも短命 cookie に保存 (callback で読んで redirect)
  const nextParam = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (nextParam !== "/dashboard") {
    response.cookies.set("line_oauth_next", nextParam, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }

  return response;
}
