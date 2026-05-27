/**
 * トップ最上部の縦スクロール ビデオウォール。
 * - 5 カラムの動画が縦方向にゆっくり流れる(列ごとに上下方向を反転)
 * - 全カラムは autoplay loop muted で常時ループ再生
 * - 見出し/CTA は持たない(完全装飾セクション)
 * - サンプル動画は公開 CDN (Google sample bucket) の CC ライセンス物を使用
 */

type Tile = {
  src: string;
  poster?: string;
  aspect: "vertical" | "horizontal" | "square";
};

// 公開 CC ライセンス サンプル動画 (Google sample bucket / Cloudflare)
// 本番ではクリエイター実作品 (Cloudflare Stream 等) に差し替え予定
const SAMPLE_VIDEOS: string[] = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
];

// 5 カラム × 5 タイル の見せ場 (列ごとにアスペクト比を散らす)
const COLUMN_PATTERNS: Tile["aspect"][][] = [
  ["vertical", "horizontal", "square", "vertical", "horizontal"],
  ["horizontal", "vertical", "vertical", "square", "horizontal"],
  ["square", "horizontal", "vertical", "horizontal", "vertical"],
  ["vertical", "square", "horizontal", "vertical", "square"],
  ["horizontal", "vertical", "square", "horizontal", "vertical"],
];

function buildColumn(colIdx: number, sampleOffset: number): Tile[] {
  const pattern = COLUMN_PATTERNS[colIdx % COLUMN_PATTERNS.length];
  return pattern.map((aspect, i) => ({
    src: SAMPLE_VIDEOS[
      (sampleOffset + colIdx * pattern.length + i) % SAMPLE_VIDEOS.length
    ],
    aspect,
  }));
}

export function RandomGallery() {
  const columns: Tile[][] = [
    buildColumn(0, 0),
    buildColumn(1, 3),
    buildColumn(2, 6),
    buildColumn(3, 1),
    buildColumn(4, 8),
  ];

  // 列ごとの流れる方向 (上下交互)
  const animClasses = [
    "animate-marquee-vertical-slow",
    "animate-marquee-vertical-reverse",
    "animate-marquee-vertical-slow",
    "animate-marquee-vertical-reverse-slow",
    "animate-marquee-vertical",
  ];

  return (
    <section className="relative overflow-hidden bg-neon-midnight-deep">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-neon-pink opacity-25 blur-[140px]" />
      <div className="pointer-events-none absolute -right-32 top-40 h-[500px] w-[500px] rounded-full bg-neon-cyan opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 -bottom-32 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-neon-purple opacity-20 blur-[120px]" />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(rgba(157,92,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(157,92,255,0.18) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* 上下のフェード(セクション端と背景を馴染ませる) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-gradient-to-b from-neon-midnight-deep to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-neon-midnight-deep to-transparent" />

      {/* 縦カラム ビデオウォール */}
      <div className="relative h-[760px] overflow-hidden">
        <div className="mx-auto grid h-full max-w-container grid-cols-2 gap-3 px-3 sm:grid-cols-3 sm:gap-4 sm:px-4 md:grid-cols-4 lg:grid-cols-5">
          {columns.map((col, i) => (
            <VideoColumn key={i} tiles={col} animClass={animClasses[i]} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoColumn({
  tiles,
  animClass,
}: {
  tiles: Tile[];
  animClass: string;
}) {
  // ループのため2倍化
  const doubled = [...tiles, ...tiles];
  return (
    <div className="relative overflow-hidden">
      <div className={`flex flex-col gap-3 sm:gap-4 ${animClass}`}>
        {doubled.map((tile, i) => (
          <VideoTile key={i} tile={tile} />
        ))}
      </div>
    </div>
  );
}

function VideoTile({ tile }: { tile: Tile }) {
  const aspectClass =
    tile.aspect === "vertical"
      ? "aspect-[9/16]"
      : tile.aspect === "square"
        ? "aspect-square"
        : "aspect-video";

  return (
    <div
      className={`relative ${aspectClass} w-full overflow-hidden rounded-2xl border border-white/10 bg-neon-midnight shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]`}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={tile.src}
        poster={tile.poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      {/* subtle dark overlay for cohesion with the dark theme */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neon-midnight-deep/30" />
    </div>
  );
}
