"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useInViewport } from "@/hooks/use-in-viewport";
import { derivePosterUrl } from "@/lib/video-poster";

type VideoPreviewCardProps = {
  thumbnailUrl: string | null;
  videoUrl: string;
  videoPlatform: string;
  alt: string;
  sizes?: string;
  className?: string;
  showPlayIcon?: boolean;
  /** 2026-06-24: true なら hover 待ちせず、画面内に入った瞬間に
   *  muted autoplay loop で常時再生する (代表作の没入演出用)。
   *  prefers-reduced-motion: reduce 時は autoplay を抑止。 */
  autoPlay?: boolean;
};

/**
 * MP4 動画用プレビューカード。
 * - SNS 埋め込み (YouTube / Vimeo / TikTok / Instagram) は廃止
 * - 既定: hover 時に <video> を再生
 * - autoPlay=true: 画面内に入ったら常時 autoplay (muted/loop/playsInline)
 * - サムネ画像が読み込めない場合は背景のみ表示
 * - <video> は viewport (+300px) に入ったタイミングで mount し、初期表示を軽くする
 * - Cloudinary 動画は拡張子 .jpg で first frame をポスター画像として即取得
 */
export function VideoPreviewCard({
  thumbnailUrl,
  videoUrl,
  videoPlatform: _videoPlatform,
  alt,
  sizes = "(max-width: 640px) 100vw, 50vw",
  className = "",
  showPlayIcon = true,
  autoPlay = false,
}: VideoPreviewCardProps) {
  void _videoPlatform; // 互換維持で受け取るだけ
  const [isHovering, setIsHovering] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { ref: rootRef, inView } = useInViewport<HTMLDivElement>("300px");

  const hasVideo = !!videoUrl;
  const posterUrl = derivePosterUrl(videoUrl);
  const shouldRenderVideo = hasVideo && inView;
  // autoPlay 時は hover 状態を常時 true と等価扱いにして video を可視 + 再生
  const effectiveHovering = autoPlay ? !reducedMotion : isHovering;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const apply = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // autoPlay モード: video が mount されたら明示的に play()
  useEffect(() => {
    if (!autoPlay) return;
    const v = videoRef.current;
    if (!v) return;
    if (reducedMotion) {
      try {
        v.pause();
      } catch {
        /* ignore */
      }
      return;
    }
    v.muted = true;
    v.play().catch(() => {
      /* autoplay rejection */
    });
  }, [autoPlay, shouldRenderVideo, reducedMotion]);

  const handleMouseEnter = () => {
    if (autoPlay) return; // 常時再生中なので hover ロジック不要
    timeoutRef.current = setTimeout(() => {
      setIsHovering(true);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 200);
  };

  const handleMouseLeave = () => {
    if (autoPlay) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovering(false);
    setMediaLoaded(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden bg-paper ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Static thumbnail */}
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={alt}
          fill
          className={`object-cover transition-all duration-500 ${
            effectiveHovering && mediaLoaded ? "opacity-0" : "opacity-100"
          }`}
          sizes={sizes}
        />
      ) : posterUrl ? (
        // Cloudinary poster (next/image は CDN allowlist 不要にしたいので素の <img>)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
            effectiveHovering && mediaLoaded ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-ink/50">
          <svg
            className="h-12 w-12"
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
        </div>
      )}

      {/* MP4 video (viewport に入ったときだけ mount。
          サムネ無し かつ poster も無い場合は first frame をポスター代わりに常時表示。
          0.001s シークで Firefox/Safari でも first frame を強制描画。) */}
      {shouldRenderVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl ?? undefined}
          muted
          loop
          playsInline
          autoPlay={autoPlay && !reducedMotion}
          preload="metadata"
          onLoadedMetadata={(e) => {
            try {
              e.currentTarget.currentTime = 0.001;
            } catch {
              // ignore
            }
          }}
          onLoadedData={() => setMediaLoaded(true)}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            thumbnailUrl || posterUrl
              ? effectiveHovering && mediaLoaded
                ? "opacity-100"
                : "opacity-0"
              : "opacity-100"
          }`}
        />
      )}

      {/* Play icon — 常時再生モードでは出さない */}
      {showPlayIcon && !autoPlay && !(isHovering && mediaLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
          <div className="scale-0 rounded-full bg-white/90 p-3.5 shadow-lg transition-transform duration-300 group-hover:scale-100">
            <svg
              className="h-5 w-5 text-neon-purple-deep"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isHovering && hasVideo && !mediaLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/30 border-t-white" />
        </div>
      )}
    </div>
  );
}
