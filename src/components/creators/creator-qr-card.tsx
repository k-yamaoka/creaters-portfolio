"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Link2 } from "lucide-react";

type Props = {
  /** 完全な URL (例: https://ailier.app/creators/abc) */
  url: string;
  /** ファイル名に使うクリエイター表示名 */
  creatorName: string;
};

/**
 * クリエイター詳細ページの URL を QR コード化し、
 * 名刺に印刷できる PNG / SVG をダウンロードできるカード。
 *
 * 設計:
 * - error correction level "H" (30%) で多少の汚れ・印刷劣化に耐える
 * - margin (quiet zone) 4 セル (規格上限) で読み取り安定性確保
 * - PNG は 1024px の高解像度で出力 (名刺の 2cm 印刷で 1300dpi 相当)
 * - SVG はベクター出力なのでサイズ無限大、Illustrator/Photoshop でそのまま使用可
 * - 配色は印刷互換のため black on white 固定
 *
 * 全 QR 生成はクライアントサイドで完結し、URL は外部に送信しない。
 */
export function CreatorQrCard({ url, creatorName }: Props) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"png" | "svg" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表示用に小さめの PNG dataURL を初期生成 (~256px)
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 256,
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((d) => {
        if (!cancelled) setPreviewDataUrl(d);
      })
      .catch(() => {
        if (!cancelled) setError("QR コードの生成に失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  /** Blob → ファイルダウンロード共通処理 */
  const triggerDownload = (blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // メモリ解放は次の tick で
    setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  };

  // ファイル名に使えない文字を除去
  const safeName = (creatorName || "creator")
    .replace(/[\\/:*?"<>|]/g, "")
    .slice(0, 30)
    .trim() || "creator";

  const downloadPng = async () => {
    setBusy("png");
    setError(null);
    try {
      // 1024px の高解像度 PNG
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        margin: 4,
        width: 1024,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      // dataURL → Blob 変換 (canvas を経由しない方が高速)
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      triggerDownload(blob, `${safeName}-qr.png`);
    } catch {
      setError("PNG のダウンロードに失敗しました");
    } finally {
      setBusy(null);
    }
  };

  const downloadSvg = async () => {
    setBusy("svg");
    setError(null);
    try {
      const svgString = await QRCode.toString(url, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 4,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      triggerDownload(blob, `${safeName}-qr.svg`);
    } catch {
      setError("SVG のダウンロードに失敗しました");
    } finally {
      setBusy(null);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm shadow-[0_18px_40px_-20px_rgba(157,92,255,0.35)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white">
          <span className="inline-block h-2 w-2 rounded-full bg-neon-cyan mr-2 align-middle shadow-[0_0_8px_rgba(77,213,247,0.7)]" />
          ページ QR コード
        </h3>
        <span className="rounded-pill bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/65">
          名刺対応
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/55">
        印刷しても読み取れる高品質 QR (誤り訂正 30%)。名刺や紹介資料にそのまま貼れます。
      </p>

      {/* QR Preview — 白パディング付きで印刷時のクワイエットゾーンを再現 */}
      <div className="mt-4 flex justify-center">
        <div className="rounded-xl bg-white p-3 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)]">
          {previewDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewDataUrl}
              alt={`${creatorName} のページ QR コード`}
              width={180}
              height={180}
              className="block h-[180px] w-[180px]"
            />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-gray-400">
              生成中…
            </div>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md bg-red-500/15 px-3 py-1.5 text-[11px] text-red-300"
        >
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={downloadPng}
          disabled={!previewDataUrl || busy !== null}
          className="inline-flex items-center justify-center gap-1.5 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(255,77,157,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,77,157,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DownloadIcon />
          {busy === "png" ? "出力中…" : "PNG"}
        </button>
        <button
          type="button"
          onClick={downloadSvg}
          disabled={!previewDataUrl || busy !== null}
          className="inline-flex items-center justify-center gap-1.5 rounded-pill border border-white/30 bg-white/5 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:border-white/60 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DownloadIcon />
          {busy === "svg" ? "出力中…" : "SVG"}
        </button>
      </div>

      {/* URL コピー — QR を読まずに URL だけ欲しい場合のフォールバック */}
      <button
        type="button"
        onClick={copyUrl}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-pill border border-white/15 bg-white/[0.03] px-3 py-2 text-[11px] text-white/75 transition-colors hover:border-white/30 hover:bg-white/10"
      >
        {copied ? (
          <Check size={14} strokeWidth={1.8} aria-hidden />
        ) : (
          <Link2 size={14} strokeWidth={1.8} aria-hidden />
        )}
        {copied ? "URL をコピーしました" : "URL をコピー"}
      </button>

      <p className="mt-3 text-[10px] leading-relaxed text-white/45">
        ※ PNG は 1024×1024px の高解像度、SVG はベクターなので拡大しても劣化しません。
      </p>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}
