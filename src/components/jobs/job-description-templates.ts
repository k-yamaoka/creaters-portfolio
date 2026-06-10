/**
 * 案件詳細フィールドのテンプレート。
 *
 * ユーザー判断によりテンプレートは 1 種に統合 (2026-06-10)。
 * "custom" を選んだ場合は空欄から開始、"standard" を選ぶと共通の
 * 8 セクション (用途 / 配信先 / ターゲット / テイスト / 素材 / 尺本数 /
 * ナレ字幕BGM / その他) の雛形が textarea に挿入される。
 */
export type JobDescriptionTemplate = {
  value: string;
  label: string;
  emoji: string;
  description: string;
  /** textarea に挿入する初期テキスト */
  body: string;
};

const STANDARD_TEMPLATE_BODY = [
  "■ 動画の目的・用途",
  "（例：商品の認知拡大／採用候補者への訴求／サービスの仕組みを説明 など）",
  "",
  "",
  "■ 配信先・掲載先",
  "（例：YouTube／Instagram／TikTok／自社LP／展示会会場 など）",
  "",
  "",
  "■ ターゲット視聴者",
  "（例：20-30代女性／BtoB決裁者／新卒採用候補者 など）",
  "",
  "",
  "■ 希望するテイスト・トンマナ",
  "（例：シネマティック／ミニマル／ポップ など。参考動画URLがあれば併記してください）",
  "",
  "",
  "■ 素材の有無",
  "（例：実写素材あり／全てAI生成希望／撮影が必要 など）",
  "",
  "",
  "■ 尺・本数の補足",
  "（例：メイン1本＋SNS用15秒カットダウン3本 など）",
  "",
  "",
  "■ ナレーション・字幕・BGM",
  "（例：日本語ナレーション希望／字幕入り／既存BGM使用 など）",
  "",
  "",
  "■ その他の要件・補足",
  "（例：特定の演出希望／NG表現／納品スケジュール上の制約 など）",
  "",
].join("\n");

export const JOB_DESCRIPTION_TEMPLATES: JobDescriptionTemplate[] = [
  {
    value: "custom",
    label: "カスタム",
    emoji: "✏️",
    description: "空欄から自由に記入します",
    body: "",
  },
  {
    value: "standard",
    label: "テンプレートを使う",
    emoji: "📋",
    description: "目的 / 配信先 / ターゲット など 8 セクションの雛形を挿入",
    body: STANDARD_TEMPLATE_BODY,
  },
];
