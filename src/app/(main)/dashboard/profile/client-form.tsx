"use client";

import { useState } from "react";
import { updateClientProfile } from "./actions";
import type { CurrentUser } from "@/lib/supabase/queries";

export function ClientForm({ user }: { user: CurrentUser }) {
  const cp = user.client_profile;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    const result = await updateClientProfile(formData);
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
              担当者名 *
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
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              disabled
              value={user.email}
              className="w-full rounded-lg border border-[#E0E0E0] bg-[#F8F8F8] px-4 py-3 text-sm text-[#828282]"
            />
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">企業情報</h2>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="company_name"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              会社名
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              defaultValue={cp?.company_name ?? ""}
              placeholder="例: 株式会社サンプル"
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="company_url"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              会社URL
            </label>
            <input
              id="company_url"
              name="company_url"
              type="url"
              defaultValue={cp?.company_url ?? ""}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="industry"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              業種
            </label>
            <select
              id="industry"
              name="industry"
              defaultValue={cp?.industry ?? ""}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="">選択してください</option>
              <option value="IT・通信">IT・通信</option>
              <option value="広告・マーケティング">広告・マーケティング</option>
              <option value="メディア・エンタメ">メディア・エンタメ</option>
              <option value="製造業">製造業</option>
              <option value="小売・EC">小売・EC</option>
              <option value="飲食・サービス">飲食・サービス</option>
              <option value="不動産・建設">不動産・建設</option>
              <option value="医療・ヘルスケア">医療・ヘルスケア</option>
              <option value="教育">教育</option>
              <option value="金融・保険">金融・保険</option>
              <option value="官公庁・団体">官公庁・団体</option>
              <option value="その他">その他</option>
            </select>
          </div>
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
