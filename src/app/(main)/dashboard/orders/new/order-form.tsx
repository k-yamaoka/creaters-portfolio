"use client";

import { useState } from "react";
import { createOrder } from "../actions";

export function OrderForm({
  creatorId,
  packageId,
}: {
  creatorId: string;
  packageId: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    const result = await createOrder(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  };

  return (
    <form action={handleSubmit} className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
      <input type="hidden" name="creator_id" value={creatorId} />
      <input type="hidden" name="package_id" value={packageId} />

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
          >
            依頼タイトル *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="例: 新商品紹介動画の制作依頼"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
          >
            依頼内容の詳細 *
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder={"制作したい動画の詳細を記入してください。\n\n例:\n・動画の目的や用途\n・ターゲット視聴者\n・希望するテイストや参考動画\n・素材の有無（撮影が必要か等）\n・希望納期"}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-10 text-sm disabled:opacity-50"
        >
          {saving ? "送信中..." : "依頼を送信する"}
        </button>
      </div>
    </form>
  );
}
