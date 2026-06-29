"use client";

/**
 * 全テンプレート共通の helper / Font registration / constants。
 *
 * 各テンプレートは:
 *  - 自身の StyleSheet を持つ
 *  - common.tsx の Font / Site メタを使う
 *  - thumbDataUrls + frameDataUrls の dataURL マップから画像を引く
 */

import { Font } from "@react-pdf/renderer";

export const SITE = {
  name: "AILIER",
  url: "https://creaters-portfolio.vercel.app",
};

const RESUME_FONT_TTF = "/fonts/SawarabiGothic.ttf";
export const RESUME_FONT_FAMILY = "SawarabiGothic";

let _fontRegistered = false;

export function registerResumeFont(srcOverride?: string) {
  if (_fontRegistered) return;
  try {
    const src = srcOverride ?? RESUME_FONT_TTF;
    Font.register({
      family: RESUME_FONT_FAMILY,
      fonts: [{ src, fontWeight: "normal" }],
    });
    Font.registerHyphenationCallback((word) => Array.from(word));
    _fontRegistered = true;
  } catch {
    /* HMR 多重登録は無視 */
  }
}

export function formatJaDate(d: Date): string {
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const aspectLabel = (
  a: "vertical" | "horizontal" | "square"
): string =>
  a === "vertical" ? "縦型" : a === "square" ? "正方形" : "横型";

/** SNS リンクの順序 + 表示ラベル */
export const SOCIAL_ORDER: Array<{ key: string; label: string }> = [
  { key: "website", label: "Website" },
  { key: "x", label: "X" },
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
];
