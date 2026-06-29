"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Loader2, Sparkles } from "lucide-react";
import type { ResumeData, ResumeTemplateId } from "./types";
import { RESUME_TEMPLATES } from "./types";

/**
 * クリエイター職務経歴書 PDF ダウンロードボタン。
 *
 * 機能:
 *  - 20 種のテンプレートから dropdown で選択 (Phase 1 で 5 種 実装、
 *    残り 15 種は「準備中」表示で選択不可)
 *  - フォント / サムネ / 動画フレーム を自前 fetch して進捗 % を表示
 *  - @react-pdf/renderer + テンプレート本体は動的 import で lazy
 *
 * 進捗マッピング:
 *   loading_font   :  0→50  (Content-Length 実バイト)
 *   loading_thumbs : 50→65  (サムネ並列 fetch 完了数)
 *   loading_frames : 65→85  (動画フレーム並列 fetch 完了数)
 *   rendering      : 85→95
 *   finalizing     : 95→100 (toBlob 待機中の疑似)
 */

type Props = {
  data: ResumeData;
  className?: string;
};

type Stage =
  | "idle"
  | "loading_font"
  | "loading_thumbs"
  | "loading_frames"
  | "rendering"
  | "finalizing"
  | "done";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  loading_font: "フォントを読み込み中…",
  loading_thumbs: "サムネを取得中…",
  loading_frames: "動画フレームを取得中…",
  rendering: "PDF を描画中…",
  finalizing: "仕上げ中…",
  done: "完了",
};

function safeFilename(name: string): string {
  const trimmed = (name || "creator")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  return trimmed || "creator";
}

function blobToResizedJpegDataUrl(
  blob: Blob,
  targetMaxWidth = 320
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => {
      try {
        const ratio = img.height / img.width;
        const w = Math.min(targetMaxWidth, img.width);
        const h = Math.round(w * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas 2D context unavailable");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image decode failed"));
    };
    img.src = objectUrl;
  });
}

async function fetchWithProgress(
  url: string,
  onProgress: (received: number, total: number | null) => void
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
  const totalHeader = res.headers.get("Content-Length");
  const total = totalHeader ? parseInt(totalHeader, 10) : null;
  const reader = res.body?.getReader();
  if (!reader) {
    const buf = await res.arrayBuffer();
    onProgress(buf.byteLength, total);
    return buf;
  }
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress(received, total);
    }
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out.buffer;
}

export function ResumeDownloadButton({ data, className = "" }: Props) {
  const [templateId, setTemplateId] = useState<ResumeTemplateId>("cinematic-a");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const busy = stage !== "idle" && stage !== "done";
  const selectedMeta = useMemo(
    () => RESUME_TEMPLATES.find((t) => t.id === templateId),
    [templateId]
  );

  const handleClick = async () => {
    if (busy) return;
    setError(null);
    setProgress(0);
    setStage("loading_font");

    try {
      // === 1) フォント 0→50% ===========================================
      await fetchWithProgress(
        "/fonts/SawarabiGothic.ttf",
        (received, total) => {
          if (total) {
            setProgress(Math.min(50, Math.round((received / total) * 50)));
          } else {
            setProgress(
              Math.min(50, Math.round((received / (2 * 1024 * 1024)) * 50))
            );
          }
        }
      );
      setProgress(50);

      // === 2) サムネ 50→65% ============================================
      setStage("loading_thumbs");
      const worksWithThumb = data.works.filter((w) => !!w.thumbnail_url);
      const thumbDataUrls: Record<string, string> = {};
      if (worksWithThumb.length > 0) {
        let done = 0;
        await Promise.all(
          worksWithThumb.map(async (w) => {
            try {
              const res = await fetch(w.thumbnail_url!);
              if (!res.ok) throw new Error(`thumb HTTP ${res.status}`);
              const blob = await res.blob();
              const maxW = w.aspect_ratio === "vertical" ? 200 : 320;
              thumbDataUrls[w.id] = await blobToResizedJpegDataUrl(blob, maxW);
            } catch (e) {
              console.warn("[Resume] thumb fetch failed", w.id, e);
            } finally {
              done += 1;
              setProgress(
                50 + Math.round(15 * (done / worksWithThumb.length))
              );
            }
          })
        );
      }
      setProgress(65);

      // === 3) 動画フレーム 65→85% ======================================
      // 各作品の frame_urls (最大 5 枚) を並列 fetch + dataURL 化
      setStage("loading_frames");
      const worksWithFrames = data.works.filter(
        (w) => Array.isArray(w.frame_urls) && w.frame_urls.length > 0
      );
      const frameDataUrls: Record<string, string[]> = {};
      const totalFrames = worksWithFrames.reduce(
        (sum, w) => sum + w.frame_urls.length,
        0
      );
      if (totalFrames > 0) {
        let doneFrames = 0;
        await Promise.all(
          worksWithFrames.map(async (w) => {
            const collected: string[] = [];
            await Promise.all(
              w.frame_urls.map(async (url, idx) => {
                try {
                  const res = await fetch(url);
                  if (!res.ok) throw new Error(`frame HTTP ${res.status}`);
                  const blob = await res.blob();
                  // パノラマ 1 コマは小さく描画されるので 240px wide で十分
                  collected[idx] = await blobToResizedJpegDataUrl(blob, 240);
                } catch (e) {
                  console.warn("[Resume] frame fetch failed", w.id, idx, e);
                } finally {
                  doneFrames += 1;
                  setProgress(
                    65 + Math.round(20 * (doneFrames / totalFrames))
                  );
                }
              })
            );
            frameDataUrls[w.id] = collected.filter(Boolean);
          })
        );
      }
      setProgress(85);

      // === 4) 動的 import + テンプレート選択 (85→90%) ==================
      setStage("rendering");
      setProgress(87);
      const [{ pdf }, mod] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./templates"),
      ]);
      mod.registerResumeFont();
      // dispatcher は React.ReactElement を返すが pdf() は
      // ReactElement<DocumentProps> を要求するため、Parameters でキャスト。
      const doc = mod.renderResumeByTemplate(templateId, {
        data,
        thumbDataUrls,
        frameDataUrls,
      }) as Parameters<typeof pdf>[0];
      setProgress(92);

      // === 5) Blob 化 + ダウンロード (92→100%) =========================
      setStage("finalizing");
      let pseudoProgress = 92;
      const pseudoTimer = window.setInterval(() => {
        pseudoProgress = Math.min(99, pseudoProgress + 1);
        setProgress(pseudoProgress);
      }, 250);
      let blob: Blob;
      try {
        blob = await pdf(doc).toBlob();
      } finally {
        window.clearInterval(pseudoTimer);
      }
      setProgress(98);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `${safeFilename(data.displayName)}_${templateId}_${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);

      setProgress(100);
      setStage("done");
      setTimeout(() => {
        setStage("idle");
        setProgress(0);
      }, 1500);
    } catch (e) {
      console.error("[ResumeDownloadButton] failed to generate PDF", e);
      const msg = e instanceof Error ? e.message : "不明なエラー";
      const stack =
        e instanceof Error && e.stack
          ? e.stack.split("\n").slice(0, 3).join(" | ")
          : "";
      setError(
        stack
          ? `PDF の生成に失敗しました: ${msg}\n\n[debug] ${stack}`
          : `PDF の生成に失敗しました: ${msg}`
      );
      setStage("idle");
      setProgress(0);
    }
  };

  return (
    <div className={className}>
      {/* === テンプレート選択 === */}
      <div className="mb-3">
        <label
          htmlFor="resume-template"
          className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700"
        >
          <Sparkles size={12} strokeWidth={2} aria-hidden />
          テンプレートを選択
        </label>
        <select
          id="resume-template"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value as ResumeTemplateId)}
          disabled={busy}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
        >
          <optgroup label="✨ 利用可能 (Phase 1)">
            {RESUME_TEMPLATES.filter((t) => !t.comingSoon).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — {t.description.slice(0, 30)}…
              </option>
            ))}
          </optgroup>
          <optgroup label="🚧 準備中 (順次追加予定)">
            {RESUME_TEMPLATES.filter((t) => t.comingSoon).map((t) => (
              <option key={t.id} value={t.id} disabled>
                {t.label} (準備中)
              </option>
            ))}
          </optgroup>
        </select>
        {selectedMeta && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
            {selectedMeta.description}
          </p>
        )}
      </div>

      {/* === ダウンロードボタン === */}
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex items-center gap-2 rounded-pill bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0"
      >
        {busy ? (
          <>
            <Loader2
              size={16}
              strokeWidth={2}
              className="animate-spin"
              aria-hidden
            />
            生成中… {progress}%
          </>
        ) : (
          <>
            <FileText size={16} strokeWidth={1.8} aria-hidden />
            職務経歴書 (PDF) をダウンロード
            <Download size={14} strokeWidth={1.8} aria-hidden />
          </>
        )}
      </button>

      {/* === 進捗バー === */}
      {busy && (
        <div className="mt-3" role="status" aria-live="polite">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-indigo-600 transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-gray-600">
            <span>{STAGE_LABEL[stage]}</span>
            <span className="font-mono tabular-nums">{progress}%</span>
          </div>
        </div>
      )}

      {error && (
        <pre
          role="alert"
          className="mt-2 whitespace-pre-wrap rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700"
        >
          {error}
        </pre>
      )}

      {!busy && (
        <p className="mt-2 text-xs text-gray-500">
          選択したテンプレートで現在のプロフィール + 公開作品から PDF を生成します。動画作品の代表フレーム (5 枚) を「映像パノラマ」として PDF に埋め込みます。
        </p>
      )}
    </div>
  );
}
