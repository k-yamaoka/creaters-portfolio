"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AiCreator } from "../_data/creators";

const ALL_TOOLS = [
  "Sora 2",
  "Veo 3",
  "Runway Gen-4",
  "Kling 2.x",
  "Midjourney",
  "ElevenLabs",
  "Suno",
  "Topaz",
  "After Effects",
  "Premiere",
  "DaVinci Resolve",
  "CapCut Pro",
  "Stable Diffusion",
  "Photoshop",
  "Live2D",
];

const ALL_GENRES = [
  "Meta広告",
  "TikTok",
  "Instagram Reels",
  "縦型動画",
  "EC商品PR",
  "Shopify向け",
  "アニメーション",
  "ブランドムービー",
  "コンセプト映像",
  "B2B",
  "プロダクトデモ",
  "MV",
  "採用動画",
  "キャラ広告",
];

const PRICE_RANGES = [
  { label: "すべて", min: 0, max: Infinity },
  { label: "〜5万", min: 0, max: 50000 },
  { label: "5〜15万", min: 50000, max: 150000 },
  { label: "15〜30万", min: 150000, max: 300000 },
  { label: "30万〜", min: 300000, max: Infinity },
];

export function CreatorsFilter({ creators }: { creators: AiCreator[] }) {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState<"recommended" | "price-asc" | "rating">(
    "recommended"
  );

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const filtered = useMemo(() => {
    let result = creators.filter((c) => {
      if (
        selectedTools.length > 0 &&
        !selectedTools.some((t) => c.tools.includes(t))
      ) {
        return false;
      }
      if (selectedGenre && !c.genres.includes(selectedGenre)) {
        return false;
      }
      const range = PRICE_RANGES[priceRange];
      if (c.priceFrom < range.min || c.priceFrom > range.max) {
        return false;
      }
      return true;
    });

    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.priceFrom - b.priceFrom);
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [creators, selectedTools, selectedGenre, priceRange, sortBy]);

  const clearAll = () => {
    setSelectedTools([]);
    setSelectedGenre(null);
    setPriceRange(0);
  };

  const hasFilters = selectedTools.length > 0 || selectedGenre || priceRange > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Sidebar filters */}
      <aside className="space-y-6">
        <div className="rounded-xl border-2 border-ink bg-white p-5 shadow-pop">
          <div className="flex items-baseline justify-between">
            <h3 className="text-base font-black text-ink">絞り込み</h3>
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-bold text-neon-purple-deep underline"
              >
                クリア
              </button>
            )}
          </div>

          {/* Tools */}
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              使用AIツール
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ALL_TOOLS.map((tool) => {
                const active = selectedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`rounded-pill border px-2.5 py-1 text-[11px] font-bold transition-all ${
                      active
                        ? "border-neon-pink bg-neon-pink text-white"
                        : "border-ink/15 bg-paper text-ink hover:border-ink/40"
                    }`}
                  >
                    {tool}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Genres */}
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              得意ジャンル
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ALL_GENRES.map((g) => {
                const active = selectedGenre === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGenre(active ? null : g)}
                    className={`rounded-pill border px-2.5 py-1 text-[11px] font-bold transition-all ${
                      active
                        ? "border-neon-purple bg-neon-purple text-white"
                        : "border-ink/15 bg-paper text-ink hover:border-ink/40"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price range */}
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              料金帯(開始価格)
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {PRICE_RANGES.map((r, i) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setPriceRange(i)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] font-bold transition-all ${
                    priceRange === i
                      ? "border-neon-cyan bg-neon-cyan/15 text-neon-purple-deep"
                      : "border-ink/15 bg-paper text-ink hover:border-ink/40"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Result list */}
      <div>
        <div className="mb-6 flex items-baseline justify-between">
          <p className="text-sm font-bold text-ink">
            <span className="text-2xl font-black text-neon-purple-deep">
              {filtered.length}
            </span>
            <span className="ml-1 text-ink-muted">名のクリエイター</span>
          </p>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as typeof sortBy)
            }
            className="rounded-md border border-ink/20 bg-white px-3 py-1.5 text-xs font-bold"
          >
            <option value="recommended">おすすめ順</option>
            <option value="price-asc">料金が安い順</option>
            <option value="rating">評価が高い順</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-ink/20 bg-white p-12 text-center">
            <p className="text-sm text-ink-muted">
              条件に合うクリエイターが見つかりませんでした
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 text-sm font-bold text-neon-purple-deep underline"
            >
              フィルターをクリア
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/ai-mock/creators/${c.id}`}
                className="group block overflow-hidden rounded-xl border-2 border-ink bg-white shadow-pop transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(42,42,50,1)]"
              >
                {/* Banner */}
                <div
                  className="relative aspect-[16/9] w-full"
                  style={{ background: c.avatar }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute right-3 top-3 flex gap-1">
                    <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-black text-neon-purple-deep">
                      AI
                    </span>
                    <span className="rounded-full bg-neon-midnight-deep/90 px-2 py-0.5 text-[10px] font-black text-white">
                      ★ {c.rating}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-lg font-black text-white">{c.name}</p>
                    <p className="text-[11px] font-bold text-white/80">
                      {c.handle} · {c.location}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <p className="line-clamp-2 text-sm font-bold text-ink">
                    {c.headline}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.tools.slice(0, 4).map((tool) => (
                      <span
                        key={tool}
                        className="rounded-full bg-neon-midnight-deep px-2 py-0.5 text-[10px] font-bold text-white"
                      >
                        {tool}
                      </span>
                    ))}
                    {c.tools.length > 4 && (
                      <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink-muted">
                        +{c.tools.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.genres.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2 py-0.5 text-[10px] font-bold text-neon-purple-deep"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-rule pt-4 text-center">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
                        from
                      </p>
                      <p className="mt-0.5 text-sm font-black text-neon-purple-deep">
                        ¥{(c.priceFrom / 10000).toFixed(0)}万〜
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
                        納期
                      </p>
                      <p className="mt-0.5 text-sm font-black text-ink">
                        {c.deliveryDays}日〜
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
                        実績
                      </p>
                      <p className="mt-0.5 text-sm font-black text-ink">
                        {c.works}件
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
