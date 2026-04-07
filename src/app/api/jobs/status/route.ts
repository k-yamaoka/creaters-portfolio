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

  return NextResponse.json({ success: true });
}
