import Link from "next/link";

/**
 * Aimovie 公式ロゴ (SVG コンポーネント統一版)。
 *
 * デザイン方針 (Cinema Ink):
 *  - film-strip: 深紺の square frame 内に フィルム perforation (縦 3 個の穴)
 *    と ember の play triangle 相当の dot を配置。
 *  - タイポ: Fraunces (font-display) の "Aimovie" + 末尾 dot を ember 色
 *  - 「light」variant は 白背景用 (mark=深紺塗り / dot=ember)、
 *    「dark」variant は 深紺〜黒背景用 (mark=枠のみ / 白テキスト)。
 *
 * サイズ tokens:
 *   sm  → mark 24px, text-lg      (Header 通常)
 *   md  → mark 32px, text-xl      (Header 大 / Card)
 *   lg  → mark 44px, text-3xl     (Footer)
 *
 * asLink=false のときは <span>、true (デフォルト) は Link href="/"。
 */

type Variant = "light" | "dark";
type Size = "sm" | "md" | "lg";

const SIZE = {
  sm: { mark: 24, text: "text-lg" },
  md: { mark: 32, text: "text-xl" },
  lg: { mark: 44, text: "text-3xl" },
} as const;

type Props = {
  variant?: Variant;
  size?: Size;
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  asLink?: boolean;
  ariaLabel?: string;
};

export function AimovieMark({
  variant = "light",
  size = "md",
}: {
  variant?: Variant;
  size?: Size;
}) {
  const px = SIZE[size].mark;
  const isDark = variant === "dark";
  // colors
  const frame = isDark ? "transparent" : "#0F1E3D"; // dark: 枠のみ / light: 深紺塗り
  const frameStroke = isDark ? "#F7F5F0" : "#0F1E3D";
  const perf = isDark ? "#FFFFFF" : "#F7F5F0"; // フィルム穴
  const dot = "#FF6B35"; // ember
  return (
    <svg
      role="img"
      aria-label="Aimovie mark"
      viewBox="0 0 32 32"
      width={px}
      height={px}
      className="shrink-0"
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="6"
        fill={frame}
        stroke={frameStroke}
        strokeWidth={isDark ? 1.5 : 0}
      />
      {/* フィルム perforation (左端 3 個) */}
      <rect x="4" y="6" width="3" height="3" rx="0.5" fill={perf} />
      <rect x="4" y="14.5" width="3" height="3" rx="0.5" fill={perf} />
      <rect x="4" y="23" width="3" height="3" rx="0.5" fill={perf} />
      {/* ember dot (再生 = 火花 のメタファ) */}
      <circle cx="19" cy="16" r="4" fill={dot} />
    </svg>
  );
}

export function AimovieLogo({
  variant = "light",
  size = "md",
  showText = true,
  showTagline = false,
  className = "",
  asLink = true,
  ariaLabel = "Aimovie ホーム",
}: Props) {
  const isDark = variant === "dark";
  const textClass = SIZE[size].text;
  const textColor = isDark ? "text-white" : "text-aimovie-navy-900";
  const dotColor = "text-aimovie-ember-500";
  const taglineColor = isDark ? "text-white/60" : "text-aimovie-ink-500";

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <AimovieMark variant={variant} size={size} />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={`font-display font-black tracking-tight ${textClass} ${textColor}`}>
            Aimovie<span className={dotColor}>.</span>
          </span>
          {showTagline && (
            <span
              className={`mt-1 text-[9px] font-medium uppercase tracking-[0.22em] ${taglineColor}`}
            >
              アイムビ · AIクリエイター × 企業のマッチング
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (!asLink) return inner;
  return (
    <Link href="/" aria-label={ariaLabel} className="group/logo inline-flex">
      {inner}
    </Link>
  );
}
