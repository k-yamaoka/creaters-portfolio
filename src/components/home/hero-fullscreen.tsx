"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

/**
 * 100svh のフルスクリーン背景動画を、複数本のソースからランダムに切り替えて
 * 流し続ける Hero 用コンポーネント。
 *
 * 仕様 (axis-ov-films.co.jp 風):
 *  - 1 本の動画を最後まで再生 → onEnded で次のランダムな動画に切替
 *    (同じものが連続しないよう sample without replacement)
 *  - <video> は 1 要素のみ (重ね無し / "動画の上に動画を重ねない" 原則)
 *  - 切替時は黒からのフェードで継ぎ目を緩和 (opacity 0 → 1)
 *  - autoPlay muted playsInline、loop は使わない (回転制御するため)
 *  - prefers-reduced-motion: reduce 時は 1 本目で stop + currentTime=0
 *    (回転もしない)
 *  - 全 video は aria-hidden、本文 (overlay) のみが読み上げ対象
 *  - 上にスクリム gradient を重ね、テキストコントラストを確保
 *
 * Children は overlay として上に重なる。位置・余白は呼び出し側で決める。
 */

export type FullscreenVideoSource = {
  src: string;
  poster?: string | null;
};

type Props = {
  videos: FullscreenVideoSource[];
  /** overlay として上に重ねるコンテンツ (テキスト / CTA / mono ラベル等) */
  children?: React.ReactNode;
  /** 追加 className (高さ調整等) */
  className?: string;
};

// Fisher–Yates シャッフル (in-place、返り値は新しい配列)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type WindowWithIdle = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function HeroFullscreen({ videos, children, className = "" }: Props) {
  // クライアントマウント時にシャッフル順序を確定 (毎回ロードで違う順)。
  // 空配列ガード。1 本なら "ループっぽく" 同じものを使う (onEnded を無視)
  const [order, setOrder] = useState<FullscreenVideoSource[]>(videos);
  const [cursor, setCursor] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  // 2026-06-19 Section 8 パフォ: 初期ロードは poster のみ表示 (Image priority で
  // LCP 候補にする)。requestIdleCallback でメインスレッドが空いてから <video>
  // をマウントすることで Speed Index / TTI の悪化を防ぐ。
  const [videoReady, setVideoReady] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setOrder(shuffle(videos));
    setCursor(0);
  }, [videos]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Lazy video mount: ブラウザがアイドルになった後で <video> を mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (videos.length === 0) return;
    const w = window as WindowWithIdle;
    const cb = () => setVideoReady(true);
    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;
    if (typeof w.requestIdleCallback === "function") {
      idleHandle = w.requestIdleCallback(cb, { timeout: 1500 });
    } else {
      timeoutHandle = window.setTimeout(cb, 800);
    }
    return () => {
      if (idleHandle != null && typeof w.cancelIdleCallback === "function") {
        try {
          w.cancelIdleCallback(idleHandle);
        } catch {
          /* ignore */
        }
      }
      if (timeoutHandle != null) window.clearTimeout(timeoutHandle);
    };
  }, [videos.length]);

  // 動画切替時のフェードイン
  useEffect(() => {
    setOpacity(0);
    const t = window.setTimeout(() => setOpacity(1), 60);
    return () => window.clearTimeout(t);
  }, [cursor]);

  // 再生制御 (reduced-motion 時は pause + currentTime=0)。videoReady を依存に
  // 入れて、lazy mount 直後に明示的に play() を呼ぶ (autoPlay 属性のフォールバック)。
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (reducedMotion) {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
    } else {
      v.play().catch(() => {
        /* autoplay rejection (browser policy) */
      });
    }
  }, [cursor, reducedMotion, videoReady]);

  const handleEnded = useCallback(() => {
    if (reducedMotion) return;
    if (order.length <= 1) {
      // 1 本しか無いときはループ再生 (currentTime=0 で頭出し)
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
      return;
    }
    // 次の cursor に進む。順序リスト末尾まで行ったら再シャッフルして折返し
    setCursor((c) => {
      const next = c + 1;
      if (next >= order.length) {
        // 末尾を超えたら再シャッフル + 先頭から (連続重複だけ回避)
        setOrder((prev) => {
          let reshuf = shuffle(prev);
          if (reshuf[0]?.src === prev[prev.length - 1]?.src && reshuf.length > 1) {
            // 先頭が直前と同じならスワップ
            [reshuf[0], reshuf[1]] = [reshuf[1], reshuf[0]];
          }
          return reshuf;
        });
        return 0;
      }
      return next;
    });
  }, [order, reducedMotion]);

  const current = useMemo(() => order[cursor] ?? videos[0], [order, cursor, videos]);

  return (
    <section
      className={`relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-ink-deep text-paper ${className}`}
      aria-label="AILIER — AI クリエイターと企業をつなぐ"
    >
      {/* === Poster 画像 (LCP 候補) — Image priority で <link rel=preload> 自動付与 === */}
      {current?.poster && (
        <Image
          key={`poster-${current.src}`}
          src={current.poster}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
          style={{
            // video が再生開始したら poster をフェードアウト
            opacity: videoReady && !reducedMotion ? 0 : 1,
          }}
        />
      )}

      {/* === 背景動画 — idle 後にマウント。reduced-motion 時は永久に非マウント === */}
      {current && videoReady && !reducedMotion && (
        <video
          ref={videoRef}
          key={current.src}
          src={current.src}
          poster={current.poster ?? undefined}
          autoPlay
          muted
          playsInline
          preload="metadata"
          aria-hidden
          onEnded={handleEnded}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
          style={{ opacity }}
        />
      )}

      {/* スクリム — テキスト可読性 + axis 風沈静化 */}
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

      {/* オーバーレイ層 (テキスト / CTA / 装飾ラベル) */}
      <div className="relative z-10 mx-auto flex h-full max-w-wide flex-col px-6 lg:px-10">
        {children}
      </div>
    </section>
  );
}
