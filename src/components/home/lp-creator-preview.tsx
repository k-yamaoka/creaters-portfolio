"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Sparkles,
  BadgeCheck,
  Search,
  ChevronDown,
  Zap,
  LayoutGrid,
  List,
} from "lucide-react";
import { SlideInWhenVisible } from "@/components/ui/slide-in-when-visible";

/**
 * TOP LP の FEATURE 01 (AIクリエイター検索) に埋め込む実クリエイター
 * プレビューカード群。
 *
 * データ: page.tsx (Server) が getCreators() で取得 → 上位 3 名を props で渡す。
 * 演出: SlideInWhenVisible direction="up" + stagger delay で上から順にフワッ。
 *
 * UI 構成 (2026-07-03):
 *  - 最上部: 検索・フィルターバー モックアップ (キーワード / ジャンル /
 *    予算 / すぐ対応可能トグル / 一覧⇔グリッド切替)
 *  - その下: 実クリエイター 3 名のカード (fade-in-up stagger)
 */

// 検索バー: 実 /creators と同じフィルタ UI を圧縮モック表示
function SearchFilterMock() {
  return (
    <div className="border-b border-ink/10 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Keyword search */}
        <div className="flex flex-1 min-w-[140px] items-center gap-2 rounded-md border border-ink/15 bg-white px-2.5 py-1.5">
          <Search
            size={12}
            strokeWidth={1.8}
            className="text-ink/50"
            aria-hidden
          />
          <span className="truncate text-[11px] text-ink/50">
            クリエイター名 / 強みで検索
          </span>
        </div>
        {/* Genre */}
        <button
          type="button"
          disabled
          className="flex items-center gap-1 rounded-md border border-ink/15 bg-white px-2.5 py-1.5 text-[11px] text-ink/70"
        >
          ジャンル
          <ChevronDown size={11} strokeWidth={1.8} aria-hidden />
        </button>
        {/* Budget */}
        <button
          type="button"
          disabled
          className="flex items-center gap-1 rounded-md border border-ink/15 bg-white px-2.5 py-1.5 text-[11px] text-ink/70"
        >
          予算
          <ChevronDown size={11} strokeWidth={1.8} aria-hidden />
        </button>
        {/* Immediate toggle */}
        <button
          type="button"
          disabled
          className="flex items-center gap-1.5 rounded-full border border-sand/50 bg-sand/10 px-2.5 py-1 text-[11px] font-medium text-ink"
        >
          <Zap
            size={10}
            strokeWidth={2}
            fill="currentColor"
            className="text-sand"
            aria-hidden
          />
          すぐ対応可能
          <span
            aria-hidden
            className="relative ml-0.5 inline-flex h-3 w-6 items-center rounded-full bg-sand"
          >
            <span className="absolute right-0.5 inline-block h-2 w-2 rounded-full bg-white" />
          </span>
        </button>
        {/* Layout toggle */}
        <div className="ml-auto flex items-center overflow-hidden rounded-md border border-ink/15">
          <span className="bg-ink/[0.06] p-1.5 text-ink/70">
            <List size={11} strokeWidth={1.8} aria-hidden />
          </span>
          <span className="border-l border-ink/15 p-1.5 text-ink/40">
            <LayoutGrid size={11} strokeWidth={1.8} aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}

type LpCreator = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  bio: string;
  minimumOrderAmount: number | null;
  strengths: string[];
  genres: string[];
  thumbnailUrl: string | null;
  totalLikes: number;
};

export function LpCreatorPreview({ creators }: { creators: LpCreator[] }) {
  return (
    <div className="bg-paper">
      <SearchFilterMock />
      <div className="space-y-3 p-4">
      {creators.map((c, i) => (
        <SlideInWhenVisible key={c.id} direction="up" delay={i * 120}>
          <Link
            href={`/creators/${c.id}`}
            className="group flex items-center gap-3 rounded-md border border-ink/10 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-sm"
          >
            {/* サムネ (代表作) */}
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-sm bg-ink/[0.04]">
              {c.thumbnailUrl ? (
                <Image
                  src={c.thumbnailUrl}
                  alt={c.displayName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Sparkles
                    size={16}
                    strokeWidth={1.5}
                    className="text-ink/30"
                    aria-hidden
                  />
                </div>
              )}
            </div>

            {/* テキスト情報 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-ink/[0.04]">
                  {c.avatarUrl ? (
                    <Image
                      src={c.avatarUrl}
                      alt=""
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-[10px] text-ink/60">
                      {c.displayName[0]}
                    </div>
                  )}
                </div>
                <span className="truncate font-display text-sm font-medium text-ink">
                  {c.displayName}
                </span>
                {c.isVerified && (
                  <BadgeCheck
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-sand"
                    fill="currentColor"
                    aria-label="認証済み"
                  />
                )}
                <span className="ml-auto inline-flex shrink-0 items-center gap-1 font-mono text-[9px] text-ink/55">
                  <Heart
                    size={9}
                    fill="currentColor"
                    strokeWidth={0}
                    className="text-sand"
                    aria-hidden
                  />
                  {c.totalLikes}
                </span>
              </div>

              <p className="mt-1 line-clamp-1 text-[11px] leading-snug text-ink/60">
                {c.bio}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {c.strengths.slice(0, 1).map((s) => (
                  <span
                    key={s}
                    className="rounded-sm bg-sand/15 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink/70"
                  >
                    {s}
                  </span>
                ))}
                {c.genres.slice(0, 1).map((g) => (
                  <span
                    key={g}
                    className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink/50"
                  >
                    · {g}
                  </span>
                ))}
              </div>
            </div>

            {/* 最低料金 */}
            <div className="shrink-0 text-right">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink/45">
                From
              </p>
              <p className="font-display text-[13px] font-medium text-ink">
                {c.minimumOrderAmount !== null
                  ? `¥${c.minimumOrderAmount.toLocaleString()}〜`
                  : "応相談"}
              </p>
            </div>
          </Link>
        </SlideInWhenVisible>
      ))}
      </div>
    </div>
  );
}

export type { LpCreator };
