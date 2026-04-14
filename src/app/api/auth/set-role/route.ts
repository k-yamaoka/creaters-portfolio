import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await request.json();

  if (role !== "creator" && role !== "client") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Update or create profile with role
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const display_name =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "ユーザー";

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
        skills: [],
        genres: [],
        years_of_experience: 0,
      });
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
