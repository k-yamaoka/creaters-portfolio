"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import { GENRES, SKILLS } from "@/lib/constants";
import type { CurrentUser } from "@/lib/supabase/queries";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const cp = user.creator_profile;
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    cp?.genres ?? []
  );
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
    // Append selected genres
    selectedGenres.forEach((g) => formData.append("genres", g));
    const result = await updateProfile(formData);
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

      {/* Basic Info */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">基本情報</h2>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="display_name"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              表示名 *
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              defaultValue={user.display_name}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              所在地
            </label>
            <input
              id="location"
              name="location"
              type="text"
              defaultValue={cp?.location ?? ""}
              placeholder="例: 東京都"
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="years_of_experience"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              経験年数
            </label>
            <input
              id="years_of_experience"
              name="years_of_experience"
              type="number"
              min={0}
              max={50}
              defaultValue={cp?.years_of_experience ?? 0}
              className="w-32 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-[#828282]">年</span>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">自己紹介</h2>
        <textarea
          name="bio"
          rows={5}
          defaultValue={cp?.bio ?? ""}
          placeholder="あなたの経歴、得意分野、制作への想いなどを書いてください"
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </section>

      {/* Genres */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">得意ジャンル</h2>
        <p className="mb-4 text-sm text-[#828282]">
          該当するジャンルを選択してください（複数選択可）
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
                selectedGenres.includes(genre)
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-[#BDBDBD] text-[#4F4F4F] hover:border-primary-500"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">スキル</h2>
        <p className="mb-4 text-sm text-[#828282]">
          カンマ区切りで入力してください
        </p>
        <input
          name="skills"
          type="text"
          defaultValue={cp?.skills?.join(", ") ?? ""}
          placeholder="例: Premiere Pro, After Effects, カラーグレーディング"
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SKILLS.map((skill) => (
            <span
              key={skill}
              className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#828282]"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-10 text-sm disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
