import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "動画ファイルのみアップロードできます" }, { status: 400 });
  }

  // Validate file size (100MB max)
  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "ファイルサイズは100MB以下にしてください" }, { status: 400 });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "mp4";
  const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("portfolio-videos")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json(
      { error: "アップロードに失敗しました。Storageバケットが作成されているか確認してください。" },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: publicUrl } = supabase.storage
    .from("portfolio-videos")
    .getPublicUrl(filename);

  return NextResponse.json({
    url: publicUrl.publicUrl,
    filename,
  });
}
