import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { computePayoutScheduleDate } from "@/lib/payout";

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
  "payment_intent.requires_action",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
  // creator 出金 (Connect payout) 追跡:
  //   POST /api/payouts/request が stripe.payouts.create → ここで最終補正
  "payout.paid",
  "payout.failed",
  "account.updated",
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
        // 00066: 冗長補正時も payout schedule を同じロジックで確定
        const inspectedAt = new Date();
        await supabase
          .from("orders")
          .update({
            escrow_status: "released",
            completed_at: inspectedAt.toISOString(),
            inspected_at: inspectedAt.toISOString(),
            payout_scheduled_date: computePayoutScheduleDate(inspectedAt),
            payout_status: "scheduled",
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
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId =
          typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
        console.error(
          `[stripe-webhook] DISPUTE on charge ${chargeId}: ${dispute.reason}`
        );
        // 該当 order を逆引き (dispute は PaymentIntent 経由で紐付く)
        const piId =
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id;
        let orderId: string | undefined;
        if (piId) {
          const { data: ord } = await supabase
            .from("orders")
            .select("id, title")
            .eq("stripe_payment_intent_id", piId)
            .single();
          orderId = ord?.id;
        }
        try {
          const { notifyAdmin } = await import("@/lib/admin-notify");
          await notifyAdmin({
            kind: "escalation",
            subjectPrefix: "【緊急/チャージバック】",
            subject: `Stripe dispute 発生 (reason: ${dispute.reason})`,
            body:
              `カード会社経由のチャージバックが発生しました。\n\n` +
              `理由: ${dispute.reason}\n` +
              `金額: ${dispute.amount} ${dispute.currency}\n` +
              `Charge: ${chargeId ?? "不明"}\n` +
              `PaymentIntent: ${piId ?? "不明"}\n` +
              (orderId ? `Order: ${orderId}\n` : "") +
              `\n証拠提出期限: ${
                dispute.evidence_details?.due_by
                  ? new Date(dispute.evidence_details.due_by * 1000).toLocaleString("ja-JP")
                  : "Stripe ダッシュボードを確認"
              }`,
            fields: [
              { label: "理由", value: dispute.reason },
              { label: "ステータス", value: dispute.status },
            ],
            actions: orderId
              ? [
                  {
                    label: "取引を確認",
                    path: `/admin/orders/${orderId}`,
                    style: "danger",
                  },
                ]
              : [],
          });
        } catch (e) {
          console.error("[stripe-webhook] notifyAdmin failed", e);
        }
        break;
      }

      case "charge.dispute.closed": {
        // dispute の 決着 (won / lost / warning_closed) を運営に共有
        const dispute = event.data.object as Stripe.Dispute;
        const piId =
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id;
        let orderId: string | undefined;
        if (piId) {
          const { data: ord } = await supabase
            .from("orders")
            .select("id")
            .eq("stripe_payment_intent_id", piId)
            .single();
          orderId = ord?.id;
        }
        try {
          const { notifyAdmin } = await import("@/lib/admin-notify");
          await notifyAdmin({
            kind: "info",
            subjectPrefix: "【チャージバック 決着】",
            subject: `Stripe dispute 決着: ${dispute.status}`,
            body:
              `Status: ${dispute.status}\n` +
              (orderId ? `Order: ${orderId}\n` : "") +
              `Dispute: ${dispute.id}\n` +
              `Amount: ${dispute.amount} ${dispute.currency}`,
            actions: orderId
              ? [{ label: "取引を確認", path: `/admin/orders/${orderId}` }]
              : [],
          });
        } catch (e) {
          console.error("[stripe-webhook] dispute.closed notify failed", e);
        }
        break;
      }

      case "payment_intent.requires_action": {
        // 3D セキュア等の追加認証待ち。ユーザーには Stripe Payment Sheet 側で
        // 処理されるはずだが、放置されるとエスクロー が入らないので運営に情報通知。
        const pi = event.data.object as Stripe.PaymentIntent;
        console.info(
          `[stripe-webhook] payment_intent.requires_action pi=${pi.id} client=${pi.client_secret ? "yes" : "no"}`
        );
        break;
      }

      // ---- Payout / Connect Account 系 (creator 出金の追跡) ----
      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        // stripe_transfer_id が一致する payouts 行を paid にマーク済のはずだが、
        // Stripe 側完了通知として payouts テーブルを補正 (webhook のみで到達するケース)
        await supabase
          .from("payouts")
          .update({ status: "paid", processed_at: new Date().toISOString() })
          .eq("stripe_transfer_id", payout.id);
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        // 出金失敗 → payouts を failed に + orders.payout_status を戻す
        const { data: payoutRows } = await supabase
          .from("payouts")
          .select("id, order_id")
          .eq("stripe_transfer_id", payout.id);
        await supabase
          .from("payouts")
          .update({ status: "failed" })
          .eq("stripe_transfer_id", payout.id);
        for (const row of payoutRows ?? []) {
          await supabase
            .from("orders")
            .update({ payout_status: "scheduled" })
            .eq("id", row.order_id);
        }
        // 運営 escalation
        try {
          const { notifyAdmin } = await import("@/lib/admin-notify");
          await notifyAdmin({
            kind: "escalation",
            subjectPrefix: "【緊急/出金失敗】",
            subject: `Stripe payout failed: ${payout.failure_message ?? "unknown"}`,
            body:
              `Payout ID: ${payout.id}\n` +
              `Amount: ¥${payout.amount.toLocaleString()}\n` +
              `Failure: ${payout.failure_code ?? "-"} / ${payout.failure_message ?? "-"}\n` +
              `該当 orders は payout_status=scheduled に差し戻し済 (再申請可能)`,
          });
        } catch {}
        break;
      }

      case "account.updated": {
        // Connect account の状態変化 (KYC 完了 / 差戻し 等) を検知
        const account = event.data.object as Stripe.Account;
        // 支払い停止相当なら運営に通知 (payouts_enabled=false / requirements 未提出)
        if (account.requirements?.disabled_reason || !account.payouts_enabled) {
          try {
            const { notifyAdmin } = await import("@/lib/admin-notify");
            await notifyAdmin({
              kind: "info",
              subjectPrefix: "【Connect】",
              subject: `Stripe Connect account の支払いが無効化: ${account.id}`,
              body:
                `Disabled reason: ${account.requirements?.disabled_reason ?? "unknown"}\n` +
                `payouts_enabled: ${account.payouts_enabled}\n` +
                `charges_enabled: ${account.charges_enabled}`,
            });
          } catch {}
        }
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
