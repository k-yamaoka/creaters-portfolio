import type { CreatorWithRelations } from "@/lib/supabase/queries";
import type { FullscreenVideoSource } from "@/components/home/hero-fullscreen";

/**
 * Hero フルスクリーン背景動画の共通抽出ロジック。
 *
 * 旧: src/app/(main)/page.tsx に閉じ込めていたものを、/creators や
 * /portfolios でも再利用できるよう lib に切り出した。
 *
 * 仕様:
 * - portfolio_items から mp4 直リンクのみ抽出 (YouTube/Vimeo は埋め込み iframe
 *   が必要で背景動画には不適)
 * - 旧 demo / stock URL (samplelib / cloudinary/demo / test-videos.co.uk 等)
 *   は blacklist で完全除外。Showcase クリエイターの本物作品のみ採用
 * - 横型優先 + usage_role (hero > featured > その他) でランキング
 * - クライアント側で再シャッフルされる前提なので順序保持で十分
 */

const STOCK_URL_BLACKLIST = [
  "samplelib.com",
  "download.samplelib.com",
  "res.cloudinary.com/demo",
  "test-videos.co.uk",
  "interactive-examples.mdn.mozilla.net",
  "Big_Buck_Bunny",
  "sea_turtle",
  "elephants",
  "kitten",
];

export function isStockUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  return STOCK_URL_BLACKLIST.some((needle) =>
    url.toLowerCase().includes(needle.toLowerCase())
  );
}

export function extractHeroVideos(
  creators: CreatorWithRelations[]
): FullscreenVideoSource[] {
  type Scored = { src: string; poster: string | null; rank: number };
  const out: Scored[] = [];
  for (const c of creators) {
    for (const p of c.portfolio_items) {
      if (p.media_type !== "video") continue;
      if (!p.video_url) continue;
      if (!/\.mp4(\?|$)/i.test(p.video_url)) continue;
      if (isStockUrl(p.video_url)) continue;
      const orientationRank = p.aspect_ratio === "horizontal" ? 0 : 1;
      const roleRank = p.usage_role === "hero" ? 0 : p.is_featured ? 1 : 2;
      out.push({
        src: p.video_url,
        poster: p.thumbnail_url ?? null,
        rank: orientationRank * 10 + roleRank,
      });
    }
  }
  out.sort((a, b) => a.rank - b.rank);
  return out.map(({ src, poster }) => ({ src, poster }));
}
