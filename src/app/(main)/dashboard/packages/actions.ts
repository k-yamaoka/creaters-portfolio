"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseIntInRange, LIMITS } from "@/lib/validation";

/**
 * FormData から service_packages の payload を組み立てる。
 *
 * 既存の必須項目 (name / description / price / delivery_days / revisions / features)
 * に加え、2026-06-03 追加の詳細項目をすべて拾う。
 *
 * 不正値は null / 空配列で安全に丸める (UI 側の validation はあくまで補助)。
 */
function buildPayloadFromFormData(formData: FormData) {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() ?? "";
  const price =
    parseIntInRange(formData.get("price"), { max: LIMITS.UNIT_PRICE }) ?? 0;
  const delivery_days =
    parseIntInRange(formData.get("delivery_days"), {
      min: 1,
      max: LIMITS.DELIVERY_DAYS,
    }) ?? 1;
  const revisions =
    parseIntInRange(formData.get("revisions"), { max: LIMITS.REVISION_COUNT }) ??
    0;
  const features = ((formData.get("features") as string) || "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 30);

  // ===== 詳細項目 =====
  const planning_support = (formData.get("planning_support") as string) || null;
  const revisions_unlimited = formData.get("revisions_unlimited") === "1";
  const tools = (formData.getAll("tools") as string[])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 30);
  const voiceover_type = (formData.get("voiceover_type") as string) || null;
  const bgm_policy_raw = (formData.get("bgm_policy") as string) || "";
  const bgm_policy = bgm_policy_raw.trim() ? bgm_policy_raw.trim() : null;
  const resolution = (formData.get("resolution") as string) || null;
  const project_files_included =
    formData.get("project_files_included") === "1";
  const commercial_use = (formData.get("commercial_use") as string) || null;
  const commercial_use_note_raw =
    (formData.get("commercial_use_note") as string) || "";
  const commercial_use_note = commercial_use_note_raw.trim()
    ? commercial_use_note_raw.trim()
    : null;
  const duration_target = (formData.get("duration_target") as string) || null;
  const rush_available = formData.get("rush_available") === "1";
  const rush_delivery_days = rush_available
    ? parseIntInRange(formData.get("rush_delivery_days"), {
        min: 1,
        max: LIMITS.DELIVERY_DAYS,
      })
    : null;
  const rush_surcharge = rush_available
    ? parseIntInRange(formData.get("rush_surcharge"), {
        max: LIMITS.UNIT_PRICE,
      })
    : null;

  return {
    name,
    description,
    price,
    delivery_days,
    revisions,
    features,
    planning_support,
    revisions_unlimited,
    tools,
    voiceover_type,
    bgm_policy,
    resolution,
    project_files_included,
    commercial_use,
    commercial_use_note,
    duration_target,
    rush_available,
    rush_delivery_days,
    rush_surcharge,
  } as const;
}

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

  const payload = buildPayloadFromFormData(formData);
  if (!payload.name) return { error: "プラン名を入力してください" };
  if (!payload.description) return { error: "説明を入力してください" };

  const { error } = await supabase.from("service_packages").insert({
    creator_id: creator.id,
    ...payload,
  });

  if (error) {
    return { error: `プランの追加に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/packages");
  return { success: true as const };
}

export async function updatePackage(id: string, formData: FormData) {
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

  const payload = buildPayloadFromFormData(formData);
  if (!payload.name) return { error: "プラン名を入力してください" };

  const { error } = await supabase
    .from("service_packages")
    .update(payload)
    .eq("id", id)
    .eq("creator_id", creator.id);

  if (error) {
    return { error: `プランの更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/packages");
  return { success: true as const };
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
