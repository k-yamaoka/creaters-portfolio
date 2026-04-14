"use client";

import dynamic from "next/dynamic";
import { isVerticalVideo } from "@/lib/video-utils";

const VideoPreviewCard = dynamic(
  () => import("./video-preview-card").then((m) => m.VideoPreviewCard),
  { ssr: false }
);

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  video_platform: string;
  thumbnail_url: string | null;
  genre: string | null;
  tags: string[];
};

export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
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
    return <PortfolioItemGrid items={items} />;
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
          <PortfolioItemGrid items={grouped[genre]} />
        </div>
      ))}
    </div>
  );
}

function PortfolioItemGrid({ items }: { items: PortfolioItem[] }) {
  const verticalItems = items.filter((item) =>
    isVerticalVideo(item.video_platform, item.video_url)
  );
  const horizontalItems = items.filter(
    (item) => !isVerticalVideo(item.video_platform, item.video_url)
  );

  return (
    <div className="space-y-6">
      {/* Horizontal videos: 2-column grid */}
      {horizontalItems.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {horizontalItems.map((item) => (
            <div key={item.id} className="group overflow-hidden rounded-xl">
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <VideoPreviewCard
                  thumbnailUrl={item.thumbnail_url}
                  videoUrl={item.video_url}
                  videoPlatform={item.video_platform}
                  alt={item.title}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="h-full w-full"
                />
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-bold text-[#222]">{item.title}</h3>
                <p className="mt-1 text-xs text-[#828282]">
                  {item.description}
                </p>
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
              <div key={item.id} className="group overflow-hidden rounded-xl">
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl">
                  <VideoPreviewCard
                    thumbnailUrl={item.thumbnail_url}
                    videoUrl={item.video_url}
                    videoPlatform={item.video_platform}
                    alt={item.title}
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="h-full w-full"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="truncate text-xs font-bold text-[#222]">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
