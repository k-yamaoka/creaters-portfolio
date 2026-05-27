import Image from "next/image";
import Link from "next/link";
import type { CreatorWithRelations } from "@/lib/supabase/queries";

type GalleryItem = {
  key: string;
  src: string;
  alt: string;
  isImage: boolean;
  creatorId: string;
  creatorName: string;
  aspectRatio: "vertical" | "horizontal" | "square";
};

function flattenItems(creators: CreatorWithRelations[]): GalleryItem[] {
  const items: GalleryItem[] = [];
  for (const creator of creators) {
    for (const p of creator.portfolio_items) {
      const src = p.media_type === "image" ? p.image_url : p.thumbnail_url;
      if (!src) continue;
      items.push({
        key: p.id,
        src,
        alt: p.title,
        isImage: p.media_type === "image",
        creatorId: creator.id,
        creatorName: creator.profiles.display_name,
        aspectRatio: p.aspect_ratio,
      });
    }
  }
  return items;
}

/**
 * インデックスをハッシュ的にシャッフルして「ランダムっぽい順序」にするが、
 * SSR/Client で同じ結果を返すために決定的にする。
 */
function shuffleStable<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    // 決定的疑似乱数 (インデックスベース)
    const j = (i * 9301 + 49297) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Framer 風の多段マーキー + 3D パースペクティブ ギャラリー。
 * - 3行のタイルが反対方向にゆっくり流れる
 * - 全体を rotateX で奥行きを出し、3D 空間っぽく見せる
 * - ホバーでタイルが浮き上がる
 * - 端をフェードアウトしてシームレスな印象
 */
export function RandomGallery({
  creators,
  maxItems = 30,
}: {
  creators: CreatorWithRelations[];
  maxItems?: number;
}) {
  const all = flattenItems(creators);
  if (all.length === 0) return null;

  const shuffled = shuffleStable(all).slice(0, maxItems);

  // 3 行に分配
  const rows: GalleryItem[][] = [[], [], []];
  shuffled.forEach((item, i) => {
    rows[i % 3].push(item);
  });

  // 各行が空にならないようにフォールバック
  const fallback = shuffled[0];
  rows.forEach((row, i) => {
    if (row.length === 0 && fallback) rows[i] = [fallback];
  });

  return (
    <section className="relative overflow-hidden bg-neon-midnight-deep py-28 text-white">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-neon-pink opacity-25 blur-[140px]" />
      <div className="pointer-events-none absolute -right-32 top-40 h-[500px] w-[500px] rounded-full bg-neon-cyan opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 -bottom-32 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-neon-purple opacity-20 blur-[120px]" />

      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(157,92,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(157,92,255,0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Section header */}
      <div className="relative mx-auto mb-16 max-w-container px-6 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-neon-cyan">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
              AI CREATIVE GALLERY
            </p>
            <h2 className="mt-6 text-[2.25rem] font-black leading-[1.1] tracking-tight sm:text-[3rem] lg:text-[3.75rem]">
              無数の
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                AI 作品
              </span>
              から、
              <br className="hidden sm:block" />
              次の一本に出会う。
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-[1.85] text-white/60">
              AILIER に登録された AI クリエイターの作品が、流れるように。
              気になるタイルにホバーして、クリエイターのページへ。
            </p>
          </div>
          <Link
            href="/portfolios"
            className="group inline-flex items-center gap-2 rounded-pill border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
          >
            すべての作品を見る
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* 3D Perspective stage */}
      <div
        className="relative"
        style={{ perspective: "1400px", perspectiveOrigin: "center 30%" }}
      >
        {/* Edge fades (left/right) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-neon-midnight-deep to-transparent sm:w-48" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-neon-midnight-deep to-transparent sm:w-48" />

        <div
          className="space-y-5"
          style={{
            transform: "rotateX(8deg) rotateY(-1deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <MarqueeRow items={rows[0]} direction="left" speed="slow" />
          <MarqueeRow items={rows[1]} direction="right" speed="slow" />
          <MarqueeRow items={rows[2]} direction="left" speed="slow" />
        </div>
      </div>
    </section>
  );
}

function MarqueeRow({
  items,
  direction,
  speed,
}: {
  items: GalleryItem[];
  direction: "left" | "right";
  speed: "fast" | "slow";
}) {
  if (items.length === 0) return null;

  // ループのため2倍化(translateX(-50%) で1セット分流れる設計)
  const doubled = [...items, ...items];

  const animClass =
    direction === "left"
      ? speed === "slow"
        ? "animate-marquee-slow"
        : "animate-marquee"
      : speed === "slow"
        ? "animate-marquee-reverse-slow"
        : "animate-marquee-reverse";

  return (
    <div className="overflow-hidden">
      <div className={`flex w-max gap-5 ${animClass}`}>
        {doubled.map((item, i) => (
          <GalleryTile key={`${item.key}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function GalleryTile({ item }: { item: GalleryItem }) {
  // アスペクト比 → サイズ (高さ固定、幅が変動)
  const sizeClass =
    item.aspectRatio === "vertical"
      ? "h-[260px] w-[150px]"
      : item.aspectRatio === "square"
        ? "h-[260px] w-[260px]"
        : "h-[260px] w-[460px]";

  return (
    <Link
      href={`/creators/${item.creatorId}`}
      className={`group relative shrink-0 ${sizeClass} overflow-hidden rounded-2xl border border-white/10 bg-neon-midnight shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] hover:border-neon-pink/50 hover:shadow-[0_25px_80px_-15px_rgba(255,77,157,0.4)]`}
      aria-label={`${item.creatorName} の作品: ${item.alt}`}
    >
      {/* Browser-chrome top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-1.5 bg-neon-midnight-deep/95 px-3 py-2 backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-red-400/70" />
        <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
        <span className="h-2 w-2 rounded-full bg-green-400/70" />
        <span className="ml-2 truncate text-[9px] font-mono text-white/40">
          {item.creatorName}.ailier.jp
        </span>
        <span
          className={`ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-black ${
            item.isImage
              ? "bg-gradient-to-r from-neon-cyan to-neon-purple text-white"
              : "bg-neon-pink/20 text-neon-pink"
          }`}
        >
          {item.isImage ? "IMG" : "VIDEO"}
        </span>
      </div>

      {/* Image */}
      <Image
        src={item.src}
        alt={item.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="(max-width: 640px) 50vw, 25vw"
      />

      {/* Hover overlay: title + creator */}
      <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-neon-midnight-deep via-neon-midnight-deep/70 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="line-clamp-2 text-xs font-bold text-white">{item.alt}</p>
        <p className="mt-1 text-[10px] text-white/60">by {item.creatorName}</p>
      </div>
    </Link>
  );
}
