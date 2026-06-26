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

type Stage =
  | "idle"
  | "loading_font"
  | "loading_thumbs"
  | "rendering"
  | "finalizing"
  | "done";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  loading_font: "フォントを読み込み中…",
  loading_thumbs: "サムネ画像を取得中…",
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

/** Blob → Image → Canvas で targetMaxWidth に縮小 + JPEG dataURL 化。
 *
 *  なぜそのまま blobToDataUrl しないか:
 *  - Supabase の thumb は 480px wide JPEG (~30-50KB)。これを 4 枚埋め込むと
 *    PDF が数 MB 肥大化し、@react-pdf 4.x の画像デコードが極端に遅くなる
 *    (99% で hang したように見える)。
 *  - PDF 上の表示サイズは 110px wide で十分なので、Canvas で resize して
 *    JPEG q=0.85 で再エンコードすれば 1 枚 5-10KB に削減。
 *  - 同時に、WebP や exotic な画像形式を JPEG に正規化できるので
 *    @react-pdf のサポート範囲 (JPEG/PNG) に確実に収まる。
 */
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
        // 白塗り (透過 PNG が JPEG 化で黒くなるのを防ぐ)
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
      // === 1) フォントをストリーミング fetch して HTTP キャッシュに温める (0→80%) ==
      // 役割は 2 つ:
      //  - リアルタイムの進捗 % を表示するため byte ストリームを観察
      //  - 受信完了 = ブラウザの HTTP キャッシュに格納される。後段の
      //    @react-pdf 内部 fetch (同一 URL) はキャッシュから即時 hit する
      // 自前 fetch の結果 ArrayBuffer は破棄してよい。Font.register には
      // 通常の URL string を渡す方が 4.x の挙動と最も整合する (blob: URL も
      // src でないコンテキストで indexOf を呼ぶ箇所があり例外になり得る)。
      // フォント = /fonts/SawarabiGothic.ttf (~1.9MB)
      await fetchWithProgress(
        "/fonts/SawarabiGothic.ttf",
        (received, total) => {
          // フォント DL は 0→60%。残り 60→80% を画像取得に割当てる。
          if (total) {
            setProgress(Math.min(60, Math.round((received / total) * 60)));
          } else {
            // Content-Length が無いケース: 2MB と想定して進捗計算
            setProgress(
              Math.min(60, Math.round((received / (2 * 1024 * 1024)) * 60))
            );
          }
        }
      );
      setProgress(60);

      // === 2) サムネ画像を並列 fetch + dataURL 化 (60 → 80%) ==============
      // @react-pdf 内部 fetch だと hang のリスクあるため、ここで自前で
      // fetch + FileReader.readAsDataURL し、data:image/...;base64,... の
      // 文字列にしてから PDF に渡す。失敗した作品は placeholder で表示。
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
              // 縦型は 9:16 で表示するため 200px 幅まで、横型/正方形は
              // 320px 幅で十分 (PDF の表示サイズ + retina 2x 程度)
              const maxW = w.aspect_ratio === "vertical" ? 200 : 320;
              thumbDataUrls[w.id] = await blobToResizedJpegDataUrl(blob, maxW);
            } catch (e) {
              console.warn(
                "[ResumeDownloadButton] thumbnail fetch failed",
                w.id,
                e
              );
            } finally {
              done += 1;
              setProgress(60 + Math.round(20 * (done / worksWithThumb.length)));
            }
          })
        );
      }
      setProgress(80);

      // === 3) @react-pdf + Resume コンポーネントを動的 import (80% → 88%) =
      setStage("rendering");
      setProgress(82);
      const [{ pdf }, { CreatorResumePdf, registerResumeFont }] =
        await Promise.all([
          import("@react-pdf/renderer"),
          import("./CreatorResumePdf"),
        ]);
      // 引数なし = /fonts/NotoSansJP.ttf を src に。ブラウザ HTTP キャッシュが
      // 効いているため @react-pdf 内部 fetch は即時 resolve する。
      registerResumeFont();
      setProgress(88);

      // === 4) 仮想 DOM → PDF instance (88 → 95%) ==========================
      const doc = (
        <CreatorResumePdf data={data} thumbDataUrls={thumbDataUrls} />
      );
      const inst = pdf(doc);
      setProgress(95);

      // === 5) Blob 化 + ダウンロード (95 → 99%) ===========================
      // pdf.toBlob() は内部で非同期に layout 計算するため、見かけ上 95% で
      // 数秒固まる。完了を待つ間、疑似プログレスで 95→99% に滑らかに進める。
      setStage("finalizing");
      let pseudoProgress = 95;
      const pseudoTimer = window.setInterval(() => {
        pseudoProgress = Math.min(99, pseudoProgress + 1);
        setProgress(pseudoProgress);
      }, 250);
      let blob: Blob;
      try {
        blob = await inst.toBlob();
      } finally {
        window.clearInterval(pseudoTimer);
      }
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
      // 失敗原因の調査用に stack も含めて console + UI に出す
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
        <pre
          role="alert"
          className="mt-2 whitespace-pre-wrap rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700"
        >
          {error}
        </pre>
      )}

      {!busy && (
        <p className="mt-2 text-xs text-gray-500">
          現在のプロフィール + 公開作品から PDF を生成します。初回はフォント読み込みのため数秒かかります。
        </p>
      )}
    </div>
  );
}
