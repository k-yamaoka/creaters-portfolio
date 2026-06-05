"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { updateBasicInfo } from "@/app/(main)/dashboard/profile/actions";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB (Storage バケット上限と整合)
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

type Props = {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
  /** ウェルカムバナーの右側に出すサブテキスト (例: "クリエイターアカウント") */
  roleLabel: string;
};

/**
 * ダッシュボード上部の「基本情報」(表示名 + アバター) を編集する Editor。
 *
 * 動作:
 * - 編集モードに入るとアバターをクリックでファイル選択。プレビュー即時反映。
 * - 保存ボタンで以下を順次実行:
 *   1. (画像が変わっていれば) Supabase Storage `avatars` バケットに直接アップ
 *   2. profiles.update を Server Action 経由で実行 (display_name / avatar_url)
 *   3. 成功時は閲覧モードへ戻る
 * - エラーは inline で表示。
 *
 * Vercel の 4.5MB body 制約を避けるため、画像は Supabase SDK で
 * ブラウザから直接 Storage に PUT する (API 経由しない)。
 */
export function BasicInfoEditor({
  userId,
  initialDisplayName,
  initialAvatarUrl,
  roleLabel,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  // 編集中だけ持つ「ローカル選択ファイル」とそのプレビュー URL
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const enterEdit = () => {
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    setDisplayName(initialDisplayName);
    setPendingFile(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
    setAvatarUrl(initialAvatarUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) {
      setError("JPEG / PNG / WebP / GIF のみアップロード可能です");
      return;
    }
    if (f.size > MAX_AVATAR_BYTES) {
      setError("画像は 5MB 以下にしてください");
      return;
    }
    setError(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(f);
    setPendingPreview(URL.createObjectURL(f));
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        const trimmed = displayName.trim();
        if (!trimmed) {
          setError("表示名を入力してください");
          return;
        }
        if (trimmed.length > 40) {
          setError("表示名は 40 文字以内で入力してください");
          return;
        }

        let nextAvatarUrl: string | null | "__keep__" = "__keep__";

        if (pendingFile) {
          // 1) Storage に直接アップロード (avatars/<userId>/avatar.<ext>)
          const supabase = createBrowserClient();
          const ext = pendingFile.name.split(".").pop()?.toLowerCase() || "png";
          const path = `${userId}/avatar.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("avatars")
            .upload(path, pendingFile, {
              cacheControl: "3600",
              upsert: true,
              contentType: pendingFile.type,
            });
          if (upErr) {
            setError(`画像のアップロードに失敗しました: ${upErr.message}`);
            return;
          }
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          // 古いキャッシュを無効化するためタイムスタンプを付与
          nextAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;
        }

        // 2) profiles.update をサーバアクション経由で
        const fd = new FormData();
        fd.set("display_name", trimmed);
        if (nextAvatarUrl !== "__keep__") {
          // signed クエリ付き URL はそのままバリデーション対象だが、許可ホストの
          // path 部分が `avatars/` で始まれば通る (server 側で正規表現一致)
          fd.set("avatar_url", nextAvatarUrl ?? "");
        } else {
          fd.set("avatar_url", "__keep__");
        }
        const res = await updateBasicInfo(fd);
        if (res?.error) {
          setError(res.error);
          return;
        }

        // 3) ローカル状態を確定値に同期して閲覧モードに戻る
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
        setPendingFile(null);
        if (nextAvatarUrl !== "__keep__") setAvatarUrl(nextAvatarUrl);
        setEditing(false);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "予期しないエラーが発生しました"
        );
      }
    });
  };

  // 表示するアバター URL: 編集中はプレビュー優先、それ以外は確定値
  const visibleAvatar = pendingPreview ?? avatarUrl;
  const initial = displayName.trim()[0] ?? "?";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-200 bg-gradient-to-br from-neon-pink/15 to-neon-purple/15 sm:h-24 sm:w-24">
            {visibleAvatar ? (
              // 表示するアバターが http(s) なら next/image を使うが、
              // blob: プレビュー時は素の <img> でないと描けない
              visibleAvatar.startsWith("blob:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={visibleAvatar}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={visibleAvatar}
                  alt={displayName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-neon-purple-deep">
                {initial}
              </div>
            )}
          </div>

          {editing && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-neon-pink text-white shadow-card transition-colors hover:bg-neon-pink/90"
                aria-label="画像を選択"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.823-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                  />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleFileChange}
              />
            </>
          )}
        </div>

        {/* Name + role */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <div>
              <label
                htmlFor="basic_display_name"
                className="mb-1 block text-xs font-medium text-gray-500"
              >
                表示名
              </label>
              <input
                id="basic_display_name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base font-bold text-gray-900 outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink sm:max-w-sm"
                placeholder="例: 山田 太郎"
              />
              <p className="mt-1 text-xs text-gray-500">{roleLabel}</p>
            </div>
          ) : (
            <div>
              <h1 className="truncate text-xl font-black text-gray-900 sm:text-2xl">
                {displayName || "(表示名未設定)"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{roleLabel}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={pending}
                className="rounded-pill border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending}
                className="rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-5 py-2 text-sm font-bold text-white shadow-card transition-shadow hover:shadow-card-hover disabled:opacity-50"
              >
                {pending ? "保存中..." : "保存"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={enterEdit}
              className="inline-flex items-center gap-1.5 rounded-pill border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:border-neon-pink hover:text-neon-pink"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487 18.549 2.799a2.121 2.121 0 1 1 3 3L7.5 19.851l-4.5 1.5 1.5-4.5L16.862 4.487Z"
                />
              </svg>
              基本情報を編集
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </section>
  );
}
