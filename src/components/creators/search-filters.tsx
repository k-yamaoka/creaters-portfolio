"use client";

import { useState } from "react";
import { GENRES } from "@/lib/constants";
import type { CreatorSearchFilters } from "@/types/database";

type SearchFiltersProps = {
  filters: CreatorSearchFilters;
  onFilterChange: (filters: CreatorSearchFilters) => void;
  resultCount: number;
};

const SORT_OPTIONS = [
  { value: "recommended" as const, label: "おすすめ" },
  { value: "rating" as const, label: "評価が高い" },
  { value: "price_low" as const, label: "金額が安い" },
  { value: "price_high" as const, label: "金額が高い" },
];

export function SearchTopBar({
  filters,
  onFilterChange,
  resultCount,
}: SearchFiltersProps) {
  const updateFilter = (update: Partial<CreatorSearchFilters>) => {
    onFilterChange({ ...filters, ...update });
  };

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)] sm:flex-row sm:items-center">
      {/* Keyword search */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
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
          className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-neon-pink focus:bg-white/10 focus:ring-1 focus:ring-neon-pink"
        />
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3">
        <label className="shrink-0 text-xs font-bold text-white/60">並び順</label>
        <select
          value={filters.sortBy || "recommended"}
          onChange={(e) =>
            updateFilter({
              sortBy: e.target.value as CreatorSearchFilters["sortBy"],
            })
          }
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-neon-pink focus:bg-white/10 focus:ring-1 focus:ring-neon-pink"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-neon-midnight-deep">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p className="shrink-0 text-sm text-white/65">
        <span className="font-bold text-white">{resultCount}</span> 件
      </p>
    </div>
  );
}

export function SearchFilters({
  filters,
  onFilterChange,
  resultCount,
}: SearchFiltersProps) {
  const [genreOpen, setGenreOpen] = useState(true);

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
    onFilterChange({ sortBy: "recommended" });
  };

  const hasActiveFilters =
    filters.keyword || (filters.genres && filters.genres.length > 0);

  return (
    <aside className="w-full shrink-0 lg:w-[260px]">
      <div className="sticky top-24 space-y-6">
        {/* Genre Tags */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={() => setGenreOpen(!genreOpen)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
              制作ジャンル
            </h3>
            <svg
              className={`h-4 w-4 text-white/50 transition-transform ${genreOpen ? "rotate-180" : ""}`}
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
                        ? "border-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-[0_0_12px_rgba(255,77,157,0.4)]"
                        : "border-white/15 bg-white/5 text-white/75 hover:border-neon-pink/40 hover:text-white"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear filter only (件数表示は撤去) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="w-full rounded-pill border border-white/20 bg-white/5 py-2 text-xs font-bold text-white/80 backdrop-blur-sm transition-colors hover:border-neon-pink/40 hover:bg-white/10"
          >
            フィルターをクリア
          </button>
        )}
      </div>
    </aside>
  );
}
