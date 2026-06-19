"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * Section 5 仕上げ: 静的セクションの余白に置いて「視界に動く映像」を維持する
 * 小動画タイル。
 *
 * 仕様:
 * - 通常時は poster 静止画、IO で画面内に入ったときだけ <video> を mount し
 *   autoplay muted loop で常時微再生
 * - 画面外では video が unmount 同等になり、DOM / メモリの負担なし
 * - prefers-reduced-motion: reduce 時は video 非マウント、poster 静止のみ
 * - クリック可能 (href 指定時) / クリック不可 (装飾用) の両モードに対応
 * - 親に decorative=true を渡せば aria-hidden で完全な装飾扱い
 */

type Props = {
  videoUrl: string;
  posterUrl: string | null;
  aspectRatio: "horizontal" | "vertical" | "square";
  /** クリック先 (省略時はリンクなし) */
  href?: string;
  /** 完全な装飾用 (aria-hidden + tabIndex=-1) */
  decorative?: boolean;
  /** クレジット (右下に小さく) */
  caption?: string;
  className?: string;
};

function aspectClass(a: Props["aspectRatio"]): string {
  return a === "vertical"
    ? "aspect-[9/16]"
    : a === "square"
      ? "aspect-square"
      : "aspect-video";
}

export function AccentVideoTile({
  videoUrl,
  posterUrl,
  aspectRatio,
  href,
  decorative = false,
  caption,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const apply = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { rootMargin: "200px 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 画面内 + 非 reduced で再生、画面外で pause
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (inView && !reducedMotion) {
      v.play().catch(() => {});
    } else {
      try {
        v.pause();
      } catch {
        /* ignore */
      }
    }
  }, [inView, reducedMotion]);

  const inner = (
    <div
      ref={ref}
      aria-hidden={decorative}
      tabIndex={decorative ? -1 : undefined}
      className={`group relative overflow-hidden bg-ink/[0.05] ${aspectClass(aspectRatio)} ${className}`}
    >
      {posterUrl && (
        <Image
          src={posterUrl}
          alt=""
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
      )}
      {!reducedMotion && inView && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl ?? undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 [&[data-in-view]]:opacity-100"
          style={{ opacity: inView ? 1 : 0 }}
        />
      )}
      {caption && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/55 to-transparent"
          />
          <span className="pointer-events-none absolute bottom-2 right-2 z-10 font-mono text-[9px] uppercase tracking-[0.16em] text-white/80">
            {caption}
          </span>
        </>
      )}
    </div>
  );

  if (href && !decorative) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
