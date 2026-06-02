"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 要素が一度でも viewport (+rootMargin) に入ったかどうかを返す Hook。
 * 一度 true になったらそのまま固定 (lazy load 用途で十分なため)。
 *
 * rootMargin を 300px 程度に拡げておくと、ユーザーがスクロールで近づいた瞬間に
 * 動画 metadata を先回りで読み込めて UX が滑らかになる。
 *
 * 動画一覧などで全カードの <video> を一斉に preload="metadata" させず、
 * 画面に入るカードだけ <video> を mount するために使う。
 */
export function useInViewport<T extends Element>(rootMargin = "300px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
