import type { CreatorWithRelations } from "@/lib/supabase/queries";

/**
 * Hero 右カラムに置く 3 行横スクロールの映像マーキー。
 *
 * 仕様:
 * - 横長 (16:9) のタイルを 3 行ぶん並べる
 * - 各行は無限ループの横スクロール (transform: translateX のみ → GPU 任せ)
 * - 1 行目 ← 左へ / 2 行目 → 右へ / 3 行目 ← 左へ で動きを互い違いに
 * - 各行のスピードを微妙に変えて単調さを避ける (30 / 38 / 35 秒)
 * - ホバーで pause (CSS の :hover で animation-play-state)
 * - prefers-reduced-motion 時は CSS 側で animation を停止し静止
 * - 端をマスク (mask-image) でフェードアウト
 *
 * 動画ソース:
 * - DB に登録された MP4 ポートフォリオを優先利用
 * - 件数不足のときは FALLBACK_VIDEOS で埋める
 * - サンプルは AI 作品の代わりの仮素材 — FALLBACK_VIDEOS の配列を
 *   置換するだけで本番素材に切替えられる
 */

type Tile = {
  src: string;
  poster?: string | null;
};

const MP4_RE = /\.mp4(\?|$)/i;

/**
 * ★ 本番素材への差し替えポイント ★
 * 配列に URL を並べるだけで OK。ポスター (静止サムネ) を付ければホバー
 * 再生 / 通常静止の運用にしても帯域を圧縮できる。
 * 順番は気にしなくて良い (フォールバック分はランダムにシャッフルされない
 * が、DB 由来との混在順は実装側でケアする)。
 */
const FALLBACK_VIDEOS: Tile[] = [
  { src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4" },
  { src: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4" },
  { src: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4" },
  { src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4" },
  { src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_2MB.mp4" },
  { src: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_2MB.mp4" },
  { src: "https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_2MB.mp4" },
  { src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4" },
];

function extractTiles(creators: CreatorWithRelations[]): Tile[] {
  const tiles: Tile[] = [];
  for (const creator of creators) {
    for (const p of creator.portfolio_items) {
      if (p.media_type !== "video") continue;
      if (!p.video_url || !MP4_RE.test(p.video_url)) continue;
      tiles.push({ src: p.video_url, poster: p.thumbnail_url });
    }
  }
  return tiles;
}

/**
 * 配列を N 行に均等分配 (ラウンドロビン)。
 * 元素材が少ない場合は FALLBACK で埋める。各行に最低 4 枚は乗せる。
 */
function distribute(
  source: Tile[],
  rows: number,
  perRowMin = 4
): Tile[][] {
  const out: Tile[][] = Array.from({ length: rows }, () => []);
  if (source.length === 0) return out;
  const total = Math.max(source.length, rows * perRowMin);
  for (let i = 0; i < total; i++) {
    out[i % rows].push(source[i % source.length]);
  }
  return out;
}

export function HeroVideoMarquee({
  creators = [],
}: {
  creators?: CreatorWithRelations[];
}) {
  const dbTiles = extractTiles(creators);
  // 12 枚以上集まったら DB 素材だけで構成、それ未満なら FALLBACK に切替え
  const source = dbTiles.length >= 12 ? dbTiles : FALLBACK_VIDEOS;
  const rows = distribute(source, 3, 5);

  // 行ごとの方向 + 速度 (互い違い + 微差で動きに変化)
  const rowAnim = [
    "animate-marquee-h-38", // 1 行目: ← 左へ (38s)
    "animate-marquee-reverse-h-35", // 2 行目: → 右へ (35s)
    "animate-marquee-h-30", // 3 行目: ← 左へ (30s)
  ];

  return (
    <div
      className="relative w-full"
      // motion-reduce で子の animation を全停止する Tailwind 既定の
      // motion-reduce: ユーティリティを利用 (下の行 div 側で適用)
    >
      {/* 端のフェード (左右) — 親に mask-image を当てて画面端で自然に消す */}
      <div
        className="space-y-3 sm:space-y-4"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
        }}
      >
        {rows.map((row, i) => (
          <MarqueeRow key={i} tiles={row} animClass={rowAnim[i]} />
        ))}
      </div>
    </div>
  );
}

/**
 * 1 行分の横スクロールトラック。タイル列を 2 倍化して継ぎ目なしループ。
 * - group/marquee + group-hover/marquee:[animation-play-state:paused] で
 *   行単位の hover pause を実現 (peer 等を使わず純 CSS)
 * - prefers-reduced-motion 時は Tailwind の motion-reduce 修飾で停止
 */
function MarqueeRow({
  tiles,
  animClass,
}: {
  tiles: Tile[];
  animClass: string;
}) {
  if (tiles.length === 0) return <div />;
  const doubled = [...tiles, ...tiles];
  return (
    <div className="group/marquee relative overflow-hidden">
      <div
        className={`flex w-max gap-3 sm:gap-4 ${animClass} motion-reduce:!animate-none group-hover/marquee:[animation-play-state:paused]`}
      >
        {doubled.map((t, i) => (
          <VideoTile key={i} tile={t} />
        ))}
      </div>
    </div>
  );
}

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #ff4d9d, #9d5cff)",
  "linear-gradient(135deg, #4dd5f7, #9d5cff)",
  "linear-gradient(135deg, #9d5cff, #5b2dd1)",
  "linear-gradient(135deg, #ffae3b, #ff4d9d)",
  "linear-gradient(135deg, #e83fae, #5b2dd1)",
  "linear-gradient(135deg, #ff4d9d, #4dd5f7)",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function VideoTile({ tile }: { tile: Tile }) {
  const gradient =
    PLACEHOLDER_GRADIENTS[hashStr(tile.src) % PLACEHOLDER_GRADIENTS.length];
  return (
    <div
      // 横幅: SP 200 / SM 220 / LG 260 px、アスペクト 16:9 (横長)
      className="relative aspect-video h-auto w-[200px] shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-[0_18px_40px_-15px_rgba(0,0,0,0.6)] sm:w-[220px] lg:w-[260px]"
      style={{ background: gradient }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={tile.src}
        poster={tile.poster ?? undefined}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neon-midnight-deep/40" />
    </div>
  );
}
