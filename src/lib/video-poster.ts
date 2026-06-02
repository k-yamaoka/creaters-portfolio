/**
 * 動画 URL からポスター画像 URL を導出する。
 *
 * Cloudinary `res.cloudinary.com/.../video/upload/...mp4` は、拡張子を `.jpg`
 * に差し替えるだけで自動生成された first frame の静止画 URL になる。
 * Supabase / 自社 CDN にサムネを置く前のデモ seed でも、ページ初期表示で
 * 動画 metadata を待たずに first frame を出せる。
 *
 * 該当しない CDN の URL は null を返す (呼び出し側でフォールバック)。
 */
const CLOUDINARY_MP4_RE =
  /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/.+)\.mp4(\?.*)?$/;

export function derivePosterUrl(
  videoUrl: string | null | undefined
): string | null {
  if (!videoUrl) return null;
  const m = videoUrl.match(CLOUDINARY_MP4_RE);
  if (!m) return null;
  return `${m[1]}.jpg${m[2] ?? ""}`;
}
