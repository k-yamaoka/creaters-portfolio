"use client";

import { useState } from "react";
import { ChevronDown, RectangleHorizontal, RectangleVertical, Square } from "lucide-react";
import { GENRES, AI_TOOLS, JOB_VISUAL_STYLES } from "@/lib/constants";
import { countActiveFilters } from "@/lib/portfolio-search";
import type {
  DurationBucket,
  Orientation,
  PortfolioSearchFilters,
  Resolution,
} from "@/types/database";

type Props = {
  filters: PortfolioSearchFilters;
  onChange: (next: PortfolioSearchFilters) => void;
  totalCount: number;
};

// Video カテゴリの AI ツールだけ抽出 (Image / Audio は portfolios とは無関係)。
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

export function PortfolioFiltersSidebar({ filters, onChange, totalCount }: Props) {
  void totalCount;
  const activeCount = countActiveFilters(filters);

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
    onChange({ sortBy: filters.sortBy });
  };

  return (
    <aside className="w-full text-sm text-ink">
      <div className="mb-5 flex items-center justify-between border-b border-ink/10 pb-3">
        <h2 className="font-display text-base font-medium text-ink">
          絞り込み
          {activeCount > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-paper">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-ink/60 underline-offset-2 hover:text-ink hover:underline"
          >
            すべてクリア
          </button>
        )}
      </div>

      {/* 制作ジャンル */}
      <Accordion
        title="制作ジャンル"
        count={filters.genres?.length ?? 0}
        defaultOpen
      >
        <ul className="space-y-1.5">
          {GENRES.map((g) => (
            <CheckboxRow
              key={g}
              label={g}
              checked={filters.genres?.includes(g) ?? false}
              onToggle={() => toggleArrayValue("genres", g)}
            />
          ))}
        </ul>
      </Accordion>

      {/* 向き — アイコン付きトグル */}
      <Accordion
        title="向き"
        count={filters.orientations?.length ?? 0}
        defaultOpen
      >
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
      </Accordion>

      {/* 使用 AI ツール */}
      <Accordion title="使用AIツール" count={filters.aiTools?.length ?? 0}>
        <ul className="space-y-1.5">
          {VIDEO_AI_TOOLS.map((t) => {
            // 表示は "Sora 2" → "Sora" に短縮 (フィルタも先頭ワードで OK)
            const display = t.split(" ")[0];
            const key = display;
            return (
              <CheckboxRow
                key={t}
                label={display}
                checked={filters.aiTools?.includes(key) ?? false}
                onToggle={() => toggleArrayValue("aiTools", key)}
              />
            );
          })}
        </ul>
      </Accordion>

      {/* トンマナ */}
      <Accordion title="トンマナ" count={filters.visualStyles?.length ?? 0}>
        <ul className="space-y-1.5">
          {JOB_VISUAL_STYLES.map((s) => (
            <CheckboxRow
              key={s.value}
              label={s.label}
              checked={filters.visualStyles?.includes(s.value) ?? false}
              onToggle={() => toggleArrayValue("visualStyles", s.value)}
            />
          ))}
        </ul>
      </Accordion>

      {/* 尺 */}
      <Accordion title="尺" count={filters.durations?.length ?? 0}>
        <ul className="space-y-1.5">
          {DURATION_OPTIONS.map((d) => (
            <CheckboxRow
              key={d.value}
              label={d.label}
              checked={filters.durations?.includes(d.value) ?? false}
              onToggle={() => toggleArrayValue("durations", d.value)}
            />
          ))}
        </ul>
      </Accordion>

      {/* 解像度 */}
      <Accordion title="解像度" count={filters.resolutions?.length ?? 0}>
        <ul className="space-y-1.5">
          {RESOLUTION_OPTIONS.map((r) => (
            <CheckboxRow
              key={r.value}
              label={r.label}
              checked={filters.resolutions?.includes(r.value) ?? false}
              onToggle={() => toggleArrayValue("resolutions", r.value)}
            />
          ))}
        </ul>
      </Accordion>
    </aside>
  );
}

// ===== Sub-components =====

function Accordion({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ink/10 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[13px] font-medium text-ink">
          {title}
          {count > 0 && (
            <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sand px-1 text-[9px] font-bold text-paper">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`text-ink/55 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-2 py-1 text-[13px] text-ink/85 transition-colors hover:text-ink">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-3.5 w-3.5 cursor-pointer rounded border-ink/30 accent-ink"
        />
        <span>{label}</span>
      </label>
    </li>
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
      className={`flex flex-col items-center justify-center gap-1 rounded-md border px-2 py-3 text-[11px] transition-colors ${
        checked
          ? "border-ink bg-ink text-paper"
          : "border-ink/15 bg-paper text-ink/80 hover:border-ink/40"
      }`}
    >
      <Icon
        size={20}
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
