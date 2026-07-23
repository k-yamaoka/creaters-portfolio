import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { notifyAdmin } from "@/lib/admin-notify";
import { sendExternalNotification } from "@/lib/notify-external";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://creaters-portfolio.vercel.app";

/** 通報カテゴリごとの緊急度プレフィックス (件名頭) */
const SUBJECT_PREFIX: Record<string, string> = {
  copyright: "【通報/著作権】",
  impersonation: "【通報/なりすまし】",
  unauthorized_person: "【通報/実在人物 無断生成】",
  inappropriate: "【通報/公序良俗】",
  spam: "【通報/スパム】",
  other: "【通報】",
};

/**
 * POST /api/reports
 *
 * コンテンツ通報を受け付ける。
 *
 * 受付ロジック:
 *   1. ログイン必須 (通報者 profiles.id 取得)
 *   2. 同一 IP から 24h 5 件までの rate-limit (spam 抑止)
 *   3. content_reports に INSERT (ユニークキー: reporter_user_id + target_id で重複弾き)
 *   4. INSERT 後、trigger が unique IP 3 件到達で自動 unpublish
 *   5. 運営に Email + Slack 通知 (作品情報 + 累積通報数 + 対応リンク)
 *
 * body: { target_type: 'portfolio_item', target_id, reason_category, reason_note? }
 */

const VALID_CATEGORIES = new Set([
  "copyright",
  "impersonation",
  "inappropriate",
  "unauthorized_person",
  "spam",
  "other",
]);

const CATEGORY_LABEL: Record<string, string> = {
  copyright: "著作権侵害",
  impersonation: "なりすまし / 他人の作品",
  inappropriate: "公序良俗違反",
  unauthorized_person: "実在人物の無断生成",
  spam: "スパム",
  other: "その他",
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`report:${ip}`, 5, 24 * 3600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "通報の送信回数が上限に達しています。しばらくお待ちください。" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    target_type?: string;
    target_id?: string;
    reason_category?: string;
    reason_note?: string;
  };

  if (body?.target_type !== "portfolio_item" || !body?.target_id) {
    return NextResponse.json(
      { error: "対象コンテンツが不正です" },
      { status: 400 }
    );
  }
  if (!body?.reason_category || !VALID_CATEGORIES.has(body.reason_category)) {
    return NextResponse.json(
      { error: "通報カテゴリを選択してください" },
      { status: 400 }
    );
  }
  const reasonNote =
    typeof body.reason_note === "string"
      ? body.reason_note.slice(0, 2000)
      : null;

  // 対象作品の実在確認 + creator の user_id 取得 (通知メール本文用)
  const { data: target } = await supabase
    .from("portfolio_items")
    .select(
      "id, title, moderation_status, creator:creator_profiles!portfolio_items_creator_id_fkey ( id, user_id, profiles!creator_profiles_user_id_fkey ( display_name ) )"
    )
    .eq("id", body.target_id)
    .maybeSingle();
  if (!target) {
    return NextResponse.json(
      { error: "対象作品が見つかりません" },
      { status: 404 }
    );
  }

  // 通報自体は誰の作品でも実行可能 (自分の作品も通報可 = 誤操作は本人責任)
  // ただし既に deleted なら受付拒否
  if (target.moderation_status === "deleted") {
    return NextResponse.json(
      { error: "この作品は削除済みです" },
      { status: 400 }
    );
  }

  // INSERT (unique index で同一ユーザーの重複は 409)
  const { error: insertErr } = await supabase.from("content_reports").insert({
    target_type: "portfolio_item",
    target_id: body.target_id,
    reporter_user_id: user.id,
    reporter_ip: ip !== "unknown" ? ip : null,
    reason_category: body.reason_category,
    reason_note: reasonNote,
    status: "open",
  });
  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json(
        {
          error:
            "この作品には既に通報を送信済みです。運営の確認をお待ちください。",
        },
        { status: 409 }
      );
    }
    console.error("[reports] insert failed", insertErr);
    return NextResponse.json(
      { error: "通報の送信に失敗しました" },
      { status: 500 }
    );
  }

  // 累積通報数 (open) を集計して運営通知に含める。service_role で bypass。
  //   同時に自動 unpublish 発火状況も判定する (trigger の結果を読み直す)。
  const admin = getSupabaseAdmin();
  const { count: totalOpen } = await admin
    .from("content_reports")
    .select("id", { count: "exact", head: true })
    .eq("target_type", "portfolio_item")
    .eq("target_id", body.target_id)
    .eq("status", "open");

  const { data: afterTarget } = await admin
    .from("portfolio_items")
    .select("moderation_status")
    .eq("id", body.target_id)
    .maybeSingle();

  const targetCreator = (
    target.creator as unknown as {
      id?: string;
      user_id?: string;
      profiles?: { display_name?: string };
    } | null
  ) ?? null;

  // クリエイターの累積通報数 (常習者判定用、view で集計)。エラー無視。
  let creatorReportTotal: number | null = null;
  if (targetCreator?.id) {
    const { data: stats } = await admin
      .from("creator_report_stats")
      .select("report_total")
      .eq("creator_profile_id", targetCreator.id)
      .maybeSingle();
    creatorReportTotal =
      (stats as { report_total?: number } | null)?.report_total ?? null;
  }

  const wasAutoUnpublished =
    afterTarget?.moderation_status === "unpublished";
  const categoryLabel =
    CATEGORY_LABEL[body.reason_category] ?? body.reason_category;
  const workUrl = `${APP_URL}/creators/${targetCreator?.id ?? ""}#portfolio`;

  // 運営通知 (Email + Slack) — 件名の緊急度プレフィックス + 2 ボタン
  await notifyAdmin({
    kind: wasAutoUnpublished ? "auto_unpublish" : "content_report",
    subjectPrefix: wasAutoUnpublished
      ? "【自動非公開】"
      : SUBJECT_PREFIX[body.reason_category] ?? "【通報】",
    subject: wasAutoUnpublished
      ? `${categoryLabel} 3 件で自動非公開: ${target.title ?? "(無題)"}`
      : `${categoryLabel} の申告: ${target.title ?? "(無題)"}`,
    body: wasAutoUnpublished
      ? "異なる IP から 3 件の通報が集まったため、当該作品を自動的に一時非公開にしました。運営で確認 → 復元 / 削除の判断をお願いします。"
      : "コンテンツ通報を受け付けました。累積件数がしきい値に達すると自動非公開になります。",
    link: `/admin/moderation`,
    fields: [
      { label: "作品タイトル", value: target.title ?? "(無題)" },
      { label: "作品 URL", value: workUrl },
      { label: "作品 ID", value: target.id },
      {
        label: "クリエイター",
        value: targetCreator?.profiles?.display_name ?? "(不明)",
      },
      {
        label: "クリエイター累積通報数",
        value:
          creatorReportTotal === null
            ? "-"
            : `${creatorReportTotal} 件${
                creatorReportTotal >= 5 ? " ⚠️常習の疑い" : ""
              }`,
      },
      { label: "通報カテゴリ", value: categoryLabel },
      { label: "累積通報数 (この作品)", value: String(totalOpen ?? "?") },
      {
        label: "現在の状態",
        value: afterTarget?.moderation_status ?? "unknown",
      },
      { label: "通報者コメント", value: reasonNote ?? "(未記入)" },
    ],
    // 2 ボタン: 作品を確認 / 非公開にする (管理画面へ)
    actions: [
      { label: "作品を確認する", path: workUrl, style: "primary" },
      { label: "管理画面で対応", path: "/admin/moderation", style: "danger" },
    ],
  });

  // 通報者への受付自動返信 (§B-2)
  //   誤 BAN 対策として「確認後に対応します」の旨だけを伝える。
  //   結果通知は原則行わない (仕様 §14 詳細非開示)。
  await sendExternalNotification({
    userId: user.id,
    kind: "message",
    subject: "【AILIER】ご通報を受け付けました",
    body: [
      "AILIER 運営です。",
      "",
      `通報いただいた作品「${target.title ?? "(無題)"}」について、内容を確認いたしました。`,
      "運営が事実確認のうえ、必要に応じて処置を実施します。対応完了までしばらくお待ちください。",
      "",
      `【通報カテゴリ】 ${categoryLabel}`,
      "",
      "なお、対応結果の詳細は非開示とさせていただいております。",
      "同一作品への追加通報は受け付けが重複しますのでご遠慮ください。",
      "",
      "AILIER 運営",
    ].join("\n"),
    link: "/help",
  });

  // 自動非公開の場合はクリエイターにも通知 (§1c 誤報保護:
  //   通報時点ではなく "非公開になった時点" で初めて通知)
  if (wasAutoUnpublished && targetCreator?.user_id) {
    await sendExternalNotification({
      userId: targetCreator.user_id,
      kind: "message",
      subject: `【AILIER】あなたの作品「${target.title ?? "(無題)"}」が一時非公開になりました`,
      body: [
        `${targetCreator.profiles?.display_name ?? "クリエイター"} 様`,
        "",
        `あなたの作品「${target.title ?? "(無題)"}」について複数の通報が集まったため、`,
        "運営の確認が完了するまで <b>一時非公開</b> とさせていただきました。",
        "現時点では削除ではなく、データは保持されています。",
        "",
        "【運営の対応】",
        "・運営が内容を確認します",
        "・問題が無ければ再公開いたします",
        "・問題が確認された場合は削除等の措置を検討します",
        "",
        "【異議申立て】",
        "本措置に異議がある場合、または心当たりがない場合は 72 時間以内に",
        "support@ailier.app までご連絡ください。運営で再確認いたします。",
        "",
        "AILIER 運営",
      ].join("\n"),
      link: "/dashboard/portfolio",
    });
  }

  return NextResponse.json({
    ok: true,
    auto_unpublished: wasAutoUnpublished,
    total_open: totalOpen ?? 0,
  });
}
