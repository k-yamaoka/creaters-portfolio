"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

/**
 * Hero 右カラム: 縦自動スクロール × Masonry (原寸アスペクト維持) のグリッド。
 *
 * 設計:
 * - 3〜4 列を横並び。各列は中で flex-col + 異なる高さのカードを縦に積み上げる
 *   (= Masonry に見える)
 * - 各列の中身を 2 セット複製し、translateY のアニメーションで縦に流す
 *   ・1 周で -50% 移動 → 第 2 セットの先頭がちょうど元の位置に揃い、
 *     視覚的に途切れずループ
 * - 隣り合う列は流れる向きを互い違いに (1↑ / 2↓ / 3↑ / 4↓)
 * - 列ごとに速度を 42 / 50 / 58 / 46s で散らし、機械的な印象を回避
 *
 * UX/NN/g 緩和策:
 * - 列に group/marquee を当て、ホバーで [animation-play-state:paused]
 * - prefers-reduced-motion: motion-reduce で animation を完全停止
 *   (静的 Masonry にフォールバック)
 * - 全動画は常時 muted + デフォルト静止 (poster 表示)
 *   ホバー/フォーカス/タップしたカードのみ video を再生
 * - 上下端は mask-image で背景フェード
 * - カードはキーボードフォーカス可、focus-visible リング
 * - クリックで /creators/[id] 等の詳細へ遷移
 * - グリッド直下に「すべての作品を見る」リンク
 *
 * アスペクト:
 * - 各タイルは aspect = "video"(16:9) / "vertical"(9:16) / "square"(1:1) /
 *   "tall"(4:5) を持ち、aspect-* で原寸表示
 * - object-cover で歪まずトリミング
 */

export type GridTile = {
  src: string;
  poster?: string | null;
  href: string;
  alt: string;
  /** 元動画の比率。CSS 側で aspect-* を切替える */
  aspect?: "video" | "vertical" | "square" | "tall";
};

type Props = {
  tiles: GridTile[];
  /** デスクトップの列数。SP は強制 2 列。 */
  desktopColumns?: 3 | 4;
};

// 列ごとに流す向き + 速度。length は max(desktopColumns) と一致
const COLUMN_ANIM = [
  "animate-marquee-v-42", // col1 ↑
  "animate-marquee-v-rev-50", // col2 ↓
  "animate-marquee-v-58", // col3 ↑
  "animate-marquee-v-rev-46", // col4 ↓
];

function aspectClass(a: GridTile["aspect"]): string {
  switch (a) {
    case "vertical":
      return "aspect-[9/16]";
    case "square":
      return "aspect-square";
    case "tall":
      return "aspect-[4/5]";
    case "video":
    default:
      return "aspect-video";
  }
}

/**
 * タイルを N 列にラウンドロビンで分配。1 列に最低 5 枚は配置 (少なすぎると
 * ループ時の継ぎ目が早く回りすぎて目立つ)。元データが少ない場合は
 * 同じ素材を繰り返して埋める。
 */
function distribute(tiles: GridTile[], cols: number, minPerCol = 5): GridTile[][] {
  const out: GridTile[][] = Array.from({ length: cols }, () => []);
  if (tiles.length === 0) return out;
  const target = Math.max(cols * minPerCol, tiles.length);
  for (let i = 0; i < target; i++) {
    out[i % cols].push(tiles[i % tiles.length]);
  }
  return out;
}

export function HeroVideoGrid({ tiles, desktopColumns = 4 }: Props) {
  // 現在再生中のカードを 1 枚に絞るためのキー (列番号-行番号)
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handle = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  const cols = desktopColumns;
  const columns = distribute(tiles, cols, 5);
  // SP では 2 列にまとめ直し (max 2 列ぶんだけ表示)
  const mobileColumns = distribute(tiles, 2, 4);

  return (
    <div className="relative w-full">
      {/* 高さ制限 + 上下フェード — 端で唐突に消えない */}
      <div
        className="relative h-[560px] sm:h-[640px] lg:h-[720px] overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0, black 7%, black 93%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, black 7%, black 93%, transparent 100%)",
        }}
      >
        {/* デスクトップ: cols 列 */}
        <div className={`hidden h-full gap-3 sm:gap-4 sm:flex`}>
          {(typeof window !== "undefined"
            ? columns
            : columns
          ).map((col, ci) => (
            <MarqueeColumn
              key={ci}
              tiles={col}
              colIndex={ci}
              animClass={COLUMN_ANIM[ci % COLUMN_ANIM.length]}
              playingKey={playingKey}
              setPlayingKey={setPlayingKey}
              reducedMotion={reducedMotion}
              className={`min-w-0 flex-1 ${
                ci >= 3 ? "hidden lg:block" : ""
              }`}
            />
          ))}
        </div>

        {/* SP: 2 列固定 */}
        <div className="flex h-full gap-3 sm:hidden">
          {mobileColumns.map((col, ci) => (
            <MarqueeColumn
              key={`m-${ci}`}
              tiles={col}
              colIndex={ci}
              animClass={COLUMN_ANIM[ci % 2 === 0 ? 0 : 1]}
              playingKey={playingKey}
              setPlayingKey={setPlayingKey}
              reducedMotion={reducedMotion}
              className="min-w-0 flex-1"
            />
          ))}
        </div>
      </div>

      {/* ギャラリー全体への導線 */}
      <div className="mt-5 flex justify-center">
        <Link
          href="/portfolios"
          className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/[0.04] px-5 py-2 text-xs font-bold text-white/85 transition-colors hover:border-neon-pink/60 hover:text-neon-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-pink"
        >
          すべての作品を見る
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function MarqueeColumn({
  tiles,
  colIndex,
  animClass,
  playingKey,
  setPlayingKey,
  reducedMotion,
  className = "",
}: {
  tiles: GridTile[];
  colIndex: number;
  animClass: string;
  playingKey: string | null;
  setPlayingKey: (k: string | null) => void;
  reducedMotion: boolean;
  className?: string;
}) {
  if (tiles.length === 0) return <div className={className} />;
  // 2 セット複製 → translateY -50% で 1 セットぶん流せばシームレス
  const doubled = [...tiles, ...tiles];
  return (
    <div className={`group/marquee overflow-hidden ${className}`}>
      <div
        // 列の内側を flex-col で積み上げる (= Masonry に見える)
        // motion-reduce 時は animation を切ってその場で停止 (静的 Masonry)
        className={`flex flex-col gap-3 sm:gap-4 ${animClass} motion-reduce:!animate-none group-hover/marquee:[animation-play-state:paused]`}
      >
        {doubled.map((t, i) => {
          const isOriginal = i < tiles.length;
          const key = `${colIndex}-${i}`;
          return (
            <Tile
              key={key}
              tile={t}
              tileKey={key}
              isPlaying={playingKey === key && !reducedMotion}
              reducedMotion={reducedMotion}
              onRequestPlay={() => setPlayingKey(key)}
              onRequestStop={() =>
                setPlayingKey(playingKey === key ? null : playingKey)
              }
              // 第 2 セットはスクリーンリーダー上は重複なので隠す
              ariaHidden={!isOriginal}
            />
          );
        })}
      </div>
    </div>
  );
}

function Tile({
  tile,
  tileKey,
  isPlaying,
  reducedMotion,
  onRequestPlay,
  onRequestStop,
  ariaHidden,
}: {
  tile: GridTile;
  tileKey: string;
  isPlaying: boolean;
  reducedMotion: boolean;
  onRequestPlay: () => void;
  onRequestStop: () => void;
  ariaHidden?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying && !reducedMotion) {
      v.muted = true;
      v.play().catch(() => {
        /* autoplay 失敗 (ユーザー操作起因なら普通は通る) */
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

  const aspect = aspectClass(tile.aspect);

  return (
    <Link
      href={tile.href}
      onMouseEnter={onRequestPlay}
      onMouseLeave={onRequestStop}
      onFocus={onRequestPlay}
      onBlur={onRequestStop}
      onTouchStart={onRequestPlay}
      className={`group relative block ${aspect} overflow-hidden rounded-xl border border-white/10 bg-neon-midnight outline-none shadow-[0_18px_40px_-15px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-neon-pink/60`}
      aria-hidden={ariaHidden}
      tabIndex={ariaHidden ? -1 : 0}
      aria-label={ariaHidden ? undefined : `${tile.alt} (作品を開く)`}
      data-tile={tileKey}
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
        <div
          className={`absolute inset-0 bg-gradient-to-br from-neon-pink/30 via-neon-purple/30 to-neon-cyan/30 transition-opacity duration-300 ${
            isPlaying ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {/* video — playingKey === key のときだけ再生 */}
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

      {/* 下端 scrim + 再生ヒント (WCAG コントラスト確保) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-2.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm transition-opacity ${
            isPlaying ? "opacity-0" : "opacity-90 group-hover:opacity-100"
          }`}
        >
          <Play size={9} strokeWidth={2.6} fill="currentColor" />
          ホバーで再生
        </span>
      </div>
    </Link>
  );
}
