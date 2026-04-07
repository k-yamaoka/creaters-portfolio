"use client";

import { VideoPreviewCard } from "./video-preview-card";

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
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {items.map((item) => (
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
            <p className="mt-1 text-xs text-[#828282]">{item.description}</p>
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
  );
}
