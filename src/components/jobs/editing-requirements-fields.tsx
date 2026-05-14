"use client";

import { useEffect, useState } from "react";
import {
  EDIT_WORK_TYPES,
  EDIT_WORK_TYPE_DESCRIPTIONS,
  EDIT_SOFTWARE_OPTIONS,
  EDIT_DELIVERY_FORMATS,
  CLIENT_TYPES,
} from "@/lib/constants";

/**
 * バケット選択肢の定義。
 * select の表示ラベルとサーバへ送る生値 (DB の integer / null をエンコードした文字列) を持つ。
 *
 * - 素材時間: footage_minutes (integer 分) のレンジ。
 *   バケットごとに代表 integer を割り当て、表示側で逆引きしてラベル化する。
 *   1時間〜/2時間〜/3時間〜 は「以上」を示すため代表値を 61/121/181 にする
 *   (30分〜1時間=60 と区別したい)。
 * - 完成尺: finish_duration_unit="min" 固定で finish_duration_min/max のレンジ。
 * - 修正回数: revision_count integer。5回〜 は 99 をセンチネルとして保存。
 */
const FOOTAGE_MINUTES_BUCKETS = [
  { v: "10", n: 10, label: "〜10分" },
  { v: "30", n: 30, label: "10〜30分" },
  { v: "60", n: 60, label: "30分〜1時間" },
  { v: "61", n: 61, label: "1時間〜" },
  { v: "121", n: 121, label: "2時間〜" },
  { v: "181", n: 181, label: "3時間〜" },
] as const;

const FINISH_DURATION_BUCKETS = [
  { v: "0-1", min: "", max: "1", label: "〜1分" },
  { v: "1-5", min: "1", max: "5", label: "1分〜5分" },
  { v: "5-10", min: "5", max: "10", label: "5分〜10分" },
  { v: "10+", min: "10", max: "", label: "10分以上" },
] as const;

const REVISION_COUNT_BUCKETS = [
  { v: "1", n: 1, label: "1回" },
  { v: "2", n: 2, label: "2回" },
  { v: "3", n: 3, label: "3回" },
  { v: "4", n: 4, label: "4回" },
  { v: "99", n: 99, label: "5回〜" },
] as const;

function RequiredMark() {
  return (
    <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
      必須
    </span>
  );
}

function TipBubble({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-48 -translate-x-1/2 rounded-md bg-[#222] px-2.5 py-1.5 text-[11px] font-normal leading-relaxed text-white shadow-card group-hover:block">
      {text}
    </span>
  );
}

function toNum(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * 数字以外を弾き、桁数を制限する onInput ハンドラを返す。
 * type="number" でも貼り付け等で長い数字が入るため、明示的に切り詰める。
 */
function digitsOnly(maxDigits: number) {
  return (e: React.FormEvent<HTMLInputElement>) => {
    const t = e.currentTarget;
    const cleaned = t.value.replace(/[^0-9]/g, "").slice(0, maxDigits);
    if (t.value !== cleaned) t.value = cleaned;
  };
}

type Props = {
  /** 本数 (count_min/count_max) の変化を親に通知。jobs/new の見積もり自動計算に使う。 */
  onCountChange?: (countMin: number | null, countMax: number | null) => void;
  /** 必須項目 (作業内容, 納品形式) が埋まっているかを親に通知 */
  onValidityChange?: (valid: boolean) => void;
};

/**
 * jobs/new と orders/new で共有する「編集要件」フォーム部分。
 * 内部で全フィールドを state 管理し、hidden input を出すので、
 * 親の form は formData をそのまま action に渡すだけで送信できる。
 */
export function EditingRequirementsFields({ onCountChange, onValidityChange }: Props) {
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [software, setSoftware] = useState<string[]>([]);
  const [deliveryFormats, setDeliveryFormats] = useState<string[]>([]);
  // 完成尺はバケット選択方式に統一。unit は固定で "min"
  const [finishBucket, setFinishBucket] = useState<string>("");
  // 素材時間バケット
  const [footageBucket, setFootageBucket] = useState<string>("");
  // 修正回数バケット
  const [revisionBucket, setRevisionBucket] = useState<string>("");
  // 参考動画URL: 複数行 (空文字を残すと UI 上 + ボタンで追加した直後の空欄が出る)
  const [referenceUrls, setReferenceUrls] = useState<string[]>([""]);
  // null = 未選択 / "single" = 単発 / "recurring" = 継続案件
  const [orderType, setOrderType] = useState<"single" | "recurring" | null>(null);
  // 継続案件のとき: "specified" = 月N本指定 / "tbd" = 本数未定
  const [recurringFreq, setRecurringFreq] = useState<"specified" | "tbd">("specified");

  const currentFinishBucket = FINISH_DURATION_BUCKETS.find(
    (b) => b.v === finishBucket
  );

  const [workTypesOtherShow, setWorkTypesOtherShow] = useState(false);
  const [workTypesOther, setWorkTypesOther] = useState("");
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

  // 必須項目: 作業内容 + 納品形式 (本数は <input required /> で HTML 側のチェックに任せる)
  const workTypesFilled =
    workTypes.length > 0 ||
    (workTypesOtherShow && workTypesOther.trim().length > 0);
  const deliveryFormatsFilled =
    deliveryFormats.length > 0 ||
    (deliveryFormatsOtherShow && deliveryFormatsOther.trim().length > 0);

  useEffect(() => {
    onValidityChange?.(workTypesFilled && deliveryFormatsFilled);
  }, [workTypesFilled, deliveryFormatsFilled, onValidityChange]);

  useEffect(() => {
    onCountChange?.(toNum(countMin), toNum(countMax));
  }, [countMin, countMax, onCountChange]);

  const resolvedClientType =
    clientTypeChoice === "other" ? clientTypeOther.trim() : clientTypeChoice;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
      <h2 className="mb-2 text-lg font-bold text-[#222]">編集要件</h2>
      <p className="mb-6 text-sm text-[#828282]">
        クリエイターが見積もり・対応判断に使う重要情報です。依頼後もメッセージ画面に常に表示されます。
      </p>
      <div className="space-y-6">
        {/* 素材時間 */}
        <div>
          <label
            htmlFor="footage_bucket"
            className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
          >
            素材時間
            <RequiredMark />
          </label>
          <select
            id="footage_bucket"
            value={footageBucket}
            onChange={(e) => setFootageBucket(e.target.value)}
            required
            className="w-full rounded-lg border border-[#E0E0E0] bg-white px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:w-64"
          >
            <option value="">選択してください</option>
            {FOOTAGE_MINUTES_BUCKETS.map((b) => (
              <option key={b.v} value={b.v}>
                {b.label}
              </option>
            ))}
          </select>
          {/* DB 既存スキーマ (footage_minutes: integer) に合わせて hidden で送る */}
          <input
            type="hidden"
            name="footage_minutes"
            value={footageBucket}
          />
        </div>

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
            className="w-full rounded-lg border border-[#E0E0E0] bg-white px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:w-64"
          >
            <option value="">選択してください</option>
            {FINISH_DURATION_BUCKETS.map((b) => (
              <option key={b.v} value={b.v}>
                {b.label}
              </option>
            ))}
          </select>
          {/* DB 既存スキーマ用 hidden 出力。unit は固定で min */}
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

        {/* 作業 */}
        <div>
          <label className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]">
            作業内容
            <RequiredMark />
            <span className="ml-2 text-xs font-normal text-[#828282]">
              （複数選択可・項目にカーソルを当てると説明）
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {EDIT_WORK_TYPES.map((w) => {
              const isActive = workTypes.includes(w);
              const desc = EDIT_WORK_TYPE_DESCRIPTIONS[w];
              return (
                <div key={w} className="group relative">
                  <button
                    type="button"
                    onClick={() => toggleIn(workTypes, setWorkTypes, w)}
                    className={pillClass(isActive)}
                    aria-label={desc ? `${w}: ${desc}` : w}
                  >
                    {w}
                  </button>
                  {desc && <TipBubble text={desc} />}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setWorkTypesOtherShow((v) => !v)}
              className={pillClass(workTypesOtherShow)}
            >
              + その他
            </button>
          </div>
          {workTypesOtherShow && (
            <input
              type="text"
              value={workTypesOther}
              onChange={(e) => setWorkTypesOther(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[#E0E0E0] px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="自由入力（例: アニメーション、3DCG合成 など）"
              maxLength={60}
            />
          )}
          {workTypes.map((w) => (
            <input key={`wt-${w}`} type="hidden" name="work_types" value={w} />
          ))}
          {workTypesOtherShow && workTypesOther.trim() && (
            <input type="hidden" name="work_types" value={workTypesOther.trim()} />
          )}
        </div>

        {/* 修正回数 */}
        <div>
          <label
            htmlFor="revision_bucket"
            className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
          >
            修正回数
            <RequiredMark />
          </label>
          <select
            id="revision_bucket"
            value={revisionBucket}
            onChange={(e) => setRevisionBucket(e.target.value)}
            required
            className="w-full rounded-lg border border-[#E0E0E0] bg-white px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:w-48"
          >
            <option value="">選択してください</option>
            {REVISION_COUNT_BUCKETS.map((b) => (
              <option key={b.v} value={b.v}>
                {b.label}
              </option>
            ))}
          </select>
          <input
            type="hidden"
            name="revision_count"
            value={revisionBucket}
          />
        </div>

        {/* 使用ソフト */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
            使用ソフト（任意・複数選択可）
          </label>
          <div className="flex flex-wrap gap-2">
            {EDIT_SOFTWARE_OPTIONS.map((s) => {
              const isActive = software.includes(s);
              const isNoPref = s === "特に指定なし";
              const handleClick = () => {
                if (isNoPref) {
                  setSoftware(isActive ? [] : [s]);
                  if (!isActive) {
                    setSoftwareOtherShow(false);
                    setSoftwareOther("");
                  }
                } else {
                  const cleared = software.filter((v) => v !== "特に指定なし");
                  setSoftware(
                    cleared.includes(s)
                      ? cleared.filter((v) => v !== s)
                      : [...cleared, s]
                  );
                }
              };
              return (
                <button
                  key={s}
                  type="button"
                  onClick={handleClick}
                  className={pillClass(isActive)}
                >
                  {s}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                if (!softwareOtherShow) {
                  setSoftware((prev) => prev.filter((v) => v !== "特に指定なし"));
                }
                setSoftwareOtherShow((v) => !v);
              }}
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
              className="mt-2 w-full rounded-lg border border-[#E0E0E0] px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="自由入力（例: CapCut、VEGAS Pro など）"
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
              className="mt-2 w-full rounded-lg border border-[#E0E0E0] px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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

        {/* 納期 */}
        <div>
          <label
            htmlFor="delivery_days"
            className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
          >
            納期（素材受け取りから）
            <RequiredMark />
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#828282]">素材受け取りから</span>
            <input
              id="delivery_days"
              name="delivery_days"
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              required
              onInput={digitsOnly(3)}
              className="w-28 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="7"
            />
            <span className="text-sm text-[#828282]">日</span>
          </div>
          <p className="mt-1.5 text-xs text-[#828282]">
            ※ 半角数字3桁まで（例: 7、30、180）。
          </p>
        </div>

        {/* 参考動画URL (複数追加可) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
            参考動画URL（任意・複数追加可）
          </label>
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
            value={referenceUrls
              .map((u) => u.trim())
              .filter(Boolean)
              .join("\n")}
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
              className="mt-2 w-full rounded-lg border border-[#E0E0E0] px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
