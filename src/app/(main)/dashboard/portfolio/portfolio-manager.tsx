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
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setUploadedUrl(data.url);
      }
    } catch {
      setError("アップロードに失敗しました");
    }
    setUploading(false);
  };

  const handleAdd = async (formData: FormData) => {
    setSaving(true);
    setError(null);

    // If file upload mode, set the uploaded URL
    if (uploadMode === "file" && uploadedUrl) {
      formData.set("video_url", uploadedUrl);
      formData.set("video_platform", "mp4");
    }

    const result = await addPortfolioItem(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      setUploadedUrl(null);
      setUploadMode("url");
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

            {/* Upload mode tabs */}
            <div className="flex gap-2 rounded-lg bg-[#F2F2F2] p-1">
              <button
                type="button"
                onClick={() => setUploadMode("url")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  uploadMode === "url"
                    ? "bg-white text-[#222] shadow-sm"
                    : "text-[#828282]"
                }`}
              >
                URL入力（YouTube/Vimeo）
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  uploadMode === "file"
                    ? "bg-white text-[#222] shadow-sm"
                    : "text-[#828282]"
                }`}
              >
                MP4ファイルをアップロード
              </button>
            </div>

            {uploadMode === "url" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                    動画URL *
                  </label>
                  <input
                    name="video_url"
                    type="url"
                    required={uploadMode === "url"}
                    className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                    プラットフォーム *
                  </label>
                  <select
                    name="video_platform"
                    required={uploadMode === "url"}
                    className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  動画ファイル *
                  <span className="ml-2 text-xs font-normal text-[#BDBDBD]">
                    MP4/WebM/MOV（最大100MB）
                  </span>
                </label>
                {uploadedUrl ? (
                  <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-green-700">アップロード完了</span>
                    <button
                      type="button"
                      onClick={() => setUploadedUrl(null)}
                      className="ml-auto text-xs text-[#828282] hover:text-red-500"
                    >
                      取り消し
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      disabled={uploading}
                      className="hidden"
                      id="video-file-input"
                    />
                    <label
                      htmlFor="video-file-input"
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#E0E0E0] px-4 py-8 text-center transition-colors hover:border-primary-500 hover:bg-primary-50/30 ${
                        uploading ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      {uploading ? (
                        <>
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
                          <span className="text-sm text-[#828282]">
                            アップロード中...
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="h-8 w-8 text-[#BDBDBD]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                          </svg>
                          <span className="text-sm font-medium text-[#4F4F4F]">
                            クリックしてファイルを選択
                          </span>
                          <span className="text-xs text-[#BDBDBD]">
                            または、ドラッグ&ドロップ
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                )}
                {/* Hidden fields for file upload */}
                <input type="hidden" name="video_url" value={uploadedUrl || ""} />
                <input type="hidden" name="video_platform" value="mp4" />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                サムネイルURL
                <span className="ml-2 text-xs font-normal text-[#BDBDBD]">
                  未入力の場合、動画から自動取得します
                </span>
              </label>
              <input
                name="thumbnail_url"
                type="url"
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="空欄で自動取得（YouTube/Vimeo対応）"
              />
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
