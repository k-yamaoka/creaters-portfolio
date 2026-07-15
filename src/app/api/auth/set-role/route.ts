import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDisplayName } from "@/lib/name-validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // 00067: 登録エンドポイントの rate-limit (IP 単位 / 60 秒 / 10 回)。
  //   Vercel Functions は stateless なので best-effort だが、
  //   単一 lambda 内での連続 bot 登録は抑止できる。
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`set-role:${ip}`, 10, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待って再度お試しください。" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const role = body?.role;
  // 00067: creator は 個人/法人 の事業形態を持つ。未指定なら individual にフォールバック。
  const userType: "individual" | "corporate" =
    body?.user_type === "corporate" ? "corporate" : "individual";

  if (role !== "creator" && role !== "client") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Update or create profile with role
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const rawDisplayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "ユーザー";
  // 00067: Server 側で表示名を再検証 (クライアント JS 回避の直叩き対策)。
  //   OAuth 由来 (Google 実名等) は通常問題ないが、悪意ある metadata で
  //   spam 名を差し込まれた場合はここで弾く。
  const nameCheck = validateDisplayName(rawDisplayName);
  const display_name = nameCheck.ok
    ? nameCheck.sanitized
    : rawDisplayName.slice(0, 40);
  if (!nameCheck.ok) {
    return NextResponse.json({ error: nameCheck.reason }, { status: 400 });
  }

  if (existingProfile) {
    // Update existing profile
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: "プロフィールの更新に失敗しました" }, { status: 500 });
    }
  } else {
    // Create new profile
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email || "",
        display_name,
        role,
      });

    if (error) {
      return NextResponse.json({ error: "プロフィールの作成に失敗しました" }, { status: 500 });
    }
  }

  // Create role-specific profile if not exists
  if (role === "creator") {
    const { data: existing } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      await supabase.from("creator_profiles").insert({
        user_id: user.id,
        bio: "",
        video_lengths: [],
        strengths: [],
        genres: [],
        years_of_experience: 0,
        user_type: userType,
        // 00067: 新規はポートフォリオ 0 点のため 非公開スタート。
        //   ポートフォリオ 1 点目登録時に trigger が自動 true に切り替える。
        is_searchable: false,
      });
    } else {
      // 既存クリエイターが /select-role を再訪して事業形態だけ変えた場合の追従
      await supabase
        .from("creator_profiles")
        .update({ user_type: userType })
        .eq("user_id", user.id);
    }
  } else if (role === "client") {
    const { data: existing } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      await supabase.from("client_profiles").insert({
        user_id: user.id,
      });
    }
  }

  // Update user metadata
  await supabase.auth.updateUser({
    data: { role, display_name },
  });

  return NextResponse.json({ success: true });
}
