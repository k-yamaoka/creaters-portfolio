"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";

/**
 * Cinematic Hero — axis-ov-films.co.jp の TOP オマージュ。
 *
 * 構造 (PC):
 *   ┌──────────────────────────────────────────────┐
 *   │ (背景 = 100svh ambient video / header の裏まで) │
 *   │ ┃ AILIER         (vertical mono)              │
 *   │ ┃ REEL 2026                                   │ ← (Sound)
 *   │ ┃                                             │
 *   │                                                │
 *   │                                                │
 *   │                                ┌──────┐       │
 *   │                                │ (02) │       │
 *   │                                └──────┘       │
 *   │  (01 — AILIER)              ┌──────────┐      │
 *   │  Frames of                  │  (01)    │      │
 *   │  tomorrow.                  └──────────┘      │
 *   │  AIクリエイターと、企業をつなぐ。              │
 *   │  [Get started] [クリエイターを探す]            │
 *   │  ▾ (Scroll to explore)                        │
 *   └──────────────────────────────────────────────┘
 *
 * 仕様:
 * - <main> は home で pt-0 になっているため、Hero は viewport 最上部から始まる。
 *   header (fixed h-20) は透過モードで動画の上に乗る。
 * - 全 video は autoPlay muted loop playsInline。
 *   prefers-reduced-motion: reduce → 全停止 + 0 秒戻し。
 * - Sound トグルでユーザー操作後に bg 動画の mute 解除可能。overlays は装飾扱い (muted 固定)。
 * - WCAG: 135° + 上下 fade gradient + grain 6% でテキストコントラスト 4.5:1 を確保。
 * - 全 video に aria-hidden="true"。テキストのみが読み上げ対象。
 */

export type CinematicTile = {
  src: string;
  poster?: string | null;
  aspect: "video" | "vertical" | "square";
};

type Props = {
  bg: { src: string; poster?: string | null };
  /** 右下に浮かぶ小映像。0〜2 枚まで (3 枚以上は無視) */
  overlays: CinematicTile[];
  overlayHref?: string;
};

function aspectClass(a: CinematicTile["aspect"]): string {
  return a === "vertical"
    ? "aspect-[9/16]"
    : a === "square"
      ? "aspect-square"
      : "aspect-video";
}

// SVG turbulence noise を data URL でインライン化。外部ファイル不要。
// baseFrequency 0.9 / opacity 0.55 → 細かいフィルム粒子感。
const NOISE_DATA_URL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.55'/></svg>\")";

export function HeroCinematic({
  bg,
  overlays,
  overlayHref = "/portfolios",
}: Props) {
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const overlayVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [muted, setMuted] = useState(true);

  // prefers-reduced-motion 対応 + 全 video の一括制御
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
          v.play().catch(() => {
            /* autoplay rejection (e.g. user has not interacted yet) */
          });
        }
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // muted トグルは bg 動画のみに反映 (overlays は装飾扱いで常に muted)
  useEffect(() => {
    const v = bgVideoRef.current;
    if (!v) return;
    v.muted = muted;
    if (!muted) {
      v.play().catch(() => {
        /* autoplay rejection — ユーザー操作後なので通常は成功 */
      });
    }
  }, [muted]);

  const tiles = overlays.slice(0, 2);

  return (
    <section
      className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-ink-deep text-paper"
      aria-label="AILIER — AI クリエイターと企業をつなぐ"
    >
      {/* === 背景フルスクリーン動画 === */}
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

      {/* === スクリム (テキスト可読性 + Axis 風沈静化) === */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,8,11,0.72) 0%, rgba(6,8,11,0.38) 45%, rgba(6,8,11,0.66) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-deep/85 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink-deep/90 to-transparent"
      />

      {/* === フィルム粒子グレイン (mix-blend-overlay 6%) === */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.06] mix-blend-overlay"
        style={{ backgroundImage: NOISE_DATA_URL, backgroundSize: "200px 200px" }}
      />

      {/* === 左サイド: 縦書き mono タイポ (Axis 風 "(AILIER — REEL 2026)") === */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 md:block"
      >
        <p
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-paper/45"
          style={{ writingMode: "vertical-rl" }}
        >
          (AILIER — REEL 2026)
        </p>
      </div>

      {/* === 右上: Sound トグル (ヘッダー下、コンテンツの邪魔をしない位置) === */}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "サウンドをオン" : "サウンドをオフ"}
        className="group absolute right-6 top-28 z-20 inline-flex items-center gap-2 rounded-pill border border-paper/20 bg-ink-deep/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/80 backdrop-blur-sm transition-colors hover:border-paper/40 hover:text-paper lg:right-10"
      >
        {/* 簡易スピーカーアイコン */}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5 6 9H3v6h3l5 4V5z"
          />
          {muted ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 9l5 6m0-6-5 6"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 9a4 4 0 0 1 0 6"
            />
          )}
        </svg>
        <span>{muted ? "Sound off" : "Sound on"}</span>
      </button>

      {/* === テキスト層: 左下 1/3 寄せ (Axis 風) === */}
      <div className="relative z-10 mx-auto flex h-full max-w-wide flex-col justify-end px-gutter pb-20 pt-32 sm:pb-28 lg:pb-32">
        <div className="max-w-xl lg:max-w-2xl">
          <RevealOnScroll delay={0}>
            <p className="eyebrow-mono">(01 — AILIER)</p>
          </RevealOnScroll>

          <RevealOnScroll delay={80}>
            <h1 className="headline-display mt-6 text-[clamp(2.75rem,8vw,6rem)] text-paper">
              Frames of <span className="italic text-sand">tomorrow.</span>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={160}>
            <p className="heading-jp mt-6 text-[1.125rem] text-paper/90 sm:text-[1.375rem]">
              AIクリエイターと、企業をつなぐ。
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={240}>
            <p className="body-jp mt-6 max-w-prose-jp text-sm text-paper/75 sm:text-base">
              Sora、Veo、Runway、Seedance。
              <br />
              新しい映像言語を操るクリエイターと、
              <br />
              語るべき物語を持つ企業が、ひとつの卓を囲む場所。
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={360}>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="/register" className="btn-axis">
                Get started
              </Link>
              <Link href="/creators" className="btn-axis-ghost">
                クリエイターを探す
              </Link>
            </div>
          </RevealOnScroll>
        </div>

        {/* スクロールヒント — text の直下、左寄せ */}
        <RevealOnScroll delay={520} className="mt-12">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/55">
            <span aria-hidden>▾</span>
            <span>(Scroll to explore)</span>
          </span>
        </RevealOnScroll>
      </div>

      {/* === 右下に重なる小映像 2 枚 (lg 以上のみ) === */}
      {tiles.length > 0 && (
        <div className="pointer-events-none absolute bottom-[10vh] right-[6vw] z-10 hidden lg:block">
          <RevealOnScroll delay={500}>
            <div className="pointer-events-auto relative">
              {tiles[0] && (
                <Link
                  href={overlayHref}
                  className={`group block ${aspectClass(tiles[0].aspect)} w-[clamp(280px,28vw,420px)] overflow-hidden rounded-md border border-paper/15 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)] outline-none transition-transform duration-500 ease-out hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-sand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep`}
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
                    className="h-full w-full object-cover transition-[filter] duration-500 group-hover:brightness-110"
                  />
                  {/* (01) 番号ラベル — Axis 風 */}
                  <span
                    aria-hidden
                    className="absolute left-3 top-3 z-10 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/85 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
                  >
                    (01)
                  </span>
                  {/* (Now playing) ホバー reveal */}
                  <span
                    aria-hidden
                    className="absolute bottom-3 left-3 z-10 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/0 transition-colors duration-300 group-hover:text-paper/85"
                  >
                    (Now playing)
                  </span>
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"
                  />
                </Link>
              )}
              {tiles[1] && (
                <Link
                  href={overlayHref}
                  className={`group absolute -left-40 -top-28 block ${aspectClass(tiles[1].aspect)} w-[clamp(160px,18vw,240px)] overflow-hidden rounded-md border border-paper/15 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.9)] outline-none transition-transform duration-500 ease-out hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-sand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep`}
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
                    className="h-full w-full object-cover transition-[filter] duration-500 group-hover:brightness-110"
                  />
                  <span
                    aria-hidden
                    className="absolute left-3 top-3 z-10 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/85 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
                  >
                    (02)
                  </span>
                  <span
                    aria-hidden
                    className="absolute bottom-3 left-3 z-10 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/0 transition-colors duration-300 group-hover:text-paper/85"
                  >
                    (Now playing)
                  </span>
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
    </section>
  );
}
