"use client";

import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from "react";

/**
 * PERF-008: ビューポート交差 (initial + scroll) を検出するまで
 * `React.lazy()` 相当の import を「発火しない」ラッパ。
 *
 * 主用途:
 *   - TOP LP の「下スクロール到達で初めて必要になる」重い Client Component
 *     (HeroUnderBand の autoplay video 帯 / WorksDigest のタブ + video 一覧
 *     等) を、初回 paint 時にはバンドル自体をダウンロードしない。
 *   - `<div>` の height を予約 (fallbackMinHeight) することで CLS を避ける。
 *
 * SSR:
 *   - 初回 SSR 出力は「予約 div + fallback (=空)」のみ。SEO 重要度が低い
 *     セクション向け。SEO を要求する block には使わないこと (FAQ 等)。
 */
type Props<P extends object> = {
  /** dynamic import 関数。返り値のモジュールに named export で取り出せる関数を渡す */
  importer: () => Promise<{ default: ComponentType<P> }>;
  /** import した Component へ渡す props */
  componentProps: P;
  /** レンダ前の場所取り高さ (min-height)。CLS を抑えるため指定推奨。 */
  fallbackMinHeight?: number | string;
  /** IntersectionObserver の rootMargin (先読みしたい場合広げる) */
  rootMargin?: string;
  /** fallback 要素 (省略時は空の div) */
  fallback?: React.ReactNode;
};

export function LazyOnVisible<P extends object>({
  importer,
  componentProps,
  fallbackMinHeight = 600,
  rootMargin = "200px 0px",
  fallback = null,
}: Props<P>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [Component, setComponent] = useState<LazyExoticComponent<
    ComponentType<P>
  > | null>(null);

  useEffect(() => {
    if (visible) return;
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            return;
          }
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  useEffect(() => {
    if (!visible || Component) return;
    setComponent(() => lazy(importer));
  }, [visible, Component, importer]);

  return (
    <div ref={containerRef} style={{ minHeight: fallbackMinHeight }}>
      {Component && (
        <Suspense fallback={fallback}>
          <Component {...componentProps} />
        </Suspense>
      )}
    </div>
  );
}
