"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification, sendSystemMessage } from "@/lib/notify";

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
      status: "consultation",
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
    })
    .select("id")
    .single();

  if (error || !order) {
    return { error: "注文の作成に失敗しました" };
  }

  // 取引依頼を相手クリエイターへスレッドで通知（送信者=クライアントuser、受信者=クリエイターuser）
  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("user_id")
    .eq("id", creator_profile_id)
    .single();

  if (creatorProfile?.user_id) {
    const snippet = description
      ? description.length > 140
        ? `${description.slice(0, 140)}…`
        : description
      : "";
    const messageBody = `【新規取引依頼】「${title}」\n${snippet ? `${snippet}\n` : ""}金額: ¥${totalAmount.toLocaleString()}\n詳細はこちら: /dashboard/orders/${order.id}`;

    await sendSystemMessage({
      senderUserId: user.id,
      receiverUserId: creatorProfile.user_id,
      content: messageBody,
      orderId: order.id,
    });
    await createNotification({
      userId: creatorProfile.user_id,
      type: "scout",
      title: `新規取引依頼: 「${title}」`,
      body: snippet,
      link: `/dashboard/orders/${order.id}`,
    });
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
  } else if (newStatus === "data_sharing") {
    // 契約後のテスト用フォールバック: Stripeなしで data_sharing に進めた場合は escrow held に
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
