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
  "VR ・ 360°動画",
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

// 編集要件フォーム用の選択肢
export const EDIT_WORK_TYPES = [
  "カット",
  "テロップ",
  "BGM",
  "SE",
  "カラグレ",
  "MA",
] as const;

export const EDIT_SOFTWARE_OPTIONS = [
  "Premiere Pro",
  "DaVinci",
  "AfterEffects",
  "Final Cut",
] as const;

export const EDIT_DELIVERY_FORMATS = [
  "MP4 1080p",
  "4K",
  "ProRes",
  "プロジェクトファイル含む",
] as const;

export const CLIENT_TYPES = [
  { value: "individual", label: "個人" },
  { value: "sme", label: "中小企業" },
  { value: "listed", label: "上場企業" },
] as const;
