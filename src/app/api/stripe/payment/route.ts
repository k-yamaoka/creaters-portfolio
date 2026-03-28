import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

// Create PaymentIntent for escrow payment
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();

  // Get order with creator's Stripe account
  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      creator:creator_profiles!orders_creator_id_fkey (
        stripe_account_id
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "accepted") {
    return NextResponse.json(
      { error: "Order must be in accepted status" },
      { status: 400 }
    );
  }

  const creatorData = order.creator as unknown as {
    stripe_account_id: string | null;
  };

  if (!creatorData.stripe_account_id) {
    return NextResponse.json(
      { error: "Creator has not set up Stripe account" },
      { status: 400 }
    );
  }

  // Create PaymentIntent with manual capture (hold funds)
  const paymentIntent = await getStripe().paymentIntents.create({
    amount: order.total_amount,
    currency: "jpy",
    capture_method: "manual", // Hold funds without capturing
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
    },
    transfer_data: {
      destination: creatorData.stripe_account_id,
    },
    application_fee_amount: order.platform_fee,
  });

  // Save PaymentIntent ID to order
  await supabase
    .from("orders")
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq("id", order.id);

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
