import type { SVGProps } from "react";

/**
 * Hand-drawn-feel SVG illustrations — Nordic / soft tone.
 * Inspired by reference site (僕と私と株式会社).
 * Colors are kept as currentColor / explicit so they cascade with Tailwind text classes.
 */

type IllustrationProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const base = (size?: number | string): SVGProps<SVGSVGElement> => ({
  width: size ?? 80,
  height: size ?? 80,
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  focusable: "false",
});

/** 5枚花弁の花。中心は黄色、花弁はカラー指定可能 */
export function FlowerMark({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" {...base(size)} {...rest}>
      <g transform="translate(40 40)">
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i * 360) / 5;
          return (
            <ellipse
              key={i}
              cx="0"
              cy="-22"
              rx="14"
              ry="20"
              fill="currentColor"
              transform={`rotate(${angle})`}
            />
          );
        })}
        <circle cx="0" cy="0" r="9" fill="#f7cd47" />
        <circle cx="0" cy="0" r="9" fill="none" stroke="#2a2a32" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/** 4弁の小さなぽんぽん花 (シンプル) */
export function MiniFlower({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 40 40" {...base(size)} {...rest}>
      <g transform="translate(20 20)">
        {Array.from({ length: 4 }).map((_, i) => (
          <circle
            key={i}
            cx="0"
            cy="-9"
            r="7"
            fill="currentColor"
            transform={`rotate(${i * 90})`}
          />
        ))}
        <circle cx="0" cy="0" r="4" fill="#f7cd47" />
      </g>
    </svg>
  );
}

/** 葉っぱ */
export function Leaf({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 60 60" {...base(size)} {...rest}>
      <path
        d="M10 50 Q 15 10 50 10 Q 50 45 10 50 Z"
        fill="currentColor"
      />
      <path
        d="M14 46 Q 28 30 46 14"
        stroke="#fdf9ee"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 雲・もくもく形 */
export function CloudShape({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 60" width={size ?? 120} height={size ?? 60} {...base(size)} {...rest}>
      <path
        d="M20 45 Q 5 45 8 30 Q 8 18 22 22 Q 25 8 42 12 Q 55 4 65 16 Q 78 8 88 20 Q 110 20 108 38 Q 115 50 100 50 L 22 50 Q 18 50 20 45 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 太陽 */
export function SunMark({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" {...base(size)} {...rest}>
      <circle cx="40" cy="40" r="16" fill="#f7cd47" />
      <g stroke="#f7cd47" strokeWidth="3" strokeLinecap="round">
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x1 = 40 + Math.cos(angle) * 24;
          const y1 = 40 + Math.sin(angle) * 24;
          const x2 = 40 + Math.cos(angle) * 34;
          const y2 = 40 + Math.sin(angle) * 34;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
    </svg>
  );
}

/** きらきら/4芒星 */
export function SparkStar({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 40 40" {...base(size)} {...rest}>
      <path
        d="M20 4 Q 22 18 36 20 Q 22 22 20 36 Q 18 22 4 20 Q 18 18 20 4 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** うねり線アンダーライン */
export function WavyLine({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 14" width={size ?? 200} height="14" {...base(size)} {...rest}>
      <path
        d="M2 7 Q 20 2 40 7 T 80 7 T 120 7 T 160 7 T 198 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** 矢印 (やわらかい手描き) */
export function HandArrow({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 60 30" width={size ?? 60} height={size ?? 30} {...base(size)} {...rest}>
      <path
        d="M4 15 Q 20 5 48 15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 8 L 50 15 L 40 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** 二人の足元・スニーカー (リファレンスの足元イメージ) */
export function TwoFeet({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 120" width={size ?? 200} height={size ?? 120} {...base(size)} {...rest}>
      {/* 左 — 青いスニーカー */}
      <g>
        <rect x="22" y="74" width="64" height="22" rx="11" fill="#fdf9ee" stroke="#2a2a32" strokeWidth="2.2" />
        <path
          d="M22 86 Q 22 60 40 60 L 70 60 Q 86 60 86 78 Q 86 92 78 96 L 30 96 Q 22 96 22 86 Z"
          fill="#2e6ca0"
          stroke="#2a2a32"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M48 64 L 48 86" stroke="#fdf9ee" strokeWidth="2" />
        <path d="M58 64 L 58 86" stroke="#fdf9ee" strokeWidth="2" />
        <circle cx="48" cy="72" r="1.6" fill="#fdf9ee" />
        <circle cx="58" cy="72" r="1.6" fill="#fdf9ee" />
        <path d="M16 96 L 92 96" stroke="#2a2a32" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      {/* 右 — 黄色いスニーカー */}
      <g>
        <rect x="114" y="74" width="64" height="22" rx="11" fill="#fdf9ee" stroke="#2a2a32" strokeWidth="2.2" />
        <path
          d="M114 86 Q 114 60 132 60 L 162 60 Q 178 60 178 78 Q 178 92 170 96 L 122 96 Q 114 96 114 86 Z"
          fill="#f7cd47"
          stroke="#2a2a32"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M140 64 L 140 86" stroke="#2a2a32" strokeWidth="2" />
        <path d="M150 64 L 150 86" stroke="#2a2a32" strokeWidth="2" />
        <circle cx="140" cy="72" r="1.6" fill="#2a2a32" />
        <circle cx="150" cy="72" r="1.6" fill="#2a2a32" />
        <path d="M108 96 L 184 96" stroke="#2a2a32" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      {/* 小さなアクセント花 */}
      <g transform="translate(98 32)">
        {Array.from({ length: 5 }).map((_, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-8"
            rx="5"
            ry="7"
            fill="#f7cd47"
            transform={`rotate(${i * 72})`}
          />
        ))}
        <circle cx="0" cy="0" r="3" fill="#2a2a32" />
      </g>
    </svg>
  );
}

/** クリエイター本人イラスト (シンプル人物) */
export function PersonCharacter({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 160" width={size ?? 120} height={size ?? 160} {...base(size)} {...rest}>
      {/* 頭 */}
      <circle cx="60" cy="40" r="26" fill="#f7d9c4" stroke="#2a2a32" strokeWidth="2" />
      {/* 髪 */}
      <path
        d="M34 38 Q 30 14 58 14 Q 88 14 86 40 Q 78 28 60 30 Q 42 32 34 38 Z"
        fill="#2a2a32"
      />
      {/* 目 */}
      <circle cx="50" cy="42" r="2" fill="#2a2a32" />
      <circle cx="70" cy="42" r="2" fill="#2a2a32" />
      {/* 口 */}
      <path d="M54 52 Q 60 56 66 52" stroke="#2a2a32" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 体 */}
      <path
        d="M30 100 Q 30 74 60 74 Q 90 74 90 100 L 90 140 Q 90 152 78 152 L 42 152 Q 30 152 30 140 Z"
        fill="#2e6ca0"
        stroke="#2a2a32"
        strokeWidth="2"
      />
      {/* 襟元 */}
      <path d="M46 74 Q 60 86 74 74" stroke="#fdf9ee" strokeWidth="3" fill="none" />
    </svg>
  );
}

/** 装飾的な丸ドット縦並び */
export function Dots({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 20 80" width={size ?? 20} height={size ?? 80} {...base(size)} {...rest}>
      {[6, 22, 38, 54, 70].map((y, i) => (
        <circle key={i} cx="10" cy={y} r="3" fill="currentColor" />
      ))}
    </svg>
  );
}

/** 円弧の波 — セクションディバイダー用 */
export function WaveDivider({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        d="M0 40 Q 360 0 720 40 T 1440 40 L 1440 80 L 0 80 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 大きな塗りつぶし円ブロブ */
export function Blob({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" width={size ?? 200} height={size ?? 200} {...base(size)} {...rest}>
      <path
        d="M100 8 Q 168 20 184 92 Q 196 168 116 188 Q 36 196 16 124 Q 4 44 100 8 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 再生ボタン風円形 */
export function PlayBubble({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 80" {...base(size)} {...rest}>
      <circle cx="40" cy="40" r="36" fill="currentColor" stroke="#2a2a32" strokeWidth="2.4" />
      <path d="M32 26 L 56 40 L 32 54 Z" fill="#2a2a32" />
    </svg>
  );
}

/** ハート (小) */
export function HeartMark({ size, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 32 32" {...base(size)} {...rest}>
      <path
        d="M16 28 Q 4 18 4 11 Q 4 4 10 4 Q 14 4 16 8 Q 18 4 22 4 Q 28 4 28 11 Q 28 18 16 28 Z"
        fill="currentColor"
      />
    </svg>
  );
}
