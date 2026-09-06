"use client";

import { LazyOnVisible } from "@/components/ui/lazy-on-visible";
import type { BandWork } from "./hero-under-band";

/**
 * PERF-008: HeroUnderBand (video 帯) を「スクロール到達で初めて」
 * ダウンロード + hydrate する Client ラッパ。
 *
 * Server 側 (page.tsx) からは通常 import として渡せるが、内部で
 * LazyOnVisible を使うことでバンドル chunk を viewport 交差まで
 * ロードしない → 初回 JS 転送量を大幅に削減。
 */
type Props = { works: BandWork[] };
export function HeroUnderBandLazy({ works }: Props) {
  return (
    <LazyOnVisible<Props>
      importer={() =>
        import("./hero-under-band").then((m) => ({ default: m.HeroUnderBand }))
      }
      componentProps={{ works }}
      fallbackMinHeight={480}
    />
  );
}
