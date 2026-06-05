"use client";

import { useCallback, useState } from "react";
import { createJob } from "./actions";
import { GENRES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { EditingRequirementsFields } from "@/components/jobs/editing-requirements-fields";
import { VisualStyleSelector } from "@/components/jobs/visual-style-selector";
import { DateFieldWithCalendar } from "@/components/jobs/date-field-with-calendar";

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
  // 入力は「全体見積もり (budget)」に変更。1 本単価は本数下限から自動算出する。
  const [budgetInput, setBudgetInput] = useState("");
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

  const totalBudget = toNum(budgetInput);
  const effectiveMaxCount = countMax ?? countMin;

  // 1 本あたり単価 = 全体見積もり / 本数。
  // 範囲 (min/max) が違う場合は単価レンジ (高い〜安い) を返す。
  //   - 高い側: budget / min (本数少なめのときの単価)
  //   - 安い側: budget / max (本数多めのときの単価)
  const unitHigh =
    totalBudget !== null && countMin !== null && countMin > 0
      ? Math.floor(totalBudget / countMin)
      : null;
  const unitLow =
    totalBudget !== null &&
    effectiveMaxCount !== null &&
    effectiveMaxCount > 0
      ? Math.floor(totalBudget / effectiveMaxCount)
      : null;

  // 送信用 (1 本単価): 範囲があれば最小値 (= unitLow) を保存。
  // サーバの LIMITS.UNIT_PRICE (9,999,999) でも検証される。
  const computedUnitPrice = unitLow ?? unitHigh;
  // 全体見積もりは budget_min = budget_max = totalBudget で保存。
  const budgetForSave = totalBudget;

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

  // 全体見積もり と 本数下限が決まらないと unit_price を確定できないため、
  // 単価が算出済 (= computedUnitPrice が出ている) ことを送信条件に含める。
  const canSubmit =
    !saving && genresFilled && editingValid && computedUnitPrice !== null;

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 案件タイトル — 旧「基本情報」セクションを撤去し、タイトル単独で
          ページ最上部の主役として強調 (大きめラベル + 余白広め) */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <label
          htmlFor="title"
          className="mb-3 flex items-center text-lg font-bold text-[#222]"
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
          className="w-full rounded-lg border-2 border-[#E0E0E0] px-4 py-4 text-base font-medium outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
          placeholder="例: 新商品のプロモーション動画制作（50文字以内）"
        />
      </section>

      {/* 想定するビジュアル — タイル UI のスタイル選択 (タイトル直下に配置) */}
      <VisualStyleSelector />

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
          {/* 「その他」も他のジャンルタイルと同じ見た目・同じ高さに揃える */}
          <button
            type="button"
            onClick={() => setGenresOtherShow((v) => !v)}
            className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
              genresOtherShow
                ? "border-neon-pink bg-neon-purple/10 text-neon-purple-deep"
                : "border-[#E0E0E0] text-[#4F4F4F] hover:border-[#BDBDBD]"
            }`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                genresOtherShow
                  ? "border-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple"
                  : "border-[#BDBDBD]"
              }`}
            >
              {genresOtherShow && (
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
            <span className="font-medium">その他</span>
          </button>
        </div>
        {genresOtherShow && (
          <input
            type="text"
            value={genresOther}
            onChange={(e) => setGenresOther(e.target.value)}
            className="mt-3 w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            placeholder="自由入力（例: 学校紹介、医療系インタビュー など）"
            maxLength={60}
          />
        )}
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
          {/* 全体見積もり (入力) — 入力すると 1 本単価を自動算出する */}
          <div>
            <label
              htmlFor="total_budget"
              className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
            >
              全体見積もり（円）
              <RequiredMark />
            </label>
            <input
              id="total_budget"
              type="number"
              inputMode="numeric"
              min={0}
              max={9999999999}
              required
              value={budgetInput}
              onChange={(e) =>
                setBudgetInput(
                  e.target.value.replace(/[^0-9]/g, "").slice(0, 10)
                )
              }
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
              placeholder="500000"
            />
          </div>

          {/* 自動算出: 1 本あたりの単価 */}
          {(unitHigh !== null || unitLow !== null) && (
            <div className="rounded-lg bg-neon-purple/10 px-4 py-4">
              <p className="text-xs text-[#828282]">1 本あたりの単価（自動算出）</p>
              <p className="mt-1 text-lg font-bold text-neon-purple-deep">
                {unitHigh !== null && unitLow !== null && unitHigh === unitLow
                  ? formatPrice(unitHigh)
                  : unitHigh !== null && unitLow !== null
                    ? `${formatPrice(unitLow)} 〜 ${formatPrice(unitHigh)}`
                    : `${formatPrice((unitHigh ?? unitLow)!)}`}
              </p>
              <p className="mt-1 text-[11px] text-[#828282]">
                全体見積もり ÷ 発注本数 で自動算出。実際の支払いは発注本数で確定します。
              </p>
            </div>
          )}
          {totalBudget !== null && countMin === null && (
            <p className="text-xs text-[#828282]">
              ※ 「本数」を入力すると 1 本あたりの単価が自動算出されます。
            </p>
          )}

          {/* hidden: サーバへは budget と unit_price を別々に送る */}
          <input
            type="hidden"
            name="unit_price"
            value={computedUnitPrice !== null ? String(computedUnitPrice) : ""}
          />
          <input
            type="hidden"
            name="budget_min"
            value={budgetForSave !== null ? String(budgetForSave) : ""}
          />
          <input
            type="hidden"
            name="budget_max"
            value={budgetForSave !== null ? String(budgetForSave) : ""}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateFieldWithCalendar
              id="deadline"
              name="deadline"
              label="応募締切日"
            />
            <DateFieldWithCalendar
              id="delivery_deadline"
              name="delivery_deadline"
              label="納品希望日"
            />
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
