"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import {
  GENRES,
  VIDEO_LENGTHS,
  STRENGTHS,
  MAX_STRENGTHS,
} from "@/lib/constants";
import type { CurrentUser } from "@/lib/supabase/queries";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const cp = user.creator_profile;
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    cp?.genres ?? []
  );
  const [selectedLengths, setSelectedLengths] = useState<string[]>(
    cp?.video_lengths ?? []
  );
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>(
    cp?.strengths ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleLength = (length: string) => {
    setSelectedLengths((prev) =>
      prev.includes(length)
        ? prev.filter((l) => l !== length)
        : [...prev, length]
    );
  };

  const toggleStrength = (s: string) => {
    setSelectedStrengths((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      // 最大2件まで
      if (prev.length >= MAX_STRENGTHS) return prev;
      return [...prev, s];
    });
  };

  const strengthsAtLimit =
    selectedStrengths.length >= MAX_STRENGTHS;

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    selectedGenres.forEach((g) => formData.append("genres", g));
    selectedLengths.forEach((l) => formData.append("video_lengths", l));
    selectedStrengths
      .slice(0, MAX_STRENGTHS)
      .forEach((s) => formData.append("strengths", s));
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
              表示名 <span className="text-red-500">*</span>
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              defaultValue={user.display_name}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
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
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
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
              className="w-32 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
            <span className="ml-2 text-sm text-[#828282]">年</span>
          </div>
        </div>
      </section>

      {/* Genres */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">得意ジャンル</h2>
        <p className="mb-4 text-sm text-[#828282]">
          該当するジャンルを選択してください(複数選択可)
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
                selectedGenres.includes(genre)
                  ? "border-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple text-white"
                  : "border-[#BDBDBD] text-[#4F4F4F] hover:border-neon-pink"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Video Lengths */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">得意映像尺</h2>
        <p className="mb-4 text-sm text-[#828282]">
          得意な動画の長さを選択してください(複数選択可)
        </p>
        <div className="flex flex-wrap gap-2">
          {VIDEO_LENGTHS.map((length) => (
            <button
              key={length}
              type="button"
              onClick={() => toggleLength(length)}
              className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
                selectedLengths.includes(length)
                  ? "border-neon-cyan bg-gradient-to-r from-neon-cyan to-neon-purple text-white"
                  : "border-[#BDBDBD] text-[#4F4F4F] hover:border-neon-cyan"
              }`}
            >
              {length}
            </button>
          ))}
        </div>
      </section>

      {/* Strengths */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-[#222]">強み</h2>
          <span
            className={`text-xs font-bold ${
              strengthsAtLimit ? "text-neon-pink" : "text-[#828282]"
            }`}
          >
            {selectedStrengths.length} / {MAX_STRENGTHS}
          </span>
        </div>
        <p className="mb-4 text-sm text-[#828282]">
          最大 {MAX_STRENGTHS} つまで選択できます。AIの中でも自分を選ぶ理由を絞り込みます。
        </p>
        <div className="flex flex-wrap gap-2">
          {STRENGTHS.map((s) => {
            const active = selectedStrengths.includes(s);
            const disabled = !active && strengthsAtLimit;
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStrength(s)}
                disabled={disabled}
                aria-pressed={active}
                className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-neon-pink bg-neon-pink text-white shadow-[0_0_14px_rgba(255,77,157,0.4)]"
                    : disabled
                      ? "cursor-not-allowed border-[#E0E0E0] text-[#BDBDBD] opacity-60"
                      : "border-[#BDBDBD] text-[#4F4F4F] hover:border-neon-pink"
                }`}
                title={disabled ? `最大${MAX_STRENGTHS}つまで` : undefined}
              >
                {s}
              </button>
            );
          })}
        </div>
        {strengthsAtLimit && (
          <p className="mt-3 text-xs text-neon-purple-deep">
            ✓ {MAX_STRENGTHS}つ選択済み。変更する場合はチェック済みを外してください。
          </p>
        )}
      </section>

      {/* Bio (最下部) */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">自己紹介</h2>
        <p className="mb-4 text-sm text-[#828282]">
          あなたの強み・使用AIツール・実績・制作への想いなどを記入してください
        </p>
        <textarea
          name="bio"
          rows={6}
          defaultValue={cp?.bio ?? ""}
          placeholder="例: 元・広告代理店プランナー。Meta広告のAB案を1週間で50案出すスタイル。Sora 2 + Runway での合成編集が得意で、コスメD2C・SaaS業界での実績多数。"
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
        />
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
