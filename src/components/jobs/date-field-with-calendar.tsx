"use client";

import { useRef } from "react";

type Props = {
  id: string;
  name: string;
  label: string;
  /** 例: today / 締切日 など。指定すると input の min 属性に渡す */
  min?: string;
  required?: boolean;
  defaultValue?: string;
};

/**
 * 日付入力 + 視認性の高いカレンダーアイコン。
 *
 * - 普通の <input type="date"> はブラウザによってカレンダーアイコンが薄いため、
 *   右側にクリック可能なカレンダー SVG を重ねて、UX を改善する。
 * - クリックすると `input.showPicker()` を呼び、ネイティブピッカーを開く。
 *   showPicker は Chrome 99 / Safari 16 / Firefox 101 以降で利用可能。
 *   未対応ブラウザではフォーカスをセットするフォールバックを使う。
 */
export function DateFieldWithCalendar({
  id,
  name,
  label,
  min,
  required = false,
  defaultValue,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    // モダンブラウザ
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // ignore — fallback to focus
      }
    }
    // フォールバック (Safari < 16 等)
    el.focus();
    el.click();
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="date"
          min={min}
          required={required}
          defaultValue={defaultValue}
          // 右側のカレンダーアイコン分の余白を確保。
          // ネイティブの indicator は appearance:none で隠す ('-webkit-' 接頭辞対応)。
          className="w-full appearance-none rounded-lg border border-[#E0E0E0] bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink [&::-webkit-calendar-picker-indicator]:opacity-0"
        />
        <button
          type="button"
          onClick={openPicker}
          aria-label={`${label}を選択`}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[#828282] transition-colors hover:bg-neon-pink/10 hover:text-neon-pink"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.7}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
