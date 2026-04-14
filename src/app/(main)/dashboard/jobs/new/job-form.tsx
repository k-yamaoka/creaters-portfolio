"use client";

import { useState } from "react";
import { createJob } from "./actions";
import { GENRES } from "@/lib/constants";

export function JobForm() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    selectedGenres.forEach((g) => formData.append("genres", g));
    const result = await createJob(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Title & Description */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">基本情報</h2>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              案件タイトル *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={50}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="例: 新商品のプロモーション動画制作（50文字以内）"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              案件詳細 *
            </label>
            <textarea
              id="description"
              name="description"
              rows={8}
              required
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder={"制作したい動画の詳細を記入してください。\n\n・動画の目的や用途\n・ターゲット視聴者\n・動画の長さ\n・希望するテイストや参考動画\n・素材の有無（撮影が必要か等）\n・その他の要件"}
            />
          </div>
        </div>
      </section>

      {/* Genre selection */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">制作ジャンル *</h2>
        <p className="mb-4 text-sm text-[#828282]">
          該当するジャンルを選択してください（複数選択可）
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <label
                key={genre}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 text-primary-500"
                    : "border-[#E0E0E0] text-[#4F4F4F] hover:border-[#BDBDBD]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleGenre(genre)}
                  className="sr-only"
                />
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    isSelected
                      ? "border-primary-500 bg-primary-500"
                      : "border-[#BDBDBD]"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  )}
                </div>
                <span className="font-medium">{genre}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Budget & Dates */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">予算・スケジュール</h2>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="budget_min"
                className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
              >
                予算下限（円）
              </label>
              <input
                id="budget_min"
                name="budget_min"
                type="number"
                min={0}
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="100000"
              />
            </div>
            <div>
              <label
                htmlFor="budget_max"
                className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
              >
                予算上限（円）
              </label>
              <input
                id="budget_max"
                name="budget_max"
                type="number"
                min={0}
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="500000"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="unit_price"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              1本あたりの単価（円） *
            </label>
            <input
              id="unit_price"
              name="unit_price"
              type="number"
              min={0}
              required
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="50000"
            />
            <p className="mt-1 text-xs text-[#828282]">
              動画1本あたりの概算単価を入力してください
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="deadline"
                className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
              >
                応募締切日
              </label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label
                htmlFor="delivery_deadline"
                className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
              >
                納品希望日
              </label>
              <input
                id="delivery_deadline"
                name="delivery_deadline"
                type="date"
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || selectedGenres.length === 0}
          className="btn-primary px-10 text-sm disabled:opacity-50"
        >
          {saving ? "作成中..." : "案件を掲載する"}
        </button>
      </div>
    </form>
  );
}
