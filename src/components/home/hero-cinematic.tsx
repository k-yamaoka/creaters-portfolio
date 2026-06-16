"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";

/**
 * Cinematic Hero — フルスクリーン背景動画 + 左上 Axis 風テキスト + 右下に
 * 小さく重なる映像 2 枚。axis-ov-films.co.jp のオマージュ。
 *
 * 構造 (PC):
 *   ┌──────────────────────────────────────────────┐
 *   │ (背景 = 100vh ambient video + 微 scrim)        │
 *   │                                                │
 *   │ (01 — AILIER)                                  │
 *   │ Frames of tomorrow.                            │
 *   │ AIクリエイターと、企業をつなぐ。               │
 *   │                                                │
 *   │ Sora、Veo、Runway、Seedance。                  │
 *   │                                                │
 *   │ Get started   クリエイターを探す              │
 *   │                                                │
 *   │                       ┌────┐                  │
 *   │                       │縦 │                   │
 *   │                       │   │  ┌────────┐       │
 *   │                       └────┘  │ 横 16:9 │       │
 *   │                                └────────┘       │
 *   │                       ↓ Scroll                  │
 *   └──────────────────────────────────────────────┘
 *
 * 機能:
 * - 背景動画: autoPlay muted loop playsInline (アンビエント映像)
 * - 小タイル 2 枚: 同じく autoPlay loop muted、PC 専用 (SP では非表示)
 * - prefers-reduced-motion: reduce 時は全動画停止 + poster 静止
 * - 全 video に aria-hidden="true" (装飾扱い、テキストのみが読み上げられる)
 * - WCAG: 暗 gradient scrim でテキストコントラスト 4.5:1 以上を確保
 */

export type CinematicTile = {
  src: string;
  poster?: string | null;
  /** タイルの比率 (絶対配置で aspect を決定) */
  aspect: "video" | "vertical" | "square";
};

type Props = {
  bg: { src: string; poster?: string | null };
  /** 右下に浮かぶ小映像。0〜2 枚まで (3 枚以上は無視) */
  overlays: CinematicTile[];
  /** 詳細ページへのリンク (任意。指定があれば overlays クリックでこちらへ) */
  overlayHref?: string;
};

function aspectClass(a: CinematicTile["aspect"]): string {
  return a === "vertical"
    ? "aspect-[9/16]"
    : a === "square"
      ? "aspect-square"
      : "aspect-video";
}

export function HeroCinematic({ bg, overlays, overlayHref = "/portfolios" }: Props) {
  // 全 <video> ref を集めて prefers-reduced-motion 制御に使う
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const overlayVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const all = [bgVideoRef.current, ...overlayVideoRefs.current].filter(
        Boolean
      ) as HTMLVideoElement[];
      for (const v of all) {
        if (mq.matches) {
          try {
            v.pause();
            v.currentTime = 0;
          } catch {
            /* ignore */
          }
        } else {
          v.muted = true;
          v.play().catch(() => {
            /* ignore autoplay rejection */
          });
        }
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // overlays は最大 2 枚に切り詰める
  const tiles = overlays.slice(0, 2);

  return (
    <section
      className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-ink-deep text-paper lg:max-h-[920px]"
      aria-label="AILIER — AI クリエイターと企業をつなぐ"
    >
      {/* 背景フルスクリーン動画 */}
      <video
        ref={bgVideoRef}
        src={bg.src}
        poster={bg.poster ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Scrim — テキスト可読性と Axis 風の沈静化を両立 */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,8,11,0.78) 0%, rgba(6,8,11,0.42) 50%, rgba(6,8,11,0.62) 100%)",
        }}
      />
      {/* 上端と下端をやや暗く落としテキストとフッタヒントを浮かす */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-deep/85 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-deep/80 to-transparent"
      />

      {/* テキスト層 (左上 Axis スタイル) */}
      <div className="relative z-10 mx-auto flex h-full max-w-wide flex-col justify-center px-gutter pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="max-w-xl lg:max-w-2xl">
          <RevealOnScroll delay={0}>
            <p className="eyebrow-mono">(01 — AILIER)</p>
          </RevealOnScroll>

          <RevealOnScroll delay={80}>
            <h1 className="headline-display mt-8 text-[clamp(2.5rem,7vw,5.25rem)] text-paper">
              Frames of <span className="italic text-sand">tomorrow.</span>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={160}>
            <p className="heading-jp mt-6 text-[1.125rem] text-paper/90 sm:text-[1.375rem]">
              AIクリエイターと、企業をつなぐ。
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={240}>
            <p className="body-jp mt-8 max-w-prose-jp text-sm text-paper/80 sm:text-base">
              Sora、Veo、Runway、Seedance。
              <br />
              新しい映像言語を操るクリエイターと、
              <br />
              語るべき物語を持つ企業が、ひとつの卓を囲む場所。
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={360}>
            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="/register" className="btn-axis">
                Get started
              </Link>
              <Link href="/creators" className="btn-axis-ghost">
                クリエイターを探す
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </div>

      {/* 右下に重なる小映像 2 枚 (lg 以上のみ表示) */}
      {tiles.length > 0 && (
        <div className="pointer-events-none absolute bottom-12 right-12 z-10 hidden lg:block">
          <RevealOnScroll delay={500}>
            <div className="pointer-events-auto relative">
              {/* タイル A (メイン、横長 or 用途次第。配列の 0 番目) */}
              {tiles[0] && (
                <Link
                  href={overlayHref}
                  className={`group block ${aspectClass(tiles[0].aspect)} w-[clamp(220px,22vw,320px)] overflow-hidden rounded-md border border-paper/15 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] outline-none transition-transform duration-500 ease-out hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-sand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep`}
                  aria-label="作品ギャラリーへ"
                >
                  <video
                    ref={(el) => {
                      overlayVideoRefs.current[0] = el;
                    }}
                    src={tiles[0].src}
                    poster={tiles[0].poster ?? undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden
                    className="h-full w-full object-cover"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"
                  />
                </Link>
              )}
              {/* タイル B (配列の 1 番目) — A の左上にオフセットして重ねる */}
              {tiles[1] && (
                <Link
                  href={overlayHref}
                  className={`group absolute -left-32 -top-20 block ${aspectClass(tiles[1].aspect)} w-[clamp(120px,14vw,180px)] overflow-hidden rounded-md border border-paper/15 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.85)] outline-none transition-transform duration-500 ease-out hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-sand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep`}
                  aria-label="作品ギャラリーへ"
                  tabIndex={-1}
                >
                  <video
                    ref={(el) => {
                      overlayVideoRefs.current[1] = el;
                    }}
                    src={tiles[1].src}
                    poster={tiles[1].poster ?? undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden
                    className="h-full w-full object-cover"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"
                  />
                </Link>
              )}
            </div>
          </RevealOnScroll>
        </div>
      )}

      {/* スクロールヒント */}
      <RevealOnScroll
        delay={700}
        className="absolute inset-x-0 bottom-6 z-10 flex justify-center"
      >
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/55">
          <span aria-hidden className="inline-block h-px w-8 bg-paper/30" />
          Scroll
        </span>
      </RevealOnScroll>
    </section>
  );
}
