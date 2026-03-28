"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addPackage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return { error: "クリエイタープロフィールを先に作成してください" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseInt(formData.get("price") as string);
  const delivery_days = parseInt(formData.get("delivery_days") as string);
  const revisions = parseInt(formData.get("revisions") as string);
  const features = (formData.get("features") as string)
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  const { error } = await supabase.from("service_packages").insert({
    creator_id: creator.id,
    name,
    description,
    price,
    delivery_days,
    revisions,
    features,
  });

  if (error) {
    return { error: "プランの追加に失敗しました" };
  }

  revalidatePath("/dashboard/packages");
  return { success: true };
}

export async function togglePackageActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) return { error: "権限がありません" };

  const { error } = await supabase
    .from("service_packages")
    .update({ is_active })
    .eq("id", id)
    .eq("creator_id", creator.id);

  if (error) {
    return { error: "更新に失敗しました" };
  }

  revalidatePath("/dashboard/packages");
  return { success: true };
}

export async function deletePackage(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) return { error: "権限がありません" };

  const { error } = await supabase
    .from("service_packages")
    .delete()
    .eq("id", id)
    .eq("creator_id", creator.id);

  if (error) {
    return { error: "削除に失敗しました" };
  }

  revalidatePath("/dashboard/packages");
  return { success: true };
}
