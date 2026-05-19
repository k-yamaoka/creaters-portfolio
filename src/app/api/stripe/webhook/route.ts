import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Stripe Webhook 受信エンドポイント
 *
 * Stripe 側で起きた状態遷移を DB に伝播させる。
 * クライアント駆動の /api/stripe/payment や /api/stripe/capture では
 * 拾い切れない以下のイベントを正規ルートで反映する:
 *
 *  - payment_intent.succeeded       → escrow_status: held → released は capture API でやるので noop
 *                                     capture が成功した確認用にログだけ残す
 *  - payment_intent.payment_failed  → escrow_status: pending → refunded
 *  - payment_intent.canceled        → escrow_status: pending → refunded
 *  - charge.refunded                → escrow_status: released → refunded
 *  - charge.dispute.created         → 担当者通知 (TODO)
 *
 * 必須環境変数:
 *  - STRIPE_SECRET_KEY (既存)
 *  - STRIPE_WEBHOOK_SECRET (Stripe Dashboard で発行: whsec_xxx)
 *
 * Vercel に登録する URL:
 *  - https://<your-domain>/api/stripe/webhook
 */

// Next.js App Router で raw body を読むために必要
export const dynamic = "force-dynamic";

const RELEVANT_EVENTS = new Set<Stripe.Event.Type>([
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "charge.refunded",
  "charge.dispute.created",
]);

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // 設定漏れは即時に検知したいので 500 を返す
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  // 署名検証には raw body が必要
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[stripe-webhook] invalid signature: ${msg}`);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    // 関係ないイベントは 200 を返して Stripe に retry させない
    return NextResponse.json({ received: true, skipped: true });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        // manual capture が完了した場合、escrow_status を released に。
        // /api/stripe/capture 側の楽観書き込みが失敗していた場合の冪等な補正。
        // 既に released な行には触らない。
        await supabase
          .from("orders")
          .update({
            escrow_status: "released",
            completed_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", pi.id)
          .neq("escrow_status", "released")
          .neq("escrow_status", "refunded");
        break;
      }

      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        // 仮払い前 (pending) または仮払い中に失敗した場合は refunded 扱い。
        // 既に released な order には触らない (二重キャプチャ後の retry など)。
        await supabase
          .from("orders")
          .update({ escrow_status: "refunded" })
          .eq("stripe_payment_intent_id", pi.id)
          .in("escrow_status", ["pending", "held"]);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (piId) {
          await supabase
            .from("orders")
            .update({ escrow_status: "refunded" })
            .eq("stripe_payment_intent_id", piId)
            .neq("escrow_status", "refunded");
        }
        break;
      }

      case "charge.dispute.created": {
        // 担当者通知用のフックポイント (現状はログのみ)
        const dispute = event.data.object as Stripe.Dispute;
        console.error(
          `[stripe-webhook] DISPUTE on charge ${dispute.charge}: ${dispute.reason}`
        );
        // TODO: notifications テーブル経由で管理者に通知
        break;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[stripe-webhook] handler error for ${event.type}: ${msg}`);
    // 500 を返すと Stripe が retry してくれる
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
