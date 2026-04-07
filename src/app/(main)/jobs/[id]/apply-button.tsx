"use client";

import { useState } from "react";

export function ApplyButton({
  jobId,
  creatorId,
}: {
  jobId: string;
  creatorId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setSending(true);
    setError(null);

    const message = formData.get("message") as string;
    const proposed_price = formData.get("proposed_price") as string;

    const res = await fetch("/api/jobs/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        creatorId,
        message,
        proposed_price: proposed_price ? parseInt(proposed_price) : null,
      }),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setSending(false);
      return;
    }

    setDone(true);
    setSending(false);
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-bold text-[#222]">応募しました</p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="btn-primary w-full text-sm"
      >
        この案件に応募する
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
          提案メッセージ *
        </label>
        <textarea
          name="message"
          rows={4}
          required
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          placeholder="自己紹介、実績、この案件への意気込みなど"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
          提案金額（円・任意）
        </label>
        <input
          name="proposed_price"
          type="number"
          min={0}
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          placeholder="300000"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="btn-white flex-1 text-sm"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={sending}
          className="btn-primary flex-1 text-sm disabled:opacity-50"
        >
          {sending ? "送信中..." : "応募する"}
        </button>
      </div>
    </form>
  );
}
