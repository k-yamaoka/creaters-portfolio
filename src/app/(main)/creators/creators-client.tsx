"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchFilters, SearchTopBar } from "@/components/creators/search-filters";
import type { CreatorWithRelations } from "@/lib/supabase/queries";
import type { CreatorSearchFilters } from "@/types/database";

export function CreatorsPageClient({
  creators,
}: {
  creators: CreatorWithRelations[];
}) {
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
          c.profiles.display_name.toLowerCase().includes(kw) ||
          c.bio.toLowerCase().includes(kw) ||
          c.skills.some((s) => s.toLowerCase().includes(kw)) ||
          c.genres.some((g) => g.toLowerCase().includes(kw))
      );
    }

    if (filters.genres && filters.genres.length > 0) {
      result = result.filter((c) =>
        filters.genres!.some((g) => c.genres.includes(g))
      );
    }

    if (filters.platforms && filters.platforms.length > 0) {
      result = result.filter((c) =>
        filters.platforms!.some(
          (p) =>
            c.genres.some((g) => g.toLowerCase().includes(p.toLowerCase())) ||
            c.skills.some((s) => s.toLowerCase().includes(p.toLowerCase()))
        )
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
        result.sort(
          (a, b) =>
            minPrice(a.service_packages) - minPrice(b.service_packages)
        );
        break;
      case "price_high":
        result.sort(
          (a, b) =>
            minPrice(b.service_packages) - minPrice(a.service_packages)
        );
        break;
    }

    return result;
  }, [filters, creators]);

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-10">
      {/* Page Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-[2.5rem]">
            クリエイターを探す
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            プロフィール・実績・料金からあなたに合うクリエイターを見つける。
            <span className="hidden sm:inline">
              {" "}
              作品サムネで探すなら{" "}
              <Link
                href="/portfolios"
                className="font-bold text-primary-600 underline underline-offset-4 hover:text-primary-700"
              >
                ポートフォリオを見る →
              </Link>
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex items-center gap-2 rounded-pill border border-ink/20 bg-white px-4 py-2.5 text-sm font-bold text-ink lg:hidden"
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
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-paper p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-ink">絞り込み</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-pill bg-paper-deep text-ink-muted"
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
                onFilterChange={setFilters}
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
            <ul className="space-y-4">
              {filteredCreators.map((c) => (
                <li key={c.id}>
                  <CreatorRow creator={c} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-20 text-center">
              <svg
                className="mx-auto h-16 w-16 text-ink/20"
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
              <h3 className="mt-6 text-xl font-black text-ink">
                該当するクリエイターが見つかりませんでした
              </h3>
              <p className="mt-2 text-sm text-ink-muted">
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

function minPrice(pkgs: CreatorWithRelations["service_packages"]) {
  const prices = pkgs.filter((p) => p.is_active).map((p) => p.price);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}
function maxPrice(pkgs: CreatorWithRelations["service_packages"]) {
  const prices = pkgs.filter((p) => p.is_active).map((p) => p.price);
  return prices.length ? Math.max(...prices) : 0;
}

function formatPriceRange(pkgs: CreatorWithRelations["service_packages"]) {
  const min = minPrice(pkgs);
  const max = maxPrice(pkgs);
  if (!isFinite(min) || max === 0) return null;
  if (min === max) return `¥${min.toLocaleString()}`;
  return `¥${min.toLocaleString()} 〜 ¥${max.toLocaleString()}`;
}

function CreatorRow({ creator }: { creator: CreatorWithRelations }) {
  const { profiles } = creator;
  const priceRange = formatPriceRange(creator.service_packages);
  const thumbs = creator.portfolio_items
    .filter((p) => p.thumbnail_url)
    .slice(0, 4);

  return (
    <Link
      href={`/creators/${creator.id}`}
      className="group block rounded-xl border border-ink/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-card sm:p-6"
    >
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* 左: アバター */}
        <div className="col-span-2 sm:col-span-1">
          <div className="relative aspect-square overflow-hidden rounded-pill bg-paper-deep">
            {profiles.avatar_url ? (
              <Image
                src={profiles.avatar_url}
                alt={profiles.display_name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary-100 text-lg font-black text-primary-600">
                {profiles.display_name[0]}
              </div>
            )}
          </div>
        </div>

        {/* 中央: 名前・bio・タグ */}
        <div className="col-span-10 min-w-0 sm:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-ink sm:text-lg">
              {profiles.display_name}
            </h3>
            {profiles.is_verified && (
              <span className="inline-flex items-center gap-0.5 rounded-pill bg-primary-50 px-2 py-0.5 text-[10px] font-black text-primary-600">
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                認証済み
              </span>
            )}
            {creator.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-muted">
                <span className="text-accent-500">★</span>
                {creator.rating.toFixed(1)}
                {creator.review_count > 0 && (
                  <span className="text-ink-soft">
                    ({creator.review_count})
                  </span>
                )}
              </span>
            )}
            {creator.years_of_experience > 0 && (
              <span className="chip-outline">
                経験 {creator.years_of_experience} 年
              </span>
            )}
            {creator.location && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>
                {creator.location}
              </span>
            )}
          </div>

          {creator.bio && (
            <p className="mt-2 line-clamp-2 text-sm leading-[1.85] text-ink-muted">
              {creator.bio}
            </p>
          )}

          {/* タグ */}
          {(creator.genres.length > 0 || creator.skills.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {creator.genres.slice(0, 4).map((g) => (
                <span key={`g-${g}`} className="chip">
                  {g}
                </span>
              ))}
              {creator.skills.slice(0, 4).map((s) => (
                <span key={`s-${s}`} className="chip-outline">
                  {s}
                </span>
              ))}
              {creator.skills.length + creator.genres.length > 8 && (
                <span className="text-xs text-ink-soft">
                  +{creator.skills.length + creator.genres.length - 8}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 右: 料金 + サムネ + CTA */}
        <div className="col-span-12 sm:col-span-4">
          <div className="flex h-full flex-col justify-between gap-3">
            <div className="text-right">
              <p className="text-[11px] font-bold tracking-wider text-ink-soft">
                料金
              </p>
              <p className="mt-1 text-base font-black text-primary-600 sm:text-lg">
                {priceRange ?? "—"}
              </p>
            </div>

            {thumbs.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5">
                {thumbs.map((t) => (
                  <div
                    key={t.id}
                    className="relative aspect-video overflow-hidden rounded-md bg-paper-deep"
                  >
                    {t.thumbnail_url && (
                      <Image
                        src={t.thumbnail_url}
                        alt={t.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-50 px-4 py-1.5 text-xs font-bold text-primary-600 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                プロフィールを見る
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
