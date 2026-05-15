import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification, sendSystemMessage } from "@/lib/notify";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId, status } = await request.json();

  if (!["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // 該当応募 + ジョブ + クリエイター情報をまとめて取得
  const { data: app } = await supabase
    .from("job_applications")
    .select(
      `
      id, job_id, creator_id, message, proposed_price, status,
      job:jobs!job_applications_job_id_fkey (
        id, title, description, budget_max, budget_min,
        client:client_profiles!jobs_client_id_fkey ( id, user_id )
      ),
      creator:creator_profiles!job_applications_creator_id_fkey (
        id, user_id
      )
    `
    )
    .eq("id", applicationId)
    .single();

  if (!app || !app.job) {
    return NextResponse.json({ error: "応募が見つかりません" }, { status: 404 });
  }

  // 認可: 応募対象 job のオーナー (client) であることを確認
  const jobOwnerUserId = (
    app.job as unknown as { client: { user_id: string } | null }
  ).client?.user_id;
  if (!jobOwnerUserId || jobOwnerUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 応募ステータス更新
  const { error: updateErr } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (updateErr) {
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }

  const job = app.job as unknown as {
    id: string;
    title: string;
    description: string | null;
    budget_max: number | null;
    budget_min: number | null;
    client: { id: string; user_id: string } | null;
  };
  const creator = app.creator as unknown as {
    id: string;
    user_id: string;
  };
  const clientUserId = job.client?.user_id;
  const clientProfileId = job.client?.id;

  if (status === "rejected") {
    // クリエイターへ不採用通知
    await sendSystemMessage({
      senderUserId: clientUserId ?? user.id,
      receiverUserId: creator.user_id,
      content: `【選考結果】「${job.title}」へのご応募ありがとうございました。残念ながら今回は採用を見送らせていただきます。`,
    });
    await createNotification({
      userId: creator.user_id,
      type: "job_rejected",
      title: `「${job.title}」選考結果のお知らせ`,
      body: "今回は採用を見送らせていただきました。",
      link: `/jobs/${job.id}`,
    });
    return NextResponse.json({ success: true });
  }

  // === 採用フロー ===
  // 1. 同一ジョブの他のpending応募をrejectedへ自動切り替え
  await supabase
    .from("job_applications")
    .update({ status: "rejected" })
    .eq("job_id", job.id)
    .eq("status", "pending")
    .neq("id", applicationId);

  // 2. 案件をクローズ
  await supabase.from("jobs").update({ status: "closed" }).eq("id", job.id);

  // 3. 取引(order)を自動生成 → consultation
  let createdOrderId: string | null = null;
  if (clientProfileId) {
    const totalAmount =
      app.proposed_price ?? job.budget_max ?? job.budget_min ?? 0;
    const platformFee = Math.floor((totalAmount as number) * 0.15);
    const creatorPayout = (totalAmount as number) - platformFee;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        client_id: clientProfileId,
        creator_id: creator.id,
        title: job.title,
        description: job.description ?? "",
        total_amount: totalAmount,
        platform_fee: platformFee,
        creator_payout: creatorPayout,
        status: "consultation",
      })
      .select("id")
      .single();
    if (!orderErr && order) {
      createdOrderId = order.id;
    } else if (orderErr) {
      console.error("order auto-creation failed", orderErr);
    }
  }

  // 4. クリエイターへ採用通知（取引リンク付き）
  const orderLink = createdOrderId
    ? `/dashboard/orders/${createdOrderId}`
    : `/jobs/${job.id}`;
  await sendSystemMessage({
    senderUserId: clientUserId ?? user.id,
    receiverUserId: creator.user_id,
    content: createdOrderId
      ? `【採用決定】「${job.title}」での採用が決定しました！\n取引が「相談中」で開始されました。\n${orderLink}`
      : `【採用決定】「${job.title}」での採用が決定しました！`,
    orderId: createdOrderId ?? undefined,
  });
  await createNotification({
    userId: creator.user_id,
    type: "job_accepted",
    title: `「${job.title}」採用決定`,
    body: createdOrderId
      ? "取引が「相談中」で開始されました"
      : "案件オーナーから連絡をお待ちください",
    link: orderLink,
  });

  return NextResponse.json({ success: true, orderId: createdOrderId });
}
