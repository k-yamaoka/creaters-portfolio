"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchTopBar } from "@/components/creators/search-filters";
// 2026-06-19 Section 6: Material Symbols (MIcon) は lucide-react に統一。
// OS 絵文字相当の MIcon も含めて廃止し、ライン系で一貫した質感に揃える。
import { Star, Sparkles, Heart, BadgeCheck, Video } from "lucide-react";
import { LikeButton } from "@/components/portfolio/like-button";
import { FullscreenVideoModal } from "@/components/portfolio/fullscreen-video-modal";
import {
  HeroFullscreen,
  type FullscreenVideoSource,
} from "@/components/home/hero-fullscreen";
import type { CreatorWithRelations } from "@/lib/supabase/queries";
import type { CreatorSearchFilters } from "@/types/database";
import { useInViewport } from "@/hooks/use-in-viewport";
import { derivePosterUrl } from "@/lib/video-poster";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";

export function CreatorsPageClient({
  creators,
  viewerRole,
  viewerCreatorId,
  likedIds = [],
  isAuthed = false,
  heroVideos = [],
}: {
  creators: CreatorWithRelations[];
  viewerRole?: "creator" | "client" | "admin" | null;
  viewerCreatorId?: string | null;
  likedIds?: string[];
  isAuthed?: boolean;
  /** ページ最上部の HeroFullscreen 背景動画 (空のとき Hero 非表示) */
  heroVideos?: FullscreenVideoSource[];
}) {
  const likedIdSet = useMemo(() => new Set(likedIds), [likedIds]);
  const isCreatorViewer = viewerRole === "creator";
  const [filters, setFilters] = useState<CreatorSearchFilters>({
    sortBy: "recommended",
  });
  // 2026-06-22 リスト/グリッド切替。既定はリスト (= 横長カード)。
  const [isGridView, setIsGridView] = useState(false);

  // 2026-06-24 クリック時に開くフルスクリーン動画プレビュー。
  // 代表作 (is_featured または mp4 を持つ先頭作品) を再生する。
  const [previewCreator, setPreviewCreator] = useState<CreatorWithRelations | null>(null);
  const previewWork = useMemo(() => {
    if (!previewCreator) return null;
    const hasMp4 = (p: CreatorWithRelations["portfolio_items"][number]) =>
      p.media_type === "video" &&
      !!p.video_url &&
      /\.mp4(\?|$)/i.test(p.video_url);
    return (
      previewCreator.portfolio_items.find((p) => p.is_featured && hasMp4(p)) ??
      previewCreator.portfolio_items.find(hasMp4) ??
      null
    );
  }, [previewCreator]);

  const handleOpenPreview = useCallback(
    (creator: CreatorWithRelations, e: React.MouseEvent) => {
      // Cmd/Ctrl/middle click は通常の Link 挙動 (新規タブで詳細ページ) を維持
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      // 代表作 mp4 が無いクリエイターは通常リンク (詳細ページに遷移)
      const hasMp4 = creator.portfolio_items.some(
        (p) =>
          p.media_type === "video" &&
          !!p.video_url &&
          /\.mp4(\?|$)/i.test(p.video_url)
      );
      if (!hasMp4) return;
      e.preventDefault();
      setPreviewCreator(creator);
    },
    []
  );

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

    // 2026-06-22 単一ジャンル (dropdown)
    if (filters.genre) {
      result = result.filter((c) => c.genres.includes(filters.genre!));
    }

    // 2026-06-22 予算帯フィルタ (5 万円 / 10 万円バケット)
    if (filters.budgetTier && filters.budgetTier !== "all") {
      result = result.filter((c) => {
        const a = c.minimum_order_amount;
        if (a == null) return false; // 応相談は除外
        switch (filters.budgetTier) {
          case "u50k":
            return a < 50000;
          case "50k_100k":
            return a >= 50000 && a < 100000;
          case "o100k":
            return a >= 100000;
        }
      });
    }

    // 2026-06-22 「すぐに対応可能」トグル — availability_status が 'available'
    // ないし null (未設定 = 受付中とみなさない) の判定
    if (filters.availableNow) {
      result = result.filter(
        (c) =>
          c.availability_status === "available" ||
          c.availability_status === "open" ||
          c.availability_status === "free"
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
      case "price_high": {
        // 価格未設定 (= 応相談) は方向によらず常に末尾に固める
        const dir = filters.sortBy === "price_low" ? 1 : -1;
        result.sort((a, b) => {
          // 最低受注金額 (minimum_order_amount) で並び替え。未設定は末尾固定。
          const pa = a.minimum_order_amount ?? Number.POSITIVE_INFINITY;
          const pb = b.minimum_order_amount ?? Number.POSITIVE_INFINITY;
          const ai = !isFinite(pa);
          const bi = !isFinite(pb);
          if (ai && bi) return 0;
          if (ai) return 1;
          if (bi) return -1;
          return (pa - pb) * dir;
        });
        break;
      }
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
      {/* 2026-06-24: ページ最上部に TOP と同じ HeroFullscreen を配置。
          18 本シャッフルで連続再生 + テキストオーバーレイ (Choose your specialist) */}
      {heroVideos.length > 0 && (
        <HeroFullscreen videos={heroVideos}>
          <div className="mt-auto pb-20 pt-32 sm:pb-28 lg:pb-32">
            <div className="max-w-xl lg:max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-pill border border-paper/20 bg-paper/[0.04] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-paper/75 backdrop-blur-sm">
                (Creators) ／ クリエイター
              </p>
              <h1 className="headline-display mt-6 text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.05] text-paper">
                Choose your{" "}
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text italic text-transparent">
                  specialist.
                </span>
              </h1>
              <p className="body-jp mt-6 max-w-prose-jp text-sm text-paper/85 sm:text-base">
                Sora・Veo・Runway・Seedance を使いこなす AI クリエイターを、
                ツール・ジャンル・料金で検索。気になるカードをクリックすると
                代表作が大画面で再生されます。
              </p>
              <span className="mt-10 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/55">
                <span aria-hidden>▾</span>
                <span>(Scroll to browse creators)</span>
              </span>
            </div>
          </div>
        </HeroFullscreen>
      )}

      <div className="mx-auto max-w-container px-6 pb-10 pt-6 lg:px-10">
        {/* クリエイター本人向け案内 — search bar 直上に密着させ、Hero との余白を埋める */}
        {isCreatorViewer && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1.5 text-xs font-bold text-neon-cyan-soft">
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

      {/* 2026-06-22 サイドバーを撤去し、検索バー横にフィルタを集約 */}
      <SearchTopBar
        filters={filters}
        onFilterChange={setFilters}
        resultCount={visibleCreators.length}
        isGridView={isGridView}
        onViewToggle={setIsGridView}
      />

      <div className="min-w-0">
        {visibleCreators.length > 0 ? (
          isGridView ? (
            // === グリッド表示: サムネ大 + 下部にコンパクトプロフィール ===
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCreators.map((c, i) => (
                <RevealOnScroll
                  key={c.id}
                  as="li"
                  delay={Math.min(i, 8) * 60}
                >
                  <CreatorGridCard
                    creator={c}
                    likedIds={likedIdSet}
                    isAuthed={isAuthed}
                    onPreviewClick={handleOpenPreview}
                  />
                </RevealOnScroll>
              ))}
            </ul>
          ) : (
            // === リスト表示: 横長カード ===
            <ul className="space-y-4">
              {visibleCreators.map((c, i) => (
                <RevealOnScroll
                  key={c.id}
                  as="li"
                  delay={Math.min(i, 8) * 60}
                >
                  <CreatorRow
                    creator={c}
                    likedIds={likedIdSet}
                    isAuthed={isAuthed}
                    onPreviewClick={handleOpenPreview}
                  />
                </RevealOnScroll>
              ))}
            </ul>
          )
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

      {/* === フルスクリーン動画プレビュー (代表作 mp4) === */}
      {previewCreator && previewWork && previewWork.video_url && (
        <FullscreenVideoModal
          videoUrl={previewWork.video_url}
          posterUrl={previewWork.thumbnail_url ?? previewWork.image_url}
          title={previewWork.title || previewCreator.profiles.display_name}
          creatorName={previewCreator.profiles.display_name}
          creatorHref={`/creators/${previewCreator.id}`}
          likeCount={previewWork.like_count}
          onClose={() => setPreviewCreator(null)}
        />
      )}
    </>
  );
}

/** 最低受注金額を「¥xx,xxx〜」形式でフォーマット。未設定なら null */
function formatMinAmount(amount: number | null | undefined): string | null {
  if (amount == null || isNaN(amount)) return null;
  return `¥${amount.toLocaleString()}〜`;
}

function CreatorRow({
  creator,
  likedIds,
  isAuthed = false,
  onPreviewClick,
}: {
  creator: CreatorWithRelations;
  likedIds?: Set<string>;
  isAuthed?: boolean;
  /** クリック時にフルスクリーン動画プレビューを開く。代表作 mp4 が無ければ
   *  通常の Link 挙動 (詳細ページ遷移) にフォールバック (親側で判定) */
  onPreviewClick?: (creator: CreatorWithRelations, e: React.MouseEvent) => void;
}) {
  const { profiles } = creator;
  const unitPrice = formatMinAmount(creator.minimum_order_amount);

  // ポートフォリオごとの いいね delta — LikeButton から子→親に通知され、
  // 総いいね数を即時 (= ページ再読み込みなしで) 反映する。
  const [likeDeltas, setLikeDeltas] = useState<Record<string, number>>({});
  const applyLikeDelta = useCallback((itemId: string, delta: number) => {
    setLikeDeltas((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + delta,
    }));
  }, []);

  // 総いいね数 = portfolio_items の like_count 合計 + ローカル delta
  const totalLikes = creator.portfolio_items.reduce(
    (sum, p) => sum + (p.like_count ?? 0) + (likeDeltas[p.id] ?? 0),
    0
  );
  // ティア判定
  const tier: "gold" | "silver" | "normal" =
    totalLikes >= 100 ? "gold" : totalLikes >= 50 ? "silver" : "normal";
  // tier 別のボーダーカラーは保持しつつ、影は柔らかい中性カラーに統一。
  // 派手な neon 色グロウだとサイト全体の白基調から浮くため、
  // 共通の "soft long shadow" + わずかな border 強調だけにする。
  const tierRing =
    tier === "gold"
      ? "border-neon-sunset/60 hover:border-neon-sunset/80"
      : tier === "silver"
        ? "border-neon-cyan/40 hover:border-neon-cyan/60"
        : "border-ink/10 hover:border-ink/25";
  const tierBg =
    tier === "gold"
      ? "bg-neon-sunset/[0.07]"
      : tier === "silver"
        ? "bg-neon-cyan/[0.05]"
        : "bg-ink/[0.03]";
  // クリエイターが「お気に入り表示」フラグを付けた作品を最大4件。
  // is_featured カラム未マイグレーションでも壊れないよう optional 扱い。
  // thumbnail_url が無くても video_url があれば ThumbnailCard 側で first frame /
  // Cloudinary poster を出せるので、video_url 単独でも表示対象に含める。
  const hasVisual = (p: CreatorWithRelations["portfolio_items"][0]) =>
    !!p.thumbnail_url || !!p.video_url;
  const featured = creator.portfolio_items.filter(
    (p) => p.is_featured === true && hasVisual(p)
  );
  const thumbs = (featured.length > 0
    ? featured
    : creator.portfolio_items.filter(hasVisual)
  ).slice(0, 4);

  return (
    <Link
      href={`/creators/${creator.id}`}
      onClick={(e) => onPreviewClick?.(creator, e)}
      className={`group relative block overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.08)] ${tierBg} ${tierRing}`}
    >
      {/* 人気クリエイターバッジ (gold/silver のみ) — 左上に表示、認証リボンの逆側 */}
      {tier !== "normal" && (
        <span
          className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[10px] font-black text-white shadow-sm ${
            tier === "gold"
              ? "bg-gradient-to-r from-neon-sunset to-neon-pink"
              : "bg-gradient-to-r from-neon-cyan to-neon-purple"
          }`}
        >
          {tier === "gold" ? (
            <Star size={12} strokeWidth={1.8} fill="currentColor" aria-hidden />
          ) : (
            <Sparkles size={12} strokeWidth={1.8} fill="currentColor" aria-hidden />
          )}
          {tier === "gold" ? "人気" : "注目"}
          <Heart size={12} strokeWidth={1.8} fill="currentColor" aria-hidden />
          {totalLikes}
        </span>
      )}
      {/* 認証済みリボン (右上ナナメ折り込み、オレンジ) */}
      {profiles.is_verified && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-1 -top-1 z-10 h-[110px] w-[110px] overflow-hidden"
        >
          {/* ナナメ折り込みリボン本体 */}
          <div className="absolute right-[-44px] top-[18px] w-[170px] rotate-45 bg-gradient-to-r from-neon-sunset via-neon-pink to-neon-sunset py-1 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_4px_12px_rgba(255,174,59,0.55)]">
            <BadgeCheck size={12} strokeWidth={1.8} fill="currentColor" className="-mt-0.5 inline-block" aria-hidden /> 認証済
          </div>
          {/* リボン下部の折り影 */}
          <div className="absolute right-0 top-[60px] h-3 w-2 rotate-45 bg-neon-sunset/80" />
        </div>
      )}
      <span className="sr-only">
        {profiles.is_verified ? "認証済みクリエイター" : ""}
      </span>

      {/* === 情報行 === */}
      <div className="grid grid-cols-12 gap-4 p-5 sm:gap-6 sm:p-6">
        {/* 左: アバター (大型化) */}
        <div className="col-span-3 sm:col-span-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-ink/15 bg-ink/5">
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
            <h3 className="text-lg font-black text-ink sm:text-xl">
              {profiles.display_name}
            </h3>
            {/* いいね: 0 件のときだけ "♥0"、他者が押した後は数字を隠して ♥ のみ */}
            <span
              className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-bold text-ink ${
                tier === "gold"
                  ? "bg-neon-sunset/25 text-neon-sunset"
                  : totalLikes > 0
                    ? "bg-ink/10"
                    : "bg-ink/[0.04] text-ink/65"
              }`}
            >
              <Heart
                size={12}
                strokeWidth={1.8}
                fill="currentColor"
                className="text-neon-pink"
                aria-hidden
              />
              {totalLikes === 0 && <span>0</span>}
            </span>
            {/* 作品数のみ表示 (経験年数バッジと作品を見る CTA は撤去) */}
            <span className="inline-flex items-center gap-1 rounded-pill border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-0.5 text-[11px] font-bold text-neon-cyan">
              <Video size={12} strokeWidth={1.8} aria-hidden />
              作品 {creator.portfolio_items.length} 件
            </span>
          </div>

          {creator.bio && (
            <p className="mt-2 line-clamp-2 text-sm leading-[1.75] text-ink/70">
              {creator.bio}
            </p>
          )}

          {/* 強み (強調表示) */}
          {creator.strengths.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {creator.strengths.slice(0, 2).map((s) => (
                <span
                  key={`st-${s}`}
                  className="inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-neon-pink/15 to-neon-purple/15 px-3 py-1 text-[11px] font-bold text-ink"
                >
                  <Sparkles size={12} strokeWidth={1.8} fill="currentColor" aria-hidden /> {s}
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

        {/* 右: 最低対応金額 (上下中央寄せ、認証リボンと被らないよう mt-8 確保) */}
        <div className="col-span-12 flex items-center justify-end sm:col-span-3 sm:mt-8">
          <div className="rounded-2xl border border-neon-pink/30 bg-neon-pink/5 px-5 py-4 text-right backdrop-blur-sm">
            <p className="text-[10px] font-bold tracking-wider text-ink/55">
              最低対応金額
            </p>
            <p className="mt-1 text-xl font-black text-neon-pink sm:text-2xl">
              {unitPrice ?? "応相談"}
            </p>
          </div>
        </div>
      </div>

      {/* === サムネイル行 (ホバー再生対応) === */}
      {/* 2026-06-17: 旧 bg-ink/40 (暗グレー帯) を白基調に統一。
          サムネ間のすき間を取って各タイルを「白カード上で浮く写真」風に演出。 */}
      {thumbs.length > 0 && (
        <div className="grid grid-cols-2 gap-2 border-t border-gray-100 bg-paper p-2 sm:grid-cols-4 sm:gap-3 sm:p-3">
          {thumbs.map((t) => (
            <ThumbnailCard
              key={t.id}
              item={t}
              liked={likedIds?.has(t.id) ?? false}
              isAuthed={isAuthed}
              onLikeChange={(delta) => applyLikeDelta(t.id, delta)}
            />
          ))}
        </div>
      )}
    </Link>
  );
}

/**
 * 個別のサムネタイル。
 * - **タイル自身**にホバーすると scale-110 + z-30 で前面に拡大
 * - MP4 はホバー時に自動再生(ループ・無音)
 * - z-index で周囲のテキストより手前にせり出す
 */
function ThumbnailCard({
  item,
  liked = false,
  isAuthed = false,
  onLikeChange,
}: {
  item: CreatorWithRelations["portfolio_items"][0];
  liked?: boolean;
  isAuthed?: boolean;
  /** いいね数の delta を親 (CreatorRow) に伝搬 */
  onLikeChange?: (delta: number) => void;
}) {
  const [hover, setHover] = useState(false);
  const [broken, setBroken] = useState(false);
  const { ref: rootRef, inView } = useInViewport<HTMLDivElement>("300px");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isMp4 = item.video_platform === "mp4" && !!item.video_url;
  const aspect = item.aspect_ratio;
  const objectFit = aspect === "vertical" ? "object-contain" : "object-cover";
  // Cloudinary 由来の動画は拡張子 .jpg で first frame を即取得できる
  const posterUrl = derivePosterUrl(item.video_url);
  const shouldRenderVideo = isMp4 && inView;

  // hover state と動画再生を同期 (video が mount された時のみ意味を持つ)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !shouldRenderVideo) return;
    if (hover) {
      v.currentTime = 0;
      void v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hover, shouldRenderVideo]);

  // サムネ画像が読み込めない場合はタイル自体を非表示にする
  if (broken) return null;

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={`group/tile relative aspect-video overflow-hidden rounded-lg border border-gray-100 bg-paper shadow-sm transition-all duration-300 ease-out ${
        hover
          ? "z-30 scale-[1.08] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.18)]"
          : "z-0"
      }`}
    >
      {/* 静止サムネ (thumbnail_url が存在する場合)。読み込み失敗時はタイル全体を非表示。 */}
      {item.thumbnail_url && (
        <Image
          src={item.thumbnail_url}
          alt={item.title}
          fill
          className={`${objectFit} transition-transform duration-300`}
          sizes="(max-width: 640px) 50vw, 25vw"
          onError={() => setBroken(true)}
        />
      )}

      {/* Cloudinary poster — video が mount される前から first frame を出す
          (next/image は CDN allowlist が必要なので素の <img> を使う) */}
      {!item.thumbnail_url && posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt={item.title}
          className={`absolute inset-0 h-full w-full ${objectFit}`}
          loading="lazy"
        />
      )}

      {/* MP4 動画 — viewport に入ったタイミングで mount し、初期表示を軽くする */}
      {shouldRenderVideo && (
        <video
          ref={videoRef}
          src={item.video_url ?? undefined}
          poster={posterUrl ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          // onLoadedMetadata で 0.001s にシークして first frame を強制描画
          // (Firefox/Safari は preload=metadata だけでは何も表示しないため)
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            try {
              v.currentTime = 0.001;
            } catch {
              // ignore
            }
          }}
          className={`absolute inset-0 h-full w-full ${objectFit} transition-opacity duration-300 ${
            item.thumbnail_url || posterUrl
              ? hover
                ? "opacity-100"
                : "opacity-0"
              : "opacity-100"
          }`}
        />
      )}

      {/* いいねボタン — 右上 (評価スコアと連動) */}
      <div className="absolute right-1.5 top-1.5 z-10">
        <LikeButton
          portfolioItemId={item.id}
          initialLiked={liked}
          initialCount={item.like_count}
          isAuthed={isAuthed}
          variant="overlay"
          onLikeChange={onLikeChange}
        />
      </div>
    </div>
  );
}

/* =============================================================
 *  CreatorGridCard — Pinterest 風 グリッドビュー用 コンパクトカード
 *  サムネを大きく見せて、クリエイター情報を下部にコンパクトに添える。
 * ============================================================= */
function CreatorGridCard({
  creator,
  likedIds: _likedIds,
  isAuthed: _isAuthed,
  onPreviewClick,
}: {
  creator: CreatorWithRelations;
  likedIds?: Set<string>;
  isAuthed?: boolean;
  onPreviewClick?: (creator: CreatorWithRelations, e: React.MouseEvent) => void;
}) {
  void _likedIds;
  void _isAuthed;
  const { profiles } = creator;
  const unitPrice = formatMinAmount(creator.minimum_order_amount);

  // 代表サムネ 1 枚 (featured 優先、なければ最初の作品)
  const hasVisual = (p: CreatorWithRelations["portfolio_items"][0]) =>
    !!p.thumbnail_url || !!p.video_url;
  const featured = creator.portfolio_items.filter(
    (p) => p.is_featured === true && hasVisual(p)
  );
  const cover =
    featured[0] ?? creator.portfolio_items.filter(hasVisual)[0] ?? null;

  const totalLikes = creator.portfolio_items.reduce(
    (sum, p) => sum + (p.like_count ?? 0),
    0
  );

  return (
    <Link
      href={`/creators/${creator.id}`}
      onClick={(e) => onPreviewClick?.(creator, e)}
      className="group relative block overflow-hidden rounded-2xl border border-ink/10 bg-paper transition-all duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:border-ink/25 hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.08)]"
    >
      {/* === サムネ (大) === */}
      <div className="relative aspect-video w-full overflow-hidden bg-ink/[0.04]">
        {cover?.thumbnail_url ? (
          <Image
            src={cover.thumbnail_url}
            alt={cover.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink/40">
            作品準備中
          </div>
        )}
        {profiles.is_verified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-pill bg-paper/95 px-2 py-1 text-[10px] font-bold text-ink shadow-sm">
            <BadgeCheck
              size={10}
              strokeWidth={1.8}
              fill="currentColor"
              aria-hidden
              className="text-neon-sunset"
            />
            認証
          </span>
        )}
      </div>

      {/* === プロフィール (コンパクト) === */}
      <div className="flex items-start gap-3 p-4">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-ink/10 bg-ink/[0.04]">
          {profiles.avatar_url ? (
            <Image
              src={profiles.avatar_url}
              alt={profiles.display_name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-pink to-neon-purple text-xs font-bold text-white">
              {profiles.display_name[0]}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-ink">
            {profiles.display_name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/55">
            <Heart
              size={11}
              strokeWidth={1.8}
              fill="currentColor"
              className="text-neon-pink"
              aria-hidden
            />
            {totalLikes}
            <span className="mx-1 text-ink/25">·</span>
            作品 {creator.portfolio_items.length} 件
          </p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block text-[9px] tracking-wider text-ink/45">
            最低対応
          </span>
          <span className="text-xs font-bold text-neon-pink">
            {unitPrice ?? "応相談"}
          </span>
        </span>
      </div>
    </Link>
  );
}
