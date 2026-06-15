"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLikeDeltaApply } from "@/components/portfolio/like-delta-context";
import { MIcon } from "@/components/ui/m-icon";

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
  showCount = false,
  onLikeChange,
}: {
  portfolioItemId: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthed: boolean;
  /** overlay = thumb 上の小さい表示 / inline = やや大きめ */
  variant?: "overlay" | "inline";
  /** true: ♥ の横に数字を表示 (ポートフォリオ一覧で使用) */
  showCount?: boolean;
  /**
   * いいねが追加(+1)/取り消し(-1)されたタイミングで親に delta を通知。
   * 親側 (例: クリエイター行) は集計値 (総いいね数) をこの delta で再計算する。
   */
  onLikeChange?: (delta: number) => void;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  // Context が無い文脈 (一覧など) でも安全 (undefined になるだけ)。
  // 詳細ページのように LikeDeltaProvider で囲まれていれば、Hero の総いいねへ delta が伝搬する。
  const ctxApply = useLikeDeltaApply();

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
    const delta = prevLiked ? -1 : 1;
    setLiked(!prevLiked);
    setCount(prevLiked ? Math.max(prevCount - 1, 0) : prevCount + 1);
    onLikeChange?.(delta);
    ctxApply?.(portfolioItemId, delta);

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
        // サーバ側 count が楽観更新と一致しないケース (他者が同時に押した等)
        // を吸収するため、サーバ確定値との差分を追加で親に伝える。
        const serverDelta = data.count - (prevCount + delta);
        if (serverDelta !== 0) {
          onLikeChange?.(serverDelta);
          ctxApply?.(portfolioItemId, serverDelta);
        }
      } catch {
        // 失敗時は元に戻す
        setLiked(prevLiked);
        setCount(prevCount);
        onLikeChange?.(-delta);
        ctxApply?.(portfolioItemId, -delta);
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
      <MIcon
        name="favorite"
        fill={liked}
        size={16}
        className={`transition-transform ${liked ? "scale-110 text-white" : "text-white/90"}`}
      />
      {/* showCount=true のときだけ数字を出す。それ以外は sr-only で a11y のみ。 */}
      {showCount ? <span>{count}</span> : <span className="sr-only">{count}</span>}
    </button>
  );
}
