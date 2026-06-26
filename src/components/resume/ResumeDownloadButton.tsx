"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import type { ResumeData } from "./types";

/**
 * クリエイター職務経歴書 PDF ダウンロードボタン。
 *
 * クリック → @react-pdf/renderer を dynamic import → Blob 生成 → ファイル
 * ダウンロードを発火。
 *
 * dynamic import の理由:
 *  - @react-pdf/renderer は ~600KB あり、SSR 不可 (Node API 依存)
 *  - 「Download」ボタンを押したクリエイターだけが負担すれば十分
 *
 * a11y:
 *  - 生成中は disabled + aria-busy=true、スピナー
 *  - 失敗時は role="alert" でエラー表示
 */

type Props = {
  data: ResumeData;
  /** ボタンの className 上書き */
  className?: string;
};

function safeFilename(name: string): string {
  const trimmed = (name || "creator")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  return trimmed || "creator";
}

export function ResumeDownloadButton({ data, className = "" }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // @react-pdf/renderer + CreatorResumePdf 本体は ~600KB あり SSR 不可
      // のため、ここで dynamic import して初回バンドルに巻き込まれない
      // ようにしている (lazy load)。フォント取得 + Base64 化で初回は数秒。
      const [{ pdf }, { CreatorResumePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./CreatorResumePdf"),
      ]);
      const doc = <CreatorResumePdf data={data} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `${safeFilename(data.displayName)}_resume_${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // メモリ解放は次フレームで
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      console.error("[ResumeDownloadButton] failed to generate PDF", e);
      setError("PDF の生成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex items-center gap-2 rounded-pill bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {busy ? (
          <>
            <Loader2
              size={16}
              strokeWidth={2}
              className="animate-spin"
              aria-hidden
            />
            生成中…
          </>
        ) : (
          <>
            <FileText size={16} strokeWidth={1.8} aria-hidden />
            職務経歴書 (PDF) をダウンロード
            <Download size={14} strokeWidth={1.8} aria-hidden />
          </>
        )}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700"
        >
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-gray-500">
        現在のプロフィール + 公開作品から PDF を生成します。生成にはネットワーク状況により数秒かかります。
      </p>
    </div>
  );
}
