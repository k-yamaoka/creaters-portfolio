"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { VideoPreviewCard } from "@/components/portfolio/video-preview-card";
import { formatPrice } from "@/lib/utils";
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
  const [selected, setSelected] = useState<PortfolioEntry | null>(null);

  // Flatten all portfolio items with creator reference
  const allPortfolios: PortfolioEntry[] = creators.flatMap((creator) =>
    creator.portfolio_items.map((portfolio) => ({ portfolio, creator }))
  );

  return (
    <>
      {/* Thumbnail grid - 3 columns, thumbnail only */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {allPortfolios.map(({ portfolio, creator }) => (
          <Link
            key={portfolio.id}
            href={`/creators/${creator.id}`}
            className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl shadow-card transition-all duration-300 hover:shadow-card-hover hover:ring-2 hover:ring-primary-500/40"
          >
            {/* Video preview on hover */}
            <VideoPreviewCard
              thumbnailUrl={portfolio.thumbnail_url}
              videoUrl={portfolio.video_url}
              videoPlatform={portfolio.video_platform}
              alt={portfolio.title}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-full w-full"
              showPlayIcon={false}
            />
            {/* Verified badge */}
            {creator.profiles.is_verified && (
              <div className="pointer-events-none absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                <svg
                  className="h-3 w-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
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
    </>
  );
}
