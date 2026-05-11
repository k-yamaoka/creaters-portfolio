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

  const { jobId, creatorId, message, proposed_price } = await request.json();

  // 1. 応募を登録（trigger が application_count を自動同期）
  const { error } = await supabase.from("job_applications").insert({
    job_id: jobId,
    creator_id: creatorId,
    message,
    proposed_price: proposed_price || null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "既にこの案件に応募済みです" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "応募に失敗しました" }, { status: 500 });
  }

  // 2. 案件オーナー(企業)に通知 + システムメッセージ
  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, title, client:client_profiles!jobs_client_id_fkey ( user_id )"
    )
    .eq("id", jobId)
    .single();

  const clientUserId =
    (job?.client as unknown as { user_id: string } | null)?.user_id ?? null;

  if (clientUserId && job) {
    const proposed = proposed_price
      ? `\n提案金額: ¥${Number(proposed_price).toLocaleString()}`
      : "";
    const snippet = (message || "")
      .replace(/\s+/g, " ")
      .slice(0, 140);
    const body = `【新規応募】「${job.title}」に応募が届きました。${proposed}\n\n${snippet}${snippet.length === 140 ? "…" : ""}`;

    await sendSystemMessage({
      senderUserId: user.id,
      receiverUserId: clientUserId,
      content: body,
    });

    await createNotification({
      userId: clientUserId,
      type: "job_application",
      title: `「${job.title}」に新規応募`,
      body: snippet,
      link: `/dashboard/jobs/${jobId}`,
    });
  }

  return NextResponse.json({ success: true });
}
