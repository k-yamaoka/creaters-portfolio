"use client";

import Link from "next/link";
import { VideoPreviewCard } from "@/components/portfolio/video-preview-card";
import { isVerticalVideo } from "@/lib/video-utils";
import type { CreatorWithRelations } from "@/lib/supabase/queries";

type PortfolioEntry = {
  portfolio: CreatorWithRelations["portfolio_items"][0];
  creator: CreatorWithRelations;
};

export function PortfolioThumbnailGrid({
  creators,
}: {
  creators: CreatorWithRelations[];
}) {
  // Flatten all portfolio items with creator reference
  const allPortfolios: PortfolioEntry[] = creators.flatMap((creator) =>
    creator.portfolio_items.map((portfolio) => ({ portfolio, creator }))
  );

  const horizontalItems = allPortfolios.filter(
    ({ portfolio }) =>
      !isVerticalVideo(portfolio.video_platform, portfolio.video_url)
  );
  const verticalItems = allPortfolios.filter(({ portfolio }) =>
    isVerticalVideo(portfolio.video_platform, portfolio.video_url)
  );

  return (
    <div className="space-y-8">
      {/* Horizontal videos: 3-column */}
      {horizontalItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {horizontalItems.map(({ portfolio, creator }) => (
            <Link
              key={portfolio.id}
              href={`/creators/${creator.id}`}
              className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl shadow-card transition-all duration-300 hover:shadow-card-hover hover:ring-2 hover:ring-primary-500/40"
            >
              <VideoPreviewCard
                thumbnailUrl={portfolio.thumbnail_url}
                videoUrl={portfolio.video_url}
                videoPlatform={portfolio.video_platform}
                alt={portfolio.title}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="h-full w-full"
                showPlayIcon={false}
              />
              {creator.profiles.is_verified && (
                <div className="pointer-events-none absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Vertical videos: 4-column with 9:16 ratio */}
      {verticalItems.length > 0 && (
        <div>
          {horizontalItems.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-[#E0E0E0]" />
              <span className="text-xs font-bold text-[#828282]">ショート動画</span>
              <div className="h-px flex-1 bg-[#E0E0E0]" />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {verticalItems.map(({ portfolio, creator }) => (
              <Link
                key={portfolio.id}
                href={`/creators/${creator.id}`}
                className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-xl shadow-card transition-all duration-300 hover:shadow-card-hover hover:ring-2 hover:ring-primary-500/40"
              >
                <VideoPreviewCard
                  thumbnailUrl={portfolio.thumbnail_url}
                  videoUrl={portfolio.video_url}
                  videoPlatform={portfolio.video_platform}
                  alt={portfolio.title}
                  sizes="(max-width: 640px) 33vw, 20vw"
                  className="h-full w-full"
                  showPlayIcon={false}
                />
                {creator.profiles.is_verified && (
                  <div className="pointer-events-none absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500">
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
