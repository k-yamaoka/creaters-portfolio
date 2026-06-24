"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight, Volume2, VolumeX, Heart } from "lucide-react";

/**
 * クリック時に開く 100svh フルスクリーン動画モーダル。
 *
 * 仕様:
 * - TOP の HeroFullscreen と同じく viewport いっぱいに動画を表示
 * - 中央に動画 (object-contain でアスペクト維持、余白を黒で塗りつぶし)
 * - 上下に scrim でタイトル・クリエイター名・CTA の可読性を確保
 * - ESC キー / 背景クリック / 右上 [×] で閉じる
 * - 音声 mute/unmute トグル (デフォルトミュート、ユーザー操作で解除)
 * - prefers-reduced-motion: reduce 時は autoplay 抑止、ユーザーの controls 操作のみ
 * - 開いている間 body scroll を lock
 *
 * 用途:
 * - /portfolios: WorkCard クリック時 (作品単位)
 * - /creators: クリエイターカードクリック時 (代表作で開く)
 */

export type FullscreenVideoModalProps = {
  videoUrl: string;
  posterUrl?: string | null;
  title: string;
  creatorName: string;
  /** クリエイター詳細ページへの相対パス (例: /creators/abc) */
  creatorHref?: string;
  /** 作品詳細ページへの相対パス (省略可) */
  workHref?: string;
  /** ライク数の表示 (任意) */
  likeCount?: number;
  onClose: () => void;
};

export function FullscreenVideoModal({
  videoUrl,
  posterUrl,
  title,
  creatorName,
  creatorHref,
  workHref,
  likeCount,
  onClose,
}: FullscreenVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // ESC で閉じる + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // prefers-reduced-motion 検出
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const apply = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // mute トグル反映
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
  }, [muted]);

  return (
    <div
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} を再生`}
      onClick={onClose}
    >
      {/* === 背景 ぼかし poster — 動画読込中の埋め用 === */}
      {posterUrl && (
        <Image
          src={posterUrl}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-30 blur-2xl"
          aria-hidden
        />
      )}

      {/* === メイン動画 (object-contain でアスペクト維持) === */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl ?? undefined}
        autoPlay={!reducedMotion}
        muted={muted}
        loop
        playsInline
        controls={false}
        className="relative z-10 h-full max-h-screen w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* === Top bar: 閉じる + Sound === */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-black/65 to-transparent px-5 py-5 sm:px-8 sm:py-6">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            aria-label={muted ? "サウンドをオン" : "サウンドをオフ"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            {muted ? (
              <VolumeX size={16} strokeWidth={1.8} aria-hidden />
            ) : (
              <Volume2 size={16} strokeWidth={1.8} aria-hidden />
            )}
          </button>
          {typeof likeCount === "number" && likeCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur">
              <Heart
                size={12}
                strokeWidth={1.8}
                fill="currentColor"
                className="text-neon-pink"
                aria-hidden
              />
              {likeCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="閉じる"
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <X size={18} strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      {/* === Bottom bar: タイトル + クリエイター名 + CTAs === */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-6 pt-12 sm:px-10 sm:pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-auto mx-auto flex max-w-container flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <h2 className="line-clamp-2 font-display text-xl font-medium leading-tight text-white sm:text-2xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-white/70">{creatorName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {workHref && (
              <Link
                href={workHref}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-pill border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                作品の詳細
              </Link>
            )}
            {creatorHref && (
              <Link
                href={creatorHref}
                onClick={(e) => e.stopPropagation()}
                className="group inline-flex items-center gap-2 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_22px_-8px_rgba(255,77,157,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-8px_rgba(255,77,157,0.7)]"
              >
                クリエイター詳細を見る
                <ArrowRight
                  size={14}
                  strokeWidth={1.8}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
