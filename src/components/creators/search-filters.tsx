"use client";

import { useState } from "react";
import { GENRES } from "@/lib/constants";
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
  const [genreOpen, setGenreOpen] = useState(true);
  const [budgetOpen, setBudgetOpen] = useState(true);

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
    <aside className="w-full shrink-0 lg:w-[260px]">
      <div className="sticky top-24 space-y-6">
        {/* Search */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#BDBDBD]"
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
            <input
              type="text"
              placeholder="キーワードで検索"
              value={filters.keyword || ""}
              onChange={(e) =>
                updateFilter({ keyword: e.target.value || undefined })
              }
              className="w-full rounded-lg border border-[#E0E0E0] py-2.5 pl-9 pr-3 text-sm text-[#222] placeholder-[#BDBDBD] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#828282]">
            並び順
          </h3>
          <select
            value={filters.sortBy || "rating"}
            onChange={(e) =>
              updateFilter({
                sortBy: e.target.value as CreatorSearchFilters["sortBy"],
              })
            }
            className="w-full rounded-lg border border-[#E0E0E0] px-3 py-2.5 text-sm text-[#4F4F4F] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Tags */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <button
            type="button"
            onClick={() => setGenreOpen(!genreOpen)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#828282]">
              制作ジャンル
            </h3>
            <svg
              className={`h-4 w-4 text-[#BDBDBD] transition-transform ${genreOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {genreOpen && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {GENRES.map((genre) => {
                const isActive = filters.genres?.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`rounded-pill border px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Budget */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <button
            type="button"
            onClick={() => setBudgetOpen(!budgetOpen)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#828282]">
              予算
            </h3>
            <svg
              className={`h-4 w-4 text-[#BDBDBD] transition-transform ${budgetOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {budgetOpen && (
            <div className="mt-3 space-y-1">
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
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-primary-50 font-bold text-primary-500"
                        : "text-[#4F4F4F] hover:bg-[#F8F8F8]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Results & Clear */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-sm text-[#828282]">
            <span className="text-lg font-bold text-[#222]">
              {resultCount}
            </span>{" "}
            件のクリエイター
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 w-full rounded-lg border border-[#E0E0E0] py-2 text-sm font-medium text-[#828282] transition-colors hover:bg-[#F8F8F8]"
            >
              フィルターをクリア
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
