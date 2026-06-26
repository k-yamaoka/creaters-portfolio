"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import type { ResumeData } from "./types";

/**
 * クリエイター職務経歴書 PDF ダウンロードボタン。
 *
 * クリック → @react-pdf/renderer + フォント を順に動的取得 → Blob 生成 →
 * ファイルダウンロード。
 *
 * 進捗表示の仕組み:
 *  - 一番時間がかかるのは Noto Sans JP (9.6MB) の fetch なので、ここを
 *    Response.body の ReadableStream で受信しつつ、Content-Length 基準で
 *    実進捗を 0〜80% に割り当て
 *  - 残り 80〜100% は段階的疑似プログレス (フォント登録 → PDF 描画 → Blob 化)
 *  - 2 回目以降はブラウザキャッシュが効くため瞬時に 80% まで進む
 */

type Props = {
  data: ResumeData;
  className?: string;
};

type Stage = "idle" | "loading_font" | "rendering" | "finalizing" | "done";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  loading_font: "フォントを読み込み中…",
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

/** Fetch しつつ Content-Length 基準で進捗を返す。
 *  Content-Length が取れない (圧縮など) 場合は 受信完了時に 100% を返す。 */
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
    // body stream が無いブラウザでは fallback (進捗なし)
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
  // 受信した chunks を結合して ArrayBuffer に
  const out = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out.buffer;
}

export function ResumeDownloadButton({ data, className = "" }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0); // 0-100
  const [error, setError] = useState<string | null>(null);

  const busy = stage !== "idle" && stage !== "done";

  const handleClick = async () => {
    if (busy) return;
    setError(null);
    setProgress(0);
    setStage("loading_font");
    try {
      // === 1) フォントを ストリーミングで取得 (0 → 80%) ====================
      // @react-pdf 内部 fetch だと進捗が取れないため、自前で fetch して
      // ArrayBuffer を直接 Font.register に渡す。
      const fontBuf = await fetchWithProgress(
        "/fonts/NotoSansJP.ttf",
        (received, total) => {
          // total が無い場合は 0〜80% を 1MB あたり 8% で進める疑似値
          if (total) {
            setProgress(Math.min(80, Math.round((received / total) * 80)));
          } else {
            setProgress(
              Math.min(80, Math.round((received / (10 * 1024 * 1024)) * 80))
            );
          }
        }
      );

      // === 2) @react-pdf + Resume コンポーネントを動的 import (80% → 88%) =
      setStage("rendering");
      setProgress(82);
      const [{ pdf }, { CreatorResumePdf, registerResumeFont }] =
        await Promise.all([
          import("@react-pdf/renderer"),
          import("./CreatorResumePdf"),
        ]);
      registerResumeFont(fontBuf);
      setProgress(88);

      // === 3) 仮想 DOM → PDF instance (88 → 95%) ==========================
      const doc = <CreatorResumePdf data={data} />;
      const inst = pdf(doc);
      setProgress(95);

      // === 4) Blob 化 + ダウンロード (95 → 100%) ===========================
      setStage("finalizing");
      const blob = await inst.toBlob();
      setProgress(98);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `${safeFilename(data.displayName)}_resume_${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);

      setProgress(100);
      setStage("done");
      // 数秒後に idle に戻す (UI のスピナーを片付けるため)
      setTimeout(() => {
        setStage("idle");
        setProgress(0);
      }, 1500);
    } catch (e) {
      console.error("[ResumeDownloadButton] failed to generate PDF", e);
      const msg = e instanceof Error ? e.message : "不明なエラー";
      setError(`PDF の生成に失敗しました: ${msg}`);
      setStage("idle");
      setProgress(0);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex items-center gap-2 rounded-pill bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0"
      >
        {busy ? (
          <>
            <Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden />
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

      {/* 進捗バー — busy 中のみ表示 */}
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
        <p
          role="alert"
          className="mt-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      {!busy && (
        <p className="mt-2 text-xs text-gray-500">
          現在のプロフィール + 公開作品から PDF を生成します。初回はフォント読み込みのため数秒かかります。
        </p>
      )}
    </div>
  );
}
