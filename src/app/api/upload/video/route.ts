import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getVideoKindFromExt,
  detectVideoKindByMagic,
} from "@/lib/upload-validation";

// Vercel Functions: 動画アップロード用に長め
export const maxDuration = 120;
export const runtime = "nodejs";

// Next.js 15: route segment config で body サイズ上限を明示
// (Vercel Pro: 100MB まで実質可。Hobby は 4.5MB なので注意)
export const dynamic = "force-dynamic";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
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
      { error: "ファイルサイズは100MB以下にしてください" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "MP4 / MOV / WebM のみアップロードできます" },
      { status: 400 }
    );
  }

  const extKind = getVideoKindFromExt(file.name);
  if (!extKind) {
    return NextResponse.json(
      { error: "対応していない拡張子です (.mp4 / .mov / .webm)" },
      { status: 400 }
    );
  }

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const magicKind = detectVideoKindByMagic(head);
  if (!magicKind) {
    return NextResponse.json(
      { error: "動画ファイルとして認識できません" },
      { status: 400 }
    );
  }
  // mp4/mov のブランド差は許容する (拡張子と magic kind が完全一致しなくても
  // 両者の組み合わせなら通す)
  const mp4Compat = extKind === "mp4" || extKind === "mov";
  const magicMp4Compat = magicKind === "mp4" || magicKind === "mov";
  if (!(extKind === magicKind || (mp4Compat && magicMp4Compat))) {
    return NextResponse.json(
      { error: "ファイル内容と拡張子が一致しません" },
      { status: 400 }
    );
  }

  const filename = `${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extKind}`;

  const { error: uploadError } = await supabase.storage
    .from("portfolio-videos")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "アップロードに失敗しました。Storageバケットが作成されているか確認してください。" },
      { status: 500 }
    );
  }

  const { data: publicUrl } = supabase.storage
    .from("portfolio-videos")
    .getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl.publicUrl, filename });
}
