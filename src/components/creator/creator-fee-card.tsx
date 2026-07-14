import { ShieldCheck, TrendingUp } from "lucide-react";
import {
  DEFAULT_CREATOR_FEE_RATE,
  MAX_CREATOR_FEE_RATE,
  formatFeeRatePercent,
  resolveCreatorFeeRate,
} from "@/lib/creator-fee";

/**
 * 「現在の適用システム手数料」を表示するカード。
 *
 * 表示例:
 *   アーリーメンバー: 手数料 0% / アーリーメンバー特典として恒久 0% 適用中
 *   カスタム設定 (5%): 手数料 5% / 個別料率
 *   デフォルト: 手数料 0% / システムデフォルト適用 (立ち上げ期優遇)
 *
 * ダッシュボード TOP や 売上管理ページで、収益の心理的不安を軽減する用途。
 */
type Props = {
  isEarlyMember: boolean;
  customFeeRate: number | null;
  className?: string;
};

export function CreatorFeeCard({
  isEarlyMember,
  customFeeRate,
  className = "",
}: Props) {
  const { rate, model } = resolveCreatorFeeRate({
    isEarlyMember,
    customFeeRate,
  });
  const percent = formatFeeRatePercent(rate);
  const isZero = rate === 0;

  const heading =
    model === "early_member"
      ? "アーリーメンバー特典 適用中"
      : model === "custom"
        ? "個別料率 適用中"
        : "システムデフォルト 適用中";

  const description =
    model === "early_member"
      ? "手数料は 永久 0% です。今後料率が変更されても、あなたには適用されません。"
      : model === "custom"
        ? `個別に設定された特別料率 (${percent}) が適用されています。`
        : rate === 0
          ? `現在は立ち上げ期のため、システムデフォルトが ${percent} に設定されています。`
          : `システムデフォルトの ${percent} が適用されています。`;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ${
            isZero
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
              : "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white"
          }`}
        >
          {isZero ? (
            <ShieldCheck size={18} strokeWidth={2} aria-hidden />
          ) : (
            <TrendingUp size={18} strokeWidth={2} aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            Current system fee ／ 現在の適用システム手数料
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`font-display text-3xl font-black tracking-tight ${
                isZero ? "text-emerald-600" : "text-indigo-700"
              }`}
            >
              {percent}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {heading}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            {description}
          </p>

          {/* 将来料率が変わっても上限 10% が明示的に約束されている旨 */}
          <p className="mt-3 border-t border-gray-100 pt-3 text-[11px] leading-relaxed text-gray-500">
            将来的にシステム手数料が導入されても、上限は{" "}
            <span className="font-bold text-gray-700">
              {formatFeeRatePercent(MAX_CREATOR_FEE_RATE)}
            </span>{" "}
            とお約束します。
            {rate === 0 && model !== "early_member" && (
              <>
                <br />
                現在のデフォルト料率:{" "}
                <span className="font-mono text-gray-700">
                  {formatFeeRatePercent(DEFAULT_CREATOR_FEE_RATE)}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
