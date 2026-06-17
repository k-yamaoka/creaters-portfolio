"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { LikeButton } from "@/components/portfolio/like-button";
import type { WorkEntry } from "@/lib/portfolio-search";

type Props = {
  work: WorkEntry;
  isLiked: boolean;
  isAuthed: boolean;
  onClick: (w: WorkEntry) => void;
};

function aspectClass(a: WorkEntry["aspect_ratio"]): string {
  return a === "vertical"
    ? "aspect-[9/16]"
    : a === "square"
      ? "aspect-square"
      : "aspect-video";
}

function orientationLabel(a: WorkEntry["aspect_ratio"]): string {
  return a === "vertical" ? "縦型" : a === "square" ? "正方形" : "横型";
}

function formatDuration(s: number | null): string | null {
  if (s == null) return null;
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m}:00` : `${m}:${String(r).padStart(2, "0")}`;
}

function primaryAiTool(w: WorkEntry): string | null {
  const pool = w.used_ai_tools.length > 0 ? w.used_ai_tools : w.creator_used_ai_tools;
  if (pool.length === 0) return null;
  // 表示は先頭ワードだけに短縮 (Sora 2 → Sora)
  return pool[0].split(" ")[0];
}

/**
 * Adobe Stock 型の作品カード。
 *
 * 設計:
 * - 既定 = poster (thumbnail_url / image_url) 静止画
 * - 画面内に入ったら IntersectionObserver で <video preload=metadata> を mount
 *   (画面外のときは video を unmount 同等にして DOM/メモリを節約)
 * - hover (PC) / focus 時に play、leave で pause + currentTime=0
 * - prefers-reduced-motion: reduce 時は hover 再生を無効化、クリックで詳細モーダル
 * - メタオーバーレイ:
 *   - 右上: ♡ (常時、hover で透過 0 → 100 に)
 *   - 左上: 尺バッジ (常時表示)
 *   - hover 時 下端: 向き · 解像度 · AI ツール
 *   - 既定 下端: タイトル + クリエイター名 (テキストのみ)
 */
export function WorkCard({ work, isLiked, isAuthed, onClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const hasVideo = work.media_type === "video" && !!work.video_url;
  const poster = work.thumbnail_url || work.image_url || null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // 画面内に入ったら <video> を mount するためのフラグ
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasVideo) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setInView(true);
        }
      },
      { rootMargin: "200px 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasVideo]);

  // hover / leave で video を制御 (reduced-motion 時は無効)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovering && !reducedMotion) {
      v.currentTime = 0;
      v.play().catch(() => {
        /* autoplay rejection */
      });
    } else {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }, [hovering, reducedMotion]);

  const duration = formatDuration(work.duration_seconds);
  const orientation = orientationLabel(work.aspect_ratio);
  const tool = primaryAiTool(work);
  const aspect = aspectClass(work.aspect_ratio);

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      onClick={() => onClick(work)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(work);
        }
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      aria-label={`${work.title} を再生`}
      className={`group relative ${aspect} mb-3 inline-block w-full cursor-pointer overflow-hidden rounded-md border border-ink/10 bg-ink/5 align-top transition-shadow duration-200 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2`}
    >
      {/* Poster (image) — 常時表示。video が再生中はその下に隠れる */}
      {poster ? (
        <Image
          src={poster}
          alt={work.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink/5 to-ink/10 text-[11px] text-ink/50">
          {work.title}
        </div>
      )}

      {/* Video (hover preview) — 画面内に入ったときだけ mount */}
      {inView && hasVideo && (
        <video
          ref={videoRef}
          src={work.video_url ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
            hovering && !reducedMotion ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* 上部グラデーション (尺 + ♡ の可読性確保) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent"
      />

      {/* 左上: 尺バッジ */}
      {duration && (
        <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur-sm">
          {duration}
        </span>
      )}

      {/* 右上: ♡ ボタン — 認証時は LikeButton (オーバーレイ)、未認証は装飾アイコン */}
      <div
        className="absolute right-2 top-2 z-10 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-0"
        onClick={(e) => e.stopPropagation()}
      >
        {isAuthed ? (
          <LikeButton
            portfolioItemId={work.id}
            initialLiked={isLiked}
            initialCount={work.like_count}
            isAuthed
            variant="overlay"
          />
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
            <Heart size={14} strokeWidth={1.6} aria-hidden />
          </span>
        )}
      </div>

      {/* 下部グラデーション (常時表示テキストの可読性) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/40 to-transparent"
      />

      {/* 下端: 既定はタイトル + クリエイター、ホバー時は メタ情報に切替 */}
      <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[5]">
        {/* 既定表示: タイトル + クリエイター (hover で透明に) */}
        <div
          className={`transition-opacity duration-200 ${
            hovering ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="line-clamp-2 text-[12px] font-medium leading-snug text-white drop-shadow-sm">
            {work.title}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-white/75">
            {work.creator_display_name}
          </p>
        </div>

        {/* ホバー表示: メタバッジ (尺は左上にあるので、向き · 解像度 · AI ツール) */}
        <div
          className={`absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1 transition-opacity duration-200 ${
            hovering ? "opacity-100" : "opacity-0"
          }`}
        >
          <MetaBadge label={orientation} />
          {work.resolution && <MetaBadge label={work.resolution.toUpperCase()} />}
          {tool && <MetaBadge label={tool} variant="accent" />}
        </div>
      </div>
    </div>
  );
}

function MetaBadge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "accent";
}) {
  const cls =
    variant === "accent"
      ? "bg-sand/95 text-paper"
      : "bg-white/85 text-ink";
  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider backdrop-blur-sm ${cls}`}
    >
      {label}
    </span>
  );
}
