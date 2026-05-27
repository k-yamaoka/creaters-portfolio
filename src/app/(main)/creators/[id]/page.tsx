import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCreatorById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { ReviewList } from "@/components/reviews/review-list";

export default async function CreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await getCreatorById(id);

  if (!creator) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  let viewerRole: string | null = null;
  if (viewer) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", viewer.id)
      .maybeSingle();
    viewerRole = (viewerProfile?.role as string | undefined) ?? null;
  }
  const canMessageCreator = viewerRole === "client" || viewerRole === "admin";

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comment, created_at,
      client:client_profiles!reviews_client_id_fkey (
        profiles!client_profiles_user_id_fkey ( display_name )
      )
    `
    )
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  const displayName = creator.profiles.display_name;
  const avatarUrl = creator.profiles.avatar_url;
  const isVerified = creator.profiles.is_verified;
  const activePackages = creator.service_packages.filter((p) => p.is_active);

  const hasReviews = creator.review_count > 0;

  return (
    <>
      {/* =================================================
          HERO BAND
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep py-16 text-white">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(157,92,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(157,92,255,0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
        <div className="absolute -left-32 top-0 h-[360px] w-[360px] rounded-full bg-neon-pink opacity-25 blur-[100px]" />
        <div className="absolute -right-20 bottom-0 h-[300px] w-[300px] rounded-full bg-neon-cyan opacity-20 blur-[100px]" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          {/* Breadcrumb */}
          <nav className="mb-6 text-xs text-white/60">
            <Link href="/creators" className="hover:text-neon-pink">
              AIクリエイターを探す
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{displayName}</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-neon-pink/60 bg-neon-midnight shadow-[0_0_24px_rgba(255,77,157,0.4)]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-pink to-neon-purple text-3xl font-black text-white">
                  {displayName[0]}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-neon-pink-soft">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-pink" />
                  AI CREATOR
                </span>
                {isVerified && (
                  <span className="rounded-pill bg-neon-cyan/15 px-2 py-0.5 text-[10px] font-black text-neon-cyan">
                    認証済み
                  </span>
                )}
                {hasReviews && (
                  <span className="inline-flex items-center gap-1 rounded-pill bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white">
                    <span className="text-neon-pink">★</span>
                    {creator.rating.toFixed(1)}
                    <span className="text-white/60">({creator.review_count})</span>
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-black sm:text-[2.5rem]">
                {displayName}
              </h1>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
                {creator.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-neon-cyan">◉</span>
                    {creator.location}
                  </span>
                )}
                {creator.years_of_experience > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-neon-purple">◆</span>
                    経験 {creator.years_of_experience} 年
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-neon-pink">✦</span>
                  作品 {creator.portfolio_items.length} 件
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-container px-6 py-12 lg:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left Column: Profile + Portfolio */}
          <div className="space-y-6 lg:col-span-2">
            {/* Profile */}
            <div className="rounded-xl border-2 border-ink/10 bg-white p-6 shadow-pop sm:p-8">
              <h2 className="text-lg font-black text-ink">
                <span className="inline-block h-2 w-2 rounded-full bg-neon-pink mr-2 align-middle" />
                プロフィール
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-[2] text-ink-muted">
                {creator.bio}
              </p>

              {creator.genres.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    得意ジャンル
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {creator.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-pill border border-neon-purple/30 bg-neon-purple/10 px-3 py-1 text-xs font-bold text-neon-purple-deep"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 強み */}
            {creator.strengths.length > 0 && (
              <div className="rounded-xl border-2 border-ink/10 bg-white p-6 shadow-pop sm:p-8">
                <h2 className="text-lg font-black text-ink">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-pink mr-2 align-middle" />
                  強み
                </h2>
                <p className="mt-1 text-xs text-ink-muted">
                  AIクリエイターの中で「この人を選ぶ理由」
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.strengths.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(255,77,157,0.35)]"
                    >
                      ✦ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 得意映像尺 */}
            {creator.video_lengths.length > 0 && (
              <div className="rounded-xl border-2 border-ink/10 bg-white p-6 shadow-pop sm:p-8">
                <h2 className="text-lg font-black text-ink">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-cyan mr-2 align-middle" />
                  得意映像尺
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.video_lengths.map((l) => (
                    <span
                      key={l}
                      className="rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1.5 text-xs font-bold text-neon-purple-deep"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {creator.portfolio_items.length > 0 && (
              <div className="rounded-xl border-2 border-ink/10 bg-white p-6 shadow-pop sm:p-8">
                <h2 className="mb-6 text-lg font-black text-ink">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-purple mr-2 align-middle" />
                  ポートフォリオ
                </h2>
                <PortfolioGrid items={creator.portfolio_items} />
              </div>
            )}

            {/* Reviews */}
            <div className="rounded-xl border-2 border-ink/10 bg-white p-6 shadow-pop sm:p-8">
              <h2 className="mb-6 text-lg font-black text-ink">
                <span className="inline-block h-2 w-2 rounded-full bg-neon-sunset mr-2 align-middle" />
                レビュー({reviews?.length ?? 0}件)
              </h2>
              <ReviewList
                reviews={(reviews ?? []) as unknown as {
                  id: string;
                  rating: number;
                  comment: string;
                  created_at: string;
                  client: { profiles: { display_name: string } };
                }[]}
              />
            </div>
          </div>

          {/* Right Column: Packages */}
          <div className="space-y-6">
            <div className="sticky top-24">
              <h2 className="mb-4 text-lg font-black text-ink">料金プラン</h2>
              <div className="space-y-4">
                {activePackages.map((pkg, index) => (
                  <div
                    key={pkg.id}
                    className={`overflow-hidden rounded-xl border-2 transition-all ${
                      index === 0
                        ? "border-neon-pink bg-neon-midnight-deep text-white shadow-[0_0_32px_rgba(255,77,157,0.3)]"
                        : "border-ink/10 bg-white shadow-pop"
                    }`}
                  >
                    {index === 0 && (
                      <div className="bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-wider text-white">
                        ⭐ もっとも人気
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className={`text-base font-black ${
                            index === 0 ? "text-white" : "text-ink"
                          }`}
                        >
                          {pkg.name}
                        </h3>
                        <p
                          className={`text-xl font-black ${
                            index === 0 ? "text-neon-pink" : "text-neon-purple-deep"
                          }`}
                        >
                          {formatPrice(pkg.price)}
                        </p>
                      </div>
                      <p
                        className={`mt-2 text-sm leading-[1.85] ${
                          index === 0 ? "text-white/70" : "text-ink-muted"
                        }`}
                      >
                        {pkg.description}
                      </p>

                      <div
                        className={`mt-4 flex gap-4 text-xs ${
                          index === 0 ? "text-white/60" : "text-ink-muted"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <span>⏱</span>
                          納期 {pkg.delivery_days}日
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span>↻</span>
                          修正 {pkg.revisions}回
                        </span>
                      </div>

                      <ul className="mt-4 space-y-2">
                        {pkg.features.map((feature) => (
                          <li
                            key={feature}
                            className={`flex items-start gap-2 text-sm ${
                              index === 0 ? "text-white/90" : "text-ink"
                            }`}
                          >
                            <span
                              className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full text-center text-[10px] font-bold leading-4 ${
                                index === 0
                                  ? "bg-neon-pink text-white"
                                  : "bg-neon-cyan text-neon-midnight-deep"
                              }`}
                            >
                              ✓
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/dashboard/orders/new?creator_id=${creator.id}&package_id=${pkg.id}`}
                        className={`mt-6 inline-flex w-full items-center justify-between gap-2 rounded-pill px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                          index === 0
                            ? "bg-neon-pink text-white shadow-[0_0_20px_rgba(255,77,157,0.5)] hover:shadow-[0_0_28px_rgba(255,77,157,0.7)]"
                            : "border-2 border-ink bg-paper text-ink hover:bg-ink hover:text-paper"
                        }`}
                      >
                        <span>このプランで依頼</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {canMessageCreator && (
                <div className="mt-6">
                  <Link
                    href={`/dashboard/messages/${creator.user_id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-pill border-2 border-ink bg-white px-5 py-3 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-white"
                  >
                    💬 メッセージを送る
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
