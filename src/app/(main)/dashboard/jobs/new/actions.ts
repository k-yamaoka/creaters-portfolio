"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get or create client profile
  let { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!clientProfile) {
    const { data } = await supabase
      .from("client_profiles")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    clientProfile = data;
  }

  if (!clientProfile) {
    return { error: "クライアント情報の作成に失敗しました" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const genres = formData.getAll("genres") as string[];
  const budget_min = formData.get("budget_min") as string;
  const budget_max = formData.get("budget_max") as string;
  const unit_price = formData.get("unit_price") as string;
  const deadline = formData.get("deadline") as string;
  const delivery_deadline = formData.get("delivery_deadline") as string;

  // 編集要件
  const footage_minutes = formData.get("footage_minutes") as string;
  const finish_duration_unit = formData.get("finish_duration_unit") as string;
  const finish_duration_min = formData.get("finish_duration_min") as string;
  const finish_duration_max = formData.get("finish_duration_max") as string;
  const work_types = formData.getAll("work_types") as string[];
  const revision_count = formData.get("revision_count") as string;
  const software_options = formData.getAll("software_options") as string[];
  const delivery_formats = formData.getAll("delivery_formats") as string[];
  const delivery_days = formData.get("delivery_days") as string;
  const reference_url = formData.get("reference_url") as string;
  const is_recurring = !!formData.get("is_recurring");
  const monthly_count = formData.get("monthly_count") as string;
  const client_type = formData.get("client_type") as string;
  const count_min = formData.get("count_min") as string;
  const count_max = formData.get("count_max") as string;

  const { error } = await supabase.from("jobs").insert({
    client_id: clientProfile.id,
    title,
    description,
    genres,
    budget_min: budget_min ? parseInt(budget_min) : null,
    budget_max: budget_max ? parseInt(budget_max) : null,
    unit_price: unit_price ? parseInt(unit_price) : null,
    deadline: deadline || null,
    delivery_deadline: delivery_deadline || null,
    status: "open",
    footage_minutes: footage_minutes ? parseInt(footage_minutes) : null,
    finish_duration_unit: finish_duration_unit || null,
    finish_duration_min: finish_duration_min ? Number(finish_duration_min) : null,
    finish_duration_max: finish_duration_max ? Number(finish_duration_max) : null,
    work_types,
    revision_count: revision_count ? parseInt(revision_count) : null,
    software_options,
    delivery_formats,
    delivery_days: delivery_days ? parseInt(delivery_days) : null,
    reference_url: reference_url || null,
    is_recurring,
    monthly_count: is_recurring && monthly_count ? parseInt(monthly_count) : null,
    client_type: client_type || null,
    count_min: count_min ? parseInt(count_min) : null,
    count_max: count_max ? parseInt(count_max) : null,
  });

  if (error) {
    return { error: "案件の作成に失敗しました" };
  }

  redirect("/dashboard/jobs");
}
