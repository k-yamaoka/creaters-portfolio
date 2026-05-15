import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

// Capture held payment on order completion
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `*,
       client:client_profiles!orders_client_id_fkey ( user_id ),
       creator:creator_profiles!orders_creator_id_fkey ( stripe_account_id )`
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // 認可: capture できるのは支払った client 本人のみ
  const clientUserId = (
    order.client as unknown as { user_id: string } | null
  )?.user_id;
  if (!clientUserId || clientUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "delivered") {
    return NextResponse.json(
      { error: "Order must be in delivered status" },
      { status: 400 }
    );
  }
  // 既に released 済みなら二重キャプチャしない
  if (order.escrow_status === "released") {
    return NextResponse.json(
      { error: "既に検収完了済みです" },
      { status: 409 }
    );
  }

  // Capture the held payment if PaymentIntent exists
  if (order.stripe_payment_intent_id) {
    try {
      await getStripe().paymentIntents.capture(order.stripe_payment_intent_id);
    } catch {
      // Continue even if capture fails (may already be captured)
      // 詳細は Stripe ダッシュボード側で確認すること
    }
  }

  // 検収完了: status は delivered のまま、escrow を released に
  // WHERE 句で escrow_status を絞ることで同時実行時の二重遷移を防ぐ
  const { error, data: updated } = await supabase
    .from("orders")
    .update({
      escrow_status: "released",
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("escrow_status", "released")
    .select("id");

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "既に処理済みです" },
      { status: 409 }
    );
  }

  if (error) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
