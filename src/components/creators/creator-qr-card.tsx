"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Link2, Download } from "lucide-react";

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
 * 2026-06-23 ライトテーマ化:
 *  - 旧 bg-white/[0.04] / text-white を gray-* に統一
 *  - 旧ヘッダの装飾ドット (シアン点) を撤去、「SNS・ポートフォリオをチェック」
 *    の明確なラベルに置き換えて意図を伝える
 *  - 印刷向け仕様 (誤り訂正 H / 1024px PNG / ベクター SVG) は変更なし
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
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        margin: 4,
        width: 1024,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">
          SNS・ポートフォリオをチェック
        </h3>
        <span className="rounded-pill border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600">
          名刺対応
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
        スマートフォンで読み取ると、このページを開きます。名刺や紹介資料にそのまま貼って配布できます (印刷劣化に耐える誤り訂正 30%)。
      </p>

      {/* QR Preview — 白パディング付きで印刷時のクワイエットゾーンを再現 */}
      <div className="mt-4 flex justify-center">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
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
          className="mt-3 rounded-md bg-red-50 px-3 py-1.5 text-[11px] text-red-700"
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
          className="inline-flex items-center justify-center gap-1.5 rounded-pill bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={14} strokeWidth={1.8} aria-hidden />
          {busy === "png" ? "出力中…" : "PNG"}
        </button>
        <button
          type="button"
          onClick={downloadSvg}
          disabled={!previewDataUrl || busy !== null}
          className="inline-flex items-center justify-center gap-1.5 rounded-pill border border-gray-300 bg-white px-3 py-2 text-[11px] font-bold text-gray-900 transition-colors hover:border-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={14} strokeWidth={1.8} aria-hidden />
          {busy === "svg" ? "出力中…" : "SVG"}
        </button>
      </div>

      {/* URL コピー — QR を読まずに URL だけ欲しい場合のフォールバック */}
      <button
        type="button"
        onClick={copyUrl}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-pill border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100"
      >
        {copied ? (
          <Check size={14} strokeWidth={1.8} aria-hidden />
        ) : (
          <Link2 size={14} strokeWidth={1.8} aria-hidden />
        )}
        {copied ? "URL をコピーしました" : "URL をコピー"}
      </button>

      <p className="mt-3 text-[10px] leading-relaxed text-gray-500">
        ※ PNG は 1024×1024px の高解像度、SVG はベクターなので拡大しても劣化しません。
      </p>
    </div>
  );
}
