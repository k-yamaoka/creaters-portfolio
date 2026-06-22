"use client";

import { Search, LayoutGrid, List } from "lucide-react";
import { GENRES } from "@/lib/constants";
import type { CreatorSearchFilters } from "@/types/database";

/**
 * 2026-06-22 リファクタ:
 * - 旧 SearchFilters (左サイドバー) は撤去 (creators-client から呼出しを削除)
 * - SearchTopBar に「ジャンル / 予算 / すぐ対応 / リスト・グリッド切替」を集約
 *   ① 制作ジャンル: dropdown (単一選択)
 *   ② 予算: dropdown (〜5万 / 5万〜10万 / 10万〜 / すべて)
 *   ③ すぐに対応可能: trailing-toggle スイッチ
 *   ④ 並び順: dropdown (既存)
 *   ⑤ 件数表示: 末尾 "N 件"
 *   ⑥ View toggle: List / Grid アイコン
 */

type Props = {
  filters: CreatorSearchFilters;
  onFilterChange: (filters: CreatorSearchFilters) => void;
  resultCount: number;
  isGridView: boolean;
  onViewToggle: (grid: boolean) => void;
};

const SORT_OPTIONS = [
  { value: "recommended" as const, label: "おすすめ" },
  { value: "rating" as const, label: "評価が高い" },
  { value: "price_low" as const, label: "金額が安い" },
  { value: "price_high" as const, label: "金額が高い" },
];

const BUDGET_OPTIONS = [
  { value: "all" as const, label: "予算: すべて" },
  { value: "u50k" as const, label: "〜5万円" },
  { value: "50k_100k" as const, label: "5万〜10万円" },
  { value: "o100k" as const, label: "10万円以上" },
];

const selectCls =
  "rounded-pill border border-ink/15 bg-paper px-3 py-2 text-xs text-ink outline-none transition-colors hover:border-ink/35 focus:border-ink/55 focus:ring-1 focus:ring-ink/10";

export function SearchTopBar({
  filters,
  onFilterChange,
  resultCount,
  isGridView,
  onViewToggle,
}: Props) {
  const update = (patch: Partial<CreatorSearchFilters>) =>
    onFilterChange({ ...filters, ...patch });

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-paper p-4 shadow-[0_4px_18px_-10px_rgba(0,0,0,0.12)] lg:flex-row lg:items-center">
      {/* === キーワード検索 === */}
      <div className="relative flex-1 lg:min-w-[260px]">
        <Search
          size={16}
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/45"
          aria-hidden
        />
        <input
          type="search"
          placeholder="キーワードで検索"
          aria-label="クリエイター検索"
          value={filters.keyword || ""}
          onChange={(e) =>
            update({ keyword: e.target.value || undefined })
          }
          className="w-full rounded-pill border border-ink/15 bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder-ink/40 outline-none transition-colors focus:border-ink/55 focus:ring-1 focus:ring-ink/10"
        />
      </div>

      {/* === フィルター群 === */}
      <div className="flex flex-wrap items-center gap-3">
        {/* ジャンル */}
        <select
          value={filters.genre ?? "all"}
          aria-label="ジャンルで絞り込み"
          onChange={(e) =>
            update({ genre: e.target.value === "all" ? undefined : e.target.value })
          }
          className={selectCls}
        >
          <option value="all">ジャンル: すべて</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {/* 予算 */}
        <select
          value={filters.budgetTier ?? "all"}
          aria-label="予算で絞り込み"
          onChange={(e) =>
            update({
              budgetTier:
                e.target.value === "all"
                  ? undefined
                  : (e.target.value as NonNullable<CreatorSearchFilters["budgetTier"]>),
            })
          }
          className={selectCls}
        >
          {BUDGET_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* 並び順 */}
        <select
          value={filters.sortBy ?? "recommended"}
          aria-label="並び順"
          onChange={(e) =>
            update({ sortBy: e.target.value as CreatorSearchFilters["sortBy"] })
          }
          className={selectCls}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              並び順: {o.label}
            </option>
          ))}
        </select>

        {/* すぐ対応可能トグル */}
        <button
          type="button"
          role="switch"
          aria-checked={!!filters.availableNow}
          onClick={() =>
            update({ availableNow: filters.availableNow ? undefined : true })
          }
          className={`inline-flex items-center gap-2 rounded-pill border px-3 py-2 text-xs transition-colors ${
            filters.availableNow
              ? "border-neon-pink/60 bg-neon-pink/10 text-ink"
              : "border-ink/15 bg-paper text-ink/70 hover:border-ink/35 hover:text-ink"
          }`}
        >
          <span
            aria-hidden
            className={`relative inline-block h-4 w-7 rounded-full transition-colors ${
              filters.availableNow ? "bg-neon-pink" : "bg-ink/20"
            }`}
          >
            <span
              className={`absolute top-0.5 inline-block h-3 w-3 rounded-full bg-paper shadow transition-transform ${
                filters.availableNow ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </span>
          すぐに対応可能
        </button>

        {/* === 件数 + View toggle === */}
        <div className="ml-auto flex items-center gap-3">
          <p className="text-sm text-ink/65">
            <span className="font-medium text-ink">{resultCount}</span> 件
          </p>
          <div
            role="group"
            aria-label="表示形式を切り替え"
            className="inline-flex overflow-hidden rounded-pill border border-ink/15 bg-paper"
          >
            <button
              type="button"
              onClick={() => onViewToggle(false)}
              aria-pressed={!isGridView}
              aria-label="リスト表示"
              className={`inline-flex items-center justify-center px-3 py-2 transition-colors ${
                !isGridView ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
              }`}
            >
              <List size={14} strokeWidth={1.8} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onViewToggle(true)}
              aria-pressed={isGridView}
              aria-label="グリッド表示"
              className={`inline-flex items-center justify-center px-3 py-2 transition-colors ${
                isGridView ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
              }`}
            >
              <LayoutGrid size={14} strokeWidth={1.8} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
