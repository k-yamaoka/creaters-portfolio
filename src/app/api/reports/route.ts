import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { notifyAdmin } from "@/lib/admin-notify";

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
      "id, title, moderation_status, creator:creator_profiles!portfolio_items_creator_id_fkey ( id, profiles!creator_profiles_user_id_fkey ( display_name ) )"
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
      profiles?: { display_name?: string };
    } | null
  ) ?? null;

  // 運営通知 (Email + Slack)
  await notifyAdmin({
    kind: afterTarget?.moderation_status === "unpublished"
      ? "auto_unpublish"
      : "content_report",
    subject:
      afterTarget?.moderation_status === "unpublished"
        ? `通報 3 件で自動非公開: ${target.title ?? "(無題)"}`
        : `通報を受け付け: ${target.title ?? "(無題)"}`,
    body:
      afterTarget?.moderation_status === "unpublished"
        ? "異なる IP から 3 件の通報が集まったため、当該作品を自動的に一時非公開にしました。運営で確認 → 復元 / 削除の判断をお願いします。"
        : "コンテンツ通報を受け付けました。累積件数がしきい値に達すると自動非公開になります。",
    link: `/admin/moderation`,
    fields: [
      { label: "作品タイトル", value: target.title ?? "(無題)" },
      { label: "作品 ID", value: target.id },
      {
        label: "クリエイター",
        value: targetCreator?.profiles?.display_name ?? "(不明)",
      },
      {
        label: "通報カテゴリ",
        value: CATEGORY_LABEL[body.reason_category] ?? body.reason_category,
      },
      { label: "累積通報数 (open)", value: String(totalOpen ?? "?") },
      {
        label: "現在の状態",
        value: afterTarget?.moderation_status ?? "unknown",
      },
      { label: "通報者理由", value: reasonNote ?? "(未記入)" },
    ],
  });

  return NextResponse.json({
    ok: true,
    auto_unpublished: afterTarget?.moderation_status === "unpublished",
    total_open: totalOpen ?? 0,
  });
}
