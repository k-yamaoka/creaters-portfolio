import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendExternalNotification } from "@/lib/notify-external";
import { notifyAdmin } from "@/lib/admin-notify";

/**
 * 未納品ペナルティ蓄積による自動停止 cron (00077, 日次)。
 *
 * ロジック:
 *   1. creator_reliability_score view で直近 12 ヶ月 penalty_score >=
 *      SUSPEND_THRESHOLD の creator を抽出
 *   2. 各 creator について auto_suspend_repeat_offender RPC を呼び出し
 *   3. 実際に停止された creator にメール通知 (§18 免責文言 + 異議申立て)
 *   4. 運営にも通知 (件数サマリ)
 *
 * SUSPEND_THRESHOLD = 15:
 *   nondelivery (weight=3) × 5 回相当。
 *   termination_by_creator (weight=1) は多少混ざっても 15 に達するのは
 *   相当な問題パターンのみ。閾値は運用データで調整可能。
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUSPEND_THRESHOLD = 15;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not set" },
      { status: 401 }
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // 1. 閾値超え creator を抽出 (creator_reliability_score view)
  const { data: highScore, error: selectErr } = await supabase
    .from("creator_reliability_score")
    .select("creator_profile_id, penalty_score")
    .gte("penalty_score", SUSPEND_THRESHOLD);
  if (selectErr) {
    return NextResponse.json(
      { ok: false, error: `view select failed: ${selectErr.message}` },
      { status: 500 }
    );
  }

  const suspendedIds: string[] = [];
  const errors: string[] = [];

  // 2. 各対象について RPC で atomic 停止
  for (const row of highScore ?? []) {
    const creatorProfileId = (row as { creator_profile_id: string })
      .creator_profile_id;
    const { data: rpcResult, error: rpcErr } = await supabase.rpc(
      "auto_suspend_repeat_offender",
      { p_creator_profile_id: creatorProfileId, p_threshold: SUSPEND_THRESHOLD }
    );
    if (rpcErr) {
      errors.push(`${creatorProfileId}: ${rpcErr.message}`);
      continue;
    }
    const r = rpcResult as
      | { ok?: boolean; score?: number; user_id?: string; reason?: string }
      | null;
    if (r?.ok && r.user_id) {
      suspendedIds.push(r.user_id);
    }
  }

  // 3. 停止された creator に Email 通知
  for (const userId of suspendedIds) {
    try {
      await sendExternalNotification({
        userId,
        kind: "message",
        subject: "【AILIER】あなたのアカウントは一時停止されました",
        body: [
          "AILIER 運営です。",
          "",
          "あなたのアカウントは、未納品を含むペナルティ蓄積が閾値を超えたため、",
          "システムにより一時停止されました。",
          "",
          "【停止理由】",
          "利用規約 第 6 条の 3 (未納品時の取り扱い) に基づき、直近 12 ヶ月間の",
          "ペナルティ score が閾値を超えました。",
          "",
          "【異議申立て】",
          "本停止に異議がある場合、または再開を希望される場合は、",
          "72 時間以内に support@ailier.app までご連絡ください。",
          "運営で再確認のうえ対応いたします。",
          "",
          "【専門機関の相談窓口】",
          "本件に関する外部相談は /help ページ 「AILIER で解決しない場合の",
          "相談窓口」 セクションをご参照ください。",
        ].join("\n"),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      errors.push(`email to ${userId}: ${msg}`);
    }
  }

  // 4. 運営通知 (件数サマリ)
  if (suspendedIds.length > 0) {
    await notifyAdmin({
      kind: "escalation",
      subject: `自動停止: ${suspendedIds.length} 件のクリエイター`,
      body: `未納品ペナルティ蓄積 (score >= ${SUSPEND_THRESHOLD}) により、${suspendedIds.length} 件のクリエイター アカウントを自動停止しました。詳細は管理画面をご確認ください。`,
      link: "/admin/users",
      fields: [
        { label: "停止件数", value: String(suspendedIds.length) },
        { label: "閾値", value: String(SUSPEND_THRESHOLD) },
      ],
    });
  }

  return NextResponse.json({
    ok: true,
    threshold: SUSPEND_THRESHOLD,
    scanned: highScore?.length ?? 0,
    suspended: suspendedIds.length,
    errors,
  });
}
