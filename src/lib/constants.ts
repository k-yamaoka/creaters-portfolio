export const GENRES = [
  "広告・SNS動画",
  "ショート",
  "解説ビデオ",
  "ファミリー・トラベルビデオ",
  "ゲーム動画",
  "ウェディング・イベントビデオ",
  "コーポレートビデオ",
  "ミュージックビデオ",
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

// 作業内容のヘルプ説明 (ツールチップ用)
export const EDIT_WORK_TYPE_DESCRIPTIONS: Record<string, string> = {
  カット: "不要部分の削除や場面のつなぎ編集",
  テロップ: "字幕・タイトル等のテキストを挿入する作業",
  BGM: "背景音楽の選定・配置",
  SE: "効果音の選定・付与（クリック音やヒット音など）",
  カラグレ: "映像の色味を調整する工程",
  MA: "効果音の挿入・声のバランスを調整する作業（音声整音／ミックス）",
};

export const EDIT_SOFTWARE_OPTIONS = [
  "Premiere Pro",
  "DaVinci",
  "AfterEffects",
  "Final Cut",
  "Photoshop",
  "Illustrator",
  "特に指定なし",
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
