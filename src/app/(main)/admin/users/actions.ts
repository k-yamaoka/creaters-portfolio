"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const supabase = await checkAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { error: "更新に失敗しました" };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserVerified(userId: string, isVerified: boolean) {
  const supabase = await checkAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: isVerified })
    .eq("id", userId);

  if (error) return { error: "更新に失敗しました" };

  revalidatePath("/admin/users");
  return { success: true };
}
