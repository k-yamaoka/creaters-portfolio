import { Sparkles } from "lucide-react";

/**
 * アーリーメンバー (創設メンバー) 特典バッジ。
 *
 * is_early_member = true のクリエイターに対して、プロフィール / ダッシュボード
 * 上部に表示する。特別感を演出し、モチベーション向上と離脱防止を狙う。
 *
 * variant:
 *  - "full"   : 見出し + 説明 + ピル で存在感のある表示 (ダッシュボード TOP 用)
 *  - "compact": 1 行のピル型 (プロフィール編集ページなど、コンパクトに置きたい場面)
 */
type Props = {
  variant?: "full" | "compact";
  className?: string;
};

export function EarlyMemberBadge({
  variant = "full",
  className = "",
}: Props) {
  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-pill border border-amber-300/70 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1 text-[11px] font-bold text-amber-800 shadow-sm ${className}`}
      >
        <Sparkles
          size={11}
          strokeWidth={2}
          fill="currentColor"
          aria-hidden
        />
        アーリーメンバー ／ 手数料 永久 0%
      </span>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
          <Sparkles
            size={18}
            strokeWidth={2}
            fill="currentColor"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-amber-900">
              ✨ アーリーメンバー特典 適用中
            </h3>
            <span className="inline-flex items-center rounded-pill border border-amber-400/60 bg-white/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Founding member
            </span>
          </div>
          <p className="mt-1.5 text-sm font-bold text-amber-900">
            システム手数料 <span className="text-lg">永久 0%</span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-amber-900/75">
            立ち上げ期に登録いただいた創設メンバー限定の特典です。
            将来的にシステム手数料 (上限 10%) が導入されても、あなたは今後の
            すべての取引で <span className="font-bold">0% のまま</span> ご利用いただけます。
          </p>
        </div>
      </div>
    </div>
  );
}
