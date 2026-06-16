"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 縦方向の「初回 1 回だけ」フェードアップ演出 (ハイエンド土台用)。
 *
 * - globals.css の `.reveal-up` (Step 1 で追加済) を使い、可視判定で
 *   `.in-view` を付与してフェードアップ
 * - prefers-reduced-motion 時は即時表示 (CSS 側で transition 無効)
 * - 一度発火したら IntersectionObserver を切る (戻りスクロールで再生し直さない)
 * - delay で内部 stagger を作る (Eyebrow → h1 → 本文 → CTA など)
 *
 * NN/g 準拠: 動きは控えめ・短く・一度だけ。
 */
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.setTimeout(() => setVisible(true), delay);
            io.disconnect();
            break;
          }
        }
      },
      {
        // 要素の上端が viewport 下端から 15% 入った時点で発火
        rootMargin: "0px 0px -15% 0px",
        threshold: 0.01,
      }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [delay]);

  // ref は generic に張れないので、As タグごとに渡し方を分岐
  const className_ = `reveal-up ${visible ? "in-view" : ""} ${className}`;
  const props = {
    ref: ref as React.MutableRefObject<HTMLElement | null>,
    className: className_,
  };
  // React の as polymorphism: createElement で発行
  return <As {...(props as React.HTMLAttributes<HTMLElement>)}>{children}</As>;
}
