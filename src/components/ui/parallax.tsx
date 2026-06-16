"use client";

import { useEffect, useRef } from "react";

/**
 * 控えめなスクロール連動パララックス。
 *
 * NN/g 準拠で「動きは静か」を徹底:
 * - intensity は 0〜0.25 推奨 (それ以上は酔いやすい)
 * - requestAnimationFrame で 1 frame に 1 度しか transform を更新しない
 * - IntersectionObserver で画面外のとき計算を停止
 * - prefers-reduced-motion 時は完全無効 (translateY 0 固定)
 * - transform のみ書き換え、レイアウトを誘発しない (compositor 任せ)
 *
 * 用途: Hero グリッド全体、Co-creation の右下静止画など、テキストブロックと
 * 異なる速度で漂わせると上質。
 */
export function ParallaxImage({
  children,
  intensity = 0.08,
  className = "",
}: {
  children: React.ReactNode;
  /** 0 (動かない) 〜 0.25 (Axis レベルの控えめ動き) */
  intensity?: number;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    // prefers-reduced-motion で完全無効化
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let inView = false;
    let rafId: number | null = null;
    let pendingY: number | null = null;

    const apply = () => {
      rafId = null;
      if (pendingY != null) {
        node.style.transform = `translate3d(0, ${pendingY.toFixed(2)}px, 0)`;
        pendingY = null;
      }
    };

    const onScroll = () => {
      if (!inView) return;
      const rect = node.getBoundingClientRect();
      // 要素中心と viewport 中心の差分を base に
      const viewportH = window.innerHeight || 1;
      const center = rect.top + rect.height / 2;
      const delta = center - viewportH / 2;
      // -intensity * delta → 上向きへの逆方向 drift
      pendingY = -delta * intensity;
      if (rafId == null) rafId = requestAnimationFrame(apply);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) inView = e.isIntersecting;
        if (inView) onScroll();
      },
      { threshold: 0 }
    );
    io.observe(node);

    window.addEventListener("scroll", onScroll, { passive: true });
    // 初期位置も適用
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
      node.style.transform = "";
    };
  }, [intensity]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ willChange: "transform" }}
    >
      {children}
    </div>
  );
}
