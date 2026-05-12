"use client";

import { useEffect, useState } from "react";
import {
  EDIT_WORK_TYPES,
  EDIT_WORK_TYPE_DESCRIPTIONS,
  EDIT_SOFTWARE_OPTIONS,
  EDIT_DELIVERY_FORMATS,
  CLIENT_TYPES,
} from "@/lib/constants";

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
  const [finishUnit, setFinishUnit] = useState<"sec" | "min">("sec");
  const [isRecurring, setIsRecurring] = useState(false);

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
            htmlFor="footage_minutes"
            className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
          >
            素材時間（約◯分）
            <RequiredMark />
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
            <label className="flex items-center text-sm font-medium text-[#4F4F4F]">
              完成尺
              <RequiredMark />
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
          <input type="hidden" name="finish_duration_unit" value={finishUnit} />
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
            範囲指定したい場合は上限を入力
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
            htmlFor="revision_count"
            className="mb-1.5 flex items-center text-sm font-medium text-[#4F4F4F]"
          >
            修正回数
            <RequiredMark />
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

        {/* 発注形態 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
            発注形態（任意）
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsRecurring(false)}
              className={pillClass(!isRecurring)}
            >
              単発
            </button>
            <button
              type="button"
              onClick={() => setIsRecurring(true)}
              className={pillClass(isRecurring)}
            >
              継続案件
            </button>
          </div>
          <input type="hidden" name="is_recurring" value={isRecurring ? "1" : ""} />
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
