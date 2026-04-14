"use client";

import { useState } from "react";
import { RATING_LEVELS } from "@/lib/constants";

export function ReviewForm({
  orderId,
  creatorId,
  clientId,
}: {
  orderId: string;
  creatorId: string;
  clientId: string;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    if (!rating) {
      setError("評価を選択してください");
      return;
    }

    setSaving(true);
    setError(null);

    const comment = formData.get("comment") as string;

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        creatorId,
        clientId,
        rating,
        comment,
      }),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setSaving(false);
      return;
    }

    setDone(true);
    setSaving(false);
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-card text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-bold text-[#222]">レビューを投稿しました</p>
        <p className="mt-1 text-xs text-[#828282]">ご協力ありがとうございます</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="rounded-2xl bg-white p-6 shadow-card">
      <h2 className="text-lg font-bold text-[#222]">レビューを投稿</h2>
      <p className="mt-1 text-sm text-[#828282]">
        クリエイターへの評価をお願いします
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 3-level emoji rating */}
      <div className="mt-4">
        <label className="mb-3 block text-sm font-medium text-[#4F4F4F]">
          評価 *
        </label>
        <div className="flex gap-3">
          {RATING_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setRating(level.value)}
              className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-all ${
                rating === level.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-[#E0E0E0] hover:border-[#BDBDBD]"
              }`}
            >
              <span className="text-3xl">{level.emoji}</span>
              <span
                className={`text-sm font-medium ${
                  rating === level.value ? "text-primary-500" : "text-[#4F4F4F]"
                }`}
              >
                {level.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
          コメント
        </label>
        <textarea
          name="comment"
          rows={4}
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          placeholder="クリエイターの仕事ぶり、コミュニケーション、成果物の品質などについて"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !rating}
        className="btn-primary mt-4 w-full text-sm disabled:opacity-50"
      >
        {saving ? "投稿中..." : "レビューを投稿する"}
      </button>
    </form>
  );
}
