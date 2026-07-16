import { Crown } from "lucide-react";

/**
 * 創設メンバー (Founding Creator) 用バッジ (E-4 実装 2026-07-16)。
 *
 * DB 上のフラグ名は歴史的経緯で `creator_profiles.is_early_member` だが、
 * UI 表記は本コンポーネントで「創設メンバー」に統一する。
 * 先着 50 名限定 (00069 auto_flag_founding_creator トリガー) のため
 * バッジの希少性を担保する。
 *
 * variant:
 *   - "chip"   : 小型 チップ (creator card 一覧、プロフィール見出し)
 *   - "inline" : 見出し横 に添える線状バッジ
 *   - "label"  : テキスト単独 (管理画面フィルタ表示 等)
 */

type Props = {
  variant?: "chip" | "inline" | "label";
  className?: string;
};

export function FoundingMemberBadge({
  variant = "chip",
  className = "",
}: Props) {
  if (variant === "label") {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 ${className}`}
      >
        <Crown
          size={11}
          strokeWidth={2.2}
          fill="currentColor"
          aria-hidden
        />
        創設メンバー
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ${className}`}
      >
        <Crown
          size={11}
          strokeWidth={2.2}
          fill="currentColor"
          aria-hidden
        />
        創設メンバー
      </span>
    );
  }

  // chip (デフォルト)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border border-amber-300/70 bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 shadow-sm ${className}`}
    >
      <Crown
        size={12}
        strokeWidth={2}
        fill="currentColor"
        aria-hidden
      />
      創設メンバー
    </span>
  );
}
