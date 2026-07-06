"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Play } from "lucide-react";
import { SlideInWhenVisible } from "@/components/ui/slide-in-when-visible";

/**
 * TOP LP の FEATURE 02 (ポートフォリオ閲覧) に埋め込む実サムネ ギャラリー。
 *
 * データ: page.tsx (Server) が抽出した実 portfolio_items を props で渡す。
 * 演出: 各タイルを SlideInWhenVisible direction="up" + stagger で順にフワッ。
 *
 * レイアウト方針 (2026-07-03 改修):
 *  - 旧: grid grid-cols-3/4 で全タイルに aspect-ratio クラス。
 *    → 縦型/横型/正方形が混ざるとグリッドの行高で余白が発生し、ちぐはぐな見た目
 *  - 新: CSS multi-column (columns-2 sm:columns-3) による Masonry (レンガ積み)。
 *    タイル固有の縦横比のまま、隙間なく詰め込んで自然なギャラリー表示に。
 *  - タイルは列内で縦積み。break-inside-avoid で分断防止。
 *
 * サムネ:
 *  - Next/Image に width/height (実寸) を渡し、高さは aspect-ratio で自動計算。
 *  - 縦型 = 9:16、横型 = 16:9、正方形 = 1:1。
 */

export type LpPortfolioTile = {
  id: string;
  href: string;
  thumbnailUrl: string;
  title: string;
  aspect: "horizontal" | "vertical" | "square";
  likeCount: number;
};

const aspectStyle = (a: LpPortfolioTile["aspect"]): React.CSSProperties => ({
  aspectRatio:
    a === "vertical" ? "9 / 16" : a === "square" ? "1 / 1" : "16 / 9",
});

export function LpPortfolioPreview({ tiles }: { tiles: LpPortfolioTile[] }) {
  return (
    <div className="bg-paper p-3">
      {/*
        Masonry: CSS multi-column を使い、各タイルは自身の aspect-ratio で
        自然な高さを取り、列内で縦積みされる。gap は gap-y-2 で列内、
        gap-x-2 で列間の詰まりを制御。
      */}
      <div className="[column-gap:0.5rem] columns-2 sm:columns-3">
        {tiles.map((t, i) => (
          <SlideInWhenVisible
            key={t.id}
            direction="up"
            delay={i * 80}
            className="mb-2 break-inside-avoid"
          >
            <Link
              href={t.href}
              className="group relative block overflow-hidden rounded-sm border border-ink/10 bg-ink/[0.04]"
              aria-label={t.title}
              style={aspectStyle(t.aspect)}
            >
              <Image
                src={t.thumbnailUrl}
                alt={t.title}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* 下端スクリム で いいね + Play アイコン視認性 */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {t.likeCount > 0 && (
                <span className="absolute right-1 top-1 z-10 inline-flex items-center gap-1 rounded-sm bg-black/45 px-1 py-0.5 font-mono text-[9px] text-white backdrop-blur-sm">
                  <Heart
                    size={8}
                    fill="currentColor"
                    strokeWidth={0}
                    className="text-sand"
                    aria-hidden
                  />
                  {t.likeCount}
                </span>
              )}
              <span className="absolute bottom-1 left-1 inline-flex items-center text-white/85">
                <Play
                  size={11}
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden
                />
              </span>
            </Link>
          </SlideInWhenVisible>
        ))}
      </div>
    </div>
  );
}
