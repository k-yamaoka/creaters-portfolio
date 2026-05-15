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

  // Get order with creator's Stripe account + client user_id for authorization
  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      client:client_profiles!orders_client_id_fkey ( user_id ),
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

  // 認可: 支払う側 (client) 本人であること
  const clientUserId = (
    order.client as unknown as { user_id: string } | null
  )?.user_id;
  if (!clientUserId || clientUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "contract") {
    return NextResponse.json(
      { error: "Order must be in contract status" },
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

  // 既に PaymentIntent が紐づいているなら再利用 (ネットワーク再送による二重生成防止)
  if (order.stripe_payment_intent_id) {
    try {
      const existing = await getStripe().paymentIntents.retrieve(
        order.stripe_payment_intent_id
      );
      if (
        existing.status !== "canceled" &&
        existing.status !== "succeeded" &&
        existing.client_secret
      ) {
        return NextResponse.json({ clientSecret: existing.client_secret });
      }
    } catch {
      // 取得失敗時は新規作成にフォールバック
    }
  }

  // Create PaymentIntent with manual capture (hold funds)
  // idempotencyKey は order.id に固定し、ネットワーク再送でも同じ PI を返させる。
  const paymentIntent = await getStripe().paymentIntents.create(
    {
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
    },
    {
      idempotencyKey: `payment-intent:${order.id}`,
    }
  );

  // Save PaymentIntent ID to order (既に同じ ID なら no-op)
  await supabase
    .from("orders")
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq("id", order.id);

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
