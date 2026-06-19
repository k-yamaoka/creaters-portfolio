"use client";

import { ArrowRight } from "lucide-react";

/**
 * セクション区切り用 水平無限ループ マーキーテキスト。
 *
 * 仕様 (Section 5):
 * - "AI VIDEO CREATORS — FOR BUSINESS —" 風のフレーズが横に流れ続ける
 * - 絵文字は使わず lucide ArrowRight 等の繰返しで装飾
 * - 区切りや CTA 周辺など要所のみ。本文の可読性を損なわない位置に置く
 * - prefers-reduced-motion: reduce 時は animation を停止 (motion-reduce:!animate-none)
 *
 * 実装:
 * - 2 セット複製 → translateX -50% で 1 セットぶん流せばシームレス
 * - 速度は tailwind.config.ts の animate-marquee (40s) を使用
 * - 親に overflow-hidden を強制し、ページ全体に横スクロールバーが出ない
 */

type Props = {
  /** マーキー内で繰り返す文字列。例: "AI VIDEO CREATORS — FOR BUSINESS" */
  phrase: string;
  /** 1 セット内のフレーズ繰返し回数。長い phrase なら少なめに、短ければ多めに */
  repeatPerSet?: number;
  /** speed 種別: 既存トークン (animate-marquee / animate-marquee-h-30 等) */
  speed?: "default" | "slow" | "h-30" | "h-38" | "h-45";
  /** 色テーマ */
  tone?: "ink" | "paper";
  className?: string;
};

const SPEED_CLASS: Record<NonNullable<Props["speed"]>, string> = {
  default: "animate-marquee",
  slow: "animate-marquee-slow",
  "h-30": "animate-marquee-h-30",
  "h-38": "animate-marquee-h-38",
  "h-45": "animate-marquee-h-45",
};

export function MarqueeText({
  phrase,
  repeatPerSet = 4,
  speed = "h-45",
  tone = "ink",
  className = "",
}: Props) {
  const set = Array.from({ length: repeatPerSet }, (_, i) => i);
  const toneText = tone === "paper" ? "text-paper/80" : "text-ink/60";
  const toneAccent = tone === "paper" ? "text-paper/40" : "text-ink/30";

  return (
    <div
      aria-hidden
      className={`relative w-full overflow-hidden ${className}`}
    >
      <div
        className={`flex w-max ${SPEED_CLASS[speed]} motion-reduce:!animate-none`}
      >
        {/* 2 セット複製でシームレスループ */}
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center">
            {set.map((i) => (
              <span
                key={`${dup}-${i}`}
                className={`mx-8 inline-flex items-center gap-6 font-display text-[clamp(2rem,5vw,4rem)] font-medium uppercase tracking-tight ${toneText}`}
              >
                {phrase}
                <ArrowRight
                  size={32}
                  strokeWidth={1.4}
                  className={toneAccent}
                  aria-hidden
                />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
