"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  addPortfolioItem,
  deletePortfolioItem,
  togglePortfolioFeatured,
  toggleOwnPortfolioVisibility,
  updatePortfolioThumbnail,
} from "./actions";
import { GENRES, AI_TOOLS, AI_TOOL_CATEGORIES } from "@/lib/constants";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { TrashIcon } from "@/components/ui/trash-icon";
import { Video } from "lucide-react";
import { useBeforeUnload } from "@/lib/use-before-unload";
import { isAbortError, withAbort } from "@/lib/abort";
import { X } from "lucide-react";

/**
 * 複数ファイル並列アップロード用の 1 ジョブ状態 (UPL-002)。
 *
 * status 遷移: queued → signing → uploading → thumb → done | error
 *   - queued:    ユーザーが選択直後、処理待機中
 *   - signing:   /api/upload/video/sign で署名 token 発行中
 *   - uploading: Supabase Storage への直 PUT 中
 *   - thumb:     動画から 1 フレーム抽出 + /api/upload/thumbnail に POST
 *   - done:      video_url / thumb_url 確定、バッチ INSERT 待ち
 *   - error:     いずれかの段階で失敗 (errorMsg に理由)
 */
type UploadJob = {
  id: string;
  file: File;
  progress: number;
  status:
    | "queued"
    | "signing"
    | "uploading"
    | "thumb"
    | "done"
    | "error"
    | "cancelled";
  videoUrl?: string;
  aspect?: VideoAspect;
  thumbUrl?: string | null;
  errorMsg?: string;
};

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
  // CDET-004: 自主非公開ステータス
  moderation_status?: string | null;
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
  const router = useRouter();
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
  // 複数ファイル並列アップロード (UPL-002)。>1 ファイル選択時のみ使う。
  const [multiJobs, setMultiJobs] = useState<UploadJob[]>([]);
  const [multiUploading, setMultiUploading] = useState(false);
  // UPL-004: 直近の失敗した動画・画像アップロード対象を保持し「再試行」で再送
  const [lastVideoAttempt, setLastVideoAttempt] = useState<File | null>(null);
  const [videoErrorMsg, setVideoErrorMsg] = useState<string | null>(null);
  const [lastImageAttempt, setLastImageAttempt] = useState<File | null>(null);
  const [imageErrorMsg, setImageErrorMsg] = useState<string | null>(null);

  // UPL-005: 単一アップロード中の中断用 AbortController。× ボタンで abort。
  const videoAbortRef = useRef<AbortController | null>(null);
  const imageAbortRef = useRef<AbortController | null>(null);
  // multi upload: job id → AbortController の Map。個別 × / 全キャンセルで参照。
  const multiAbortMapRef = useRef<Map<string, AbortController>>(new Map());

  // UPL-003: いずれかのアップロードが動作中は「戻る/リロード/タブ閉じ」で
  // ブラウザ標準の離脱確認を表示。すべて完了したら自動でリスナ解除。
  useBeforeUnload(uploadingVideo || uploadingImage || multiUploading);
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
    // UPL-004: 再試行状態も一緒にクリア
    setLastVideoAttempt(null);
    setVideoErrorMsg(null);
    setLastImageAttempt(null);
    setImageErrorMsg(null);
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

    // UPL-004: 通信途絶などで失敗した時の再試行元として File を保持。
    // 成功時にクリアするので、常に「直近失敗ぶんだけ」残る。
    setLastVideoAttempt(file);
    setVideoErrorMsg(null);
    setUploadingVideo(true);
    setError(null);
    setUploadProgress(0);

    // UPL-005: 進行中の abort 用 controller。× ボタンで abort。
    const abort = new AbortController();
    videoAbortRef.current = abort;
    const signal = abort.signal;

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
        signal, // UPL-005: キャンセル対応
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
      // UPL-005: SDK は signal を受け付けないため withAbort で UI 側の await
      //   のみ即座に打ち切る。背景 PUT は完了するが、その後の DB INSERT は
      //   実行されず孤児となる (次回 fixMissingThumbnails cron が掃除する)。
      setUploadProgress(50); // SDK は progress イベントを出さないので疑似表示
      const browserSupabase = createBrowserSupabase();
      const { error: uploadError } = await withAbort(
        browserSupabase.storage
          .from("portfolio-videos")
          .uploadToSignedUrl(signData.path, signData.token, file, {
            contentType: file.type,
            upsert: false,
          }),
        signal
      );
      setUploadProgress(100);

      if (uploadError) {
        throw new Error(
          `Supabase Storage アップロード失敗: ${uploadError.message}`
        );
      }

      setUploadedVideoUrl(signData.publicUrl);
      setUploadedVideoAspect(aspect);
      setUploadingVideo(false);
      // 成功したので再試行用の File と エラー文言はクリア
      setLastVideoAttempt(null);
      setVideoErrorMsg(null);
      videoAbortRef.current = null;

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
            signal,
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
      // UPL-005: ユーザーが「×」でキャンセルした場合は AbortError → 静かに
      //   初期状態へ戻す (エラーバナーも出さない)。
      if (isAbortError(e)) {
        setUploadProgress(0);
        setLastVideoAttempt(null);
        setVideoErrorMsg(null);
      } else {
        // UPL-004: 通信途絶 / タイムアウト / Storage エラー等を包括的に補足。
        // videoErrorMsg にメッセージを積み、UI 側の「再試行」ボタンから
        // 直近 lastVideoAttempt を再送できるようにする。
        const msg =
          e instanceof Error && e.message
            ? e.message
            : "アップロードに失敗しました (通信状態をご確認ください)";
        setError(msg);
        setVideoErrorMsg(msg);
      }
    }
    setUploadingVideo(false);
    videoAbortRef.current = null;
  };

  /** UPL-005: 単一動画アップロードのキャンセル */
  const cancelVideoUpload = () => {
    videoAbortRef.current?.abort();
    videoAbortRef.current = null;
    // setUploadingVideo(false) は catch → finally 相当ブロックで行われる
  };

  /**
   * 単一ジョブを (sign → upload → thumb) の順に処理し、状態を都度更新する。
   * 複数ファイル並列アップロード用 (UPL-002)。1 ファイル選択時は handleVideoUpload
   * を使うため呼ばれない。
   */
  const processOneJob = async (job: UploadJob): Promise<UploadJob> => {
    const patch = (p: Partial<UploadJob>) =>
      setMultiJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, ...p } : j))
      );

    // UPL-005: このジョブ専用の abort controller を Map に登録。
    //   × ボタン (cancelMultiJob) や 全キャンセル (cancelAllMultiJobs)
    //   から参照して abort する。
    const abort = new AbortController();
    multiAbortMapRef.current.set(job.id, abort);
    const signal = abort.signal;
    const cleanupAbort = () => multiAbortMapRef.current.delete(job.id);
    const handleAbort = (): UploadJob => {
      cleanupAbort();
      const cancelled: UploadJob = {
        ...job,
        status: "cancelled",
        progress: 0,
        errorMsg: undefined,
      };
      patch({ status: "cancelled", progress: 0, errorMsg: undefined });
      return cancelled;
    };

    // 50MB 制限 (Supabase Free tier に合わせる)
    if (job.file.size > 50 * 1024 * 1024) {
      cleanupAbort();
      const err = `ファイルサイズが 50MB を超えています (${Math.round(job.file.size / 1024 / 1024)}MB)`;
      patch({ status: "error", errorMsg: err });
      return { ...job, status: "error", errorMsg: err };
    }

    // アスペクト比検出
    const aspect = await new Promise<VideoAspect>((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(job.file);
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

    // 1) 署名 URL 発行
    patch({ status: "signing", progress: 5 });
    let signData: {
      token?: string;
      path?: string;
      publicUrl?: string;
      error?: string;
    };
    try {
      const signRes = await fetch("/api/upload/video/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: job.file.name,
          contentType: job.file.type,
          size: job.file.size,
        }),
        signal,
      });
      signData = await signRes.json();
      if (
        !signRes.ok ||
        !signData.token ||
        !signData.path ||
        !signData.publicUrl
      ) {
        throw new Error(signData.error ?? "署名URL取得失敗");
      }
    } catch (e) {
      if (isAbortError(e)) return handleAbort();
      const err = e instanceof Error ? e.message : "署名URL取得に失敗";
      cleanupAbort();
      patch({ status: "error", errorMsg: err });
      return { ...job, status: "error", errorMsg: err };
    }

    // 2) Storage 直 PUT (Supabase SDK は progress を出さないので疑似 50→100)
    patch({ status: "uploading", progress: 50 });
    try {
      const browserSupabase = createBrowserSupabase();
      const { error: uploadError } = await withAbort(
        browserSupabase.storage
          .from("portfolio-videos")
          .uploadToSignedUrl(signData.path!, signData.token!, job.file, {
            contentType: job.file.type,
            upsert: false,
          }),
        signal
      );
      if (uploadError) throw new Error(uploadError.message);
    } catch (e) {
      if (isAbortError(e)) return handleAbort();
      const err = e instanceof Error ? e.message : "アップロード失敗";
      cleanupAbort();
      patch({ status: "error", errorMsg: err });
      return { ...job, status: "error", errorMsg: err };
    }

    // 3) サムネ自動抽出 (失敗しても致命的ではない)
    patch({ status: "thumb", progress: 90, videoUrl: signData.publicUrl, aspect });
    let thumbUrl: string | null = null;
    try {
      const thumbBlob = await extractVideoThumbnail(job.file);
      if (thumbBlob) {
        const tfd = new FormData();
        tfd.append(
          "file",
          new File([thumbBlob], "auto-thumb.jpg", { type: "image/jpeg" })
        );
        const tres = await fetch("/api/upload/thumbnail", {
          method: "POST",
          body: tfd,
          signal,
        });
        const tdata = (await tres.json()) as { url?: string };
        if (tres.ok && tdata.url) thumbUrl = tdata.url;
      }
    } catch (e) {
      if (isAbortError(e)) return handleAbort();
      console.warn("[multi-upload] thumb extraction failed:", e);
    }

    cleanupAbort();
    const done: UploadJob = {
      ...job,
      status: "done",
      progress: 100,
      videoUrl: signData.publicUrl,
      aspect,
      thumbUrl,
    };
    patch({ status: "done", progress: 100, thumbUrl });
    return done;
  };

  /** UPL-005: 特定 multi ジョブをキャンセル */
  const cancelMultiJob = (jobId: string) => {
    const ac = multiAbortMapRef.current.get(jobId);
    if (ac) ac.abort();
    multiAbortMapRef.current.delete(jobId);
  };

  /** UPL-005: 進行中の全 multi ジョブを一括キャンセル */
  const cancelAllMultiJobs = () => {
    for (const [, ac] of multiAbortMapRef.current) ac.abort();
    multiAbortMapRef.current.clear();
  };

  /**
   * 複数ファイル並列アップロード (UPL-002)。>1 ファイル選択時に発火。
   *   - 各ファイルを Promise.all で並列 (sign → PUT → thumb)
   *   - 全完了後、成功分を /api/portfolio/batch で 1 リクエスト INSERT
   *   - タイトルはファイル名 (拡張子除去)、詳細は投稿後に個別編集で埋める運用
   */
  const handleMultiFileUpload = async (files: File[]) => {
    const jobs: UploadJob[] = files.map((f) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      file: f,
      progress: 0,
      status: "queued",
    }));
    setMultiJobs(jobs);
    setMultiUploading(true);
    setError(null);

    const results = await Promise.all(jobs.map((j) => processOneJob(j)));
    const ok = results.filter(
      (r): r is UploadJob & { videoUrl: string } =>
        r.status === "done" && !!r.videoUrl
    );

    if (ok.length > 0) {
      try {
        const batchRes = await fetch("/api/portfolio/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: ok.map((r) => ({
              media_type: "video",
              title:
                r.file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "無題の作品",
              video_url: r.videoUrl,
              video_platform: "mp4",
              thumbnail_url: r.thumbUrl ?? null,
            })),
          }),
        });
        if (!batchRes.ok) {
          const data = (await batchRes.json()) as { error?: string };
          throw new Error(data.error ?? "バッチ投稿失敗");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "バッチ投稿に失敗しました");
        setMultiUploading(false);
        return;
      }
    }

    const failed = results.filter((r) => r.status === "error");
    const cancelled = results.filter((r) => r.status === "cancelled");
    if (failed.length > 0) {
      setError(
        `${failed.length} 件のアップロードに失敗しました (成功: ${ok.length} 件${cancelled.length ? ` / キャンセル: ${cancelled.length} 件` : ""})。下のリストの「再試行」ボタンからやり直せます。`
      );
    }

    // UPL-004: 失敗ジョブは「再試行」ボタン付きで残す。成功分だけ削除。
    // UPL-005: キャンセル済みジョブも list から取り除く (ユーザーの意思で
    //   中断したので UI に残す価値なし)。
    const removeIds = new Set<string>([
      ...ok.map((r) => r.id),
      ...cancelled.map((r) => r.id),
    ]);
    setMultiJobs((prev) => prev.filter((j) => !removeIds.has(j.id)));
    setMultiUploading(false);
    if (ok.length > 0) {
      router.refresh();
      // 全件成功なら フォームを閉じる。失敗が残っていたらフォームを維持し
      // 残ジョブを再試行できるようにする。
      if (failed.length === 0) {
        setShowForm(false);
        resetFormState();
      }
    }
  };

  /**
   * UPL-004: 複数ファイル並列アップロードで失敗した 1 ジョブを再試行する。
   *
   * - 対象 job を queued に戻して processOneJob を再実行
   * - 成功したら 単体で /api/portfolio/batch (1件) に投稿してから
   *   multiJobs から取り除く
   * - 失敗ならエラー状態のまま UI に残す (ユーザーは再度リトライ可)
   */
  const retryMultiJob = async (jobId: string) => {
    const job = multiJobs.find((j) => j.id === jobId);
    if (!job) return;
    // まず対象 job を queued に戻す
    setMultiJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, status: "queued", progress: 0, errorMsg: undefined }
          : j
      )
    );
    const fresh: UploadJob = {
      ...job,
      status: "queued",
      progress: 0,
      errorMsg: undefined,
    };
    const result = await processOneJob(fresh);
    if (result.status !== "done" || !result.videoUrl) return;

    // 個別 INSERT (この 1 件だけ)
    try {
      const batchRes = await fetch("/api/portfolio/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              media_type: "video",
              title:
                result.file.name.replace(/\.[^.]+$/, "").slice(0, 120) ||
                "無題の作品",
              video_url: result.videoUrl,
              video_platform: "mp4",
              thumbnail_url: result.thumbUrl ?? null,
            },
          ],
        }),
      });
      if (!batchRes.ok) {
        const data = (await batchRes.json()) as { error?: string };
        throw new Error(data.error ?? "投稿失敗");
      }
      // 成功: リストから消して残ジョブ数を更新
      setMultiJobs((prev) => prev.filter((j) => j.id !== jobId));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "投稿に失敗";
      setMultiJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: "error", errorMsg: msg } : j
        )
      );
    }
  };

  const handleImageUpload = async (file: File) => {
    // UPL-004: 再試行用に対象 File を保持
    setLastImageAttempt(file);
    setImageErrorMsg(null);
    setUploadingImage(true);
    setError(null);
    // UPL-005: 中断用 controller
    const abort = new AbortController();
    imageAbortRef.current = abort;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: fd,
        signal: abort.signal,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setImageErrorMsg(data.error);
      } else {
        setUploadedImageUrl(data.url);
        setLastImageAttempt(null);
        setImageErrorMsg(null);
      }
    } catch (e) {
      if (isAbortError(e)) {
        // UPL-005: キャンセル時は静かに初期状態へ戻す
        setLastImageAttempt(null);
        setImageErrorMsg(null);
      } else {
        // 通信途絶 / タイムアウトは fetch が TypeError を投げる
        const msg =
          e instanceof Error && e.message
            ? `画像のアップロードに失敗しました (${e.message})`
            : "画像のアップロードに失敗しました (通信状態をご確認ください)";
        setError(msg);
        setImageErrorMsg(msg);
      }
    }
    setUploadingImage(false);
    imageAbortRef.current = null;
  };

  /** UPL-005: 画像アップロードのキャンセル */
  const cancelImageUpload = () => {
    imageAbortRef.current?.abort();
    imageAbortRef.current = null;
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
    // 多重実行ガード — ある作品の削除中に他のゴミ箱を押されてもこのガードで弾く。
    // UI 側でも anyDeleting で全ボタンを disabled にしているが、二重防御。
    if (deleting) return;
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
                    ? "bg-gradient-to-r from-aimovie-navy-900 to-aimovie-ember-500 text-white shadow-[0_0_12px_rgba(255,77,157,0.4)]"
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
                    ? "bg-gradient-to-r from-aimovie-navy-500 to-aimovie-navy-700 text-white shadow-[0_0_12px_rgba(77,213,247,0.4)]"
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
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-aimovie-ember-500 focus:ring-1 focus:ring-aimovie-ember-500"
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
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-aimovie-ember-500 focus:ring-1 focus:ring-aimovie-ember-500"
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
                        loading="lazy"
                        decoding="async"
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
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-aimovie-navy-500/40 bg-aimovie-navy-500/5 px-4 py-10 text-center transition-colors hover:border-aimovie-navy-500 hover:bg-aimovie-navy-500/10 ${
                          uploadingImage
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-aimovie-navy-500/30 border-t-aimovie-navy-500" />
                            <span className="text-xs text-[#828282]">
                              アップロード中...
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-8 w-8 text-aimovie-navy-500"
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
                            <span className="text-sm font-bold text-aimovie-navy-900">
                              クリックして画像を選択
                            </span>
                            <span className="text-[10px] text-[#BDBDBD]">
                              JPG / PNG / WebP(5MB以下)
                            </span>
                          </>
                        )}
                      </label>

                      {/* UPL-005: 画像アップロード中の × キャンセル */}
                      {uploadingImage && (
                        <div className="mt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={cancelImageUpload}
                            className="inline-flex items-center gap-1 rounded-md border border-ink/20 bg-white px-2.5 py-1 text-xs font-medium text-ink/70 transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                            aria-label="アップロードをキャンセル"
                          >
                            <X size={12} strokeWidth={2.2} aria-hidden />
                            キャンセル
                          </button>
                        </div>
                      )}

                      {/* UPL-004: 画像アップロード失敗時の 再試行 */}
                      {!uploadingImage && imageErrorMsg && lastImageAttempt && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-red-700">
                              アップロード失敗
                            </p>
                            <p
                              className="truncate text-red-600/80"
                              title={imageErrorMsg}
                            >
                              {lastImageAttempt.name}: {imageErrorMsg}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void handleImageUpload(lastImageAttempt)
                            }
                            className="shrink-0 rounded-md border border-red-400 bg-white px-3 py-1 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                          >
                            再試行
                          </button>
                        </div>
                      )}
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
                            loading="lazy"
                            decoding="async"
                          />
                        ) : extractingThumb ? (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-green-200 bg-white">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-aimovie-ember-500/30 border-t-aimovie-ember-500" />
                          </div>
                        ) : (
                          <Video size={24} strokeWidth={1.6} className="text-green-700" aria-hidden />
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
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (files.length === 0) return;
                          // 1 ファイル → 詳細フォーム経由の従来フロー
                          // 複数ファイル → 並列アップロード + バッチ INSERT (UPL-002)
                          if (files.length === 1) {
                            void handleVideoUpload(files[0]);
                          } else {
                            void handleMultiFileUpload(files);
                          }
                          // 同じファイルを連続選択できるよう input をリセット
                          e.target.value = "";
                        }}
                        disabled={uploadingVideo || multiUploading}
                        className="hidden"
                        id="portfolio-video-input"
                      />
                      <label
                        htmlFor="portfolio-video-input"
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-aimovie-ember-500/40 bg-aimovie-ember-500/5 px-4 py-10 text-center transition-colors hover:border-aimovie-ember-500 hover:bg-aimovie-ember-500/10 ${
                          uploadingVideo || multiUploading ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        {uploadingVideo ? (
                          <>
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-aimovie-ember-500/30 border-t-aimovie-ember-500" />
                            <span className="text-xs font-bold text-aimovie-navy-900">
                              アップロード中... {uploadProgress}%
                            </span>
                            {uploadProgress > 0 && (
                              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-aimovie-ember-500/20">
                                <div
                                  className="h-full bg-gradient-to-r from-aimovie-navy-900 to-aimovie-ember-500 transition-all"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            )}
                          </>
                        ) : multiUploading ? (
                          <>
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-aimovie-ember-500/30 border-t-aimovie-ember-500" />
                            <span className="text-xs font-bold text-aimovie-navy-900">
                              {multiJobs.filter((j) => j.status === "done").length} /{" "}
                              {multiJobs.length} 完了
                            </span>
                          </>
                        ) : (
                          <>
                            <Video size={36} strokeWidth={1.6} className="text-aimovie-navy-900" aria-hidden />
                            <span className="text-sm font-bold text-aimovie-navy-900">
                              クリックして動画を選択 (複数可)
                            </span>
                            <span className="text-[10px] text-[#BDBDBD]">
                              MP4 / WebM / MOV (1 ファイル 50MB 以下) / 複数選択で並列アップロード + 一括投稿
                            </span>
                          </>
                        )}
                      </label>

                      {/* UPL-005: 単一動画アップロード中の × キャンセル */}
                      {uploadingVideo && (
                        <div className="mt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={cancelVideoUpload}
                            className="inline-flex items-center gap-1 rounded-md border border-ink/20 bg-white px-2.5 py-1 text-xs font-medium text-ink/70 transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                            aria-label="アップロードをキャンセル"
                          >
                            <X size={12} strokeWidth={2.2} aria-hidden />
                            キャンセル
                          </button>
                        </div>
                      )}

                      {/* UPL-005: 複数並列アップロード中の 全キャンセル */}
                      {multiUploading && (
                        <div className="mt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={cancelAllMultiJobs}
                            className="inline-flex items-center gap-1 rounded-md border border-ink/20 bg-white px-2.5 py-1 text-xs font-medium text-ink/70 transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                            aria-label="進行中のアップロードを全てキャンセル"
                          >
                            <X size={12} strokeWidth={2.2} aria-hidden />
                            全キャンセル
                          </button>
                        </div>
                      )}

                      {/* UPL-004: 単一ファイル動画アップロード失敗時の 再試行 */}
                      {!uploadingVideo &&
                        !multiUploading &&
                        videoErrorMsg &&
                        lastVideoAttempt && (
                          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-red-700">
                                アップロード失敗
                              </p>
                              <p
                                className="truncate text-red-600/80"
                                title={videoErrorMsg}
                              >
                                {lastVideoAttempt.name}: {videoErrorMsg}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void handleVideoUpload(lastVideoAttempt)
                              }
                              className="shrink-0 rounded-md border border-red-400 bg-white px-3 py-1 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                            >
                              再試行
                            </button>
                          </div>
                        )}

                      {/* 複数ファイル 並列アップロード時: ファイル毎プログレス */}
                      {multiJobs.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {multiJobs.map((j) => (
                            <li
                              key={j.id}
                              className="flex items-center gap-3 rounded-md border border-aimovie-navy-500/10 bg-white px-3 py-2 text-xs"
                            >
                              <span
                                className="min-w-0 flex-1 truncate font-medium text-aimovie-navy-900"
                                title={j.file.name}
                              >
                                {j.file.name}
                              </span>
                              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-aimovie-navy-500/10">
                                <div
                                  className={`h-full transition-all ${
                                    j.status === "error"
                                      ? "bg-red-500"
                                      : "bg-gradient-to-r from-aimovie-navy-900 to-aimovie-ember-500"
                                  }`}
                                  style={{ width: `${j.progress}%` }}
                                />
                              </div>
                              <span
                                className={`w-16 text-right ${
                                  j.status === "error"
                                    ? "text-red-600"
                                    : j.status === "done"
                                      ? "text-green-600"
                                      : "text-ink-muted"
                                }`}
                                title={j.errorMsg ?? ""}
                              >
                                {j.status === "error"
                                  ? "失敗"
                                  : j.status === "done"
                                    ? "完了"
                                    : j.status === "thumb"
                                      ? "サムネ生成"
                                      : j.status === "uploading"
                                        ? `${j.progress}%`
                                        : j.status === "signing"
                                          ? "準備中"
                                          : "待機"}
                              </span>
                              {/* UPL-004: 失敗ジョブに再試行ボタン */}
                              {j.status === "error" && (
                                <button
                                  type="button"
                                  onClick={() => void retryMultiJob(j.id)}
                                  disabled={multiUploading}
                                  className="shrink-0 rounded-md border border-aimovie-ember-500/50 bg-white px-2 py-0.5 text-[11px] font-bold text-aimovie-ember-500 transition-colors hover:bg-aimovie-ember-500/10 disabled:opacity-40"
                                >
                                  再試行
                                </button>
                              )}
                              {/* UPL-005: 進行中ジョブに × キャンセルボタン */}
                              {(j.status === "queued" ||
                                j.status === "signing" ||
                                j.status === "uploading" ||
                                j.status === "thumb") && (
                                <button
                                  type="button"
                                  onClick={() => cancelMultiJob(j.id)}
                                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-red-50 hover:text-red-600"
                                  aria-label={`${j.file.name} のアップロードをキャンセル`}
                                >
                                  <X size={12} strokeWidth={2.4} aria-hidden />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
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
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-aimovie-ember-500 focus:ring-1 focus:ring-aimovie-ember-500"
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
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-aimovie-ember-500 focus:ring-1 focus:ring-aimovie-ember-500"
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
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-aimovie-ember-500 focus:ring-1 focus:ring-aimovie-ember-500"
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
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-aimovie-ember-500 focus:ring-1 focus:ring-aimovie-ember-500"
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
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-aimovie-ember-500 focus:ring-1 focus:ring-aimovie-ember-500"
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
                                  ? "border-aimovie-navy-700 bg-gradient-to-r from-aimovie-navy-700 to-aimovie-ember-500 text-white"
                                  : "border-[#BDBDBD] bg-white text-[#4F4F4F] hover:border-aimovie-navy-700"
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
                選択中: <span className="font-bold text-aimovie-navy-900">{selectedAiTools.length}</span> 件
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={hasPublishPermission}
                onChange={(e) => setHasPublishPermission(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#BDBDBD] text-aimovie-navy-900 focus:ring-aimovie-ember-500"
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
          <div className="flex items-start gap-3 rounded-xl border border-aimovie-navy-700/20 bg-aimovie-navy-700/10 p-4">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-aimovie-navy-900"
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
            <div className="min-w-0 flex-1 text-sm leading-relaxed text-aimovie-navy-900">
              <p className="font-bold">
                クリエイター一覧に表示する作品: {items.filter((i) => i.is_featured === true).length} / 4 件
              </p>
              <p className="mt-0.5 text-xs text-aimovie-navy-900/80">
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
                anyDeleting={deleting !== null}
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
  anyDeleting,
  onThumbnailUpdated,
  onFeaturedError,
  featuredCount,
}: {
  item: PortfolioItem;
  onDelete: () => void;
  /** この作品自体が削除処理中か (「削除中...」ラベル切替に使う) */
  deleting: boolean;
  /** どの作品でも削除処理が進行中か (全ゴミ箱ボタンを無効化するために使う) */
  anyDeleting: boolean;
  onThumbnailUpdated: () => void;
  onFeaturedError: (msg: string) => void;
  featuredCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // UPL-004: サムネ変更の直近失敗ぶんの File を保持
  const [lastAttempt, setLastAttempt] = useState<File | null>(null);
  // UPL-005: 中断用 controller
  const uploadAbortRef = useRef<AbortController | null>(null);

  // UPL-003: サムネ変更中もページ離脱警告
  useBeforeUnload(uploading);

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

  // CDET-004: 自主非公開 ⇔ 公開再開 の toggle
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const isSelfUnpublished =
    item.moderation_status === "unpublished";
  const isDeletedByAdmin = item.moderation_status === "deleted";
  const handleToggleVisibility = async () => {
    if (togglingVisibility) return;
    setTogglingVisibility(true);
    const res = await toggleOwnPortfolioVisibility(item.id);
    if (res?.error) onFeaturedError(res.error);
    setTogglingVisibility(false);
  };

  const isImage = item.media_type === "image";
  // display_tag が設定されていればそれを最優先 (例: 「商用実績」「縦型 9:16」)
  // 未設定なら platform から自動ラベルを付ける。
  // ※ 自動判定で該当が無い場合に従来の「Other」表示は撤去。
  //   何も意味のないラベルが出るのを防ぐため、バッジ自体を表示しない。
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
              : null;
  const platformLabel = (item.display_tag?.trim() || autoLabel) ?? null;

  const handleUpload = async (file: File) => {
    // UPL-004: 直近失敗ぶんを保持 (再試行時に読む)
    setLastAttempt(file);
    setUploading(true);
    setErrorMsg(null);
    // UPL-005: 中断 controller
    const abort = new AbortController();
    uploadAbortRef.current = abort;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: fd,
        signal: abort.signal,
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        const r = await updatePortfolioThumbnail(item.id, data.url);
        if (r?.error) {
          setErrorMsg(r.error);
        } else {
          setEditing(false);
          setLastAttempt(null);
          onThumbnailUpdated();
        }
      }
    } catch (e) {
      if (isAbortError(e)) {
        // UPL-005: キャンセル時は静かに初期状態へ戻す
        setLastAttempt(null);
        setErrorMsg(null);
      } else {
        // 通信途絶 / タイムアウトを補足
        const msg =
          e instanceof Error && e.message
            ? `アップロードに失敗しました (${e.message})`
            : "アップロードに失敗しました (通信状態をご確認ください)";
        setErrorMsg(msg);
      }
    }
    setUploading(false);
    uploadAbortRef.current = null;
  };

  /** UPL-005: サムネ変更のキャンセル */
  const cancelUpload = () => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
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
        {/* platformLabel が null のときはバッジ自体を出さない (旧「Other」撤去) */}
        {platformLabel && (
          <div
            className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold text-white ${
              isImage ? "bg-gradient-to-r from-aimovie-navy-500 to-aimovie-navy-700" : "bg-black/60"
            }`}
          >
            {platformLabel}
          </div>
        )}
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
          {/* UPL-004: エラー時は 再試行 ボタン付きで表示 */}
          {errorMsg && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-red-700">アップロード失敗</p>
                <p className="truncate text-red-600/80" title={errorMsg}>
                  {errorMsg}
                </p>
              </div>
              {lastAttempt && !uploading && (
                <button
                  type="button"
                  onClick={() => void handleUpload(lastAttempt)}
                  className="shrink-0 rounded-md border border-red-400 bg-white px-3 py-1 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                >
                  再試行
                </button>
              )}
            </div>
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
            className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-aimovie-navy-700/30 bg-white px-4 py-4 text-center transition-colors hover:border-aimovie-ember-500 hover:bg-aimovie-ember-500/10/30 ${
              uploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {uploading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-aimovie-navy-700/30 border-t-aimovie-ember-500" />
                <span className="text-xs text-ink-muted">
                  アップロード中...
                </span>
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 text-aimovie-navy-900"
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
                <span className="text-xs font-bold text-aimovie-navy-900">
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
              // UPL-005: アップロード中なら fetch を abort。完了後は
              //   catch (AbortError) が uploading=false + lastAttempt=null
              //   にリセットする。それ以外はパネルを閉じるだけ。
              if (uploading) {
                cancelUpload();
              } else {
                setEditing(false);
                setErrorMsg(null);
                setLastAttempt(null);
              }
            }}
            className="mt-2 w-full text-center text-[11px] text-ink-muted hover:text-ink"
          >
            {uploading ? "アップロードをキャンセル" : "キャンセル"}
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
          <span className="mt-2 inline-block rounded-pill bg-aimovie-navy-700/10 px-2.5 py-0.5 text-[11px] font-bold text-aimovie-navy-900">
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
                className="rounded-pill bg-gradient-to-r from-aimovie-ember-500/10 to-aimovie-navy-700/10 px-2 py-0.5 text-[10px] font-bold text-aimovie-navy-900"
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
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-aimovie-navy-500 transition-colors hover:text-aimovie-ember-500"
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

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleToggleFeatured}
            disabled={togglingFeatured}
            aria-pressed={item.is_featured}
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
              item.is_featured
                ? "bg-aimovie-ember-500 text-ink hover:bg-aimovie-ember-500/80"
                : "border border-ink/20 bg-white text-ink-muted hover:border-aimovie-ember-500 hover:text-ink"
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
          {/* CDET-004: 自主 公開 / 非公開 の toggle */}
          {!isDeletedByAdmin && (
            <button
              type="button"
              onClick={handleToggleVisibility}
              disabled={togglingVisibility}
              aria-pressed={isSelfUnpublished}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                isSelfUnpublished
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  : "border border-ink/20 bg-white text-ink-muted hover:border-yellow-400 hover:text-yellow-700"
              }`}
              title={
                isSelfUnpublished
                  ? "クリックで公開再開"
                  : "クリックで一時非公開 (一覧・詳細から隠す)"
              }
            >
              {isSelfUnpublished ? "🙈 非公開中" : "🙉 公開中"}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            // ある作品の削除処理中は、画面内のすべての削除ボタンを非活性化する
            // (多重実行バグの根治。handleDelete 側でも早期 return ガード有り)
            disabled={anyDeleting}
            aria-busy={anyDeleting}
            className="inline-flex items-center gap-1.5 text-sm text-red-500 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={anyDeleting ? "削除処理中です" : undefined}
          >
            <TrashIcon className="h-4 w-4" />
            {deleting ? "削除中..." : "削除"}
          </button>
        </div>
      </div>
    </div>
  );
}
