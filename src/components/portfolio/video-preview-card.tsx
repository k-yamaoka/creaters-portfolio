"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type VideoPreviewCardProps = {
  thumbnailUrl: string | null;
  videoUrl: string;
  videoPlatform: string;
  alt: string;
  sizes?: string;
  className?: string;
  showPlayIcon?: boolean;
};

/**
 * MP4 動画用プレビューカード。
 * - SNS 埋め込み (YouTube / Vimeo / TikTok / Instagram) は廃止
 * - hover 時に <video> を再生
 * - サムネ画像が読み込めない場合は背景のみ表示
 */
export function VideoPreviewCard({
  thumbnailUrl,
  videoUrl,
  videoPlatform: _videoPlatform,
  alt,
  sizes = "(max-width: 640px) 100vw, 50vw",
  className = "",
  showPlayIcon = true,
}: VideoPreviewCardProps) {
  void _videoPlatform; // 互換維持で受け取るだけ
  const [isHovering, setIsHovering] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const hasVideo = !!videoUrl;

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovering(true);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 200);
  };

  const handleMouseLeave = () => {
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
      className={`relative overflow-hidden bg-neon-midnight-deep ${className}`}
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
            isHovering && mediaLoaded ? "opacity-0" : "opacity-100"
          }`}
          sizes={sizes}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-white/40">
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

      {/* MP4 video (preloaded, plays on hover)
          サムネ無しの場合は first frame をポスター代わりに常時表示。
          0.001s シークで Firefox/Safari でも first frame を強制描画。 */}
      {hasVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop
          playsInline
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
            thumbnailUrl
              ? isHovering && mediaLoaded
                ? "opacity-100"
                : "opacity-0"
              : "opacity-100"
          }`}
        />
      )}

      {/* Play icon */}
      {showPlayIcon && !(isHovering && mediaLoaded) && (
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}
    </div>
  );
}
