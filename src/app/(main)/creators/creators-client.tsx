"use client";

import { useState, useMemo } from "react";
import { PortfolioThumbnailGrid } from "@/components/creators/portfolio-thumbnail-grid";
import { SearchFilters } from "@/components/creators/search-filters";
import type { CreatorWithRelations } from "@/lib/supabase/queries";
import type { CreatorSearchFilters } from "@/types/database";

export function CreatorsPageClient({
  creators,
}: {
  creators: CreatorWithRelations[];
}) {
  const [filters, setFilters] = useState<CreatorSearchFilters>({
    sortBy: "rating",
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredCreators = useMemo(() => {
    let result = [...creators];

    // Keyword search
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (c) =>
          c.profiles.display_name.toLowerCase().includes(kw) ||
          c.bio.toLowerCase().includes(kw) ||
          c.skills.some((s) => s.toLowerCase().includes(kw)) ||
          c.genres.some((g) => g.toLowerCase().includes(kw))
      );
    }

    // Genre filter
    if (filters.genres && filters.genres.length > 0) {
      result = result.filter((c) =>
        filters.genres!.some((g) => c.genres.includes(g))
      );
    }

    // Budget filter
    if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
      result = result.filter((c) => {
        const activePackages = c.service_packages.filter((p) => p.is_active);
        if (activePackages.length === 0) return false;
        const lowestPrice = Math.min(...activePackages.map((p) => p.price));
        if (filters.budgetMin !== undefined && lowestPrice < filters.budgetMin)
          return false;
        if (filters.budgetMax !== undefined && lowestPrice > filters.budgetMax)
          return false;
        return true;
      });
    }

    // Sort
    switch (filters.sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "price_low":
        result.sort(
          (a, b) =>
            Math.min(...a.service_packages.map((p) => p.price)) -
            Math.min(...b.service_packages.map((p) => p.price))
        );
        break;
      case "price_high":
        result.sort(
          (a, b) =>
            Math.min(...b.service_packages.map((p) => p.price)) -
            Math.min(...a.service_packages.map((p) => p.price))
        );
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        break;
    }

    return result;
  }, [filters, creators]);

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      {/* Page Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
            クリエイターを探す
          </h1>
          <p className="mt-3 text-base text-[#828282]">
            サムネイルをクリックしてクリエイターの詳細を確認
          </p>
        </div>
        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex items-center gap-2 rounded-lg border border-[#E0E0E0] px-4 py-2.5 text-sm font-medium text-[#4F4F4F] lg:hidden"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
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

      {/* 2-column layout: Sidebar + Content */}
      <div className="flex gap-8">
        {/* Sidebar filters - Desktop */}
        <div className="hidden lg:block">
          <SearchFilters
            filters={filters}
            onFilterChange={setFilters}
            resultCount={filteredCreators.length}
          />
        </div>

        {/* Mobile filters overlay */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#F8F8F8] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#222]">絞り込み</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2] text-[#828282]"
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

        {/* Creator Grid */}
        <div className="min-w-0 flex-1">
          {filteredCreators.length > 0 ? (
            <PortfolioThumbnailGrid creators={filteredCreators} />
          ) : (
            <div className="mt-20 text-center">
              <svg
                className="mx-auto h-16 w-16 text-[#E0E0E0]"
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
              <h3 className="mt-6 text-xl font-bold text-[#222]">
                該当するクリエイターが見つかりませんでした
              </h3>
              <p className="mt-2 text-sm text-[#828282]">
                検索条件を変更して、もう一度お試しください
              </p>
              <button
                type="button"
                onClick={() => setFilters({ sortBy: "rating" })}
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
