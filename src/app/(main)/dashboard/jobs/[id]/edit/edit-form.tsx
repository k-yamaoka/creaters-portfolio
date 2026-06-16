"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GENRES } from "@/lib/constants";
import { updateJob } from "./actions";

type Job = {
  id: string;
  title: string;
  description: string;
  genres: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  delivery_deadline: string | null;
  status: string;
};

const STATUSES = [
  { value: "open", label: "募集中 (公開)" },
  { value: "closed", label: "締切 (応募停止)" },
  { value: "draft", label: "下書き (非公開)" },
  { value: "cancelled", label: "キャンセル" },
] as const;

export function JobEditForm({ job }: { job: Job }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    Array.isArray(job.genres) ? job.genres : []
  );

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    // 制作ジャンルは複数選択 → multipart で追加
    selectedGenres.forEach((g) => formData.append("genres", g));
    const result = await updateJob(job.id, formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  };

  // input[type=date] 用に YYYY-MM-DD へ整形
  const toInputDate = (s: string | null) => (s ? s.slice(0, 10) : "");

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* タイトル */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <label
          htmlFor="title"
          className="mb-3 flex items-center text-lg font-bold text-[#222]"
        >
          案件タイトル
          <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
            必須
          </span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={50}
          defaultValue={job.title}
          className="w-full rounded-lg border-2 border-[#E0E0E0] px-4 py-3 text-base font-medium outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
        />
      </section>

      {/* ステータス */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <label
          htmlFor="status"
          className="mb-3 flex items-center text-lg font-bold text-[#222]"
        >
          公開ステータス
        </label>
        <select
          id="status"
          name="status"
          defaultValue={job.status}
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink sm:max-w-md"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-[#828282]">
          ※ 下書きにすると公開ページから非表示になります。締切はクリエイターから
          見えますが新規応募はできません。
        </p>
      </section>

      {/* 制作ジャンル */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">制作ジャンル</h2>
        <p className="mb-4 text-sm text-[#828282]">複数選択可</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <label
                key={genre}
                className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "border-neon-pink bg-neon-purple/10 text-neon-purple-deep"
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
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 ${
                    isSelected
                      ? "border-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple"
                      : "border-[#BDBDBD]"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="h-3.5 w-3.5 text-white"
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
                <span className="truncate font-medium">{genre}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 案件詳細 */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <label
          htmlFor="description"
          className="mb-3 flex items-center text-lg font-bold text-[#222]"
        >
          案件詳細
        </label>
        <textarea
          id="description"
          name="description"
          rows={8}
          maxLength={3000}
          defaultValue={job.description ?? ""}
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
        />
        <p className="mt-1 text-[11px] text-[#828282]">
          ※ 制作要件 (本数 / 完成尺 / 納品形式等) の編集は本フォームには含まれません。大幅な変更が必要な場合は本案件を締切ってから再掲載してください。
        </p>
      </section>

      {/* 予算 + 締切 */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">
          見積もり・スケジュール
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="budget_min"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              予算 (下限・円)
            </label>
            <input
              id="budget_min"
              name="budget_min"
              type="number"
              min={0}
              max={9999999999}
              defaultValue={job.budget_min ?? ""}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
          </div>
          <div>
            <label
              htmlFor="budget_max"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              予算 (上限・円)
            </label>
            <input
              id="budget_max"
              name="budget_max"
              type="number"
              min={0}
              max={9999999999}
              defaultValue={job.budget_max ?? ""}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
          </div>
          <div>
            <label
              htmlFor="deadline"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              応募締切
            </label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={toInputDate(job.deadline)}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
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
              defaultValue={toInputDate(job.delivery_deadline)}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="rounded-pill border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-10 text-sm disabled:opacity-50"
        >
          {saving ? "保存中..." : "変更を保存"}
        </button>
      </div>
    </form>
  );
}
