/**
 * クリエイター手数料計算ユーティリティ。
 *
 * ビジネス要件 (2026-07-14 実装):
 *  - クリエイター向けシステム手数料は当面 0% (立ち上げ期の優遇)
 *  - 立ち上げ期に登録したユーザー = アーリーメンバーは恒久 0%
 *  - 将来的な有料化時も上限 10%
 *
 * 定数を一箇所に集約することで、料率変更時の影響範囲を最小化する。
 */

/** システム全体のデフォルト手数料率 (当面 0%)。将来的な有料化時にこの値を変更する */
export const DEFAULT_CREATOR_FEE_RATE = 0.0;

/** 個別料率の上限 (安全弁 / 仕様上限)。DB CHECK 制約と同期させる */
export const MAX_CREATOR_FEE_RATE = 0.1;

/** 現在の手数料モデル種別 (UI 表示 / 分析用) */
export type FeeModel =
  | "early_member" // アーリーメンバー特典で 0% 固定
  | "custom" //     個別に custom_fee_rate が設定されている
  | "default"; //   システムデフォルト適用

export type CreatorFeeContext = {
  isEarlyMember: boolean;
  /** null のときはシステムデフォルトを使う */
  customFeeRate: number | null;
};

export type CreatorFeeBreakdown = {
  /** 元の総額 (発注金額) */
  gross: number;
  /** 適用された手数料率 (0.0 〜 MAX_CREATOR_FEE_RATE) */
  rate: number;
  /** 手数料モデル (どのロジックで rate が決まったか) */
  model: FeeModel;
  /** プラットフォーム手数料 (円、整数に floor) */
  platformFee: number;
  /** クリエイターへの支払い額 (円) */
  creatorPayout: number;
};

/**
 * 手数料率を解決する。
 *  1. is_early_member = true → 強制的に 0%
 *  2. custom_fee_rate が有効値 → その値
 *  3. それ以外 → DEFAULT_CREATOR_FEE_RATE
 */
export function resolveCreatorFeeRate(ctx: CreatorFeeContext): {
  rate: number;
  model: FeeModel;
} {
  if (ctx.isEarlyMember) {
    return { rate: 0, model: "early_member" };
  }
  if (
    ctx.customFeeRate !== null &&
    ctx.customFeeRate !== undefined &&
    Number.isFinite(ctx.customFeeRate) &&
    ctx.customFeeRate >= 0 &&
    ctx.customFeeRate <= MAX_CREATOR_FEE_RATE
  ) {
    return { rate: ctx.customFeeRate, model: "custom" };
  }
  return { rate: DEFAULT_CREATOR_FEE_RATE, model: "default" };
}

/**
 * 発注総額とクリエイターの手数料コンテキストから、
 * platform_fee / creator_payout を算出する。
 * 銭 未満は floor (プラットフォーム有利側)。
 */
export function calculateCreatorPayout(
  gross: number,
  ctx: CreatorFeeContext
): CreatorFeeBreakdown {
  const safeGross = Math.max(0, Math.floor(gross || 0));
  const { rate, model } = resolveCreatorFeeRate(ctx);
  const platformFee = Math.floor(safeGross * rate);
  const creatorPayout = safeGross - platformFee;
  return { gross: safeGross, rate, model, platformFee, creatorPayout };
}

/**
 * 手数料率をパーセント表示文字列にする (UI 表示用)。
 * 0.0 → "0%"、0.05 → "5%"、0.075 → "7.5%"
 */
export function formatFeeRatePercent(rate: number): string {
  const pct = rate * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}
