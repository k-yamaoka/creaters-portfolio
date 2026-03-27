"use client";

import { useState, useMemo } from "react";
import { CreatorCard } from "@/components/creators/creator-card";
import { SearchFilters } from "@/components/creators/search-filters";
import { mockCreators } from "@/lib/mock-data";
import type { CreatorSearchFilters } from "@/types/database";

export default function CreatorsPage() {
  const [filters, setFilters] = useState<CreatorSearchFilters>({
    sortBy: "rating",
  });

  const filteredCreators = useMemo(() => {
    let result = [...mockCreators];

    // Keyword search
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (c) =>
          c.display_name.toLowerCase().includes(kw) ||
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
        const lowestPrice = Math.min(...c.packages.map((p) => p.price));
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
            Math.min(...a.packages.map((p) => p.price)) -
            Math.min(...b.packages.map((p) => p.price))
        );
        break;
      case "price_high":
        result.sort(
          (a, b) =>
            Math.min(...b.packages.map((p) => p.price)) -
            Math.min(...a.packages.map((p) => p.price))
        );
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    return result;
  }, [filters]);

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          クリエイターを探す
        </h1>
        <p className="mt-3 text-base text-[#828282]">
          あなたのプロジェクトに最適な映像クリエイターを見つけましょう
        </p>
      </div>

      {/* Filters */}
      <SearchFilters
        filters={filters}
        onFilterChange={setFilters}
        resultCount={filteredCreators.length}
      />

      {/* Creator Grid */}
      {filteredCreators.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCreators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
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
  );
}
