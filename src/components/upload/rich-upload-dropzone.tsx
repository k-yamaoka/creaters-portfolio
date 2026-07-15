"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Link as LinkIcon, X, Film, Image as ImageIcon, Loader2 } from "lucide-react";

/**
 * ポートフォリオ用リッチ アップロード コンポーネント。
 *
 * 対応:
 *   - タブ切替: 「ファイルアップロード」 / 「URL 埋め込み」
 *   - D&D + クリック選択 (react-dropzone)
 *   - 画像 (JPG/PNG/GIF/WEBP) + 動画 (MP4/WEBM/MOV) の同時複数選択
 *   - 選択したファイルのサムネイル/ファイル名/サイズを一括プレビュー
 *   - URL 入力 (YouTube / Vimeo) → oEmbed 形式で自動サムネイル抽出
 *
 * 呼び出し側の責務:
 *   - 実際のアップロード (Supabase Storage 直 PUT 等) は上位に委譲
 *   - 本コンポーネントは「選択された素材」の管理と UI のみ担当
 *
 * onChange で状態全体 (files + urls) を返す。上位はそれを元に
 * バッチアップロード → /api/portfolio/batch を叩く。
 */

export type PickedFile = {
  file: File;
  kind: "image" | "video";
  // objectURL: プレビュー表示用。unmount 時に URL.revokeObjectURL される
  previewUrl: string;
};

export type PickedUrl = {
  url: string;
  platform: "youtube" | "vimeo" | "other";
  videoId: string | null;
  thumbnailUrl: string | null;
  title: string | null;
  loading: boolean;
  error: string | null;
};

export type UploadPayload = {
  files: PickedFile[];
  urls: PickedUrl[];
};

type Props = {
  value: UploadPayload;
  onChange: (next: UploadPayload) => void;
  maxFiles?: number;
  maxFileSizeMb?: number;
  disabled?: boolean;
};

// ==================== ヘルパー ====================

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function classifyFile(file: File): "image" | "video" | null {
  if (IMAGE_MIME.has(file.type)) return "image";
  if (VIDEO_MIME.has(file.type)) return "video";
  return null;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** YouTube 動画 ID を各種 URL 形式から取り出す */
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1) || null;
    }
    if (u.hostname.endsWith("youtube.com") || u.hostname.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]+)/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
}

/** Vimeo 動画 ID を取り出す */
function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("vimeo.com")) return null;
    const m = u.pathname.match(/^\/(\d+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function resolveEmbedThumbnail(
  url: string
): Promise<
  Pick<PickedUrl, "platform" | "videoId" | "thumbnailUrl" | "title" | "error">
> {
  const yid = extractYouTubeId(url);
  if (yid) {
    // YouTube は静的 URL でサムネイルが取れる (認証不要)
    return {
      platform: "youtube",
      videoId: yid,
      thumbnailUrl: `https://img.youtube.com/vi/${yid}/hqdefault.jpg`,
      title: null,
      error: null,
    };
  }

  const vid = extractVimeoId(url);
  if (vid) {
    // Vimeo は oEmbed で取得 (認証不要、CORS 許可あり)
    try {
      const r = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
      );
      if (!r.ok) throw new Error("oembed failed");
      const j = (await r.json()) as {
        thumbnail_url?: string;
        title?: string;
      };
      return {
        platform: "vimeo",
        videoId: vid,
        thumbnailUrl: j.thumbnail_url ?? null,
        title: j.title ?? null,
        error: null,
      };
    } catch {
      return {
        platform: "vimeo",
        videoId: vid,
        thumbnailUrl: null,
        title: null,
        error: "Vimeo のサムネイル取得に失敗しました",
      };
    }
  }

  return {
    platform: "other",
    videoId: null,
    thumbnailUrl: null,
    title: null,
    error: "対応していない URL です (YouTube / Vimeo をご利用ください)",
  };
}

// ==================== コンポーネント本体 ====================

export function RichUploadDropzone({
  value,
  onChange,
  maxFiles = 10,
  maxFileSizeMb = 50,
  disabled = false,
}: Props) {
  const [tab, setTab] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");

  // ---- react-dropzone ----
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (disabled) return;
      const remaining = maxFiles - value.files.length;
      const added: PickedFile[] = [];
      for (const f of accepted.slice(0, remaining)) {
        const kind = classifyFile(f);
        if (!kind) continue;
        if (f.size > maxFileSizeMb * 1024 * 1024) continue;
        added.push({
          file: f,
          kind,
          previewUrl: URL.createObjectURL(f),
        });
      }
      if (added.length > 0) {
        onChange({ ...value, files: [...value.files, ...added] });
      }
    },
    [value, onChange, maxFiles, maxFileSizeMb, disabled]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/gif": [".gif"],
        "image/webp": [".webp"],
        "video/mp4": [".mp4"],
        "video/webm": [".webm"],
        "video/quicktime": [".mov"],
      },
      multiple: true,
      disabled,
    });

  // ---- ObjectURL クリーンアップ ----
  useEffect(() => {
    return () => {
      value.files.forEach((f) => {
        try {
          URL.revokeObjectURL(f.previewUrl);
        } catch {
          /* noop */
        }
      });
    };
    // 意図的に mount/unmount のみ (files を deps に入れると revoke が誤発火する)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function removeFile(idx: number) {
    const removed = value.files[idx];
    if (removed) {
      try {
        URL.revokeObjectURL(removed.previewUrl);
      } catch {
        /* noop */
      }
    }
    onChange({
      ...value,
      files: value.files.filter((_, i) => i !== idx),
    });
  }

  function removeUrl(idx: number) {
    onChange({
      ...value,
      urls: value.urls.filter((_, i) => i !== idx),
    });
  }

  async function handleAddUrl() {
    const raw = urlInput.trim();
    if (!raw) return;
    // 重複防止
    if (value.urls.some((u) => u.url === raw)) {
      setUrlInput("");
      return;
    }
    const pending: PickedUrl = {
      url: raw,
      platform: "other",
      videoId: null,
      thumbnailUrl: null,
      title: null,
      loading: true,
      error: null,
    };
    onChange({ ...value, urls: [...value.urls, pending] });
    setUrlInput("");

    const meta = await resolveEmbedThumbnail(raw);
    // resolve 後、対象 URL がまだ配列に残っていれば更新
    onChange({
      ...value,
      urls: [
        ...value.urls,
        { ...pending, ...meta, loading: false },
      ],
    });
  }

  const canAddMore = value.files.length < maxFiles;
  const totalCount = value.files.length + value.urls.length;

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab("file")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "file"
              ? "border-neon-pink text-neon-pink"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <UploadCloud size={16} strokeWidth={1.8} aria-hidden />
          ファイルアップロード
        </button>
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "url"
              ? "border-neon-pink text-neon-pink"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <LinkIcon size={16} strokeWidth={1.8} aria-hidden />
          URL 埋め込み
        </button>
      </div>

      {/* Tab: File upload */}
      {tab === "file" && (
        <div className="mt-4">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              disabled || !canAddMore
                ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                : isDragReject
                  ? "border-red-400 bg-red-50"
                  : isDragActive
                    ? "border-neon-pink bg-neon-pink/5"
                    : "border-gray-300 bg-white hover:border-neon-pink/60 hover:bg-neon-pink/[0.03] cursor-pointer"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud
              size={32}
              strokeWidth={1.6}
              className={isDragActive ? "text-neon-pink" : "text-gray-400"}
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-gray-700">
              {isDragActive
                ? "ここにドロップしてアップロード"
                : "ファイルをドラッグ&ドロップ、またはクリックして選択"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              画像 (JPG / PNG / GIF / WEBP) ・動画 (MP4 / WEBM / MOV) / 1 ファイル最大 {maxFileSizeMb}MB / 最大 {maxFiles} 点
            </p>
          </div>
        </div>
      )}

      {/* Tab: URL embed */}
      {tab === "url" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            動画 URL (YouTube / Vimeo)
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              disabled={disabled}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-neon-pink focus:ring-1 focus:ring-neon-pink disabled:bg-gray-50"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={disabled || urlInput.trim() === ""}
              className="shrink-0 rounded-lg bg-neon-pink px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-neon-pink/90 disabled:bg-gray-300"
            >
              追加
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            YouTube 動画は自動でサムネイルを取得します。Vimeo は oEmbed から取得します。
          </p>
        </div>
      )}

      {/* Preview grid (常に両タブの選択物をまとめて表示) */}
      {totalCount > 0 && (
        <PreviewGrid
          files={value.files}
          urls={value.urls}
          onRemoveFile={removeFile}
          onRemoveUrl={removeUrl}
        />
      )}

      {/* Counter */}
      <p className="mt-3 text-xs text-gray-500">
        選択中: <b>{totalCount}</b> 点 (ファイル {value.files.length} / URL {value.urls.length})
      </p>
    </div>
  );
}

// ==================== Preview Grid ====================

function PreviewGrid({
  files,
  urls,
  onRemoveFile,
  onRemoveUrl,
}: {
  files: PickedFile[];
  urls: PickedUrl[];
  onRemoveFile: (idx: number) => void;
  onRemoveUrl: (idx: number) => void;
}) {
  const items = useMemo(
    () => [
      ...files.map((f, i) => ({ kind: "file" as const, item: f, idx: i })),
      ...urls.map((u, i) => ({ kind: "url" as const, item: u, idx: i })),
    ],
    [files, urls]
  );

  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((entry, gridIdx) =>
        entry.kind === "file" ? (
          <FileTile
            key={`f-${gridIdx}`}
            file={entry.item}
            onRemove={() => onRemoveFile(entry.idx)}
          />
        ) : (
          <UrlTile
            key={`u-${gridIdx}`}
            url={entry.item}
            onRemove={() => onRemoveUrl(entry.idx)}
          />
        )
      )}
    </ul>
  );
}

function FileTile({
  file,
  onRemove,
}: {
  file: PickedFile;
  onRemove: () => void;
}) {
  return (
    <li className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-gray-100">
        {file.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            src={file.previewUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
        )}
        <span
          className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white"
        >
          {file.kind === "image" ? (
            <ImageIcon size={10} strokeWidth={2} aria-hidden />
          ) : (
            <Film size={10} strokeWidth={2} aria-hidden />
          )}
          {file.kind}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="削除"
          className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
        >
          <X size={12} strokeWidth={2.4} aria-hidden />
        </button>
      </div>
      <div className="border-t border-gray-100 px-2 py-1.5">
        <p className="truncate text-[11px] font-medium text-gray-700">
          {file.file.name}
        </p>
        <p className="text-[10px] text-gray-500">{formatBytes(file.file.size)}</p>
      </div>
    </li>
  );
}

function UrlTile({
  url,
  onRemove,
}: {
  url: PickedUrl;
  onRemove: () => void;
}) {
  return (
    <li className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="relative flex aspect-video items-center justify-center bg-gray-900">
        {url.loading ? (
          <Loader2 size={22} strokeWidth={1.8} className="animate-spin text-gray-400" aria-hidden />
        ) : url.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="p-2 text-center text-[10px] text-red-300">
            {url.error ?? "サムネイル取得不可"}
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
          <LinkIcon size={10} strokeWidth={2} aria-hidden />
          {url.platform}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="削除"
          className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
        >
          <X size={12} strokeWidth={2.4} aria-hidden />
        </button>
      </div>
      <div className="border-t border-gray-100 px-2 py-1.5">
        <p className="truncate text-[11px] font-medium text-gray-700">
          {url.title ?? url.url}
        </p>
        <p className="truncate text-[10px] text-gray-500">{url.url}</p>
      </div>
    </li>
  );
}
