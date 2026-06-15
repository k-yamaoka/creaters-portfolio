"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LikeButton } from "./like-button";
import { MIcon } from "@/components/ui/m-icon";

export type VideoModalItem = {
  id: string;
  title: string;
  description: string;
  media_type: "video" | "image";
  video_url: string | null;
  video_platform: string;
  image_url: string | null;
  thumbnail_url: string | null;
  aspect_ratio: "vertical" | "horizontal" | "square";
  like_count: number;
  liked: boolean;
};

export type VideoModalCreator = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

/**
 * 一覧クリックで開く動画モーダル。
 * - mp4 はネイティブ video、それ以外は埋め込み iframe にフォールバック
 * - 横にクリエイター情報 + 「プロフィールへ」CTA + LikeButton
 */
export function VideoModal({
  item,
  creator,
  isAuthed,
  onClose,
}: {
  item: VideoModalItem;
  creator: VideoModalCreator;
  isAuthed: boolean;
  onClose: () => void;
}) {
  // ESC で閉じる + scroll lock
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

  const isVideo = item.media_type === "video" && !!item.video_url;
  const isImage = item.media_type === "image";

  const aspectClass =
    item.aspect_ratio === "vertical"
      ? "aspect-[9/16] max-h-[80vh]"
      : item.aspect_ratio === "square"
        ? "aspect-square max-h-[80vh]"
        : "aspect-video max-h-[80vh]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex w-full max-w-[1100px] flex-col gap-5 lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute -right-1 -top-12 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-neon-pink/60 hover:bg-white/20 lg:-right-12 lg:top-0"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Media area */}
        <div className="flex flex-1 items-center justify-center">
          <div
            className={`relative w-full overflow-hidden rounded-2xl border border-white/15 bg-neon-midnight shadow-[0_30px_80px_-15px_rgba(0,0,0,0.8)] ${aspectClass}`}
          >
            {isImage && (item.image_url || item.thumbnail_url) && (
              <Image
                src={item.image_url || item.thumbnail_url || ""}
                alt={item.title}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 70vw"
              />
            )}
            {!isImage && isVideo && (
              <video
                src={item.video_url ?? undefined}
                autoPlay
                controls
                loop
                playsInline
                className="h-full w-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Side panel */}
        <aside className="flex w-full shrink-0 flex-col gap-4 rounded-2xl border border-white/10 bg-neon-midnight-deep/90 p-5 backdrop-blur-sm lg:w-[300px]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
              作品
            </p>
            <h3 className="mt-1 text-lg font-black text-white">{item.title}</h3>
            {item.description && (
              <p className="mt-2 line-clamp-4 text-xs leading-[1.85] text-white/65">
                {item.description}
              </p>
            )}
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
              クリエイター
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-neon-midnight">
                {creator.avatar_url ? (
                  <Image
                    src={creator.avatar_url}
                    alt={creator.display_name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-pink to-neon-purple text-sm font-black text-white">
                    {creator.display_name[0]}
                  </div>
                )}
              </div>
              <span className="text-sm font-bold text-white">
                {creator.display_name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LikeButton
              portfolioItemId={item.id}
              initialLiked={item.liked}
              initialCount={item.like_count}
              isAuthed={isAuthed}
              variant="inline"
            />
          </div>

          <Link
            href={`/creators/${creator.id}`}
            className="mt-auto inline-flex items-center justify-between gap-2 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-5 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,77,157,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(255,77,157,0.7)]"
            onClick={onClose}
          >
            <span className="inline-flex items-center gap-1.5">
              <MIcon name="person" size={18} />
              プロフィールへ
            </span>
            <MIcon name="arrow_forward" size={18} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
