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

/**
 * 全クリエイターのポートフォリオから画像/サムネを集めて散らばり風に表示する。
 * 完全ランダムだと SSR <-> Client で順序がブレるので、items 順をそのまま使い
 * インデックスベースで配置パターンを循環させる。
 */
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

// インデックスを「散らばり感」のあるパターンに変換
function getTileStyle(idx: number, ratio: GalleryItem["aspectRatio"]) {
  // 縦方向の微妙なズレ (連続行で互い違いに)
  const yOffsets = [0, 24, -16, 32, -24, 12, -32, 20];
  const yShift = yOffsets[idx % yOffsets.length];

  // 軽い傾き (固定パターンで自然な散らばり)
  const rotates = [-1.5, 1, -0.5, 2, -2, 0.5, 1.5, -1];
  const rotate = rotates[idx % rotates.length];

  // アスペクト比 → グリッドスパン
  const spanClasses =
    ratio === "vertical"
      ? "row-span-2 aspect-[9/16]"
      : ratio === "square"
        ? "row-span-1 aspect-square"
        : "row-span-1 aspect-video";

  return {
    transform: `translateY(${yShift}px) rotate(${rotate}deg)`,
    className: spanClasses,
  };
}

export function RandomGallery({
  creators,
  maxItems = 18,
}: {
  creators: CreatorWithRelations[];
  maxItems?: number;
}) {
  const items = flattenItems(creators).slice(0, maxItems);

  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-paper-deep py-24">
      {/* Decorative neon glow blobs */}
      <div className="pointer-events-none absolute -left-32 top-12 h-[400px] w-[400px] rounded-full bg-neon-pink opacity-10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-[360px] w-[360px] rounded-full bg-neon-cyan opacity-15 blur-[120px]" />

      <div className="relative mx-auto max-w-container px-6 lg:px-10">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">AI クリエイティブ ギャラリー</p>
            <h2 className="mt-4 text-[2rem] font-black leading-[1.2] tracking-tight sm:text-[2.75rem]">
              無数の<span className="underline-yellow">AI生成作品</span>から、
              <br className="hidden sm:block" />
              次の一本に出会う。
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-[1.85] text-ink-muted">
              AILIER に登録された AI クリエイターの作品から、ピックアップして並べました。
              気になるタイルをクリックして、クリエイターのページへ。
            </p>
          </div>
          <Link
            href="/portfolios"
            className="group inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-white px-5 py-2.5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-paper"
          >
            すべての作品を見る
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Scattered grid */}
        <div className="grid auto-rows-[120px] grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item, idx) => {
            const { transform, className } = getTileStyle(idx, item.aspectRatio);
            return (
              <Link
                key={item.key}
                href={`/creators/${item.creatorId}`}
                className={`group relative overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-pop transition-all duration-500 hover:-translate-y-2 hover:rotate-0 hover:shadow-[10px_10px_0_0_rgba(255,77,157,0.35)] ${className}`}
                style={{ transform }}
                aria-label={`${item.creatorName} の作品: ${item.alt}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-neon-midnight-deep/90 via-neon-midnight-deep/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="line-clamp-2 text-[11px] font-bold text-white">
                    {item.alt}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/70">
                    by {item.creatorName}
                  </p>
                </div>
                {/* Format badge */}
                <span
                  className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-black text-white ${
                    item.isImage
                      ? "bg-gradient-to-r from-neon-cyan to-neon-purple"
                      : "bg-neon-midnight-deep/80"
                  }`}
                >
                  {item.isImage ? "AI画像" : "AI動画"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
