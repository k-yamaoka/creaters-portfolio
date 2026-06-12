"use client";

import { useState } from "react";
import Image from "next/image";
import { JOB_VISUAL_STYLES } from "@/lib/constants";

/**
 * 案件作成フォームで使う「ビジュアルスタイル」セレクタ。
 *
 * - 参照イメージ (Nano Banana 2 スタイルピッカー) と同じく、AI 生成された
 *   実画像をタイルで並べる。`public/images/visual-styles/` 配下に同梱した
 *   JPEG を `next/image` で配信し、デバイスサイズに合わせて自動最適化。
 * - 単一選択を想定 (1 つ選ぶと他は外れる)。
 *   ただし DB は text[] (visual_styles) なので将来の複数選択にも備える。
 * - 選択した value を hidden input `visual_styles` で送信する。
 */
export function VisualStyleSelector() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-lg font-bold text-[#222]">想定するビジュアル</h2>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
          任意
        </span>
      </div>
      <p className="mb-5 text-sm text-[#828282]">
        企業がイメージする動画の方向性を選んでください。クリエイターが見積もりや
        参考案を提示する際の判断材料になります。
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {JOB_VISUAL_STYLES.map((s) => {
          const isActive = selected === s.value;
          return (
            <button
              key={s.value}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                setSelected((curr) => (curr === s.value ? null : s.value))
              }
              className={`group relative aspect-[5/6] overflow-hidden rounded-2xl border-2 text-left transition-[transform,box-shadow] duration-200 ease-out will-change-transform ${
                isActive
                  ? "scale-[1.03] border-neon-pink shadow-[0_18px_45px_-15px_rgba(255,77,157,0.6)]"
                  : "border-transparent hover:scale-[1.05] hover:shadow-[0_18px_45px_-15px_rgba(0,0,0,0.4)]"
              }`}
            >
              {/* AI 生成画像 — next/image で 自動最適化。
                  画像側で group-hover scale を持たせると外側ボタンの scale と
                  二重に transform が掛かりエッジが歪むため、画像側は静止させて
                  外側のタイル全体だけを拡大するように統一する (バグ修正)。
                  object-position: top で画像上端を固定し、5:6 タイル比でも
                  キャラクターの頭/タイトル部分が切れないようにする。 */}
              <Image
                src={s.image}
                alt={s.label}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover ${
                  // 画像個別に objectPosition を指定可能。
                  // 未指定の場合は "top" でキャラの頭/タイトル優先。
                  (s as { objectPosition?: string }).objectPosition === "center"
                    ? "object-center"
                    : "object-top"
                }`}
              />
              {/* 下部: グラデーション + 日本語ラベル */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2.5 pt-8">
                <p className="truncate text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                  {s.label}
                </p>
              </div>
              {/* 選択時のチェック */}
              {isActive && (
                <span className="absolute left-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-[0_0_12px_rgba(255,77,157,0.7)]">
                  <svg
                    className="h-3.5 w-3.5"
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
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* hidden submit: 選んだ場合のみ送る (DB は text[]) */}
      {selected && (
        <input type="hidden" name="visual_styles" value={selected} />
      )}
    </section>
  );
}
