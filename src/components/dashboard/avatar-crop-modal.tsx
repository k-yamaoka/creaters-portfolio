"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type Props = {
  /** トリミング対象の画像 URL (オブジェクト URL でも data URL でも可) */
  imageSrc: string;
  /** 入力ファイルの MIME (出力時の形式に使う。webp が来たら png にフォールバック) */
  mimeType: string;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => void;
};

/**
 * アバター画像のトリミング モーダル。
 *
 * - react-easy-crop で 1:1 円形マスク表示
 * - ドラッグで位置調整、スライダーまたはピンチでズーム
 * - 「確定」で表示中の領域を Canvas に再描画 → Blob を親に返す
 * - 出力は 512×512 にリサイズして高解像度を保ちつつファイルサイズを抑える
 */
export function AvatarCropModal({
  imageSrc,
  mimeType,
  onCancel,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // ESC でキャンセル、Enter で確定
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        mimeType
      );
      onConfirm(blob);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "トリミングに失敗しました"
      );
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        // 背景クリックでキャンセル (内側クリックは伝搬しない)
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="text-base font-bold text-gray-900">
          アイコンのトリミング
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          ドラッグで位置を、スライダーまたはピンチで拡大率を調整できます。
        </p>

        {/* Crop area — 正方形 */}
        <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-xl bg-neon-midnight-deep">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            // 余計な背景は隠して写真に集中させる
            objectFit="contain"
          />
        </div>

        {/* Zoom slider */}
        <div className="mt-4">
          <label className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>ズーム</span>
            <span className="font-bold text-gray-700">{zoom.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="block w-full accent-neon-pink"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-pill border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !croppedAreaPixels}
            className="rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-5 py-2 text-sm font-bold text-white shadow-card transition-shadow hover:shadow-card-hover disabled:opacity-50"
          >
            {busy ? "処理中..." : "この範囲で確定"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 指定した croppedAreaPixels に従って画像をクロップし、Blob を返す。
 *
 * - 最終的に 512×512 に正規化して webp/png/jpeg で出力
 * - 入力画像が CORS で読めない可能性があるので crossOrigin = "anonymous" を試行
 * - webp は容量効率良いが互換のため input の MIME (jpeg/png/webp) を尊重
 */
async function getCroppedImageBlob(
  imageSrc: string,
  area: Area,
  mimeType: string
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const OUTPUT_SIZE = 512;
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas が使えません");
  // クロップ領域 (元画像座標) → 512×512 にスケーリング描画
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );
  // 入力の MIME を優先 (jpeg / png / webp)。それ以外は jpeg にフォールバック
  const outMime = ["image/jpeg", "image/png", "image/webp"].includes(mimeType)
    ? mimeType
    : "image/jpeg";
  const quality = outMime === "image/png" ? undefined : 0.92;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("画像の生成に失敗しました"));
      },
      outMime,
      quality
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読込に失敗しました"));
    img.src = src;
  });
}
