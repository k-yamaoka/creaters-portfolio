"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { formatPrice } from "@/lib/utils";
import type { CreatorWithRelations } from "@/lib/supabase/queries";

const VideoPreviewCard = dynamic(
  () =>
    import("@/components/portfolio/video-preview-card").then(
      (m) => m.VideoPreviewCard
    ),
  { ssr: false }
);

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
      {/* Thumbnail grid - compact, many items */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {allPortfolios.map(({ portfolio, creator }) => (
          <button
            key={portfolio.id}
            type="button"
            onClick={() => setSelected({ portfolio, creator })}
            className="group relative aspect-video overflow-hidden rounded-xl bg-[#F2F2F2] text-left shadow-card transition-all duration-300 hover:shadow-card-hover hover:ring-2 hover:ring-primary-500/40"
          >
            {portfolio.thumbnail_url ? (
              <Image
                src={portfolio.thumbnail_url}
                alt={portfolio.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#BDBDBD]">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
              <div className="scale-0 rounded-full bg-white/90 p-2.5 shadow-lg transition-transform duration-300 group-hover:scale-100">
                <svg
                  className="h-5 w-5 text-primary-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Bottom gradient with title */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
              <p className="truncate text-xs font-bold text-white">
                {portfolio.title}
              </p>
              <p className="truncate text-[10px] text-white/70">
                {creator.profiles.display_name}
              </p>
            </div>
            {/* Verified badge */}
            {creator.profiles.is_verified && (
              <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
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
          </button>
        ))}
      </div>

      {/* Modal: Creator detail on thumbnail click */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelected(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/40"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Video preview */}
            <div className="relative aspect-video">
              <VideoPreviewCard
                thumbnailUrl={selected.portfolio.thumbnail_url}
                videoUrl={selected.portfolio.video_url}
                videoPlatform={selected.portfolio.video_platform}
                alt={selected.portfolio.title}
                sizes="(max-width: 768px) 100vw, 768px"
                className="h-full w-full"
              />
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Portfolio info */}
              <h3 className="text-lg font-bold text-[#222]">
                {selected.portfolio.title}
              </h3>
              {selected.portfolio.description && (
                <p className="mt-1 text-sm text-[#828282]">
                  {selected.portfolio.description}
                </p>
              )}
              {selected.portfolio.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selected.portfolio.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#828282]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className="my-5 h-px bg-[#F2F2F2]" />

              {/* Creator info */}
              <div className="flex items-start gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#F2F2F2]">
                  {selected.creator.profiles.avatar_url ? (
                    <Image
                      src={selected.creator.profiles.avatar_url}
                      alt={selected.creator.profiles.display_name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#828282]">
                      {selected.creator.profiles.display_name[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#222]">
                      {selected.creator.profiles.display_name}
                    </h4>
                    {selected.creator.profiles.is_verified && (
                      <span className="rounded-pill bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        認証済み
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#828282]">
                    {selected.creator.location && (
                      <span>{selected.creator.location}</span>
                    )}
                    <span>
                      経験{selected.creator.years_of_experience}年
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5 text-[#FFB74D]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {selected.creator.rating} ({selected.creator.review_count})
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[#4F4F4F]">
                    {selected.creator.bio}
                  </p>
                  {/* Genres */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selected.creator.genres.slice(0, 4).map((g) => (
                      <span
                        key={g}
                        className="rounded-pill bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-500"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                  {/* Lowest price */}
                  {selected.creator.service_packages.length > 0 && (
                    <p className="mt-2 text-sm">
                      <span className="text-[#828282]">料金: </span>
                      <span className="font-bold text-primary-500">
                        {formatPrice(
                          Math.min(
                            ...selected.creator.service_packages
                              .filter((p) => p.is_active)
                              .map((p) => p.price)
                          )
                        )}
                        〜
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-3">
                <Link
                  href={`/creators/${selected.creator.id}`}
                  className="btn-primary flex-1 text-center text-sm"
                  onClick={() => setSelected(null)}
                >
                  プロフィールを見る
                </Link>
                <Link
                  href={`/dashboard/messages/${selected.creator.user_id}`}
                  className="btn-secondary flex-1 text-center text-sm"
                  onClick={() => setSelected(null)}
                >
                  メッセージを送る
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
