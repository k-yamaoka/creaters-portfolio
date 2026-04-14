import { NextResponse } from "next/server";
import crypto from "crypto";

// LINE Login OAuth 2.0
// Docs: https://developers.line.biz/ja/docs/line-login/integrate-line-login/

export async function GET() {
  const clientId = process.env.LINE_CHANNEL_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "LINE Login is not configured" },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://creaters-portfolio.vercel.app").trim();
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

  return response;
}
