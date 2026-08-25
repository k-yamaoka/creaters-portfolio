"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * 100svh のフルスクリーン背景動画を、複数本のソースからランダムに切り替えて
 * 流し続ける Hero 用コンポーネント。
 *
 * 仕様 (axis-ov-films.co.jp 風):
 *  - 1 本 10 秒経過 or 再生終了 (どちらか早い方) で次のランダムな動画に切替
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

// 1 本あたりの最大表示秒数。動画が長くてもこの秒数で強制切替。
const MAX_SEGMENT_MS = 10_000;

// Fisher–Yates シャッフル (in-place、返り値は新しい配列)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HeroFullscreen({ videos, children, className = "" }: Props) {
  // クライアントマウント時にシャッフル順序を確定 (毎回ロードで違う順)。
  // 空配列ガード。1 本なら "ループっぽく" 同じものを使う (onEnded を無視)
  const [order, setOrder] = useState<FullscreenVideoSource[]>(videos);
  const [cursor, setCursor] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
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

  // 動画切替時のフェードイン
  useEffect(() => {
    setOpacity(0);
    const t = window.setTimeout(() => setOpacity(1), 60);
    return () => window.clearTimeout(t);
  }, [cursor]);

  // 再生制御 (reduced-motion 時は pause + currentTime=0)
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
  }, [cursor, reducedMotion]);

  const advance = useCallback(() => {
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

  // 10 秒経過で強制切替 (動画の長さに関わらず一定リズムで回す)。
  // 動画終了 (onEnded → advance) が先に走った場合は cursor が変わり
  // effect が再セットアップされるので、二重切替はしない。
  useEffect(() => {
    if (reducedMotion) return;
    if (order.length <= 1) return;
    const t = window.setTimeout(advance, MAX_SEGMENT_MS);
    return () => window.clearTimeout(t);
  }, [cursor, order, reducedMotion, advance]);

  const current = useMemo(() => order[cursor] ?? videos[0], [order, cursor, videos]);

  return (
    <section
      // 2026-08-25 リブランド: Cinema Ink 化
      //   純黒 (bg-ink-deep) を深紺 (aimovie-navy-950) に変更し、映画のフィルム感を強化。
      className={`relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-aimovie-navy-950 text-white ${className}`}
      aria-label="アイムビ — AI クリエイターと企業をつなぐ"
    >
      {current && (
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
          onEnded={advance}
          // 2026-07-21 改修: 背景動画は装飾なので ユーザー操作 (右クリック / ドラッグ /
          //   iOS long-press メディアパネル) を全遮断。テキスト選択も無効化。
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noremoteplayback noplaybackrate"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-700 ease-out"
          style={{ opacity }}
        />
      )}

      {/* スクリム — テキスト可読性 + Cinema Ink の深紺トーン */}
      {/*   純黒 rgba(6,8,11,...) から 深紺 rgba(10,20,40,...) にシフト。 */}
      {/*   ハイライト角に ember tint を薄く差して "光源" の存在を暗示。 */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,20,40,0.78) 0%, rgba(10,20,40,0.32) 45%, rgba(10,20,40,0.70) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-aimovie-navy-950/90 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-aimovie-navy-950/95 to-transparent"
      />
      {/* 左下 ember グロー (装飾): CTA 領域をほのかに温めるための光源 */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 -translate-x-1/3 translate-y-1/4 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #FF6B35, transparent)" }}
      />

      {/* フィルムパーフォレーション (perforation) — 上下端に四角穴が並ぶ film-strip モチーフ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-3 hidden h-2 items-center justify-between gap-2 px-6 opacity-40 md:flex"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={`t${i}`}
            className="h-2 w-4 rounded-[2px] bg-white/20"
          />
        ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-3 hidden h-2 items-center justify-between gap-2 px-6 opacity-40 md:flex"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={`b${i}`}
            className="h-2 w-4 rounded-[2px] bg-white/20"
          />
        ))}
      </div>

      {/* 四隅コーナー クロップマーク (映画スクリプトの trim mark 風) — ember 色 */}
      <div aria-hidden className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-aimovie-ember-500/70 md:left-6 md:top-6" />
      <div aria-hidden className="pointer-events-none absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-aimovie-ember-500/70 md:right-6 md:top-6" />
      <div aria-hidden className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-aimovie-ember-500/70 md:bottom-6 md:left-6" />
      <div aria-hidden className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-aimovie-ember-500/70 md:bottom-6 md:right-6" />

      {/* オーバーレイ層 (テキスト / CTA / 装飾ラベル) */}
      <div className="relative z-10 mx-auto flex h-full max-w-wide flex-col px-6 lg:px-10">
        {children}
      </div>
    </section>
  );
}
