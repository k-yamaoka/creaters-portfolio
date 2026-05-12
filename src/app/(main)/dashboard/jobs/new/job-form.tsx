"use client";

import { useState } from "react";
import { createJob } from "./actions";
import {
  GENRES,
  EDIT_WORK_TYPES,
  EDIT_SOFTWARE_OPTIONS,
  EDIT_DELIVERY_FORMATS,
  CLIENT_TYPES,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

function toNum(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function JobForm() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitPrice, setUnitPrice] = useState("");
  const [countMin, setCountMin] = useState("");
  const [countMax, setCountMax] = useState("");

  // 編集要件 state
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [software, setSoftware] = useState<string[]>([]);
  const [deliveryFormats, setDeliveryFormats] = useState<string[]>([]);
  const [finishUnit, setFinishUnit] = useState<"sec" | "min">("sec");
  const [isRecurring, setIsRecurring] = useState(false);

  const toggleIn = (
    arr: string[],
    setArr: (v: string[]) => void,
    value: string
  ) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const u = toNum(unitPrice);
  const cMin = toNum(countMin);
  const cMax = toNum(countMax);
  // 上限が未入力なら下限と同じ本数として扱う
  const effectiveMaxCount = cMax ?? cMin;

  const budgetMin = u !== null && cMin !== null ? u * cMin : null;
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
    workTypes.forEach((w) => formData.append("work_types", w));
    software.forEach((s) => formData.append("software_options", s));
    deliveryFormats.forEach((f) => formData.append("delivery_formats", f));
    formData.set("finish_duration_unit", finishUnit);
    formData.set("is_recurring", isRecurring ? "1" : "");
    const result = await createJob(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  };

  const canSubmit =
    !saving &&
    selectedGenres.length > 0 &&
    workTypes.length > 0 &&
    deliveryFormats.length > 0;

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Title & Description */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">基本情報</h2>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              案件タイトル *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={50}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="例: 新商品のプロモーション動画制作（50文字以内）"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              案件詳細 *
            </label>
            <textarea
              id="description"
              name="description"
              rows={8}
              required
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder={"制作したい動画の詳細を記入してください。\n\n・動画の目的や用途\n・ターゲット視聴者\n・動画の長さ\n・希望するテイストや参考動画\n・素材の有無（撮影が必要か等）\n・その他の要件"}
            />
          </div>
        </div>
      </section>

      {/* Genre selection */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">制作ジャンル *</h2>
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
                    ? "border-primary-500 bg-primary-50 text-primary-500"
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
                      ? "border-primary-500 bg-primary-500"
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
      </section>

      {/* 編集要件 */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">編集要件</h2>
        <p className="mb-6 text-sm text-[#828282]">
          クリエイターが見積もり・応募判断に使う重要情報です。応募後もメッセージ画面に常に表示されます。
        </p>
        <div className="space-y-6">
          {/* 素材時間 */}
          <div>
            <label
              htmlFor="footage_minutes"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              素材時間（約◯分） *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#828282]">約</span>
              <input
                id="footage_minutes"
                name="footage_minutes"
                type="number"
                min={1}
                required
                className="w-32 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="30"
              />
              <span className="text-sm text-[#828282]">分</span>
            </div>
          </div>

          {/* 完成尺 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium text-[#4F4F4F]">
                完成尺 *
              </label>
              <div className="flex overflow-hidden rounded-lg border border-[#E0E0E0] text-xs">
                <button
                  type="button"
                  onClick={() => setFinishUnit("sec")}
                  className={`px-3 py-1.5 ${
                    finishUnit === "sec"
                      ? "bg-primary-500 text-white"
                      : "bg-white text-[#4F4F4F] hover:bg-[#F8F8F8]"
                  }`}
                >
                  秒
                </button>
                <button
                  type="button"
                  onClick={() => setFinishUnit("min")}
                  className={`px-3 py-1.5 ${
                    finishUnit === "min"
                      ? "bg-primary-500 text-white"
                      : "bg-white text-[#4F4F4F] hover:bg-[#F8F8F8]"
                  }`}
                >
                  分
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                name="finish_duration_min"
                type="number"
                min={0}
                step={finishUnit === "sec" ? 1 : 0.5}
                required
                className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder={finishUnit === "sec" ? "30" : "3"}
              />
              <span className="text-sm text-[#828282]">〜</span>
              <input
                name="finish_duration_max"
                type="number"
                min={0}
                step={finishUnit === "sec" ? 1 : 0.5}
                required
                className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder={finishUnit === "sec" ? "60" : "5"}
              />
              <span className="text-sm text-[#828282]">
                {finishUnit === "sec" ? "秒" : "分"}
              </span>
            </div>
          </div>

          {/* 本数 (発注本数の最低・上限) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
              本数 *
            </label>
            <div className="flex items-center gap-2">
              <input
                id="count_min"
                name="count_min"
                type="number"
                min={1}
                required
                value={countMin}
                onChange={(e) => setCountMin(e.target.value)}
                className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="1"
              />
              <span className="text-sm text-[#828282]">〜</span>
              <input
                id="count_max"
                name="count_max"
                type="number"
                min={1}
                value={countMax}
                onChange={(e) => setCountMax(e.target.value)}
                className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="未指定なら下限と同数"
              />
              <span className="text-sm text-[#828282]">本</span>
            </div>
            <p className="mt-1 text-xs text-[#828282]">
              範囲指定したい場合は上限を入力。1本単価 × 本数で見積もりが自動算出されます
            </p>
          </div>

          {/* 作業 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
              作業内容 *（複数選択可）
            </label>
            <div className="flex flex-wrap gap-2">
              {EDIT_WORK_TYPES.map((w) => {
                const isActive = workTypes.includes(w);
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => toggleIn(workTypes, setWorkTypes, w)}
                    className={`rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 修正回数 */}
          <div>
            <label
              htmlFor="revision_count"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              修正回数 *
            </label>
            <div className="flex items-center gap-2">
              <input
                id="revision_count"
                name="revision_count"
                type="number"
                min={0}
                required
                className="w-32 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="2"
              />
              <span className="text-sm text-[#828282]">回</span>
            </div>
          </div>

          {/* 使用ソフト */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
              使用ソフト（任意・複数選択可）
            </label>
            <div className="flex flex-wrap gap-2">
              {EDIT_SOFTWARE_OPTIONS.map((s) => {
                const isActive = software.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleIn(software, setSoftware, s)}
                    className={`rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 納品形式 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
              納品形式 *（複数選択可）
            </label>
            <div className="flex flex-wrap gap-2">
              {EDIT_DELIVERY_FORMATS.map((f) => {
                const isActive = deliveryFormats.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() =>
                      toggleIn(deliveryFormats, setDeliveryFormats, f)
                    }
                    className={`rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 納期 (素材受け取りから) */}
          <div>
            <label
              htmlFor="delivery_days"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              納期（素材受け取りから） *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#828282]">素材受け取りから</span>
              <input
                id="delivery_days"
                name="delivery_days"
                type="number"
                min={1}
                required
                className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="7"
              />
              <span className="text-sm text-[#828282]">日</span>
            </div>
          </div>

          {/* 参考動画URL */}
          <div>
            <label
              htmlFor="reference_url"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              参考動画URL（任意）
            </label>
            <input
              id="reference_url"
              name="reference_url"
              type="url"
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="https://youtube.com/..."
            />
          </div>

          {/* 月間本数トグル */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
              発注形態（任意）
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                className={`rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors ${
                  !isRecurring
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
                }`}
              >
                単発
              </button>
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                className={`rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors ${
                  isRecurring
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
                }`}
              >
                継続案件
              </button>
            </div>
            {isRecurring && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-[#828282]">月</span>
                <input
                  name="monthly_count"
                  type="number"
                  min={1}
                  className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="4"
                />
                <span className="text-sm text-[#828282]">本</span>
              </div>
            )}
          </div>

          {/* クライアント種別 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
              クライアント種別（任意）
            </label>
            <div className="flex flex-wrap gap-2">
              {CLIENT_TYPES.map((t) => (
                <label
                  key={t.value}
                  className="flex cursor-pointer items-center gap-2 rounded-pill border border-[#E0E0E0] px-4 py-1.5 text-sm font-medium text-[#4F4F4F] hover:border-primary-500"
                >
                  <input
                    type="radio"
                    name="client_type"
                    value={t.value}
                    className="h-4 w-4 border-[#E0E0E0] text-primary-500 focus:ring-primary-500"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Budget & Dates */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">見積もり・スケジュール</h2>
        <div className="space-y-5">
          {/* 1本単価 */}
          <div>
            <label
              htmlFor="unit_price"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              1本あたりの単価（円） *
            </label>
            <input
              id="unit_price"
              name="unit_price"
              type="number"
              min={0}
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="50000"
            />
            <p className="mt-1 text-xs text-[#828282]">
              動画1本あたりの概算単価を入力してください
            </p>
          </div>

          {/* 単価 × 本数 → 自動集計の見積もり */}
          {(budgetMin !== null || budgetMax !== null) && (
            <div className="rounded-lg bg-primary-50 px-4 py-4">
              <p className="text-xs text-[#828282]">見積もり金額（自動集計）</p>
              <p className="mt-1 text-lg font-bold text-primary-600">
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

          {/* createJob actions.ts への送信用 hidden inputs */}
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
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Submit */}
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
