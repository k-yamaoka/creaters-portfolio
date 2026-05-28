"use client";

import { useEffect, useState } from "react";

export type SectionTab = {
  id: string;
  label: string;
  emoji: string;
};

/**
 * クリエイター詳細ページの上部固定タブナビ。
 * - クリックで該当 section へスムーズスクロール
 * - スクロール位置に応じてアクティブタブを自動更新 (IntersectionObserver)
 */
export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const [active, setActive] = useState<string>(tabs[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      {
        // ヘッダー(80px)とタブ(50px)の下、上から180px以降を観測対象に
        rootMargin: "-180px 0px -50% 0px",
        threshold: [0.1, 0.3, 0.5],
      }
    );

    tabs.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tabs]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="sticky top-20 z-30 -mx-6 border-y border-white/10 bg-neon-midnight-deep/85 px-6 backdrop-blur-md lg:-mx-10 lg:px-10">
      <div className="mx-auto flex max-w-container gap-1 overflow-x-auto py-3 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => scrollTo(tab.id)}
              className={`group flex shrink-0 items-center gap-1.5 rounded-pill border px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "border-neon-pink/60 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-white shadow-[0_0_14px_rgba(255,77,157,0.35)]"
                  : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
              }`}
            >
              <span className="text-[13px]">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
