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
import type { CreatorWithRelations } from "@/lib/supabase/queries";

type PortfolioEntry = {
  portfolio: CreatorWithRelations["portfolio_items"][0];
  creator: CreatorWithRelations;
};

export function PortfolioThumbnailGrid({
  creators,
  likedIds,
  isAuthed,
}: {
  creators: CreatorWithRelations[];
  likedIds?: Set<string>;
  isAuthed?: boolean;
}) {
  const [modalEntry, setModalEntry] = useState<PortfolioEntry | null>(null);

  const allPortfolios: PortfolioEntry[] = useMemo(
    () =>
      creators.flatMap((creator) =>
        creator.portfolio_items.map((portfolio) => ({ portfolio, creator }))
      ),
    [creators]
  );

  // カテゴリ分け (フォーマットタブ / 縦横区切り見出し) は撤去。
  // ユーザー判断: 顧客は作品単位で発見すれば十分。
  const filtered = allPortfolios;

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
      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-white/60">
          該当する作品がありません
        </div>
      )}

      {/* 全タイルを統一アスペクト (16:9) に揃え、視覚的バランスを確保。
          縦型/正方形のソースは object-cover で中央クロップして表示し、
          元のアスペクト比は小バッジで明示する。フル比率の閲覧はモーダルで。 */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((entry) => (
            <PortfolioCardTile
              key={entry.portfolio.id}
              entry={entry}
              aspectClass="aspect-video"
              imageSizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              likedIds={likedIds}
              isAuthed={isAuthed ?? false}
              onOpen={openModal}
            />
          ))}
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
  // 元アスペクト比 (タイルは横長に統一表示しているため、中身の比率をバッジで明示)
  const aspectLabel =
    portfolio.aspect_ratio === "vertical"
      ? "9:16"
      : portfolio.aspect_ratio === "square"
        ? "1:1"
        : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(entry);
        }
      }}
      aria-label={`${portfolio.title} を再生`}
      className={`group relative ${aspectClass} cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-ink/5 text-left shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:border-neon-pink/40 hover:shadow-[0_20px_50px_-15px_rgba(255,77,157,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon-pink`}
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
          <div className="flex h-full w-full items-center justify-center bg-paper text-xs text-white/60">
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

      {/* 元アスペクト比バッジ (左上) — 縦型/正方形のとき出す */}
      {aspectLabel && (
        <span className="pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-pill bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          {portfolio.aspect_ratio === "vertical" ? "縦型" : "正方形"}
          <span className="text-white/70">{aspectLabel}</span>
        </span>
      )}

      {/* Top-right: いいねボタン (常時表示 + count を併記)。
          縦横/カテゴリのラベル類は撤去済 (ユーザー判断: 各動画にラベル不要)。
          button 内に button をネストしないよう pointer-events を分離。 */}
      <div
        className="pointer-events-auto absolute right-2 top-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <LikeButton
          portfolioItemId={portfolio.id}
          initialLiked={liked}
          initialCount={portfolio.like_count}
          isAuthed={isAuthed}
          variant="overlay"
          showCount
        />
      </div>

      {/* Hover overlay: creator info のみ (LikeButton は外に出した) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-full bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-3 pt-10 transition-transform duration-300 group-hover:translate-y-0">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/20 bg-ink/5">
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
      </div>
    </div>
  );
}
