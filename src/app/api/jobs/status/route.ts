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

  const { jobId, status } = await request.json();

  if (!["open", "closed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", jobId);

  if (error) {
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }

  // 締切時のバックストップ: accepted応募があるのに order が無い場合は自動生成
  if (status === "closed") {
    const { data: job } = await supabase
      .from("jobs")
      .select(
        `
        id, title, description, budget_max, budget_min,
        client:client_profiles!jobs_client_id_fkey ( id, user_id )
      `
      )
      .eq("id", jobId)
      .single();

    if (job) {
      const { data: accepted } = await supabase
        .from("job_applications")
        .select(
          `id, proposed_price, creator:creator_profiles!job_applications_creator_id_fkey ( id, user_id )`
        )
        .eq("job_id", jobId)
        .eq("status", "accepted");

      const client = job.client as unknown as {
        id: string;
        user_id: string;
      } | null;

      for (const a of accepted ?? []) {
        const creator = a.creator as unknown as {
          id: string;
          user_id: string;
        } | null;
        if (!client || !creator) continue;

        // 既にこの (client, creator, title) の order があればスキップ
        const { data: existing } = await supabase
          .from("orders")
          .select("id")
          .eq("client_id", client.id)
          .eq("creator_id", creator.id)
          .eq("title", job.title)
          .limit(1);
        if (existing && existing.length > 0) continue;

        const totalAmount =
          (a.proposed_price as number | null) ??
          job.budget_max ??
          job.budget_min ??
          0;
        const platformFee = Math.floor(Number(totalAmount) * 0.15);
        const creatorPayout = Number(totalAmount) - platformFee;

        const { data: order } = await supabase
          .from("orders")
          .insert({
            client_id: client.id,
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

        if (order) {
          await sendSystemMessage({
            senderUserId: client.user_id,
            receiverUserId: creator.user_id,
            content: `【案件移行】「${job.title}」が締切となり、取引(相談中)が開始されました。\n/dashboard/orders/${order.id}`,
            orderId: order.id,
          });
          await createNotification({
            userId: creator.user_id,
            type: "job_accepted",
            title: `「${job.title}」取引開始`,
            body: "取引が「相談中」で開始されました",
            link: `/dashboard/orders/${order.id}`,
          });
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}
