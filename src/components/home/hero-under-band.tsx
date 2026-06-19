"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Hero 直下に並ぶ動画帯 (axis hero-under 相当)。
 *
 * 仕様 (Section 5):
 * - 4 本前後の動画サムネを横一列に並べる
 * - 常時微再生 (autoplay muted loop) で「これは映像のサービスだ」を畳みかける
 * - 映像の上に映像を重ねない原則 — 単一行・タイル状で並べる (重なりなし)
 * - 全動画 muted、IntersectionObserver で帯が画面外のときは pause
 * - prefers-reduced-motion: reduce 時は再生せず poster 静止
 * - 各タイルはクリックで作品 / クリエイター詳細へ遷移
 *
 * レイアウト:
 * - SP: 1 行横スクロール (snap)
 * - lg 以上: 4 等分グリッド (gap 1px)、全動画が常時見える
 */

export type BandWork = {
  id: string;
  videoUrl: string;
  posterUrl: string | null;
  href: string;
  title: string;
  creatorName: string;
};

type Props = {
  works: BandWork[];
};

export function HeroUnderBand({ works }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videosRef = useRef<(HTMLVideoElement | null)[]>([]);
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
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 帯が画面外のときは全動画を pause、in-view + 非 reduced のとき play
  useEffect(() => {
    for (const v of videosRef.current) {
      if (!v) continue;
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
    }
  }, [inView, reducedMotion]);

  if (works.length === 0) return null;

  return (
    <section
      ref={containerRef}
      aria-label="注目の作品"
      className="relative bg-paper"
    >
      {/* SP: 横スクロール (snap-x) / lg: 4 等分 grid */}
      <div className="grid auto-cols-[80%] grid-flow-col gap-px overflow-x-auto bg-ink/[0.05] py-0 [scroll-snap-type:x_mandatory] sm:auto-cols-[40%] lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:overflow-visible">
        {works.slice(0, 4).map((w, i) => (
          <Link
            key={w.id}
            href={w.href}
            className="group relative block aspect-video overflow-hidden bg-ink [scroll-snap-align:start] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
            aria-label={`${w.creatorName} ${w.title}`}
          >
            {/* poster — 動画読込前 / reduced-motion 時の静止画 */}
            {w.posterUrl && (
              <Image
                src={w.posterUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
                className="object-cover transition-opacity duration-500 group-hover:opacity-90"
              />
            )}

            {/* 動画 (常時微再生) — IO + reduced-motion で制御 */}
            {!reducedMotion && (
              <video
                ref={(el) => {
                  videosRef.current[i] = el;
                }}
                src={w.videoUrl}
                poster={w.posterUrl ?? undefined}
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 [.in-view_&]:opacity-100"
                style={{ opacity: inView ? 1 : 0 }}
              />
            )}

            {/* 下端 scrim + クレジット */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 via-black/20 to-transparent"
            />
            <div className="pointer-events-none absolute inset-x-3 bottom-2 z-10">
              <p className="line-clamp-1 text-[11px] font-medium text-white drop-shadow-sm">
                {w.title}
              </p>
              <p className="mt-0.5 text-[10px] text-white/75">
                {w.creatorName}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
