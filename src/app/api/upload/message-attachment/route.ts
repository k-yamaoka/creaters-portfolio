import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getImageKindFromExt,
  detectImageKindByMagic,
  getDocKindFromExt,
  detectDocKindByMagic,
} from "@/lib/upload-validation";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
// チャット添付は PNG / JPEG / PDF のみ許可
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

// メッセージ添付ファイルのアップロード。
// 既存の portfolio-videos バケットを共用し、messages/{user_id}/ 配下に置く。
// (専用バケットを切らないのは MVP の運用シンプル化が目的。URL はランダムなので
//  unguessable で、portfolio thumbnails と同じ公開アクセスモデル)
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
      { error: "ファイルサイズは10MB以下にしてください" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "PNG / JPEG / PDF のみアップロードできます" },
      { status: 400 }
    );
  }

  // 拡張子 + マジックナンバー検証で MIME 偽装を弾く
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  let kind: "jpg" | "png" | "pdf" | null = null;
  if (file.type === "application/pdf") {
    const docExt = getDocKindFromExt(file.name);
    const docMagic = detectDocKindByMagic(head);
    if (!docExt || !docMagic) {
      return NextResponse.json(
        { error: "ファイル内容と拡張子が一致しません" },
        { status: 400 }
      );
    }
    kind = "pdf";
  } else {
    const imgExt = getImageKindFromExt(file.name);
    const imgMagic = detectImageKindByMagic(head);
    if (!imgExt || !imgMagic || imgExt !== imgMagic) {
      return NextResponse.json(
        { error: "ファイル内容と拡張子が一致しません" },
        { status: 400 }
      );
    }
    if (imgExt !== "jpeg" && imgExt !== "png") {
      return NextResponse.json(
        { error: "PNG / JPEG のみアップロードできます" },
        { status: 400 }
      );
    }
    kind = imgExt === "jpeg" ? "jpg" : "png";
  }

  // 一意ファイル名 (パストラバーサル安全: user.id とランダム値のみ)
  const filename = `messages/${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${kind}`;

  const { error: uploadError } = await supabase.storage
    .from("portfolio-videos")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }

  const { data: publicUrl } = supabase.storage
    .from("portfolio-videos")
    .getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl.publicUrl, kind });
}
