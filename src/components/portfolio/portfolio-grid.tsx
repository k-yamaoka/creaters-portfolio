"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { isVerticalVideo } from "@/lib/video-utils";
import { ReportButton } from "@/components/reports/report-button";
import { LikeButton } from "@/components/portfolio/like-button";

const VideoPreviewCard = dynamic(
  () => import("./video-preview-card").then((m) => m.VideoPreviewCard),
  { ssr: false }
);

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  media_type?: "video" | "image";
  video_url: string | null;
  video_platform: string;
  image_url?: string | null;
  thumbnail_url: string | null;
  aspect_ratio?: "vertical" | "horizontal" | "square";
  like_count?: number;
  genre: string | null;
  tags: string[];
};

export function PortfolioGrid({
  items,
  isAuthed = false,
  likedIds,
}: {
  items: PortfolioItem[];
  isAuthed?: boolean;
  /** CLIST-014: viewer が既に いいね済みの portfolio_item_id 集合 */
  likedIds?: Set<string>;
}) {
  // Group items by genre
  const grouped = items.reduce<Record<string, PortfolioItem[]>>((acc, item) => {
    const key = item.genre || "その他";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const genreKeys = Object.keys(grouped);

  // If only one genre or no genres, show flat grid
  if (genreKeys.length <= 1) {
    return <PortfolioItemGrid items={items} isAuthed={isAuthed} likedIds={likedIds} />;
  }

  // Show grouped by genre
  return (
    <div className="space-y-8">
      {genreKeys.map((genre) => (
        <div key={genre}>
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#222]">{genre}</h3>
            <span className="text-xs text-[#BDBDBD]">
              {grouped[genre].length}件
            </span>
          </div>
          <PortfolioItemGrid items={grouped[genre]} isAuthed={isAuthed} likedIds={likedIds} />
        </div>
      ))}
    </div>
  );
}

function PortfolioItemGrid({
  items,
  isAuthed = false,
  likedIds,
}: {
  items: PortfolioItem[];
  isAuthed?: boolean;
  likedIds?: Set<string>;
}) {
  const imageItems = items.filter((item) => item.media_type === "image");
  const videoItems = items.filter((item) => item.media_type !== "image");

  // CDET-003 修正: item.aspect_ratio (DB stored value) を第一 signal に。
  //   未設定のときだけ isVerticalVideo(URL 判定) にフォールバック。旧実装は
  //   URL 判定オンリーで、DB 上 aspect_ratio="vertical" でも Cloudinary 直
  //   などで vertical 判定できない作品が横型枠に入って歪んでいた。
  const isItemVertical = (item: PortfolioItem) =>
    item.aspect_ratio
      ? item.aspect_ratio === "vertical"
      : isVerticalVideo(item.video_platform, item.video_url ?? "");
  const verticalItems = videoItems.filter(isItemVertical);
  const horizontalItems = videoItems.filter((item) => !isItemVertical(item));

  return (
    <div className="space-y-6">
      {/* Horizontal videos: 2-column grid */}
      {horizontalItems.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {horizontalItems.map((item) => (
            <div key={item.id} className="group">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                {/* inner wrapper: hover で内側だけ拡大、border は固定 */}
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                  <VideoPreviewCard
                    thumbnailUrl={item.thumbnail_url}
                    videoUrl={item.video_url ?? ""}
                    videoPlatform={item.video_platform}
                    alt={item.title}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="h-full w-full"
                  />
                </div>
                {/* CLIST-014: いいね ♥ (常時表示、認証時は count 更新) +
                    00072: 通報アイコン (hover でうっすら表示) を横並び */}
                <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
                  <LikeButton
                    portfolioItemId={item.id}
                    initialLiked={likedIds?.has(item.id) ?? false}
                    initialCount={item.like_count ?? 0}
                    isAuthed={isAuthed}
                    variant="overlay"
                    showCount
                  />
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">
                    <ReportButton
                      targetType="portfolio_item"
                      targetId={item.id}
                      targetTitle={item.title}
                      isAuthed={isAuthed}
                      variant="icon"
                    />
                  </span>
                </div>
              </div>
              <div className="mt-3 min-w-0">
                <h3 className="break-words text-sm font-bold text-[#222]">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-1 break-words text-xs text-[#828282]">
                    {item.description}
                  </p>
                )}
                {item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#828282]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vertical videos: 3-column grid with 9:16 aspect ratio */}
      {verticalItems.length > 0 && (
        <div>
          {horizontalItems.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-[#F2F2F2]" />
              <span className="text-xs text-[#BDBDBD]">縦型動画</span>
              <div className="h-px flex-1 bg-[#F2F2F2]" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {verticalItems.map((item) => (
              <div key={item.id} className="group">
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                    <VideoPreviewCard
                      thumbnailUrl={item.thumbnail_url}
                      videoUrl={item.video_url ?? ""}
                      videoPlatform={item.video_platform}
                      alt={item.title}
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="h-full w-full"
                    />
                  </div>
                  {/* CLIST-014: 縦型 タイルにも いいね + 通報 */}
                  <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1.5">
                    <LikeButton
                      portfolioItemId={item.id}
                      initialLiked={likedIds?.has(item.id) ?? false}
                      initialCount={item.like_count ?? 0}
                      isAuthed={isAuthed}
                      variant="overlay"
                      showCount
                    />
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      <ReportButton
                        targetType="portfolio_item"
                        targetId={item.id}
                        targetTitle={item.title}
                        isAuthed={isAuthed}
                        variant="icon"
                      />
                    </span>
                  </div>
                </div>
                <div className="mt-2 min-w-0">
                  <h3 className="line-clamp-2 break-words text-xs font-bold text-[#222]">
                    {item.title}
                  </h3>
                  {item.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-[#F2F2F2] px-1.5 py-0.5 text-[10px] text-[#828282]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Static images: masonry-style grid */}
      {imageItems.length > 0 && (
        <div>
          {(horizontalItems.length > 0 || verticalItems.length > 0) && (
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-[#F2F2F2]" />
              <span className="inline-flex items-center gap-1 text-xs font-bold text-aimovie-navy-900">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-aimovie-navy-500 to-aimovie-navy-700" />
                静止画クリエイティブ
              </span>
              <div className="h-px flex-1 bg-[#F2F2F2]" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {imageItems.map((item) => {
              const src = item.image_url || item.thumbnail_url;
              return (
                <a
                  key={item.id}
                  href={src ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F2F2F2]">
                    {src ? (
                      <Image
                        src={src}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#828282]">
                        画像なし
                      </div>
                    )}
                    {/* CLIST-014: 静止画にも いいね + 通報 (通報のみ hover) */}
                    <div
                      className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LikeButton
                        portfolioItemId={item.id}
                        initialLiked={likedIds?.has(item.id) ?? false}
                        initialCount={item.like_count ?? 0}
                        isAuthed={isAuthed}
                        variant="overlay"
                        showCount
                      />
                      <span className="opacity-0 transition-opacity group-hover:opacity-100">
                        <ReportButton
                          targetType="portfolio_item"
                          targetId={item.id}
                          targetTitle={item.title}
                          isAuthed={isAuthed}
                          variant="icon"
                        />
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 min-w-0">
                    <h3 className="line-clamp-2 break-words text-xs font-bold text-[#222]">
                      {item.title}
                    </h3>
                    {item.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-[#F2F2F2] px-1.5 py-0.5 text-[10px] text-[#828282]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
