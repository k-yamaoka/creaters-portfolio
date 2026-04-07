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

  const { applicationId, status } = await request.json();

  if (!["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Update application status
  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
