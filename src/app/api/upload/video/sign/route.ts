import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/upload/video/sign
 *
 * Supabase Storage の **署名付きアップロード URL** を発行する。
 *
 * 理由: Vercel Hobby Plan の API ルートは body 上限 4.5MB のため、
 * 動画ファイルを `/api/upload/video` (formData POST) に流すと
 * 100MB 上限まで届かない。
 *
 * 解決策: ブラウザから Supabase Storage へ「直接 PUT」する。
 * サーバーは認証チェック後、署名 URL とパスを返すだけ。
 * 実ファイル転送は Vercel を経由しないので body 上限の影響なし。
 *
 * 流れ:
 *   1. クライアント → POST /api/upload/video/sign { filename, contentType, size }
 *   2. サーバー → 認証チェック + signed URL 発行
 *   3. クライアント → 返却された signedUrl に直接 PUT (ファイル本体)
 *   4. クライアント → portfolio_items に publicUrl を登録
 */

// Supabase Free tier の制約により 50MB が上限
// (Pro 以上にアップしたらここを 100MB or 500MB に拡張)
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { filename?: string; contentType?: string; size?: number }
    | null;

  const contentType = body?.contentType ?? "";
  const size = body?.size ?? 0;

  if (size <= 0 || size > MAX_SIZE) {
    return NextResponse.json(
      { error: "ファイルサイズが 50MB を超えています (Supabase Free tier 制約)" },
      { status: 400 }
    );
  }

  const ext = ALLOWED_MIME[contentType];
  if (!ext) {
    return NextResponse.json(
      { error: "MP4 / WebM / MOV のみアップロードできます" },
      { status: 400 }
    );
  }

  // user_id フォルダ + ランダム ファイル名 (パストラバーサル対策)
  const path = `${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { data: signed, error: signError } = await supabase.storage
    .from("portfolio-videos")
    .createSignedUploadUrl(path);

  if (signError || !signed) {
    console.error("[upload/video/sign] error", signError);
    return NextResponse.json(
      { error: "署名URLの発行に失敗しました" },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("portfolio-videos")
    .getPublicUrl(path);

  return NextResponse.json({
    signedUrl: signed.signedUrl,
    token: signed.token,
    path,
    publicUrl: publicUrlData.publicUrl,
    contentType,
  });
}
