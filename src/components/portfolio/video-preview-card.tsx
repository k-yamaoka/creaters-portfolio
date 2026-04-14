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

function getEmbedUrl(videoUrl: string, platform: string): string | null {
  if (platform === "youtube") {
    const match = videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${match[1]}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`;
    }
  }

  if (platform === "vimeo") {
    const match = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&loop=1&background=1`;
    }
  }

  return null;
}

function isDirectVideo(platform: string): boolean {
  return platform === "mp4" || platform === "direct" || platform === "other";
}

function isVideoFileUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
}

export function VideoPreviewCard({
  thumbnailUrl,
  videoUrl,
  videoPlatform,
  alt,
  sizes = "(max-width: 640px) 100vw, 50vw",
  className = "",
  showPlayIcon = true,
}: VideoPreviewCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const embedUrl = getEmbedUrl(videoUrl, videoPlatform);
  const isMP4 = isDirectVideo(videoPlatform) || isVideoFileUrl(videoUrl);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovering(true);
      if (isMP4 && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovering(false);
    setMediaLoaded(false);
    if (isMP4 && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-[#F2F2F2] ${className}`}
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
        <div className="flex h-full items-center justify-center text-[#BDBDBD]">
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

      {/* MP4/direct video (preloaded, plays on hover) */}
      {isMP4 && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setMediaLoaded(true)}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isHovering && mediaLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* iframe for YouTube/Vimeo (loads on hover) */}
      {!isMP4 && isHovering && embedUrl && (
        <>
          <iframe
            src={embedUrl}
            className="pointer-events-none absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media"
            onLoad={() => setMediaLoaded(true)}
          />
          {/* Transparent overlay to hide YouTube title/controls on hover */}
          <div className="pointer-events-none absolute inset-0 z-10" />
        </>
      )}

      {/* Play icon overlay */}
      {showPlayIcon && !(isHovering && mediaLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
          <div className="scale-0 rounded-full bg-white/90 p-3.5 shadow-lg transition-transform duration-300 group-hover:scale-100">
            <svg
              className="h-5 w-5 text-primary-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isHovering && (embedUrl || isMP4) && !mediaLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}
    </div>
  );
}
