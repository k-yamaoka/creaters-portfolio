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

  const { orderId, creatorId, clientId, rating, comment } =
    await request.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "評価は1〜5で入力してください" },
      { status: 400 }
    );
  }

  // Check order is completed
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (!order || order.status !== "completed") {
    return NextResponse.json(
      { error: "完了済みの取引のみレビューできます" },
      { status: 400 }
    );
  }

  // Check not already reviewed
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_id", orderId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "この取引には既にレビューが投稿されています" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("reviews").insert({
    order_id: orderId,
    client_id: clientId,
    creator_id: creatorId,
    rating,
    comment: comment || "",
  });

  if (error) {
    return NextResponse.json(
      { error: "レビューの投稿に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
