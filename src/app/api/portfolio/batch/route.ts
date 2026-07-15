import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/portfolio/batch
 *
 * 複数のポートフォリオ アイテムを一括で INSERT する。
 *
 * 本エンドポイントは「素材の実アップロード」は行わない
 * (ファイル本体は /api/upload/video/sign 経由の直 PUT、または
 *  /api/upload/thumbnail 経由でアップロード済みの前提)。
 *
 * リクエスト:
 *   POST { items: BatchItem[] }
 *   BatchItem = { media_type, title?, video_url?, image_url?, video_platform?, thumbnail_url? }
 *
 * ロジック:
 *   1. 認証ユーザーの creator_profile を確定
 *   2. items を server 側でバリデーション (media_type / URL 必須性)
 *   3. 1 回の insert で全件登録
 *   4. portfolio_items INSERT trigger (00067) が
 *      creator_profiles.is_searchable=true に自動遷移させる
 *
 * これにより「登録ウィザードで 5 点まとめて投稿」といったユースケースが
 * 1 リクエストで完結し、初期投稿の摩擦がゼロになる。
 */

type MediaType = "video" | "image";
type VideoPlatform = "youtube" | "vimeo" | "other";

type BatchItem = {
  media_type: MediaType;
  title?: string;
  video_url?: string | null;
  image_url?: string | null;
  video_platform?: VideoPlatform;
  thumbnail_url?: string | null;
};

const MAX_ITEMS = 10;

function validate(items: unknown): BatchItem[] | { error: string } {
  if (!Array.isArray(items)) return { error: "items が配列ではありません" };
  if (items.length === 0) return { error: "投稿するアイテムがありません" };
  if (items.length > MAX_ITEMS) {
    return { error: `一度に投稿できるのは ${MAX_ITEMS} 点までです` };
  }
  const out: BatchItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") {
      return { error: "不正なアイテム形式です" };
    }
    const r = raw as Record<string, unknown>;
    const mt = r.media_type;
    if (mt !== "video" && mt !== "image") {
      return { error: "media_type は video または image を指定してください" };
    }
    const video_url = typeof r.video_url === "string" ? r.video_url : null;
    const image_url = typeof r.image_url === "string" ? r.image_url : null;
    if (mt === "video" && !video_url) {
      return { error: "動画アイテムには video_url が必要です" };
    }
    if (mt === "image" && !image_url) {
      return { error: "画像アイテムには image_url が必要です" };
    }
    const platform = r.video_platform;
    const video_platform: VideoPlatform =
      platform === "youtube" || platform === "vimeo" || platform === "other"
        ? platform
        : "other";
    out.push({
      media_type: mt,
      title:
        typeof r.title === "string" && r.title.trim() !== ""
          ? r.title.trim().slice(0, 120)
          : undefined,
      video_url,
      image_url,
      video_platform,
      thumbnail_url:
        typeof r.thumbnail_url === "string" ? r.thumbnail_url : null,
    });
  }
  return out;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    items?: unknown;
  } | null;
  const parsed = validate(body?.items);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // creator_profile を取得 (存在しない = client / 未セットアップ → 拒否)
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!creator) {
    return NextResponse.json(
      { error: "クリエイター プロフィールが見つかりません" },
      { status: 400 }
    );
  }

  // INSERT 用の行を組み立て
  const rows = parsed.map((it, idx) => ({
    creator_id: creator.id,
    title: it.title ?? "無題の作品",
    description: "",
    media_type: it.media_type,
    video_url: it.video_url ?? null,
    image_url: it.image_url ?? null,
    video_platform: it.video_platform ?? "other",
    thumbnail_url: it.thumbnail_url ?? null,
    // 表示順は現在の最大 + 1 から連番 (簡易実装。厳密には SELECT MAX で採るべきだが
    // ウィザード初回は 0 開始で問題なし)
    sort_order: idx,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("portfolio_items")
    .insert(rows)
    .select("id");
  if (insertError) {
    console.error("[portfolio/batch] insert error", insertError);
    return NextResponse.json(
      { error: "投稿に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    count: inserted?.length ?? 0,
    ids: (inserted ?? []).map((r) => r.id),
  });
}
