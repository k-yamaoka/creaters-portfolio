"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOrder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const creator_profile_id = formData.get("creator_id") as string;
  const package_id = formData.get("package_id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  // Get or create client profile
  let { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!clientProfile) {
    const { data: newProfile, error: insertError } = await supabase
      .from("client_profiles")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (insertError || !newProfile) {
      return { error: "クライアント情報の作成に失敗しました" };
    }
    clientProfile = newProfile;
  }

  // Get package info for price
  const { data: pkg } = await supabase
    .from("service_packages")
    .select("price")
    .eq("id", package_id)
    .single();

  const totalAmount = pkg?.price ?? 0;
  const platformFee = Math.floor(totalAmount * 0.15); // 15% platform fee
  const creatorPayout = totalAmount - platformFee;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      client_id: clientProfile.id,
      creator_id: creator_profile_id,
      package_id,
      title,
      description,
      total_amount: totalAmount,
      platform_fee: platformFee,
      creator_payout: creatorPayout,
      status: "inquiry",
    })
    .select("id")
    .single();

  if (error || !order) {
    return { error: "注文の作成に失敗しました" };
  }

  redirect(`/dashboard/orders/${order.id}`);
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "delivered") {
    updateData.delivered_at = new Date().toISOString();
  } else if (newStatus === "completed") {
    updateData.completed_at = new Date().toISOString();
    updateData.escrow_status = "released";
  } else if (newStatus === "paid") {
    updateData.escrow_status = "held";
  } else if (newStatus === "cancelled") {
    updateData.escrow_status = "refunded";
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) {
    return { error: "ステータスの更新に失敗しました" };
  }

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
  return { success: true };
}
