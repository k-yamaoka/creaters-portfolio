import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * REG-016 診断用: サーバー環境の Supabase Auth 関連設定を確認する。
 *
 * 開発者が 「なぜ 確認メールが届かないか」を切り分けるための ヘルスチェック。
 * 本番でも 認可付き で叩けるが 実運用の pass-through は避ける想定。
 *
 * 認可: `Authorization: Bearer <CRON_SECRET>` を要求 (Cron と同一秘密を再利用)。
 *
 * 返却:
 *   {
 *     env: {
 *       NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_URL,
 *       NEXT_PUBLIC_SUPABASE_ANON_KEY(存在フラグ),
 *       SUPABASE_SERVICE_ROLE_KEY(存在フラグ),
 *     },
 *     redirectTo: `${APP_URL}/auth/callback`,
 *     checklist: [
 *       "Supabase Dashboard で確認する項目 のチェックリスト"
 *     ],
 *   }
 *
 * これで 「NEXT_PUBLIC_APP_URL が Vercel 側で未設定」「emailRedirectTo が
 * localhost で メールが届かない」等の env-level ミスを 即座に特定できる。
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKeyPresent = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRolePresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const notifyFromEmail = process.env.NOTIFY_FROM_EMAIL ?? "(未設定 = onboarding@resend.dev)";
  const resendApiPresent = !!process.env.RESEND_API_KEY;

  // 有効な emailRedirectTo が構築できるかテスト
  const redirectTo = appUrl ? `${appUrl}/auth/callback` : "(APP_URL 未設定)";

  // Supabase Admin API で ユーザー数を軽く取得 (auth 疎通確認)
  let adminApiReachable: boolean | string = false;
  let recentSignupCount: number | string = "unknown";
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 5,
    });
    if (error) {
      adminApiReachable = `error: ${error.message}`;
    } else {
      adminApiReachable = true;
      recentSignupCount = data.users.length;
    }
  } catch (e) {
    adminApiReachable = `exception: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    ok: true,
    env: {
      NEXT_PUBLIC_APP_URL: appUrl || "(未設定)",
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || "(未設定)",
      NEXT_PUBLIC_SUPABASE_ANON_KEY_present: anonKeyPresent,
      SUPABASE_SERVICE_ROLE_KEY_present: serviceRolePresent,
      NOTIFY_FROM_EMAIL: notifyFromEmail,
      RESEND_API_KEY_present: resendApiPresent,
    },
    signup: {
      emailRedirectTo_will_be: redirectTo,
      admin_api_reachable: adminApiReachable,
      recent_users_count: recentSignupCount,
    },
    checklist_supabase_dashboard: [
      "1. Authentication > Sign In / Providers > Email: 'Confirm email' が ON",
      "2. Authentication > URL Configuration > Site URL: 本番ドメイン (例 https://aimovie-works.com)",
      "3. Authentication > URL Configuration > Redirect URLs allowlist: 上記 emailRedirectTo_will_be を含む URL パターン (例 https://aimovie-works.com/**)",
      "4. Authentication > Rate Limits > 'Emails per hour': デフォルト 30 → 本番前に 200+ 推奨",
      "5. Project Settings > Auth > SMTP Settings: カスタム SMTP (Resend / SendGrid / Amazon SES) を設定。デフォルト SMTP は 開発向けで 本番の量を捌けない",
      "6. Authentication > Email Templates > 'Confirm signup': 日本語テンプレ + {{ .ConfirmationURL }} placeholder が入っているか",
    ],
  });
}
