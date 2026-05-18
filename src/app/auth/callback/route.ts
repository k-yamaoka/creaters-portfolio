import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      const email = data.user.email?.toLowerCase();

      // 退会済みメールでの再ログインを遮断する。
      // auth.users 物理削除後に OAuth で新規 auth.users が作られても、
      // ここで blocklist に当たれば即座に作りたての行を削除して
      // /login?error=account_deactivated に送り返す。
      if (email) {
        try {
          const admin = getSupabaseAdmin();
          const { data: blocked } = await admin
            .from("deleted_account_emails")
            .select("email_lower")
            .eq("email_lower", email)
            .maybeSingle();
          if (blocked) {
            // 作成されたばかりの auth.users を物理削除して痕跡を消す
            try {
              await admin.auth.admin.deleteUser(data.user.id);
            } catch {
              // 失敗しても次回 middleware で is_active=false に倒れる経路があるため握りつぶす
            }
            await supabase.auth.signOut();
            return NextResponse.redirect(
              `${origin}/login?error=account_deactivated`
            );
          }
        } catch {
          // admin client が未設定なら blocklist チェックはスキップ
          // (middleware の is_active チェックが二段目の防御)
        }
      }

      // Revalidate all pages so layout picks up new auth state
      revalidatePath("/", "layout");
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
