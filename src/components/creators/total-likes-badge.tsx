"use client";

import { useTotalLikeDelta } from "@/components/portfolio/like-delta-context";

/**
 * 詳細ページ Hero の「❤️ 総いいね N」表示。
 *
 * サーバから受け取った初期合計値に、LikeDeltaProvider 内の LikeButton が
 * 通知した delta を加算してリアルタイム表示する。
 */
export function TotalLikesBadge({ initialTotal }: { initialTotal: number }) {
  const delta = useTotalLikeDelta();
  const total = Math.max(0, initialTotal + delta);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-neon-pink">❤️</span>
      総いいね {total}
    </span>
  );
}
