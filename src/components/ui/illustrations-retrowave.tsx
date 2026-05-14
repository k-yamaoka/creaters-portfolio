import type { SVGProps } from "react";

/**
 * Retrowave / City pop / Lofi シリーズ。
 * 参考画像 (DS_005/001/004/Signage/Artist + Lofi 系) のテイスト:
 *   - ネオンピンク × シアン × パープル × サンセットオレンジ
 *   - 夜の都市シルエット
 *   - 半円のレトロサン (横スキャンライン入り)
 *   - シンプル化したアニメ調キャラ (横顔)
 *
 * SVG では細密なアニメ作画は再現できないので、
 *「シルエット+ネオン+ストライプ」で雰囲気を作る。
 */

const C = {
  midnight: "#1a1340",
  midnightDeep: "#0f0826",
  pink: "#ff4d9d",
  pinkSoft: "#ff8ec0",
  purple: "#9d5cff",
  cyan: "#4dd5f7",
  cyanSoft: "#a6e8f7",
  sunset: "#ffae3b",
  yellow: "#f7cd47",
  magenta: "#e83fae",
  white: "#ffffff",
  skin: "#ffd6c4",
  outline: "#241845",
};

type Props = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

/**
 * レトロな半円サン (横スキャンラインで分割された 80s リバイバル意匠)
 */
export function RetroSun({ size, ...rest }: Props) {
  const id = "retro-sun";
  return (
    <svg
      viewBox="0 0 200 200"
      width={size ?? 200}
      height={size ?? 200}
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.yellow} />
          <stop offset="55%" stopColor={C.sunset} />
          <stop offset="100%" stopColor={C.pink} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="100" cy="100" r="90" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="90" fill={`url(#${id}-g)`} />
      {/* スキャンライン */}
      <g clipPath={`url(#${id}-clip)`} fill={C.midnight}>
        {[120, 138, 154, 168, 180].map((y, i) => (
          <rect key={i} x="0" y={y} width="200" height={3 + i * 1.5} />
        ))}
      </g>
    </svg>
  );
}

/**
 * 夜の都市シルエット (横長)。
 * 縦長のビル群が並び、窓に光が点く。
 */
export function NeonCitySkyline({ size, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 600 200"
      width={size ?? 600}
      height={size ?? 200}
      preserveAspectRatio="none"
      aria-hidden="true"
      {...rest}
    >
      <g fill={C.midnightDeep}>
        {/* ビル群 */}
        <rect x="0" y="120" width="36" height="80" />
        <rect x="40" y="80" width="48" height="120" />
        <rect x="92" y="100" width="28" height="100" />
        <rect x="124" y="60" width="60" height="140" />
        <rect x="188" y="100" width="34" height="100" />
        <rect x="226" y="40" width="40" height="160" />
        <rect x="270" y="90" width="32" height="110" />
        <rect x="306" y="74" width="56" height="126" />
        <rect x="366" y="100" width="36" height="100" />
        <rect x="406" y="70" width="48" height="130" />
        <rect x="458" y="92" width="30" height="108" />
        <rect x="492" y="58" width="50" height="142" />
        <rect x="546" y="98" width="32" height="102" />
        <rect x="582" y="120" width="18" height="80" />
        {/* 細い塔 */}
        <rect x="156" y="20" width="6" height="40" />
        <rect x="334" y="40" width="6" height="34" />
        <rect x="514" y="36" width="4" height="22" />
      </g>
      {/* 窓の光 */}
      <g fill={C.yellow}>
        {Array.from({ length: 80 }).map((_, i) => {
          const x = 6 + (i * 7.4) % 590;
          const y = 90 + ((i * 13) % 100);
          return <rect key={i} x={x} y={y} width="2" height="3" />;
        })}
      </g>
      {/* ピンクの窓ライト (ランダム配置) */}
      <g fill={C.pink}>
        {Array.from({ length: 30 }).map((_, i) => {
          const x = 14 + (i * 19.7) % 580;
          const y = 100 + ((i * 17) % 90);
          return <rect key={i} x={x} y={y} width="2" height="2" />;
        })}
      </g>
      {/* シアンのアクセント */}
      <g fill={C.cyan}>
        {Array.from({ length: 18 }).map((_, i) => {
          const x = 26 + (i * 31.3) % 560;
          const y = 110 + ((i * 23) % 80);
          return <rect key={i} x={x} y={y} width="2" height="2" />;
        })}
      </g>
    </svg>
  );
}

/**
 * 縦のネオンストライプ (DS_005 の 4分割パネル風)
 */
export function NeonStripesBackdrop({ size, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 400 240"
      width={size ?? 400}
      height={size ?? 240}
      preserveAspectRatio="none"
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <linearGradient id="stripe-1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.purple} />
          <stop offset="100%" stopColor={C.magenta} />
        </linearGradient>
        <linearGradient id="stripe-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.cyan} />
          <stop offset="100%" stopColor={C.purple} />
        </linearGradient>
        <linearGradient id="stripe-3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.sunset} />
          <stop offset="100%" stopColor={C.pink} />
        </linearGradient>
        <linearGradient id="stripe-4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.pink} />
          <stop offset="100%" stopColor={C.purple} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="240" fill="url(#stripe-1)" />
      <rect x="100" y="0" width="100" height="240" fill="url(#stripe-2)" />
      <rect x="200" y="0" width="100" height="240" fill="url(#stripe-3)" />
      <rect x="300" y="0" width="100" height="240" fill="url(#stripe-4)" />
      {/* 水平スキャンライン */}
      <g stroke="#000" strokeOpacity="0.18">
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={i * 10 + 3}
            x2="400"
            y2={i * 10 + 3}
            strokeWidth="1"
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Lofi 系のキャラ (横顔)。
 * 紫/ピンク髪 + ヘッドホン + 暗背景でラップトップ操作。
 */
export function LofiCreator({ size, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 320 320"
      width={size ?? 320}
      height={size ?? 320}
      aria-hidden="true"
      {...rest}
    >
      {/* 背景: 円形 (青紫グラデ) */}
      <defs>
        <linearGradient id="lofi-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.purple} />
          <stop offset="100%" stopColor={C.midnight} />
        </linearGradient>
        <radialGradient id="lofi-glow" cx="0.7" cy="0.3" r="0.5">
          <stop offset="0%" stopColor={C.pinkSoft} stopOpacity="0.6" />
          <stop offset="100%" stopColor={C.pinkSoft} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="160" r="150" fill="url(#lofi-bg)" />
      <circle cx="160" cy="160" r="150" fill="url(#lofi-glow)" />

      {/* 星 */}
      <g fill={C.white}>
        {[
          [40, 50, 1.5],
          [80, 30, 1],
          [240, 40, 1.2],
          [280, 80, 1],
          [50, 110, 1],
          [60, 200, 1.5],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>

      {/* デスク */}
      <rect x="40" y="248" width="240" height="6" fill={C.midnightDeep} />

      {/* ラップトップ (本体 + 画面) */}
      <g
        stroke={C.outline}
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path
          d="M 120 244 L 100 248 L 220 248 L 200 244 Z"
          fill={C.midnightDeep}
        />
        <rect
          x="124"
          y="200"
          width="76"
          height="46"
          rx="3"
          fill={C.midnight}
        />
        <rect
          x="128"
          y="204"
          width="68"
          height="38"
          rx="2"
          fill={C.pink}
          opacity="0.9"
        />
        {/* タイムライン風バー */}
        <rect
          x="132"
          y="210"
          width="60"
          height="3"
          rx="1"
          fill={C.cyan}
          stroke="none"
        />
        <rect
          x="132"
          y="218"
          width="40"
          height="2"
          rx="1"
          fill={C.white}
          stroke="none"
          opacity="0.8"
        />
        <rect
          x="132"
          y="224"
          width="52"
          height="2"
          rx="1"
          fill={C.white}
          stroke="none"
          opacity="0.6"
        />
        <rect
          x="132"
          y="230"
          width="36"
          height="2"
          rx="1"
          fill={C.cyan}
          stroke="none"
        />
      </g>

      {/* キャラ (横顔 - 簡略化) */}
      <g stroke={C.outline} strokeWidth="2.2" strokeLinejoin="round">
        {/* 体 (パーカー) */}
        <path
          d="M 130 250 Q 130 200 165 195 L 235 195 Q 270 205 270 250 Z"
          fill={C.cyan}
          opacity="0.95"
        />
        {/* 腕 (ラップトップへ) */}
        <path
          d="M 180 220 Q 180 230 200 240 L 218 240"
          fill="none"
        />
        {/* 首 */}
        <rect x="206" y="178" width="22" height="20" fill={C.skin} />
        {/* 顔 (横向き) */}
        <path
          d="M 198 178 Q 192 142 224 134 Q 256 134 262 168 Q 260 188 246 190 L 224 192 Q 204 192 198 178 Z"
          fill={C.skin}
        />
        {/* 髪 (紫/ピンク) */}
        <path
          d="M 188 168 Q 188 124 224 120 Q 270 122 268 158 Q 270 178 264 184 Q 256 158 240 156 Q 222 132 202 144 Q 194 158 188 168 Z"
          fill={C.purple}
        />
        {/* 髪のハイライト */}
        <path
          d="M 200 144 Q 210 132 226 130"
          stroke={C.pink}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* 目 (まぶしい光) */}
        <circle
          cx="242"
          cy="170"
          r="2"
          fill={C.outline}
          stroke="none"
        />
        {/* 頬 */}
        <circle cx="252" cy="178" r="3.5" fill={C.pink} stroke="none" opacity="0.7" />
        {/* 口 */}
        <path
          d="M 248 184 Q 252 186 256 184"
          fill="none"
        />
        {/* ヘッドホン */}
        <path
          d="M 188 156 Q 188 116 224 114 Q 264 116 264 156"
          fill="none"
          strokeWidth="3"
        />
        <ellipse cx="186" cy="166" rx="9" ry="13" fill={C.magenta} />
        <ellipse cx="266" cy="160" rx="7" ry="11" fill={C.magenta} />
      </g>
    </svg>
  );
}

/**
 * 夜の窓 (室内から見た都市の夜景)
 */
export function NightWindow({ size, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 160 200"
      width={size ?? 160}
      height={size ?? 200}
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <linearGradient id="nw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.midnight} />
          <stop offset="60%" stopColor={C.purple} />
          <stop offset="100%" stopColor={C.pink} />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="144" height="184" rx="6" fill="url(#nw-sky)" />
      {/* 窓枠 */}
      <rect
        x="8"
        y="8"
        width="144"
        height="184"
        rx="6"
        fill="none"
        stroke={C.outline}
        strokeWidth="3"
      />
      <line x1="80" y1="8" x2="80" y2="192" stroke={C.outline} strokeWidth="2" />
      <line x1="8" y1="100" x2="152" y2="100" stroke={C.outline} strokeWidth="2" />
      {/* 都市 (下部) */}
      <g fill={C.midnightDeep}>
        <rect x="14" y="140" width="20" height="50" />
        <rect x="36" y="120" width="14" height="70" />
        <rect x="52" y="130" width="22" height="60" />
        <rect x="82" y="125" width="18" height="65" />
        <rect x="102" y="115" width="24" height="75" />
        <rect x="128" y="130" width="20" height="60" />
      </g>
      {/* 窓の光 (黄色いドット) */}
      <g fill={C.yellow}>
        {Array.from({ length: 30 }).map((_, i) => (
          <rect
            key={i}
            x={16 + (i * 7.4) % 134}
            y={130 + ((i * 11) % 55)}
            width="1.5"
            height="2"
          />
        ))}
      </g>
      {/* 星 */}
      <g fill={C.white}>
        <circle cx="30" cy="35" r="1.4" />
        <circle cx="68" cy="22" r="1" />
        <circle cx="100" cy="40" r="1.2" />
        <circle cx="130" cy="28" r="1" />
        <circle cx="48" cy="60" r="0.8" />
        <circle cx="115" cy="65" r="1.1" />
      </g>
    </svg>
  );
}

/**
 * 大型サイネージ風のフレーム (DS_Signage 由来)
 */
export function NeonSignage({ size, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 200 120"
      width={size ?? 200}
      height={size ?? 120}
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <linearGradient id="sig-bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.sunset} />
          <stop offset="100%" stopColor={C.pink} />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="192" height="112" rx="6" fill="url(#sig-bg)" />
      <rect
        x="4"
        y="4"
        width="192"
        height="112"
        rx="6"
        fill="none"
        stroke={C.outline}
        strokeWidth="3"
      />
      {/* シルエットの躍動感ある人物 */}
      <g fill={C.pink}>
        <ellipse cx="60" cy="58" rx="6" ry="8" />
        <path d="M 50 90 Q 56 64 60 64 L 66 66 Q 74 78 76 92 L 70 96 L 60 88 L 52 96 Z" />
        <ellipse cx="100" cy="42" rx="7" ry="10" />
        <path d="M 88 80 Q 96 50 100 50 Q 112 56 116 80 L 108 88 L 102 78 L 96 90 Z" />
        <ellipse cx="140" cy="56" rx="5" ry="7" />
        <path d="M 132 86 Q 138 62 142 62 L 148 64 Q 152 76 152 90 L 146 92 L 140 84 Z" />
      </g>
    </svg>
  );
}

/**
 * ネオン枠付きピル (タグやアクセント用)
 */
export function NeonPill({
  size,
  children,
  color = C.pink,
}: Props & { children?: React.ReactNode; color?: string }) {
  return (
    <svg
      viewBox="0 0 120 40"
      width={size ?? 120}
      height={size ?? 40}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="116"
        height="36"
        rx="18"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
      {children}
    </svg>
  );
}

/**
 * 浮かぶスター (アクセント)
 */
export function NeonStar({ size, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size ?? 40}
      height={size ?? 40}
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M 20 4 L 24 16 L 36 20 L 24 24 L 20 36 L 16 24 L 4 20 L 16 16 Z"
        fill="currentColor"
      />
    </svg>
  );
}
