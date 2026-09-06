"use client";

import { LazyOnVisible } from "@/components/ui/lazy-on-visible";
import type { DigestWork } from "./works-digest";

/**
 * PERF-008: WorksDigest (18 本タブ切替 + hover autoplay) を「スクロール
 * 到達で初めて」ダウンロード + hydrate する Client ラッパ。
 */
type Props = { works: DigestWork[] };
export function WorksDigestLazy({ works }: Props) {
  return (
    <LazyOnVisible<Props>
      importer={() =>
        import("./works-digest").then((m) => ({ default: m.WorksDigest }))
      }
      componentProps={{ works }}
      fallbackMinHeight={800}
    />
  );
}
