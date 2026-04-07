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
    // Extract YouTube video ID from various URL formats
    const match = videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${match[1]}&modestbranding=1&showinfo=0&rel=0`;
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
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const embedUrl = getEmbedUrl(videoUrl, videoPlatform);

  const handleMouseEnter = () => {
    // Delay to avoid triggering on quick mouse passes
    timeoutRef.current = setTimeout(() => {
      setIsHovering(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovering(false);
    setIframeLoaded(false);
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
            isHovering && iframeLoaded ? "opacity-0" : "opacity-100"
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

      {/* Video iframe (loads on hover) */}
      {isHovering && embedUrl && (
        <iframe
          src={embedUrl}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; encrypted-media"
          onLoad={() => setIframeLoaded(true)}
        />
      )}

      {/* Play icon overlay (hidden when video is playing) */}
      {showPlayIcon && !(isHovering && iframeLoaded) && (
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

      {/* Loading indicator when iframe is loading */}
      {isHovering && embedUrl && !iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}
    </div>
  );
}
