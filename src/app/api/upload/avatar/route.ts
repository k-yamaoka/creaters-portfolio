import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getImageKindFromExt,
  detectImageKindByMagic,
} from "@/lib/upload-validation";
import { stripImageMetadata } from "@/lib/image-sanitize";

/**
 * PORT-016 / PRO-012 / PORT-015: アバター画像 アップロード API。
 *
 * 従来 basic-info-editor.tsx が client SDK で 直接 avatars バケットに upload
 * していたため:
 *   - Content-Type ヘッダ検証のみで magic-number 実体判定なし (拡張子偽装通る)
 *   - EXIF / GPS メタデータが 除去されず 個人特定情報 流出リスク
 * が あった。この route 経由に切替えることで:
 *   1. 拡張子 + Content-Type + magic-number の 3 段検証
 *   2. EXIF / メタデータ 除去 (image-sanitize.ts)
 *   3. Storage policy 認可 (authenticated cookie 継承 + foldername = uid)
 * を server で 一括担保する。
 */

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "ファイルが選択されていません" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "ファイルサイズは5MB以下にしてください" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "JPG / PNG / GIF / WebP のみアップロードできます" },
      { status: 400 }
    );
  }

  const extKind = getImageKindFromExt(file.name);
  if (!extKind) {
    return NextResponse.json(
      { error: "対応していない拡張子です (.jpg / .png / .gif / .webp)" },
      { status: 400 }
    );
  }

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const magicKind = detectImageKindByMagic(head);
  if (!magicKind || magicKind !== extKind) {
    return NextResponse.json(
      { error: "ファイル内容と拡張子が一致しません" },
      { status: 400 }
    );
  }

  // PORT-015: EXIF / メタデータ除去
  const rawBytes = new Uint8Array(await file.arrayBuffer());
  const cleanBytes = stripImageMetadata(rawBytes, magicKind);

  // 00092 の avatars bucket policy に合わせて "{uid}/avatar.<ext>" 固定
  const ext = extKind === "jpeg" ? "jpg" : extKind;
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, cleanBytes, {
      contentType: file.type,
      upsert: true,
      // MOD-028/029: 退会時 avatar 物理削除後の stale CDN cache を短寿命化
      cacheControl: "3600",
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `アップロードに失敗しました: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // 古い CDN キャッシュを無効化するためタイムスタンプ付き URL を返す
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
  return NextResponse.json({ url: publicUrl });
}
