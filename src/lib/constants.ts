// AILIER 制作ジャンル (13項目 / 2026-05 リブランド)
export const GENRES = [
  "SNS広告動画",
  "ブランドムービー",
  "採用動画",
  "プロダクト紹介動画",
  "サービス解説動画(Explainer)",
  "LP用ヒーロー動画",
  "ミュージックビデオ",
  "新商品ローンチ動画",
  "展示会・イベント映像",
  "AIアバター・キャラクター動画",
  "多言語ローカライズ動画",
  "ショートフィルム・アート映像",
  "その他カスタム動画",
] as const;

// 得意映像尺 (8項目、複数選択)
export const VIDEO_LENGTHS = [
  "〜6秒",
  "〜15秒(SNS広告標準)",
  "〜30秒(SNS広告長め)",
  "〜60秒",
  "1〜3分(解説動画 / ショートドラマ)",
  "3〜10分(長尺解説 / ドキュメンタリー)",
  "10分以上(長尺コンテンツ)",
  "ループ動画(無限再生用 / GIF代替)",
] as const;

// 強み (11項目、最大2つまで選択)
export const STRENGTHS = [
  "土日対応可能",
  "夜間対応可",
  "1時間以内返信",
  "スピード納品",
  "緊急案件対応可",
  "多言語ローカライズ対応",
  "気軽に相談OK",
  "映像制作会社出身",
  "こだわり高品質型",
  "トレンド先取り型",
  "大手企業実績あり",
] as const;
export const MAX_STRENGTHS = 2;

// ポートフォリオ検索用フォーマット(アスペクト比) - 4項目
export const PORTFOLIO_FORMATS = [
  { value: "all", label: "全て" },
  { value: "vertical", label: "縦型(9:16)" },
  { value: "horizontal", label: "横型(16:9)" },
  { value: "square", label: "正方形" },
] as const;
export type PortfolioFormat = (typeof PORTFOLIO_FORMATS)[number]["value"];

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
