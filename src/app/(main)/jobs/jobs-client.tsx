"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { GENRES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

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
  created_at: string;
  client: {
    id: string;
    company_name: string | null;
    profiles: { display_name: string };
  };
};

export function JobsPageClient({ jobs }: { jobs: Job[] }) {
  const [keyword, setKeyword] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreOpen, setGenreOpen] = useState(true);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const filtered = useMemo(() => {
    let result = [...jobs];

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(kw) ||
          j.description.toLowerCase().includes(kw) ||
          j.genres.some((g) => g.toLowerCase().includes(kw))
      );
    }

    if (selectedGenres.length > 0) {
      result = result.filter((j) =>
        selectedGenres.some((g) => j.genres.includes(g))
      );
    }

    return result;
  }, [jobs, keyword, selectedGenres]);

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          案件を探す
        </h1>
        <p className="mt-3 text-base text-[#828282]">
          企業が掲載した映像制作の募集案件から、あなたに合った仕事を見つけましょう
        </p>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Search */}
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#BDBDBD]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="キーワードで検索"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full rounded-lg border border-[#E0E0E0] py-2.5 pl-9 pr-3 text-sm text-[#222] placeholder-[#BDBDBD] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Genre */}
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <button
                type="button"
                onClick={() => setGenreOpen(!genreOpen)}
                className="flex w-full items-center justify-between"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#828282]">
                  制作ジャンル
                </h3>
                <svg
                  className={`h-4 w-4 text-[#BDBDBD] transition-transform ${genreOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {genreOpen && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {GENRES.map((genre) => {
                    const isActive = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`rounded-pill border px-3 py-1.5 text-xs font-medium transition-all ${
                          isActive
                            ? "border-primary-500 bg-primary-500 text-white"
                            : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Count */}
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-sm text-[#828282]">
                <span className="text-lg font-bold text-[#222]">
                  {filtered.length}
                </span>{" "}
                件の案件
              </p>
              {(keyword || selectedGenres.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword("");
                    setSelectedGenres([]);
                  }}
                  className="mt-3 w-full rounded-lg border border-[#E0E0E0] py-2 text-sm font-medium text-[#828282] transition-colors hover:bg-[#F8F8F8]"
                >
                  フィルターをクリア
                </button>
              )}
            </div>
          </div>
        </aside>

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
                  daysAgo === 0
                    ? "今日"
                    : daysAgo === 1
                      ? "昨日"
                      : `${daysAgo}日前`;

                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-2xl bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-[#222]">
                          {job.title}
                        </h2>
                        <p className="mt-1 text-sm text-[#828282]">
                          {clientName}
                        </p>
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#4F4F4F]">
                          {job.description}
                        </p>
                        {/* Genre tags */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.genres.slice(0, 4).map((genre) => (
                            <span
                              key={genre}
                              className="rounded-pill bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-500"
                            >
                              {genre}
                            </span>
                          ))}
                          {job.genres.length > 4 && (
                            <span className="text-[11px] text-[#BDBDBD]">
                              +{job.genres.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {(job.budget_min || job.budget_max) && (
                          <p className="text-lg font-bold text-primary-500">
                            {job.budget_min && job.budget_max
                              ? `${formatPrice(job.budget_min)}〜${formatPrice(job.budget_max)}`
                              : job.budget_max
                                ? `〜${formatPrice(job.budget_max)}`
                                : `${formatPrice(job.budget_min!)}〜`}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[#BDBDBD]">
                          {timeLabel}
                        </p>
                        {job.deadline && (
                          <p className="mt-1 text-xs text-[#828282]">
                            締切:{" "}
                            {new Date(job.deadline).toLocaleDateString("ja-JP")}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-[#828282]">
                          応募 {job.application_count}件
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-20 text-center">
              <svg
                className="mx-auto h-16 w-16 text-[#E0E0E0]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              <h3 className="mt-6 text-xl font-bold text-[#222]">
                現在募集中の案件はありません
              </h3>
              <p className="mt-2 text-sm text-[#828282]">
                新しい案件が掲載されるまでお待ちください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
