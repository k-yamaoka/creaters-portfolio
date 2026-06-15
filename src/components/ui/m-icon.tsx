/**
 * Google Material Symbols (Outlined) の軽量ラッパー。
 *
 * フォント本体は app/layout.tsx で読み込み済みなので、ここでは <span> を
 * 出すだけ。`fill` を true にすると塗りつぶしバリエーションになる
 * (お気に入りの赤ハートなど)。
 *
 * 使い方:
 *   <MIcon name="favorite" />
 *   <MIcon name="favorite" fill className="text-red-500" />
 *   <MIcon name="check_circle" size={20} />
 *
 * 全アイコン名は https://fonts.google.com/icons から検索可能。
 */
import * as React from "react";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  /** Material Symbols のアイコン名 (例: "favorite", "movie") */
  name: string;
  /** 塗りつぶしバリエーション (FILL = 1) */
  fill?: boolean;
  /** 太さ (100–700)。既定 400 */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  /** 表示サイズ (px)。font-size として適用 */
  size?: number;
};

export function MIcon({
  name,
  fill = false,
  weight = 400,
  size,
  className = "",
  style,
  ...rest
}: Props) {
  // font-variation-settings で FILL / wght / GRAD / opsz を制御
  const optical = size ?? 24;
  const vars: React.CSSProperties = {
    fontSize: size ? `${size}px` : undefined,
    lineHeight: 1,
    fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${optical}`,
    // 絵文字の縦位置ズレを抑える
    verticalAlign: "middle",
    userSelect: "none",
    ...style,
  };
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={vars}
      {...rest}
    >
      {name}
    </span>
  );
}
