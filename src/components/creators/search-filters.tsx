"use client";

import { useState } from "react";
import { GENRES } from "@/lib/mock-data";
import type { CreatorSearchFilters } from "@/types/database";

type SearchFiltersProps = {
  filters: CreatorSearchFilters;
  onFilterChange: (filters: CreatorSearchFilters) => void;
  resultCount: number;
};

const BUDGET_OPTIONS = [
  { label: "指定なし", min: undefined, max: undefined },
  { label: "〜3万円", min: 0, max: 30000 },
  { label: "3万〜10万円", min: 30000, max: 100000 },
  { label: "10万〜30万円", min: 100000, max: 300000 },
  { label: "30万〜50万円", min: 300000, max: 500000 },
  { label: "50万円〜", min: 500000, max: undefined },
];

const SORT_OPTIONS = [
  { value: "rating" as const, label: "評価が高い順" },
  { value: "price_low" as const, label: "価格が安い順" },
  { value: "price_high" as const, label: "価格が高い順" },
  { value: "newest" as const, label: "新着順" },
];

export function SearchFilters({
  filters,
  onFilterChange,
  resultCount,
}: SearchFiltersProps) {
  const [showBudget, setShowBudget] = useState(false);

  const updateFilter = (update: Partial<CreatorSearchFilters>) => {
    onFilterChange({ ...filters, ...update });
  };

  const toggleGenre = (genre: string) => {
    const current = filters.genres || [];
    const updated = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    updateFilter({ genres: updated.length > 0 ? updated : undefined });
  };

  const clearFilters = () => {
    onFilterChange({ sortBy: "rating" });
  };

  const hasActiveFilters =
    filters.keyword ||
    (filters.genres && filters.genres.length > 0) ||
    filters.budgetMin !== undefined ||
    filters.budgetMax !== undefined;

  return (
    <div className="space-y-6">
      {/* Search Bar - foriio style pill input */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <div className="flex overflow-hidden rounded-pill border border-[#DDD]">
            <div className="flex items-center bg-[#F2F2F2] px-4">
              <svg
                className="h-4 w-4 text-[#828282]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="キーワードで検索（例: YouTube編集, モーショングラフィックス）"
              value={filters.keyword || ""}
              onChange={(e) =>
                updateFilter({ keyword: e.target.value || undefined })
              }
              className="w-full border-0 bg-white py-2.5 pl-3 pr-4 text-sm text-[#222] placeholder-[#BDBDBD] focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={filters.sortBy || "rating"}
            onChange={(e) =>
              updateFilter({
                sortBy: e.target.value as CreatorSearchFilters["sortBy"],
              })
            }
            className="rounded-pill border border-[#DDD] bg-white px-4 py-2.5 text-sm text-[#4F4F4F] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Budget toggle */}
          <button
            type="button"
            onClick={() => setShowBudget(!showBudget)}
            className={`flex items-center gap-1.5 rounded-pill border px-4 py-2.5 text-sm font-medium transition-all ${
              showBudget || filters.budgetMin !== undefined
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-[#BDBDBD] text-[#4F4F4F] hover:border-primary-500 hover:bg-primary-500 hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            予算
          </button>
        </div>
      </div>

      {/* Budget Filter - expandable */}
      {showBudget && (
        <div className="flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((option) => {
            const isActive =
              filters.budgetMin === option.min &&
              filters.budgetMax === option.max;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() =>
                  updateFilter({
                    budgetMin: option.min,
                    budgetMax: option.max,
                  })
                }
                className={`rounded-pill border px-5 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-[#BDBDBD] text-[#4F4F4F] hover:border-primary-500 hover:bg-primary-500 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Genre Pills - foriio style */}
      <div className="flex flex-wrap gap-2">
        {GENRES.map((genre) => {
          const isActive = filters.genres?.includes(genre);
          return (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`rounded-pill border px-5 py-2 text-sm font-bold transition-all ${
                isActive
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-[#BDBDBD] text-[#4F4F4F] hover:border-primary-500 hover:bg-primary-500 hover:text-white"
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* Results count & Clear */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#828282]">
          <span className="font-bold text-[#222]">{resultCount}</span>
          件のクリエイター
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-primary-500 underline decoration-primary-500/30 hover:decoration-primary-500"
          >
            フィルターをクリア
          </button>
        )}
      </div>
    </div>
  );
}
