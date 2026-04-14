"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { GENRES, PLATFORMS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { JobSearchFilters } from "@/types/database";

type Job = {
  id: string;
  title: string;
  description: string;
  genres: string[];
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  delivery_deadline: string | null;
  application_count: number;
  status: string;
  created_at: string;
  client: {
    id: string;
    company_name: string | null;
    profiles: { display_name: string };
  };
};

const SORT_OPTIONS = [
  { value: "newest" as const, label: "新着" },
  { value: "popular" as const, label: "人気" },
  { value: "price_high" as const, label: "金額が高い" },
  { value: "deadline" as const, label: "応募期限が近い" },
];

export function JobsPageClient({ jobs }: { jobs: Job[] }) {
  const [filters, setFilters] = useState<JobSearchFilters>({
    sortBy: "newest",
    statusFilter: "all",
  });
  const [genreOpen, setGenreOpen] = useState(true);
  const [platformOpen, setPlatformOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const updateFilter = (update: Partial<JobSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...update }));
  };

  const toggleGenre = (genre: string) => {
    const current = filters.genres || [];
    const updated = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    updateFilter({ genres: updated.length > 0 ? updated : undefined });
  };

  const togglePlatform = (platform: string) => {
    const current = filters.platforms || [];
    const updated = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform];
    updateFilter({ platforms: updated.length > 0 ? updated : undefined });
  };

  const filtered = useMemo(() => {
    let result = [...jobs];

    // Status filter
    if (filters.statusFilter === "open") {
      result = result.filter((j) => j.status === "open");
    }

    // Keyword search
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(kw) ||
          j.description.toLowerCase().includes(kw) ||
          j.genres.some((g) => g.toLowerCase().includes(kw))
      );
    }

    // Genre filter
    if (filters.genres && filters.genres.length > 0) {
      result = result.filter((j) =>
        filters.genres!.some((g) => j.genres.includes(g))
      );
    }

    // Platform filter
    if (filters.platforms && filters.platforms.length > 0) {
      result = result.filter((j) =>
        filters.platforms!.some((p) =>
          j.genres.some((g) => g.toLowerCase().includes(p.toLowerCase()))
        )
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "popular":
        result.sort((a, b) => b.application_count - a.application_count);
        break;
      case "price_high":
        result.sort(
          (a, b) => (b.budget_max || b.budget_min || 0) - (a.budget_max || a.budget_min || 0)
        );
        break;
      case "deadline":
        result.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        break;
    }

    return result;
  }, [jobs, filters]);

  const hasActiveFilters =
    filters.keyword ||
    (filters.genres && filters.genres.length > 0) ||
    (filters.platforms && filters.platforms.length > 0);

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
            案件を探す
          </h1>
          <p className="mt-3 text-base text-[#828282]">
            企業が掲載した映像制作の募集案件から、あなたに合った仕事を見つけましょう
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

      {/* Top bar: keyword search + sort + status filter */}
      <div className="mb-6 space-y-4 rounded-2xl bg-white p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Keyword search */}
          <div className="relative flex-1">
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

          {/* Sort */}
          <div className="flex items-center gap-3">
            <label className="shrink-0 text-xs font-bold text-[#828282]">並び順</label>
            <select
              value={filters.sortBy || "newest"}
              onChange={(e) =>
                updateFilter({
                  sortBy: e.target.value as JobSearchFilters["sortBy"],
                })
              }
              className="rounded-lg border border-[#E0E0E0] px-3 py-2.5 text-sm text-[#4F4F4F] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Result count */}
          <p className="shrink-0 text-sm text-[#828282]">
            <span className="font-bold text-[#222]">{filtered.length}</span> 件
          </p>
        </div>

        {/* Status filter radio */}
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="statusFilter"
              checked={filters.statusFilter === "all"}
              onChange={() => updateFilter({ statusFilter: "all" })}
              className="h-4 w-4 border-[#E0E0E0] text-primary-500 focus:ring-primary-500"
            />
            <span className={filters.statusFilter === "all" ? "font-bold text-[#222]" : "text-[#4F4F4F]"}>
              全て
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="statusFilter"
              checked={filters.statusFilter === "open"}
              onChange={() => updateFilter({ statusFilter: "open" })}
              className="h-4 w-4 border-[#E0E0E0] text-primary-500 focus:ring-primary-500"
            />
            <span className={filters.statusFilter === "open" ? "font-bold text-[#222]" : "text-[#4F4F4F]"}>
              募集中案件
            </span>
          </label>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-8">
        {/* Sidebar: genres + platforms */}
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Genre */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
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

            {/* Platform */}
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <button
                type="button"
                onClick={() => setPlatformOpen(!platformOpen)}
                className="flex w-full items-center justify-between"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#828282]">
                  プラットフォーム
                </h3>
                <svg
                  className={`h-4 w-4 text-[#BDBDBD] transition-transform ${platformOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {platformOpen && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PLATFORMS.map((platform) => {
                    const isActive = filters.platforms?.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`rounded-pill border px-3 py-1.5 text-xs font-medium transition-all ${
                          isActive
                            ? "border-primary-500 bg-primary-500 text-white"
                            : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
                        }`}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Count */}
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-sm text-[#828282]">
                <span className="text-lg font-bold text-[#222]">
                  {filtered.length}
                </span>{" "}
                件の案件
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters({ sortBy: "newest", statusFilter: filters.statusFilter })
                  }
                  className="mt-3 w-full rounded-lg border border-[#E0E0E0] py-2 text-sm font-medium text-[#828282] transition-colors hover:bg-[#F8F8F8]"
                >
                  フィルターをクリア
                </button>
              )}
            </div>
          </div>
        </aside>

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
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Genre tags in mobile */}
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#828282]">制作ジャンル</h3>
                  <div className="flex flex-wrap gap-1.5">
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
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#828282]">プラットフォーム</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORMS.map((platform) => {
                      const isActive = filters.platforms?.includes(platform);
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => togglePlatform(platform)}
                          className={`rounded-pill border px-3 py-1.5 text-xs font-medium transition-all ${
                            isActive
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
                          }`}
                        >
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary mt-6 w-full"
              >
                {filtered.length}件を表示
              </button>
            </div>
          </div>
        )}

        {/* Job list */}
        <div className="min-w-0 flex-1">
          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((job) => {
                const clientName =
                  job.client?.company_name ||
                  job.client?.profiles?.display_name ||
                  "企業";
                const daysAgo = Math.floor(
                  (Date.now() - new Date(job.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const timeLabel =
                  daysAgo === 0
                    ? "今日"
                    : daysAgo === 1
                      ? "昨日"
                      : `${daysAgo}日前`;

                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-2xl bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-[#222]">
                          {job.title}
                        </h2>
                        <p className="mt-1 text-sm text-[#828282]">
                          {clientName}
                        </p>
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#4F4F4F]">
                          {job.description}
                        </p>
                        {/* Genre tags */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.genres.slice(0, 4).map((genre) => (
                            <span
                              key={genre}
                              className="rounded-pill bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-500"
                            >
                              {genre}
                            </span>
                          ))}
                          {job.genres.length > 4 && (
                            <span className="text-[11px] text-[#BDBDBD]">
                              +{job.genres.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {(job.budget_min || job.budget_max) && (
                          <p className="text-lg font-bold text-primary-500">
                            {job.budget_min && job.budget_max
                              ? `${formatPrice(job.budget_min)}〜${formatPrice(job.budget_max)}`
                              : job.budget_max
                                ? `〜${formatPrice(job.budget_max)}`
                                : `${formatPrice(job.budget_min!)}〜`}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[#BDBDBD]">
                          {timeLabel}
                        </p>
                        {job.deadline && (
                          <p className="mt-1 text-xs text-[#828282]">
                            締切:{" "}
                            {new Date(job.deadline).toLocaleDateString("ja-JP")}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-[#828282]">
                          応募 {job.application_count}件
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              <h3 className="mt-6 text-xl font-bold text-[#222]">
                現在募集中の案件はありません
              </h3>
              <p className="mt-2 text-sm text-[#828282]">
                新しい案件が掲載されるまでお待ちください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
