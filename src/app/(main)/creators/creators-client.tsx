"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchFilters, SearchTopBar } from "@/components/creators/search-filters";
import type { CreatorWithRelations } from "@/lib/supabase/queries";
import type { CreatorSearchFilters } from "@/types/database";

export function CreatorsPageClient({
  creators,
  viewerRole,
  viewerCreatorId,
}: {
  creators: CreatorWithRelations[];
  viewerRole?: "creator" | "client" | "admin" | null;
  viewerCreatorId?: string | null;
}) {
  const isCreatorViewer = viewerRole === "creator";
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

  // クリエイター本人が見るときは「他クリエイターを眺める」目的なので
  // 自分自身は一覧から除外する (= 自己案件の重複防止)
  const visibleCreators = useMemo(() => {
    if (!isCreatorViewer || !viewerCreatorId) return filteredCreators;
    return filteredCreators.filter((c) => c.id !== viewerCreatorId);
  }, [filteredCreators, isCreatorViewer, viewerCreatorId]);


  return (
    <>
      {/* Hero band */}
      <section className="relative overflow-hidden bg-neon-midnight-deep py-16 text-white">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(157,92,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(157,92,255,0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
        <div className="absolute -left-32 top-0 h-[320px] w-[320px] rounded-full bg-neon-pink opacity-25 blur-[100px]" />
        <div className="absolute -right-20 bottom-0 h-[280px] w-[280px] rounded-full bg-neon-cyan opacity-20 blur-[100px]" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <h1 className="text-[2rem] font-black leading-[1.2] sm:text-[3rem] lg:text-[3.5rem]">
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
              専門家
            </span>
            をツールから選ぶ。
          </h1>
          {isCreatorViewer && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1.5 text-xs font-bold text-neon-cyan-soft">
              <span aria-hidden>★</span>
              自分のプロフィールを編集する場合は
              <Link
                href="/dashboard/profile"
                className="text-neon-cyan underline underline-offset-4"
              >
                マイプロフィール →
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-container px-6 py-10 lg:px-10">
        {/* Mobile filter button */}
        <div className="mb-6 flex items-center justify-end">
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
        resultCount={visibleCreators.length}
      />

      <div className="flex gap-8">
        <div className="hidden lg:block">
          <SearchFilters
            filters={filters}
            onFilterChange={setFilters}
            resultCount={visibleCreators.length}
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
                resultCount={visibleCreators.length}
              />
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary mt-6 w-full"
              >
                {visibleCreators.length}件を表示
              </button>
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {visibleCreators.length > 0 ? (
            <ul className="space-y-4">
              {visibleCreators.map((c) => (
                <li key={c.id}>
                  <CreatorRow creator={c} isCreatorViewer={isCreatorViewer} />
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
    </>
  );
}

function minPrice(pkgs: CreatorWithRelations["service_packages"]) {
  const prices = pkgs.filter((p) => p.is_active).map((p) => p.price);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

/** 1本単価 (最低価格を1本あたりの基準価格として扱う) */
function formatUnitPrice(pkgs: CreatorWithRelations["service_packages"]) {
  const min = minPrice(pkgs);
  if (!isFinite(min)) return null;
  return `¥${min.toLocaleString()}〜`;
}

function CreatorRow({
  creator,
  isCreatorViewer,
}: {
  creator: CreatorWithRelations;
  isCreatorViewer?: boolean;
}) {
  const { profiles } = creator;
  const unitPrice = formatUnitPrice(creator.service_packages);
  // クリエイターが「お気に入り表示」フラグを付けた作品を最大4件。
  // is_featured カラム未マイグレーションでも壊れないよう optional 扱い。
  const featured = creator.portfolio_items.filter(
    (p) => p.is_featured === true && p.thumbnail_url
  );
  const thumbs = (featured.length > 0
    ? featured
    : creator.portfolio_items.filter((p) => p.thumbnail_url)
  ).slice(0, 4);

  return (
    <Link
      href={`/creators/${creator.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-neon-pink/40 hover:shadow-[0_25px_60px_-15px_rgba(255,77,157,0.4)]"
    >
      {/* 認証済みバッジ (オレンジ、絶対配置 右上) */}
      {profiles.is_verified && (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-neon-sunset to-neon-pink px-2.5 py-1 text-[10px] font-black text-white shadow-[0_0_12px_rgba(255,174,59,0.6)]">
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          認証済み
        </span>
      )}

      {/* === 情報行 === */}
      <div className="grid grid-cols-12 gap-4 p-5 sm:gap-6 sm:p-6">
        {/* 左: アバター (大型化) */}
        <div className="col-span-3 sm:col-span-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/15 bg-neon-midnight">
            {profiles.avatar_url ? (
              <Image
                src={profiles.avatar_url}
                alt={profiles.display_name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-pink to-neon-purple text-4xl font-black text-white sm:text-5xl">
                {profiles.display_name[0]}
              </div>
            )}
          </div>
        </div>

        {/* 中央: 名前・bio・タグ */}
        <div className="col-span-9 min-w-0 sm:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-white sm:text-xl">
              {profiles.display_name}
            </h3>
            {creator.review_count > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-pill bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white">
                <span className="text-neon-pink">👍</span>
                {creator.review_count}
              </span>
            ) : (
              <span className="text-xs text-white/45">いいねまだなし</span>
            )}
            {creator.years_of_experience > 0 && (
              <span className="rounded-pill border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-white/75">
                経験 {creator.years_of_experience} 年
              </span>
            )}
          </div>

          {creator.bio && (
            <p className="mt-2 line-clamp-2 text-sm leading-[1.75] text-white/65">
              {creator.bio}
            </p>
          )}

          {/* 強み (強調表示) */}
          {creator.strengths.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {creator.strengths.slice(0, 2).map((s) => (
                <span
                  key={`st-${s}`}
                  className="inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-neon-pink/25 to-neon-purple/25 px-3 py-1 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(255,77,157,0.25)]"
                >
                  ✦ {s}
                </span>
              ))}
            </div>
          )}

          {/* 制作ジャンル */}
          {creator.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {creator.genres.slice(0, 4).map((g) => (
                <span
                  key={`g-${g}`}
                  className="rounded-pill border border-neon-purple/40 bg-neon-purple/10 px-2.5 py-0.5 text-[11px] font-bold text-neon-purple"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 右: 料金 + CTA */}
        <div className="col-span-12 flex flex-row items-center justify-between gap-3 sm:col-span-3 sm:flex-col sm:items-end sm:justify-start sm:gap-2">
          <div className="text-right">
            {isCreatorViewer ? (
              <>
                <p className="text-[11px] font-bold tracking-wider text-white/45">
                  公開作品
                </p>
                <p className="mt-1 text-base font-black text-neon-cyan sm:text-xl">
                  {creator.portfolio_items.length}
                  <span className="ml-1 text-xs font-bold text-white/45">件</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-bold tracking-wider text-white/45">
                  最低対応金額
                </p>
                <p className="mt-1 text-base font-black text-neon-pink sm:text-xl">
                  {unitPrice ?? "—"}
                </p>
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-1.5 text-xs font-bold text-white transition-all group-hover:shadow-[0_0_16px_rgba(255,77,157,0.5)]">
            {isCreatorViewer ? "作品を見る" : "プロフィール"}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>

      {/* === サムネイル行 (ホバー再生対応) === */}
      {thumbs.length > 0 && (
        <div className="grid grid-cols-2 gap-1 border-t border-white/10 bg-neon-midnight/40 p-1 sm:grid-cols-4">
          {thumbs.map((t) => (
            <ThumbnailCard key={t.id} item={t} />
          ))}
        </div>
      )}
    </Link>
  );
}

/**
 * 個別のサムネタイル。
 * - video_platform === 'mp4' のときカード hover で <video> を再生 (ループ・無音)
 * - それ以外は静止サムネを表示
 * - 右上にフォーマットバッジ
 */
function ThumbnailCard({
  item,
}: {
  item: CreatorWithRelations["portfolio_items"][0];
}) {
  const isMp4 = item.video_platform === "mp4" && !!item.video_url;
  const aspect = item.aspect_ratio;
  const formatLabel =
    aspect === "vertical"
      ? "縦型"
      : aspect === "square"
        ? "正方形"
        : "横型";
  const formatGradient =
    aspect === "vertical"
      ? "from-neon-pink to-neon-purple"
      : aspect === "square"
        ? "from-neon-cyan to-neon-purple"
        : "from-neon-cyan to-neon-pink";

  const objectFit = aspect === "vertical" ? "object-contain" : "object-cover";

  return (
    <div className="relative aspect-video overflow-hidden rounded-md bg-neon-midnight-deep">
      {/* 静止サムネ (常時表示) */}
      {item.thumbnail_url && (
        <Image
          src={item.thumbnail_url}
          alt={item.title}
          fill
          className={`${objectFit} transition-transform duration-300 group-hover:scale-105`}
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      )}

      {/* MP4 動画 (ホバー時にカード全体の group-hover で表示&再生) */}
      {isMp4 && (
        <video
          src={item.video_url ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          ref={(el) => {
            if (!el) return;
            // 親 Link の group-hover に同期して再生/停止
            const parent = el.closest<HTMLAnchorElement>("a.group");
            if (!parent) return;
            const onEnter = () => {
              el.currentTime = 0;
              void el.play().catch(() => {});
            };
            const onLeave = () => {
              el.pause();
              el.currentTime = 0;
            };
            parent.addEventListener("mouseenter", onEnter);
            parent.addEventListener("mouseleave", onLeave);
          }}
          className={`absolute inset-0 h-full w-full ${objectFit} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        />
      )}

      {/* フォーマット (アスペクト比) バッジ — 右上 */}
      <span
        className={`absolute right-1.5 top-1.5 rounded-full bg-gradient-to-r ${formatGradient} px-1.5 py-0.5 text-[9px] font-black text-white shadow-[0_0_8px_rgba(0,0,0,0.4)]`}
      >
        {formatLabel}
      </span>

      {/* タイトルオーバーレイ (hover時) */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-neon-midnight-deep via-neon-midnight-deep/40 to-transparent px-3 pb-2 pt-8 transition-transform duration-300 group-hover:translate-y-0">
        <p className="line-clamp-2 text-[11px] font-bold leading-snug text-white">
          {item.title}
        </p>
      </div>
    </div>
  );
}
