"use client";

import { useState } from "react";
import Image from "next/image";
import { addPortfolioItem, deletePortfolioItem } from "./actions";
import { GENRES } from "@/lib/constants";

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  video_platform: string;
  thumbnail_url: string | null;
  genre: string | null;
  tags: string[];
  created_at: string;
};

export function PortfolioManager({ items }: { items: PortfolioItem[] }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [thumbnailMode, setThumbnailMode] = useState<"auto" | "url" | "upload">("auto");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadedThumbUrl, setUploadedThumbUrl] = useState<string | null>(null);

  const handleThumbUpload = async (file: File) => {
    setUploadingThumb(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setUploadedThumbUrl(data.url);
      }
    } catch {
      setError("サムネイルのアップロードに失敗しました");
    }
    setUploadingThumb(false);
  };

  const handleAdd = async (formData: FormData) => {
    setSaving(true);
    setError(null);

    const videoUrl = formData.get("video_url") as string;

    // Validate URL format
    if (!videoUrl || (!videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be") && !videoUrl.includes("vimeo.com") && !videoUrl.includes("tiktok.com") && !videoUrl.includes("instagram.com"))) {
      setError("YouTube、Vimeo、TikTok、InstagramのURLを入力してください");
      setSaving(false);
      return;
    }

    // Set uploaded thumbnail URL if upload mode
    if (thumbnailMode === "upload" && uploadedThumbUrl) {
      formData.set("thumbnail_url", uploadedThumbUrl);
    }

    const result = await addPortfolioItem(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      setUploadedThumbUrl(null);
      setThumbnailMode("auto");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この作品を削除しますか？")) return;
    setDeleting(id);
    const result = await deletePortfolioItem(id);
    if (result?.error) {
      setError(result.error);
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-primary text-sm"
        >
          + 作品を追加
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <form
          action={handleAdd}
          className="rounded-2xl bg-white p-6 shadow-card sm:p-8"
        >
          <h2 className="mb-6 text-lg font-bold text-[#222]">新しい作品</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                タイトル *
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="作品のタイトル"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                説明
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="作品の概要や制作の背景"
              />
            </div>

            {/* URL input only - no file upload */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <p className="text-xs text-blue-700">
                  著作権保護のため、動画ファイルの直接アップロードには対応していません。YouTube、Vimeo、TikTok、Instagramの埋め込みURLを入力してください。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  動画URL *
                </label>
                <input
                  name="video_url"
                  type="url"
                  required
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="mt-1 text-xs text-[#BDBDBD]">
                  YouTube / Vimeo / TikTok / Instagram
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  プラットフォーム *
                </label>
                <select
                  name="video_platform"
                  required
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="youtube">YouTube</option>
                  <option value="youtube_short">YouTube ショート（縦型）</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="tiktok">TikTok（縦型）</option>
                  <option value="instagram">Instagram（縦型）</option>
                  <option value="other">その他</option>
                </select>
              </div>
            </div>

            {/* Thumbnail section */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#4F4F4F]">
                サムネイル
                {selectedPlatform === "instagram" || selectedPlatform === "tiktok" ? (
                  <span className="ml-2 text-xs font-normal text-red-500">* TikTok/Instagramは画像アップロード推奨</span>
                ) : (
                  <span className="ml-2 text-xs font-normal text-[#BDBDBD]">YouTube/Vimeoは自動取得可</span>
                )}
              </label>

              {/* Thumbnail mode tabs */}
              <div className="mb-3 flex gap-1 rounded-lg bg-[#F2F2F2] p-1">
                <button type="button" onClick={() => setThumbnailMode("auto")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${thumbnailMode === "auto" ? "bg-white text-[#222] shadow-sm" : "text-[#828282]"}`}>
                  自動取得
                </button>
                <button type="button" onClick={() => setThumbnailMode("upload")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${thumbnailMode === "upload" ? "bg-white text-[#222] shadow-sm" : "text-[#828282]"}`}>
                  画像アップロード
                </button>
                <button type="button" onClick={() => setThumbnailMode("url")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${thumbnailMode === "url" ? "bg-white text-[#222] shadow-sm" : "text-[#828282]"}`}>
                  URL入力
                </button>
              </div>

              {thumbnailMode === "auto" && (
                <div className="rounded-lg border border-[#E0E0E0] bg-[#F8F8F8] px-4 py-3 text-sm text-[#828282]">
                  YouTube / Vimeo / TikTok は動画から自動取得します
                  <input type="hidden" name="thumbnail_url" value="" />
                </div>
              )}

              {thumbnailMode === "url" && (
                <input
                  name="thumbnail_url"
                  type="url"
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="サムネイル画像のURLを入力"
                />
              )}

              {thumbnailMode === "upload" && (
                <div>
                  {uploadedThumbUrl ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3">
                      <img src={uploadedThumbUrl} alt="サムネイル" className="h-16 w-16 rounded object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700">アップロード完了</p>
                      </div>
                      <button type="button" onClick={() => setUploadedThumbUrl(null)}
                        className="text-xs text-[#828282] hover:text-red-500">
                        取り消し
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbUpload(file);
                        }}
                        disabled={uploadingThumb}
                        className="hidden"
                        id="thumb-file-input"
                      />
                      <label
                        htmlFor="thumb-file-input"
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#E0E0E0] px-4 py-6 text-center transition-colors hover:border-primary-500 hover:bg-primary-50/30 ${uploadingThumb ? "pointer-events-none opacity-50" : ""}`}
                      >
                        {uploadingThumb ? (
                          <>
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
                            <span className="text-xs text-[#828282]">アップロード中...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-6 w-6 text-[#BDBDBD]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                            </svg>
                            <span className="text-xs font-medium text-[#4F4F4F]">クリックして画像を選択</span>
                            <span className="text-[10px] text-[#BDBDBD]">JPG / PNG / WebP（5MB以下）</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                  <input type="hidden" name="thumbnail_url" value={uploadedThumbUrl || ""} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  ジャンル
                </label>
                <select
                  name="genre"
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">選択してください</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  タグ
                </label>
                <input
                  name="tags"
                  type="text"
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="カンマ区切り: 企業VP, ドローン"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-white text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? "追加中..." : "追加する"}
            </button>
          </div>
        </form>
      )}

      {/* Items list */}
      {items.length === 0 && !showForm ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-card">
          <svg
            className="mx-auto h-12 w-12 text-[#E0E0E0]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-bold text-[#222]">
            まだ作品がありません
          </h3>
          <p className="mt-2 text-sm text-[#828282]">
            「作品を追加」ボタンからポートフォリオを登録しましょう
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl bg-white shadow-card"
            >
              <div className="relative aspect-video bg-[#F2F2F2]">
                {item.thumbnail_url ? (
                  <Image
                    src={item.thumbnail_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#BDBDBD]">
                    <svg
                      className="h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                  </div>
                )}
                {/* Platform badge */}
                <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  {item.video_platform === "youtube" ? "YouTube" : item.video_platform === "youtube_short" ? "Short" : item.video_platform === "vimeo" ? "Vimeo" : item.video_platform === "tiktok" ? "TikTok" : item.video_platform === "instagram" ? "Insta" : "Other"}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#222]">{item.title}</h3>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[#828282]">
                    {item.description}
                  </p>
                )}
                {item.genre && (
                  <span className="mt-2 inline-block rounded-pill bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-500">
                    {item.genre}
                  </span>
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleting === item.id ? "削除中..." : "削除"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
