"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { PortfolioFiltersSidebar } from "@/components/portfolios/portfolio-filters-sidebar";
import { WorkCard } from "@/components/portfolios/work-card";
import {
  VideoModal,
  type VideoModalCreator,
  type VideoModalItem,
} from "@/components/portfolio/video-modal";
import {
  applyPortfolioFilters,
  flattenCreatorsToWorks,
  readFiltersFromQuery,
  writeFiltersToQuery,
  type WorkEntry,
} from "@/lib/portfolio-search";
import type { CreatorWithRelations } from "@/lib/supabase/queries";
import type { PortfolioSearchFilters } from "@/types/database";

const PAGE_SIZE = 24;

const SORT_OPTIONS: {
  value: NonNullable<PortfolioSearchFilters["sortBy"]>;
  label: string;
}[] = [
  { value: "recommended", label: "おすすめ" },
  { value: "newest", label: "新着" },
  { value: "rating", label: "評価が高い順" },
  { value: "price_low", label: "金額が安い順" },
  { value: "price_high", label: "金額が高い順" },
];

export function PortfoliosPageClient({
  creators,
  likedIds = [],
  isAuthed = false,
}: {
  creators: CreatorWithRelations[];
  likedIds?: string[];
  isAuthed?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const likedIdSet = useMemo(() => new Set(likedIds), [likedIds]);

  // URL クエリ → フィルター state (single source of truth は URL)
  const filters: PortfolioSearchFilters = useMemo(
    () => readFiltersFromQuery(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  // keyword は input 直結 (タイプ中に毎キーで URL を書くと重いので debounce)
  const [keywordDraft, setKeywordDraft] = useState(filters.keyword ?? "");
  useEffect(() => {
    setKeywordDraft(filters.keyword ?? "");
  }, [filters.keyword]);

  const replaceFilters = useCallback(
    (next: PortfolioSearchFilters) => {
      const q = writeFiltersToQuery(next);
      const qs = q.toString();
      router.replace(`/portfolios${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router]
  );

  // keyword は 300ms debounce で URL に反映
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.keyword ?? "") === keywordDraft) return;
      replaceFilters({
        ...filters,
        keyword: keywordDraft || undefined,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [keywordDraft, filters, replaceFilters]);

  // 作品リスト + フィルター適用
  const allWorks = useMemo(() => flattenCreatorsToWorks(creators), [creators]);
  const filteredWorks = useMemo(
    () => applyPortfolioFilters(allWorks, filters),
    [allWorks, filters]
  );

  // ページネーション (24 件ずつ表示)
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [filters]);
  const visibleWorks = useMemo(
    () => filteredWorks.slice(0, page * PAGE_SIZE),
    [filteredWorks, page]
  );
  const canLoadMore = visibleWorks.length < filteredWorks.length;

  // モーダル
  const [modalWork, setModalWork] = useState<WorkEntry | null>(null);
  const modalItem: VideoModalItem | null = modalWork
    ? {
        id: modalWork.id,
        title: modalWork.title,
        description: modalWork.description,
        media_type: modalWork.media_type,
        video_url: modalWork.video_url,
        video_platform: modalWork.video_platform,
        image_url: modalWork.image_url,
        thumbnail_url: modalWork.thumbnail_url,
        aspect_ratio: modalWork.aspect_ratio,
        like_count: modalWork.like_count,
        liked: likedIdSet.has(modalWork.id),
      }
    : null;
  const modalCreator: VideoModalCreator | null = modalWork
    ? {
        id: modalWork.creator_id,
        display_name: modalWork.creator_display_name,
        avatar_url: modalWork.creator_avatar_url,
      }
    : null;

  // モバイルドロワー
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-10">
      {/* ===== ヘッダ ===== */}
      <div className="mb-8">
        <p className="eyebrow-mono">(Works)</p>
        <h1 className="headline-display mt-4 text-[clamp(2rem,5vw,3.75rem)] text-ink">
          All <span className="italic text-sand">works.</span>
        </h1>
        <p className="body-jp mt-3 max-w-prose-jp text-sm text-ink/65">
          Sora・Veo・Runway を使いこなす AI クリエイターの作品一覧。
        </p>
      </div>

      {/* ===== トップツールバー (検索 + 並び順 + 件数) ===== */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* 検索バー */}
        <div className="relative flex-1">
          <Search
            size={16}
            strokeWidth={1.6}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/45"
            aria-hidden
          />
          <input
            type="search"
            value={keywordDraft}
            onChange={(e) => setKeywordDraft(e.target.value)}
            placeholder="作品名・タグ・クリエイター名で検索"
            aria-label="作品検索"
            className="w-full rounded-md border border-ink/15 bg-paper py-2.5 pl-9 pr-9 text-sm text-ink placeholder-ink/40 outline-none transition-colors focus:border-ink/45 focus:ring-1 focus:ring-ink/20"
          />
          {keywordDraft && (
            <button
              type="button"
              onClick={() => setKeywordDraft("")}
              aria-label="検索をクリア"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-ink/45 hover:bg-ink/5 hover:text-ink"
            >
              <X size={14} strokeWidth={1.8} aria-hidden />
            </button>
          )}
        </div>

        {/* 並び順 */}
        <div className="flex items-center gap-3">
          <label className="shrink-0 text-xs text-ink/65">並び順</label>
          <select
            value={filters.sortBy ?? "recommended"}
            onChange={(e) =>
              replaceFilters({
                ...filters,
                sortBy: e.target
                  .value as NonNullable<PortfolioSearchFilters["sortBy"]>,
              })
            }
            className="rounded-md border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/45 focus:ring-1 focus:ring-ink/20"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* 件数 */}
          <p className="hidden whitespace-nowrap text-sm text-ink/65 sm:block">
            <span className="font-medium text-ink">{filteredWorks.length}</span> 件
          </p>

          {/* モバイル: 絞り込みボタン */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-paper px-3 py-2.5 text-sm font-medium text-ink hover:border-ink/30 lg:hidden"
          >
            <SlidersHorizontal size={14} strokeWidth={1.6} aria-hidden />
            絞り込み
          </button>
        </div>
      </div>

      {/* ===== 2 カラム本体 ===== */}
      <div className="flex gap-8">
        {/* 左サイドバー (lg 以上) */}
        <div className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <PortfolioFiltersSidebar
              filters={filters}
              onChange={replaceFilters}
              totalCount={filteredWorks.length}
            />
          </div>
        </div>

        {/* 右グリッド */}
        <div className="min-w-0 flex-1">
          {filteredWorks.length === 0 ? (
            <EmptyState onReset={() => replaceFilters({ sortBy: filters.sortBy })} />
          ) : (
            <>
              {/* CSS columns Masonry — 各カードは aspect_ratio で原寸表示 */}
              <div className="columns-2 gap-3 md:columns-3 lg:columns-3 xl:columns-4">
                {visibleWorks.map((w) => (
                  <WorkCard
                    key={w.id}
                    work={w}
                    isLiked={likedIdSet.has(w.id)}
                    isAuthed={isAuthed}
                    onClick={setModalWork}
                  />
                ))}
              </div>

              {canLoadMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-axis-light"
                  >
                    もっと見る ({filteredWorks.length - visibleWorks.length} 件)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== モバイルドロワー (絞り込み) ===== */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-ink/15 bg-paper p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">絞り込み</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="閉じる"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-ink/70"
              >
                <X size={16} strokeWidth={2} aria-hidden />
              </button>
            </div>
            <PortfolioFiltersSidebar
              filters={filters}
              onChange={replaceFilters}
              totalCount={filteredWorks.length}
            />
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-axis-light mt-6 w-full"
            >
              {filteredWorks.length} 件を表示
            </button>
          </div>
        </div>
      )}

      {/* ===== モーダル ===== */}
      {modalWork && modalItem && modalCreator && (
        <VideoModal
          item={modalItem}
          creator={modalCreator}
          isAuthed={isAuthed}
          onClose={() => setModalWork(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-20 text-center">
      <Search
        size={56}
        strokeWidth={1}
        className="mx-auto text-ink/20"
        aria-hidden
      />
      <h3 className="mt-6 font-display text-xl font-medium text-ink">
        該当する作品が見つかりませんでした
      </h3>
      <p className="mt-2 text-sm text-ink/70">
        検索条件を変更して、もう一度お試しください
      </p>
      <button type="button" onClick={onReset} className="btn-axis-light mt-6">
        フィルターをクリア
      </button>
    </div>
  );
}
