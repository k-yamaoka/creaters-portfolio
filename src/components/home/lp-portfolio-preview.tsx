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
 * 特徴:
 *  - 縦型 / 横型 / 正方形 の aspect_ratio を混在させて自然なグリッド
 *  - 実サムネがない作品は表示しない (プレースホルダー無し)
 */

export type LpPortfolioTile = {
  id: string;
  href: string;
  thumbnailUrl: string;
  title: string;
  aspect: "horizontal" | "vertical" | "square";
  likeCount: number;
};

const aspectClass = (a: LpPortfolioTile["aspect"]): string =>
  a === "vertical"
    ? "aspect-[9/16]"
    : a === "square"
      ? "aspect-square"
      : "aspect-video";

export function LpPortfolioPreview({ tiles }: { tiles: LpPortfolioTile[] }) {
  return (
    <div className="bg-paper p-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {tiles.map((t, i) => (
          <SlideInWhenVisible key={t.id} direction="up" delay={i * 80}>
            <Link
              href={t.href}
              className={`group relative block ${aspectClass(t.aspect)} overflow-hidden rounded-sm border border-ink/10 bg-ink/[0.04]`}
              aria-label={t.title}
            >
              <Image
                src={t.thumbnailUrl}
                alt={t.title}
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
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
