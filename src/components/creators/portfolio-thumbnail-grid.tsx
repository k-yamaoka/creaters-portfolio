"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { VideoPreviewCard } from "@/components/portfolio/video-preview-card";
import { PORTFOLIO_FORMATS, type PortfolioFormat } from "@/lib/constants";
import type { CreatorWithRelations } from "@/lib/supabase/queries";

type PortfolioEntry = {
  portfolio: CreatorWithRelations["portfolio_items"][0];
  creator: CreatorWithRelations;
};

function matchFormat(
  aspect: PortfolioEntry["portfolio"]["aspect_ratio"],
  tab: PortfolioFormat
): boolean {
  if (tab === "all") return true;
  return aspect === tab;
}

export function PortfolioThumbnailGrid({
  creators,
}: {
  creators: CreatorWithRelations[];
}) {
  const [selectedFormat, setSelectedFormat] = useState<PortfolioFormat>("all");

  const allPortfolios: PortfolioEntry[] = useMemo(
    () =>
      creators.flatMap((creator) =>
        creator.portfolio_items.map((portfolio) => ({ portfolio, creator }))
      ),
    [creators]
  );

  // Count per aspect ratio for badges
  const counts = useMemo(() => {
    const c: Record<PortfolioFormat, number> = {
      all: allPortfolios.length,
      vertical: 0,
      horizontal: 0,
      square: 0,
    };
    for (const { portfolio } of allPortfolios) {
      const a = portfolio.aspect_ratio;
      if (a === "vertical") c.vertical++;
      else if (a === "horizontal") c.horizontal++;
      else if (a === "square") c.square++;
    }
    return c;
  }, [allPortfolios]);

  const filtered = useMemo(
    () =>
      allPortfolios.filter(({ portfolio }) =>
        matchFormat(portfolio.aspect_ratio, selectedFormat)
      ),
    [allPortfolios, selectedFormat]
  );

  // Group by aspect for display
  const horizontalItems = filtered.filter(
    ({ portfolio }) => portfolio.aspect_ratio === "horizontal"
  );
  const verticalItems = filtered.filter(
    ({ portfolio }) => portfolio.aspect_ratio === "vertical"
  );
  const squareItems = filtered.filter(
    ({ portfolio }) => portfolio.aspect_ratio === "square"
  );

  return (
    <div className="space-y-6">
      {/* Format tabs (single selection) */}
      <div className="flex flex-wrap gap-2">
        {PORTFOLIO_FORMATS.map((tab) => {
          const count = counts[tab.value];
          if (tab.value !== "all" && count === 0) return null;
          const isActive = selectedFormat === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedFormat(tab.value)}
              className={`inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-bold transition-all ${
                isActive
                  ? "border-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-[0_0_14px_rgba(255,77,157,0.35)]"
                  : "border-[#E0E0E0] bg-white text-[#4F4F4F] hover:border-neon-pink hover:text-neon-pink"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-[#F2F2F2] text-[#828282]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-[#828282]">
          該当する作品がありません
        </div>
      )}

      {/* Horizontal */}
      {horizontalItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {horizontalItems.map(({ portfolio, creator }) => (
            <PortfolioCardTile
              key={portfolio.id}
              portfolio={portfolio}
              creator={creator}
              aspectClass="aspect-video"
              imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ))}
        </div>
      )}

      {/* Square */}
      {squareItems.length > 0 && (
        <div>
          {(horizontalItems.length > 0 || verticalItems.length > 0) &&
            selectedFormat === "all" && (
              <SectionDivider label="正方形" />
            )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {squareItems.map(({ portfolio, creator }) => (
              <PortfolioCardTile
                key={portfolio.id}
                portfolio={portfolio}
                creator={creator}
                aspectClass="aspect-square"
                imageSizes="(max-width: 640px) 50vw, 25vw"
              />
            ))}
          </div>
        </div>
      )}

      {/* Vertical */}
      {verticalItems.length > 0 && (
        <div>
          {(horizontalItems.length > 0 || squareItems.length > 0) &&
            selectedFormat === "all" && (
              <SectionDivider label="縦型 (9:16)" />
            )}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {verticalItems.map(({ portfolio, creator }) => (
              <PortfolioCardTile
                key={portfolio.id}
                portfolio={portfolio}
                creator={creator}
                aspectClass="aspect-[9/16]"
                imageSizes="(max-width: 640px) 33vw, 20vw"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="h-px flex-1 bg-[#E0E0E0]" />
      <span className="text-xs font-bold text-[#828282]">{label}</span>
      <div className="h-px flex-1 bg-[#E0E0E0]" />
    </div>
  );
}

function PortfolioCardTile({
  portfolio,
  creator,
  aspectClass,
  imageSizes,
}: {
  portfolio: PortfolioEntry["portfolio"];
  creator: PortfolioEntry["creator"];
  aspectClass: string;
  imageSizes: string;
}) {
  const isImage = portfolio.media_type === "image";
  const imageSrc = portfolio.image_url || portfolio.thumbnail_url;

  return (
    <Link
      href={`/creators/${creator.id}`}
      className={`group relative ${aspectClass} cursor-pointer overflow-hidden rounded-xl shadow-card transition-all duration-300 hover:shadow-card-hover hover:ring-2 hover:ring-neon-pink/40`}
    >
      {isImage ? (
        imageSrc ? (
          <Image
            src={imageSrc}
            alt={portfolio.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={imageSizes}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#F2F2F2] text-xs text-[#828282]">
            画像なし
          </div>
        )
      ) : (
        <VideoPreviewCard
          thumbnailUrl={portfolio.thumbnail_url}
          videoUrl={portfolio.video_url ?? ""}
          videoPlatform={portfolio.video_platform}
          alt={portfolio.title}
          sizes={imageSizes}
          className="h-full w-full"
          showPlayIcon={false}
        />
      )}
      {/* Format badge */}
      <div
        className={`pointer-events-none absolute left-2 bottom-2 z-10 rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
          isImage
            ? "bg-gradient-to-r from-neon-cyan to-neon-purple"
            : "bg-black/60"
        }`}
      >
        {isImage ? "AI画像" : portfolio.aspect_ratio === "vertical" ? "縦型" : "横型"}
      </div>
      {creator.profiles.is_verified && (
        <div className="pointer-events-none absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-neon-pink">
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
  );
}
