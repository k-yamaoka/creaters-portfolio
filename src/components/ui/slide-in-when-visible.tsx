"use client";

import { useEffect, useRef } from "react";

/**
 * Intersection Observer による「初回 1 回だけ」横フェードイン演出。
 *
 * PERF-003 改修 (2026-09-03):
 *  - RevealOnScroll と同様、per-instance の IO → シングルトン IO に統合。
 *  - useState 排除、in-view 状態は DOM class + inline style で表現、
 *    React の再レンダが発生しない。
 *  - directon/delay は data 属性経由で観測時に読み取る。
 *
 * トリガー位置:
 * - rootMargin: "0px 0px -15% 0px" にすることで、要素の上端がビューポートの
 *   下端から 15% 内側に入った時点で発火 (= 完全に画面に入る前にスタート)
 */
type Props = {
  /** "up" = fade-in-up (translateY 30px → 0)、左右は 40px スライド */
  direction?: "left" | "right" | "up";
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

// ============================================================
// シングルトン IntersectionObserver
// ============================================================
let sharedSlideIO: IntersectionObserver | null = null;
function getSharedIO(): IntersectionObserver {
  if (sharedSlideIO) return sharedSlideIO;
  sharedSlideIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = Number(el.dataset.slideDelay ?? "0");
        const reveal = () => {
          el.style.transform = "translateX(0)";
          el.style.opacity = "1";
        };
        if (delay > 0) window.setTimeout(reveal, delay);
        else reveal();
        sharedSlideIO!.unobserve(el);
      }
    },
    {
      rootMargin: "0px 0px -15% 0px",
      threshold: 0.01,
    }
  );
  return sharedSlideIO;
}

export function SlideInWhenVisible({
  direction = "left",
  delay = 0,
  className = "",
  children,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const translate =
    direction === "up"
      ? "translateY(30px)"
      : direction === "right"
        ? "translateX(40px)"
        : "translateX(-40px)";

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // 動きを希望しないユーザーには即可視で
      node.style.transform = "translateX(0)";
      node.style.opacity = "1";
      node.style.transition = "none";
      return;
    }
    // 初期状態を hidden に (SSR/JS 未実行時は inline style が無いので即可視)
    node.style.transform = translate;
    node.style.opacity = "0";
    node.style.transition =
      "transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 600ms ease-out";
    node.style.willChange = "transform, opacity";
    node.dataset.slideDelay = String(delay);
    const io = getSharedIO();
    io.observe(node);
    return () => io.unobserve(node);
  }, [delay, translate]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
