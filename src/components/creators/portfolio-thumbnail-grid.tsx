"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { VideoPreviewCard } from "@/components/portfolio/video-preview-card";
import { isVerticalVideo } from "@/lib/video-utils";
import type { CreatorWithRelations } from "@/lib/supabase/queries";

type PortfolioEntry = {
  portfolio: CreatorWithRelations["portfolio_items"][0];
  creator: CreatorWithRelations;
};

type PlatformTab = "all" | "youtube" | "youtube_short" | "vimeo" | "tiktok" | "instagram";

const PLATFORM_TABS: { value: PlatformTab; label: string; icon: string }[] = [
  { value: "all", label: "すべて", icon: "" },
  { value: "youtube", label: "YouTube", icon: "▶" },
  { value: "youtube_short", label: "Shorts", icon: "📱" },
  { value: "vimeo", label: "Vimeo", icon: "🎬" },
  { value: "tiktok", label: "TikTok", icon: "♪" },
  { value: "instagram", label: "Instagram", icon: "📷" },
];

function matchPlatform(platform: string, url: string, tab: PlatformTab): boolean {
  if (tab === "all") return true;
  if (tab === "youtube") return platform === "youtube";
  if (tab === "youtube_short") return platform === "youtube_short" || url.includes("youtube.com/shorts/");
  if (tab === "vimeo") return platform === "vimeo";
  if (tab === "tiktok") return platform === "tiktok" || url.includes("tiktok.com");
  if (tab === "instagram") return platform === "instagram" || url.includes("instagram.com/reel");
  return false;
}

export function PortfolioThumbnailGrid({
  creators,
}: {
  creators: CreatorWithRelations[];
}) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformTab>>(new Set());

  const togglePlatform = (tab: PlatformTab) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (tab === "all") {
        return new Set(); // Clear all = show all
      }
      if (next.has(tab)) {
        next.delete(tab);
      } else {
        next.add(tab);
      }
      return next;
    });
  };

  const isAllSelected = selectedPlatforms.size === 0;

  const allPortfolios: PortfolioEntry[] = useMemo(
    () =>
      creators.flatMap((creator) =>
        creator.portfolio_items.map((portfolio) => ({ portfolio, creator }))
      ),
    [creators]
  );

  // Count per platform for badges
  const counts = useMemo(() => {
    const c: Record<PlatformTab, number> = { all: allPortfolios.length, youtube: 0, youtube_short: 0, vimeo: 0, tiktok: 0, instagram: 0 };
    for (const { portfolio } of allPortfolios) {
      for (const tab of PLATFORM_TABS) {
        if (tab.value !== "all" && matchPlatform(portfolio.video_platform, portfolio.video_url, tab.value)) {
          c[tab.value]++;
        }
      }
    }
    return c;
  }, [allPortfolios]);

  const filtered = useMemo(
    () =>
      isAllSelected
        ? allPortfolios
        : allPortfolios.filter(({ portfolio }) =>
            Array.from(selectedPlatforms).some((tab) =>
              matchPlatform(portfolio.video_platform, portfolio.video_url, tab)
            )
          ),
    [allPortfolios, selectedPlatforms, isAllSelected]
  );

  const horizontalItems = filtered.filter(
    ({ portfolio }) => !isVerticalVideo(portfolio.video_platform, portfolio.video_url)
  );
  const verticalItems = filtered.filter(({ portfolio }) =>
    isVerticalVideo(portfolio.video_platform, portfolio.video_url)
  );

  return (
    <div className="space-y-6">
      {/* Platform tabs (multiple selection) */}
      <div className="flex flex-wrap gap-2">
        {PLATFORM_TABS.map((tab) => {
          const count = counts[tab.value];
          if (tab.value !== "all" && count === 0) return null;
          const isActive = tab.value === "all" ? isAllSelected : selectedPlatforms.has(tab.value);
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => togglePlatform(tab.value)}
              className={`flex items-center gap-1.5 rounded-pill border px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-[#E0E0E0] bg-white text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
              }`}
            >
              {tab.icon && <span className="text-xs">{tab.icon}</span>}
              {tab.label}
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
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
          該当する動画がありません
        </div>
      )}

      {/* Horizontal videos */}
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
              {/* Platform badge */}
              <div className="pointer-events-none absolute left-2 bottom-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {portfolio.video_platform === "youtube" ? "YouTube" : portfolio.video_platform === "vimeo" ? "Vimeo" : portfolio.video_platform}
              </div>
              {creator.profiles.is_verified && (
                <div className="pointer-events-none absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Vertical videos */}
      {verticalItems.length > 0 && (
        <div>
          {horizontalItems.length > 0 && isAllSelected && (
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
                {/* Platform badge */}
                <div className="pointer-events-none absolute left-1.5 bottom-1.5 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {portfolio.video_platform === "youtube_short" ? "Short" : portfolio.video_platform === "tiktok" ? "TikTok" : portfolio.video_platform === "instagram" ? "Insta" : portfolio.video_platform}
                </div>
                {creator.profiles.is_verified && (
                  <div className="pointer-events-none absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500">
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
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
