/**
 * 職務経歴書 PDF 用の型のみ。
 *
 * CreatorResumePdf.tsx は @react-pdf/renderer (重い) を import するため、
 * 型だけ使うコンポーネント (ResumeDownloadButton や profile page) から
 * 直接 import すると初期バンドルに巻き込まれる。型はここに分離し、
 * 実コードは dynamic import で遅延ロードする。
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
  /** 動画から抽出した代表 5 フレームの URL */
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
