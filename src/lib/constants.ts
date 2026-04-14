export const GENRES = [
  "広告・SNS動画",
  "ショート",
  "解説ビデオ",
  "ファミリー・トラベルビデオ",
  "ゲーム動画",
  "ウェディング・イベントビデオ",
  "コーポレートビデオ",
  "ミュージックビデオ",
  "ショーリール",
  "プロフィールムービー",
  "VR・360°動画",
] as const;

export const PLATFORMS = [
  "SNS",
  "Youtube",
  "Instagram",
  "Tiktok",
] as const;

export const SKILLS = [
  "Premiere Pro",
  "After Effects",
  "DaVinci Resolve",
  "Final Cut Pro",
  "モーショングラフィックス",
  "カラーグレーディング",
  "サウンドデザイン",
  "3DCG",
  "ドローン撮影",
  "撮影ディレクション",
] as const;

export const RATING_LEVELS = [
  { value: 3, label: "満足", emoji: "😊" },
  { value: 2, label: "普通", emoji: "😐" },
  { value: 1, label: "不満", emoji: "😢" },
] as const;
