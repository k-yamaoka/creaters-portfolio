"use client";

import { useState } from "react";

/**
 * 記事サムネイル 表示コンポーネント。
 *
 * 挙動:
 *  1) 最初は og:image URL を直参照で表示
 *  2) 403 / net::ERR_FAILED などで onError が発火した時のみ、
 *     /api/image-proxy?url=... 経由に切替 (フォールバック)
 *  3) それでも失敗したら不透明なプレースホルダーに切替
 *
 * 制約遵守:
 *  - このコンポーネントは URL のみ扱う。画像バイナリを state / DB に持たない
 *  - <img> タグでオリジンから直接読み込み (Next/Image は remotePatterns 制約で不可)
 */
export function AiNewsThumb({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [phase, setPhase] = useState<"direct" | "proxy" | "fail">("direct");

  if (phase === "fail") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ink/5 text-ink/30">
        <span className="font-mono text-[10px] uppercase tracking-widest">
          No Image
        </span>
      </div>
    );
  }

  const effectiveSrc =
    phase === "direct"
      ? src
      : `/api/image-proxy?url=${encodeURIComponent(src)}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={effectiveSrc}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => {
        setPhase((prev) => (prev === "direct" ? "proxy" : "fail"));
      }}
    />
  );
}
