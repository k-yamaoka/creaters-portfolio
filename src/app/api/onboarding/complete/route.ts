import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/onboarding/complete
 *
 * オンボーディング ウィザードの終了を宣言し、profiles.onboarding_completed_at
 * を "now()" で埋める。ウィザードで任意入力された bio / user_type を
 * 同時に更新するオプションも受け付ける。
 *
 * ここを叩いた後、auth callback は /onboarding へリダイレクトしなくなる。
 */

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    bio?: string;
    user_type?: "individual" | "corporate";
  };

  // profiles: 完了時刻を必ず立てる
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (profileError) {
    return NextResponse.json(
      { error: "オンボーディング完了の記録に失敗しました" },
      { status: 500 }
    );
  }

  // creator_profiles: bio / user_type が渡されていれば任意更新
  if (typeof body?.bio === "string" || body?.user_type) {
    const patch: Record<string, unknown> = {};
    if (typeof body.bio === "string") {
      patch.bio = body.bio.slice(0, 2000);
    }
    if (body.user_type === "individual" || body.user_type === "corporate") {
      patch.user_type = body.user_type;
    }
    if (Object.keys(patch).length > 0) {
      await supabase
        .from("creator_profiles")
        .update(patch)
        .eq("user_id", user.id);
    }
  }

  return NextResponse.json({ ok: true });
}
