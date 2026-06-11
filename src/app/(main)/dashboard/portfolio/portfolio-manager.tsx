"use client";

import { useState } from "react";
import Image from "next/image";
import {
  addPortfolioItem,
  deletePortfolioItem,
  togglePortfolioFeatured,
  updatePortfolioThumbnail,
} from "./actions";
import { GENRES, AI_TOOLS, AI_TOOL_CATEGORIES } from "@/lib/constants";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { TrashIcon } from "@/components/ui/trash-icon";

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  media_type: "video" | "image";
  video_url: string | null;
  video_platform: string;
  image_url: string | null;
  thumbnail_url: string | null;
  genre: string | null;
  tags: string[];
  is_featured?: boolean;
  created_at: string;
  // 00055 で追加された任意フィールド
  used_ai_tools?: string[];
  role_scope?: string | null;
  external_url?: string | null;
  display_tag?: string | null;
};

type MediaType = "video" | "image";

type VideoAspect = "vertical" | "horizontal" | "square";

function detectAspect(width: number, height: number): VideoAspect {
  if (height === 0) return "horizontal";
  const ratio = width / height;
  if (ratio < 0.75) return "vertical";
  if (ratio > 1.3) return "horizontal";
  return "square";
}

/**
 * 動画ファイルから 1 フレームを JPEG として抽出する (クライアント側で完結)。
 * - 全体の 25% (最大 3 秒) の地点をスナップショット
 * - 長辺 1280px にダウンスケール (送信サイズを抑える)
 * - 失敗時は null。理由は console.warn に出力。
 */
async function extractVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    let resolved = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        URL.revokeObjectURL(url);
        video.removeAttribute("src");
        video.load();
      } catch {
        // ignore
      }
    };
    const done = (blob: Blob | null, reason?: string) => {
      if (resolved) return;
      resolved = true;
      if (!blob) {
        console.warn("[thumb] 抽出失敗:", reason ?? "unknown");
      }
      cleanup();
      resolve(blob);
    };

    video.muted = true;
    video.playsInline = true;
    // blob URL は same-origin なので crossOrigin は不要 (むしろ干渉する)
    video.preload = "auto";

    const drawFrame = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w === 0 || h === 0) return done(null, "videoWidth/Height=0");
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) return done(null, "canvas 2d context null");
        ctx.drawImage(video, 0, 0, cw, ch);
        canvas.toBlob(
          (blob) => done(blob, blob ? undefined : "toBlob returned null"),
          "image/jpeg",
          0.85
        );
      } catch (e) {
        done(null, `drawImage exception: ${(e as Error).message}`);
      }
    };

    let seeked = false;
    video.onloadedmetadata = () => {
      const dur = video.duration;
      // duration が 不明/0/Infinity の動画もあるので fallback
      const target = isFinite(dur) && dur > 0
        ? Math.min(Math.max(0.1, dur * 0.25), 3)
        : 0.1;
      try {
        video.currentTime = target;
      } catch {
        drawFrame();
      }
    };
    video.onseeked = () => {
      if (seeked) return;
      seeked = true;
      drawFrame();
    };
    // 一部ブラウザ (iOS Safari 等) で seeked が来ないケース用フォールバック
    video.onloadeddata = () => {
      // 800ms 待っても seeked が来なければそのまま描画
      setTimeout(() => {
        if (!seeked && !resolved) {
          seeked = true;
          drawFrame();
        }
      }, 800);
    };
    video.onerror = () => done(null, `video error: ${video.error?.code}`);
    // 30 秒で諦める
    timeoutId = setTimeout(() => done(null, "30s timeout"), 30_000);
    video.src = url;
  });
}

export function PortfolioManager({ items }: { items: PortfolioItem[] }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("video");
  const [uploadedThumbUrl, setUploadedThumbUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractingThumb, setExtractingThumb] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedVideoAspect, setUploadedVideoAspect] =
    useState<VideoAspect | null>(null);
  const [hasPublishPermission, setHasPublishPermission] = useState(false);
  // 使用 AI ツール (作品単位、複数選択)
  const [selectedAiTools, setSelectedAiTools] = useState<string[]>([]);
  const toggleFormAiTool = (name: string) =>
    setSelectedAiTools((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );

  const resetFormState = () => {
    setMediaType("video");
    setUploadedThumbUrl(null);
    setUploadedImageUrl(null);
    setUploadedVideoUrl(null);
    setUploadedVideoAspect(null);
    setUploadProgress(0);
    setHasPublishPermission(false);
    setSelectedAiTools([]);
  };

  /**
   * 動画ファイルアップロード。
   * - クライアント側で video element に load してアスペクト比を検出
   * - XHR で /api/upload/video に POST し progress を表示
   */
  const handleVideoUpload = async (file: File) => {
    // 早期チェック: 50MB 制限 (Supabase Free tier)
    if (file.size > 50 * 1024 * 1024) {
      setError(
        `ファイルサイズが 50MB を超えています (現在: ${Math.round(file.size / 1024 / 1024)}MB)。動画を圧縮してから再度お試しください。`
      );
      return;
    }

    setUploadingVideo(true);
    setError(null);
    setUploadProgress(0);

    // アスペクト比を先に検出
    const aspect = await new Promise<VideoAspect>((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const a = detectAspect(video.videoWidth, video.videoHeight);
        URL.revokeObjectURL(url);
        resolve(a);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("horizontal");
      };
      video.src = url;
    });

    try {
      // 1) サーバーから署名付きアップロード token + path を発行
      const signRes = await fetch("/api/upload/video/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const signData = (await signRes.json()) as {
        token?: string;
        path?: string;
        publicUrl?: string;
        error?: string;
      };
      if (!signRes.ok || !signData.token || !signData.path || !signData.publicUrl) {
        throw new Error(signData.error ?? "署名URL取得失敗");
      }

      // 2) Supabase SDK の uploadToSignedUrl を使用 (ブラウザから直接 PUT)
      //    XHR の生 PUT は Supabase のリクエスト形式と差異があり 400 になるため。
      setUploadProgress(50); // SDK は progress イベントを出さないので疑似表示
      const browserSupabase = createBrowserSupabase();
      const { error: uploadError } = await browserSupabase.storage
        .from("portfolio-videos")
        .uploadToSignedUrl(signData.path, signData.token, file, {
          contentType: file.type,
          upsert: false,
        });
      setUploadProgress(100);

      if (uploadError) {
        throw new Error(
          `Supabase Storage アップロード失敗: ${uploadError.message}`
        );
      }

      setUploadedVideoUrl(signData.publicUrl);
      setUploadedVideoAspect(aspect);
      setUploadingVideo(false);

      // 3) サムネ自動抽出 + アップロード (失敗してもメイン処理は止めない)
      setExtractingThumb(true);
      try {
        const thumbBlob = await extractVideoThumbnail(file);
        if (!thumbBlob) {
          console.warn("[thumb] 抽出 blob が null");
        } else {
          const tfd = new FormData();
          const thumbFile = new File([thumbBlob], "auto-thumb.jpg", {
            type: "image/jpeg",
          });
          tfd.append("file", thumbFile);
          const tres = await fetch("/api/upload/thumbnail", {
            method: "POST",
            body: tfd,
          });
          const tdata = (await tres.json()) as {
            url?: string;
            error?: string;
          };
          if (tres.ok && tdata.url) {
            setUploadedThumbUrl(tdata.url);
          } else {
            console.warn("[thumb] アップロード失敗:", tdata.error);
          }
        }
      } catch (e) {
        console.warn("[thumb] 例外:", (e as Error).message);
      }
      setExtractingThumb(false);
      return;
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました");
    }
    setUploadingVideo(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setUploadedImageUrl(data.url);
      }
    } catch {
      setError("画像のアップロードに失敗しました");
    }
    setUploadingImage(false);
  };

  const handleAdd = async (formData: FormData) => {
    setSaving(true);
    setError(null);

    formData.set("media_type", mediaType);
    formData.set("has_publish_permission", hasPublishPermission ? "1" : "");

    if (mediaType === "image") {
      // 画像アイテム: image_url をセット
      if (!uploadedImageUrl) {
        setError("画像をアップロードしてください");
        setSaving(false);
        return;
      }
      formData.set("image_url", uploadedImageUrl);
    } else {
      // 動画アイテム: 必ずアップロード済み MP4 を使用 (SNS 埋め込みは廃止)
      if (!uploadedVideoUrl) {
        setError("動画ファイルをアップロードしてください");
        setSaving(false);
        return;
      }
      formData.set("video_url", uploadedVideoUrl);
      formData.set("video_platform", "mp4");
      if (uploadedVideoAspect) {
        formData.set("aspect_ratio", uploadedVideoAspect);
      }
      // サムネは自動抽出で uploadedThumbUrl がセットされる
      if (uploadedThumbUrl) {
        formData.set("thumbnail_url", uploadedThumbUrl);
      }
    }

    // 使用 AI ツールを multipart で送る
    selectedAiTools.forEach((t) => formData.append("used_ai_tools", t));

    const result = await addPortfolioItem(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      resetFormState();
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

          {/* Media type tabs: 動画 / 画像 */}
          <div className="mb-6">
            <div className="inline-flex gap-1 rounded-pill bg-[#F2F2F2] p-1">
              <button
                type="button"
                onClick={() => setMediaType("video")}
                className={`rounded-pill px-5 py-2 text-xs font-bold transition-colors ${
                  mediaType === "video"
                    ? "bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-[0_0_12px_rgba(255,77,157,0.4)]"
                    : "text-[#828282] hover:text-[#222]"
                }`}
              >
                ▶ 動画
              </button>
              <button
                type="button"
                onClick={() => setMediaType("image")}
                className={`rounded-pill px-5 py-2 text-xs font-bold transition-colors ${
                  mediaType === "image"
                    ? "bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-[0_0_12px_rgba(77,213,247,0.4)]"
                    : "text-[#828282] hover:text-[#222]"
                }`}
              >
                ◧ 静止画
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#BDBDBD]">
              {mediaType === "video"
                ? "YouTube / Vimeo / TikTok / Instagram の埋め込みURLで動画を登録します"
                : "AI生成バナー・商品ビジュアル等の静止画ファイル(JPG/PNG/WebP)をアップロードします"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                placeholder={
                  mediaType === "image"
                    ? "作品タイトル(例: コスメD2C 春バナー A案)"
                    : "作品のタイトル"
                }
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                説明
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                placeholder={
                  mediaType === "image"
                    ? "作品のコンセプト・制作背景など"
                    : "作品の概要や制作の背景"
                }
              />
            </div>

            {mediaType === "image" ? (
              <>
                {/* === 画像アップロード === */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#4F4F4F]">
                    画像ファイル <span className="text-red-500">*</span>
                  </label>
                  {uploadedImageUrl ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadedImageUrl}
                        alt="ポートフォリオ画像"
                        className="h-24 w-24 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700">
                          アップロード完了
                        </p>
                        <p className="mt-0.5 text-xs text-green-600/80">
                          そのままポートフォリオに表示されます
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedImageUrl(null)}
                        className="text-xs text-[#828282] hover:text-red-500"
                      >
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
                          if (file) handleImageUpload(file);
                        }}
                        disabled={uploadingImage}
                        className="hidden"
                        id="portfolio-image-input"
                      />
                      <label
                        htmlFor="portfolio-image-input"
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-neon-cyan/40 bg-neon-cyan/5 px-4 py-10 text-center transition-colors hover:border-neon-cyan hover:bg-neon-cyan/10 ${
                          uploadingImage
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan" />
                            <span className="text-xs text-[#828282]">
                              アップロード中...
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-8 w-8 text-neon-cyan"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                              />
                            </svg>
                            <span className="text-sm font-bold text-neon-purple-deep">
                              クリックして画像を選択
                            </span>
                            <span className="text-[10px] text-[#BDBDBD]">
                              JPG / PNG / WebP(5MB以下)
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* === 動画ファイルアップロード (SNS 埋め込みは廃止) === */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#4F4F4F]">
                    動画ファイル <span className="text-red-500">*</span>
                  </label>
                  {uploadedVideoUrl ? (
                    <div className="space-y-3 rounded-lg border border-green-300 bg-green-50 p-3">
                      <div className="flex items-center gap-3">
                        {uploadedThumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={uploadedThumbUrl}
                            alt="自動抽出サムネ"
                            className="h-16 w-16 shrink-0 rounded-md border border-green-200 object-cover"
                          />
                        ) : extractingThumb ? (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-green-200 bg-white">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon-pink/30 border-t-neon-pink" />
                          </div>
                        ) : (
                          <span className="text-xl">🎬</span>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700">
                            アップロード完了
                          </p>
                          <p className="mt-0.5 text-xs text-green-600/80">
                            アスペクト比: {uploadedVideoAspect ?? "判定不可"}
                            {uploadedThumbUrl
                              ? " / サムネ自動抽出済"
                              : extractingThumb
                                ? " / サムネ生成中…"
                                : " / サムネ生成失敗(動画は保存されます)"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedVideoUrl(null);
                            setUploadedVideoAspect(null);
                            setUploadedThumbUrl(null);
                          }}
                          className="text-xs text-[#828282] hover:text-red-500"
                        >
                          取り消し
                        </button>
                      </div>
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video
                        src={uploadedVideoUrl}
                        controls
                        muted
                        playsInline
                        className="w-full rounded-md bg-black"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleVideoUpload(file);
                        }}
                        disabled={uploadingVideo}
                        className="hidden"
                        id="portfolio-video-input"
                      />
                      <label
                        htmlFor="portfolio-video-input"
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-neon-pink/40 bg-neon-pink/5 px-4 py-10 text-center transition-colors hover:border-neon-pink hover:bg-neon-pink/10 ${
                          uploadingVideo ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        {uploadingVideo ? (
                          <>
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-pink/30 border-t-neon-pink" />
                            <span className="text-xs font-bold text-neon-purple-deep">
                              アップロード中... {uploadProgress}%
                            </span>
                            {uploadProgress > 0 && (
                              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neon-pink/20">
                                <div
                                  className="h-full bg-gradient-to-r from-neon-pink to-neon-purple transition-all"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-3xl">🎬</span>
                            <span className="text-sm font-bold text-neon-purple-deep">
                              クリックして動画を選択
                            </span>
                            <span className="text-[10px] text-[#BDBDBD]">
                              MP4 / WebM / MOV (50MB 以下)
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  ジャンル
                </label>
                <select
                  name="genre"
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
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
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                  placeholder="カンマ区切り: 企業VP, ドローン"
                />
              </div>
            </div>

            {/* 担当範囲 + サムネタグ + 外部リンク */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  担当範囲
                </label>
                <input
                  name="role_scope"
                  type="text"
                  maxLength={200}
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                  placeholder="例: プロンプト生成 + 動画編集"
                />
                <p className="mt-1 text-[11px] text-[#828282]">
                  企業が「どこまで対応できるか」を判断するための情報
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  サムネ可変タグ
                </label>
                <input
                  name="display_tag"
                  type="text"
                  maxLength={20}
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                  placeholder="例: 商用実績 / 縦型"
                />
                <p className="mt-1 text-[11px] text-[#828282]">
                  未設定なら自動判定 (YouTube 等)
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                外部リンク URL <span className="text-[11px] font-normal text-[#828282]">(任意)</span>
              </label>
              <input
                name="external_url"
                type="url"
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="mt-1 text-[11px] text-[#828282]">
                作品の YouTube / X / Web ページなど、追加で公開するリンク
              </p>
            </div>

            {/* 使用 AI ツール — カテゴリ別 */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                使用 AI ツール <span className="text-[11px] font-normal text-[#828282]">(複数選択可)</span>
              </label>
              <div className="space-y-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-3">
                {AI_TOOL_CATEGORIES.map((cat) => {
                  const tools = AI_TOOLS.filter((t) => t.category === cat);
                  if (tools.length === 0) return null;
                  return (
                    <div key={cat}>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#828282]">
                        {cat}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tools.map((t) => {
                          const active = selectedAiTools.includes(t.name);
                          return (
                            <button
                              key={t.name}
                              type="button"
                              onClick={() => toggleFormAiTool(t.name)}
                              className={`rounded-pill border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                active
                                  ? "border-neon-purple bg-gradient-to-r from-neon-purple to-neon-pink text-white"
                                  : "border-[#BDBDBD] bg-white text-[#4F4F4F] hover:border-neon-purple"
                              }`}
                            >
                              {t.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-[#828282]">
                選択中: <span className="font-bold text-neon-purple-deep">{selectedAiTools.length}</span> 件
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={hasPublishPermission}
                onChange={(e) => setHasPublishPermission(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#BDBDBD] text-neon-purple-deep focus:ring-neon-pink"
              />
              <div className="text-sm leading-relaxed text-[#4F4F4F]">
                <span className="font-bold text-[#222]">
                  この作品はクライアントから掲載許諾を得ています
                </span>
                <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500 align-middle">
                  必須
                </span>
                <p className="mt-1 text-xs text-[#828282]">
                  権利関係を確認し、クライアントから本作品のポートフォリオ掲載について許諾を得ていることを確認しました。
                </p>
              </div>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetFormState();
              }}
              className="btn-white text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                !hasPublishPermission ||
                (mediaType === "image" && !uploadedImageUrl)
              }
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
        <>
          <div className="flex items-start gap-3 rounded-xl border border-neon-purple/20 bg-neon-purple/10 p-4">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-neon-purple-deep"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
              />
            </svg>
            <div className="min-w-0 flex-1 text-sm leading-relaxed text-neon-purple-deep">
              <p className="font-bold">
                クリエイター一覧に表示する作品: {items.filter((i) => i.is_featured === true).length} / 4 件
              </p>
              <p className="mt-0.5 text-xs text-neon-purple-deep/80">
                「★ 表示する」ボタンで切り替え。最大4件まで選択でき、企業のクリエイター一覧画面のサムネイル行に表示されます。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <PortfolioCard
                key={item.id}
                item={item}
                onDelete={() => handleDelete(item.id)}
                deleting={deleting === item.id}
                onThumbnailUpdated={() => setError(null)}
                onFeaturedError={(msg) => setError(msg)}
                featuredCount={items.filter((i) => i.is_featured === true).length}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 既存ポートフォリオ1件。サムネが NULL のときは「サムネイルを追加」、
 * 既に存在しているときも「サムネ変更」で差し替え可能にする。
 */
function PortfolioCard({
  item,
  onDelete,
  deleting,
  onThumbnailUpdated,
  onFeaturedError,
  featuredCount,
}: {
  item: PortfolioItem;
  onDelete: () => void;
  deleting: boolean;
  onThumbnailUpdated: () => void;
  onFeaturedError: (msg: string) => void;
  featuredCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggleFeatured = async () => {
    if (togglingFeatured) return;
    // 4件選択済みで OFF → ON にしようとしたらブロック (DB制約もあるが UX のため事前チェック)
    if (!item.is_featured && featuredCount >= 4) {
      onFeaturedError("表示できる作品は最大4件までです");
      return;
    }
    setTogglingFeatured(true);
    const res = await togglePortfolioFeatured(item.id, !item.is_featured);
    if (res?.error) onFeaturedError(res.error);
    setTogglingFeatured(false);
  };

  const isImage = item.media_type === "image";
  // display_tag が設定されていればそれを最優先で出す (例: 「商用実績」「縦型 9:16」)
  // 未設定なら従来の platform 表示にフォールバック
  const autoLabel = isImage
    ? "画像"
    : item.video_platform === "youtube"
      ? "YouTube"
      : item.video_platform === "youtube_short"
        ? "Short"
        : item.video_platform === "vimeo"
          ? "Vimeo"
          : item.video_platform === "tiktok"
            ? "TikTok"
            : item.video_platform === "instagram"
              ? "Insta"
              : "Other";
  const platformLabel = (item.display_tag?.trim() || autoLabel) as string;

  const handleUpload = async (file: File) => {
    setUploading(true);
    setErrorMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        const r = await updatePortfolioThumbnail(item.id, data.url);
        if (r?.error) setErrorMsg(r.error);
        else {
          setEditing(false);
          onThumbnailUpdated();
        }
      }
    } catch {
      setErrorMsg("アップロードに失敗しました");
    }
    setUploading(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
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
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#828282]">
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
              />
            </svg>
            <span className="text-[11px] font-bold text-[#828282]">
              サムネ未設定
            </span>
          </div>
        )}
        <div
          className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold text-white ${
            isImage ? "bg-gradient-to-r from-neon-cyan to-neon-purple" : "bg-black/60"
          }`}
        >
          {platformLabel}
        </div>
        {/* サムネ変更ボタン (右上) — 画像アイテムは差し替え不要 */}
        {!isImage && (
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-pill bg-white/95 px-2.5 py-1 text-[10px] font-bold text-ink shadow-soft transition-colors hover:bg-white"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
            />
          </svg>
          {item.thumbnail_url ? "サムネ変更" : "サムネ追加"}
        </button>
        )}
      </div>

      {/* サムネ編集パネル(動画のみ) */}
      {!isImage && editing && (
        <div className="border-b border-ink/10 bg-paper-deep/40 p-4">
          {errorMsg && (
            <p className="mb-2 text-xs text-red-600">{errorMsg}</p>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            id={`thumb-input-${item.id}`}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            disabled={uploading}
          />
          <label
            htmlFor={`thumb-input-${item.id}`}
            className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-neon-purple/30 bg-white px-4 py-4 text-center transition-colors hover:border-neon-pink hover:bg-neon-pink/10/30 ${
              uploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {uploading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon-purple/30 border-t-neon-pink" />
                <span className="text-xs text-ink-muted">
                  アップロード中...
                </span>
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 text-neon-purple-deep"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                  />
                </svg>
                <span className="text-xs font-bold text-neon-purple-deep">
                  画像を選択して差し替え
                </span>
                <span className="text-[10px] text-ink-soft">
                  JPG / PNG / WebP（5MB以下）
                </span>
              </>
            )}
          </label>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setErrorMsg(null);
            }}
            className="mt-2 w-full text-center text-[11px] text-ink-muted hover:text-ink"
          >
            キャンセル
          </button>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-bold text-[#222]">{item.title}</h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-[#828282]">
            {item.description}
          </p>
        )}
        {item.genre && (
          <span className="mt-2 inline-block rounded-pill bg-neon-purple/10 px-2.5 py-0.5 text-[11px] font-bold text-neon-purple-deep">
            {item.genre}
          </span>
        )}

        {/* 担当範囲 — 自由記述 */}
        {item.role_scope && (
          <p className="mt-2 text-[11px] text-[#4F4F4F]">
            <span className="font-bold text-[#828282]">担当範囲: </span>
            {item.role_scope}
          </p>
        )}

        {/* 使用 AI ツール — チップ */}
        {item.used_ai_tools && item.used_ai_tools.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.used_ai_tools.slice(0, 6).map((t) => (
              <span
                key={t}
                className="rounded-pill bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 px-2 py-0.5 text-[10px] font-bold text-neon-purple-deep"
              >
                {t}
              </span>
            ))}
            {item.used_ai_tools.length > 6 && (
              <span className="rounded-pill bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                +{item.used_ai_tools.length - 6}
              </span>
            )}
          </div>
        )}

        {/* 外部リンク */}
        {item.external_url && (
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-neon-cyan transition-colors hover:text-neon-pink"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            外部リンク
          </a>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleToggleFeatured}
            disabled={togglingFeatured}
            aria-pressed={item.is_featured}
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
              item.is_featured
                ? "bg-neon-pink text-ink hover:bg-neon-pink/80"
                : "border border-ink/20 bg-white text-ink-muted hover:border-neon-pink hover:text-ink"
            }`}
            title={
              item.is_featured
                ? "クリックで一覧表示から外す"
                : "クリエイター一覧のサムネイル行に表示する"
            }
          >
            <span aria-hidden>★</span>
            {item.is_featured ? "表示中" : "表示する"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-sm text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            {deleting ? "削除中..." : "削除"}
          </button>
        </div>
      </div>
    </div>
  );
}
