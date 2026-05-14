import type { SVGProps } from "react";

/**
 * Modern-flat illustrations — Coral×Navy×Blue 配色。
 * 参考: Storyset/Freepik 系のフラットイラスト + 動画編集デスクシーン。
 *
 * 既存 illustrations.tsx (北欧フラット / 花モチーフ) とは別ファイル。
 * TOPページのヒーローや「2つの方法」セクションで利用する。
 */

const COLORS = {
  outline: "#1d2939",
  coral: "#ff4d52",
  coralLight: "#ffd0d0",
  navy: "#1d2939",
  navyMid: "#2c4a6e",
  blue: "#3b6fb0",
  blueLight: "#cee1f2",
  skin: "#ffd6c4",
  yellow: "#f7cd47",
  cream: "#fdf9ee",
  white: "#ffffff",
};

type IllustrationProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  width?: number | string;
  height?: number | string;
};

/**
 * 映像編集者がデュアルモニターでビデオを編集しているシーン。
 * 横幅優先。ヒーロー右側のメインビジュアル用。
 */
export function VideoEditorScene({ className, ...rest }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 520 420"
      className={className}
      role="img"
      aria-label="映像クリエイターがデスクで動画を編集している様子のイラスト"
      {...rest}
    >
      {/* === 背景: 大きなコーラルブロブ === */}
      <path
        d="M 60 140 Q 30 60 130 50 Q 230 30 320 70 Q 460 60 470 180 Q 500 280 400 320 Q 280 380 170 340 Q 50 320 60 220 Z"
        fill={COLORS.coral}
      />

      {/* === 背景: 黄色のドットパターン === */}
      <g fill={COLORS.yellow} opacity="0.85">
        {[40, 90, 140, 190].map((x) =>
          [60, 110].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />)
        )}
      </g>

      {/* === 背景: 窓 (右上) === */}
      <g
        stroke={COLORS.outline}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={COLORS.blueLight}
      >
        <rect x="380" y="40" width="100" height="120" rx="4" />
        <line x1="430" y1="40" x2="430" y2="160" />
        <line x1="380" y1="100" x2="480" y2="100" />
      </g>

      {/* === 背景: 本棚 (左上) === */}
      <g stroke={COLORS.outline} strokeWidth="2" fill={COLORS.cream}>
        <rect x="20" y="50" width="120" height="6" />
        <rect x="20" y="100" width="120" height="6" />
        {/* 本 */}
        <rect x="30" y="22" width="14" height="30" fill={COLORS.coral} />
        <rect x="48" y="18" width="12" height="34" fill={COLORS.blue} />
        <rect x="64" y="26" width="16" height="26" fill={COLORS.yellow} />
        <rect x="84" y="20" width="10" height="32" fill={COLORS.navyMid} />
        <rect x="98" y="28" width="18" height="24" fill={COLORS.coral} />
        <rect x="40" y="72" width="60" height="28" rx="2" fill={COLORS.blue} />
        <rect x="104" y="76" width="22" height="24" fill={COLORS.yellow} />
      </g>

      {/* === デスク (大きい横木) === */}
      <g
        stroke={COLORS.outline}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill={COLORS.navyMid}
      >
        <rect x="40" y="320" width="430" height="22" rx="3" />
        <rect x="40" y="342" width="430" height="12" fill={COLORS.navy} />
      </g>

      {/* === 左モニター === */}
      <g strokeWidth="2.5" stroke={COLORS.outline} strokeLinejoin="round">
        {/* 脚 */}
        <path
          d="M 175 320 L 175 308 L 195 308 L 195 320"
          fill={COLORS.navyMid}
        />
        <line x1="160" y1="320" x2="210" y2="320" strokeLinecap="round" />
        {/* 本体 */}
        <rect
          x="80"
          y="170"
          width="160"
          height="138"
          rx="6"
          fill={COLORS.navy}
        />
        {/* 画面エリア */}
        <rect
          x="86"
          y="178"
          width="148"
          height="120"
          rx="2"
          fill={COLORS.navyMid}
          stroke="none"
        />
      </g>
      {/* 左モニターの中身: プレビュー画面 + タイムライン */}
      <g>
        {/* プレビュー (大きな枠) */}
        <rect
          x="94"
          y="188"
          width="86"
          height="60"
          rx="2"
          fill={COLORS.blueLight}
          stroke={COLORS.outline}
          strokeWidth="1.5"
        />
        {/* 再生ボタン (コーラル三角) */}
        <path
          d="M 124 206 L 124 230 L 150 218 Z"
          fill={COLORS.coral}
          stroke={COLORS.outline}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* 右の小三角 */}
        <path
          d="M 192 208 L 192 224 L 204 216 Z"
          fill="none"
          stroke={COLORS.coral}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* タイムライン (横バー) */}
        <rect x="94" y="260" width="130" height="3" rx="1.5" fill={COLORS.coral} />
        <rect x="94" y="268" width="80" height="3" rx="1.5" fill={COLORS.blueLight} />
        <rect x="94" y="276" width="100" height="3" rx="1.5" fill={COLORS.coralLight} />
        <rect x="94" y="284" width="60" height="3" rx="1.5" fill={COLORS.blueLight} />
        {/* シーケンスマーカー */}
        <line
          x1="160"
          y1="256"
          x2="160"
          y2="290"
          stroke={COLORS.coral}
          strokeWidth="1.5"
        />
      </g>

      {/* === 右モニター === */}
      <g strokeWidth="2.5" stroke={COLORS.outline} strokeLinejoin="round">
        <path
          d="M 340 320 L 340 308 L 360 308 L 360 320"
          fill={COLORS.navyMid}
        />
        <line x1="325" y1="320" x2="375" y2="320" strokeLinecap="round" />
        <rect
          x="250"
          y="170"
          width="160"
          height="138"
          rx="6"
          fill={COLORS.navy}
        />
        <rect
          x="256"
          y="178"
          width="148"
          height="120"
          rx="2"
          fill={COLORS.navyMid}
          stroke="none"
        />
      </g>
      {/* 右モニターの中身: タイムライン主体の編集画面 */}
      <g>
        {/* 上部のコントロール小ピル */}
        <rect x="264" y="186" width="22" height="4" rx="2" fill={COLORS.blueLight} />
        <rect x="290" y="186" width="32" height="4" rx="2" fill={COLORS.coral} />
        <rect x="326" y="186" width="14" height="4" rx="2" fill={COLORS.blueLight} />
        {/* 縦シーケンスバー (赤い再生ヘッド) */}
        <line
          x1="324"
          y1="204"
          x2="324"
          y2="290"
          stroke={COLORS.coral}
          strokeWidth="1.5"
        />
        {/* タイムライン横バー */}
        <rect x="264" y="208" width="130" height="4" rx="2" fill={COLORS.blueLight} />
        <rect x="264" y="218" width="110" height="4" rx="2" fill={COLORS.coral} />
        <rect x="264" y="232" width="130" height="6" rx="3" fill={COLORS.coralLight} />
        <rect x="304" y="232" width="50" height="6" rx="3" fill={COLORS.coral} />
        <rect x="264" y="246" width="100" height="4" rx="2" fill={COLORS.blueLight} />
        <rect x="264" y="256" width="130" height="4" rx="2" fill={COLORS.blueLight} />
        <rect x="280" y="256" width="60" height="4" rx="2" fill={COLORS.coral} />
        <rect x="264" y="270" width="90" height="4" rx="2" fill={COLORS.blueLight} />
      </g>

      {/* === マイク (左モニターの前) === */}
      <g stroke={COLORS.outline} strokeWidth="2" strokeLinejoin="round">
        <rect
          x="220"
          y="270"
          width="20"
          height="32"
          rx="10"
          fill={COLORS.navyMid}
        />
        <line x1="230" y1="302" x2="230" y2="316" strokeLinecap="round" />
        <ellipse cx="230" cy="316" rx="14" ry="3" fill={COLORS.navy} />
        {/* マイクの網目 */}
        <line x1="224" y1="278" x2="236" y2="278" />
        <line x1="224" y1="284" x2="236" y2="284" />
        <line x1="224" y1="290" x2="236" y2="290" />
      </g>

      {/* === キャラ (右側 - 横向き) === */}
      <g stroke={COLORS.outline} strokeWidth="2.2" strokeLinejoin="round">
        {/* 体 (Tシャツ) */}
        <path
          d="M 380 320 Q 360 250 400 220 L 460 220 Q 500 250 500 320 Z"
          fill={COLORS.blue}
        />
        {/* 腕 (マウスに伸びる) */}
        <path
          d="M 395 260 Q 380 280 360 300 Q 348 310 360 318 L 380 318"
          fill={COLORS.blue}
        />
        {/* 手 */}
        <ellipse cx="358" cy="310" rx="10" ry="7" fill={COLORS.skin} />
        {/* マウス */}
        <ellipse
          cx="362"
          cy="318"
          rx="9"
          ry="5"
          fill={COLORS.navyMid}
        />
        {/* 首 */}
        <rect x="420" y="200" width="20" height="22" fill={COLORS.skin} />
        {/* 顔 (横向きシルエット) */}
        <path
          d="M 412 200 Q 410 170 430 162 Q 462 158 470 184 Q 472 200 460 208 L 440 210 Q 425 212 412 200 Z"
          fill={COLORS.skin}
        />
        {/* 髪 (コーラル) */}
        <path
          d="M 408 184 Q 405 152 440 144 Q 480 142 480 178 L 480 196 Q 470 180 460 178 Q 444 158 422 168 Q 414 178 408 184 Z"
          fill={COLORS.coral}
        />
        {/* 目 */}
        <circle cx="452" cy="185" r="1.8" fill={COLORS.outline} stroke="none" />
        {/* 口 */}
        <path d="M 456 196 Q 460 198 463 196" fill="none" />
        {/* ヘッドホン */}
        <path
          d="M 408 170 Q 410 140 442 138 Q 478 140 478 172"
          fill="none"
          strokeWidth="3"
        />
        <ellipse cx="406" cy="184" rx="8" ry="12" fill={COLORS.navy} />
        <ellipse cx="480" cy="180" rx="6" ry="10" fill={COLORS.navy} />
      </g>

      {/* === 観葉植物 (左下) === */}
      <g stroke={COLORS.outline} strokeWidth="2" strokeLinejoin="round">
        {/* 葉 */}
        <path
          d="M 36 280 Q 20 250 32 220 Q 46 230 50 270 Z"
          fill={COLORS.coral}
        />
        <path
          d="M 56 290 Q 70 250 86 224 Q 92 250 76 290 Z"
          fill={COLORS.coral}
        />
        <path
          d="M 44 295 Q 48 268 62 248 Q 70 274 62 296 Z"
          fill={COLORS.coralLight}
        />
        {/* 鉢 */}
        <path
          d="M 28 295 L 76 295 L 70 320 L 34 320 Z"
          fill={COLORS.yellow}
        />
      </g>

      {/* === キーボード === */}
      <g stroke={COLORS.outline} strokeWidth="2" strokeLinejoin="round">
        <rect x="250" y="306" width="80" height="10" rx="2" fill={COLORS.cream} />
        <line x1="260" y1="310" x2="260" y2="313" />
        <line x1="270" y1="310" x2="270" y2="313" />
        <line x1="280" y1="310" x2="280" y2="313" />
        <line x1="290" y1="310" x2="290" y2="313" />
        <line x1="300" y1="310" x2="300" y2="313" />
        <line x1="310" y1="310" x2="310" y2="313" />
        <line x1="320" y1="310" x2="320" y2="313" />
      </g>

      {/* === デコレーション: 小さな三角・円 === */}
      <circle cx="350" cy="100" r="8" fill={COLORS.yellow} stroke={COLORS.outline} strokeWidth="1.8" />
      <path
        d="M 320 130 L 332 110 L 344 130 Z"
        fill={COLORS.coralLight}
        stroke={COLORS.outline}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 単独モニター。ホバーで「PLAY」を含む小さなビジュアルとして使う。
 */
export function MonitorMark({ size, ...rest }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size ?? 100}
      height={size ?? 100}
      role="img"
      aria-hidden="true"
      {...rest}
    >
      <rect
        x="10"
        y="14"
        width="80"
        height="58"
        rx="4"
        fill={COLORS.navy}
        stroke={COLORS.outline}
        strokeWidth="2.5"
      />
      <rect
        x="14"
        y="18"
        width="72"
        height="50"
        rx="2"
        fill={COLORS.navyMid}
      />
      <path
        d="M 42 32 L 42 56 L 64 44 Z"
        fill={COLORS.coral}
        stroke={COLORS.outline}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line x1="20" y1="64" x2="60" y2="64" stroke={COLORS.coral} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="60" x2="44" y2="60" stroke={COLORS.blueLight} strokeWidth="2" strokeLinecap="round" />
      <rect x="40" y="72" width="20" height="6" fill={COLORS.navyMid} stroke={COLORS.outline} strokeWidth="2" />
      <rect x="24" y="78" width="52" height="4" rx="2" fill={COLORS.navy} stroke={COLORS.outline} strokeWidth="2" />
    </svg>
  );
}

/** 観葉植物 (鉢付き) */
export function PlantPot({ size, ...rest }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      width={size ?? 100}
      height={size ?? 120}
      role="img"
      aria-hidden="true"
      {...rest}
    >
      <g
        stroke={COLORS.outline}
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path
          d="M 26 80 Q 12 50 26 18 Q 40 28 46 76 Z"
          fill={COLORS.coral}
        />
        <path
          d="M 54 84 Q 70 50 86 22 Q 92 50 76 84 Z"
          fill={COLORS.coral}
        />
        <path
          d="M 40 86 Q 44 60 60 42 Q 70 70 62 88 Z"
          fill={COLORS.coralLight}
        />
        <path
          d="M 18 86 L 84 86 L 76 116 L 26 116 Z"
          fill={COLORS.yellow}
        />
      </g>
    </svg>
  );
}

/** クリエイティブツール三角 (再生ボタン風) */
export function PlayTriangle({ size, ...rest }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 60 60"
      width={size ?? 60}
      height={size ?? 60}
      role="img"
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M 14 8 L 14 52 L 52 30 Z"
        fill={COLORS.coral}
        stroke={COLORS.outline}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 大きなコーラルブロブ (背景デコ) */
export function CoralBlob({ size, ...rest }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size ?? 200}
      height={size ?? 200}
      role="img"
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M 96 6 Q 170 18 188 92 Q 198 168 116 188 Q 30 196 12 116 Q 6 32 96 6 Z"
        fill={COLORS.coral}
      />
    </svg>
  );
}

/** 窓枠 (グリッド) */
export function WindowFrame({ size, ...rest }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      width={size ?? 100}
      height={size ?? 120}
      role="img"
      aria-hidden="true"
      {...rest}
    >
      <rect
        x="4"
        y="4"
        width="92"
        height="112"
        rx="4"
        fill={COLORS.blueLight}
        stroke={COLORS.outline}
        strokeWidth="2.4"
      />
      <line x1="50" y1="4" x2="50" y2="116" stroke={COLORS.outline} strokeWidth="2.4" />
      <line x1="4" y1="60" x2="96" y2="60" stroke={COLORS.outline} strokeWidth="2.4" />
      {/* 光の線 */}
      <line x1="14" y1="14" x2="44" y2="54" stroke={COLORS.white} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <line x1="60" y1="68" x2="84" y2="100" stroke={COLORS.white} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** マイク */
export function StudioMic({ size, ...rest }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 60 100"
      width={size ?? 60}
      height={size ?? 100}
      role="img"
      aria-hidden="true"
      {...rest}
    >
      <g stroke={COLORS.outline} strokeWidth="2.2" strokeLinejoin="round">
        <rect x="18" y="10" width="24" height="50" rx="12" fill={COLORS.navyMid} />
        <line x1="22" y1="22" x2="38" y2="22" />
        <line x1="22" y1="32" x2="38" y2="32" />
        <line x1="22" y1="42" x2="38" y2="42" />
        <line x1="30" y1="60" x2="30" y2="84" strokeLinecap="round" />
        <ellipse cx="30" cy="86" rx="20" ry="5" fill={COLORS.navy} />
      </g>
    </svg>
  );
}

/** 小さな本棚 */
export function MiniBookshelf({ size, ...rest }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 140 80"
      width={size ?? 140}
      height={size ?? 80}
      role="img"
      aria-hidden="true"
      {...rest}
    >
      <g stroke={COLORS.outline} strokeWidth="2">
        <rect x="6" y="34" width="128" height="4" fill={COLORS.outline} />
        <rect x="14" y="8" width="10" height="26" fill={COLORS.coral} />
        <rect x="28" y="4" width="8" height="30" fill={COLORS.blue} />
        <rect x="40" y="12" width="12" height="22" fill={COLORS.yellow} />
        <rect x="56" y="6" width="6" height="28" fill={COLORS.navyMid} />
        <rect x="66" y="14" width="14" height="20" fill={COLORS.coral} />
        <rect x="84" y="8" width="10" height="26" fill={COLORS.coralLight} />
        <rect x="98" y="4" width="8" height="30" fill={COLORS.blue} />
        <rect x="110" y="16" width="18" height="18" rx="2" fill={COLORS.yellow} />
      </g>
    </svg>
  );
}
