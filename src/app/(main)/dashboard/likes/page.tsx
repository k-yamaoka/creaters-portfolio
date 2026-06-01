import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";

export const metadata: Metadata = {
  title: "いいねした動画",
};

export const dynamic = "force-dynamic";

type LikedItem = {
  id: string;
  title: string;
  description: string;
  media_type: "video" | "image";
  video_url: string | null;
  video_platform: string;
  image_url: string | null;
  thumbnail_url: string | null;
  aspect_ratio: "vertical" | "horizontal" | "square";
  genre: string | null;
  tags: string[];
  like_count: number;
};

export default async function LikesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/likes");
  }

  // ユーザーがいいねした portfolio_items を新しい順で取得
  const { data: rows } = await supabase
    .from("portfolio_likes")
    .select(
      `
      created_at,
      portfolio_item:portfolio_items (
        id, title, description, media_type,
        video_url, video_platform, image_url, thumbnail_url,
        aspect_ratio, like_count, genre, tags
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items: LikedItem[] = (rows ?? [])
    .map((r) => {
      const raw = (r as { portfolio_item: LikedItem | LikedItem[] | null })
        .portfolio_item;
      return Array.isArray(raw) ? raw[0] : raw;
    })
    .filter((p): p is LikedItem => !!p);

  return (
    <div className="relative mx-auto max-w-container px-6 py-12 lg:px-10">
      <div className="mb-8">
        <p className="inline-flex items-center gap-2 rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-neon-pink-soft">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-pink" />
          MY FAVORITES
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-[2.5rem]">
          ❤️ いいねした動画
        </h1>
        <p className="mt-2 text-sm text-white/65">
          {items.length} 件
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-sm">
          <p className="text-3xl">🤍</p>
          <h2 className="mt-3 text-lg font-black text-white">
            まだ「いいね」した作品がありません
          </h2>
          <p className="mt-2 text-sm text-white/65">
            気に入った作品にハートを付けるとここに表示されます。
          </p>
          <Link
            href="/portfolios"
            className="mt-6 inline-flex items-center gap-2 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,77,157,0.5)] transition-all hover:-translate-y-0.5"
          >
            ポートフォリオを見る →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
          <PortfolioGrid items={items} />
        </div>
      )}
    </div>
  );
}
