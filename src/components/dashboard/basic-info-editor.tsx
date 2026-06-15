"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { updateBasicInfo } from "@/app/(main)/dashboard/profile/actions";
import { AvatarCropModal } from "./avatar-crop-modal";
import { MIcon } from "@/components/ui/m-icon";

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
  /** クリエイターのみ表示。null = 未設定 (応相談) */
  initialMinimumOrderAmount?: number | null;
  /** クリエイター入力欄を出すか (= viewer が creator のとき true) */
  isCreator?: boolean;
  /** プロフィール充実度 (旧 DashboardCompletenessMeter をバナーに統合) */
  completeness?: { done: number; total: number };
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
  initialMinimumOrderAmount = null,
  isCreator = false,
  completeness,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  // 最低受注金額: 編集中は string で持って空欄も扱う、確定後は number|null へ正規化
  const [minAmountInput, setMinAmountInput] = useState<string>(
    initialMinimumOrderAmount == null ? "" : String(initialMinimumOrderAmount)
  );
  const [minAmountSaved, setMinAmountSaved] = useState<number | null>(
    initialMinimumOrderAmount ?? null
  );
  // 編集中だけ持つ「ローカル選択ファイル」とそのプレビュー URL
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  // 「いまトリミング中の元画像」 — 画像選択直後にモーダル表示するための一時 state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropMime, setCropMime] = useState<string>("image/jpeg");
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
    setMinAmountInput(
      minAmountSaved == null ? "" : String(minAmountSaved)
    );
    setPendingFile(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setAvatarUrl(initialAvatarUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    // 同じファイルを再選択できるよう input を即リセット
    if (e.target) e.target.value = "";
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
    // GIF はアニメーション保持できないので自動的にトリミング後 PNG/JPEG になる旨注記
    // (既存挙動と同じ。トリミング自体は静止画として行われる)
    const url = URL.createObjectURL(f);
    setCropSrc(url);
    setCropMime(f.type);
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleCropConfirm = (blob: Blob) => {
    // トリミング済 Blob を File 化し、pendingFile にセット
    const ext =
      blob.type === "image/png"
        ? "png"
        : blob.type === "image/webp"
          ? "webp"
          : "jpg";
    const file = new File([blob], `avatar.${ext}`, { type: blob.type });

    // 古いプレビュー URL を破棄
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    if (cropSrc) URL.revokeObjectURL(cropSrc);

    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setCropSrc(null);
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

        // 2) 最低受注金額のローカル検証 (クリエイター時のみ)
        let nextMinAmount: number | null = null;
        if (isCreator) {
          const raw = minAmountInput.trim();
          if (raw === "") {
            nextMinAmount = null;
          } else {
            const n = parseInt(raw, 10);
            if (isNaN(n) || n < 0 || n > 9_999_999) {
              setError(
                "最低受注金額は 0 〜 9,999,999 の範囲で入力してください"
              );
              return;
            }
            nextMinAmount = n;
          }
        }

        // 3) profiles.update + creator_profiles.update をサーバアクション経由で
        const fd = new FormData();
        fd.set("display_name", trimmed);
        if (nextAvatarUrl !== "__keep__") {
          // signed クエリ付き URL はそのままバリデーション対象だが、許可ホストの
          // path 部分が `avatars/` で始まれば通る (server 側で正規表現一致)
          fd.set("avatar_url", nextAvatarUrl ?? "");
        } else {
          fd.set("avatar_url", "__keep__");
        }
        if (isCreator) {
          fd.set(
            "minimum_order_amount",
            nextMinAmount == null ? "" : String(nextMinAmount)
          );
        }
        const res = await updateBasicInfo(fd);
        if (res?.error) {
          setError(res.error);
          return;
        }

        // 4) ローカル状態を確定値に同期して閲覧モードに戻る
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
        setPendingFile(null);
        if (nextAvatarUrl !== "__keep__") setAvatarUrl(nextAvatarUrl);
        if (isCreator) setMinAmountSaved(nextMinAmount);
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

        {/* Name + role + 最低受注金額 (クリエイター時のみ) */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-3">
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

              {isCreator && (
                <div>
                  <label
                    htmlFor="basic_min_amount"
                    className="mb-1 block text-xs font-medium text-gray-500"
                  >
                    最低受注金額（円）
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">¥</span>
                    <input
                      id="basic_min_amount"
                      type="number"
                      min={0}
                      max={9999999}
                      step={1000}
                      value={minAmountInput}
                      onChange={(e) => setMinAmountInput(e.target.value)}
                      className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                      placeholder="30000"
                    />
                    <span className="text-sm text-gray-500">〜</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    空欄なら「応相談」表示。クリエイター一覧/詳細に
                    「¥xx,xxx〜」として反映されます。
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h1 className="truncate text-xl font-black text-gray-900 sm:text-2xl">
                {displayName || "(表示名未設定)"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{roleLabel}</p>
              {isCreator && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-neon-pink/10 px-3 py-1 text-xs font-bold text-neon-pink-deep">
                  <MIcon name="payments" size={14} />
                  最低受注金額:{" "}
                  {minAmountSaved == null
                    ? "応相談"
                    : `¥${minAmountSaved.toLocaleString()}〜`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {/* プロフィール充実度 (旧スタンドアロンメーターをバナーに統合)。
            編集モード中は非表示にして混雑を避ける。 */}
        {!editing && completeness && completeness.total > 0 && (
          <ProfileCompletenessMini
            done={completeness.done}
            total={completeness.total}
          />
        )}

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

      {/* アバターのトリミング モーダル — ファイル選択直後に表示 */}
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          mimeType={cropMime}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </section>
  );
}

/**
 * ウェルカムバナー右側に置く「プロフィール充実度」のコンパクト版。
 * - 旧 DashboardCompletenessMeter を縮小して埋め込み。
 * - 円形の % 表示 + 横長プログレスバー + 残り項目数。
 * - クリックで /dashboard/profile (詳細編集) に遷移。
 */
function ProfileCompletenessMini({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const isComplete = pct === 100;
  const remain = total - done;
  const barColor = isComplete
    ? "bg-green-500"
    : pct >= 70
      ? "bg-gradient-to-r from-neon-pink to-green-500"
      : pct >= 40
        ? "bg-gradient-to-r from-neon-pink to-neon-purple"
        : "bg-gradient-to-r from-neon-pink/70 to-neon-pink";
  return (
    <Link
      href="/dashboard/profile"
      title={
        isComplete
          ? "プロフィールは完成済み"
          : `あと ${remain} 項目で完成`
      }
      className="group hidden flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 transition-colors hover:border-neon-pink/40 hover:bg-white sm:flex"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
            プロフィール充実度
          </span>
          <span
            className={`text-xs font-black ${
              isComplete ? "text-green-600" : "text-neon-purple-deep"
            }`}
          >
            {pct}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-[width] duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-gray-500 group-hover:text-gray-700">
          {isComplete ? (
            <>
              <MIcon name="check_circle" fill size={12} className="text-green-600" />
              完成
            </>
          ) : (
            `${done}/${total} 項目入力済 · 残り ${remain} 項目`
          )}
        </p>
      </div>
    </Link>
  );
}
