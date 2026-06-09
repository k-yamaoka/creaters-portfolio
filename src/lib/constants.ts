// AILIER 制作ジャンル (10 項目 / 2026-06-09 改訂)
// 「その他（自由記入）」はジャンルとして並べず、フォーム側の "+ その他"
// トグル + 自由入力で対応する (job-form.tsx)。
export const GENRES = [
  "SNS広告動画",
  "プロダクト紹介動画",
  "サービス解説動画（Explainer）",
  "マニュアル・操作説明動画（How-to）",
  "会社紹介・コーポレートVP",
  "採用動画",
  "展示会・イベント映像",
  "ミュージックビデオ",
  "ショートドラマ",
  "AIアバター・キャラクター動画",
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

// 使用 AI ツール (カテゴリ別、複数選択可)
export const AI_TOOLS: { name: string; category: string }[] = [
  // Video
  { name: "Sora 2", category: "Video" },
  { name: "Veo 3", category: "Video" },
  { name: "Runway Gen-4", category: "Video" },
  { name: "Kling 2.x", category: "Video" },
  { name: "Pika 2.0", category: "Video" },
  { name: "Luma Dream Machine", category: "Video" },
  { name: "Higgsfield", category: "Video" },
  // Image
  { name: "Midjourney", category: "Image" },
  { name: "Stable Diffusion", category: "Image" },
  { name: "DALL·E 3", category: "Image" },
  { name: "Flux", category: "Image" },
  { name: "Adobe Firefly", category: "Image" },
  { name: "Leonardo", category: "Image" },
  // Audio / Voice
  { name: "ElevenLabs", category: "Audio" },
  { name: "Suno", category: "Music" },
  { name: "Udio", category: "Music" },
  // Editing
  { name: "After Effects", category: "Edit" },
  { name: "Premiere Pro", category: "Edit" },
  { name: "DaVinci Resolve", category: "Edit" },
  { name: "CapCut Pro", category: "Edit" },
  // Upscale / Other
  { name: "Topaz Video AI", category: "Upscale" },
  { name: "Magnific", category: "Upscale" },
];

export const AI_TOOL_CATEGORIES = [
  "Video",
  "Image",
  "Audio",
  "Music",
  "Edit",
  "Upscale",
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

// 使用ソフト (AI 動画生成系のみに刷新、2026-06-03)
export const EDIT_SOFTWARE_OPTIONS = [
  "Seedance",
  "Veo",
  "Sora",
  "Runway",
  "google omni",
  "Kling AI",
  "Hailuo AI",
  "Pika",
] as const;

export const EDIT_DELIVERY_FORMATS = [
  "MP4 1080p",
  "4K",
  "ProRes",
] as const;

// 案件のアスペクト比 (2026-06-03 追加)
export const JOB_ASPECT_RATIOS = [
  { value: "horizontal", label: "横型（16:9）" },
  { value: "vertical", label: "縦型（9:16）" },
] as const;

/**
 * ビジュアルスタイル (案件作成時に企業が想定する方向性を選ぶ)。
 * - value: DB 保存用 slug
 * - label: 表示名
 * - image: タイル UI で表示する実画像 (public/images/visual-styles 配下)
 * - hint: 雰囲気を補足する短い英単語ラベル (右上に小さく)
 *
 * 画像は AI 生成 (Nano Banana 2) のオリジナル写真を sips でリサイズ・JPEG 化して
 * 同梱。差し替える場合は同じパスに同名で上書きすれば足りる。
 */
export const JOB_VISUAL_STYLES = [
  {
    value: "cinematic",
    label: "シネマティック",
    image: "/images/visual-styles/cinematic.jpg",
    hint: "Cinematic",
  },
  {
    value: "documentary",
    label: "ドキュメンタリー",
    image: "/images/visual-styles/documentary.jpg",
    hint: "Documentary",
  },
  {
    value: "hollywood_blockbuster",
    label: "ハリウッド大作風",
    image: "/images/visual-styles/hollywood_blockbuster.jpg",
    hint: "Blockbuster",
  },
  {
    value: "anime_jp",
    label: "日本アニメ",
    image: "/images/visual-styles/anime_jp.jpg",
    hint: "Anime JP",
  },
  {
    value: "cg_3d",
    label: "3DCGアニメ",
    image: "/images/visual-styles/cg_3d.jpg",
    hint: "3D CG",
  },
  {
    value: "anime_2d_flat",
    label: "2Dフラットアニメ",
    image: "/images/visual-styles/anime_2d_flat.jpg",
    hint: "2D Flat",
  },
  {
    value: "hand_drawn",
    label: "手描き風",
    image: "/images/visual-styles/hand_drawn.jpg",
    hint: "Hand-drawn",
  },
  {
    value: "clean_corporate",
    label: "クリーン・コーポレート",
    image: "/images/visual-styles/clean_corporate.jpg",
    hint: "Corporate",
  },
  {
    value: "neon_sci_fi",
    label: "ネオン・SF",
    image: "/images/visual-styles/neon_sci_fi.jpg",
    hint: "Neon SF",
  },
  {
    value: "fantasy",
    label: "ファンタジー",
    image: "/images/visual-styles/fantasy.jpg",
    hint: "Fantasy",
  },
  {
    value: "monochrome",
    label: "モノクロ",
    image: "/images/visual-styles/monochrome.jpg",
    hint: "Monochrome",
  },
] as const;

export type JobVisualStyleValue = (typeof JOB_VISUAL_STYLES)[number]["value"];

/* =============================================================
 *  料金プラン (service_packages) の詳細設定 — 2026-06-03 追加
 * ============================================================= */

// 企画・構成・絵コンテの対応
export const PLANNING_SUPPORT_OPTIONS = [
  { value: "included", label: "プランに含む" },
  { value: "optional", label: "オプション対応" },
  { value: "client_supplied", label: "クライアント支給" },
  { value: "not_included", label: "対応なし" },
] as const;

// 旧 PACKAGE_TOOLS は 2026-06-03 に分割。
// 移行: PACKAGE_SOFTWARES (編集ソフト) と PACKAGE_AI_TOOLS (生成 AI) に分離。

// 使用ソフト (編集・制作ツール)
export const PACKAGE_SOFTWARES = [
  "Adobe Premiere Pro",
  "Adobe After Effects",
  "DaVinci Resolve",
  "Final Cut Pro",
  "CapCut",
  "Adobe Photoshop",
  "Adobe Illustrator",
  "Figma",
] as const;

// 使用 生成 AI ツール
export const PACKAGE_AI_TOOLS = [
  "Sora",
  "Veo",
  "Runway",
  "Luma Dream Machine",
  "Luma AI",
  "Kling",
  "Hailuo",
  "Pika",
  "Midjourney",
  "Stable Diffusion",
  "Flux",
  "DALL·E",
  "Adobe Firefly",
  "ElevenLabs",
  "Suno",
  "Udio",
  "ChatGPT",
  "Claude",
  "Gemini",
] as const;

// ナレーション・音声の対応
export const VOICEOVER_OPTIONS = [
  { value: "none", label: "なし" },
  { value: "ai_voice", label: "AI 音声合成 (ElevenLabs 等)" },
  { value: "human", label: "人間ナレーション" },
  { value: "client_supplied", label: "クライアント支給" },
] as const;

// 納品解像度
export const RESOLUTION_OPTIONS = [
  { value: "fhd", label: "フル HD (1920×1080)" },
  { value: "4k", label: "4K (3840×2160)" },
  { value: "social_vertical", label: "縦型 SNS (1080×1920)" },
  { value: "square", label: "正方形 (1080×1080)" },
] as const;

// 商用利用 / 著作権の扱い
export const COMMERCIAL_USE_OPTIONS = [
  { value: "web_only", label: "Web 商用利用可" },
  { value: "commercial", label: "全媒体での商用利用可" },
  { value: "transfer", label: "著作権譲渡" },
  { value: "custom", label: "カスタム (備考に記載)" },
] as const;

// 提供する映像尺の目安
export const DURATION_TARGET_OPTIONS = [
  "〜15 秒",
  "〜30 秒",
  "〜60 秒",
  "1〜3 分",
  "3〜10 分",
  "10 分以上",
  "ループ動画",
] as const;

export const CLIENT_TYPES = [
  { value: "individual", label: "個人" },
  { value: "sme", label: "中小企業" },
  { value: "listed", label: "上場企業" },
] as const;
