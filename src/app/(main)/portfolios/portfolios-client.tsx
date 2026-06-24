"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { PortfolioFiltersBar } from "@/components/portfolios/portfolio-filters-bar";
import { WorkCard } from "@/components/portfolios/work-card";
import { FullscreenVideoModal } from "@/components/portfolio/fullscreen-video-modal";
import {
  HeroFullscreen,
  type FullscreenVideoSource,
} from "@/components/home/hero-fullscreen";
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
  heroVideos = [],
}: {
  creators: CreatorWithRelations[];
  likedIds?: string[];
  isAuthed?: boolean;
  /** ページ最上部の HeroFullscreen 背景動画 (空のとき Hero 非表示) */
  heroVideos?: FullscreenVideoSource[];
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

  // モーダル — クリック時にフルスクリーン動画モーダルを開く
  const [modalWork, setModalWork] = useState<WorkEntry | null>(null);

  return (
    <>
      {/* === 2026-06-24: ページ最上部に TOP と同じ HeroFullscreen を配置 ===
          18 本シャッフルで連続再生 + テキストオーバーレイ。ページタイトル
          (All works. / 制作実績) をフルスクリーン動画の上に重ねる。 */}
      {heroVideos.length > 0 && (
        <HeroFullscreen videos={heroVideos}>
          <div className="mt-auto pb-20 pt-32 sm:pb-28 lg:pb-32">
            <div className="max-w-xl lg:max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-pill border border-paper/20 bg-paper/[0.04] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-paper/75 backdrop-blur-sm">
                (Works) ／ 制作実績
              </p>
              <h1 className="headline-display mt-6 text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.05] text-paper">
                All{" "}
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text italic text-transparent">
                  works.
                </span>
              </h1>
              <p className="body-jp mt-6 max-w-prose-jp text-sm text-paper/85 sm:text-base">
                Sora・Veo・Runway を使いこなす AI クリエイターの作品一覧。
                気になった動画はクリックすると大画面でフルスクリーン再生されます。
              </p>
              <span className="mt-10 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/55">
                <span aria-hidden>▾</span>
                <span>(Scroll to browse works)</span>
              </span>
            </div>
          </div>
        </HeroFullscreen>
      )}

      {/* 2026-06-23: max-w-container → 撤去。コンテナを画面幅いっぱいに広げ、
          作品グリッドが全幅表示されるようにする。両端 px-gutter は維持。
          2026-06-24: Hero がページ上部に来たため py-10 → pt-12 で詰める */}
      <div className="px-6 pb-10 pt-12 lg:px-10">

      {/* ===== トップツールバー (検索 + 並び順 + 件数) ===== */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
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

        {/* 並び順 + 件数 */}
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

          <p className="hidden whitespace-nowrap text-sm text-ink/65 sm:block">
            <span className="font-medium text-ink">{filteredWorks.length}</span> 件
          </p>
        </div>
      </div>

      {/* ===== 上部展開型 絞り込みバー (旧 左サイドバー を置き換え) ===== */}
      <PortfolioFiltersBar
        filters={filters}
        onChange={replaceFilters}
        totalCount={filteredWorks.length}
      />

      {/* ===== 作品グリッド (画面幅いっぱい) ===== */}
      {filteredWorks.length === 0 ? (
        <EmptyState
          onReset={() => replaceFilters({ sortBy: filters.sortBy })}
        />
      ) : (
        <>
          {/* Justified Layout — flex-wrap + 1px gap + 行高さ揃え (Flickr 方式)
              各カードは aspect_ratio に比例した width / 固定 height で配置 */}
          <div className="flex flex-wrap gap-px bg-ink/[0.05]">
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

      {/* ===== フルスクリーン動画モーダル (TOP の HeroFullscreen と同じ体験) ===== */}
      {modalWork && modalWork.video_url && (
        <FullscreenVideoModal
          videoUrl={modalWork.video_url}
          posterUrl={modalWork.thumbnail_url ?? modalWork.image_url}
          title={modalWork.title}
          creatorName={modalWork.creator_display_name}
          creatorHref={`/creators/${modalWork.creator_id}`}
          likeCount={modalWork.like_count}
          onClose={() => setModalWork(null)}
        />
      )}
      </div>
    </>
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
