"use client";

import { useState } from "react";
import { VideoPreviewCard } from "@/components/portfolio/video-preview-card";
import { FullscreenVideoModal } from "@/components/portfolio/fullscreen-video-modal";

/**
 * クリエイター詳細 の 右上「代表作」タイル。
 *
 * 従来: <Link href="#portfolio"> で ページ下部の 作品一覧に アンカースクロール。
 *   → 「モーダルで開いてほしい」というユーザー要望に反していた。
 *
 * 修正: クリックで FullscreenVideoModal を 開く 挙動に変更。
 *   併せて 通報ボタンも モーダル内に レンダーされる (Modal 側の workId 経路)。
 */
type Props = {
  workId: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  videoPlatform: string;
  title: string;
  likeCount: number;
  creatorId: string;
  creatorDisplayName: string;
  isAuthed: boolean;
};

export function FeaturedWorkTile({
  workId,
  videoUrl,
  thumbnailUrl,
  videoPlatform,
  title,
  likeCount,
  creatorId,
  creatorDisplayName,
  isAuthed,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`代表作「${title}」を全画面で再生`}
        className="group/main relative block aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md lg:w-[clamp(360px,38vw,460px)]"
      >
        <VideoPreviewCard
          thumbnailUrl={thumbnailUrl}
          videoUrl={videoUrl ?? ""}
          videoPlatform={videoPlatform}
          alt={title}
          sizes="(max-width: 1024px) 100vw, 480px"
          className="absolute inset-0 h-full w-full"
          autoPlay
          showPlayIcon={false}
        />
        <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-pill bg-gray-900/85 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-sm">
          ★ 代表作
        </span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-2 pt-8">
          <p className="line-clamp-1 text-xs font-bold text-white">{title}</p>
        </div>
      </button>

      {open && videoUrl && (
        <FullscreenVideoModal
          videoUrl={videoUrl}
          posterUrl={thumbnailUrl}
          title={title}
          creatorName={creatorDisplayName}
          creatorHref={`/creators/${creatorId}`}
          likeCount={likeCount}
          workId={workId}
          isAuthed={isAuthed}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
