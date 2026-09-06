"use client";

import { useEffect, useRef } from "react";

/**
 * 縦方向の「初回 1 回だけ」フェードアップ演出 (ハイエンド土台用)。
 *
 * PERF-003 改修 (2026-09-03):
 *  - 元は 1 インスタンスにつき 1 個の IntersectionObserver を作っており
 *    LP で 30+ 個の IO が動いて TBT 3.25s の主犯になっていた。
 *  - 単一シングルトン IO に統合し、observe/disconnect 呼び出しコストを
 *    1/N に圧縮。可視化後は .in-view を直接 DOM に書き込み、React 再レンダ
 *    を発生させない (useState 撤去)。
 *  - element.dataset.rsDelay に delay(ms) を持たせ、in-view 付与時に
 *    setTimeout で stagger を再現。
 *
 * - globals.css の `.reveal-up` を使い、可視判定で `.in-view` を付与
 * - prefers-reduced-motion 時は初期状態で .in-view を付与 (CSS 側で transition なし)
 * - 一度発火したら unobserve (戻りスクロールで再生し直さない)
 *
 * NN/g 準拠: 動きは控えめ・短く・一度だけ。
 */

// ============================================================
// シングルトン IntersectionObserver (SSR 中は生成しない)
// ============================================================
let sharedIO: IntersectionObserver | null = null;
function getSharedIO(): IntersectionObserver {
  if (sharedIO) return sharedIO;
  sharedIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = Number(el.dataset.rsDelay ?? "0");
        if (delay > 0) {
          window.setTimeout(() => el.classList.add("in-view"), delay);
        } else {
          el.classList.add("in-view");
        }
        sharedIO!.unobserve(el);
      }
    },
    {
      rootMargin: "0px 0px -15% 0px",
      threshold: 0.01,
    }
  );
  return sharedIO;
}

export function RevealOnScroll({
  children,
  delay = 0,
  className = "",
  as: As = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** ラップに使う HTML タグ (div / span / li 等) */
  as?: "div" | "span" | "li" | "section" | "header" | "footer";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // prefers-reduced-motion 時は即時表示
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      node.classList.add("in-view");
      return;
    }
    node.dataset.rsDelay = String(delay);
    const io = getSharedIO();
    io.observe(node);
    return () => io.unobserve(node);
  }, [delay]);

  const props = {
    ref: ref as React.MutableRefObject<HTMLElement | null>,
    className: `reveal-up ${className}`,
  };
  return <As {...(props as React.HTMLAttributes<HTMLElement>)}>{children}</As>;
}
