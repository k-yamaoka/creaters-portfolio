"use client";

import { useState, useMemo } from "react";
import { PortfolioThumbnailGrid } from "@/components/creators/portfolio-thumbnail-grid";
import { SearchFilters, SearchTopBar } from "@/components/creators/search-filters";
import type { CreatorWithRelations } from "@/lib/supabase/queries";
import type { CreatorSearchFilters } from "@/types/database";

export function PortfoliosPageClient({
  creators,
  likedIds = [],
  isAuthed = false,
}: {
  creators: CreatorWithRelations[];
  likedIds?: string[];
  isAuthed?: boolean;
}) {
  const likedIdSet = useMemo(() => new Set(likedIds), [likedIds]);
  const [filters, setFilters] = useState<CreatorSearchFilters>({
    sortBy: "recommended",
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredCreators = useMemo(() => {
    let result = [...creators];

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (c) =>
          (c.profiles.display_name ?? "").toLowerCase().includes(kw) ||
          (c.bio ?? "").toLowerCase().includes(kw) ||
          (c.strengths ?? []).some((s) => s.toLowerCase().includes(kw)) ||
          (c.video_lengths ?? []).some((l) => l.toLowerCase().includes(kw)) ||
          (c.genres ?? []).some((g) => g.toLowerCase().includes(kw))
      );
    }

    if (filters.genres && filters.genres.length > 0) {
      result = result.filter((c) =>
        filters.genres!.some((g) => c.genres.includes(g))
      );
    }

    switch (filters.sortBy) {
      case "recommended":
        result.sort(
          (a, b) =>
            b.rating * 0.7 + b.review_count * 0.3 -
            (a.rating * 0.7 + a.review_count * 0.3)
        );
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "price_low":
      case "price_high": {
        // 最低受注金額で並び替え。未設定は方向によらず末尾固定
        const dir = filters.sortBy === "price_low" ? 1 : -1;
        result.sort((a, b) => {
          const pa = a.minimum_order_amount ?? Number.POSITIVE_INFINITY;
          const pb = b.minimum_order_amount ?? Number.POSITIVE_INFINITY;
          const ai = !isFinite(pa);
          const bi = !isFinite(pb);
          if (ai && bi) return 0;
          if (ai) return 1;
          if (bi) return -1;
          return (pa - pb) * dir;
        });
        break;
      }
    }

    return result;
  }, [filters, creators]);

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-10">
      {/* Page Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-[2.5rem]">
            AI動画ポートフォリオ
          </h1>
          <p className="mt-3 text-sm text-white/65">
            Sora / Veo / Runway / Midjourney などを使いこなすAIクリエイターの作品一覧。気になる作品から詳細へ。
          </p>
        </div>
        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex items-center gap-2 rounded-pill border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm lg:hidden"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.7}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
            />
          </svg>
          絞り込み
        </button>
      </div>

      <SearchTopBar
        filters={filters}
        onFilterChange={setFilters}
        resultCount={filteredCreators.length}
      />

      <div className="flex gap-8">
        <div className="hidden lg:block">
          <SearchFilters
            filters={filters}
            onFilterChange={setFilters}
            resultCount={filteredCreators.length}
          />
        </div>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/15 bg-neon-midnight-deep/95 p-6 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-white">絞り込み</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-pill bg-white/10 text-white/70"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <SearchFilters
                filters={filters}
                onFilterChange={(f) => {
                  setFilters(f);
                }}
                resultCount={filteredCreators.length}
              />
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary mt-6 w-full"
              >
                {filteredCreators.length}件を表示
              </button>
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {filteredCreators.length > 0 ? (
            <PortfolioThumbnailGrid
              creators={filteredCreators}
              likedIds={likedIdSet}
              isAuthed={isAuthed}
            />
          ) : (
            <div className="mt-20 text-center">
              <svg
                className="mx-auto h-16 w-16 text-white/20"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <h3 className="mt-6 text-xl font-black text-white">
                該当する作品が見つかりませんでした
              </h3>
              <p className="mt-2 text-sm text-white/65">
                検索条件を変更して、もう一度お試しください
              </p>
              <button
                type="button"
                onClick={() => setFilters({ sortBy: "recommended" })}
                className="btn-primary mt-6"
              >
                フィルターをクリア
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
