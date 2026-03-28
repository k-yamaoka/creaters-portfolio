"use client";

import { useState } from "react";
import { addPackage, deletePackage, togglePackageActive } from "./actions";
import { formatPrice } from "@/lib/utils";

type ServicePackage = {
  id: string;
  name: string;
  description: string;
  price: number;
  delivery_days: number;
  revisions: number;
  features: string[];
  is_active: boolean;
  created_at: string;
};

export function PackageManager({ packages }: { packages: ServicePackage[] }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    const result = await addPackage(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await togglePackageActive(id, !currentActive);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このプランを削除しますか？")) return;
    const result = await deletePackage(id);
    if (result?.error) setError(result.error);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-primary text-sm"
        >
          + プランを追加
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <form
          action={handleAdd}
          className="rounded-2xl bg-white p-6 shadow-card sm:p-8"
        >
          <h2 className="mb-6 text-lg font-bold text-[#222]">
            新しい料金プラン
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  プラン名 *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="例: スタンダード"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  料金（円） *
                </label>
                <input
                  name="price"
                  type="number"
                  required
                  min={0}
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="300000"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                説明 *
              </label>
              <input
                name="description"
                type="text"
                required
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="例: 企業紹介動画（3分以内）"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  納期（日） *
                </label>
                <input
                  name="delivery_days"
                  type="number"
                  required
                  min={1}
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="14"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                  修正回数 *
                </label>
                <input
                  name="revisions"
                  type="number"
                  required
                  min={0}
                  className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
                含まれる内容（1行に1つ）
              </label>
              <textarea
                name="features"
                rows={4}
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder={"企画構成\n撮影1日\n編集\nBGM選定\n修正2回"}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-white text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? "追加中..." : "追加する"}
            </button>
          </div>
        </form>
      )}

      {/* Package list */}
      {packages.length === 0 && !showForm ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-card">
          <svg
            className="mx-auto h-12 w-12 text-[#E0E0E0]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-bold text-[#222]">
            まだプランがありません
          </h3>
          <p className="mt-2 text-sm text-[#828282]">
            「プランを追加」ボタンから料金プランを作成しましょう
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl bg-white p-6 shadow-card ${
                !pkg.is_active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-[#222]">
                      {pkg.name}
                    </h3>
                    {!pkg.is_active && (
                      <span className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#828282]">
                        非公開
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#828282]">
                    {pkg.description}
                  </p>
                </div>
                <p className="text-xl font-bold text-primary-500">
                  {formatPrice(pkg.price)}
                </p>
              </div>

              <div className="mt-3 flex gap-4 text-xs text-[#828282]">
                <span>納期 {pkg.delivery_days}日</span>
                <span>修正 {pkg.revisions}回</span>
              </div>

              {pkg.features.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pkg.features.map((f) => (
                    <span
                      key={f}
                      className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#4F4F4F]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-3 border-t border-[#F2F2F2] pt-4">
                <button
                  type="button"
                  onClick={() => handleToggle(pkg.id, pkg.is_active)}
                  className="text-sm text-[#828282] hover:text-[#4F4F4F]"
                >
                  {pkg.is_active ? "非公開にする" : "公開する"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(pkg.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
