import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId, creatorId, message, proposed_price } = await request.json();

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
    return NextResponse.json(
      { error: "応募に失敗しました" },
      { status: 500 }
    );
  }

  // Increment application count
  const { data: job } = await supabase
    .from("jobs")
    .select("application_count")
    .eq("id", jobId)
    .single();

  if (job) {
    await supabase
      .from("jobs")
      .update({ application_count: (job.application_count || 0) + 1 })
      .eq("id", jobId);
  }

  return NextResponse.json({ success: true });
}
