"use client";

import { useMemo, useState } from "react";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import {
  PORTFOLIO_FORMATS,
  type PortfolioFormat,
} from "@/lib/constants";
import type { CreatorWithRelations } from "@/lib/supabase/queries";

type Items = CreatorWithRelations["portfolio_items"];

/**
 * クリエイター詳細ページ用、アスペクト比フィルタ付きポートフォリオ。
 * /portfolios の PortfolioThumbnailGrid と同じ「全て / 縦 / 横 / 正方形」軸で絞れる。
 */
export function PortfolioFilterable({
  items,
  isAuthed = false,
}: {
  items: Items;
  isAuthed?: boolean;
}) {
  const [selected, setSelected] = useState<PortfolioFormat>("all");

  const counts = useMemo(() => {
    const c: Record<PortfolioFormat, number> = {
      all: items.length,
      vertical: 0,
      horizontal: 0,
      square: 0,
    };
    for (const p of items) {
      if (p.aspect_ratio === "vertical") c.vertical++;
      else if (p.aspect_ratio === "horizontal") c.horizontal++;
      else if (p.aspect_ratio === "square") c.square++;
    }
    return c;
  }, [items]);

  const filtered = useMemo(
    () =>
      selected === "all"
        ? items
        : items.filter((p) => p.aspect_ratio === selected),
    [items, selected]
  );

  return (
    <div className="space-y-5">
      {/* Format filter */}
      <div className="flex flex-wrap gap-2">
        {PORTFOLIO_FORMATS.map((tab) => {
          const count = counts[tab.value];
          if (tab.value !== "all" && count === 0) return null;
          const isActive = selected === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelected(tab.value)}
              className={`inline-flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <PortfolioGrid items={filtered} isAuthed={isAuthed} />
    </div>
  );
}
