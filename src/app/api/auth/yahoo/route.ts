import { NextResponse } from "next/server";
import crypto from "crypto";

// Yahoo! JAPAN OAuth 2.0 / OpenID Connect
// Docs: https://developer.yahoo.co.jp/yconnect/v2/

export async function GET() {
  const clientId = process.env.YAHOO_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Yahoo! JAPAN OAuth is not configured" },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "https://creaters-portfolio.vercel.app"}/api/auth/yahoo/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId.trim(),
    redirect_uri: redirectUri.trim(),
    scope: "openid profile email",
    state,
    nonce,
  });

  const response = NextResponse.redirect(
    `https://auth.login.yahoo.co.jp/yconnect/v2/authorization?${params.toString()}`
  );

  // Store state in cookie for CSRF verification
  response.cookies.set("yahoo_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
