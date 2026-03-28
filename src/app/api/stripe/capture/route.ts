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
    .select("*, creator:creator_profiles!orders_creator_id_fkey (stripe_account_id)")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "delivered") {
    return NextResponse.json(
      { error: "Order must be in delivered status" },
      { status: 400 }
    );
  }

  // Capture the held payment if PaymentIntent exists
  if (order.stripe_payment_intent_id) {
    try {
      await getStripe().paymentIntents.capture(order.stripe_payment_intent_id);
    } catch (err) {
      console.error("Stripe capture error:", err);
      // Continue even if capture fails (may already be captured)
    }
  }

  // Update order to completed
  const { error } = await supabase
    .from("orders")
    .update({
      status: "completed",
      escrow_status: "released",
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
