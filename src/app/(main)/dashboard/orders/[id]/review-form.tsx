"use client";

import { useState } from "react";

export function ReviewForm({
  orderId,
  creatorId,
  clientId,
}: {
  orderId: string;
  creatorId: string;
  clientId: string;
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (formData: FormData) => {
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

      {/* Star rating */}
      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-[#4F4F4F]">
          評価 *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <svg
                className={`h-8 w-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "text-[#FFB74D]"
                    : "text-[#E0E0E0]"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 self-center text-sm font-bold text-[#222]">
            {rating}.0
          </span>
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
        disabled={saving}
        className="btn-primary mt-4 w-full text-sm disabled:opacity-50"
      >
        {saving ? "投稿中..." : "レビューを投稿する"}
      </button>
    </form>
  );
}
