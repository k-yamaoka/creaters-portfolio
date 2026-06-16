"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

/**
 * Hero 右カラムに置く 縦 9:16 の作品グリッド。
 *
 * NN/g 準拠:
 * - デフォルト静止 (ページ読込と同時の自動再生・マーキーをしない)
 * - 各カードに poster (1 枚目フレーム) を表示
 * - 再生はホバー (PC) / タップ (モバイル) で「そのカードのみ」起動
 * - フォーカスが外れたら停止
 * - prefers-reduced-motion 時は完全静止 (再生開始イベントを無視)
 * - キーボード操作: Tab フォーカス → Enter / Space で再生切替
 * - 音声は常時ミュート (muted)
 * - 上下端は mask-image で背景フェード
 */

type Tile = {
  /** 動画ソース URL (mp4) */
  src: string;
  /** ポスター画像 URL (1 枚目フレームのサムネ) */
  poster?: string | null;
  /** クリック遷移先 (作品 / クリエイター詳細) */
  href: string;
  /** 読み上げ用のキャプション */
  alt: string;
};

type Props = {
  tiles: Tile[];
  /** 1 行に並べる列数 (デスクトップ)。SP は内部で 2 列に減らす */
  desktopColumns?: 3 | 4;
};

export function HeroVideoGrid({ tiles, desktopColumns = 3 }: Props) {
  // 1 度に再生する動画を 1 枚に絞るため、現在再生中の index を持つ
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  // prefers-reduced-motion を尊重 (動きを完全停止)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // タイル数が列数の倍数になるように調整 (見切れ防止)
  const cols = desktopColumns;
  const visible = tiles.slice(0, cols * 2); // 2 行ぶん

  const gridCols =
    cols === 4
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="relative">
      {/* 上下のフェード (端で自然に消す) */}
      <div
        className={`grid ${gridCols} gap-3 sm:gap-4`}
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, black 6%, black 94%, transparent 100%)",
        }}
      >
        {visible.map((t, i) => (
          <Tile
            key={i}
            tile={t}
            index={i}
            isPlaying={playingIdx === i && !reducedMotion}
            reducedMotion={reducedMotion}
            onRequestPlay={() => setPlayingIdx(i)}
            onRequestStop={() => setPlayingIdx((p) => (p === i ? null : p))}
          />
        ))}
      </div>

      {/* ギャラリーへの導線 (Baymard: 見切れ感より「もっと見る」の明示) */}
      <div className="mt-5 flex justify-center">
        <Link
          href="/portfolios"
          className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/[0.04] px-5 py-2 text-xs font-bold text-white/85 transition-colors hover:border-neon-pink/60 hover:text-neon-pink"
        >
          すべての作品を見る
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function Tile({
  tile,
  index,
  isPlaying,
  reducedMotion,
  onRequestPlay,
  onRequestStop,
}: {
  tile: Tile;
  index: number;
  isPlaying: boolean;
  reducedMotion: boolean;
  onRequestPlay: () => void;
  onRequestStop: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // isPlaying の変化に応じて実際の再生を制御
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying && !reducedMotion) {
      v.muted = true;
      v.play().catch(() => {
        /* autoplay policy 等で失敗 — 無視 */
      });
    } else {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }, [isPlaying, reducedMotion]);

  return (
    <Link
      href={tile.href}
      onMouseEnter={onRequestPlay}
      onMouseLeave={onRequestStop}
      onFocus={onRequestPlay}
      onBlur={onRequestStop}
      onTouchStart={onRequestPlay}
      // クリックは Link の遷移に任せる
      className="group relative block aspect-[9/16] overflow-hidden rounded-xl border border-white/10 bg-neon-midnight shadow-[0_18px_40px_-15px_rgba(0,0,0,0.6)] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-neon-pink/60"
      aria-label={`${tile.alt} (作品を開く${index === 0 ? " — 例" : ""})`}
    >
      {/* poster (デフォルト表示) */}
      {tile.poster ? (
        <Image
          src={tile.poster}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className={`object-cover transition-opacity duration-300 ${
            isPlaying ? "opacity-0" : "opacity-100"
          }`}
          unoptimized
        />
      ) : (
        // poster なし: グラデ プレースホルダ
        <div
          className={`absolute inset-0 bg-gradient-to-br from-neon-pink/30 via-neon-purple/30 to-neon-cyan/30 transition-opacity duration-300 ${
            isPlaying ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {/* video — playingIdx === i のときだけ再生 */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={tile.src}
        muted
        loop
        playsInline
        preload="none"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          isPlaying ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* 下端の暗オーバーレイ + 再生ヒント (WCAG コントラスト確保用 scrim) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm transition-opacity ${
            isPlaying ? "opacity-0" : "opacity-90 group-hover:opacity-100"
          }`}
        >
          <Play size={10} strokeWidth={2.6} fill="currentColor" />
          ホバーで再生
        </span>
      </div>
    </Link>
  );
}
