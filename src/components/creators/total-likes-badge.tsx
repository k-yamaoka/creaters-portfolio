"use client";

import { useTotalLikeDelta } from "@/components/portfolio/like-delta-context";
import { MIcon } from "@/components/ui/m-icon";

/**
 * 詳細ページ Hero の「総いいね N」表示。
 */
export function TotalLikesBadge({ initialTotal }: { initialTotal: number }) {
  const delta = useTotalLikeDelta();
  const total = Math.max(0, initialTotal + delta);
  return (
    <span className="inline-flex items-center gap-1.5">
      <MIcon name="favorite" fill className="text-neon-pink" size={16} />
      総いいね {total}
    </span>
  );
}
