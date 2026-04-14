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
  });

  if (error) {
    return { error: "案件の作成に失敗しました" };
  }

  redirect("/dashboard/jobs");
}
