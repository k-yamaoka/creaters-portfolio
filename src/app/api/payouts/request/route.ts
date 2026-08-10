import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import {
  BANK_TRANSFER_FEE,
  MIN_PAYOUT_AMOUNT,
  type PayoutRow,
  computeAvailableBalance,
} from "@/lib/payout";

/**
 * POST /api/payouts/request
 *
 * クリエイターの出金申請を Stripe Connect 経由で実行する。
 *
 * フロー:
 *   1. 認証 + role=creator + Stripe Connect account 接続チェック
 *   2. 未払い orders (escrow=released & payout_status IN pending/scheduled)
 *      を古い順に greedy 選択、要求額に到達するまで積み上げ
 *   3. gross ≥ MIN_PAYOUT_AMOUNT (¥5,000) を検証
 *   4. net = gross - BANK_TRANSFER_FEE (¥250)
 *   5. stripe.payouts.create({ amount: net, currency: 'jpy' }, { stripeAccount })
 *   6. 成功時: 該当 orders を payout_status='paid' + processed_at にし、
 *      payouts テーブルに order 毎に一行 INSERT (stripe_transfer_id=payout.id)
 *
 * エラー:
 *   - 401 未認証 / 403 非 creator / 400 Connect 未接続 or 残高不足
 *   - 502 Stripe API 失敗 (DB は更新しない — リトライ可能)
 */

type Body = { amount?: number };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // creator_profile + Stripe Connect の存在確認
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!creator) {
    return NextResponse.json(
      { error: "クリエイターのみが出金申請できます" },
      { status: 403 }
    );
  }

  // stripe_account_id は migration 00082 で anon/authenticated からは
  // REVOKE 済み。取得は service_role で。
  const admin = getSupabaseAdmin();
  const { data: creatorPriv } = await admin
    .from("creator_profiles")
    .select("stripe_account_id")
    .eq("id", creator.id)
    .maybeSingle();
  const stripeAccountId = creatorPriv?.stripe_account_id;
  if (!stripeAccountId) {
    return NextResponse.json(
      {
        error:
          "銀行口座 (Stripe Connect) が未接続です。プロフィールから接続してください。",
        code: "STRIPE_NOT_CONNECTED",
      },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const requestedAmount =
    typeof body.amount === "number" && Number.isFinite(body.amount)
      ? Math.max(0, Math.floor(body.amount))
      : 0;

  // 対象 orders (未払い) を集計
  const { data: orders } = await admin
    .from("orders")
    .select("id, cancel_creator_payout, base_price, escrow_status, payout_status, inspected_at")
    .eq("creator_id", creator.id)
    .in("payout_status", ["pending", "scheduled"])
    .eq("escrow_status", "released")
    .order("inspected_at", { ascending: true });

  const rows: (PayoutRow & {
    id: string;
    creator_payout: number;
    payoutValue: number;
  })[] = (orders ?? []).map((o) => {
    // cancel 時は cancel_creator_payout が確定額、そうでなければ base_price
    const payoutValue = Math.max(
      0,
      Math.floor(
        (o.cancel_creator_payout as number | null) ?? o.base_price ?? 0
      )
    );
    return {
      id: o.id as string,
      creator_payout: payoutValue,
      payoutValue,
      escrow_status: o.escrow_status as string | null,
      payout_status:
        (o.payout_status as PayoutRow["payout_status"]) ?? "pending",
    };
  });

  const availableBalance = computeAvailableBalance(rows);
  if (availableBalance < MIN_PAYOUT_AMOUNT) {
    return NextResponse.json(
      {
        error: `出金可能残高が最低金額 (¥${MIN_PAYOUT_AMOUNT.toLocaleString()}) 未満です`,
        code: "BELOW_MIN",
      },
      { status: 400 }
    );
  }

  // 要求額が 0 なら全額、cap は残高
  const targetGross =
    requestedAmount === 0
      ? availableBalance
      : Math.min(requestedAmount, availableBalance);
  if (targetGross < MIN_PAYOUT_AMOUNT) {
    return NextResponse.json(
      {
        error: `出金額は ¥${MIN_PAYOUT_AMOUNT.toLocaleString()} 以上を指定してください`,
        code: "BELOW_MIN",
      },
      { status: 400 }
    );
  }

  // greedy に積み上げ (古い順から consume)
  const picked: typeof rows = [];
  let accumulated = 0;
  for (const r of rows) {
    if (accumulated >= targetGross) break;
    picked.push(r);
    accumulated += r.payoutValue;
  }
  const gross = accumulated;
  const net = Math.max(0, gross - BANK_TRANSFER_FEE);

  if (net <= 0) {
    return NextResponse.json(
      { error: "手数料を差し引くと 0 円 になります" },
      { status: 400 }
    );
  }

  // Stripe payout 発行 (connected account)
  const stripe = getStripe();
  let stripePayoutId: string | null = null;
  try {
    const payout = await stripe.payouts.create(
      { amount: net, currency: "jpy" },
      { stripeAccount: stripeAccountId, idempotencyKey: `payout:${creator.id}:${Date.now()}` }
    );
    stripePayoutId = payout.id;
  } catch (e) {
    const err = e as { code?: string; message?: string };
    console.error("[payouts/request] stripe payout FAILED", err);
    return NextResponse.json(
      {
        error:
          err.code === "balance_insufficient"
            ? "Stripe 残高が不足しています。時間をおいて再度お試しください。"
            : `Stripe 出金処理に失敗しました: ${err.message ?? "unknown"}`,
        code: err.code ?? "STRIPE_ERROR",
      },
      { status: 502 }
    );
  }

  // 成功: 該当 orders を paid にし、payouts テーブルに一行ずつ記録
  const processedAt = new Date().toISOString();
  for (const r of picked) {
    await admin
      .from("orders")
      .update({ payout_status: "paid" })
      .eq("id", r.id);
    await admin.from("payouts").insert({
      creator_id: creator.id,
      order_id: r.id,
      amount: r.payoutValue,
      status: "paid",
      stripe_transfer_id: stripePayoutId,
      processed_at: processedAt,
    });
  }

  return NextResponse.json({
    ok: true,
    grossAmount: gross,
    feeAmount: BANK_TRANSFER_FEE,
    netAmount: net,
    ordersCount: picked.length,
    stripePayoutId,
  });
}
