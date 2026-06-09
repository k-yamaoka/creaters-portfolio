/**
 * 案件詳細フィールドのテンプレート集。
 *
 * フォームでユーザーがテンプレート選択 → textarea に挿入 → そのまま自由編集可能。
 * "blank" を選んだ場合は空欄から開始 (= 元の動作)。
 *
 * 構成は共通で:
 *   1. 案件背景
 *   2. ターゲット視聴者
 *   3. 訴求ポイント
 *   4. 希望テイスト・トーン
 *   5. 期待する効果
 *   6. その他の要件
 * とし、ジャンルごとに具体例だけ差し替える。
 */
export type JobDescriptionTemplate = {
  value: string;
  label: string;
  emoji: string;
  description: string;
  /** textarea に挿入する初期テキスト */
  body: string;
};

const sectionHeader = (n: number, title: string) => `■ ${n}. ${title}`;

export const JOB_DESCRIPTION_TEMPLATES: JobDescriptionTemplate[] = [
  {
    value: "blank",
    label: "カスタム",
    emoji: "✏️",
    description: "空欄から自由に記入します",
    body: "",
  },

  {
    value: "sns_ad",
    label: "SNS広告動画",
    emoji: "📱",
    description: "Meta / TikTok / YouTube Shorts などの広告動画向け",
    body: [
      sectionHeader(1, "案件背景・目的"),
      "・商品 / サービス名:",
      "・このタイミングで動画を作る背景 (新商品リリース / リブランディング 等):",
      "・配信先プラットフォーム (Meta / TikTok / YouTube Shorts / X):",
      "",
      sectionHeader(2, "ターゲット視聴者"),
      "・性別 / 年齢層:",
      "・興味関心:",
      "・購入決定までの動き (即決 / 比較検討型):",
      "",
      sectionHeader(3, "訴求ポイント"),
      "1.",
      "2.",
      "3.",
      "",
      sectionHeader(4, "希望テイスト・トーン"),
      "・雰囲気 (明るい / シリアス / クール / ポップ):",
      "・参考動画 URL:",
      "",
      sectionHeader(5, "期待する効果 (KPI)"),
      "・CTR / CVR 目標:",
      "・配信予算 / 期間:",
      "",
      sectionHeader(6, "その他の要件"),
      "・字幕の必要性:",
      "・ロゴ / 商品素材の支給有無:",
      "・避けたい表現 / NG 要素:",
    ].join("\n"),
  },

  {
    value: "product",
    label: "プロダクト紹介動画",
    emoji: "📦",
    description: "EC / LP に載せる商品紹介・デモ動画向け",
    body: [
      sectionHeader(1, "プロダクト概要"),
      "・商品 / サービス名:",
      "・特徴 (3 行で):",
      "・販売チャネル (自社 EC / Amazon / 楽天 / 店頭):",
      "",
      sectionHeader(2, "ターゲット視聴者"),
      "・想定購入者像:",
      "・購買意思決定までの平均期間:",
      "",
      sectionHeader(3, "訴求ポイント"),
      "・他社製品との差別化要素:",
      "・主要なベネフィット 3 点:",
      "",
      sectionHeader(4, "希望テイスト・トーン"),
      "・参考にしたい商品紹介動画 URL:",
      "・雰囲気 (高級感 / フレンドリー / プロフェッショナル):",
      "",
      sectionHeader(5, "納品物の使い道"),
      "・自社 LP のヒーロー動画:",
      "・SNS 投稿用に切り出し ◯本:",
      "・店頭サイネージ用 ◯秒:",
      "",
      sectionHeader(6, "その他の要件"),
      "・商品素材 (写真 / 3D データ) の支給有無:",
      "・ナレーション / BGM の希望:",
    ].join("\n"),
  },

  {
    value: "explainer",
    label: "サービス解説 (Explainer)",
    emoji: "💡",
    description: "SaaS / アプリ / 制度の仕組みをわかりやすく説明",
    body: [
      sectionHeader(1, "サービス概要"),
      "・サービス名:",
      "・解決する課題:",
      "・対象ユーザー:",
      "",
      sectionHeader(2, "解説したい流れ (シナリオ)"),
      "・現状の課題 →",
      "・サービス導入後 →",
      "・得られる成果 →",
      "",
      sectionHeader(3, "視聴者に取ってほしい行動"),
      "・無料トライアル登録 / 資料ダウンロード / 問合せ 等:",
      "",
      sectionHeader(4, "希望テイスト・トーン"),
      "・参考にしたい Explainer 動画 URL:",
      "・キャラクター / 実写 / モーショングラフィックス の好み:",
      "",
      sectionHeader(5, "尺の目安と配信先"),
      "・尺の希望 (60 秒 / 90 秒 / 2 分):",
      "・配信先 (LP / 営業資料 / カンファレンス):",
      "",
      sectionHeader(6, "その他の要件"),
      "・ロゴ / カラー / フォントの指定:",
      "・字幕言語 (日 / 英 / 多言語):",
    ].join("\n"),
  },

  {
    value: "corporate_vp",
    label: "会社紹介・コーポレートVP",
    emoji: "🏢",
    description: "企業ブランディング / 採用 / IR で使用",
    body: [
      sectionHeader(1, "会社概要"),
      "・社名 / 設立 / 業種:",
      "・事業内容 (3 行で):",
      "・主要なミッション / ビジョン:",
      "",
      sectionHeader(2, "動画の用途"),
      "・コーポレートサイト Hero / 採用ページ / 株主総会 / 営業資料:",
      "・配信期間 (常設 / イベント時のみ):",
      "",
      sectionHeader(3, "伝えたいメッセージ"),
      "・最も伝えたい 1 メッセージ:",
      "・補足ポイント 2-3 点:",
      "",
      sectionHeader(4, "希望テイスト・トーン"),
      "・参考企業 VP の URL:",
      "・雰囲気 (シネマティック / ドキュメンタリー / クリーン):",
      "",
      sectionHeader(5, "登場素材・撮影"),
      "・社員 / 経営陣の登場有無:",
      "・社内・社外撮影の希望 (AI 生成中心 / 実写素材も活用):",
      "",
      sectionHeader(6, "その他の要件"),
      "・ロゴ / ブランドガイドラインの遵守:",
      "・想定される NG 表現:",
    ].join("\n"),
  },

  {
    value: "recruit",
    label: "採用動画",
    emoji: "🎯",
    description: "新卒 / 中途採用、リクルーティング媒体向け",
    body: [
      sectionHeader(1, "募集背景"),
      "・募集ポジション:",
      "・採用したい人物像:",
      "・配信先 (自社採用ページ / Wantedly / YouTube 等):",
      "",
      sectionHeader(2, "伝えたい会社の魅力"),
      "1.",
      "2.",
      "3.",
      "",
      sectionHeader(3, "視聴者に取ってほしい行動"),
      "・エントリー / カジュアル面談予約 / 説明会参加 等:",
      "",
      sectionHeader(4, "希望テイスト・トーン"),
      "・参考にしたい採用動画 URL:",
      "・雰囲気 (情熱型 / 落ち着いた / カジュアル):",
      "",
      sectionHeader(5, "尺・本数"),
      "・本編尺 (30 秒 / 60 秒 / 3 分):",
      "・SNS 用切り出しの希望本数:",
      "",
      sectionHeader(6, "その他の要件"),
      "・社員の顔出し / 仮名対応:",
      "・ロゴ / 採用キービジュアルの支給:",
    ].join("\n"),
  },

  {
    value: "mv",
    label: "ミュージックビデオ",
    emoji: "🎵",
    description: "アーティスト / 楽曲タイアップの MV 制作",
    body: [
      sectionHeader(1, "楽曲・アーティスト概要"),
      "・楽曲名 / アーティスト名:",
      "・ジャンル / 公開予定日:",
      "・既存配信 URL (Spotify / Apple Music 等):",
      "",
      sectionHeader(2, "MV の方向性"),
      "・楽曲の世界観 / コンセプト:",
      "・既存 MV や参考映像 URL:",
      "",
      sectionHeader(3, "映像のキー要素"),
      "・アーティストの登場 (実写 / AI アバター):",
      "・舞台・背景 (現実 / SF / ファンタジー):",
      "",
      sectionHeader(4, "希望テイスト・トーン"),
      "・色設計 (ネオン / 落ち着いた / モノクロ):",
      "・編集テンポ (高速カット / ロングテイク):",
      "",
      sectionHeader(5, "尺・公開先"),
      "・本編尺 (フル尺 / 60 秒 ティザー):",
      "・公開チャネル (YouTube / TikTok / IG Reels):",
      "",
      sectionHeader(6, "その他の要件"),
      "・歌詞テロップの有無:",
      "・歌詞配給範囲 (権利関係):",
    ].join("\n"),
  },
];
