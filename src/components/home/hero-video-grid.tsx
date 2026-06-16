"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

/**
 * Hero 右カラム: 縦自動スクロール × Masonry (原寸アスペクト維持) のグリッド。
 *
 * 設計:
 * - 3 列を横並び (SP では 2 列に縮退)
 * - ★ 表示高さを「カード約 3 枚分 + わずかな見切れ」に絞り、ビュー内に
 *   一度に見えるのが各列 3 枚程度になるよう h-* を制限する
 *   (旧 4 列 × 縦長表示は雑然としていた → 整理)
 * - 各列の中身を 2 セット複製し、translateY のアニメーションで縦に流す
 *   ・1 周で -50% 移動 → 第 2 セットの先頭がちょうど元の位置に揃い、
 *     視覚的に途切れずループ
 * - 隣り合う列は流れる向きを互い違いに (1↑ / 2↓ / 3↑)
 * - 列ごとに速度を 42 / 50 / 58s で散らし、機械的な印象を回避
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
  /** デスクトップの列数。SP は強制 2 列。3 列に固定 (4 列以上は雑然のため不採用) */
  desktopColumns?: 3;
};

// 列ごとに流す向き + 速度 (1↑ / 2↓ / 3↑)。length は desktopColumns と一致
const COLUMN_ANIM = [
  "animate-marquee-v-42", // col1 ↑
  "animate-marquee-v-rev-50", // col2 ↓
  "animate-marquee-v-58", // col3 ↑
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

export function HeroVideoGrid({ tiles, desktopColumns = 3 }: Props) {
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
      {/* 高さ制限 + 上下フェード — 端で唐突に消えない。
          目安: カード 3 枚分 + 1 枚の見切れ程度に抑える。
          - SP: ~420px (2 列 × 3 枚弱)
          - sm: ~480px
          - lg: ~560px (3 列 × 3 枚程度) */}
      <div
        className="relative h-[420px] sm:h-[480px] lg:h-[560px] overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, black 8%, black 92%, transparent 100%)",
        }}
      >
        {/* デスクトップ: 3 列固定 */}
        <div className="hidden h-full gap-3 sm:flex sm:gap-4">
          {columns.map((col, ci) => (
            <MarqueeColumn
              key={ci}
              tiles={col}
              colIndex={ci}
              animClass={COLUMN_ANIM[ci % COLUMN_ANIM.length]}
              playingKey={playingKey}
              setPlayingKey={setPlayingKey}
              reducedMotion={reducedMotion}
              className="min-w-0 flex-1"
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

      {/* ギャラリー全体への導線 (Axis 風 .btn-axis) */}
      <div className="mt-6 flex justify-center">
        <Link href="/portfolios" className="btn-axis">
          View all works
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
      className={`group relative block ${aspect} overflow-hidden rounded-md border border-paper/8 bg-ink outline-none transition-transform duration-500 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-sand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep`}
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
          className={`absolute inset-0 bg-gradient-to-br from-paper/[0.06] via-paper/[0.02] to-transparent transition-opacity duration-300 ${
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

      {/* 下端 scrim + 再生ヒント (Axis 風に静かに) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-end gap-2 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-2.5">
        <span
          className={`inline-flex items-center gap-1 rounded-pill border border-paper/15 bg-paper/[0.05] px-2 py-0.5 text-[9px] font-medium tracking-wider text-paper/85 backdrop-blur-sm transition-opacity ${
            isPlaying ? "opacity-0" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Play size={8} strokeWidth={2.4} />
          PLAY
        </span>
      </div>
    </Link>
  );
}
