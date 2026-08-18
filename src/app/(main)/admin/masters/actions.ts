"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin")
    return { ok: false as const, error: "Forbidden" };
  return { ok: true as const, userId: user.id };
}

export async function createTag(formData: FormData) {
  const check = await assertAdmin();
  if (!check.ok) return { error: check.error };
  const category = String(formData.get("category") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") ?? 100) || 100;

  if (!["skill", "ai_tool", "genre", "industry"].includes(category)) {
    return { error: "無効な category" };
  }
  if (name.length < 1 || name.length > 100) {
    return { error: "名前は 1〜100 文字" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("tags").insert({
    category,
    name,
    slug,
    sort_order: sortOrder,
    is_active: true,
  });
  if (error) return { error: `追加に失敗: ${error.message}` };
  revalidatePath("/admin/masters");
  return { ok: true };
}

export async function toggleTagActive(formData: FormData) {
  const check = await assertAdmin();
  if (!check.ok) return { error: check.error };
  const id = String(formData.get("id") ?? "");
  const nextActive = formData.get("next_active") === "1";
  if (!id) return { error: "id 不足" };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("tags")
    .update({ is_active: nextActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: `更新に失敗: ${error.message}` };
  revalidatePath("/admin/masters");
  return { ok: true };
}

export async function updateTag(formData: FormData) {
  const check = await assertAdmin();
  if (!check.ok) return { error: check.error };
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") ?? 100) || 100;

  if (!id) return { error: "id 不足" };
  if (name.length < 1 || name.length > 100) {
    return { error: "名前は 1〜100 文字" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("tags")
    .update({
      name,
      slug,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: `更新に失敗: ${error.message}` };
  revalidatePath("/admin/masters");
  return { ok: true };
}
