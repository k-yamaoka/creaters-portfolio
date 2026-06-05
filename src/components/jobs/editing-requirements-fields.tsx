"use client";

import { useEffect, useState } from "react";
import {
  EDIT_SOFTWARE_OPTIONS,
  EDIT_DELIVERY_FORMATS,
  CLIENT_TYPES,
} from "@/lib/constants";

/**
 * 完成尺バケット (finish_duration_unit="min" 固定 で min/max のレンジを送る)
 */
const FINISH_DURATION_BUCKETS = [
  { v: "0-1", min: "", max: "1", label: "〜1分" },
  { v: "1-5", min: "1", max: "5", label: "1分〜5分" },
  { v: "5-10", min: "5", max: "10", label: "5分〜10分" },
  { v: "10+", min: "10", max: "", label: "10分以上" },
] as const;

function RequiredMark() {
  return (
    <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
      必須
    </span>
  );
}

function toNum(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * 数字以外を弾き、桁数を制限する onInput ハンドラを返す。
 */
function digitsOnly(maxDigits: number) {
  return (e: React.FormEvent<HTMLInputElement>) => {
    const t = e.currentTarget;
    const cleaned = t.value.replace(/[^0-9]/g, "").slice(0, maxDigits);
    if (t.value !== cleaned) t.value = cleaned;
  };
}

type Props = {
  /** 本数 (count_min/count_max) の変化を親に通知 */
  onCountChange?: (countMin: number | null, countMax: number | null) => void;
  /** 必須項目 (納品形式 + 参考URL 1件以上) が埋まっているかを親に通知 */
  onValidityChange?: (valid: boolean) => void;
};

/**
 * jobs/new と orders/new で共有する「編集要件」フォーム部分。
 *
 * 2026-06-03 簡素化:
 * - 削除: 素材時間 / 作業内容 / 修正回数 / 納期
 * - 使用ソフトは AI 生成系 (Seedance / Veo / Sora / Runway / google omni /
 *   Kling AI / Hailuo AI / Pika) + その他自由記入 に刷新
 * - 参考動画URL を **必須** 化 (注意書きで 3 件以上推奨)
 */
export function EditingRequirementsFields({ onCountChange, onValidityChange }: Props) {
  const [software, setSoftware] = useState<string[]>([]);
  const [deliveryFormats, setDeliveryFormats] = useState<string[]>([]);
  const [finishBucket, setFinishBucket] = useState<string>("");
  // 参考動画URL: 複数行
  const [referenceUrls, setReferenceUrls] = useState<string[]>([""]);
  // null = 未選択 / "single" = 単発 / "recurring" = 継続案件
  const [orderType, setOrderType] = useState<"single" | "recurring" | null>(null);
  const [recurringFreq, setRecurringFreq] = useState<"specified" | "tbd">("specified");

  const currentFinishBucket = FINISH_DURATION_BUCKETS.find(
    (b) => b.v === finishBucket
  );

  const [softwareOtherShow, setSoftwareOtherShow] = useState(false);
  const [softwareOther, setSoftwareOther] = useState("");
  const [deliveryFormatsOtherShow, setDeliveryFormatsOtherShow] = useState(false);
  const [deliveryFormatsOther, setDeliveryFormatsOther] = useState("");

  const [clientTypeChoice, setClientTypeChoice] = useState<string>("");
  const [clientTypeOther, setClientTypeOther] = useState("");

  const [countMin, setCountMin] = useState("");
  const [countMax, setCountMax] = useState("");

  const toggleIn = (
    arr: string[],
    setArr: (v: string[]) => void,
    value: string
  ) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const pillClass = (active: boolean) =>
    `rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-primary-500 bg-primary-500 text-white"
        : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500 hover:text-primary-500"
    }`;

  const deliveryFormatsFilled =
    deliveryFormats.length > 0 ||
    (deliveryFormatsOtherShow && deliveryFormatsOther.trim().length > 0);

  // 参考URL の有効件数 (空白除去後 1 件以上)
  const validReferenceUrls = referenceUrls
    .map((u) => u.trim())
    .filter(Boolean);
  const referenceUrlsFilled = validReferenceUrls.length >= 1;

  useEffect(() => {
    onValidityChange?.(deliveryFormatsFilled && referenceUrlsFilled);
  }, [deliveryFormatsFilled, referenceUrlsFilled, onValidityChange]);

  useEffect(() => {
    onCountChange?.(toNum(countMin), toNum(countMax));
  }, [countMin, countMax, onCountChange]);

  const resolvedClientType =
    clientTypeChoice === "other" ? clientTypeOther.trim() : clientTypeChoice;

  // 入力欄サイズ統一: 全てのテキスト/select 入力で共通クラスを使う
  const fieldInputClass =
    "w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500";

  return (
    <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
      <h2 className="mb-2 text-lg font-bold text-[#222]">編集要件</h2>
      <p className="mb-6 text-sm text-[#828282]">
        クリエイターが見積もり・対応判断に使う重要情報です。依頼後もメッセージ画面に常に表示されます。
      </p>
      <div className="space-y-6">
        {/* 完成尺 */}
        <div>
          <label
            htmlFor="finish_bucket"
            className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
          >
            完成尺
            <RequiredMark />
          </label>
          <select
            id="finish_bucket"
            value={finishBucket}
            onChange={(e) => setFinishBucket(e.target.value)}
            required
            className={`${fieldInputClass} bg-white`}
          >
            <option value="">選択してください</option>
            {FINISH_DURATION_BUCKETS.map((b) => (
              <option key={b.v} value={b.v}>
                {b.label}
              </option>
            ))}
          </select>
          {/* DB スキーマ用 hidden。unit は固定で min */}
          <input
            type="hidden"
            name="finish_duration_unit"
            value={finishBucket ? "min" : ""}
          />
          <input
            type="hidden"
            name="finish_duration_min"
            value={currentFinishBucket?.min ?? ""}
          />
          <input
            type="hidden"
            name="finish_duration_max"
            value={currentFinishBucket?.max ?? ""}
          />
        </div>

        {/* 本数 */}
        <div>
          <label className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]">
            本数
            <RequiredMark />
          </label>
          <div className="flex items-center gap-2">
            <input
              id="count_min"
              name="count_min"
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              required
              value={countMin}
              onChange={(e) =>
                setCountMin(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))
              }
              className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="下限"
            />
            <span className="text-sm text-[#828282]">〜</span>
            <input
              id="count_max"
              name="count_max"
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              value={countMax}
              onChange={(e) =>
                setCountMax(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))
              }
              className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="上限"
            />
            <span className="text-sm text-[#828282]">本</span>
          </div>
          <p className="mt-1.5 text-xs text-[#828282]">
            ※ 半角数字3桁まで。範囲指定したい場合は上限も入力（未指定なら下限と同数として扱います）。
          </p>
        </div>

        {/* 使用ソフト (AI 動画生成系のみ) */}
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
                  className={pillClass(isActive)}
                >
                  {s}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSoftwareOtherShow((v) => !v)}
              className={pillClass(softwareOtherShow)}
            >
              + その他
            </button>
          </div>
          {softwareOtherShow && (
            <input
              type="text"
              value={softwareOther}
              onChange={(e) => setSoftwareOther(e.target.value)}
              className={`mt-2 ${fieldInputClass}`}
              placeholder="自由入力（例: Luma、Higgsfield など）"
              maxLength={60}
            />
          )}
          {software.map((s) => (
            <input key={`sw-${s}`} type="hidden" name="software_options" value={s} />
          ))}
          {softwareOtherShow && softwareOther.trim() && (
            <input type="hidden" name="software_options" value={softwareOther.trim()} />
          )}
        </div>

        {/* 納品形式 */}
        <div>
          <label className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]">
            納品形式
            <RequiredMark />
            <span className="ml-2 text-xs font-normal text-[#828282]">
              （複数選択可）
            </span>
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
                  className={pillClass(isActive)}
                >
                  {f}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setDeliveryFormatsOtherShow((v) => !v)}
              className={pillClass(deliveryFormatsOtherShow)}
            >
              + その他
            </button>
          </div>
          {deliveryFormatsOtherShow && (
            <input
              type="text"
              value={deliveryFormatsOther}
              onChange={(e) => setDeliveryFormatsOther(e.target.value)}
              className={`mt-2 ${fieldInputClass}`}
              placeholder="自由入力（例: H.265、縦型9:16 など）"
              maxLength={60}
            />
          )}
          {deliveryFormats.map((f) => (
            <input key={`df-${f}`} type="hidden" name="delivery_formats" value={f} />
          ))}
          {deliveryFormatsOtherShow && deliveryFormatsOther.trim() && (
            <input
              type="hidden"
              name="delivery_formats"
              value={deliveryFormatsOther.trim()}
            />
          )}
        </div>

        {/* 参考動画URL (必須 / 1件以上、3件以上推奨) */}
        <div>
          <label className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]">
            参考動画URL
            <RequiredMark />
          </label>
          <p className="mb-2 text-xs text-[#828282]">
            ※ イメージのズレを防ぐため、テイスト・尺感・編集の方向性が伝わる
            <span className="font-bold text-[#4F4F4F]"> 3 件以上</span>
            の参考動画 URL を添付することを推奨します。
          </p>
          <div className="space-y-2">
            {referenceUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const next = [...referenceUrls];
                    next[idx] = e.target.value;
                    setReferenceUrls(next);
                  }}
                  className="flex-1 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="https://youtube.com/..."
                  required={idx === 0}
                />
                {referenceUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setReferenceUrls(
                        referenceUrls.filter((_, i) => i !== idx)
                      )
                    }
                    aria-label={`${idx + 1} 番目のURLを削除`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E0E0E0] text-[#828282] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setReferenceUrls([...referenceUrls, ""])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary-300 bg-primary-50/50 px-4 py-2 text-xs font-bold text-primary-600 transition-colors hover:border-primary-500 hover:bg-primary-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              URLを追加
            </button>
          </div>
          {/* DB 既存カラム (reference_url: TEXT) に改行区切りで保存 */}
          <input
            type="hidden"
            name="reference_url"
            value={validReferenceUrls.join("\n")}
          />
        </div>

        {/* 発注形態 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
            発注形態（任意）
            <span className="ml-2 text-[11px] font-normal text-[#9a9da9]">
              ※もう一度押すと解除
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setOrderType((curr) => (curr === "single" ? null : "single"))
              }
              className={pillClass(orderType === "single")}
            >
              単発
            </button>
            <button
              type="button"
              onClick={() =>
                setOrderType((curr) =>
                  curr === "recurring" ? null : "recurring"
                )
              }
              className={pillClass(orderType === "recurring")}
            >
              継続案件
            </button>
          </div>
          <input
            type="hidden"
            name="is_recurring"
            value={orderType === "recurring" ? "1" : ""}
          />
          {orderType === "recurring" && (
            <div className="mt-3 space-y-3 rounded-lg border border-primary-100 bg-primary-50/40 p-3">
              <div>
                <p className="mb-2 text-xs font-bold text-[#4F4F4F]">本数</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRecurringFreq("specified")}
                    className={pillClass(recurringFreq === "specified")}
                  >
                    月◯本で指定する
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringFreq("tbd")}
                    className={pillClass(recurringFreq === "tbd")}
                  >
                    未定（相談して決める）
                  </button>
                </div>
              </div>
              {recurringFreq === "specified" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#828282]">月</span>
                  <input
                    name="monthly_count"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={999}
                    onInput={digitsOnly(3)}
                    className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    placeholder="4"
                  />
                  <span className="text-sm text-[#828282]">本</span>
                </div>
              )}
              {recurringFreq === "tbd" && (
                <p className="text-xs text-[#828282]">
                  本数はクリエイターと相談して決定します。
                </p>
              )}
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
                className={`flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors ${
                  clientTypeChoice === t.value
                    ? "border-primary-500 bg-primary-50 text-primary-600"
                    : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500"
                }`}
              >
                <input
                  type="radio"
                  name="client_type_choice"
                  value={t.value}
                  checked={clientTypeChoice === t.value}
                  onChange={() => setClientTypeChoice(t.value)}
                  className="h-4 w-4 border-[#E0E0E0] text-primary-500 focus:ring-primary-500"
                />
                {t.label}
              </label>
            ))}
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors ${
                clientTypeChoice === "other"
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-[#E0E0E0] text-[#4F4F4F] hover:border-primary-500"
              }`}
            >
              <input
                type="radio"
                name="client_type_choice"
                value="other"
                checked={clientTypeChoice === "other"}
                onChange={() => setClientTypeChoice("other")}
                className="h-4 w-4 border-[#E0E0E0] text-primary-500 focus:ring-primary-500"
              />
              その他
            </label>
          </div>
          {clientTypeChoice === "other" && (
            <input
              type="text"
              value={clientTypeOther}
              onChange={(e) => setClientTypeOther(e.target.value)}
              className={`mt-2 ${fieldInputClass}`}
              placeholder="自由入力（例: 教育機関、NPO法人 など）"
              maxLength={60}
            />
          )}
          <input type="hidden" name="client_type" value={resolvedClientType} />
        </div>
      </div>
    </section>
  );
}
