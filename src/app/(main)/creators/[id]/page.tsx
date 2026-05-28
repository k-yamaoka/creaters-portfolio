import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCreatorById, getCreators } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ReviewList } from "@/components/reviews/review-list";
import { SectionTabs } from "@/components/creators/section-tabs";
import { PortfolioFilterable } from "@/components/creators/portfolio-filterable";
import { ShareButton } from "@/components/creators/share-button";

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

  // ===== アクティビティ シグナル(過去90日分) =====
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  // クリエイターが受信した DM 数 (過去90日)
  const { count: receivedCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", creator.user_id)
    .gte("created_at", ninetyDaysAgo);

  // クリエイターが送信した DM 数 (過去90日)
  const { count: sentCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", creator.user_id)
    .gte("created_at", ninetyDaysAgo);

  // 最終アクティビティ(最新の送信メッセージ)
  const { data: lastMessage } = await supabase
    .from("messages")
    .select("created_at")
    .eq("sender_id", creator.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 受信に対する返信率 (粗い指標)
  const replyRate =
    receivedCount && receivedCount > 0
      ? Math.min(100, Math.round(((sentCount ?? 0) / receivedCount) * 100))
      : null;

  const lastActiveAt = lastMessage?.created_at ?? creator.updated_at;
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(lastActiveAt).getTime()) / (24 * 60 * 60 * 1000)
  );
  const activityLabel =
    daysSinceActive === 0
      ? "今日アクティブ"
      : daysSinceActive < 7
        ? `${daysSinceActive}日前にアクティブ`
        : daysSinceActive < 30
          ? `${Math.floor(daysSinceActive / 7)}週間前にアクティブ`
          : `${Math.floor(daysSinceActive / 30)}ヶ月前にアクティブ`;
  const isFresh = daysSinceActive < 7;

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

  // ===== 類似クリエイター (同ジャンル or 強み重複の他クリエイター) =====
  const allCreators = await getCreators();
  const otherCreators = allCreators.filter((c) => c.id !== creator.id);
  const similarCreators = otherCreators
    .map((c) => {
      const genreOverlap = c.genres.filter((g) =>
        creator.genres.includes(g)
      ).length;
      const strengthOverlap = c.strengths.filter((s) =>
        creator.strengths.includes(s)
      ).length;
      const toolOverlap = c.ai_tools.filter((t) =>
        creator.ai_tools.includes(t)
      ).length;
      const score = genreOverlap * 3 + strengthOverlap * 2 + toolOverlap;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .filter((x) => x.score > 0)
    .map((x) => x.c);

  const hasReviews = creator.review_count > 0;
  const minPackagePrice =
    activePackages.length > 0
      ? Math.min(...activePackages.map((p) => p.price))
      : null;
  const firstPackageId = activePackages[0]?.id;
  const orderHref = firstPackageId
    ? `/dashboard/orders/new?creator_id=${creator.id}&package_id=${firstPackageId}`
    : `/dashboard/orders/new?creator_id=${creator.id}`;
  const messageHref = viewer
    ? `/dashboard/messages/${creator.user_id}`
    : `/login?redirect=/creators/${creator.id}`;

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
          {/* Breadcrumb + Share */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <nav className="text-xs text-white/60">
              <Link href="/creators" className="hover:text-neon-pink">
                AIクリエイターを探す
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white">{displayName}</span>
            </nav>
            <ShareButton creatorName={displayName} />
          </div>

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

              {/* Activity signals */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-[11px] font-bold ${
                    isFresh
                      ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
                      : "border-white/15 bg-white/5 text-white/70"
                  }`}
                >
                  {isFresh && (
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
                  )}
                  {activityLabel}
                </span>
                {replyRate !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/80">
                    💬 返信率 {replyRate}%
                  </span>
                )}
                {receivedCount !== null && receivedCount !== undefined && (
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/70">
                    過去90日 {receivedCount}件の問い合わせ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={orderHref}
              className="group inline-flex items-center justify-between gap-3 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,77,157,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(255,77,157,0.6)]"
            >
              <span>
                💼 このクリエイターに依頼
                {minPackagePrice !== null && (
                  <span className="ml-2 text-xs font-bold text-white/80">
                    ¥{minPackagePrice.toLocaleString()}〜
                  </span>
                )}
              </span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href={messageHref}
              className="group inline-flex items-center justify-between gap-3 rounded-pill border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              <span>💬 メッセージで相談</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Section Tabs (sticky) */}
      <SectionTabs
        tabs={[
          { id: "profile", label: "プロフィール", emoji: "👤" },
          { id: "portfolio", label: "作品", emoji: "🎬" },
          { id: "pricing", label: "料金", emoji: "💰" },
          { id: "reviews", label: "レビュー", emoji: "⭐" },
        ]}
      />

      <div className="relative mx-auto max-w-container px-6 py-12 lg:px-10">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -left-32 top-32 h-[500px] w-[500px] rounded-full bg-neon-pink opacity-10 blur-[140px] animate-glow-pulse-slow" />
        <div className="pointer-events-none absolute -right-24 top-[800px] h-[420px] w-[420px] rounded-full bg-neon-cyan opacity-10 blur-[120px] animate-glow-pulse" />

        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left Column: Profile + Portfolio */}
          <div className="space-y-6 lg:col-span-2">
            {/* Profile */}
            <div
              id="profile"
              className="scroll-mt-32 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(255,77,157,0.15)] sm:p-8"
            >
              <h2 className="text-lg font-black text-white">
                <span className="inline-block h-2 w-2 rounded-full bg-neon-pink mr-2 align-middle shadow-[0_0_8px_rgba(255,77,157,0.7)]" />
                プロフィール
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-[2] text-white/70">
                {creator.bio}
              </p>

              {creator.genres.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    得意ジャンル
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {creator.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-pill border border-neon-purple/40 bg-neon-purple/15 px-3 py-1 text-xs font-bold text-neon-purple"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 使用 AI ツール */}
            {creator.ai_tools.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(157,92,255,0.15)] sm:p-8">
                <h2 className="text-lg font-black text-white">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-purple mr-2 align-middle shadow-[0_0_8px_rgba(157,92,255,0.7)]" />
                  使用 AI ツール
                </h2>
                <p className="mt-1 text-xs text-white/55">
                  Sora / Veo / Runway / Midjourney などを使いこなせます
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.ai_tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1.5 rounded-pill border border-neon-purple/40 bg-gradient-to-r from-neon-purple/15 to-neon-pink/15 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-purple shadow-[0_0_6px_rgba(157,92,255,0.8)]" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 強み */}
            {creator.strengths.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(255,77,157,0.15)] sm:p-8">
                <h2 className="text-lg font-black text-white">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-pink mr-2 align-middle shadow-[0_0_8px_rgba(255,77,157,0.7)]" />
                  強み
                </h2>
                <p className="mt-1 text-xs text-white/55">
                  AIクリエイターの中で「この人を選ぶ理由」
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.strengths.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-2 text-xs font-bold text-white shadow-[0_0_14px_rgba(255,77,157,0.45)]"
                    >
                      ✦ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 得意映像尺 */}
            {creator.video_lengths.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(77,213,247,0.15)] sm:p-8">
                <h2 className="text-lg font-black text-white">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-cyan mr-2 align-middle shadow-[0_0_8px_rgba(77,213,247,0.7)]" />
                  得意映像尺
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.video_lengths.map((l) => (
                    <span
                      key={l}
                      className="rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1.5 text-xs font-bold text-neon-cyan"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {creator.portfolio_items.length > 0 && (
              <div
                id="portfolio"
                className="scroll-mt-32 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(157,92,255,0.15)] sm:p-8"
              >
                <h2 className="mb-6 text-lg font-black text-white">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-purple mr-2 align-middle shadow-[0_0_8px_rgba(157,92,255,0.7)]" />
                  ポートフォリオ
                </h2>
                <PortfolioFilterable items={creator.portfolio_items} />
              </div>
            )}

            {/* Reviews */}
            <div
              id="reviews"
              className="scroll-mt-32 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(255,174,59,0.15)] sm:p-8"
            >
              <h2 className="mb-6 text-lg font-black text-white">
                <span className="inline-block h-2 w-2 rounded-full bg-neon-sunset mr-2 align-middle shadow-[0_0_8px_rgba(255,174,59,0.7)]" />
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
          <div id="pricing" className="scroll-mt-32 space-y-6">
            <div className="sticky top-40">
              <h2 className="mb-4 text-lg font-black text-white">
                <span className="inline-block h-2 w-2 rounded-full bg-neon-pink mr-2 align-middle shadow-[0_0_8px_rgba(255,77,157,0.7)]" />
                料金プラン
              </h2>
              <div className="space-y-4">
                {activePackages.map((pkg, index) => {
                  const isFeatured = index === 0;
                  return (
                  <div
                    key={pkg.id}
                    className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all ${
                      isFeatured
                        ? "border-neon-pink/50 bg-gradient-to-br from-neon-pink/15 to-neon-purple/15 shadow-[0_20px_50px_-10px_rgba(255,77,157,0.4)]"
                        : "border-white/10 bg-white/[0.04] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.4)]"
                    }`}
                  >
                    {isFeatured && (
                      <div className="bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-wider text-white">
                        ⭐ もっとも人気
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-black text-white">
                          {pkg.name}
                        </h3>
                        <p
                          className={`text-xl font-black ${
                            isFeatured ? "text-neon-pink" : "text-neon-cyan"
                          }`}
                        >
                          {formatPrice(pkg.price)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-[1.85] text-white/65">
                        {pkg.description}
                      </p>

                      <div className="mt-4 flex gap-4 text-xs text-white/60">
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
                            className="flex items-start gap-2 text-sm text-white/85"
                          >
                            <span
                              className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full text-center text-[10px] font-bold leading-4 ${
                                isFeatured
                                  ? "bg-neon-pink text-white shadow-[0_0_8px_rgba(255,77,157,0.7)]"
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
                          isFeatured
                            ? "bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-[0_0_20px_rgba(255,77,157,0.5)] hover:shadow-[0_0_28px_rgba(255,77,157,0.7)]"
                            : "border border-white/30 bg-white/5 text-white backdrop-blur-sm hover:border-white/60 hover:bg-white/10"
                        }`}
                      >
                        <span>このプランで依頼</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                  );
                })}
              </div>

              {canMessageCreator && (
                <div className="mt-6">
                  <Link
                    href={`/dashboard/messages/${creator.user_id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-white/30 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
                  >
                    💬 メッセージを送る
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Creators */}
      {similarCreators.length > 0 && (
        <section className="relative overflow-hidden border-t border-white/10 bg-neon-midnight py-20">
          <div className="pointer-events-none absolute -right-32 top-12 h-[400px] w-[400px] rounded-full bg-neon-purple opacity-15 blur-[120px] animate-glow-pulse-slow" />

          <div className="relative mx-auto max-w-container px-6 lg:px-10">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-neon-cyan">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
                  SIMILAR CREATORS
                </p>
                <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                  似た領域の{" "}
                  <span className="bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">
                    AIクリエイター
                  </span>
                </h2>
              </div>
              <Link
                href="/creators"
                className="group inline-flex items-center gap-2 rounded-pill border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
              >
                すべて見る
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarCreators.map((c, idx) => {
                const gradients = [
                  "linear-gradient(135deg, #ff4d9d 0%, #9d5cff 100%)",
                  "linear-gradient(135deg, #4dd5f7 0%, #2e6ca0 100%)",
                  "linear-gradient(135deg, #9d5cff 0%, #5b2dd1 100%)",
                  "linear-gradient(135deg, #ffae3b 0%, #ff4d9d 100%)",
                ];
                const tools = c.ai_tools.slice(0, 3);
                return (
                  <Link
                    key={c.id}
                    href={`/creators/${c.id}`}
                    className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-neon-pink/40 hover:shadow-[0_25px_60px_-15px_rgba(255,77,157,0.4)]"
                  >
                    <div
                      className="relative aspect-[4/3] w-full"
                      style={{
                        background: c.profiles?.avatar_url
                          ? `url(${c.profiles.avatar_url}) center/cover`
                          : gradients[idx % gradients.length],
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-neon-midnight-deep via-neon-midnight-deep/30 to-transparent" />
                      <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple px-2.5 py-0.5 text-[10px] font-black text-white shadow-[0_0_12px_rgba(255,77,157,0.6)]">
                        AI
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-base font-black text-white">
                          {c.profiles?.display_name ?? "AIクリエイター"}
                        </p>
                        {c.location && (
                          <p className="line-clamp-1 text-[11px] font-bold text-white/70">
                            {c.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {tools.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tools.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/80"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="line-clamp-2 text-xs text-white/65">
                          {c.bio || "AIクリエイター"}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Mobile sticky bottom CTA (lg 未満) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-neon-midnight-deep/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-container items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              最安料金
            </p>
            <p className="text-base font-black text-neon-pink">
              {minPackagePrice !== null
                ? `¥${minPackagePrice.toLocaleString()}〜`
                : "応相談"}
            </p>
          </div>
          <Link
            href={messageHref}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-white/30 bg-white/5 text-base text-white backdrop-blur-sm"
            aria-label="メッセージで相談"
          >
            💬
          </Link>
          <Link
            href={orderHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-5 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,77,157,0.45)]"
          >
            依頼する
            <span>→</span>
          </Link>
        </div>
      </div>
    </>
  );
}
