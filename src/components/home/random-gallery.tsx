import type { CreatorWithRelations } from "@/lib/supabase/queries";

/**
 * トップ最上部の縦スクロール ビデオウォール。
 * - 5 カラムの動画が縦方向にゆっくり流れる(列ごとに上下方向を反転)
 * - 各タイルは autoplay loop muted で常時ループ再生
 * - 見出し/CTA は持たない(完全装飾セクション)
 * - DB に登録された MP4 ポートフォリオから自動取得
 * - DB が空のときは公開 CDN のサンプルにフォールバック
 */

type Tile = {
  src: string;
  poster?: string | null;
  aspect: "vertical" | "horizontal" | "square";
};

// MP4 直リンク (DB 由来 or フォールバック) でない動画は除外
const MP4_RE = /\.mp4(\?|$)/i;

// DB が空のときに使うフォールバック (CC ライセンス、公開 CDN で 200 確認済み)
const FALLBACK_VIDEOS: Tile[] = [
  { src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4", aspect: "horizontal" },
  { src: "https://media.w3.org/2010/05/sintel/trailer.mp4", aspect: "horizontal" },
  { src: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4", aspect: "vertical" },
  { src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", aspect: "vertical" },
  { src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4", aspect: "vertical" },
  { src: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4", aspect: "horizontal" },
  { src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4", aspect: "horizontal" },
  { src: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_5MB.mp4", aspect: "horizontal" },
  { src: "https://www.w3schools.com/html/mov_bbb.mp4", aspect: "square" },
];

function extractTiles(creators: CreatorWithRelations[]): Tile[] {
  const tiles: Tile[] = [];
  for (const creator of creators) {
    for (const p of creator.portfolio_items) {
      if (p.media_type !== "video") continue;
      if (!p.video_url || !MP4_RE.test(p.video_url)) continue;
      tiles.push({
        src: p.video_url,
        poster: p.thumbnail_url,
        aspect: p.aspect_ratio,
      });
    }
  }
  return tiles;
}

// 列ごとに 5 枚ずつ配るシンプルなラウンドロビン
function buildColumns(tiles: Tile[], numColumns: number, perColumn = 5): Tile[][] {
  const columns: Tile[][] = Array.from({ length: numColumns }, () => []);
  if (tiles.length === 0) return columns;
  for (let i = 0; i < numColumns * perColumn; i++) {
    columns[i % numColumns].push(tiles[i % tiles.length]);
  }
  return columns;
}

export function RandomGallery({
  creators = [],
}: {
  creators?: CreatorWithRelations[];
}) {
  const dbTiles = extractTiles(creators);
  const source = dbTiles.length >= 5 ? dbTiles : FALLBACK_VIDEOS;

  const NUM_COLS = 5;
  const columns = buildColumns(source, NUM_COLS, 5);

  // 列ごとの流れる方向 (上下交互、速度も少しずつ変える)
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

      {/* 上下のフェード */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-gradient-to-b from-neon-midnight-deep to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-neon-midnight-deep to-transparent" />

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
  if (tiles.length === 0) return <div />;
  // ループ用に2倍化
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
        poster={tile.poster ?? undefined}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neon-midnight-deep/30" />
    </div>
  );
}
