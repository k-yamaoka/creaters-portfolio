"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { GENRES } from "@/lib/constants";
import { formatPrice, formatDateJP } from "@/lib/utils";
import type { JobSearchFilters } from "@/types/database";
import { recommendedScore as scoreJob } from "@/lib/jobs/recommend";

type Job = {
  id: string;
  title: string;
  description: string;
  genres: string[];
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  delivery_deadline: string | null;
  application_count: number;
  status: string;
  created_at: string;
  client: {
    id: string;
    company_name: string | null;
    profiles: { display_name: string };
  };
};

type ViewerProfile = {
  genres: string[];
  strengths: string[];
  video_lengths: string[];
  bio: string;
};

const SORT_OPTIONS = [
  { value: "recommended" as const, label: "おすすめ" },
  { value: "newest" as const, label: "新着" },
  { value: "popular" as const, label: "人気" },
  { value: "price_high" as const, label: "金額が高い" },
  { value: "deadline" as const, label: "応募期限が近い" },
];

const BUDGET_FLOOR = 0;
const BUDGET_CEIL = 5_000_000; // スライダーの最大値 (5M)
// 2026-06-12: 10,000 円刻みでも 5K 単位の細かい予算指定ができないという声があり、
// 5,000 円刻み (1000 段階) に変更。スライダー操作は重くならない範囲。
const BUDGET_STEP = 5_000;

// おすすめスコアは @/lib/jobs/recommend を共通利用 (scoreJob)。
// ダッシュボードの「おすすめ案件」セクションと同一ロジックを保つため抽出済。
const recommendedScore = (job: Job, profile: ViewerProfile | null) =>
  scoreJob(job, profile);

/** 締切までの残日数。null は期限なし */
function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * 「実質的に募集中か」を判定する単一の真実。
 * DB の status と 締切日 (deadline) のどちらかが「終了」を示していれば終了扱い。
 *
 * - status !== "open" (= closed / drafts etc.) → 終了
 * - 締切日が過去 (remain < 0)               → 終了
 * - 締切日 null (期限なし) で status="open"  → 募集中
 * - 締切日が今日以降 で status="open"        → 募集中
 */
function isJobOpen(job: { status: string; deadline: string | null }): boolean {
  if (job.status !== "open") return false;
  const remain = daysUntil(job.deadline);
  if (remain != null && remain < 0) return false;
  return true;
}

export function JobsPageClient({
  jobs,
  viewerProfile,
}: {
  jobs: Job[];
  viewerProfile?: ViewerProfile | null;
}) {
  const hasProfile = !!viewerProfile;
  const [filters, setFilters] = useState<JobSearchFilters>({
    // クリエイタープロフがある場合だけ "おすすめ" をデフォルト、なければ "新着"
    sortBy: hasProfile ? "recommended" : "newest",
    statusFilter: "all",
  });
  const [genreOpen, setGenreOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [budgetMin, setBudgetMin] = useState<number>(BUDGET_FLOOR);
  const [budgetMax, setBudgetMax] = useState<number>(BUDGET_CEIL);

  const updateFilter = (update: Partial<JobSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...update }));
  };

  const toggleGenre = (genre: string) => {
    const current = filters.genres || [];
    const updated = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    updateFilter({ genres: updated.length > 0 ? updated : undefined });
  };

  const filtered = useMemo(() => {
    let result = [...jobs];

    if (filters.statusFilter === "open") {
      // status が "open" でも締切が過ぎていれば実質終了扱いで除外
      result = result.filter((j) => isJobOpen(j));
    } else if (filters.statusFilter === "urgent") {
      // 募集中 かつ 締切が 3 日以内 (本日含む)
      result = result.filter((j) => {
        if (!isJobOpen(j)) return false;
        const r = daysUntil(j.deadline);
        return r != null && r >= 0 && r <= 3;
      });
    } else if (filters.statusFilter === "closed") {
      // 終了済 (実質的に募集中ではない)
      result = result.filter((j) => !isJobOpen(j));
    }

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(kw) ||
          j.description.toLowerCase().includes(kw) ||
          j.genres.some((g) => g.toLowerCase().includes(kw))
      );
    }

    if (filters.genres && filters.genres.length > 0) {
      result = result.filter((j) =>
        filters.genres!.some((g) => j.genres.includes(g))
      );
    }

    // 予算スライダー — min/max が変動範囲外なら除外
    // 案件の budget の代表値 = budget_max ?? budget_min ?? 0
    if (budgetMin > BUDGET_FLOOR || budgetMax < BUDGET_CEIL) {
      result = result.filter((j) => {
        const v = j.budget_max ?? j.budget_min ?? null;
        if (v == null) return false;
        return v >= budgetMin && v <= budgetMax;
      });
    }

    // Sort
    switch (filters.sortBy) {
      case "recommended":
        result.sort((a, b) => {
          const sb = recommendedScore(b, viewerProfile ?? null);
          const sa = recommendedScore(a, viewerProfile ?? null);
          if (sb !== sa) return sb - sa;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "popular":
        result.sort((a, b) => b.application_count - a.application_count);
        break;
      case "price_high":
        result.sort(
          (a, b) =>
            (b.budget_max || b.budget_min || 0) - (a.budget_max || a.budget_min || 0)
        );
        break;
      case "deadline":
        result.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        break;
    }

    return result;
  }, [jobs, filters, viewerProfile, budgetMin, budgetMax]);

  const hasActiveFilters =
    filters.keyword ||
    (filters.genres && filters.genres.length > 0) ||
    budgetMin > BUDGET_FLOOR ||
    budgetMax < BUDGET_CEIL;

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-10">
      {/* Header — タイトルを大きく + グラデーションでハイライト */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.25rem] font-black leading-tight sm:text-[3.25rem]">
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
              AI動画案件
            </span>
            <span className="text-[#222]">を探す</span>
          </h1>
          <p className="mt-3 text-base text-[#828282]">
            企業が掲載した AI 動画制作の募集案件から、あなたの AI スキルに合う仕事を見つけましょう
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex items-center gap-2 rounded-lg border border-[#E0E0E0] px-4 py-2.5 text-sm font-medium text-[#4F4F4F] lg:hidden"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          絞り込み
        </button>
      </div>

      {/* Top bar */}
      <div className="mb-6 space-y-4 rounded-2xl bg-white p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#BDBDBD]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="キーワードで検索"
              value={filters.keyword || ""}
              onChange={(e) => updateFilter({ keyword: e.target.value || undefined })}
              className="w-full rounded-lg border border-[#E0E0E0] py-2.5 pl-9 pr-3 text-sm text-[#222] placeholder-[#BDBDBD] outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="shrink-0 text-xs font-bold text-[#828282]">並び順</label>
            <select
              value={filters.sortBy || "recommended"}
              onChange={(e) => updateFilter({ sortBy: e.target.value as JobSearchFilters["sortBy"] })}
              className="rounded-lg border border-[#E0E0E0] px-3 py-2.5 text-sm text-[#4F4F4F] outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} disabled={o.value === "recommended" && !hasProfile}>
                  {o.label}
                  {o.value === "recommended" && !hasProfile ? " (プロフィール未設定)" : ""}
                </option>
              ))}
            </select>
          </div>

          <p className="shrink-0 text-sm text-[#828282]">
            <span className="font-bold text-[#222]">{filtered.length}</span> 件
          </p>
        </div>

        {/* ステータスタブ — すべて / 募集中 / 締切間近 / 終了 */}
        {(() => {
          // 各タブの件数を「statusFilter 以外の現在のフィルタ条件で絞り込んだもの」
          // ベースで計算する。タブを切替えても件数が変わらないようにする。
          const baseList = jobs.filter((j) => {
            if (filters.keyword) {
              const kw = filters.keyword.toLowerCase();
              if (
                !j.title.toLowerCase().includes(kw) &&
                !j.description.toLowerCase().includes(kw) &&
                !j.genres.some((g) => g.toLowerCase().includes(kw))
              )
                return false;
            }
            if (filters.genres && filters.genres.length > 0) {
              if (!filters.genres.some((g) => j.genres.includes(g))) return false;
            }
            if (budgetMin > BUDGET_FLOOR || budgetMax < BUDGET_CEIL) {
              const v = j.budget_max ?? j.budget_min ?? null;
              if (v == null) return false;
              if (v < budgetMin || v > budgetMax) return false;
            }
            return true;
          });
          const cAll = baseList.length;
          const cOpen = baseList.filter((j) => isJobOpen(j)).length;
          const cUrgent = baseList.filter((j) => {
            if (!isJobOpen(j)) return false;
            const r = daysUntil(j.deadline);
            return r != null && r >= 0 && r <= 3;
          }).length;
          const cClosed = baseList.filter((j) => !isJobOpen(j)).length;
          const TABS: {
            key: "all" | "open" | "urgent" | "closed";
            label: string;
            n: number;
            tone?: "urgent";
          }[] = [
            { key: "all", label: "すべて", n: cAll },
            { key: "open", label: "募集中", n: cOpen },
            { key: "urgent", label: "締切間近", n: cUrgent, tone: "urgent" },
            { key: "closed", label: "終了", n: cClosed },
          ];
          return (
            <div
              role="tablist"
              aria-label="案件ステータス"
              className="flex flex-wrap gap-1 border-b border-gray-200"
            >
              {TABS.map((t) => {
                const active = (filters.statusFilter ?? "all") === t.key;
                const accent =
                  t.tone === "urgent" ? "border-red-500 text-red-600" : "border-neon-pink text-neon-pink";
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => updateFilter({ statusFilter: t.key })}
                    className={`relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 pb-2 pt-1 text-sm font-bold transition-colors ${
                      active
                        ? accent
                        : "border-transparent text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {t.label}
                    <span
                      className={`rounded-pill px-1.5 py-0 text-[10px] font-bold ${
                        active
                          ? t.tone === "urgent"
                            ? "bg-red-100 text-red-600"
                            : "bg-neon-pink/15 text-neon-pink"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {t.n}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* 予算スライダーは左サイドバー */}
      </div>

      {/* 2-column layout */}
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <button
                type="button"
                onClick={() => setGenreOpen(!genreOpen)}
                className="flex w-full items-center justify-between"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#828282]">制作ジャンル</h3>
                <svg className={`h-4 w-4 text-[#BDBDBD] transition-transform ${genreOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {genreOpen && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {GENRES.map((genre) => {
                    const isActive = filters.genres?.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`rounded-pill border px-3 py-1.5 text-xs font-medium transition-all ${
                          isActive
                            ? "border-neon-purple-deep bg-gradient-to-r from-neon-pink to-neon-purple text-white"
                            : "border-[#E0E0E0] text-[#4F4F4F] hover:border-neon-purple-deep hover:text-neon-purple-deep"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 案件金額の範囲 (左サイドバーに統合) */}
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#828282]">
                案件金額の範囲
              </h3>
              <p className="mt-2 text-sm font-bold text-neon-purple-deep">
                {formatPrice(budgetMin)}
                <span className="mx-1 text-[#BDBDBD]">〜</span>
                {budgetMax >= BUDGET_CEIL ? "上限なし" : formatPrice(budgetMax)}
              </p>
              {/* 数値入力欄: スライダーを補完。5,000 単位での細かい指定が可能 */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#828282]">下限 (円)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={BUDGET_FLOOR}
                    max={BUDGET_CEIL}
                    step={BUDGET_STEP}
                    value={budgetMin}
                    onChange={(e) => {
                      const v = Math.max(
                        BUDGET_FLOOR,
                        Math.min(Number(e.target.value || 0), budgetMax)
                      );
                      setBudgetMin(v);
                    }}
                    className="mt-0.5 w-full rounded-md border border-[#E0E0E0] px-2 py-1 text-xs outline-none focus:border-neon-pink"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#828282]">上限 (円)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={BUDGET_FLOOR}
                    max={BUDGET_CEIL}
                    step={BUDGET_STEP}
                    value={budgetMax}
                    onChange={(e) => {
                      const v = Math.min(
                        BUDGET_CEIL,
                        Math.max(Number(e.target.value || 0), budgetMin)
                      );
                      setBudgetMax(v);
                    }}
                    className="mt-0.5 w-full rounded-md border border-[#E0E0E0] px-2 py-1 text-xs outline-none focus:border-neon-pink"
                  />
                </div>
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-[10px] text-[#828282]">下限スライダー</label>
                  <input
                    type="range"
                    min={BUDGET_FLOOR}
                    max={BUDGET_CEIL}
                    step={BUDGET_STEP}
                    value={budgetMin}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setBudgetMin(Math.min(v, budgetMax));
                    }}
                    className="block w-full accent-neon-pink"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#828282]">上限スライダー</label>
                  <input
                    type="range"
                    min={BUDGET_FLOOR}
                    max={BUDGET_CEIL}
                    step={BUDGET_STEP}
                    value={budgetMax}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setBudgetMax(Math.max(v, budgetMin));
                    }}
                    className="block w-full accent-neon-purple"
                  />
                </div>
              </div>
              {/* よく使う範囲のクイックチップ — 5K 単位で細かく指定したいとき以外の近道 */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { label: "〜10万", min: 0, max: 100_000 },
                  { label: "10〜30万", min: 100_000, max: 300_000 },
                  { label: "30〜100万", min: 300_000, max: 1_000_000 },
                  { label: "100万〜", min: 1_000_000, max: BUDGET_CEIL },
                ].map((q) => {
                  const active = budgetMin === q.min && budgetMax === q.max;
                  return (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => {
                        setBudgetMin(q.min);
                        setBudgetMax(q.max);
                      }}
                      className={`rounded-pill border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                        active
                          ? "border-neon-pink bg-neon-pink/10 text-neon-pink"
                          : "border-[#E0E0E0] text-[#828282] hover:border-neon-pink hover:text-neon-pink"
                      }`}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-sm text-[#828282]">
                <span className="text-lg font-bold text-[#222]">{filtered.length}</span> 件の案件
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters({
                      sortBy: filters.sortBy ?? "recommended",
                      statusFilter: filters.statusFilter,
                    });
                    setBudgetMin(BUDGET_FLOOR);
                    setBudgetMax(BUDGET_CEIL);
                  }}
                  className="mt-3 w-full rounded-lg border border-[#E0E0E0] py-2 text-sm font-medium text-[#828282] transition-colors hover:bg-[#F8F8F8]"
                >
                  フィルターをクリア
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile filters overlay */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#F8F8F8] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#222]">絞り込み</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2] text-[#828282]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#828282]">制作ジャンル</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRES.map((genre) => {
                      const isActive = filters.genres?.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleGenre(genre)}
                          className={`rounded-pill border px-3 py-1.5 text-xs font-medium transition-all ${
                            isActive
                              ? "border-neon-purple-deep bg-gradient-to-r from-neon-pink to-neon-purple text-white"
                              : "border-[#E0E0E0] text-[#4F4F4F] hover:border-neon-purple-deep hover:text-neon-purple-deep"
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 案件金額の範囲 (モバイル) */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#828282]">
                      案件金額の範囲
                    </h3>
                    <p className="text-sm font-bold text-neon-purple-deep">
                      {formatPrice(budgetMin)}
                      <span className="mx-1 text-[#BDBDBD]">〜</span>
                      {budgetMax >= BUDGET_CEIL ? "上限なし" : formatPrice(budgetMax)}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-[#828282]">下限</label>
                      <input
                        type="range"
                        min={BUDGET_FLOOR}
                        max={BUDGET_CEIL}
                        step={BUDGET_STEP}
                        value={budgetMin}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setBudgetMin(Math.min(v, budgetMax));
                        }}
                        className="block w-full accent-neon-pink"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#828282]">上限</label>
                      <input
                        type="range"
                        min={BUDGET_FLOOR}
                        max={BUDGET_CEIL}
                        step={BUDGET_STEP}
                        value={budgetMax}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setBudgetMax(Math.max(v, budgetMin));
                        }}
                        className="block w-full accent-neon-purple"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary mt-6 w-full"
              >
                {filtered.length}件を表示
              </button>
            </div>
          </div>
        )}

        {/* Job list */}
        <div className="min-w-0 flex-1">
          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((job) => {
                const clientName =
                  job.client?.company_name ||
                  job.client?.profiles?.display_name ||
                  "企業";
                const daysAgo = Math.floor(
                  (Date.now() - new Date(job.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const timeLabel =
                  daysAgo === 0 ? "今日" : daysAgo === 1 ? "昨日" : `${daysAgo}日前`;

                // 「実質的に募集中か」を 1 か所で判定。
                // 締切が過ぎていれば DB の status に関わらず終了扱いで統一する
                // (旧実装は status と 締切バッジが矛盾して "募集中なのに受付終了" 表示が起きていた)
                const isOpen = isJobOpen(job);
                const remain = daysUntil(job.deadline);
                const deadlineUrgent = isOpen && remain != null && remain >= 0 && remain <= 3;
                const deadlineSoon = isOpen && remain != null && remain >= 0 && remain <= 7;
                const deadlinePast = remain != null && remain < 0;

                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className={`group block overflow-hidden rounded-2xl bg-white shadow-card transition-shadow hover:shadow-card-hover ${
                      deadlineUrgent && isOpen
                        ? "ring-2 ring-red-400/60"
                        : ""
                    }`}
                  >
                    <div className={`px-6 py-2 text-xs font-bold ${isOpen ? "bg-green-50 text-green-600" : "bg-[#F2F2F2] text-[#828282]"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${isOpen ? "bg-green-500" : "bg-[#BDBDBD]"}`} />
                          {isOpen ? "募集中" : "募集終了"}
                        </div>
                        <span>{timeLabel}</span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-bold text-[#222] transition-colors group-hover:text-neon-purple-deep">
                            {job.title}
                          </h2>
                          <p className="mt-1 text-sm text-[#828282]">{clientName}</p>
                          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#4F4F4F]">
                            {job.description.replace(/\\n/g, "\n")}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {job.genres.slice(0, 4).map((genre) => (
                              <span
                                key={genre}
                                className="rounded-pill bg-neon-purple/10 px-2.5 py-0.5 text-[11px] font-bold text-neon-purple-deep"
                              >
                                {genre}
                              </span>
                            ))}
                            {job.genres.length > 4 && (
                              <span className="text-[11px] text-[#BDBDBD]">+{job.genres.length - 4}</span>
                            )}
                          </div>
                        </div>

                        {/* 締切ハイライト — 案件カード右上に大きく表示 */}
                        {job.deadline && (
                          <div
                            className={`shrink-0 rounded-xl border-2 px-3 py-2 text-right ${
                              deadlinePast
                                ? "border-gray-200 bg-gray-50 text-gray-400"
                                : deadlineUrgent
                                  ? "border-red-400 bg-red-50 text-red-600 shadow-[0_0_18px_-6px_rgba(248,113,113,0.6)]"
                                  : deadlineSoon
                                    ? "border-orange-300 bg-orange-50 text-orange-600"
                                    : "border-[#E0E0E0] bg-white text-[#4F4F4F]"
                            }`}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                              応募締切
                            </p>
                            <p className="text-base font-black">
                              {formatDateJP(job.deadline)}
                            </p>
                            {remain != null && (
                              <p className="text-[11px] font-bold">
                                {remain < 0
                                  ? "受付終了"
                                  : remain === 0
                                    ? "本日締切!"
                                    : `残り ${remain} 日${deadlineUrgent ? "!" : ""}`}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#F2F2F2] pt-4">
                        {(job.budget_min || job.budget_max) && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-neon-purple/10 px-3 py-1.5 text-sm font-bold text-neon-purple-deep">
                            {job.budget_min && job.budget_max
                              ? job.budget_min === job.budget_max
                                ? formatPrice(job.budget_min)
                                : `${formatPrice(job.budget_min)}〜${formatPrice(job.budget_max)}`
                              : job.budget_max
                                ? `〜${formatPrice(job.budget_max)}`
                                : `${formatPrice(job.budget_min!)}〜`}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 rounded-lg bg-[#F8F8F8] px-3 py-1.5 text-xs text-[#828282]">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                          応募 {job.application_count}件
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-20 text-center">
              <svg className="mx-auto h-16 w-16 text-[#E0E0E0]" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <h3 className="mt-6 text-xl font-bold text-[#222]">
                条件に合う案件が見つかりませんでした
              </h3>
              <p className="mt-2 text-sm text-[#828282]">
                フィルター条件を変更してお試しください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
