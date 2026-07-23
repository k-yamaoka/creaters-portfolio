import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendExternalNotification } from "@/lib/notify-external";
import { revalidatePath } from "next/cache";

/**
 * POST /api/admin/disputes/:id/ruling
 *
 * §B8 (2026-07-21): 運営が dispute を裁定確定する。
 *
 * body: {
 *   ruling_type: 'partial_refund' | 'full_refund' | 'reproduction' | 'no_action' | 'as_is',
 *   ruling_refund_rate?: number (partial_refund / full_refund で必須),
 *   resolution_summary: string (ユーザー向け要約、必須),
 *   internal_note?: string (運営メモ、任意)
 * }
 *
 * 実行内容: 00077 resolve_dispute_with_ruling RPC を叩き、
 *   - dispute を resolved に + ruling_type / rate 記録
 *   - orders.active_dispute_id を解除
 *   - ruling_type に応じて orders を cancel or revision に遷移
 *   - dispute_actions に public な "ruling" 履歴
 * さらに 双方の当事者 (client / creator) に Email で 結果通知。
 *
 * 認可: profiles.role='admin' のみ
 */

type RulingType =
  | "partial_refund"
  | "full_refund"
  | "reproduction"
  | "no_action"
  | "as_is";

const VALID_RULINGS: RulingType[] = [
  "partial_refund",
  "full_refund",
  "reproduction",
  "no_action",
  "as_is",
];

const RULING_LABEL: Record<RulingType, string> = {
  partial_refund: "一部返金",
  full_refund: "全額返金",
  reproduction: "再制作の指示",
  no_action: "申告却下 (証拠不十分)",
  as_is: "満額支払 (仕様どおり判断)",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: disputeId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // admin 認可
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    ruling_type?: string;
    ruling_refund_rate?: number;
    resolution_summary?: string;
    internal_note?: string;
  };
  const rulingType = body.ruling_type as RulingType;
  if (!VALID_RULINGS.includes(rulingType)) {
    return NextResponse.json(
      { error: "ruling_type が不正です" },
      { status: 400 }
    );
  }
  const summary =
    typeof body.resolution_summary === "string"
      ? body.resolution_summary.trim().slice(0, 2000)
      : "";
  if (summary.length === 0) {
    return NextResponse.json(
      { error: "ユーザーへ開示する resolution_summary は必須です" },
      { status: 400 }
    );
  }
  const internalNote =
    typeof body.internal_note === "string"
      ? body.internal_note.slice(0, 5000)
      : null;

  // partial/full refund は rate 必須 + 妥当性チェック
  let rate: number | null = null;
  if (rulingType === "partial_refund" || rulingType === "full_refund") {
    const n = Number(body.ruling_refund_rate);
    if (!Number.isFinite(n) || n < 0 || n > 1) {
      return NextResponse.json(
        {
          error: "ruling_refund_rate は 0.0〜1.0 の数値を指定してください",
        },
        { status: 400 }
      );
    }
    // full_refund は必ず 1.0 に強制
    rate = rulingType === "full_refund" ? 1.0 : n;
  }

  // service_role で atomic 実行
  const admin = getSupabaseAdmin();
  const { data: rpcResult, error: rpcErr } = await admin.rpc(
    "resolve_dispute_with_ruling",
    {
      p_dispute_id: disputeId,
      p_admin_user_id: user.id,
      p_ruling_type: rulingType,
      p_ruling_refund_rate: rate,
      p_resolution_summary: summary,
      p_internal_note: internalNote,
    }
  );
  if (rpcErr) {
    console.error("[admin/dispute/ruling] rpc failed", rpcErr);
    return NextResponse.json(
      { error: `裁定処理に失敗しました: ${rpcErr.message}` },
      { status: 500 }
    );
  }
  const result = rpcResult as { ok?: boolean; reason?: string } | null;
  if (!result?.ok) {
    return NextResponse.json(
      { error: result?.reason ?? "裁定処理に失敗しました" },
      { status: 400 }
    );
  }

  // 当事者への通知メール (order_id → client + creator の user_id を取得)
  const { data: dispute } = await admin
    .from("disputes")
    .select(
      `id, order_id, orders:order_id (
        title, client:client_profiles!orders_client_id_fkey ( user_id ),
        creator:creator_profiles!orders_creator_id_fkey ( user_id )
      )`
    )
    .eq("id", disputeId)
    .maybeSingle();
  const order = (
    dispute as unknown as {
      orders?: {
        title?: string;
        client?: { user_id?: string };
        creator?: { user_id?: string };
      };
    } | null
  )?.orders;
  const notifyTargets: string[] = [];
  if (order?.client?.user_id) notifyTargets.push(order.client.user_id);
  if (order?.creator?.user_id) notifyTargets.push(order.creator.user_id);

  for (const uid of notifyTargets) {
    try {
      await sendExternalNotification({
        userId: uid,
        kind: "message",
        subject: `【AILIER】運営裁定の結果通知 (${
          order?.title ?? "取引"
        })`,
        body: [
          "AILIER 運営です。",
          "",
          `お申し込みいただいていた運営裁定について、以下のとおり判断いたしました。`,
          "",
          `【裁定結果】 ${RULING_LABEL[rulingType]}`,
          rate !== null ? `【返金率】 ${Math.round(rate * 100)}%` : "",
          "",
          `【運営からの説明】`,
          summary,
          "",
          "本判断は合意仕様との照合を基準に行われました。異議申立ては 72 時間",
          "以内に support@ailier.app までご連絡ください。",
        ]
          .filter((s) => s !== undefined && s !== null)
          .join("\n"),
        link: `/dashboard/orders/${dispute?.order_id ?? ""}`,
      });
    } catch (e) {
      // 通知失敗は非致命 (裁定自体は成功済)
      console.error("[admin/dispute/ruling] notify failed", uid, e);
    }
  }

  revalidatePath(`/admin/disputes`);
  revalidatePath(`/admin/disputes/${disputeId}`);
  revalidatePath(`/dashboard/orders/${dispute?.order_id ?? ""}`);

  return NextResponse.json({
    ok: true,
    ruling_type: rulingType,
    ruling_refund_rate: rate,
  });
}
