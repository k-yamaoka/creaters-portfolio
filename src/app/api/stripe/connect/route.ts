import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

// Create Stripe Connect account and return onboarding URL
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get creator profile
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return NextResponse.json(
      { error: "Creator profile not found" },
      { status: 404 }
    );
  }

  let accountId = creator.stripe_account_id;

  // Create Stripe Connect Express account if not exists
  if (!accountId) {
    const account = await getStripe().accounts.create({
      type: "express",
      country: "JP",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    accountId = account.id;

    // Save to DB
    await supabase
      .from("creator_profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", creator.id);
  }

  // Create onboarding link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const accountLink = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/dashboard?stripe=refresh`,
    return_url: `${appUrl}/dashboard?stripe=success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

// Check Stripe Connect account status
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!creator?.stripe_account_id) {
    return NextResponse.json({ connected: false });
  }

  const account = await getStripe().accounts.retrieve(creator.stripe_account_id);

  return NextResponse.json({
    connected: true,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
  });
}
