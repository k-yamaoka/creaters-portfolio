/**
 * 職務経歴書 PDF 用の型のみ。
 *
 * CreatorResumePdf.tsx / templates/* は @react-pdf/renderer (重い) を
 * import するため、型だけ使うコンポーネント (ResumeDownloadButton や
 * profile page) から直接 import すると初期バンドルに巻き込まれる。
 * 型はここに分離し、実コードは dynamic import で遅延ロードする。
 */

export type ResumeWork = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  video_url: string | null;
  external_url: string | null;
  aspect_ratio: "vertical" | "horizontal" | "square";
  tags: string[];
  genre: string | null;
  used_ai_tools: string[];
  /** 動画から抽出した代表 5 フレームの URL。生成済のもののみ。 */
  frame_urls: string[];
};

export type ResumeData = {
  displayName: string;
  email: string | null;
  avatarUrl?: string | null;
  bio: string;
  location: string | null;
  yearsOfExperience: number;
  genres: string[];
  strengths: string[];
  aiTools: string[];
  videoLengths: string[];
  socialLinks: Record<string, string>;
  works: ResumeWork[];
};

/**
 * テンプレート ID。20 個まで拡張する想定。
 * Phase 1: 5 種 (各カテゴリ A) を実装
 * Phase 2-4: 各カテゴリ B/C/D を順次追加 → 計 20 種
 */
export type ResumeTemplateId =
  | "cinematic-a" | "cinematic-b" | "cinematic-c" | "cinematic-d"
  | "minimal-a" | "minimal-b" | "minimal-c" | "minimal-d"
  | "editorial-a" | "editorial-b" | "editorial-c" | "editorial-d"
  | "data-a" | "data-b" | "data-c" | "data-d"
  | "proposal-a" | "proposal-b" | "proposal-c" | "proposal-d";

export type ResumeTemplateMeta = {
  id: ResumeTemplateId;
  label: string;
  description: string;
  category: "cinematic" | "minimal" | "editorial" | "data" | "proposal";
  /** Phase 1 で未実装の枠 (UI 上は disabled で表示) */
  comingSoon?: boolean;
};

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: "cinematic-a",
    label: "シネマティック",
    description: "黒背景に動画フレームを大型パノラマ表示。映像作品の世界観を最大限演出",
    category: "cinematic",
  },
  {
    id: "minimal-a",
    label: "ミニマル",
    description: "白背景 + 罫線中心。読みやすさと余白を重視した洗練された印象",
    category: "minimal",
  },
  {
    id: "editorial-a",
    label: "エディトリアル",
    description: "雑誌風レイアウト。タイポグラフィにメリハリを付けた読み物的構成",
    category: "editorial",
  },
  {
    id: "data-a",
    label: "データ重視",
    description: "スキル・タグ・数字を視覚的に強調。ロジカルな印象を作る",
    category: "data",
  },
  {
    id: "proposal-a",
    label: "企画書",
    description: "プレゼンテーション形式。クライアント向けに大型ビジュアルで訴求",
    category: "proposal",
  },
  // === Phase 2-4 で追加予定 (各カテゴリ +3 で計 20) ===
  { id: "cinematic-b", label: "シネマティック B", description: "クールトーン (ブルー基調) のシネマ風", category: "cinematic", comingSoon: true },
  { id: "cinematic-c", label: "シネマティック C", description: "セピア + ヴィンテージフィルム調", category: "cinematic", comingSoon: true },
  { id: "cinematic-d", label: "シネマティック D", description: "モノクローム + 高コントラスト", category: "cinematic", comingSoon: true },
  { id: "minimal-b", label: "ミニマル B", description: "セリフ書体 + 中央揃え", category: "minimal", comingSoon: true },
  { id: "minimal-c", label: "ミニマル C", description: "薄グレー背景 + 余白拡張", category: "minimal", comingSoon: true },
  { id: "minimal-d", label: "ミニマル D", description: "縦書き風レイアウト", category: "minimal", comingSoon: true },
  { id: "editorial-b", label: "エディトリアル B", description: "新聞風 (3 段組み + 細罫線)", category: "editorial", comingSoon: true },
  { id: "editorial-c", label: "エディトリアル C", description: "アート雑誌風 (大型ビジュアル先行)", category: "editorial", comingSoon: true },
  { id: "editorial-d", label: "エディトリアル D", description: "ファッション誌風 (タイポ重視)", category: "editorial", comingSoon: true },
  { id: "data-b", label: "データ B", description: "ダッシュボード風 (グラフ + 数値)", category: "data", comingSoon: true },
  { id: "data-c", label: "データ C", description: "インフォグラフィック風", category: "data", comingSoon: true },
  { id: "data-d", label: "データ D", description: "スキルレーダー + バーチャート", category: "data", comingSoon: true },
  { id: "proposal-b", label: "企画書 B", description: "コーポレート (グレースケール + ロゴ強調)", category: "proposal", comingSoon: true },
  { id: "proposal-c", label: "企画書 C", description: "アグレッシブ (ビビッドカラー + 大型ナンバリング)", category: "proposal", comingSoon: true },
  { id: "proposal-d", label: "企画書 D", description: "ピッチデッキ風 (作品 = 大型 1 ページ)", category: "proposal", comingSoon: true },
];
