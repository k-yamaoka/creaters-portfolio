"use client";

import { useState } from "react";
import {
  RectangleHorizontal,
  RectangleVertical,
  Square,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { GENRES, AI_TOOLS, JOB_VISUAL_STYLES } from "@/lib/constants";
import { countActiveFilters } from "@/lib/portfolio-search";
import type {
  DurationBucket,
  Orientation,
  PortfolioSearchFilters,
  Resolution,
} from "@/types/database";

/**
 * 2026-06-23 リファクタ:
 * /portfolios の旧 左サイドバー (PortfolioFiltersSidebar) を撤去し、
 * 同じ機能を上部に「展開トグル付き 1 段バー」として配置する。
 *
 * - 「絞り込み」ボタンで展開/折り畳み (展開状態を保持)
 *   active count バッジ + 「すべてクリア」リンク
 * - 展開時はカード内に 6 モジュール (ジャンル / 向き / AI ツール / トンマナ /
 *   尺 / 解像度) を grid (sm:2 / lg:3) で並べる
 * - 各オプションは chip 形式の複数選択トグル (チェックボックスより一望性)
 * - 向きはアイコン付きトグル 3 列 (Adobe Stock 同様の操作感)
 *
 * これにより:
 *  - 右側の作品グリッドが画面幅 100% に拡張、作品サムネが大きく見える
 *  - フィルタ未使用時 (デフォルト折り畳み) は最大限スペース確保
 *  - フィルタ展開時もページ最上部だけが占有、スクロール阻害なし
 */

type Props = {
  filters: PortfolioSearchFilters;
  onChange: (next: PortfolioSearchFilters) => void;
  totalCount: number;
  /** デフォルトで展開するか (active filter があるときは true 推奨) */
  defaultOpen?: boolean;
};

const VIDEO_AI_TOOLS = AI_TOOLS.filter((t) => t.category === "Video").map(
  (t) => t.name
);

const DURATION_OPTIONS: { value: DurationBucket; label: string }[] = [
  { value: "u15", label: "〜15秒" },
  { value: "u60", label: "15秒〜1分" },
  { value: "u180", label: "1〜3分" },
  { value: "o180", label: "3分以上" },
];

const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: "1080p", label: "1080p" },
  { value: "2k", label: "2K" },
  { value: "4k", label: "4K" },
];

export function PortfolioFiltersBar({
  filters,
  onChange,
  totalCount,
  defaultOpen = false,
}: Props) {
  void totalCount;
  const activeCount = countActiveFilters(filters);
  const [open, setOpen] = useState(defaultOpen || activeCount > 0);

  const toggleArrayValue = <K extends keyof PortfolioSearchFilters>(
    key: K,
    value: string
  ) => {
    const current = (filters[key] as string[] | undefined) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({
      ...filters,
      [key]: next.length > 0 ? (next as PortfolioSearchFilters[K]) : undefined,
    });
  };

  const clearAll = () => {
    // sortBy / keyword は触らず、絞り込みだけクリア
    onChange({
      sortBy: filters.sortBy,
      keyword: filters.keyword,
    });
  };

  return (
    <div className="mb-6 rounded-2xl border border-ink/10 bg-paper">
      {/* === 折り畳みヘッダ === */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-ink"
        >
          <SlidersHorizontal size={14} strokeWidth={1.8} aria-hidden />
          絞り込み
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-paper">
              {activeCount}
            </span>
          )}
          <span className="ml-1 text-[10px] text-ink/50">
            {open ? "閉じる" : "開く"}
          </span>
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs text-ink/60 transition-colors hover:text-ink"
          >
            <X size={12} strokeWidth={1.8} aria-hidden />
            すべてクリア
          </button>
        )}
      </div>

      {/* === 展開エリア === */}
      {open && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-ink/10 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* ジャンル */}
          <Module title="制作ジャンル" count={filters.genres?.length ?? 0}>
            <ChipGroup>
              {GENRES.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  checked={filters.genres?.includes(g) ?? false}
                  onToggle={() => toggleArrayValue("genres", g)}
                />
              ))}
            </ChipGroup>
          </Module>

          {/* 向き (アイコン付きトグル) */}
          <Module title="向き" count={filters.orientations?.length ?? 0}>
            <div className="grid grid-cols-3 gap-2">
              <OrientationToggle
                value="horizontal"
                label="横型"
                sub="16:9"
                icon={RectangleHorizontal}
                checked={filters.orientations?.includes("horizontal") ?? false}
                onToggle={() => toggleArrayValue("orientations", "horizontal")}
              />
              <OrientationToggle
                value="vertical"
                label="縦型"
                sub="9:16"
                icon={RectangleVertical}
                checked={filters.orientations?.includes("vertical") ?? false}
                onToggle={() => toggleArrayValue("orientations", "vertical")}
              />
              <OrientationToggle
                value="square"
                label="正方形"
                sub="1:1"
                icon={Square}
                checked={filters.orientations?.includes("square") ?? false}
                onToggle={() => toggleArrayValue("orientations", "square")}
              />
            </div>
          </Module>

          {/* 使用 AI ツール */}
          <Module title="使用AIツール" count={filters.aiTools?.length ?? 0}>
            <ChipGroup>
              {VIDEO_AI_TOOLS.map((t) => {
                // 表示は "Sora 2" → "Sora" に短縮 (フィルタも先頭ワード)
                const display = t.split(" ")[0];
                return (
                  <Chip
                    key={t}
                    label={display}
                    checked={filters.aiTools?.includes(display) ?? false}
                    onToggle={() => toggleArrayValue("aiTools", display)}
                  />
                );
              })}
            </ChipGroup>
          </Module>

          {/* トンマナ */}
          <Module title="トンマナ" count={filters.visualStyles?.length ?? 0}>
            <ChipGroup>
              {JOB_VISUAL_STYLES.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  checked={filters.visualStyles?.includes(s.value) ?? false}
                  onToggle={() => toggleArrayValue("visualStyles", s.value)}
                />
              ))}
            </ChipGroup>
          </Module>

          {/* 尺 */}
          <Module title="尺" count={filters.durations?.length ?? 0}>
            <ChipGroup>
              {DURATION_OPTIONS.map((d) => (
                <Chip
                  key={d.value}
                  label={d.label}
                  checked={filters.durations?.includes(d.value) ?? false}
                  onToggle={() => toggleArrayValue("durations", d.value)}
                />
              ))}
            </ChipGroup>
          </Module>

          {/* 解像度 */}
          <Module title="解像度" count={filters.resolutions?.length ?? 0}>
            <ChipGroup>
              {RESOLUTION_OPTIONS.map((r) => (
                <Chip
                  key={r.value}
                  label={r.label}
                  checked={filters.resolutions?.includes(r.value) ?? false}
                  onToggle={() => toggleArrayValue("resolutions", r.value)}
                />
              ))}
            </ChipGroup>
          </Module>
        </div>
      )}
    </div>
  );
}

// ===== Sub-components =====

function Module({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/55">
        {title}
        {count > 0 && (
          <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sand px-1 text-[9px] font-bold text-paper">
            {count}
          </span>
        )}
      </p>
      {children}
    </div>
  );
}

function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`rounded-pill border px-3 py-1 text-[11px] font-medium transition-colors ${
        checked
          ? "border-ink bg-ink text-paper"
          : "border-ink/15 bg-paper text-ink/75 hover:border-ink/40 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function OrientationToggle({
  value,
  label,
  sub,
  icon: Icon,
  checked,
  onToggle,
}: {
  value: Orientation;
  label: string;
  sub: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean }>;
  checked: boolean;
  onToggle: () => void;
}) {
  void value;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`flex flex-col items-center justify-center gap-1 rounded-md border px-2 py-2.5 text-[11px] transition-colors ${
        checked
          ? "border-ink bg-ink text-paper"
          : "border-ink/15 bg-paper text-ink/80 hover:border-ink/40"
      }`}
    >
      <Icon
        size={18}
        strokeWidth={1.4}
        className={checked ? "text-paper" : "text-ink/65"}
        aria-hidden
      />
      <span className="font-medium">{label}</span>
      <span
        className={`font-mono text-[9px] ${checked ? "text-paper/70" : "text-ink/45"}`}
      >
        {sub}
      </span>
    </button>
  );
}
