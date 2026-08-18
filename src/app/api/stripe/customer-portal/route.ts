import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

/**
 * POST /api/stripe/customer-portal
 * client 用: Stripe Customer Portal のセッションを作って redirect URL を返す。
 * client_profiles.stripe_customer_id を用いる。無ければ Customer を新規作成 + 保存。
 * Portal では 領収書 DL / 支払方法変更 / 領収書メール再送 が可能。
 *
 * body: { returnUrl?: string }  (省略時は /dashboard/billing)
 */

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: clientProfile } = await admin
    .from("client_profiles")
    .select("id, stripe_customer_id, company_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!clientProfile) {
    return NextResponse.json(
      { error: "企業ユーザーのみ利用できます" },
      { status: 403 }
    );
  }

  const stripe = getStripe();
  let customerId = clientProfile.stripe_customer_id;

  // 未作成なら Customer を作って保存
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: clientProfile.company_name ?? undefined,
        metadata: { client_profile_id: clientProfile.id },
      });
      customerId = customer.id;
      await admin
        .from("client_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", clientProfile.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      console.error("[customer-portal] customer create failed", msg);
      return NextResponse.json(
        { error: "Stripe Customer の作成に失敗しました" },
        { status: 502 }
      );
    }
  }

  const body = (await request.json().catch(() => ({}))) as {
    returnUrl?: string;
  };
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const returnUrl =
    body.returnUrl && body.returnUrl.startsWith("/")
      ? `${appUrl}${body.returnUrl}`
      : `${appUrl}/dashboard/billing`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[customer-portal] session create failed", msg);
    return NextResponse.json(
      {
        error:
          "Customer Portal セッションの作成に失敗しました。Stripe ダッシュボードで Portal を有効化してください。",
      },
      { status: 502 }
    );
  }
}
