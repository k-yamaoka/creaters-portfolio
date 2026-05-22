"use client";

import { useCallback, useState } from "react";
import { createJob } from "./actions";
import { GENRES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { EditingRequirementsFields } from "@/components/jobs/editing-requirements-fields";

function toNum(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function RequiredMark() {
  return (
    <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
      必須
    </span>
  );
}

export function JobForm() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitPrice, setUnitPrice] = useState("");
  const [countMin, setCountMin] = useState<number | null>(null);
  const [countMax, setCountMax] = useState<number | null>(null);
  const [editingValid, setEditingValid] = useState(false);

  const [genresOtherShow, setGenresOtherShow] = useState(false);
  const [genresOther, setGenresOther] = useState("");

  const handleCountChange = useCallback((min: number | null, max: number | null) => {
    setCountMin(min);
    setCountMax(max);
  }, []);

  const handleValidityChange = useCallback((valid: boolean) => {
    setEditingValid(valid);
  }, []);

  const u = toNum(unitPrice);
  const effectiveMaxCount = countMax ?? countMin;

  const budgetMin = u !== null && countMin !== null ? u * countMin : null;
  const budgetMax =
    u !== null && effectiveMaxCount !== null ? u * effectiveMaxCount : null;

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);

    selectedGenres.forEach((g) => formData.append("genres", g));
    if (genresOtherShow && genresOther.trim()) {
      formData.append("genres", genresOther.trim());
    }

    const result = await createJob(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  };

  const genresFilled =
    selectedGenres.length > 0 ||
    (genresOtherShow && genresOther.trim().length > 0);

  const canSubmit = !saving && genresFilled && editingValid;

  const pillClass = (active: boolean) =>
    `rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple text-white"
        : "border-[#E0E0E0] text-[#4F4F4F] hover:border-neon-pink hover:text-neon-pink"
    }`;

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 基本情報 (タイトルのみ) */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">基本情報</h2>
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
          >
            案件タイトル
            <RequiredMark />
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={50}
            className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            placeholder="例: 新商品のプロモーション動画制作（50文字以内）"
          />
        </div>
      </section>

      {/* 制作ジャンル */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 flex items-center text-lg font-bold text-[#222]">
          制作ジャンル
          <RequiredMark />
        </h2>
        <p className="mb-4 text-sm text-[#828282]">
          該当するジャンルを選択してください（複数選択可）
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <label
                key={genre}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
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
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    isSelected
                      ? "border-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple"
                      : "border-[#BDBDBD]"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3 text-white"
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
                <span className="font-medium">{genre}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setGenresOtherShow((v) => !v)}
            className={pillClass(genresOtherShow)}
          >
            + その他
          </button>
          {genresOtherShow && (
            <input
              type="text"
              value={genresOther}
              onChange={(e) => setGenresOther(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[#E0E0E0] px-4 py-2.5 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
              placeholder="自由入力（例: 学校紹介、医療系インタビュー など）"
              maxLength={60}
            />
          )}
        </div>
      </section>

      {/* 編集要件 */}
      <EditingRequirementsFields
        onCountChange={handleCountChange}
        onValidityChange={handleValidityChange}
      />

      {/* 案件詳細 (フリーテキスト) */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 flex items-center text-lg font-bold text-[#222]">
          案件詳細
          <RequiredMark />
        </h2>
        <p className="mb-4 text-sm text-[#828282]">
          編集要件で書ききれない補足や、案件の背景・目的などを自由に記入してください。
        </p>
        <textarea
          id="description"
          name="description"
          rows={10}
          required
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
          placeholder={
            "例:\n・動画の目的や配信先\n・ターゲット視聴者\n・希望するテイストや参考動画\n・素材の有無（撮影が必要か等）\n・その他の要件"
          }
        />
      </section>

      {/* 見積もり・スケジュール */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">見積もり・スケジュール</h2>
        <div className="space-y-5">
          {/* 1本単価 */}
          <div>
            <label
              htmlFor="unit_price"
              className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
            >
              1本あたりの単価（円）
              <RequiredMark />
            </label>
            <input
              id="unit_price"
              name="unit_price"
              type="number"
              inputMode="numeric"
              min={0}
              max={999999}
              required
              value={unitPrice}
              onChange={(e) =>
                setUnitPrice(
                  e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
                )
              }
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
              placeholder="50000"
            />
            <p className="mt-1 text-xs text-[#828282]">
              ※ 半角数字6桁まで（最大 999,999 円）。動画1本あたりの概算単価を入力してください。
            </p>
          </div>

          {/* 単価 × 本数 → 自動集計 */}
          {(budgetMin !== null || budgetMax !== null) && (
            <div className="rounded-lg bg-neon-purple/10 px-4 py-4">
              <p className="text-xs text-[#828282]">見積もり金額（自動集計）</p>
              <p className="mt-1 text-lg font-bold text-neon-purple-deep">
                {budgetMin !== null && budgetMax !== null && budgetMin === budgetMax
                  ? formatPrice(budgetMin)
                  : budgetMin !== null && budgetMax !== null
                    ? `${formatPrice(budgetMin)} 〜 ${formatPrice(budgetMax)}`
                    : budgetMin !== null
                      ? `${formatPrice(budgetMin)}〜`
                      : `〜 ${formatPrice(budgetMax!)}`}
              </p>
              <p className="mt-1 text-[11px] text-[#828282]">
                1本単価 × 発注本数 で自動算出
              </p>
            </div>
          )}

          <input
            type="hidden"
            name="budget_min"
            value={budgetMin !== null ? String(budgetMin) : ""}
          />
          <input
            type="hidden"
            name="budget_max"
            value={budgetMax !== null ? String(budgetMax) : ""}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="deadline"
                className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
              >
                応募締切日
              </label>
              <input
                id="deadline"
                name="deadline"
                type="date"
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
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary px-10 text-sm disabled:opacity-50"
        >
          {saving ? "作成中..." : "案件を掲載する"}
        </button>
      </div>
    </form>
  );
}
