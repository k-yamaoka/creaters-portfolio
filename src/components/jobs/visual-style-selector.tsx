"use client";

import { useState } from "react";
import { JOB_VISUAL_STYLES } from "@/lib/constants";

/**
 * 案件作成フォームで使う「ビジュアルスタイル」セレクタ。
 *
 * - 参照イメージ (Nano Banana 2 スタイルピッカー) に近い、画像タイル+ラベルの
 *   ギャラリー形式。各タイルは Tailwind グラデーション + 装飾モチーフで
 *   "雰囲気サンプル" を表現する。
 * - 単発スタイル選択を想定 (1 つ選んだら他は外れる)。
 *   ただし将来の複数選択 / 自由入力に備え DB は text[] (visual_styles)。
 * - 選択した value をすべて hidden input `visual_styles` で送信する。
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
              className={`group relative aspect-[5/6] overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ${
                isActive
                  ? "scale-[1.03] border-neon-pink shadow-[0_18px_45px_-15px_rgba(255,77,157,0.6)]"
                  : "border-transparent hover:scale-[1.02] hover:shadow-[0_12px_35px_-15px_rgba(0,0,0,0.35)]"
              }`}
            >
              {/* 背景: グラデ + ノイズ風オーバーレイ */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${s.sample.gradient}`}
              />
              <div
                className="absolute inset-0 mix-blend-overlay opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.18) 1px, transparent 1px)",
                  backgroundSize: "6px 6px, 9px 9px",
                  backgroundPosition: "0 0, 3px 3px",
                }}
              />
              {/* 中央モチーフ — 雰囲気の手がかり */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  aria-hidden
                  className="select-none text-5xl opacity-80 transition-transform duration-200 group-hover:scale-110 sm:text-6xl"
                  style={{
                    filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.45))",
                  }}
                >
                  {s.sample.motif}
                </span>
              </div>
              {/* 右上: 雰囲気を補足する英ラベル */}
              <span className="absolute right-2 top-2 rounded-pill bg-black/35 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                {s.sample.hint}
              </span>
              {/* 下部: グラデーション + 日本語ラベル */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-8">
                <p className="truncate text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                  {s.label}
                </p>
              </div>
              {/* 選択時のチェック */}
              {isActive && (
                <span className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-[0_0_12px_rgba(255,77,157,0.7)]">
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
