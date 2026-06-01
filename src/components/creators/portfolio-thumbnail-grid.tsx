"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { VideoPreviewCard } from "@/components/portfolio/video-preview-card";
import { LikeButton } from "@/components/portfolio/like-button";
import {
  VideoModal,
  type VideoModalItem,
  type VideoModalCreator,
} from "@/components/portfolio/video-modal";
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
  likedIds,
  isAuthed,
}: {
  creators: CreatorWithRelations[];
  likedIds?: Set<string>;
  isAuthed?: boolean;
}) {
  const [selectedFormat, setSelectedFormat] = useState<PortfolioFormat>("all");
  const [modalEntry, setModalEntry] = useState<PortfolioEntry | null>(null);

  const allPortfolios: PortfolioEntry[] = useMemo(
    () =>
      creators.flatMap((creator) =>
        creator.portfolio_items.map((portfolio) => ({ portfolio, creator }))
      ),
    [creators]
  );

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

  const horizontalItems = filtered.filter(
    ({ portfolio }) => portfolio.aspect_ratio === "horizontal"
  );
  const verticalItems = filtered.filter(
    ({ portfolio }) => portfolio.aspect_ratio === "vertical"
  );
  const squareItems = filtered.filter(
    ({ portfolio }) => portfolio.aspect_ratio === "square"
  );

  const openModal = (entry: PortfolioEntry) => setModalEntry(entry);
  const closeModal = () => setModalEntry(null);

  const modalItem: VideoModalItem | null = useMemo(() => {
    if (!modalEntry) return null;
    const p = modalEntry.portfolio;
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      media_type: p.media_type,
      video_url: p.video_url,
      video_platform: p.video_platform,
      image_url: p.image_url,
      thumbnail_url: p.thumbnail_url,
      aspect_ratio: p.aspect_ratio,
      like_count: p.like_count,
      liked: likedIds?.has(p.id) ?? false,
    };
  }, [modalEntry, likedIds]);

  const modalCreator: VideoModalCreator | null = modalEntry
    ? {
        id: modalEntry.creator.id,
        display_name: modalEntry.creator.profiles.display_name,
        avatar_url: modalEntry.creator.profiles.avatar_url,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Format tabs */}
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
                  : "border-white/15 bg-white/5 text-white/80 backdrop-blur-sm hover:border-neon-pink/40 hover:bg-white/10"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/70"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-white/60">
          該当する作品がありません
        </div>
      )}

      {horizontalItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {horizontalItems.map((entry) => (
            <PortfolioCardTile
              key={entry.portfolio.id}
              entry={entry}
              aspectClass="aspect-video"
              imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              likedIds={likedIds}
              isAuthed={isAuthed ?? false}
              onOpen={openModal}
            />
          ))}
        </div>
      )}

      {squareItems.length > 0 && (
        <div>
          {(horizontalItems.length > 0 || verticalItems.length > 0) &&
            selectedFormat === "all" && <SectionDivider label="正方形" />}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {squareItems.map((entry) => (
              <PortfolioCardTile
                key={entry.portfolio.id}
                entry={entry}
                aspectClass="aspect-square"
                imageSizes="(max-width: 640px) 50vw, 25vw"
                likedIds={likedIds}
                isAuthed={isAuthed ?? false}
                onOpen={openModal}
              />
            ))}
          </div>
        </div>
      )}

      {verticalItems.length > 0 && (
        <div>
          {(horizontalItems.length > 0 || squareItems.length > 0) &&
            selectedFormat === "all" && <SectionDivider label="縦型 (9:16)" />}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {verticalItems.map((entry) => (
              <PortfolioCardTile
                key={entry.portfolio.id}
                entry={entry}
                aspectClass="aspect-[9/16]"
                imageSizes="(max-width: 640px) 33vw, 20vw"
                likedIds={likedIds}
                isAuthed={isAuthed ?? false}
                onOpen={openModal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalEntry && modalItem && modalCreator && (
        <VideoModal
          item={modalItem}
          creator={modalCreator}
          isAuthed={isAuthed ?? false}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="h-px flex-1 bg-white/15" />
      <span className="text-xs font-bold text-white/70">{label}</span>
      <div className="h-px flex-1 bg-white/15" />
    </div>
  );
}

function PortfolioCardTile({
  entry,
  aspectClass,
  imageSizes,
  likedIds,
  isAuthed,
  onOpen,
}: {
  entry: PortfolioEntry;
  aspectClass: string;
  imageSizes: string;
  likedIds?: Set<string>;
  isAuthed: boolean;
  onOpen: (entry: PortfolioEntry) => void;
}) {
  const { portfolio, creator } = entry;
  const isImage = portfolio.media_type === "image";
  const imageSrc = portfolio.image_url || portfolio.thumbnail_url;
  const liked = likedIds?.has(portfolio.id) ?? false;

  // 左上に表示する小バッジ (AIツール優先、なければジャンル)
  const topBadge =
    creator.ai_tools[0] ??
    portfolio.genre ??
    creator.genres[0] ??
    null;

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      aria-label={`${portfolio.title} を再生`}
      className={`group relative ${aspectClass} cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-neon-midnight text-left shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:border-neon-pink/40 hover:shadow-[0_20px_50px_-15px_rgba(255,77,157,0.4)]`}
    >
      {/* Media */}
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
          <div className="flex h-full w-full items-center justify-center bg-neon-midnight-deep text-xs text-white/60">
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

      {/* Top-left tag badge (AI tool / genre) */}
      {topBadge && (
        <span className="pointer-events-none absolute left-2 top-2 z-10 inline-flex max-w-[60%] items-center gap-1 rounded-pill border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <span className="inline-block h-1 w-1 rounded-full bg-neon-cyan" />
          <span className="truncate">{topBadge}</span>
        </span>
      )}

      {/* Top-right format badge */}
      <span
        className={`pointer-events-none absolute right-2 top-2 z-10 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white shadow-[0_0_8px_rgba(0,0,0,0.4)] ${
          isImage
            ? "bg-gradient-to-r from-neon-cyan to-neon-purple"
            : "bg-black/60"
        }`}
      >
        {isImage
          ? "AI画像"
          : portfolio.aspect_ratio === "vertical"
            ? "縦型"
            : portfolio.aspect_ratio === "square"
              ? "正方形"
              : "横型"}
      </span>

      {/* Hover overlay: creator info + like button */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-full bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-3 pt-10 transition-transform duration-300 group-hover:translate-y-0">
        <div className="flex items-end justify-between gap-2">
          <div className="pointer-events-auto flex min-w-0 items-center gap-2">
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/20 bg-neon-midnight">
              {creator.profiles.avatar_url ? (
                <Image
                  src={creator.profiles.avatar_url}
                  alt={creator.profiles.display_name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-pink to-neon-purple text-[10px] font-black text-white">
                  {creator.profiles.display_name[0]}
                </div>
              )}
            </div>
            <span className="truncate text-[11px] font-bold text-white">
              {creator.profiles.display_name}
            </span>
          </div>
          <div className="pointer-events-auto shrink-0">
            <LikeButton
              portfolioItemId={portfolio.id}
              initialLiked={liked}
              initialCount={portfolio.like_count}
              isAuthed={isAuthed}
              variant="overlay"
            />
          </div>
        </div>
      </div>
    </button>
  );
}
