"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { updateCoverImage } from "@/app/(main)/dashboard/profile/actions";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB (cover は大きめを許容)
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

type Props = {
  userId: string;
  initialCoverUrl: string | null;
};

/**
 * プロフィール上部に置くカバー画像エディタ。
 *
 * - 16:5 のヒーロー帯としてプレビュー
 * - 「変更」: ファイルピッカー → Storage `avatars` バケットにアップ
 *   → `creator_profiles.cover_image_url` を更新
 * - 「外す」: DB の cover_image_url を null に
 * - アバターと同じバケット (avatars) を相乗りで使う
 *   (key prefix: `<userId>/cover.<ext>`)
 */
export function CoverImageEditor({ userId, initialCoverUrl }: Props) {
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) {
      setError("JPEG / PNG / WebP のみアップロード可能です");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("画像は 8MB 以下にしてください");
      return;
    }
    setError(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(URL.createObjectURL(f));

    startTransition(async () => {
      try {
        const supabase = createBrowserClient();
        const ext =
          f.type === "image/png"
            ? "png"
            : f.type === "image/webp"
              ? "webp"
              : "jpg";
        const path = `${userId}/cover.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, f, { upsert: true, contentType: f.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        const finalUrl = `${data.publicUrl}?t=${Date.now()}`;
        const res = await updateCoverImage(finalUrl);
        if (res?.error) throw new Error(res.error);
        setCoverUrl(finalUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "アップロードに失敗しました");
      } finally {
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
      }
    });
  };

  const handleRemove = () => {
    if (pending) return;
    if (!confirm("カバー画像を外しますか？")) return;
    startTransition(async () => {
      try {
        const res = await updateCoverImage(null);
        if (res?.error) throw new Error(res.error);
        setCoverUrl(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  };

  const showUrl = pendingPreview ?? coverUrl;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-card">
      {/* プレビュー帯 (16:5) */}
      <div className="relative aspect-[16/5] w-full bg-gradient-to-br from-neon-midnight-deep via-neon-purple-deep/70 to-neon-pink/40">
        {showUrl ? (
          <Image
            src={showUrl}
            alt="カバー画像"
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/80">
              <svg
                aria-hidden
                className="mx-auto h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <p className="mt-1 text-xs">カバー画像が未設定です</p>
            </div>
          </div>
        )}
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-bold text-white">
            処理中...
          </div>
        )}
      </div>

      {/* 操作 */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#4F4F4F]">
          <p className="font-bold text-[#222]">カバー画像</p>
          <p className="text-xs text-[#828282]">
            クリエイター詳細ページ上部のヒーロー背景に表示されます (推奨 1600×500 / 8MB 以下)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            className="rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-5 py-2 text-xs font-bold text-white shadow-card transition-shadow hover:shadow-card-hover disabled:opacity-50"
          >
            {coverUrl ? "画像を変更" : "画像を設定"}
          </button>
          {coverUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={pending}
              className="rounded-pill border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              外す
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPick}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-5 mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </div>
      )}
    </section>
  );
}
