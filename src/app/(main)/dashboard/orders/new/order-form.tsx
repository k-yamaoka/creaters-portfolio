"use client";

import { useCallback, useState } from "react";
import { createOrder } from "../actions";
import { EditingRequirementsFields } from "@/components/jobs/editing-requirements-fields";

function RequiredMark() {
  return (
    <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
      必須
    </span>
  );
}

export function OrderForm({
  creatorId,
}: {
  creatorId: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingValid, setEditingValid] = useState(false);

  const handleValidityChange = useCallback((valid: boolean) => {
    setEditingValid(valid);
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    const result = await createOrder(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  };

  const canSubmit = !saving && editingValid;

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="creator_id" value={creatorId} />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 依頼内容 */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">依頼内容</h2>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
            >
              依頼タイトル
              <RequiredMark />
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={50}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
              placeholder="例: 新商品紹介動画の制作依頼（50文字以内）"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
            >
              依頼内容の詳細
              <RequiredMark />
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              required
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
              placeholder={
                "編集要件で書ききれない補足や、依頼の背景・目的などを自由に記入してください。\n\n例:\n・動画の目的や用途\n・ターゲット視聴者\n・希望するテイストや参考動画\n・素材の有無（撮影が必要か等）\n・希望納期"
              }
            />
          </div>
        </div>
      </section>

      {/* 編集要件 */}
      <EditingRequirementsFields onValidityChange={handleValidityChange} />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary px-10 text-sm disabled:opacity-50"
        >
          {saving ? "送信中..." : "依頼を送信する"}
        </button>
      </div>
    </form>
  );
}
