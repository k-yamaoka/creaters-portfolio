"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Intersection Observer による「初回 1 回だけ」横フェードイン演出。
 *
 * - direction: "left" → translateX(-40px → 0) で左から滑り込む
 * - direction: "right" → translateX(+40px → 0) で右から滑り込む
 * - delay: ms 単位で開始遅延 (内部 stagger 用)
 * - 一度可視になったら状態は固定 (戻りスクロールで消えない / 再生し直さない)
 * - prefers-reduced-motion: reduce 時は移動を無効化、即時に表示状態へ
 * - 親に overflow-x: hidden を当てて、滑り込み中に横スクロールバーが出ない
 *   ようにする運用 (親側は呼び出し元 (page.tsx の FEATURES section) で設定)
 *
 * トリガー位置:
 * - rootMargin: "0px 0px -15% 0px" にすることで、要素の上端がビューポートの
 *   下端から 15% 内側に入った時点で発火 (= 完全に画面に入る前にスタート)
 */
type Props = {
  direction?: "left" | "right";
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

export function SlideInWhenVisible({
  direction = "left",
  delay = 0,
  className = "",
  children,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  // 安全側のデフォルト:
  // - JS が無効/読込前は何もしないが、CSS 側で「最終形 (opacity:1, translate:0)」
  //   を初期状態と認識させたい → noscript / 非対応環境では即可視のフォールバック
  // - SSR 時は visible=true で出力 (一瞬チラつきを避ける)。クライアントで
  //   Observer が動き出した瞬間に hidden → reveal の遷移をかける。
  //
  // 実装は単純に: hasMountedRef を見て、初回は "hidden" 初期状態に
  // セットし、observer が反応したら "visible" に遷移させる。
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReducedMotion(true);
      setHidden(false);
      return;
    }
    // 通常パス: マウント直後に hidden=true にし、observe → 入ったら hidden=false
    setHidden(true);
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // delay は CSS transition-delay でも実装できるが、ここで setTimeout に
            // することでスクロール速度に応じた早押し時もブロック処理に乗らない
            window.setTimeout(() => setHidden(false), delay);
            io.disconnect();
            break;
          }
        }
      },
      {
        // 要素の上端がビューポート下端から 15% 内側に入ったら反応
        rootMargin: "0px 0px -15% 0px",
        threshold: 0.01,
      }
    );
    io.observe(node);
    return () => io.disconnect();
    // direction / delay は初回マウント時に固定でよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translate =
    direction === "right" ? "translateX(40px)" : "translateX(-40px)";

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: hidden ? translate : "translateX(0)",
        opacity: hidden ? 0 : 1,
        transition: reducedMotion
          ? "none"
          : "transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 600ms ease-out",
        // 万一 JS が動かない場合に opacity:0 で固定されないように、IO で hidden
        // を立てるまでは visible のままにしておく (初期 SSR では opacity 1)
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
