"use client";

import { useTotalLikeDelta } from "@/components/portfolio/like-delta-context";
import { Heart } from "lucide-react";

/**
 * 詳細ページ Hero の「総いいね N」表示。
 */
export function TotalLikesBadge({ initialTotal }: { initialTotal: number }) {
  const delta = useTotalLikeDelta();
  const total = Math.max(0, initialTotal + delta);
  return (
    <span className="inline-flex items-center gap-1.5">
      <Heart size={16} strokeWidth={1.8} fill="currentColor" className="text-neon-pink" aria-hidden />
      総いいね {total}
    </span>
  );
}
