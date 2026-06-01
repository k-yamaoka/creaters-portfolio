"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * ポートフォリオ作品のいいねボタン。
 * - サーバー初期値 (liked / count) を props で受け取り、楽観更新で即時反映
 * - 未ログインの場合は /login にリダイレクト
 */
export function LikeButton({
  portfolioItemId,
  initialLiked,
  initialCount,
  isAuthed,
  variant = "overlay",
}: {
  portfolioItemId: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthed: boolean;
  /** overlay = thumb 上の小さい表示 / inline = やや大きめ */
  variant?: "overlay" | "inline";
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthed) {
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    // 楽観更新
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(prevLiked ? Math.max(prevCount - 1, 0) : prevCount + 1);

    startTransition(async () => {
      try {
        const res = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ portfolio_item_id: portfolioItemId }),
        });
        if (!res.ok) throw new Error("toggle failed");
        const data = (await res.json()) as { liked: boolean; count: number };
        setLiked(data.liked);
        setCount(data.count);
      } catch {
        // 失敗時は元に戻す
        setLiked(prevLiked);
        setCount(prevCount);
      }
    });
  };

  const sizeClass =
    variant === "overlay"
      ? "px-2.5 py-1 text-xs gap-1"
      : "px-3 py-1.5 text-sm gap-1.5";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "いいねを取り消す" : "いいねする"}
      className={`relative z-20 inline-flex items-center rounded-pill border font-bold transition-all backdrop-blur-sm ${sizeClass} ${
        liked
          ? "border-neon-pink/60 bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-[0_0_14px_rgba(255,77,157,0.6)]"
          : "border-white/30 bg-black/40 text-white/90 hover:border-neon-pink/40 hover:bg-black/60"
      } ${pending ? "opacity-70" : ""}`}
    >
      <span
        className={`transition-transform ${liked ? "scale-110" : ""}`}
        aria-hidden
      >
        {liked ? "❤️" : "🤍"}
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
